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

   [app.handlers :as handlers]
   [app.components :refer [RoutineList] :as c]

   [applied-science.js-interop :as j]))

(def countdown (r/adapt-react-class CountdownCircleTimer))
(def animated-text (r/adapt-react-class (.-Text (.-Animated ^js ReactNative))))
(def text (r/adapt-react-class (.-Text ^js ReactNative)))

(defn countdown-display
  [{:keys [duration name cycle-idx]} preview? paused?]
  (let [time-left @(rf/subscribe [:time-left])
        duration (or (and (not preview?) time-left) duration)]
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
               (str hours ":" mins ":" (pad seconds))
               mins
               (str mins ":" (pad seconds))
               :else
               seconds)]
            (when-not mins
              [text "seconds"])])))]]))

(defn activity-view
  ([activity] (activity-view activity false))
  ([{:keys [name subtitle description image feeling cycle-idx total-cycles] :as activity} preview?]
   (let [paused? @(rf/subscribe [:paused?])]
     [:> Box
      {:bg "white"
       :m 5
       :shadow 2
       :rounded "lg"}
      (when (:duration activity)
        [countdown-display activity preview? paused?])
      (when image
        (let [image-tag (fn [image]
                          [:> Image {:source {:uri image}
                                     :alt (or name "Activity")
                                     :resizeMode "stretch"
                                     :height 250}])]

          (cond
            (string? image)
            (image-tag image)
            paused?
            (image-tag (:still image))
            (not paused?)
            (image-tag (:gif image)))))
      (when (and cycle-idx (> cycle-idx 1) total-cycles)
        [:> Heading (str "Cycle number " cycle-idx " out of " total-cycles)])
      [:> Center
       [:> Heading
        {:size ["md" "lg" "md"]
         :isTruncated true
         :noOfLines 2}
        (when (= "extraPanik" feeling)
          "You can do this! \n")
        name]
       [:> Text (or subtitle description)]]])))

(defn routine-view
  [{:keys [activities]}]
  (let [sectioned-activities activities]
    (when (seq sectioned-activities)
      [:> SectionList
       {:sections [{:title "Section" :data sectioned-activities}]
        :keyExtractor (fn [^js activity] (str (j/get activity :name) (or (j/get activity :cycle-idx) 0)))
        :renderItem #(r/as-element (activity-view (js->clj (.-item %) :keywordize-keys true) true))}])))

(defn no-duration-button
  [id]
  [:> Button
   {:size "sm"
    :m 3
    :on-press #(rf/dispatch [:resume-routine id])}
   (if @(rf/subscribe [:persisted-state [id :next-activity]])
     "Next Step"
     "Finish")])

(defn add-random-activity-image
  [activity index]
  (when (and (:hasGif activity) handlers/GIPHY (not (:image activity)))
    (-> (handlers/fetch-image (:name activity))
        (.then (fn [{:keys [^js body status]}]
                 (if (= 200 status)
                   (let [data (js->clj (.-data body))
                         image
                         (some-> data
                                 shuffle
                                 first
                                 (get "images"))
                         gif (some-> image
                                     (get "downsized_medium")
                                     (get "url"))
                         still (some-> image
                                       (get "480w_still")
                                       (get "url"))]
                     {:gif gif
                      :still still})
                   (prn "error" body))))
        (.then #(rf/dispatch [:update-activity
                              (assoc activity :image %) index]))
        (.catch (fn [err] (.track c/analytics "Error fetching image" #js {:key handlers/GIPHY
                                                                          :err err}))))))

(defn routine-player
  [{:keys [route]} _ _]
  (let [{:keys [name description activities] :as routine}
        (edn/read-string (.-props (.-params route)))
        show-preview? (r/atom false)]
    (r/create-class
     {:component-did-mount
      (fn []
        (doall
         (map-indexed
          (fn [idx activity]
            (add-random-activity-image activity idx))
          activities)))
      :reagent-render
      (fn [_ current-activity running?]
        (let [id name
              no-duration?
              (and current-activity
                   (not (:duration current-activity)))]
          [:<>
           [:> Box
            {:py 2
             :px 2
             :rounded "md"}
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
               (let [paused? @(rf/subscribe [:paused? name])
                     next-activity?
                     @(rf/subscribe [:persisted-state [id :next-activity]])]
                 [:<>
                  (when (and next-activity? (not no-duration?))
                    [:> Button
                     {:size "sm"
                      :m 3
                      :on-press #(rf/dispatch [:resume-routine id])}
                     "Skip"])
                  (when-not no-duration?
                    [:> Button
                     {:size "sm"
                      :m 3
                      :on-press #(rf/dispatch [(if paused? :resume :pause) id])}
                     (if paused? "Resume" "Pause")])
                  (when (or next-activity? (not no-duration?))
                    [:> Button
                     {:size "sm"
                      :m 3
                      :on-press #(rf/dispatch [:stop id])}
                     "Stop"])]))]

            (when no-duration?
              [no-duration-button id])

            (when current-activity
              [activity-view current-activity])]
           (when @show-preview?
             [routine-view routine])]))})))

(defn routines
  [{:keys [navigation]} routines]
  (let [grouped-routines (mapv (fn [[k v]]
                                 {:title (or k "No Type") :data v})
                               (group-by :type routines))]
    [:<>
     [text "version = 0.0.12"]
     [:> Button {:onPress #(rf/dispatch [:wipe-db])
                 :variant "outline"
                 :colorScheme "secondary"
                 :m 4} "Wipe DB"]
     [:> Heading
      {:py 2}
      "Routines:"]

     [:> RoutineList
      {:data grouped-routines
       :handlePress
       (fn [^js a]
         (rf/dispatch
          [:navigate navigation "Routine"
           (js->clj a :keywordize-keys true)]))}]]))
