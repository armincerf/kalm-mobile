(ns app.views
  (:require
   [reagent.core :as r]
   [re-frame.core :as rf :refer [dispatch-sync]]
   [clojure.edn :as edn]
   ["react-native-countdown-circle-timer" :refer [CountdownCircleTimer]]
   ["native-base" :refer [Pressable
                          Box
                          SectionList
                          Slide
                          Image
                          HStack
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
  [{:keys [duration name cycle-idx]} preview?]
  (let [paused? @(rf/subscribe [:paused?])
        time-left @(rf/subscribe [:time-left])
        duration (or time-left duration)]
    [:> Center
     [countdown
      {:isPlaying (boolean (and (not preview?)
                                (not paused?)))
       :key (gensym name)
       :duration (js/Math.round (/ duration 1000))
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
   [:> Box
    {:bg "white"
     :m 5
     :shadow 2
     :rounded "lg"}
    (when (:duration activity)
      [countdown-display activity preview?])
    (when image
      [:> Image {:source {:uri image}
                 :alt (or title "Activity")
                 :resizeMode "stretch"
                 :height 250}])
    (when (and cycle-idx (> cycle-idx 1) total-cycles)
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
    (when (seq sectioned-activities)
      [:> SectionList
       {:sections [{:title "Section" :data sectioned-activities}]
        :keyExtractor (fn [^js activity] (str (j/get activity :title) (or (j/get activity :cycle-idx) 0)))
        :renderItem #(r/as-element (activity-view (js->clj (.-item %) :keywordize-keys true) true))}])))

(defn no-duration-button
  [id]
  [:> Button
   {:size "sm"
    :m 3
    :on-press #(rf/dispatch [:resume-routine id])}
   (if @(rf/subscribe [:state [id :next-activity]])
     "Next Step"
     "Finish")])

(defn routine-player
  [_ _ _]
  (let [show-preview? (r/atom false)]
    (fn [{:keys [route]} current-activity running?]
      (let [{:keys [name description] :as routine}
            (edn/read-string (.-props (.-params route)))
            id name]
        [:<>
         [:> Box
          {:bg "primary.100"
           :my 10
           :py 2
           :px 2
           :rounded "md"
           :alignSelf "center"}
          [:> Heading name]
          [:> Text description]
          [:> Button
           {:size "sm"
            :m 3
            :on-press #(swap! show-preview? not)}
           (if @show-preview? "Hide Preview" "Show Preview")]
          [:> HStack
           {:space 1
            :alignItems "center"}
           (when-not running?
             [:> Button
              {:m 3
               :size "sm"
               :on-press #(rf/dispatch [:start-routine routine 0])}
              "Click to start routine"])
           (when running?
             (let [paused? @(rf/subscribe [:paused? name])]
               [:<>
                (when @(rf/subscribe [:state [id :next-activity]])
                  [:> Button
                   {:size "sm"
                    :m 3
                    :on-press #(rf/dispatch [:resume-routine id])}
                   "Skip"])
                [:> Button
                 {:size "sm"
                  :m 3
                  :on-press #(rf/dispatch [(if paused? :resume :pause) id])}
                 (if paused? "Resume" "Pause")]
                [:> Button
                 {:size "sm"
                  :m 3
                  :on-press #(rf/dispatch [:stop id])}
                 "Stop"]]))]

          (when (and current-activity
                     (not (:duration current-activity)))
            [no-duration-button id])

          (when current-activity
            [activity-view current-activity])]
         (when @show-preview?
           [routine-view routine])]))))

(defn routines
  [{:keys [navigation]} routines]
  [:<>
   [:> Heading "Your routines"]
   (for [routine routines]
     ^{:key (:name routine)}
     [:> Button
      {:size "sm"
       :m 5
       :on-press #(rf/dispatch
                   [:navigate navigation "Routine" routine])}
      (:name routine)])])