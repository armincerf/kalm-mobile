(ns app.handlers
  (:require
   [re-frame.core :as rf]
   [re-frame.db :as rf-db]
   ["smart-timeout" :as timeout]
   [app.db :as db]
   [reagent.core :as r]))

(def debug? ^boolean goog.DEBUG)

(def base-interceptors
  [(when debug? rf/debug)])

(defn initialize-db [_ _]
  (prn "init db")
  db/default-app-db)

(defn set-state
  [db [_ path value]]
  (assoc-in db (cons :state path) value))

(defn resume-routine
  [{:keys [db]} _]
  (let [idx (inc (get-in db [:state :current-idx]))
        routine (get-in db [:state :current-routine])]
    (if idx
      {:fx [[:dispatch [:start-routine routine idx]]]})))

(defn start-routine
  [{:keys [db]} [_ routine idx]]
  (let [routine (vec routine)
        activity (get routine idx)]
    {:db (-> db
             (assoc-in [:state :current-idx] idx)
             (assoc-in [:state :current-routine] routine)
             (assoc-in [:state :current-activity] activity)
             (assoc-in [:state :prev-activity]
                       (when (and activity
                                  (pos? idx))
                         (get routine (dec idx))))
             (assoc-in [:state :next-activity]
                       (when-let [next (get routine (inc idx))]
                         next)))
     :fx [(when-let [duration (:duration activity)]
            [:dispatch-later2
             {:ms duration
              :dispatch [:start-routine
                         routine
                         (inc idx)]}])]}))

(defn set-version
  [db [_ version]]
  (assoc db :version version))

(defn timeout-fn
  [^js timeout fn]
  (prn "doing thing" timeout fn)
  (if (and timeout (.exists timeout))
    (fn timeout)
    (rf/console :error "bad timeout passed to timeout-fn" timeout)))

(defn pause
  [{:keys [db]} [_ timeout]]
  {:fx [[:timeout-pause timeout]]
   :db (assoc-in db [:state :timeout-paused?] true)})

(defn resume
  [{:keys [db]} [_ timeout]]
  {:fx [[:timeout-resume timeout]]
   :db (assoc-in db [:state :timeout-paused?] false)})

(defn stop
  [{:keys [db]} [_ timeout]]
  {:fx [[:timeout-clear timeout]]
   :db (dissoc db :state)})

(rf/reg-fx
 :timeout-pause
 (fn [^js timeout]
   (timeout-fn timeout #(.pause timeout))))

(rf/reg-fx
 :timeout-resume
 (fn [^js timeout]
   (timeout-fn timeout #(.resume timeout))))

(rf/reg-fx
 :timeout-clear
 (fn [^js timeout]
   (timeout-fn timeout #(.clear timeout))))

(defn dispatch-later
  [{:keys [ms dispatch] :as effect}]
  (if (or (empty? dispatch) (not (number? ms)) (nil? timeout))
    (rf/console :error "re-frame: ignoring bad :dispatch-later value:" effect)
    (let [timeout-store (.instantiate timeout #(rf/dispatch dispatch) ms)]
      (rf/dispatch [:set-state [:timeout] timeout-store]))))

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
(rf/reg-event-db :initialize-db [base-interceptors] initialize-db)
(rf/reg-event-db :set-version [base-interceptors] set-version)
(rf/reg-event-fx :pause [base-interceptors] pause)
(rf/reg-event-fx :resume [base-interceptors] resume)
(rf/reg-event-fx :stop [base-interceptors] stop)
