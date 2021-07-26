(ns app.index
  (:require
   ["@react-navigation/native" :as nav]
   ["@react-navigation/stack" :as rn-stack]
   ["react-native-appearance" :refer [AppearanceProvider
                                      useColorScheme]]
   ["expo-constants" :as expo-constants]
   ["react-native" :as rn]
   ["tailwind-rn" :default tailwind-rn]
   ["native-base" :refer [NativeBaseProvider]]

   [clojure.edn :as edn]
   [applied-science.js-interop :as j]
   [reagent.core :as r]
   [re-frame.core :as rf :refer [dispatch-sync]]
   [shadow.expo :as expo]

   [app.views :as views]
   [app.components :as c]
   [app.handlers]
   [app.subscriptions]
   [app.db :as db]))

(defn tw [style-str]
  ;; https://github.com/vadimdemedes/tailwind-rn#supported-utilities
  (-> style-str
      tailwind-rn
      (js->clj :keywordize-keys true)))

(def push-ups
  {:name "Push ups"
   :description "Hold arms in good way and push in the up direction"
   :pre-activity [{:name "Get in the position"
                   :image "https://www.memecreator.org/static/images/memes/4789102.jpg"}]
   :activities [{:name "Push down"
                 :duration 2000
                 :image "https://www.wikihow.com/images/thumb/5/53/Do-a-Push-Up-Step-15-Version-3.jpg/aid11008-v4-728px-Do-a-Push-Up-Step-15-Version-3.jpg"}
                {:name "Push up"
                 :image "https://www.wikihow.com/images/thumb/9/98/Do-a-Push-Up-Step-13-Version-3.jpg/aid11008-v4-728px-Do-a-Push-Up-Step-13-Version-3.jpg"
                 :duration 1000}]
   :post-activity [{:name "Nice work! Go eat a cake"
                    :image "https://memegenerator.net/img/instances/45717809.jpg"}]})

(def jumping-jacks
  {:name "Jumping Jacks"
   :description "Jump as many times as you can"
   :activities [{:name "Jump as much as you can in the time limit, also do some jacks."
                 :duration 100000000

                 :image "https://media1.tenor.com/images/1c91aac996db1dec02eac2ddbd86ad30/tenor.gif"}]})

(def my-activity
  {:name "Morning Routine"
   :type "Meditation"
   :description "a good routine"
   :activities [{:cycle-count 5
                 :activity push-ups}
                jumping-jacks]})

(def jacks
  {:name "Jumping jacks x 5"
   :type "Fitness"
   :description "good for fitness"
   :activities [{:cycle-count 5
                 :activity jumping-jacks}]})

(def lazy
  {:name "Get ready for bed"
   :type "Chores"
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
   :activities (vec (shuffle chores))})

(defn gen-routine
  [root-activity]
  (def root-activity root-activity)
  (let [gen-cycles
        (fn [activities cycle-count]
          (for [cycle (range cycle-count)]
            (map
             #(assoc % :cycle-idx (inc cycle) :total-cycles cycle-count)
             activities)))
        gen-activity
        (fn [props]
          (let [activity? (some? (:name props))
                activity (if activity?
                           props
                           (:activity props))
                activities (if (:duration props)
                             [props]
                             (:activities activity))
                cycle-count (:cycle-count props)]
            (concat
             (:pre-activity activity)
             (gen-cycles activities (or cycle-count 1))
             (:post-activity activity))))
        gen-activities (fn [activities]
                         (for [props activities]
                           (gen-activity props)))
        activities
        (remove nil? (flatten (gen-activities (:activities root-activity))))
        total-time (reduce
                    (fn [count activity]
                      (+ count (:duration activity)))
                    0
                    activities)]
    (assoc root-activity
           :activities activities
           :total-time total-time)))

(defn screen-add-routine [_props]
  [:> c/AddRoutine {:handleSubmit #(rf/dispatch [:add-routine %])}])

(defn screen-home [{:keys [navigation] :as props}]
  (let [saved-routines @(rf/subscribe [:persisted-state [:my-routines]])
        routines (mapv gen-routine (concat
                                    saved-routines
                                    [my-activity
                                     random-chores
                                     lazy]))]
    [:<>
     [:> c/AddRoutineButton {:handleClick #(rf/dispatch [:navigate navigation "AddRoutine"])}]
     [views/routines props routines]]))

(defn screen-main [props]
  (let [{:keys [name]} (edn/read-string (.-props (.-params ^js (:route props))))
        current-activity @(rf/subscribe [:persisted-state [name :current-activity]])
        running? (not (empty? current-activity))]
    [views/routine-player props current-activity running?]))

(def stack (rn-stack/createStackNavigator))

(defn navigator [] (-> stack (j/get :Navigator)))

(defn screen [props] [:> (-> stack (j/get :Screen)) props])

(defn root []
  (let [!route-name-ref (clojure.core/atom {})
        !navigation-ref (clojure.core/atom {})]
    [:> AppearanceProvider
     (let [page @(rf/subscribe [:page])
           routine? (fn [page] (= "Routine" page))
           routine (when (routine? (:name page))
                     (:props page))]
       [:> NativeBaseProvider
        [:> nav/NavigationContainer
         {:ref (fn [el] (reset! !navigation-ref el))
          :on-ready (fn []
                      (swap! !route-name-ref merge
                             {:current (-> @!navigation-ref
                                           (j/call :getCurrentRoute)
                                           (j/get :name))}))
          :on-state-change (fn []
                             (let [prev-route-name (-> @!route-name-ref :current)
                                   current-route-name (-> @!navigation-ref
                                                          (j/call :getCurrentRoute)
                                                          (j/get :name))]
                               (when (not= prev-route-name current-route-name)
                                 ;; This is where you can do side effecty things like analytics
                                 (when (routine? current-route-name)
                                   (let [id (-> @!navigation-ref
                                                (j/call :getCurrentRoute)
                                                (j/get-in [:params :props])
                                                (edn/read-string)
                                                :name)]
                                     (rf/dispatch [:save-time-left id])))
                                 (when (routine? (:name page))
                                   (let [id (-> page :props :name)]
                                     (rf/dispatch [:save-time-left id])))
                                 (rf/dispatch [:set-state [:route] (str "New screen encountered " current-route-name)]))
                               (swap! !route-name-ref merge {:current current-route-name})))}

         [:> (navigator)
          (screen {:name "Home"
                   :component (r/reactify-component screen-home)})
          (screen {:name "AddRoutine"
                   :component (r/reactify-component screen-add-routine)})
          (screen {:name "Routine"
                   :options {:title (or (:name routine) "Routine")}
                   :component (r/reactify-component screen-main)})]]])]))

(defn start
  []
  (expo/render-root (r/as-element [:f> root])))

(def version (-> expo-constants
                 (j/get :default)
                 (j/get :manifest)
                 (j/get :version)))

(defn init
  {:dev/after-load true}
  []
  (db/default-app-db)
  (dispatch-sync [:set-version version])
  (start))
