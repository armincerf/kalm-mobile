import { FontAwesome5 } from "@expo/vector-icons";
import { Box, HStack, VStack, Image, Text, Divider } from "native-base";
import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native";
import { SmallControls } from "./Controls";
import { Activity, Routine, RoutineListProps } from "./RoutineList";
import { COLOR_HIGHLIGHT, useInterval } from "./utils";
import ProgressBar from "react-native-progress/Bar";
import Timeout from "smart-timeout";

type Props = {
  // can I really not do ...RoutineListProps or something??
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
  currentActivity: Activity;
  id: string;
  index: number;
  activeRoutines: Routine[];
  isDark: boolean;
};

export default ({
  currentActivity,
  id,
  index,
  activeRoutines,
  handlePress,
  isDark,
  ...props
}: Props) => {
  const [currentPosition, setCurrentPosition] = React.useState(0);
  const position = () => (Timeout.exists(id) ? Timeout.remaining(id) : 0);
  useInterval(() => {
    const pos = position();
    const elapsed = currentActivity.duration - pos;
    const progress = elapsed / currentActivity.duration;
    if (0 < progress && progress < 1) {
      setCurrentPosition(progress);
    }
  }, 100);
  return (
    <Box
      w="100%"
      h={16}
      pb={4}
      px={4}
      pt={2}
      key={id + index}
      borderBottomColor={isDark ? "gray.800" : "gray.200"}
      borderBottomWidth={index >= activeRoutines.length - 1 ? "0px" : "1px"}
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
            {currentActivity?.image ? (
              <Image
                w="43px"
                h="43px"
                resizeMode="stretch"
                borderRadius={5}
                alt={currentActivity.name}
                source={{ uri: currentActivity.image?.still }}
              />
            ) : (
              <FontAwesome5 name="tasks" size={40} p={5} color="white" />
            )}
          </Box>
          <VStack width="80%" justifyContent="space-between">
            <Text
              textTransform="uppercase"
              fontSize={10}
              fontWeight="bold"
              isTruncated
              color="gray.400"
            >
              {currentActivity?.routineName}
            </Text>
            <Text isTruncated>
              {currentActivity?.description
                ? currentActivity?.name + " - " + currentActivity.description
                : currentActivity?.name}
            </Text>
          </VStack>
        </HStack>
        <SmallControls
          {...props}
          id={id}
          duration={currentActivity?.duration}
          iconColor={isDark ? "white" : "black"}
        />
        <TouchableOpacity
          onPress={() => {
            handlePress({ id: id });
          }}
          style={styles.button}
        ></TouchableOpacity>
      </HStack>
      {Boolean(currentActivity?.duration) && (
        <ProgressBar
          color={COLOR_HIGHLIGHT}
          useNativeDriver
          progress={currentPosition}
          width={null}
          borderWidth={0}
          height={2}
        />
      )}
    </Box>
  );
};

const styles = StyleSheet.create({
  button: {
    //ewwwww wtf
    position: "absolute",
    top: -10,
    left: 0,
    width: Dimensions.get("window").width * 0.7,
    height: 60,
    zIndex: 20,
    elevation: 2,
  },
});
