(ns app.db
  (:require
   [app.specs :as specs]
   [spec-tools.data-spec :as ds]))

(def app-db-spec
  (ds/spec {:spec specs/db-spec
            :name ::app-db}))

(def default-app-db
  {:settings {}
   :version  "version-not-set"})
