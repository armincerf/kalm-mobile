import React, { useEffect } from "react";
import { Text, Progress, HStack } from "native-base";
import { View, StyleSheet } from "react-native";
import { COLOR_HIGHLIGHT, useInterval } from "./utils";
import Timeout from "smart-timeout";
import ProgressBar from "react-native-progress/Bar";

function pad(n, width, z = 0) {
  n = n.toFixed(0) + "";
  return n.length >= width
    ? n
    : new Array(width - n.length + 1).join(z.toString()) + n;
}

const minutesAndSeconds = (position) => [
  pad(Math.floor(position / 60), 2),
  pad(position % 60, 2),
];

const SeekBar = ({ trackLength, id }) => {
  const [currentPosition, setCurrentPosition] = React.useState(0);
  const position = () =>
    Timeout.exists(id) ? Timeout.remaining(id) / 1000 : 0;
  const duration = trackLength / 1000;
  useInterval(() => setCurrentPosition(position()), 100);
  const elapsed = minutesAndSeconds(duration - currentPosition);
  const remaining = minutesAndSeconds(currentPosition);
  const darkColor = "black";
  const lightGrayColor = "lightgray";
  const SeekText = ({ children }) => (
    <Text fontSize="xs" py={1}>
      {children}
    </Text>
  );
  return (
    <>
      <ProgressBar
        color={COLOR_HIGHLIGHT}
        useNativeDriver
        animationConfig={{ bounciness: 0 }}
        progress={(duration - currentPosition) / duration}
        width={null}
      />
      <HStack justifyContent="space-between">
        <SeekText>{elapsed[0] + ":" + elapsed[1]}</SeekText>
        <SeekText>
          {trackLength > 1 && "-" + remaining[0] + ":" + remaining[1]}
        </SeekText>
      </HStack>
    </>
  );
};

export default SeekBar;

const styles = StyleSheet.create({
  slider: {
    marginTop: -12,
  },
  container: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 16,
  },
  track: {
    height: 2,
    borderRadius: 1,
  },
  thumb: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  text: {
    textAlign: "center",
  },
});
