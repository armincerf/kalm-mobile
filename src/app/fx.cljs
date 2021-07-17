(ns app.fx
  (:require
   [re-frame.core :refer [reg-fx]]))

(reg-fx :some-fx-example
        (fn [x]
          (tap> x)
          (println x)))
