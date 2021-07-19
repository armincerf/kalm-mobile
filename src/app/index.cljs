(ns app.index
  (:require
   ["@react-navigation/native" :as nav]
   ["@react-navigation/stack" :as rn-stack]
   ["react-native-appearance" :refer [AppearanceProvider
                                      useColorScheme]]
   ["expo-constants" :as expo-constants]
   ["react-native" :as rn]
   ["react-native-paper" :as paper]
   ["tailwind-rn" :default tailwind-rn]

   [applied-science.js-interop :as j]
   [reagent.core :as r]
   [re-frame.core :as rf :refer [dispatch-sync]]
   [shadow.expo :as expo]

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

(defn activity-view
  [{:keys [title subtitle image cycle-idx total-cycles]}]
  [:> paper/Card
   [:> paper/Card.Cover {:source image}]
   (when cycle-idx
     [:> paper/Card.Title {:title (str "Cycle number " cycle-idx " out of " total-cycles)}])
   [:> paper/Card.Title {:title title
                         :subtitle subtitle}]
   [:> paper/Card.Content
    [:> rn/View {:style (tw "flex flex-row justify-between")}]]])

(def push-ups
  {:name "Push ups"
   :description "Hold arms in good way and push in the up direction"
   :pre-activity [{:title "Get in the position"
                   :image "pushup-position.jpg"
                   :duration 2000}]
   :activities [{:title "Push down"
                 :duration 1000}
                {:title "Push up"
                 :duration 1000}]
   :post-activity [{:title "Rest"
                    :duration 1000}]})

(def my-activity
  {:name "Morning Routine"
   :description "a good routine"
   :activities [{:cycle-count 2
                :activity push-ups}]})

(defn gen-routine
  [root-activity]
  (let [activities
        (flatten
         (for [{:keys [activity cycle-count]}
               (:activities root-activity)]
           (concat
            (:pre-activity activity)
            (for [cycle (range cycle-count)]
              (map
               #(assoc % :cycle-idx (inc cycle) :total-cycles cycle-count)
               (:activities activity)))
            (:post-activity activity))))]
    {:activities activities}))

(defn screen-main [_props]
  (let [routine (gen-routine my-activity)
        current-activity @(rf/subscribe [:state [:current-activity]])]
    [:> rn/SafeAreaView {:style (tw "flex flex-1")}
     [:> rn/StatusBar {:visibility "hidden"}]
     [:> paper/Surface {:style (tw "flex flex-1 justify-center")}
      [:> rn/View
       [:> rn/Button
        {:disabled current-activity
         :title
         (if current-activity
           "Running activity..."
           "Click to start routine!")
         :on-press #(rf/dispatch [:start-routine (:activities routine) 0])}]
       [activity-view current-activity]]]]))

(def stack (rn-stack/createStackNavigator))

(defn navigator [] (-> stack (j/get :Navigator)))

(defn screen [props] [:> (-> stack (j/get :Screen)) props])

(defn root []
  (let [!route-name-ref (clojure.core/atom {})
        !navigation-ref (clojure.core/atom {})]
    [:> AppearanceProvider
     (let [theme (keyword (useColorScheme))]
       [:> paper/Provider
        {:theme (case theme
                  :light paper/DefaultTheme
                  :dark  paper/DarkTheme
                  paper/DefaultTheme)}

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
                   :component (paper/withTheme (r/reactify-component screen-main))})]]])]))

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
