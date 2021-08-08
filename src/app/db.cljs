(ns app.db
  (:require
   ["@react-native-async-storage/async-storage" :default AsyncStorage]
   [cljs.core.async :refer [go]]
   [cljs.core.async.interop :refer-macros [<p!]]
   [clojure.edn :as edn]
   [re-frame.core :as rf]
   [app.components :as c]
   [potpuri.core :as p]))

(defn mins->obj
  [min]
  {:minutes min
   :seconds 0})

(def push-ups
  {:name "Push ups"
   :description "Hold arms in good way and push in the up direction"
   :pre-activity [{:name "Get in the position"
                   :image {:still "https://www.memecreator.org/static/images/memes/4789102.jpg"}}]
   :activities [{:name "Push down"
                 :durationObj {:seconds 2}
                 :image {:still "https://www.wikihow.com/images/thumb/5/53/Do-a-Push-Up-Step-15-Version-3.jpg/aid11008-v4-728px-Do-a-Push-Up-Step-15-Version-3.jpg"}}
                {:name "Push up"
                 :image {:still "https://www.wikihow.com/images/thumb/9/98/Do-a-Push-Up-Step-13-Version-3.jpg/aid11008-v4-728px-Do-a-Push-Up-Step-13-Version-3.jpg"}
                 :durationObj {:seconds 1}}]
   :post-activity [{:name "Nice work! Go eat a cake"
                    :image {:still "https://memegenerator.net/img/instances/45717809.jpg"}}]})

(def jumping-jacks
  {:name "Jumping Jacks"
   :description "Jump as many times as you can"
   :activities [{:name "Jump as much as you can in the time limit, also do some jacks."
                 :durationObj {:hours 10 :minutes 10 :seconds 10}

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

(def shopping
  {:name "Go Shopping"
   :type "Daily Routines"
   :id "Shopping"
   :description "Don't buy any sweets"
   :activities [{:name "Go to shops"
                 :durationObj {:minutes 5}}
                {:name "Blueberries"}
                {:name "Raspberries"}
                {:name "Any other fruit that looks good"}
                {:name "Chicken"}
                {:name "Yogurts"}
                {:name "Bread"}
                {:name "hot stuff"}
                {:name "Pay up and go for a walk"
                 :durationObj {:minutes 10}}
                {:name "Start heading home"}]})

(def lunch-time
  {:name "Lunch time"
   :type "Daily Routines"
   :id "lunch"
   :activities [{:name "Make some food"
                 :description "Healthy or else"
                 :durationObj {:minutes 10}}
                {:name "sit outside and eat"
                 :durationObj {:minutes 10}}
                {:name "Feed fish"}]})

(def music
  {:name "Music practice"
   :type "Daily Routines"
   :id "music"
   :activities [{:name "Pick a random instrument"}
                {:name "Get setup and ready"
                 :durationObj {:minutes 3}}
                {:name "Practice scales"
                 :durationObj {:minutes 5}}
                {:name "Practice arpeggios"
                 :durationObj {:minutes 5}}
                {:name "Choose a song to play through"
                 :durationObj {:minutes 20}}]})

(def lazy
  {:name "Get ready for bed"
   :type "Chores"
   :id "3"
   :description "do this or you won't sleep"
   :activities [{:name "Brush Teeth"
                 :description "Hold brush and hit teeth with it"
                 :pre-activity [{:name "Get in the position"
                                 :durationObj {:seconds 3}}]
                 :activities [{:name "brush upper left"
                               :durationObj {:seconds 30}}
                              {:name "brush upper right"
                               :durationObj {:seconds 30}}
                              {:name "brush lower left"
                               :durationObj {:seconds 30}}

                              {:name "brush lower right"
                               :durationObj {:seconds 30}}
                              ]
                 :post-activity [{:name "Rinse mouth"}]}
                {:name "shower"
                 :description "get water on you"
                 :activities [{:name "have shower"}]}
                {:name "bed"
                 :description "get into bed and close eyes"
                 :activities [{:name "go to sleep"}]}]})

(def chores
  [{:name "Hoover"
    :durationObj (mins->obj 15)}
   {:name "Sort through files (post/paperwork etc)"
    :durationObj (mins->obj 5)}
   {:name "Clean up rubbish"
    :durationObj (mins->obj 10)}
   {:name "Put on a wash"
    :durationObj (mins->obj 5)}
   {:name "Put Clothes Away"
    :durationObj (mins->obj 10)}
   {:name "Do the dusting"
    :durationObj (mins->obj 15)}
   {:name "Wipe the surfaces"
    :durationObj (mins->obj 10)}
   {:name "Change the bedclothes"
    :durationObj (mins->obj 10)}
   {:name "Clean the bathroom"
    :durationObj (mins->obj 30)}
   {:name "Clean the kitchen"
    :durationObj (mins->obj 20)}])

(def random-chores
  {:name "Random Chores"
   :type "Chores"
   :id "4"
   :hasGif true
   :activities (vec (shuffle chores))})

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

(defn routine-by-id
  [db id]
  (p/find-first (get-in db [:persisted-state :my-routines]) {:id id}))

(defn routine-id->index
  [db id]
  (p/find-index (get-in db [:persisted-state :my-routines]) {:id id}))

(defn gen-routine
  [root-activity]
  (let [gen-cycles
        (fn [activities cycle-count]
          (for [cycle (range cycle-count)]
            (map
             #(assoc % :cycleIdx (inc cycle) :total-cycles cycle-count)
             activities)))
        gen-activity
        (fn [props]
          (let [activity? (some? (:name props))
                activity (if activity?
                           props
                           (:activity props))
                activities (or
                            (:activities activity)
                            [props])
                cycle-count (:cycleCount activity)]
            (concat
             (:pre-activity activity)
             (gen-cycles activities (or cycle-count 1))
             (:post-activity activity))))
        gen-activities (fn [activities]
                         (for [props activities]
                           (gen-activity props)))
        add-duration (fn [{:keys [durationObj] :as activity}]
                       (if durationObj
                         (assoc activity :duration
                                (+ (* (:hours durationObj) 60 60 1000)
                                   (* (:minutes durationObj) 60 1000)
                                   (* (:seconds durationObj) 1000)))
                         activity))
        add-image (fn [{:keys [image] :as activity}]
                    (if image
                      activity
                      (assoc activity :hasGif true)))
        activities
        (->> root-activity
             :activities
             gen-activities
             flatten
             (remove nil?)
             (map add-image)
             (mapv add-duration))
        total-time (reduce
                    (fn [count activity]
                      (+ count (:duration activity)))
                    0
                    activities)]
    (assoc root-activity
           :activities (vec activities)
           :total-time total-time)))

(defn default-app-db
  []
  (go
    (let [db-from-string (try (edn/read-string (<p! (.getItem AsyncStorage "@db")))
                              (catch :default e
                                (js/alert "error reading db" e)))
          db (p/deep-merge
              {:settings {}
               :persisted-state {:active-routines #{}}
               :version "version-not-set"}
              (when db-from-string
                {:persisted-state db-from-string}))
          default-routines (mapv gen-routine [random-chores
                                              jumping-jacks
                                              shopping
                                              lunch-time
                                              music
                                              my-activity
                                              push-ups
                                              lazy])
          routines-plus-defaults
          (distinct-by :id (concat (:my-routines db-from-string) default-routines))
          with-default-routines
          (assoc-in db [:persisted-state :my-routines] (vec routines-plus-defaults))]
      (when-not c/web?
        (c/register-notifications))
      (rf/dispatch [:initialize-db with-default-routines]))))
