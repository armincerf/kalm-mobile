import React from "react";
import SwipeableItem, { UnderlayParams } from "react-native-swipeable-item";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { Box, Icon, Text, Pressable } from "native-base";
import { TouchableOpacity, StyleSheet } from "react-native";
import { COLOR_ACCENT } from "./utils";

export const SwipeUnderlay = ({ bg, pressFn, iconName, ...props }) => {
  return (
    <Pressable
      {...props}
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

export const SwipeItem = ({
  item,
  section,
  index,
  drag,
  renderUnderlayLeft,
  handlePress,
}) => {
  const itemRefs = new Map();
  const newItem = { ...item, index };
  const isLast = index === section?.data?.length - 1;
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
      <TouchableOpacity onPress={(e) => handlePress(newItem)}>
        <Box
          _light={{
            bg: item.backgroundColor || "gray.200",
          }}
          _dark={{
            bg: item.backgroundColor || "#111",
          }}
          style={[styles.row, isLast && !item.height && styles.lastRow]}
        >
          {Boolean(drag) && (
            <TouchableOpacity style={styles.dragHandle} onPressIn={drag}>
              <MaterialCommunityIcons name="drag" size={24} color="white" />
            </TouchableOpacity>
          )}
          {Boolean(item?.cycleCount && item.cycleCount >= 1) && (
            <Text style={styles.cycles}>{`${item.cycleCount} Cycles`}</Text>
          )}
          <Text
            style={item.backgroundColor ? styles.text : styles.textNoBg}
            _light={{
              color: item.backgroundColor ? "white" : "black",
            }}
            _dark={{
              color: "white",
            }}
          >
            {item.name}
          </Text>
        </Box>
      </TouchableOpacity>
    </SwipeableItem>
  );
};

const styles = StyleSheet.create({
  row: {
    position: "relative",
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    padding: 16,
  },
  lastRow: {
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  text: {
    fontWeight: "bold",
    fontSize: 24,
  },
  textNoBg: {},
  cycles: {
    color: "lightgrey",
    paddingRight: 16,
    fontSize: 16,
  },
  dragHandle: {
    position: "absolute",
    right: 16,
    height: "100%",
    justifyContent: "center",
    display: "flex",
  },
});
