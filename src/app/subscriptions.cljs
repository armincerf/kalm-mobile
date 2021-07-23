(ns app.subscriptions
  (:require [re-frame.core :as rf]
            ["react-native-appearance" :refer [Appearance]]))

(defn version [db _] (:version db))
(rf/reg-sub :version version)

(rf/reg-sub
 :state
 (fn [db [_ path]]
   (get-in db (cons :state path))))

(rf/reg-sub
 :page
 (fn [db _]
   (:current-page db)))

(rf/reg-sub
 :paused?
 (fn [db [_ name]]
   (let [id (or name (get-in db [:current-page :props :name]))]
     (some-> db
             :state
             (get id)
             :timeout-paused?))))

(rf/reg-sub
 :time-left
 (fn [db [_ name]]
   (let [id (or name (get-in db [:current-page :props :name]))]
     (some-> db
             :state
             (get id)
             :time-remaining))))
