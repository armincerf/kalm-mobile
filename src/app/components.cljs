(ns app.components
  "Imports jsx/tsx components. Note: You must restart the metro process (`yarn
  web`/`yarn start` etc) if you add a new js/require'd component"
  (:require ["react-native" :as ReactNative]))

(def web? (= "web" (.-OS ReactNative/Platform)))

(def RoutineList (.-default (js/require "../src/stories/RoutineList.tsx")))

(def AddRoutine (.-default (js/require "../src/stories/AddRoutines.tsx")))

(def utils (js/require "../src/stories/utils.ts"))
(def accent (.-COLOR_ACCENT utils))
(def highlight (.-COLOR_HIGHLIGHT utils))

(def RoutinePlayer (.-default (js/require "../src/stories/RoutinePlayer.tsx")))

(def analytics (.-default (js/require "../src/stories/analytics.js")))

(def get-name (.-getName utils))


(def register-notifications (.-registerForPushNotificationsAsync utils))
(def send-notification (.-schedulePushNotification utils))


(def Layout (.-Layout (js/require "../src/stories/Layout.jsx")))

(def animated (.-Animated ReactNative))

(def animated-value (.-Value animated))
