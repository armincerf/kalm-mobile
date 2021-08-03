import React from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  Box,
  Button,
  View,
  Text,
  Heading,
  StatusBar,
  Center,
  Pressable,
  Image,
  SectionList,
  Icon,
  Divider,
  FlatList,
  VStack,
  HStack,
} from "native-base";
import { StyleSheet, TouchableOpacity, Dimensions } from "react-native";
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
const humanizeDuration = require("humanize-duration");

export const PlayListView = ({
  currentActivity,
  routine,
  handleStart,
  handleShuffle,
}) => {
  const { name, description, totalTime, activities, type } = routine;
  const data = [
    {
      id: "bd7acbea-c1b1-46c2-aed5-3ad53abb28ba",
      title: "First Item",
    },
    {
      id: "3ac68afc-c605-48d3-a4f8-fbd91aa97f63",
      title: "Second Item",
    },
    {
      id: "58694a0f-3da1-471f-bd96-145571e29d72",
      title: "Third Item",
    },
  ];

  const playerHeader = (
    <>
      <Center key="image">
        <Box
          bg="black"
          w={250}
          h={250}
          shadow={9}
          borderRadius={5}
          mt={2}
          mb={15}
        >
          {Boolean(activities.length > 3) ? (
            <VStack>
              <HStack>
                <Image
                  width={125}
                  height={125}
                  resizeMode="stretch"
                  borderTopLeftRadius={5}
                  alt={activities[0].name}
                  source={{ uri: activities[0]?.image?.still }}
                />
                {Boolean(activities.length > 1) && (
                  <Image
                    height={125}
                    width={125}
                    resizeMode="stretch"
                    borderTopRightRadius={5}
                    alt={activities[1].name}
                    source={{ uri: activities[1]?.image?.still }}
                  />
                )}
              </HStack>
              {Boolean(activities.length > 2) && (
                <HStack>
                  <Image
                    width={125}
                    height={125}
                    resizeMode="stretch"
                    borderBottomLeftRadius={5}
                    alt={activities[2].name}
                    source={{ uri: activities[2]?.image?.still }}
                  />
                  {Boolean(activities.length > 3) && (
                    <Image
                      width={125}
                      height={125}
                      resizeMode="stretch"
                      borderBottomRightRadius={5}
                      alt={activities[3].name}
                      source={{ uri: activities[3]?.image?.still }}
                    />
                  )}
                </HStack>
              )}
            </VStack>
          ) : (
            <Image
              width={250}
              height={250}
              resizeMode="stretch"
              borderRadius={5}
              alt={activities[0].name}
              source={{ uri: activities[0]?.image?.still }}
            />
          )}
        </Box>
        <Heading size="lg">{name}</Heading>
        <Text fontSize="lg" color="red.600">
          {description}
        </Text>
        <Text
          fontSize="xs"
          py={2}
          color="gray.500"
          fontWeight="bold"
          textTransform="uppercase"
        >
          {type}
        </Text>
      </Center>
      <HStack key="buttons" justifyContent="space-between" my={4}>
        <Button
          startIcon={<FontAwesome5 name="play" size={16} color="red" />}
          w="45%"
          bg="gray.800"
          onPress={handleStart}
        >
          <Text color="red.600">Play</Text>
        </Button>
        <Button
          w="45%"
          bg="gray.800"
          startIcon={<FontAwesome5 name="random" size={16} color="red" />}
          onPress={handleShuffle}
        >
          <Text color="red.600">Shuffle</Text>
        </Button>
      </HStack>
    </>
  );

  const secondsText =
    humanizeDuration(totalTime, { delimiter: " " }) + " total";

  return (
    <FlatList
      data={activities}
      ListHeaderComponent={playerHeader}
      ListFooterComponent={() => (
        <Text
          my={3}
          color="gray.500"
        >{`${activities.length} activities, ${secondsText}`}</Text>
      )}
      ItemSeparatorComponent={() => (
        <Divider
          width={Dimensions.get("window").width - 105}
          alignSelf="flex-end"
        />
      )}
      renderItem={({ item }) => (
        <Box>
          <HStack justifyContent="space-between" alignItems="center">
            <HStack>
              <Box
                bg="black"
                my={2}
                w="53px"
                h="53px"
                justifyContent="center"
                alignItems="center"
                borderRadius={5}
                shadow={5}
              >
                {item.image ? (
                  <Image
                    w="53px"
                    h="53px"
                    resizeMode="stretch"
                    borderRadius={5}
                    alt={item.name}
                    source={{ uri: item.image?.still }}
                  />
                ) : (
                  <FontAwesome5 name="tasks" size={40} p={5} color="white" />
                )}
              </Box>

              <VStack
                py={1}
                px={4}
                alignItems="flex-start"
                justifyContent="center"
                w="70%"
              >
                <Text isTruncated fontSize="lg"> {item.name} </Text>
                {Boolean(item.description) && (
                  <Text isTruncated fontSize="sm" paddingLeft="4px" color="gray.500">
                    {item.description}
                  </Text>
                )}
              </VStack>
            </HStack>
            {Boolean(item?.duration && item.duration > 0) && (
              <Text fontSize="xs" color="gray.500">
                {new Date(item.duration).toISOString().substr(11, 8)}
              </Text>
            )}
          </HStack>
        </Box>
      )}
      keyExtractor={({ name, cycleIdx, index }) => name + cycleIdx + index}
    />
  );
};

export default (props) => {
  return (
    <Box p={4}>
      <PlayListView {...props} />
    </Box>
  );
};
