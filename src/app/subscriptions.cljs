(ns app.subscriptions
  (:require [re-frame.core :refer [reg-sub]]
            [com.rpl.specter :as sp :refer [select-one!]]))

(defn version [db _]
  (->> db
       (select-one! [:version])))

(defn theme [db _]
  (->> db
       (select-one! [:settings :theme])))

(reg-sub :version version)
(reg-sub :theme theme)

(reg-sub
 :state
 (fn [db [_ path]]
   (get-in db (cons :state path))))
