(ns app.subscriptions
  (:require [re-frame.core :refer [reg-sub]]
            ["react-native-appearance" :refer [Appearance]]
            [com.rpl.specter :as sp :refer [select-one!]]))

(defn version [db _]
  (->> db
       (select-one! [:version])))

(reg-sub :version version)

(reg-sub
 :state
 (fn [db [_ path]]
   (get-in db (cons :state path))))
