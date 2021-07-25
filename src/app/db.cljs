(ns app.db
  (:require
   ["@react-native-async-storage/async-storage" :default AsyncStorage]
   [cljs.core.async :refer [go]]
   [cljs.core.async.interop :refer-macros [<p!]]
   [clojure.edn :as edn]
   [re-frame.core :as rf]))

(defn default-app-db
  []
  (go
    (let [db-string (<p! (.getItem AsyncStorage "@db"))
          db (if db-string
               (edn/read-string db-string)
               {:settings {}
                :version "version-not-set"})]
      (prn "init db = " db)
      (rf/dispatch [:initialize-db db]))))
