import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Button,
  Pressable,
  HStack,
  Box,
  Icon,
  FormControl,
  Center,
  StatusBar,
} from "native-base";
import AddRoutine from "./AddRoutine";
import { FormTextInput } from "./FormTextInput";
import { Portal } from "react-native-portalize";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { isWeb, vibrate } from "./utils";
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
import AutocompleteDropdown from "./AutocompleteDropdown";
// this is based on react-native-draggable-flatlist with some modifications to fix errors and improve performance
import DraggableFlatList, { RenderItemParams } from "./draggable-list";
import { Modalize } from "react-native-modalize";

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
  backgroundColor: string;
  height: number;
  hasNotification?: boolean;
  hasGif?: boolean;
  hasDuration?: boolean;
  cycleCount?: number;
  hasCustomImage?: boolean;
  type?: string;
};

type FormValues = {
  routineName: string;
  type?: string;
  routines: Item[];
};

const defaultRoutine = (i: number) => {
  const backgroundColor = getColor(i);
  return {
    name: "",
    index: i,
    description: "",
    duration: null,
    key: `key-${backgroundColor}`,
    backgroundColor,
    height: 80,
    hasNotification: true,
    hasGif: true,
    cycleCount: 1,
  };
};

export default ({
  handleSubmit,
  animated,
  storedRoutine = { activities: [] },
}) => {
  const initialRoutines: Item[] = storedRoutine.activities.map((r, index) => {
    const routine = {
      ...defaultRoutine(index),
      ...r,
    };
    return routine;
  });

  const formMethods = useForm<FormValues>({
    defaultValues: {
      routineName: "",
      type: "",
      routines: initialRoutines,
    },
  });

  const { control, formState, setValue } = formMethods;
  const [allowHaptics, setAllowHaptics] = useState(!isWeb);
  const fieldArrayMethods = useFieldArray({
    control,
    name: "routines",
  });

  const { fields, append, remove, move, update } = fieldArrayMethods;

  const onSubmit = (form: any) => {
    handleSubmit(form);
  };

  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);

  const onErrors = (errors: object) => {
    const error = Object.values(errors)[0];
    setErrors(error.message);
    console.log(error.ref);
    const ref = error.ref?.current || nameRef.current;
    ref.focus();
  };

  const newRoutine = () => {
    return defaultRoutine(fields.length || 0);
  };

  const addRoutine = () => {
    setErrors(null);
    modalizeRef.current?.open();
    if (!editModalState) {
      const routine = newRoutine();
      setEditModalState(routine);
    }
  };

  const resetForm = () => {
    setEditModalState(null);
  };

  const formRoutine = () => {
    if (typeof editModalState?.index === "number") {
      return formMethods.getValues(`routines.${editModalState.index}`);
    }
  };

  const updateRoutine = () => {
    modalizeRef.current?.close();
    update(editModalState.index, { ...editModalState, ...formRoutine() });
    resetForm();
  };

  const itemRefs = new Map();
  const [editModalState, setEditModalState] = useState(null);
  const modalizeRef = useRef<Modalize>(null);
  const editItem = (item: Item) => {
    modalizeRef.current?.open();
    setEditModalState(item);
  };
  const [statusStyle, setStatusStyle] = useState("default");

  const deleteItem = (item: Item) => {
    // Animate list to close gap when item is deleted
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    remove(item.index);
  };

  const SwipeItem = ({ bg, pressFn, iconName }) => {
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

  const renderUnderlayLeft = ({ item, percentOpen }: UnderlayParams<Item>) => (
    <Animated.View
      style={[styles.underlayLeft, { opacity: percentOpen }]} // Fade in on open
    >
      <SwipeItem
        bg="secondary.600"
        pressFn={() => deleteItem(item)}
        iconName="delete"
      />
      <SwipeItem
        bg="primary.600"
        pressFn={() => editItem(item)}
        iconName="edit"
      />
    </Animated.View>
  );

  const renderItem = ({ item, index, drag }: RenderItemParams<Item>) => {
    const newItem: Item = { ...item, index: index };
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
            { backgroundColor: item.backgroundColor, height: item.height },
          ]}
        >
          <TouchableOpacity style={styles.dragHandle} onPressIn={drag}>
            <MaterialCommunityIcons name="drag" size={24} color="white" />
          </TouchableOpacity>
          {Boolean(item.cycleCount >= 1) && (
            <Text style={styles.cycles}>{`${item.cycleCount} Cycles`}</Text>
          )}
          <TouchableOpacity onPress={(e) => editItem(newItem)}>
            <Text style={styles.text}>{item.name}</Text>
          </TouchableOpacity>
        </Box>
      </SwipeableItem>
    );
  };
console.log(statusStyle);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "space-between",
        marginTop: 20,
        marginBottom: 40,
        borderRadius: 3,
      }}
    >
      <StatusBar barStyle={statusStyle} />
      <Portal>
        <Modalize
          handlePosition="inside"
          onOpen={() => { setStatusStyle("light-content"); }}
          onClose={() => { setStatusStyle("default"); }}
          handleStyle={{
            top: 13,
            width: 40,
            height: 6,
            backgroundColor: "#bcc0c1",
          }}
          ref={modalizeRef}
          panGestureAnimatedValue={animated}
        >
          <Box m={4}>
            <HStack justifyContent="space-between">
              <Button
                size="md"
                variant="ghost"
                onPress={() => modalizeRef.current.close()}
              >
                Cancel
              </Button>
              <Button size="md" variant="ghost" onPress={updateRoutine}>
                Save
              </Button>
            </HStack>
            {editModalState ? (
              <AddRoutine
                {...formMethods}
                field={editModalState}
                index={editModalState.index}
              />
            ) : (
              <Text>Loading...</Text>
            )}
          </Box>
        </Modalize>
      </Portal>
      <Box m={2}>
        <FormTextInput
          {...formMethods}
          name="routineName"
          label="Routine Name"
          rules={{ required: "Routine Name is required!" }}
          onSubmitEditing={addRoutine}
          ref={nameRef}
          returnKeyType="next"
        />
        <Box zIndex={10}>
          <FormControl.Label>Type of activity (optional)</FormControl.Label>
          <Controller
            control={control}
            rules={{
              required: false,
            }}
            render={(controlprops) => (
              <AutocompleteDropdown {...controlprops} set={setValue} />
            )}
            name="type"
            defaultValue=""
          />
        </Box>
      </Box>

      {fields.length ? (
        <DraggableFlatList
          scrollEnabled={true}
          onPlaceholderIndexChange={(index: number) => {
            if (0 <= index) {
              console.log("placeholder", index);
              if (allowHaptics) {
                vibrate();
              }
            }
          }}
          keyExtractor={(item: { key: any }) => item.key}
          data={fields}
          renderItem={renderItem}
          onDragEnd={({ from, to }) => {
            setAllowHaptics(false);
            move(from, to);
            if (!isWeb) {
              setTimeout(() => setAllowHaptics(true), 100);
            }
          }}
          activationDistance={20}
        />
      ) : (
        <Center>
          <Text>No Activities... :(</Text>
        </Center>
      )}
      <Box>
        <Button onPress={addRoutine} m={2}>
          Add Step
        </Button>
        <FormControl>
          <Button m={2} onPress={formMethods.handleSubmit(onSubmit, onErrors)}>
            Submit
          </Button>
          {typeof errors === "string" && (
            <FormControl.Label m={2} textColor="red">
              {errors}
            </FormControl.Label>
          )}
        </FormControl>
      </Box>
    </View>
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
