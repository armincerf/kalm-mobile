(ns app.handlers
  (:require
   [re-frame.core :as rf]
   [lambdaisland.fetch :as fetch]
   [potpuri.core :as p]
   ["smart-timeout" :as timeout]
   ["@react-native-async-storage/async-storage" :default AsyncStorage]
   ["expo-notifications" :as Notifications]
   [app.db :as db]
   [app.components :as c]
   [clojure.string :as str]))

(defn log
  ([message] (log message {}))
  ([message data]
   (js/console.log message (clj->js data))
   nil))

(def debug? ^boolean goog.DEBUG)

(goog-define GIPHY false)

(defn store-key
  [key value-str]
  (.setItem AsyncStorage key value-str))

(def persist-db
  (rf/->interceptor
   :id :persist-db
   :before (fn [context]
             context)
   :after (fn [context]
            (when-let [value (get-in context
                                     [:effects :db :persisted-state])]
              (store-key "@db" (prn-str value)))
            context)))

(def track
  (rf/->interceptor
   :id :track
   :before (fn [context]
             context)
   :after (fn [context]
            (let [[id params] (get-in context [:coeffects :event])]
              (.track c/analytics "re-frame event" #js {:name (name id)
                                                        :params (prn-str params)}))
            context)))

(def base-interceptors
  [(when debug? rf/debug)
   persist-db])

(defn initialize-db [_ [_ db]] db)

(defn set-state
  [db [_ path value]]
  (assoc-in db (cons :state path) value))

(defn skip-activity
  [{:keys [db]} [_ id direction]]
  (let [idx ((if (= :prev direction) dec inc) (get-in db [:persisted-state id :current-idx]))]
    (if (and idx id)
      {:fx [[:notifs/cancel! (get-in db [:persisted-state id :notif-ids])]
            [:dispatch [:start-routine id idx]]]
       :db (assoc-in db [:persisted-state id :scheduled?] false)}
      (rf/console :error "No routine to resume" id idx))))

(defn routine-complete
  [{:keys [db]} [_ id]]
  (log "routine complete" {:id id})
  {:db (-> db
           (update-in [:persisted-state :active-routines] disj id)
           (assoc-in [:persisted-state id :notif-ids] [])
           (p/dissoc-in [:persisted-state id]))})

(defn shuffle-routine
  [{:keys [db]} [_ id]]
  (let [routine (db/routine-by-id db id)
        activities (:activities routine)]
    {:db (assoc-in db [:persisted-state
                       :my-routines
                       (db/routine-id->index db id)
                       :activities]
                   (vec (shuffle activities)))}))

(defn start-routine
  [{:keys [db]} [_ id idx]]
  (let [routine (db/routine-by-id db id)
        activities (vec (:activities routine))
        activity (get activities idx)
        next (get activities (inc idx))]
    {:db (-> db
             (assoc-in [:persisted-state id :current-idx] idx)
             (assoc-in [:persisted-state id :current-activity] (assoc activity
                                                                      :routineName
                                                                      (:name routine)))
             (assoc-in [:persisted-state id :time-remaining] (:duration activity))
             (update-in [:persisted-state :active-routines] conj id)
             (assoc-in [:persisted-state id :prev-activity]
                       (when (and activity
                                  (pos? idx))
                         (get activities (dec idx))))
             (assoc-in [:persisted-state id :next-activity] next))
     :fx [[:dispatch [:schedule-notifications! id]]
          (when-not activity
            [:dispatch [:routine-complete id]])
          (when-let [duration (:duration activity)]
            [:dispatch-later2
             {:ms duration
              :key id
              :dispatch
              (if next
                [:start-routine
                 id
                 (inc idx)]
                [:routine-complete id])}])]}))

(defn timeout-fn
  [key fn]
  (if (and key (.exists timeout key))
    (fn key)
    (rf/console :warn "nil timeout passed to timeout-fn" key fn)))

(defn pause
  [{:keys [db]} [_ id]]
  {:fx [[:timeout-pause id]
        [:dispatch [:save-time-left id]]
        [:notifs/cancel! (get-in db [:persisted-state id :notif-ids])]]
   :db (-> db
           (assoc-in [:persisted-state id :scheduled?] false)
           (assoc-in [:persisted-state id :timeout-paused?] true))})

(defn save-time-left
  [{:keys [db]} [_ key]]
  {:db (assoc-in db [:persisted-state key :time-remaining]
                 (.remaining timeout key))})

(defn resume
  [{:keys [db]} [_ key]]
  {:fx [[:timeout-resume key]
        [:dispatch [:schedule-notifications! key]]]
   :db (assoc-in db [:persisted-state key :timeout-paused?] nil)})

(defn stop
  [{:keys [db]} [_ id]]
  (log "stopping " id)
  {:fx [[:timeout-clear id]
        [:notifs/cancel! (get-in db [:persisted-state id :notif-ids])]]
   :db (-> db
           (update-in [:persisted-state :active-routines] disj id)
           (update :persisted-state dissoc id))})

