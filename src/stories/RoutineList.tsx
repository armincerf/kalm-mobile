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
      bg="green.600"
      style={{ borderBottomRightRadius: 5 }}
      pressFn={() => edit(item)}
      iconName="edit"
    />
  </Animated.View>
);

const Routines = ({
  data,
  handlePress,
  handleEditRoutine,
  handleDeleteRoutine,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View flex={1} pt={insets.top} pb={insets.bottom}>
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
    borderBottomRightRadius: 5,
  },
});
