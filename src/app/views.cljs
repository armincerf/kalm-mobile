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
  [activity routine-id index]
  (when (and (:hasGif activity) handlers/GIPHY (not (:image activity)))
    (-> (handlers/fetch-image (:name activity))
        (.then (fn [{:keys [^js body status]}]
                 (prn "res")
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
                              (assoc activity :image %) routine-id index]))
        (.catch (fn [err] (.track c/analytics "Error fetching image" #js {:key handlers/GIPHY
                                                                          :err err}))))))

(defn routine-player
  [{:keys [activities id]} _ _ _]
  (r/create-class
   {:component-did-mount
    (fn []
      (doall
       (map-indexed
        (fn [idx activity]
          (prn "add image" activity)
          (add-random-activity-image activity id idx))
        activities)))
    :reagent-render
    (fn [routine current-activity running? animated]
      (let [no-duration?
            (and current-activity
                 (not (:duration current-activity)))]
        (when-let [id (:id routine)]
          (let [activity-idx @(rf/subscribe [:persisted-state [id :current-idx]])
                activities (:activities routine)
                paused? @(rf/subscribe [:paused? id])
                time-left @(rf/subscribe [:time-left id])
                duration (and (not no-duration?) (or time-left (:duration current-activity)))]
            [:> c/RoutinePlayer {:duration duration
                                 :currentActivity current-activity
                                 :animated animated
                                 :routine routine
                                 :handleStart #(rf/dispatch [:start-routine id %])
                                 :handleShuffle #(rf/dispatch [:shuffle-routine id])
                                 :handleNext #(rf/dispatch [:skip-activity id])
                                 :handlePlay #(rf/dispatch [:resume id])
                                 :handlePause #(rf/dispatch [:pause id])
                                 :handlePrev #(rf/dispatch [:skip-activity id :prev])
                                 :handleStop #(rf/dispatch [:stop id])
                                 :hasNext (some? (get activities (inc activity-idx)))
                                 :hasPrev (some? (get activities (dec activity-idx)))
                                 :currentIdx activity-idx
                                 :isPaused paused?
                                 :isRunning running?}]))))}))

(defn routines
  [{:keys [navigation]} animated]
  (let [saved-routines (remove nil? @(rf/subscribe [:persisted-state [:my-routines]]))
        grouped-routines (mapv (fn [[k v]]
                                 {:title (or k "No Type") :data v})
                               (group-by :type saved-routines))
        active-routines @(rf/subscribe [:active-routines])]
    [:> RoutineList
     {:data grouped-routines
      :activeRoutines active-routines
      :handleDeleteRoutine (fn [routine-id] (rf/dispatch [:delete-routine routine-id]))
      :handleEditRoutine (fn [routine-id] (rf/dispatch [:edit-routine navigation routine-id]))
      :handleNext #(rf/dispatch [:skip-activity %])
      :handlePlay #(rf/dispatch [:resume %])
      :handlePause #(rf/dispatch [:pause %])
      :handleStop #(rf/dispatch [:stop %])
      :animated animated
      :handleAddRoutine (fn [props] (rf/dispatch [:add-routine props]))
      :settingsData [{:title "Admin stuff" :data [{:label "version 0.0.12"}
                                                  {:label "Wipe Db" :action #(rf/dispatch [:wipe-db])}
                                                  {:label "Register for notifications" :action #(c/register-notifications)}]}]
      :handlePress
      (fn [^js a]
        (rf/dispatch
         [:navigate navigation "Routine"
          (.-id a)]))}]))


(defn edit-routine
  [{:keys [navigation]} animated]
  (let [routine @(rf/subscribe [:current-routine])]
    (when (:activities routine)
      [:> c/AddRoutine
       {:storedRoutine routine
        :animated animated
        :handleSubmit (fn [props]
                        (rf/dispatch [:add-routine props])
                        (.goBack navigation))}])))
