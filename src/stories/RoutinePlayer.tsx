import React from "react";
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
const humanizeDuration = require("humanize-duration");

export const PlayListView = ({
  currentActivity,
  routine,
  handleStart,
  handleShuffle,
}) => {
  const { name, description, totalTime, activities } = routine;
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

  const secondsText =
    humanizeDuration(totalTime, { delimiter: " " }) + " total";
  return (
    <FlatList
      data={data}
      ListHeaderComponent={() => (
        <>
          <Center>
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
            <Text fontSize="lg">{description}</Text>
          </Center>
          <HStack justifyContent="space-between" my={4}>
            <Button w="45%" onPress={handleStart}>
              Play
            </Button>
            <Button w="45%" onPress={handleShuffle}>
              Shuffle
            </Button>
          </HStack>
        </>
      )}
      ListFooterComponent={() => (
        <Text
          my={3}
          color="gray.500"
        >{`${activities.length} activities, ${secondsText}`}</Text>
      )}
      renderItem={({ item }) => (
        <Box px={5} py={2} rounded="md" my={2} bg="primary.300">
          {item.title}
        </Box>
      )}
      keyExtractor={(item) => item.id}
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
