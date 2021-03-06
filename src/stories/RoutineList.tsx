import React from "react";
import {
  Box,
  View,
  Heading,
  StatusBar,
  SectionList,
  Divider,
} from "native-base";
import { Alert, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AddRoutines from "./AddRoutines";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Settings } from "./Settings";
import { SwipeItem, SwipeUnderlay } from "./SwipeItem";
import { UnderlayParams } from "react-native-swipeable-item";
import Animated from "react-native-reanimated";
import { TabBar } from "./TabBar";

const Tab = createBottomTabNavigator();

const renderUnderlayLeft = (
  { item, percentOpen }: UnderlayParams<any>,
  del,
  edit,
  copy
) => (
  <Animated.View style={[styles.underlayLeft, { opacity: percentOpen }]}>
    <SwipeUnderlay
      bg="secondary.600"
      pressFn={() => {
        Alert.alert(
          "Are you sure?",
          "Are you sure you want to delete this routine? This cannot be undone",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Delete",
              onPress: () => del(item.id),
            },
          ]
        );
      }}
      iconName="delete"
    />
    <SwipeUnderlay
      bg="green.600"
      style={{ borderBottomRightRadius: 5 }}
      pressFn={() => edit(item.id)}
      iconName="edit"
    />
    <SwipeUnderlay
      bg="blue.600"
      style={{ borderBottomRightRadius: 5 }}
      pressFn={() => copy(item.id)}
      iconName="copy1"
    />
  </Animated.View>
);

const Routines = (props: RoutineListProps) => {
  const insets = useSafeAreaInsets();
  const {
    data,
    handlePress,
    handleEditRoutine,
    handleDeleteRoutine,
    handleCopyRoutine,
  } = props;
  return (
    <View style={styles.routineList}>
      <StatusBar barStyle={"default"} />
      <SectionList
        sections={data}
        ItemSeparatorComponent={() => <Divider bg="white" />}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 80 + (props?.activeRoutines?.length || 0) * 55,
        }}
        keyExtractor={(item, index) => item + index}
        ListHeaderComponent={() => (
          <View pt={insets.top} pb={4}>
            <Heading>Routines</Heading>
          </View>
        )}
        renderItem={(props) => (
          <SwipeItem
            {...props}
            drag={false}
            renderUnderlayLeft={(props) =>
              renderUnderlayLeft(
                props,
                handleDeleteRoutine,
                handleEditRoutine,
                handleCopyRoutine
              )
            }
            handlePress={handlePress}
          />
        )}
        renderSectionFooter={() => <View pb={4} />}
        renderSectionHeader={({ section: { title } }) => {
          let color;
          switch (title) {
            case "My Routines":
              color = "green.300";
              break;
            case "Meditation":
              color = "blue.300";
              break;
            case "Chores":
              color = "orange.300";
              break;
            case "Daily Routines":
              color = "red.300";
              break;
            case "Fitness":
              color = "purple.300";
              break;
            case "Special Occasions":
              color = "yellow.300";
              break;
            default:
              color = "gray.300";
              break;
          }
          return (
            <Box
              _text={{
                fontSize: 14,
              }}
            >
              <Box
                bg={color}
                px={4}
                py={2}
                w="100%"
                style={{ borderTopLeftRadius: 5, borderTopRightRadius: 5 }}
              >
                {title}
              </Box>
            </Box>
          );
        }}
      />
    </View>
  );
};

export type Activity = {
  name: string;
  description?: string;
  duration?: number;
  image: { still: string; gif?: string };
  cycleIdx?: number;
  routineName: string;
};

export type Routine = {
  id: string;
  type: string;
  hasGif: boolean;
  name: string;
  totalTime: number;
  activities: Activity[];
};

export type GroupedRoutines = {
  type: string;
  data: Routine[];
};

export type RoutineListProps = {
  data: GroupedRoutines[];
  activeRoutines: any[];
  handleDeleteRoutine: (id: string) => void;
  handleEditRoutine: (id: string) => void;
  handleCopyRoutine: (e: any) => void;
  handleNext: (id: string) => void;
  handlePlay: (id: string) => void;
  handlePause: (id: string) => void;
  handleStop: (id: string) => void;
  animated: any;
  handleAddRoutine: (e: any) => void;
  settingsData: object[];
  handlePress: (routine: { id: string }) => void;
};

export default (props: RoutineListProps) => {
  const { animated, handleAddRoutine, settingsData } = props;
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Tab.Navigator
        tabBar={(tabProps) => {
          return <TabBar {...tabProps} {...props} />;
        }}
      >
        <Tab.Screen
          options={{
            tabBarLabel: "Home",
            tabBarAccessibilityLabel: "Home Screen",
            tabBarTestID: "home",
          }}
          name="Home"
        >
          {() => <Routines {...props} />}
        </Tab.Screen>
        <Tab.Screen
          options={{
            tabBarLabel: "Add",
            tabBarAccessibilityLabel: "Add Screen",
            tabBarTestID: "add",
          }}
          name="Add Activity"
        >
          {(props) => (
            <AddRoutines
              handleSubmit={(e) => {
                handleAddRoutine(e);
                props.navigation.jumpTo("Home");
              }}
              {...props}
              animated={animated}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          options={{
            tabBarLabel: "settings",
            tabBarAccessibilityLabel: "Settings Screen",
            tabBarTestID: "settings",
          }}
          name="Settings"
        >
          {() => <Settings data={settingsData} />}
        </Tab.Screen>
      </Tab.Navigator>
    </>
  );
};

const styles = StyleSheet.create({
  underlayLeft: {
    flex: 1,
    backgroundColor: "gray",
    justifyContent: "flex-end",
    alignItems: "center",
    flexDirection: "row",
  },
  blurTab: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  routineList: {
    paddingHorizontal: 16,
    flex: 1,
    position: "relative",
    height: "100%",
  },
});
