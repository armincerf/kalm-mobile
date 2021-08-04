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
  useColorModeValue,
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
import SeekBar from "./SeekBar";
import { Controls } from "./Controls";
const humanizeDuration = require("humanize-duration");

export const PlayListView = ({
  currentActivity,
  routine,
  handleStart,
  handleShuffle,
  bg,
  accent,
}) => {
  const { name, description, totalTime, activities, type } = routine;
  const playerHeader = (
    <>
      <Center key="image">
        <Box
          bg="black"
          w={250}
          h={250}
          shadow={9}
          borderRadius={5}
          mt={4}
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
        <Text fontSize="lg" color={accent}>
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
      <HStack key="buttons" justifyContent="space-between" m={4}>
        <Button
          startIcon={<FontAwesome5 name="play" size={16} color={accent} />}
          w="45%"
          bg={bg}
          onPress={handleStart}
        >
          <Text color={accent}>Play</Text>
        </Button>
        <Button
          w="45%"
          bg={bg}
          startIcon={<FontAwesome5 name="random" size={16} color={accent} />}
          onPress={handleShuffle}
        >
          <Text color={accent}>Shuffle</Text>
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
          width={Dimensions.get("window").width - 90}
          alignSelf="flex-end"
        />
      )}
      renderItem={({ item }) => (
        <Box mx={4}>
          <HStack w="100%" justifyContent="space-between" alignItems="center">
            <HStack w="80%">
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
                w="90%"
              >
                <Text isTruncated fontSize="lg">
                  {" "}
                  {item.name}{" "}
                </Text>
                {Boolean(item.description) && (
                  <Text
                    isTruncated
                    fontSize="sm"
                    paddingLeft="4px"
                    color="gray.500"
                  >
                    {item.description}
                  </Text>
                )}
              </VStack>
            </HStack>
            <Text fontSize="xs" color="gray.500">
              {item?.duration
                ? new Date(item.duration).toISOString().substr(11, 8)
                : "Manual"}
            </Text>
          </HStack>
        </Box>
      )}
      keyExtractor={({ name, cycleIdx, index }) => name + cycleIdx + index}
    />
  );
};

const Player = ({
  currentActivity,
  routine,
  ...props
}: {
  currentActivity: any;
  routine: any[];
  duration: number;
  isRunning: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  isPaused: boolean;
  handleNext: () => void;
  handlePlay: () => void;
  handlePause: () => void;
  handlePrev: () => void;
  handleStop: () => void;
}) => {
  const bigImageSize = Dimensions.get("window").width * 0.6;
  return (
    <Box bg="black" height="100%">
      <Center>
        <VStack m={5}>
          {Boolean(currentActivity?.image) && (
            <Box shadow={9} alignSelf="center" w={bigImageSize} h={bigImageSize} bg="white">
              <Image
                resizeMode="stretch"
                w={bigImageSize}
                h={bigImageSize}
                alt={currentActivity.name}
                source={{
                  uri: props.isPaused
                    ? currentActivity.image?.still
                    : currentActivity.image?.gif ||
                      currentActivity.image?.still,
                }}
              />
            </Box>
          )}
          <Heading color="white" mt={10}>
            {currentActivity?.name}
          </Heading>
          <Text fontSize="lg" color={COLOR_HIGHLIGHT}>
            {currentActivity?.description || "this is a test description"}
          </Text>
          {currentActivity?.duration && (
            <Box my={5}>
              <SeekBar
                id={routine.id.toString()}
                trackLength={currentActivity.duration}
              />
            </Box>
          )}
          <Controls {...props} id={routine.id} />
        </VStack>
      </Center>
    </Box>
  );
};

export default (props) => {
  const bg = useColorModeValue("gray.200", "gray.800");
  const accent = useColorModeValue(COLOR_ACCENT, COLOR_HIGHLIGHT);

  return Boolean(props.isRunning) ? (
    <Player {...props} bg={bg} accent={accent} />
  ) : (
    <PlayListView {...props} bg={bg} accent={accent} />
  );
};
