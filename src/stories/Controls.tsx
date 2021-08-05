import { FontAwesome5 } from "@expo/vector-icons";
import { Button, HStack } from "native-base";
import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import Timeout from "smart-timeout";

export const Controls = ({
  handlePrev,
  handleNext,
  handlePlay,
  handlePause,
  hasPrev,
  hasNext,
  duration,
  id,
  ...props
}) => {
  const isPaused = !Timeout.exists(id) || Timeout.paused(id);
  const iconColor = props.isDark ? "#fff" : "#000";
  return (
    <HStack justifyContent="space-around" alignItems="center">
      <TouchableOpacity
        style={styles.button}
        disabled={!hasPrev}
        onPress={handlePrev}
      >
        <FontAwesome5
          name="backward"
          size={16}
          color={hasPrev ? iconColor : "gray"}
        />
      </TouchableOpacity>
      {Boolean(duration) ? (
        <TouchableOpacity
          style={styles.button}
          onPress={isPaused ? handlePlay : handlePause}
        >
          <FontAwesome5
            name={isPaused ? "play" : "pause"}
            size={24}
            color={iconColor}
          />
        </TouchableOpacity>
      ) : (
        <Button variant="outline" onPress={handleNext}>
          Mark Complete
        </Button>
      )}
      <TouchableOpacity
        style={styles.button}
        disabled={!hasNext}
        onPress={handleNext}
      >
        <FontAwesome5
          name="forward"
          size={16}
          color={hasNext ? iconColor : "gray"}
        />
      </TouchableOpacity>
    </HStack>
  );
};

export const SmallControls = ({
  handlePrev,
  handleNext,
  handlePlay,
  handlePause,
  hasNext,
  duration,
  id,
  iconColor,
}) => {
  const isPaused = !Timeout.exists(id) || Timeout.paused(id);
  return (
    <>
      {Boolean(duration) ? (
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.button}
          onPress={isPaused ? handlePlay : handlePause}
        >
          <FontAwesome5
            name={isPaused ? "play" : "pause"}
            size={24}
            color={iconColor}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.button}
          onPress={handleNext}
        >
          <FontAwesome5
            name={"check"}
            size={24}
            color={iconColor}
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.button}
        disabled={!hasNext}
        onPress={handleNext}
      >
        <FontAwesome5
          name="forward"
          size={16}
          color={hasNext ? iconColor : "gray"}
        />
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    marginRight: 10,
  },
});
