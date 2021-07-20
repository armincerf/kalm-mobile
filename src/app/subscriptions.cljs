(ns app.subscriptions
  (:require [re-frame.core :as rf]
            ["react-native-appearance" :refer [Appearance]]
            [com.rpl.specter :as sp :refer [select-one!]]))

(defn version [db _]
  (->> db
       (select-one! [:version])))

(rf/reg-sub :version version)

(rf/reg-sub
 :state
 (fn [db [_ path]]
   (get-in db (cons :state path))))
