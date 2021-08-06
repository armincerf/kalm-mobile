(ns app.index
  (:require
   ["@react-navigation/native" :as nav]
   ["react-native-safe-area-context" :refer [SafeAreaProvider]]
   ["@react-navigation/stack" :as rn-stack]
   ["expo-constants" :as expo-constants]

   ["react-native" :as rn]
   ["tailwind-rn" :default tailwind-rn]
   ["native-base" :refer [NativeBaseProvider
                          extendTheme
                          useColorMode]]
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

(defn screen-main [_props animated]
  (let [{:keys [id] :as routine} @(rf/subscribe [:current-routine])
        current-activity @(rf/subscribe [:persisted-state [id :current-activity]])
        running? (not (empty? current-activity))
        active-routines @(rf/subscribe [:active-routines])]
    [views/routine-player routine current-activity running? animated]))

(def stack (rn-stack/createStackNavigator))

(defn navigator [props] [:> (-> ^js stack .-Navigator) props])

(defn screen [props] [:> (-> ^js stack .-Screen) props])

(defn root []
  (let [animated (.-current (useRef (c/animated-value. 0)))
        scheme (rn/useColorScheme)
        customTheme (extendTheme
                     #js {:config #js {:initialColorMode scheme}})
        dark-mode? (= "dark" scheme)
        !route-name-ref (clojure.core/atom {})
        !navigation-ref (clojure.core/atom {})
        page @(rf/subscribe [:page])
        routine (when (routine? (:name page))
                  (or (:props page)
                      (:storedRoutine page)))]
    [:> NativeBaseProvider
     {:theme customTheme}
     [:> nav/NavigationContainer
      {:ref (fn [el] (reset! !navigation-ref el))
       :theme (if dark-mode?
                (j/assoc-in!
                 nav/DarkTheme
                 [:colors :background]
                 "black")
                (j/assoc-in!
                 nav/DefaultTheme
                 [:colors :background]
                 "white"))
       :on-ready (fn []
                   (swap! !route-name-ref merge
                          {:current (-> @!navigation-ref
                                        (j/call :getCurrentRoute)
                                        (j/get :name))}))
       :on-state-change
       (fn []
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
            (screen {:name "EditRoutine"
                     :options {:title (str "Editing " (:name routine))
                               :headerTintColor (if dark-mode?
                                                  c/highlight
                                                  c/accent)}
                     :component (r/reactify-component #(views/edit-routine % animated))})
            (screen {:name "Routine"
                     :options {:title (or (:name routine) "Routine")
                               :headerTintColor (if dark-mode?
                                                  c/highlight
                                                  c/accent)}
                     :component (r/reactify-component #(screen-main % animated))})]])]]]]))

(defn start
  []
  (expo/render-root (r/as-element [:f> root])))

(def version (-> expo-constants
                 (j/get :default)
                 (j/get :manifest)
                 (j/get :version)))

(defonce analytics
  (when-not c/web?
    (do
      (.init c/analytics "66OTJI4K6H10")
      "done")))

(defn init
  {:dev/after-load true}
  []
  (db/default-app-db)
  (when analytics
    (.identify c/analytics #js {:displayName (c/get-name)}))
  (start))
