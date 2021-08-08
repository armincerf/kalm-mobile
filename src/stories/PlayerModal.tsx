import { Box, Center, VStack, Heading, Image, Text } from "native-base";
import { Modalize } from "react-native-modalize";
import React, { useRef, forwardRef, useState, useEffect } from "react";
import {
  Dimensions,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Controls, SmallControls } from "./Controls";
import SeekBar from "./SeekBar";
import { COLOR_HIGHLIGHT, useCombinedRefs } from "./utils";
import { Portal } from "react-native-portalize";
import { useColorScheme } from "react-native";

type PlayerProps = {
  animated: any;
  bg: string;
  accent: string;
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
};

const HEADER_HEIGHT = 100;

export const Player = forwardRef(
  ({ animated, currentActivity, routine, ...props }: PlayerProps, ref) => {
    const modalizeRef = useRef(null);
    const combinedRef = useCombinedRefs(ref, modalizeRef);

    const scheme = useColorScheme();
    const isDark = scheme === "dark";
    const [isOpen, setIsOpen] = useState(false);

    const renderContent = () => {
      useEffect(() => {
        if (isOpen && !currentActivity && modalizeRef?.current) {
          console.log("closing");
          modalizeRef.current.close();
        }
      }, [currentActivity]);
      useEffect(() => {
        setTimeout(() => {
          currentActivity &&
            props?.isRunning &&
            props?.hasNext &&
            modalizeRef?.current &&
            modalizeRef.current.open();
        }, 100);
      }, []);
      return (
        <>
          <Animated.View
            style={[
              s.content__cover,
              {
                shadowOpacity: animated.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.35],
                }),
                transform: [
                  {
                    scale: animated.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.18, 1],
                      extrapolate: "clamp",
                    }),
                  }
                ],
                opacity: animated.interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [0, 1, 1],
                  extrapolate: "clamp",
                }),
              },
            ]}
          >
            <Animated.Image
              style={[
                s.content__asset,
                {
                  borderRadius: animated.interpolate({
                    inputRange: [0, 1],
                    outputRange: [32, 8],
                  }),
                },
              ]}
              source={{
                uri:
                  currentActivity?.image?.gif || currentActivity?.image?.still,
              }}
            />
          </Animated.View>

          <VStack alignSelf="center">
            <VStack width={`${Dimensions.get("window").width * 0.8}px`}>
              <Heading color={isDark ? "white" : "black"} mt={10} mb={4}>
                {currentActivity?.name}
              </Heading>
              {Boolean(currentActivity?.description) && (
                <Text fontSize="lg" color={COLOR_HIGHLIGHT} mb={2}>
                  {currentActivity.description}
                </Text>
              )}
              {currentActivity?.duration && (
                <Box my={5}>
                  <SeekBar
                    id={routine.id.toString()}
                    trackLength={currentActivity.duration}
                  />
                </Box>
              )}
            </VStack>
            <Controls
              {...props}
              modalRef={combinedRef}
              id={routine.id}
              isDark={isDark}
            />
          </VStack>
        </>
      );
    };

    return (
      <Modalize
        ref={combinedRef}
        panGestureAnimatedValue={animated}
        onClose={() => setIsOpen(false)}
        onOpen={() => setIsOpen(true)}
        handlePosition="inside"
        modalStyle={{
          backgroundColor: isDark ? "#000" : "#fff",
          zIndex: 5,

          marginTop: "auto",

          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,

          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 12,

          elevation: 4,
        }}
        handleStyle={{
          top: 13,
          width: 40,
          height: 6,
          backgroundColor: "#bcc0c1",
        }}
      >
        {renderContent()}
      </Modalize>
    );
  }
);

const s = StyleSheet.create({
  content__cover: {
    zIndex: 100,
    alignSelf: "center",
    marginTop: HEADER_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 32,
    width: Dimensions.get("window").width * 0.9,
    height: Dimensions.get("window").width * 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },

  content__asset: {
    width: "100%",
    height: "100%",
  },

  content__title: {
    paddingLeft: 90,
    marginRight: "auto",

    fontSize: 18,
  },
});
