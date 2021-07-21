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

   [applied-science.js-interop :as j]
   [reagent.core :as r]
   [re-frame.core :as rf :refer [dispatch-sync]]
   [shadow.expo :as expo]

   [app.views :as views]
   [app.fx]
   [app.handlers]
   [app.subscriptions]))

(defn tw [style-str]
  ;; https://github.com/vadimdemedes/tailwind-rn#supported-utilities
  (-> style-str
      tailwind-rn
      (js->clj :keywordize-keys true)))

;; must use defonce and must refresh full app so metro can fill these in
;; at live-reload time `require` does not exist and will cause errors
;; must use path relative to :output-dir
(defonce splash-img (js/require "../assets/shadow-cljs.png"))

(def push-ups
  {:name "Push ups"
   :description "Hold arms in good way and push in the up direction"
   :pre-activity [{:title "Get in the position"
                   :image "https://www.memecreator.org/static/images/memes/4789102.jpg"
                   :duration 3000}]
   :activities [{:title "Push down"
                 :duration 2000
                 :image "https://www.wikihow.com/images/thumb/5/53/Do-a-Push-Up-Step-15-Version-3.jpg/aid11008-v4-728px-Do-a-Push-Up-Step-15-Version-3.jpg"}
                {:title "Push up"
                 :image "https://www.wikihow.com/images/thumb/9/98/Do-a-Push-Up-Step-13-Version-3.jpg/aid11008-v4-728px-Do-a-Push-Up-Step-13-Version-3.jpg"
                 :duration 2000}]
   :post-activity [{:title "Nice work! Go eat a cake"
                    :image "https://memegenerator.net/img/instances/45717809.jpg"}]})

(def jumping-jacks
  {:name "Jumping Jacks"
   :description "Jump as many times as you can"
   :activities [{:title "Jump as much as you can in the time limit, also do some jacks."
                 :duration 100000000

                 :image "https://media1.tenor.com/images/1c91aac996db1dec02eac2ddbd86ad30/tenor.gif"}]})

(def my-activity
  {:name "Morning Routine"
   :description "a good routine"
   :activities [{:cycle-count 2
                 :activity push-ups}
                {:activity jumping-jacks}]})

(defn gen-routine
  [root-activity]
  (let [activities
        (remove
         nil?
         (flatten
          (for [{:keys [activity cycle-count]}
                (:activities root-activity)]
            (concat
             (:pre-activity activity)
             (for [cycle (range (or cycle-count 1))]
               (map
                #(assoc % :cycle-idx (inc cycle) :total-cycles cycle-count)
                (:activities activity)))
             (:post-activity activity)))))
        total-time (reduce
                    (fn [count activity]
                      (+ count (:duration activity)))
                    0
                    activities)]
    (assoc root-activity
           :activities activities
           :total-time total-time)))


(defn screen-main [_props]
  (let [routine (gen-routine my-activity)
        current-activity @(rf/subscribe [:state [:current-activity]])
        running? (not (empty? current-activity))]
    [views/home routine current-activity running?]))

(def stack (rn-stack/createStackNavigator))

(defn navigator [] (-> stack (j/get :Navigator)))

(defn screen [props] [:> (-> stack (j/get :Screen)) props])

(defn root []
  (let [!route-name-ref (clojure.core/atom {})
        !navigation-ref (clojure.core/atom {})]
    [:> AppearanceProvider
     (let [theme (keyword (useColorScheme))]
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
                                 (rf/dispatch [:some-fx-example (str "New screen encountered " current-route-name)]))
                               (swap! !route-name-ref merge {:current current-route-name})))}

         [:> (navigator) {:header-mode "none"}
          (screen {:name "Screen1"
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
  (dispatch-sync [:initialize-db])
  (dispatch-sync [:set-version version])
  (start))
