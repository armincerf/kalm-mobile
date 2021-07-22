(ns app.views
  (:require
   [reagent.core :as r]
   [re-frame.core :as rf :refer [dispatch-sync]]
   ["react-native-countdown-circle-timer" :refer [CountdownCircleTimer]]
   ["native-base" :refer [Pressable
                          Box
                          SectionList
                          Slide
                          Image
                          Center
                          Button
                          Text
                          Heading]]
   ["react-native" :as ReactNative]
   [applied-science.js-interop :as j]))

(def countdown (r/adapt-react-class CountdownCircleTimer))
(def animated-text (r/adapt-react-class (.-Text (.-Animated ReactNative))))
(def text (r/adapt-react-class (.-Text ReactNative)))

(defn countdown-display
  [duration key preview?]
  (let [paused? @(rf/subscribe [:paused?])]
    [:> Center
     [countdown
      {:isPlaying (and (not preview?) (not paused?))
       :key key
       :duration (/ duration 1000)
       :colors [["#004777" 0.4]
                ["#F7B801" 0.4]
                ["#A30000" 0.2]]}
      (fn [^js props]
        (let [remaining-time (.-remainingTime props)
              color (.-animatedColor props)
              pad (fn [t] (if (and t (< t 10)) (str "0" t) t))
              hours (when (>= remaining-time 3600)
                      (js/Math.floor (/ remaining-time 3600)))
              mins (when (>= remaining-time 60)
                     (js/Math.floor (/ (mod remaining-time 3600) 60)))
              hours (pad hours)
              mins (pad mins)
              seconds (mod remaining-time 60)]
          (r/as-element
           [:<>
            [text "Remaining"]
            [animated-text
             {:style {:color color
                      :fontSize 37}}
             (cond
               hours
               (str hours ":" mins ":" seconds)
               mins
               (str mins ":" seconds)
               :else
               seconds)]
            (when-not mins
              [text "seconds"])])))]]))

(defn activity-view
  ([activity] (activity-view activity false))
  ([{:keys [title subtitle image cycle-idx total-cycles] :as activity} preview?]
   (prn "Rendering activity: " activity)
   [:> Box
    {:bg "white"
     :m 5
     :shadow 2
     :rounded "lg"}
    (when-let [duration (:duration activity)]
      [countdown-display duration (str title cycle-idx) preview?])
    [:> Image {:source {:uri image}
               :alt (or title "Activity")
               :resizeMode "stretch"
               :height 250}]
    (when (and cycle-idx total-cycles)
      [:> Heading (str "Cycle number " cycle-idx " out of " total-cycles)])
    [:> Center
     [:> Heading
      {:size ["md" "lg" "md"]
       :noOfLines 2}
      title
      subtitle]]]))

(defn routine-view
  [{:keys [activities]}]
  (let [sectioned-activities activities]
    [:> SectionList
     {:sections [{:title "Section" :data sectioned-activities}]
      :keyExtractor (fn [^js activity] (str (j/get activity :title) (or (j/get activity :cycle-idx) 0)))
      :renderItem #(r/as-element (activity-view (js->clj (.-item %) :keywordize-keys true) true))}]))

(defn no-duration-button
  []
  [:> Button
   {:size "sm"
    :on-press #(rf/dispatch [:resume-routine])}
   (if @(rf/subscribe [:state [:next-activity]])
     "Next Step"
     "Finish")])

(defn home
  [_ _ _]
  (let [show-preview? (r/atom false)]
    (fn [routine current-activity running?]
      [:<>
       [:> Box
        {:bg "primary.100"
         :my 10
         :py 2
         :px 2
         :rounded "md"
         :alignSelf "center"
         :width 375}
        [:> Heading (:name routine)]
        [:> Text (:description routine)]
        [:> Button
         {:size "sm"
          :on-press #(swap! show-preview? not)}
         (if @show-preview? "Hide Preview" "Show Preview")]
        [:> Button
         {:disabled running?
          :size "sm"
          :on-press #(rf/dispatch [:start-routine (:activities routine) 0])}
         (if running?
           "Running activity..."
           "Click to start routine")]
        (when running?
          (let [timeout @(rf/subscribe [:state [:timeout]])
                paused? @(rf/subscribe [:paused?])]
            [:> Button
             {:size "sm"
              :on-press #(rf/dispatch [(if paused? :resume :pause) timeout])}
             (if paused? "Resume" "Pause")]))

        (when (and current-activity
                   (not (:duration current-activity)))
          [no-duration-button])

        (when current-activity
          [activity-view current-activity])]
       (when @show-preview?
         [routine-view routine])])))
