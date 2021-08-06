(ns app.views
  (:require
   [reagent.core :as r]
   [re-frame.core :as rf :refer [dispatch-sync]]
   [clojure.edn :as edn]
   ["react-native-countdown-circle-timer" :refer [CountdownCircleTimer]]
   ["react-native-safe-area-context" :refer [SafeAreaView]]
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

   [applied-science.js-interop :as j]
   [react-native :as rn]))

(def countdown (r/adapt-react-class CountdownCircleTimer))
(def animated-text (r/adapt-react-class (.-Text (.-Animated ^js ReactNative))))
(def text (r/adapt-react-class Text))

(defn countdown-display
  [{:keys [duration name cycleIdx]} preview? paused?]
  (let [time-left @(rf/subscribe [:time-left])
        duration (or (and (not preview?) time-left) duration)
        scheme (rn/useColorScheme)]
    [:> Center
     [countdown
      {:isPlaying (boolean (and (not preview?)
                                (not paused?)))
       :key (str name " " cycleIdx)
       :duration (js/Math.round (/ duration 1000))
       :colors (if (= "dark" scheme)
                 [["#22D3EE" 0.4]
                  ["#F7B801" 0.4]
                  ["#A30000" 0.2]]
                 [["#004777" 0.4]
                  ["#F7B801" 0.4]
                  ["#A30000" 0.2]])}
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
  ([{:keys [name subtitle description image feeling cycleIdx total-cycles] :as activity} preview?]
   (let [paused? @(rf/subscribe [:paused?])]
     [:> Box
      {:m 5
       :shadow 2
       :rounded "lg"}
      (when (:duration activity)
        [:f> countdown-display activity preview? paused?])
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
      (when (and cycleIdx (> cycleIdx 1) total-cycles)
        [:> Heading (str "Cycle number " cycleIdx " out of " total-cycles)])
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
        :keyExtractor (fn [^js activity] (str (j/get activity :id) (or (j/get activity :cycleIdx) 0)))
        :renderItem #(r/as-element (activity-view (js->clj (.-item %) :keywordize-keys true) true))}])))

(defn no-duration-button
  [id]
  [:> Button
   {:size "sm"
    :m 3
    :on-press #(rf/dispatch [:next-activity id])}
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
  [{:keys [activities]} _ _ _]
  (r/create-class
   {:component-did-mount
    (fn []
      (doall
       (map-indexed
        (fn [idx activity]
          (add-random-activity-image activity idx))
        activities)))
    :reagent-render
    (fn [routine current-activity running? animated]
      (let [no-duration?
            (and current-activity
                 (not (:duration current-activity)))]
        (when-let [id (:id routine)]
          (let [next-activity @(rf/subscribe [:persisted-state [id :next-activity]])
                prev-activity @(rf/subscribe [:persisted-state [id :prev-activity]])
                paused? @(rf/subscribe [:paused? id])
                time-left @(rf/subscribe [:time-left id])
                duration (and (not no-duration?) (or time-left (:duration current-activity)))]
            [:> c/RoutinePlayer {:duration duration
                                 :currentActivity current-activity
                                 :animated animated
                                 :routine routine
                                 :handleStart #(rf/dispatch [:start-routine routine %])
                                 :handleShuffle #(rf/dispatch [:start-routine (update routine :activities shuffle) 0])
                                 :handleNext #(rf/dispatch [:skip-activity id])
                                 :handlePlay #(rf/dispatch [:resume id])
                                 :handlePause #(rf/dispatch [:pause id])
                                 :handlePrev #(rf/dispatch [:skip-activity id :prev])
                                 :handleStop #(rf/dispatch [:stop id])
                                 :hasNext (some? next-activity)
                                 :hasPrev (some? prev-activity)
                                 :isPaused paused?
                                 :isRunning running?}]))))}))

(comment
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
               (let [paused? @(rf/subscribe [:paused? id])
                     next-activity?
                     @(rf/subscribe [:persisted-state [id :next-activity]])]
                 [:<>
                  (when (and next-activity? (not no-duration?))
                    [:> Button
                     {:size "sm"
                      :m 3
                      :on-press #(rf/dispatch [:next-activity id])}
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
             [routine-view routine])])

(defn gen-routine
  [root-activity]
  (let [gen-cycles
        (fn [activities cycle-count]
          (for [cycle (range cycle-count)]
            (map
             #(assoc % :cycleIdx (inc cycle) :total-cycles cycle-count)
             activities)))
        gen-activity
        (fn [props]
          (let [activity? (some? (:name props))
                activity (if activity?
                           props
                           (:activity props))
                activities (if (some? (:duration props))
                             [props]
                             (:activities activity))
                cycle-count (or (:cycle-count props)
                                (:cycleCount activity))]
            (concat
             (:pre-activity activity)
             (gen-cycles activities (or cycle-count 1))
             (:post-activity activity))))
        gen-activities (fn [activities]
                         (for [props activities]
                           (gen-activity props)))
        activities
        (remove nil? (flatten (gen-activities (:activities root-activity))))
        total-time (reduce
                    (fn [count activity]
                      (+ count (:duration activity)))
                    0
                    activities)]
    (assoc root-activity
           :activities activities
           :total-time total-time)))

(defn routines
  [{:keys [navigation]} animated]

  (let [saved-routines (remove nil? @(rf/subscribe [:persisted-state [:my-routines]]))
        routines (mapv gen-routine saved-routines)
        grouped-routines (mapv (fn [[k v]]
                                 {:title (or k "No Type") :data v})
                               (group-by :type routines))
        active-routines @(rf/subscribe [:active-routines])]
    [:> RoutineList
     {:data grouped-routines
      :activeRoutines active-routines
      :handleDeleteRoutine (fn [routine] (rf/dispatch [:delete-routine routine]))
      :handleEditRoutine (fn [routine] (rf/dispatch [:edit-routine navigation routine]))
      :animated animated
      :handleAddRoutine (fn [props] (rf/dispatch [:add-routine props]))
      :settingsData [{:title "Admin stuff" :data [{:label "version 0.0.12"}
                                                  {:label "Wipe Db" :action #(rf/dispatch [:wipe-db])}]}]
      :handlePress
      (fn [^js a]
        (rf/dispatch
         [:navigate navigation "Routine"
          (js->clj a :keywordize-keys true)]))}]))


(defn edit-routine
  [_nav animated]
  (let [routine @(rf/subscribe [:state [:edit-routine]])]
    (def routine routine)
    [:> c/AddRoutine
     {:storedRoutine routine
      :animated animated
      :handleSubmit (fn [props] (rf/dispatch [:add-routine props]))}]))
