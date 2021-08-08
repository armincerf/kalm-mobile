(ns app.views
  (:require
   [reagent.core :as r]
   [re-frame.core :as rf]
   [app.handlers :as handlers]
   [app.components :refer [RoutineList] :as c]))

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
