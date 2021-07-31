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
    (let [db-from-string (try (edn/read-string (<p! (.getItem AsyncStorage "@db")))
                              (catch :default e
                                (prn e)))
          db (merge
              {:settings {}
               :version "version-not-set"}
              (when db-from-string
                {:persisted-state db-from-string}))]
      (rf/dispatch [:initialize-db db]))))
