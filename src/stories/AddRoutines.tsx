import React, { useCallback, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button, HStack, Box } from "native-base";
import AddRoutine from "./AddRoutine";
import { FormTextInput } from "./FormTextInput";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  LayoutAnimation,
  TouchableOpacity,
  Platform,
  UIManager,
} from "react-native";
import Animated from "react-native-reanimated";
import SwipeableItem, { UnderlayParams } from "react-native-swipeable-item";
// this is based on react-native-draggable-flatlist with some modifications to fix errors and improve performance
import DraggableFlatList, { RenderItemParams } from "./draggable-list";
import { G } from "react-native-svg";

const { multiply, sub } = Animated;
const OVERSWIPE_DIST = 20;

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const NUM_ITEMS = 20;
function getColor(i: number) {
  const multiplier = 255 / (NUM_ITEMS - 1);
  const colorVal = i * multiplier;
  return `rgb(${colorVal}, ${Math.abs(128 - colorVal)}, ${255 - colorVal})`;
}

type Item = {
  name: string;
  index?: number;
  description?: string;
  duration?: number;
  key: string;
  text: string;
  backgroundColor: string;
  height: number;
};

type FormValues = {
  routines: Item[];
};

export default ({ handleSubmit }) => {
  const defaultRoutine = (i: number) => {
    const backgroundColor = getColor(i);
    return {
      name: "Activity",
      index: i,
      description: "description",
      duration: null,
      key: `key-${backgroundColor}`,
      backgroundColor,
      height: 80,
    };
  };

  const formMethods = useForm<FormValues>({
    defaultValues: {
      routines: [defaultRoutine(0), defaultRoutine(1), defaultRoutine(2)],
    },
  });

  const { control } = formMethods;
  const fieldArrayMethods = useFieldArray({
    control,
    name: "routines",
  });

  const { fields, append, remove, move } = fieldArrayMethods;

  const initialFieldData = fields.map((routine, index) => {
    return {
      text: routine.name,
    };
  });
  const onSubmit = (form) => {
    handleSubmit(form);
  };

  const onErrors = (errors) => {
    console.warn(errors);
  };

  const firstRef = useRef<any>(null);

  const focusFirst = useCallback(() => firstRef?.current?.focus(), [firstRef]);

  const appendRoutine = () => {
    console.log("open create view");
    append(defaultRoutine(fields.length));
  };

  const itemRefs = new Map();

  const deleteItem = (item) => {
    // Animate list to close gap when item is deleted
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    remove(item.index);
  };

  const renderUnderlayLeft = ({ item, percentOpen }: UnderlayParams<Item>) => (
    <Animated.View
      style={[styles.underlayLeft, { opacity: percentOpen }]} // Fade in on open
    >
      <TouchableOpacity onPressOut={() => editItem(item)}>
        <Text style={styles.blue}>{`Edit`}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPressOut={() => deleteItem(item)}>
        <Text style={styles.red}>{`Delete`}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
  const renderItem = ({ item, index, drag }: RenderItemParams<Item>) => {
    const newItem: Item = { ...item, index: index };
    return (
      <SwipeableItem
        key={item.key}
        item={newItem}
        ref={(ref) => {
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
            { backgroundColor: item.backgroundColor, height: item.height },
          ]}
        >
          <TouchableOpacity style={styles.dragHandle} onPressIn={drag}>
            <Text>dragme</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={(e) => console.log("press", index, item)}>
            <Text style={styles.text}>{item.name}</Text>
          </TouchableOpacity>
        </Box>
      </SwipeableItem>
    );
  };

  return (
    <View style={styles.container}>
      <Box m={2}>
        <FormTextInput
          {...formMethods}
          name="routineName"
          label="Routine Name"
          rules={{ required: "Routine Name is required!" }}
          onSubmitEditing={focusFirst}
          returnKeyType="next"
        />
        <Text style={styles.activitiesText}>Activities:</Text>
      </Box>
      <DraggableFlatList
        scrollEnabled={true}
        keyExtractor={(item) => item.key}
        data={fields}
        renderItem={renderItem}
        onDragEnd={({ from, to }) => move(from, to)}
        activationDistance={20}
      />
      <Button onPress={appendRoutine} m={2}>
        Add step2
      </Button>
      <Button m={2} onPress={formMethods.handleSubmit(onSubmit, onErrors)}>
        Submit
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    marginBottom: 40,
  },
  row: {
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
  red: {
    color: "white",
    backgroundColor: "red",
    width: 50,
    height: "100%",
  },
  blue: {
    color: "white",
    backgroundColor: "blue",
    width: 50,
    height: "100%",
  },
  underlayLeft: {
    flex: 1,
    backgroundColor: "gray",
    justifyContent: "flex-end",
    alignItems: "center",
    flexDirection: "row",
  },
  dragHandle: {
    position: "absolute",
    right: 5,
    height: "100%",
    justifyContent: "center",
    display: "flex",
  },
  activitiesText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 20,
  },
});
