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

(defn start-routine
  [{:keys [db]} [_ routine idx]]
  (let [activity (get (vec routine) idx)]
    {:db (assoc-in db [:state :current-activity]
                   activity)
     :fx [(when activity
            [:dispatch-later
             {:ms (:duration activity)
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
(rf/reg-event-db :set-state [base-interceptors] set-state)
(rf/reg-event-db :initialize-db [base-interceptors] initialize-db)
(rf/reg-event-db :set-version [base-interceptors] set-version)
(rf/reg-event-fx :some-fx-example [base-interceptors] some-fx-example)
