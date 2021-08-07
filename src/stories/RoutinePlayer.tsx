import React, { useRef } from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  Box,
  Button,
  View,
  Text,
  Heading,
  Center,
  Image,
  Divider,
  FlatList,
  VStack,
  HStack,
  useColorModeValue,
} from "native-base";
import { Animated, TouchableOpacity, Dimensions } from "react-native";
import { COLOR_ACCENT, COLOR_HIGHLIGHT } from "./utils";
import { Player } from "./PlayerModal";
import { Portal } from "react-native-portalize";
const humanizeDuration = require("humanize-duration");

export const PlayListView = ({
  routine,
  handleStart,
  handleShuffle,
  isRunning,
  currentIdx,
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
          onPress={() => handleStart(0)}
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
      scrollIndicatorInsets={{right: Number.MIN_VALUE}}
      ListHeaderComponent={playerHeader}
      ListFooterComponent={() => (
        <Text
        pb={2}
          m={4}
          color="gray.500"
        >{`${activities.length} activities, ${secondsText}`}</Text>
      )}
      ItemSeparatorComponent={() => (
        <Divider
          width={Dimensions.get("window").width - 90}
          alignSelf="flex-end"
        />
      )}
      renderItem={({ item, index }) => {
        const isDone = isRunning && index < currentIdx;
        const textDec = isDone ? 0.4 : 1;
        return (
          <TouchableOpacity onPress={() => handleStart(index)}>
            <Box mx={4}>
              <HStack
                w="100%"
                justifyContent="space-between"
                alignItems="center"
              >
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
                      <FontAwesome5
                        name="tasks"
                        size={40}
                        p={5}
                        color="white"
                      />
                    )}
                  </Box>

                  <VStack
                    py={1}
                    px={4}
                    alignItems="flex-start"
                    justifyContent="center"
                    w="90%"
                  >
                    <Text isTruncated opacity={textDec} fontSize="lg">
                      {item.name}
                    </Text>
                    {Boolean(item.description) && (
                      <Text
                        isTruncated
                        opacity={textDec}
                        fontSize="sm"
                        paddingLeft="4px"
                      >
                        {item.description}
                      </Text>
                    )}
                  </VStack>
                </HStack>
                <Text fontSize="xs" opacity={textDec} color="gray.500">
                  {item?.duration
                    ? new Date(item.duration).toISOString().substr(11, 8)
                    : "Manual"}
                </Text>
              </HStack>
            </Box>
          </TouchableOpacity>
        );
      }}
      keyExtractor={({ name, cycleIdx, index }) => name + cycleIdx + index}
    />
  );
};

export default ({ handleStart, ...props }) => {
  const bg = useColorModeValue("gray.200", "gray.800");
  const accent = useColorModeValue(COLOR_ACCENT, COLOR_HIGHLIGHT);
  const animated = useRef(new Animated.Value(0)).current;
  const modalRef = useRef(null);
  return (
    <View style={{ flex: 1 }}>
      <Portal>
        <Player
          {...props}
          ref={modalRef}
          animated={animated}
          bg={bg}
          accent={accent}
        />
      </Portal>
      <PlayListView
        {...props}
        handleStart={(i) => {
          modalRef?.current && modalRef.current.open();
          handleStart(i);
        }}
        bg={bg}
        accent={accent}
      />
    </View>
  );
};
