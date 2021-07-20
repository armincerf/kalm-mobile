(ns app.handlers
  (:require
   [re-frame.core :as rf]
   [com.rpl.specter :as sp :refer [setval]]
   [clojure.spec.alpha :as s]
   [app.db :as db]))

(def debug? ^boolean goog.DEBUG)

(defn check-and-throw
  "Throw an exception if db doesn't have a valid spec."
  [spec db event]
  (when-not (s/valid? spec db)
    (tap> event)
    (let [explanation (s/explain-str spec db)
          message (str "Spec check failed: " explanation)]
      (throw message)
      true)))

(defn validate-spec [context]
  (let [db (-> context :effects :db)
        old-db (-> context :coeffects :db)
        event (-> context :coeffects :event)]

    (if (some? (check-and-throw db/app-db-spec db event))
      (assoc-in context [:effects :db] old-db)
      ;; put the old db back as the new db when check fails
      ;; otherwise return context unchanged
      context)))

(def spec-validation
  (if debug?
    (rf/->interceptor
     :id :spec-validation
     :after validate-spec)
    rf/->interceptor))

(def base-interceptors
  [(when debug? rf/debug)
   spec-validation])

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
            [:dispatch-later
             {:ms duration
              :dispatch [:start-routine
                         routine
                         (inc idx)]}])]}))

(defn set-version
  [db [_ version]]
  (->> db
       (setval [:version] version)))

(defn some-fx-example
  [cofx [_ x]]
  {:db (:db cofx)
   :some-fx-example x})

(rf/reg-event-fx :start-routine [base-interceptors] start-routine)
(rf/reg-event-fx :resume-routine  resume-routine)
(rf/reg-event-db :set-state [base-interceptors] set-state)
(rf/reg-event-db :initialize-db [base-interceptors] initialize-db)
(rf/reg-event-db :set-version [base-interceptors] set-version)
(rf/reg-event-fx :some-fx-example [base-interceptors] some-fx-example)
