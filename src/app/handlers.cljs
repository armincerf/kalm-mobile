(ns app.handlers
  (:require
   [re-frame.core :as rf]
   [lambdaisland.fetch :as fetch]
   [re-frame.db :as rf-db]
   ["smart-timeout" :as timeout]
   ["@react-native-async-storage/async-storage" :default AsyncStorage]
   [app.db :as db]
   [app.components :as c]
   [reagent.core :as r]))

(def debug? ^boolean goog.DEBUG)

(goog-define GIPHY false)

(defn store-key
  [key value-str]
  (.setItem AsyncStorage key value-str))

(def persist-db
  (rf/->interceptor
   :id :persist-db
   :before (fn [context]
             context)
   :after (fn [context]
            (when-let [value (get-in context
                                     [:effects :db :persisted-state])]
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
  (let [idx (inc (get-in db [:persisted-state id :current-idx]))
        routine (get-in db [:persisted-state id :current-routine])]
    (if (and idx routine)
      {:fx [[:dispatch [:start-routine routine idx]]]}
      (rf/console :error "No routine to resume" id idx routine))))

(defn start-routine
  [{:keys [db]} [_ {:keys [name]} idx]]
  (let [routine (get-in db [:persisted-state name :current-routine])
        activities (vec (:activities routine))
        routine-id (:name routine)
        activity (get activities idx)]
    {:db (-> db
             (assoc-in [:persisted-state routine-id :current-idx] idx)
             (assoc-in [:persisted-state routine-id :current-activity] activity)
             (assoc-in [:persisted-state routine-id :time-remaining] (:duration activity))
             (assoc-in [:persisted-state routine-id :prev-activity]
                       (when (and activity
                                  (pos? idx))
                         (get activities (dec idx))))
             (assoc-in [:persisted-state routine-id :next-activity]
                       (when-let [next (get activities (inc idx))]
                         next)))
     :fx [(when-not (:disableNotifications activity)
            [:send-notification! {:activity activity
                                  :routine routine
                                  :index idx}])
          (when-let [duration (:duration activity)]
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
   :db (assoc-in db [:persisted-state key :timeout-paused?] true)})

(defn save-time-left
  [{:keys [db]} [_ key]]
  {:db (assoc-in db [:persisted-state key :time-remaining]
                 (.remaining timeout key))})

(defn resume
  [{:keys [db]} [_ key]]
  {:fx [[:timeout-resume key]]
   :db (assoc-in db [:persisted-state key :timeout-paused?] nil)})

(defn stop
  [{:keys [db]} [_ key]]
  {:fx [[:timeout-clear key]]
   :db (update db :persisted-state dissoc key)})

(defn fetch-image
  [name]
  (when GIPHY
    (fetch/get "https://api.giphy.com/v1/gifs/search"
               {:query-params
                {:api_key GIPHY
                 :q name
                 :limit 25
                 :offset 0
                 :rating "g"
                 :lang "en"}})))

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

(rf/reg-fx
 :send-notification!
 (fn [data]
   (c/send-notification (clj->js data))))

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
        parse-routines
        (fn [routines]
          (->> routines
               (remove
                (fn invalid-routine
                  [{:keys [name]}]
                  (empty? name)))
               (mapv
                (fn process-routine
                  [{:keys [duration] :as routine}]
                  (let [{:keys [hours minutes seconds]} duration
                        parse (fn [t] (if (seq (str t)) (long t) 0))
                        hourSecs (* (parse hours) 3600)
                        minSecs (* (parse minutes) 60)
                        processed-duration (* (+ (parse seconds)
                                                 minSecs hourSecs)
                                              1000)]
                    (assoc routine
                           :duration
                           (if (pos? processed-duration)
                             processed-duration
                             false)))))))
        routine {:name (:routineName data)
                 :type "My Routines"
                 :activities (parse-routines (:routines data))}]
    {:db (update-in db [:persisted-state :my-routines] conj routine)
     :fx [[:navigate! [(:navigation db) "Home"]]]}))

(defn routine? [page] (= "Routine" page))

(defn navigate
  [{:keys [db]} [_ navigation route props]]
  (let [db
        (if (routine? route)
          (assoc-in db [:persisted-state (:name props) :current-routine] props)
          db)]
    {:fx [[:navigate! [navigation route props]]]
     :db (assoc db
                :current-page {:name route
                               :props props}
                :navigation navigation)}))

(defn update-activity
  [{:keys [db]} [_ activity index]]
  {:db (update-in db [:persisted-state
                      (get-in db [:current-page :props :name])
                      :current-routine
                      :activities
                      index] merge activity)})

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
(rf/reg-event-fx :update-activity [base-interceptors] update-activity)
(rf/reg-event-db :wipe-db [base-interceptors] (fn [_ _] {:persisted-state {}}))
