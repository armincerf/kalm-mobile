(ns app.components
  "Imports jsx/tsx components. Note: You must restart the metro process (`yarn
  web`/`yarn start` etc) if you add a new js/require'd component")


(def ActionSheet (.-default (js/require "../src/stories/ActionSheet.jsx")))

(def RoutineList (.-default (js/require "../src/stories/RoutineList.jsx")))

(def AddRoutine (.-default (js/require "../src/stories/AddRoutine.jsx")))

(def AddRoutineButton (.-default (js/require "../src/stories/AddRoutineButton.jsx")))
