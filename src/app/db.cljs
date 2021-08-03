(ns app.db
  (:require
   ["@react-native-async-storage/async-storage" :default AsyncStorage]
   [cljs.core.async :refer [go]]
   [cljs.core.async.interop :refer-macros [<p!]]
   [clojure.edn :as edn]
   [re-frame.core :as rf]
   [potpuri.core :as p]))

(def push-ups
  {:name "Push ups"
   :description "Hold arms in good way and push in the up direction"
   :pre-activity [{:name "Get in the position"
                   :image {:still "https://www.memecreator.org/static/images/memes/4789102.jpg"}}]
   :activities [{:name "Push down"
                 :duration 2000
                 :image {:still "https://www.wikihow.com/images/thumb/5/53/Do-a-Push-Up-Step-15-Version-3.jpg/aid11008-v4-728px-Do-a-Push-Up-Step-15-Version-3.jpg"}}
                {:name "Push up"
                 :image {:still "https://www.wikihow.com/images/thumb/9/98/Do-a-Push-Up-Step-13-Version-3.jpg/aid11008-v4-728px-Do-a-Push-Up-Step-13-Version-3.jpg"}
                 :duration 1000}]
   :post-activity [{:name "Nice work! Go eat a cake"
                    :image {:still "https://memegenerator.net/img/instances/45717809.jpg"}}]})

(def jumping-jacks
  {:name "Jumping Jacks"
   :description "Jump as many times as you can"
   :activities [{:name "Jump as much as you can in the time limit, also do some jacks."
                 :duration 100000000

                 :image {:still "https://media1.tenor.com/images/1c91aac996db1dec02eac2ddbd86ad30/tenor.gif"}}]})

(def my-activity
  {:name "Morning Routine"
   :id "1"
   :type "Meditation"
   :description "a good routine"
   :activities [{:cycle-count 5
                 :activity push-ups}
                jumping-jacks]})

(def jacks
  {:name "Jumping jacks x 5"
   :type "Fitness"
   :id "2"
   :description "good for fitness"
   :activities [{:cycle-count 5
                 :activity jumping-jacks}]})

(def lazy
  {:name "Get ready for bed"
   :type "Chores"
   :id "3"
   :description "do this or you won't sleep"
   :activities [{:name "Brush Teeth"
                 :description "Hold brush and hit teeth with it"
                 :pre-activity [{:name "Get in the position"
                                 :duration 3000}]
                 :activities [{:name "brush upper left"
                               :duration 30000}
                              {:name "brush upper right"
                               :duration 30000}
                              {:name "brush lower left"
                               :duration 30000}
                              {:name "brush lower right"
                               :duration 30000}]
                 :post-activity [{:name "Rinse mouth"}]}
                {:name "shower"
                 :description "get water on you"
                 :activities [{:name "have shower"}]}
                {:name "bed"
                 :description "get into bed and close eyes"
                 :activities [{:name "go to sleep"}]}]})

(defn mins->millis
  [min]
  (* min 60 1000))

(def chores
  [{:name "Hoover"
    :duration (mins->millis 15)}
   {:name "Sort through files (post/paperwork etc)"
    :duration (mins->millis 5)}
   {:name "Clean up rubbish"
    :duration (mins->millis 10)}
   {:name "Put on a wash"
    :duration (mins->millis 5)}
   {:name "Put Clothes Away"
    :duration (mins->millis 10)}
   {:name "Do the dusting"
    :duration (mins->millis 15)}
   {:name "Wipe the surfaces"
    :duration (mins->millis 10)}
   {:name "Change the bedclothes"
    :duration (mins->millis 10)}
   {:name "Clean the bathroom"
    :duration (mins->millis 30)}
   {:name "Clean the kitchen"
    :duration (mins->millis 20)}])

(def random-chores
  {:name "Random Chores"
   :type "Chores"
   :id "4"
   :hasGif true
   :activities (vec (shuffle (map (fn [c] (assoc c :hasGif true)) chores)))})

;; from medley but cba to import it
(defn distinct-by
  "Returns a lazy sequence of the elements of coll, removing any elements that
  return duplicate values when passed to a function f."
  ([f]
   (fn [rf]
     (let [seen (volatile! #{})]
       (fn
         ([] (rf))
         ([result] (rf result))
         ([result x]
          (let [fx (f x)]
            (if (contains? @seen fx)
              result
              (do (vswap! seen conj fx)
                  (rf result x)))))))))
  ([f coll]
   (let [step (fn step [xs seen]
                (lazy-seq
                 ((fn [[x :as xs] seen]
                    (when-let [s (seq xs)]
                      (let [fx (f x)]
                        (if (contains? seen fx)
                          (recur (rest s) seen)
                          (cons x (step (rest s) (conj seen fx)))))))
                  xs seen)))]
     (step coll #{}))))

(defn default-app-db
  []
  (go
    (let [db-from-string (try (edn/read-string (<p! (.getItem AsyncStorage "@db")))
                              (catch :default e
                                (js/alert "error reading db" e)))
          db (merge
              {:settings {}
               :version "version-not-set"}
              (when db-from-string
                {:persisted-state db-from-string}))
          default-routines [my-activity
                            random-chores
                            lazy]
          routines-plus-defaults
          (distinct-by :id (concat (:my-routines db-from-string) default-routines))
          with-default-routines
          (assoc-in db [:persisted-state :my-routines] routines-plus-defaults)]
      (rf/dispatch [:initialize-db with-default-routines]))))
