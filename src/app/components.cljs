(ns app.components
  "Imports jsx/tsx components. Note: You must restart the metro process (`yarn
  web`/`yarn start` etc) if you add a new js/require'd component"
  (:require ["react-native" :as ReactNative]
            [reagent.core :as r]))

(def web? (= "web" (.-OS ReactNative/Platform)))
(def ActionSheet (.-default (js/require "../src/stories/ActionSheet.jsx")))

(def RoutineList (.-default (js/require "../src/stories/RoutineList.tsx")))

(def AddRoutine (.-default (js/require "../src/stories/AddRoutines.tsx")))

(def AddRoutineButton (.-default (js/require "../src/stories/AddRoutineButton.jsx")))


(def utils (js/require "../src/stories/utils.ts"))

(def RoutinePlayer (.-default (js/require "../src/stories/RoutinePlayer.tsx")))

(def analytics (.-default (js/require "../src/stories/analytics.js")))
(def get-name (.-getName utils))


(def register-notifications (.-registerForPushNotificationsAsync utils))
(def send-notification (.-schedulePushNotification utils))


(def Layout (.-Layout (js/require "../src/stories/Layout.jsx")))

(def animated (.-Animated ReactNative))
(def text (r/adapt-react-class (.-Text ReactNative)))
(def animated-value (.-Value animated))
(def animated-view (r/adapt-react-class (.-View animated)))
