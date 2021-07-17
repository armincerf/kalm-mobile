(ns app.db
  (:require
   [clojure.spec.alpha :as s]
   [spec-tools.data-spec :as ds]))

(def app-db-spec
  (ds/spec {:spec {:settings {:theme (s/spec #{:light :dark})}
                   :version  string?}
            :name ::app-db}))

(def default-app-db
  {:settings {:theme :dark}
   :version  "version-not-set"})
