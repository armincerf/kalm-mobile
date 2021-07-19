(ns app.specs
  (:require [spec-tools.data-spec :as ds]
            [clojure.spec.alpha :as s]))

(def db
  {:settings {}
   :version  string?})

(def db-spec
  (ds/spec
   {:name ::db
    :spec db}))

(comment
  (s/valid? db-spec {:settings {}
                     :version "1"}))
