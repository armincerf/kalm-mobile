import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Button, useColorMode } from "native-base";
import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActiveRoutine from "./ActiveRoutine";
import { TAB_HEIGHT, COLOR_ACCENT, COLOR_HIGHLIGHT } from "./utils";

export function TabBar({ state, descriptors, navigation, ...props }) {
  const focusedOptions = descriptors[state.routes[state.index].key].options;
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { colorMode, toggleColorMode } = useColorMode();
  if (focusedOptions.tabBarVisible === false) {
    return null;
  }

  useEffect(() => {
    //silly hack because of some reagent weirdness with hooks :/
    if (scheme !== colorMode) {
      toggleColorMode();
    }
  }, [scheme]);

  const Tabs = () => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        height: 50,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        const iconName = options.tabBarTestID;
        const isMiddle = index === 1;
        const tabColor = isMiddle
          ? "white"
          : scheme === "dark"
          ? "#eee"
          : "#222";
        const tabStyle: StyleProp<ViewStyle> = isMiddle
          ? {
              alignItems: "center",
              justifyContent: "center",
              width: TAB_HEIGHT - 10,
              height: TAB_HEIGHT - 10,
              transform: [{ translateY: -13 }],
              backgroundColor: COLOR_ACCENT,
              borderRadius: 50,
            }
          : { alignItems: "center", justifyContent: "center", width: 60 };

        return (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            key={route.key}
            style={tabStyle}
          >
            <Ionicons
              style={{
                paddingLeft: isMiddle ? 4 : 0,
              }}
              name={iconName}
              color={isFocused ? COLOR_HIGHLIGHT : tabColor}
              size={isMiddle ? 48 : 24}
            />
            {Boolean(!isMiddle) && (
              <Text style={{ color: tabColor }}>{label}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <BlurView
      intensity={100}
      tint={scheme}
      style={[styles.blurTab, { paddingBottom: insets.bottom }]}
    >
      <View style={styles.currentRoutines}>
        {Boolean(props?.activeRoutines) &&
          props.activeRoutines
            .filter((r) => r?.currentActivity?.name)
            .map((activityProps, index) => {
              return (
                <ActiveRoutine
                  key={index}
                  {...props}
                  {...activityProps}
                  index={index}
                  isDark={scheme === "dark"}
                />
              );
            })}
      </View>
      <Tabs />
    </BlurView>
  );
}
const styles = StyleSheet.create({
  currentRoutines: {
   width: "100%", 
  },
  blurTab: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
