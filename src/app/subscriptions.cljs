(ns app.subscriptions
  (:require [re-frame.core :as rf]))

(defn version [db _] (:version db))
(rf/reg-sub :version version)

(rf/reg-sub
 :state
 (fn [db [_ path]]
   (get-in db (cons :state path))))

(rf/reg-sub
 :persisted-state
 (fn [db [_ path]]
   (get-in db (cons :persisted-state path))))

(rf/reg-sub
 :page
 (fn [db _]
   (:current-page db)))

(rf/reg-sub
 :paused?
 (fn [db [_ id]]
   (let [id (or id (get-in db [:current-page :props :id]))]
     (prn "id " id)
     (some-> db
             :persisted-state
             (get id)
             :timeout-paused?))))

(rf/reg-sub
 :time-left
 (fn [db [_ id]]
   (let [id (or id (get-in db [:current-page :props :id]))]
     (some-> db
             :persisted-state
             (get id)
             :time-remaining))))
