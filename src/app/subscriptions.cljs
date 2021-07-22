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
 :paused?
 (fn [db _]
   (some-> db
           :state
           :timeout-paused?)))
