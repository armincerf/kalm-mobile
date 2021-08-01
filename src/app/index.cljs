(ns app.index
  (:require
   ["@react-navigation/native" :as nav]
   ["react-native-safe-area-context" :refer [SafeAreaProvider]]
   ["@react-navigation/stack" :as rn-stack]
   ["expo-constants" :as expo-constants]
   ["react-native" :as rn]
   ["tailwind-rn" :default tailwind-rn]
   ["native-base" :refer [NativeBaseProvider]]
   ["react-native-portalize" :refer [Host]]
   ["react" :refer [useRef]]

   [clojure.edn :as edn]
   [applied-science.js-interop :as j]
   [reagent.core :as r]
   [re-frame.core :as rf :refer [dispatch-sync]]
   [shadow.expo :as expo]

   [app.views :as views]
   [app.components :as c]
   [app.handlers :refer [routine?]]
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

(defn screen-main [props]
  (let [{:keys [id]} (edn/read-string (.-props (.-params ^js (:route props))))
        current-activity @(rf/subscribe [:persisted-state [id :current-activity]])
        running? (not (empty? current-activity))]
    [views/routine-player props current-activity running?]))

(def stack (rn-stack/createStackNavigator))

(defn navigator [props] [:> (-> ^js stack .-Navigator) props])

(defn screen [props] [:> (-> ^js stack .-Screen) props])

(defn root []
  (let [animated (.-current (useRef (c/animated-value. 0)))
        !route-name-ref (clojure.core/atom {})
        !navigation-ref (clojure.core/atom {})
        page @(rf/subscribe [:page])
        routine (when (routine? (:name page))
                  (:props page))]
    [:> NativeBaseProvider
     [:> SafeAreaProvider
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
                                              :id)]
                                   (rf/dispatch [:save-time-left id])))
                               (when (routine? (:name page))
                                 (let [id (-> page :props :id)]
                                   (rf/dispatch [:save-time-left id])))
                               (.screen c/analytics current-route-name))
                             (swap! !route-name-ref merge {:current current-route-name})))}
       [:> Host
        ;;black view only visible when modal opens
        [:> rn/View {:style {:flex 1 :backgroundColor "#000"}}
         (let [interpolate (fn [from to] (.interpolate animated #js {:inputRange #js [0 1]
                                                                     :outputRange #js [from to]}))]
           [:> c/Layout
            {:style {:borderRadius (interpolate 0 20)
                     :transform [{:scale (interpolate 1 0.92)}]
                     :opacity (interpolate 1 0.75)}}
            [:> (.-Navigator ^js stack)
             (screen {:name "Home"
                      :options {:headerShown false}
                      :component (r/reactify-component
                                  #(views/routines % animated))})
             (screen {:name "Routine"
                      :options {:title (or (:name routine) "Routine")}
                      :component (r/reactify-component screen-main)})]])]]]]]))

(defn start
  []
  (expo/render-root (r/as-element [:f> root])))

(def version (-> expo-constants
                 (j/get :default)
                 (j/get :manifest)
                 (j/get :version)))

(defonce analytics
  nil
  #_(when-not c/web?
      (do
        (.init c/analytics "QQKB2W5GHSGT")
        "done")))

(defn init
  {:dev/after-load true}
  []
  (db/default-app-db)
  (when analytics
    (.identify c/analytics #js {:displayName (c/get-name)}))
  (dispatch-sync [:init version [my-activity
                                 random-chores
                                 lazy]])
  (start))
