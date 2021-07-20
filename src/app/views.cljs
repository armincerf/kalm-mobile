(ns app.views
  (:require
   [reagent.core :as r]
   [re-frame.core :as rf :refer [dispatch-sync]]
   ["native-base" :refer [Pressable
                          Box
                          SectionList
                          Slide
                          Image
                          Center
                          Button
                          Text
                          Heading]]
   [applied-science.js-interop :as j]))

(defn activity-view
  [{:keys [title subtitle image cycle-idx total-cycles] :as activity}]
  (prn "Rendering activity: " activity)
  [:> Box
   {:bg "white"
    :m 5
    :shadow 2
    :rounded "lg"}
   [:> Image {:source {:uri image}
              :alt (or title "Activity")
              :resizeMode "cover"
              :height 150}]
   (when cycle-idx
     [:> Heading (str "Cycle number " cycle-idx " out of " total-cycles)])
   [:> Heading
    {:size ["md" "lg" "md"]
     :noOfLines 2}
    title
    subtitle]])

(defn routine-view
  [{:keys [name description activities]}]
  (let [sectioned-activities
        activities]
    [:> SectionList
     {:sections [{:title "Section" :data sectioned-activities}]
      :keyExtractor (fn [^js activity] (str (j/get activity :title) (or (j/get activity :cycle-idx) 0)) )
      :renderItem #(r/as-element (activity-view (js->clj (.-item %) :keywordize-keys true)))}]))

(defn no-duration-button
  []
  [:> Button
   {:size "sm"
    :on-press #(rf/dispatch [:resume-routine])}
   (if @(rf/subscribe [:state [:next-activity]])
     "Next Step"
     "Finish")])

(defn home
  [routine current-activity running?]
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

        (when (and current-activity
                   (not (:duration current-activity)))
          [no-duration-button])

        (when current-activity
          [activity-view current-activity])]
       (when @show-preview?
         [routine-view routine])])))
