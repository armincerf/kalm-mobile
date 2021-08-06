import React from "react";
import {
  Box,
  Button,
  View,
  Text,
  Heading,
  StatusBar,
  Pressable,
  SectionList,
  Icon,
  Image,
  Divider,
  HStack,
  VStack,
} from "native-base";
import { Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AddRoutines from "./AddRoutines";
import { AntDesign, FontAwesome5, Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { COLOR_ACCENT, COLOR_HIGHLIGHT, TAB_HEIGHT } from "./utils";
import { Settings } from "./Settings";
import { SwipeItem, SwipeUnderlay } from "./SwipeItem";
import { UnderlayParams } from "react-native-swipeable-item";
import Animated from "react-native-reanimated";
import { TabBar } from "./TabBar";
import { BlurView } from "expo-blur";
import { useColorScheme } from "react-native";
import { SmallControls } from "./Controls";
import ActiveRoutine from "./ActiveRoutine";

const Tab = createBottomTabNavigator();

const renderUnderlayLeft = (
  { item, percentOpen }: UnderlayParams<any>,
  del,
  edit
) => (
  <Animated.View style={[styles.underlayLeft, { opacity: percentOpen }]}>
    <SwipeUnderlay
      bg="secondary.600"
      pressFn={() => del(item.id)}
      iconName="delete"
    />
    <SwipeUnderlay
      bg="green.600"
      style={{ borderBottomRightRadius: 5 }}
      pressFn={() => edit(item.id)}
      iconName="edit"
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
    activeRoutines,
  } = props;
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return (
    <View flex={1} position="relative" h="100%" pt={insets.top}>
      <View style={[styles.currentRoutines, { width: "100%" }]}>
        <BlurView
          intensity={100}
          tint={isDark ? "dark" : "light"}
          style={[styles.blurTab, { paddingBottom: insets.bottom }]}
        >
          {activeRoutines.map((activityProps, index) => {
            return (
              <ActiveRoutine
                key={index}
                {...props}
                {...activityProps}
                index={index}
                isDark={isDark}
              />
            );
          })}
        </BlurView>
      </View>
      <StatusBar barStyle={"default"} />
      <View p={4} flex={1}>
        <Heading pb={4}>All Routines</Heading>
        <SectionList
          sections={data}
          ItemSeparatorComponent={() => <Divider bg="white" />}
          contentContainerStyle={{
            flexGrow: 1,
          }}
          keyExtractor={(item, index) => item + index}
          renderItem={(props) => (
            <SwipeItem
              {...props}
              drag={false}
              renderUnderlayLeft={(props) =>
                renderUnderlayLeft(
                  props,
                  handleDeleteRoutine,
                  handleEditRoutine
                )
              }
              handlePress={handlePress}
            />
          )}
          renderSectionFooter={() => <View pb={4} />}
          renderSectionHeader={({ section: { title } }) => (
            <Box
              _text={{
                fontSize: 14,
              }}
            >
              <Box
                _light={{ bg: "gray.100", _text: { color: "black" } }}
                _dark={{ bg: "gray.800", _text: { color: "white" } }}
                px={4}
                py={2}
                w="100%"
                style={{ borderTopLeftRadius: 5, borderTopRightRadius: 5 }}
              >
                {title}
              </Box>
            </Box>
          )}
        />
      </View>
    </View>
  );
};

export type Activity = {
  name: string;
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
        tabBar={(props) => {
          return <TabBar {...props} />;
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
  currentRoutines: {
    position: "absolute",
    bottom: 50,
    zIndex: 999,
  },
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
});
