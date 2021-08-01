import React from "react";
import SwipeableItem, { UnderlayParams } from "react-native-swipeable-item";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { Box, Icon, Text, Pressable } from "native-base";
import { TouchableOpacity, StyleSheet } from "react-native";
import { COLOR_ACCENT } from "./utils";

export const SwipeUnderlay = ({ bg, pressFn, iconName }) => {
  return (
    <Pressable
      bg={bg}
      width={50}
      justifyContent="center"
      alignItems={"center"}
      height="100%"
      _light={{
        borderColor: "dark.200",
        color: "white",
      }}
      _dark={{
        color: "white",
        borderColor: "dark.600",
      }}
      onPress={pressFn}
    >
      <Icon color="white" as={<AntDesign name={iconName} />} size="sm" />
    </Pressable>
  );
};

export const SwipeItem = ({ item, index, drag, renderUnderlayLeft, handlePress }) => {
  const itemRefs = new Map();
  const newItem = { ...item, index };
  return (
    <SwipeableItem
      key={item.key}
      item={newItem}
      ref={(ref: any) => {
        if (ref && !itemRefs.get(item.key)) {
          itemRefs.set(item.key, ref);
        }
      }}
      overSwipe={50}
      renderUnderlayLeft={renderUnderlayLeft}
      snapPointsLeft={[50, 100]}
    >
      <Box
        style={[
          styles.row,
          { backgroundColor: item.backgroundColor || COLOR_ACCENT, height: item.height },
        ]}
      >
        {Boolean(drag) && (
          <TouchableOpacity style={styles.dragHandle} onPressIn={drag}>
            <MaterialCommunityIcons name="drag" size={24} color="white" />
          </TouchableOpacity>
        )}
        {Boolean(item?.cycleCount && item.cycleCount >= 1) && (
          <Text style={styles.cycles}>{`${item.cycleCount} Cycles`}</Text>
        )}
        <TouchableOpacity onPress={(e) => handlePress(newItem)}>
          <Text style={styles.text}>{item.name}</Text>
        </TouchableOpacity>
      </Box>
    </SwipeableItem>
  );
};

const styles = StyleSheet.create({
  row: {
    position: "relative",
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "bold",
    color: "white",
    fontSize: 32,
  },
  cycles: {
    position: "absolute",
    left: 5,
    color: "lightgrey",
    fontSize: 16,
  },
  dragHandle: {
    position: "absolute",
    right: 5,
    height: "100%",
    justifyContent: "center",
    display: "flex",
  },
});
