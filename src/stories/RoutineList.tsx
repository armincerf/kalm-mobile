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
  Divider,
} from "native-base";
import { StyleSheet, TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AddRoutines from "./AddRoutines";
import { AntDesign, Ionicons } from "@expo/vector-icons";
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

const Tab = createBottomTabNavigator();

const renderUnderlayLeft = (
  { item, percentOpen }: UnderlayParams<any>,
  del,
  edit
) => (
  <Animated.View style={[styles.underlayLeft, { opacity: percentOpen }]}>
    <SwipeUnderlay
      bg="secondary.600"
      pressFn={() => del(item)}
      iconName="delete"
    />
    <SwipeUnderlay
      bg="primary.600"
      pressFn={() => editddd(item)}
      iconName="edit"
    />
  </Animated.View>
);

const Routines = ({
  data,
  handlePress,
  handleEditRoutine,
  handleDeleteRoutine,
}) => (
  <SafeAreaView>
    <StatusBar barStyle={"default"} />
    <Box p={4}>
      <Heading>All Routines</Heading>
      <SectionList
        sections={data}
        ItemSeparatorComponent={() => <Divider bg="white" size={2} />}
        contentContainerStyle={{
          paddingBottom: 110,
        }}
        keyExtractor={(item, index) => item + index}
        renderItem={(props) => (
          <SwipeItem
            {...props}
            drag={false}
            renderUnderlayLeft={(props) =>
              renderUnderlayLeft(props, handleDeleteRoutine, handleEditRoutine)
            }
            handlePress={handlePress}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Box
            px={5}
            py={2}
            _light={{ bg: "white", _text: { color: "black" } }}
            _dark={{ bg: "gray.800", _text: { color: "white" } }}
            _text={{
              fontSize: 14,
            }}
          >
            {title}
          </Box>
        )}
      />
    </Box>
  </SafeAreaView>
);

export default ({
  animated,
  handleAddRoutine,
  settingsData,
  ...props
}: {
  animated: any;
  data: object;
  handleAddRoutine: (e: any) => void;
  handleDeleteRoutine: (e: any) => void;
  handleEditRoutine: (e: any) => void;
  settingsData: object[];
  handlePress: () => void;
}) => {
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
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  underlayLeft: {
    flex: 1,
    backgroundColor: "gray",
    justifyContent: "flex-end",
    alignItems: "center",
    flexDirection: "row",
  },
});
