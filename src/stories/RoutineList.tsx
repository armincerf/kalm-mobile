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
  activeRoutines,
  ...props
}) => {
  const insets = useSafeAreaInsets();

  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return (
    <>
      <View flex={1} position="relative" h="100%" pt={insets.top}>
        <View style={[styles.currentRoutines, { width: "100%" }]}>
          <BlurView
            intensity={100}
            tint={isDark ? "dark" : "light"}
            style={[styles.blurTab, { paddingBottom: insets.bottom }]}
          >
            {activeRoutines.map(({ currentActivity, id }, index) => {
              return (
                <Box
                  w="100%"
                  h={16}
                  p={4}
                  key={id}
                  borderBottomColor={isDark ? "gray.300" : "gray.700"}
                  borderBottomWidth={
                    index >= activeRoutines.length - 1 ? "0px" : "1px"
                  }
                >
                  <HStack justifyContent="space-between">
                    <HStack h="100%" w="80%" alignItems="center">
                      <Box
                        bg="black"
                        w="43px"
                        h="43px"
                        mr={4}
                        justifyContent="center"
                        alignItems="center"
                        borderRadius={5}
                        shadow={5}
                      >
                        {currentActivity.image ? (
                          <Image
                            w="43px"
                            h="43px"
                            resizeMode="stretch"
                            borderRadius={5}
                            alt={currentActivity.name}
                            source={{ uri: currentActivity.image?.still }}
                          />
                        ) : (
                          <FontAwesome5
                            name="tasks"
                            size={40}
                            p={5}
                            color="white"
                          />
                        )}
                      </Box>
                      <VStack justifyContent="space-between">
                        <Text
                          textTransform="uppercase"
                          fontSize={10}
                          fontWeight="bold"
                          color="gray.400"
                        >
                          name
                        </Text>
                        <Text>{currentActivity?.name || "foo"}</Text>
                      </VStack>
                    </HStack>
                    <SmallControls
                      {...props}
                      iconColor={isDark ? "white" : "black"}
                    />
                  </HStack>
                </Box>
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
    </>
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
  currentRoutines: {
    position: "absolute",
    bottom: 50,
    zIndex: 999,
  },
  blurTab: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
