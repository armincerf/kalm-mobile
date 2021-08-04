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
}) => {
  const isPaused = !Timeout.exists(id) || Timeout.paused(id);
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
          color={hasPrev ? "white" : "gray"}
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
            color="white"
          />
        </TouchableOpacity>
      ) : (
        <Button variant="outline" onPress={handleNext}>Mark Complete</Button>
      )}
      <TouchableOpacity
        style={styles.button}
        disabled={!hasNext}
        onPress={handleNext}
      >
        <FontAwesome5
          name="forward"
          size={16}
          color={hasNext ? "white" : "gray"}
        />
      </TouchableOpacity>
    </HStack>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 20,
  },
});
