(ns app.handlers
  (:require
   [re-frame.core :as rf]
   [re-frame.db :as rf-db]
   ["smart-timeout" :as timeout]
   ["@react-native-async-storage/async-storage" :default AsyncStorage]
   [app.db :as db]
   [reagent.core :as r]))

(def debug? ^boolean goog.DEBUG)

(defn store-key
  [key value-str]
  (.setItem AsyncStorage key value-str))

(def persist-db
  (rf/->interceptor
   :id :persist-db
   :before (fn [context]
             context)
   :after (fn [context]
            (when-let [value (get-in context [:effects :db])]
              (store-key "@db" (prn-str value)))
            context)))

(def base-interceptors
  [(when debug? rf/debug)
   persist-db])

(defn initialize-db [_ [_ db]]
  db)

(defn set-state
  [db [_ path value]]
  (assoc-in db (cons :state path) value))

(defn resume-routine
  [{:keys [db]} [_ id]]
  (let [idx (inc (get-in db [:state id :current-idx]))
        routine (get-in db [:state id :current-routine])]
    (if (and idx routine)
      {:fx [[:dispatch [:start-routine routine idx]]]}
      (rf/console :error "No routine to resume" id idx routine))))

(defn start-routine
  [{:keys [db]} [_ routine idx]]
  (let [activities (vec (:activities routine))
        routine-id (:name routine)
        activity (get activities idx)]
    {:db (-> db
             (assoc-in [:state routine-id :current-idx] idx)
             (assoc-in [:state routine-id :current-routine] routine)
             (assoc-in [:state routine-id :current-activity] activity)
             (assoc-in [:state routine-id :time-remaining] (:duration activity))
             (assoc-in [:state routine-id :prev-activity]
                       (when (and activity
                                  (pos? idx))
                         (get activities (dec idx))))
             (assoc-in [:state routine-id :next-activity]
                       (when-let [next (get activities (inc idx))]
                         next)))
     :fx [(when-let [duration (:duration activity)]
            [:dispatch-later2
             {:ms duration
              :key routine-id
              :dispatch [:start-routine
                         routine
                         (inc idx)]}])]}))



(defn set-version
  [db [_ version]]
  (assoc db :version version))

(defn timeout-fn
  [key fn]
  (prn "doing thing" key fn)
  (if (and key (.exists timeout key))
    (fn key)
    (rf/console :error "bad timeout passed to timeout-fn" key fn)))

(defn pause
  [{:keys [db]} [_ key]]
  {:fx [[:timeout-pause key]
        [:dispatch [:save-time-left key]]]
   :db (assoc-in db [:state key :timeout-paused?] true)})

(defn save-time-left
  [{:keys [db]} [_ key]]
  {:db (assoc-in db [:state key :time-remaining]
                 (.remaining timeout key))})

(defn resume
  [{:keys [db]} [_ key]]
  {:fx [[:timeout-resume key]]
   :db (assoc-in db [:state key :timeout-paused?] nil)})

(defn stop
  [{:keys [db]} [_ key]]
  {:fx [[:timeout-clear key]]
   :db (update db :state dissoc key)})


(rf/reg-fx
 :timeout-pause
 (fn [key]
   (timeout-fn key #(.pause timeout %))))

(rf/reg-fx
 :timeout-resume
 (fn [key]
   (timeout-fn key #(.resume timeout %))))

(rf/reg-fx
 :timeout-clear
 (fn [key]
   (timeout-fn key #(.clear timeout %))))

(defn dispatch-later
  [{:keys [ms dispatch key] :as effect}]
  (if (or (empty? dispatch)
          (not (number? ms))
          (nil? timeout)
          (nil? key))
    (rf/console
     :error
     "re-frame: ignoring bad :dispatch-later value:" effect)
    (.set timeout key #(rf/dispatch dispatch) ms)))

(defn add-routine
  [{:keys [db]} [_ form-data]]
  (let [data (js->clj form-data :keywordize-keys true)
        routine {:name (:name data)
                 :type "My Routines"
                 :activities (mapv (fn [{:keys [duration]
                                         :as activity}]
                                     (assoc activity
                                            :duration
                                            (* 1000 duration)))
                                   [data])}]
    {:db (update-in db [:state :my-routines] conj routine)
     :fx [[:navigate! [(:navigation db) "Home"]]]}))

(defn navigate
  [{:keys [db]} [_ navigation route props]]
  {:fx [[:navigate! [navigation route props]]]
   :db (assoc db
              :current-page {:name route
                             :props props}
              :navigation navigation)})

(rf/reg-fx
 :navigate!
 (fn [[navigation route props]]
   (.navigate navigation route #js {:props (prn-str props)})))

(rf/reg-fx
 :dispatch-later2
 (fn [value]
   (if (map? value)
     (dispatch-later value)
     (doseq [effect (remove nil? value)]
       (dispatch-later effect)))))


(rf/reg-event-fx :start-routine [base-interceptors] start-routine)
(rf/reg-event-fx :resume-routine  resume-routine)
(rf/reg-event-db :set-state [base-interceptors] set-state)
(rf/reg-event-db :initialize-db initialize-db)
(rf/reg-event-db :set-version set-version)
(rf/reg-event-fx :pause [base-interceptors] pause)
(rf/reg-event-fx :save-time-left [base-interceptors] save-time-left)
(rf/reg-event-fx :resume [base-interceptors] resume)
(rf/reg-event-fx :stop [base-interceptors] stop)
(rf/reg-event-fx :navigate [base-interceptors] navigate)
(rf/reg-event-fx :add-routine [base-interceptors] add-routine)

(rf/reg-event-db :wipe-db [base-interceptors] (fn [_ _] {}))