(defn fetch-image
  [name]
  (fetch/get "https://api.giphy.com/v1/gifs/search"
             {:query-params
              {:api_key GIPHY
               :q name
               :limit 25
               :offset 0
               :rating "g"
               :lang "en"}}))

(rf/reg-fx
 :timeout-pause
 (fn [key]
   (timeout-fn key #(.pause timeout %))))

(rf/reg-fx
 :timeout-resume
 (fn [key]
   (timeout-fn key #(.resume timeout %))))

(rf/reg-fx
 :timeout-clear
 (fn [key]
   (timeout-fn key #(.clear timeout %))))

(rf/reg-fx
 :notifs/cancel!
 (fn [ids]
   (when (and (seq ids) (not c/web?))
     (log "cancelling notifs" ids)
     (doseq [id ids]
       (.cancelScheduledNotificationAsync Notifications id)))))

(defn notification-scheduled
  [{:keys [db]} [_ routine-id notif-id]]
  {:db (update-in db [:persisted-state routine-id :notif-ids] conj notif-id)})

(rf/reg-fx
 :notifs/schedule!
 (fn [{:keys [activities id]}]
   (when-not c/web?
     (let [duration (atom 0)]
       (doall
        (map-indexed
         (fn [idx activity]
           (when-let [next-activity (get (vec activities) (inc idx))]
             (swap! duration #(+ % (:duration activity)))
             (let [trigger-time @duration
                   left (str/join
                         (interpose ", "
                                    (remove
                                     nil?
                                     (for [[k v] (:durationObj activity)]
                                       (when (and v (pos? v))
                                         (str v " " (name k)))))))
                   message (if-let [next (:name (get (vec activities) (+ 2 idx)))]

                             (rand-nth
                              [(str "You have " left " until '" next "' begins!")
                               "Do it now or I'll show you real panik :<"
                               (let [feel (:feeling activity)]
                                 (when (seq feel)
                                   (case feel
                                     "kalm" (str "This is a nice one! Enjoy!")
                                     "panik" (str "Don't panik, you got this!")
                                     "extraPanik" (str "Yeah.. I wouldn't want to do it either...")
                                     "Have fun!")))])
                             (str "Come back to the app when you're done!"
                                  (when (pos? (:duration next-activity))
                                    (str  " Only "
                                          left
                                          " left to go!"))))]
               (log "sending" #js [idx id (:name next-activity) message " in " (/ trigger-time 1000)])
               (c/send-notification (clj->js (assoc next-activity :message message))
                                    (/ trigger-time 1000)
                                    #(rf/dispatch [:notification-scheduled id %])))))
         activities))))))

(defn take-while+
  [pred coll]
  (lazy-seq
   (when-let [[f & r] (seq coll)]
     (if (pred f)
       (cons f (take-while+ pred r))
       [f]))))

(rf/reg-event-fx
 :schedule-notifications!
 [base-interceptors]
 (fn [{:keys [db]} [_ routine-id]]
   (let [idx (get-in db [:persisted-state routine-id :current-idx])
         {:keys [activities]} (db/routine-by-id db routine-id)
         path [:persisted-state routine-id :scheduled?]]
     (if (get-in db path)
       (log "already scheduled" routine-id)
       ;; only schedule notifications for the next activities in the queue up
       ;; until there is one without a duration (because that requires manual
       ;; input)
       (let [to-notify (->> activities
                            (drop idx)
                            (filter :hasNotification)
                            (take-while+ :duration))]
         (when (seq to-notify)
           {:fx [[:notifs/schedule! {:activities to-notify :id routine-id}]]
            :db (assoc-in db path true)}))))))

(defn dispatch-later
  [{:keys [ms dispatch key] :as effect}]
  (if (or (empty? dispatch)
          (not (number? ms))
          (nil? timeout)
          (nil? key))
    (rf/console
     :error
     "re-frame: ignoring bad :dispatch-later value:" effect)
    (.set timeout key #(rf/dispatch dispatch) ms)))

(defn copy-routine
  [{:keys [db]} [_ id]]
  (if-let [routine (db/routine-by-id db id)]
    (let [;; strip ' (n)' if present
          parse-name (fn [name] (when name (str/replace name #"\s\(\d*\)" "")))
          name (parse-name (:name routine))
          new-id (str name (random-uuid))
          new-routine
          (assoc routine
                 :id new-id
                 ;; add ' (n)' to end of name
                 :name (str name
                            " ("
                            (->> [:persisted-state :my-routines]
                                 (get-in db)
                                 (filter #(= name (parse-name (str (:name %)))))
                                 count)
                            ")"))]
      {:db (update-in db [:persisted-state :my-routines] p/consv new-routine)})
    (log "no routine found for id " id)))

(defn edit-routine
  [{:keys [db]} [_ navigation id]]
  {:db (assoc-in db [:state :edit-routine] id)
   :fx [[:dispatch [:navigate navigation "EditRoutine" {:id id}]]]})

(defn delete-routine
  [{:keys [db]} [_ id]]
  (log "deleting " id)
  (let [current-routines (get-in db [:persisted-state :my-routines])
        existing-routine-index (p/find-index current-routines {:id id})]
    (when existing-routine-index
      (log "deleting routine" {:id id})
      {:db (assoc-in db [:persisted-state :my-routines existing-routine-index] nil)})))

(defn add-routine
  [{:keys [db]} [_ form-data]]
  (let [data (js->clj form-data :keywordize-keys true)
        type (:type data)
        parse-routines
        (fn [routines]
          (->> routines
               (remove
                (fn invalid-routine
                  [{:keys [name]}]
                  (empty? name)))
               (map
                (fn process-durations
                  [{:keys [durationObj hasDuration] :as routine}]
                  (if hasDuration
                    (let [{:keys [hours minutes seconds]} durationObj
                          parse (fn [t] (if (seq (str t)) (long t) 0))
                          hourSecs (* (parse hours) 3600)
                          minSecs (* (parse minutes) 60)
                          processed-duration (* (+ (parse seconds)
                                                   minSecs hourSecs)
                                                1000)]
                      (assoc routine
                             :duration
                             (if (pos? processed-duration)
                               processed-duration
                               false)))
                    (dissoc routine :duration :durationObj))))
               (map
                (fn process-cycles
                  [{:keys [cycleCount id description] :as activity}]
                  (if (and (number? cycleCount) (> cycleCount 1))
                    (for [cycle (range cycleCount)]
                      (assoc activity
                             :id (str id cycle)
                             :description
                             (str description " (" (inc cycle) " of " cycleCount ")")
                             :cycleIdx (inc cycle)))
                    activity)))
               flatten
               vec))
        activities (parse-routines (:routines data))
        total-time (reduce
                    (fn [count activity]
                      (+ count (:duration activity)))
                    0
                    activities)
        routine {:id (str (or (:id data) (gensym (:routineName data))))
                 :name (:routineName data)
                 :type (if (seq type) type "My Routines")
                 :total-time total-time
                 :activities activities}
        existing-routine-index (db/routine-id->index db (:id data))]
    (when (:id routine)
      {:db (if existing-routine-index
             (assoc-in db [:persisted-state :my-routines existing-routine-index] routine)
             (update-in db [:persisted-state :my-routines] p/consv routine))})))

(flatten(map (fn [{:keys [r] :as a}] (if r (repeat r a) a)) [{:a 1}  {:b 2} {:r 3}]))

(defn routine? [page] (= "Routine" page))

(defn navigate
  [{:keys [db]} [_ navigation route props]]
  {:fx [[:navigate! [navigation route props]]]
   :db (assoc db
              :current-page {:name route
                             :props props}
              :navigation navigation)})

(defn update-activity
  [{:keys [db]} [_ activity routine-id index]]
  {:db (assoc-in db [:persisted-state
                     :my-routines
                     (db/routine-id->index db routine-id)
                     :activities
                     index] activity)})

(rf/reg-fx
 :navigate!
 (fn [[navigation route props]]
   (prn "navigating" {:props (prn-str props)})
   (.navigate navigation route #js {:props (prn-str props)})))

(rf/reg-fx
 :dispatch-later2
 (fn [value]
   (if (map? value)
     (dispatch-later value)
     (doseq [effect (remove nil? value)]
       (dispatch-later effect)))))

(rf/reg-event-fx :start-routine [base-interceptors] start-routine)
(rf/reg-event-fx :skip-activity skip-activity)
(rf/reg-event-db :set-state [base-interceptors] set-state)
(rf/reg-event-db :initialize-db initialize-db)
(rf/reg-event-fx :pause [base-interceptors] pause)
(rf/reg-event-fx :save-time-left [base-interceptors] save-time-left)
(rf/reg-event-fx :resume [base-interceptors] resume)
(rf/reg-event-fx :stop [base-interceptors] stop)
(rf/reg-event-fx :copy-routine [base-interceptors] copy-routine)
(rf/reg-event-fx :notification-scheduled [base-interceptors] notification-scheduled)
(rf/reg-event-fx :shuffle-routine [base-interceptors] shuffle-routine)
(rf/reg-event-fx :routine-complete [base-interceptors track] routine-complete)
(rf/reg-event-fx :navigate [base-interceptors] navigate)
(rf/reg-event-fx :add-routine [base-interceptors track] add-routine)
(rf/reg-event-fx :edit-routine [base-interceptors] edit-routine)
(rf/reg-event-fx :delete-routine [base-interceptors] delete-routine)
(rf/reg-event-fx :update-activity [base-interceptors] update-activity)
(rf/reg-event-db :wipe-db [base-interceptors] (fn [_ _] {:persisted-state {}}))

(rf/reg-event-db :add-current-routine [base-interceptors] (fn [db [_ routine]]
                                                            (assoc-in db [:state :current-routine] routine)))
