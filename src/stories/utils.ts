import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import React, { useState, useEffect, useRef } from "react";
import { Text, View, Button, Platform } from "react-native";
import * as TaskManager from "expo-task-manager";
import * as Device from "expo-device";

const getDeviceType = (device) => {
  switch (device) {
    case Device.DeviceType.DESKTOP:
      return "desktop";
    case Device.DeviceType.PHONE:
      return "smartphone";
    case Device.DeviceType.TABLET:
      return "tablet";
    case Device.DeviceType.TV:
      return "tv";
    case Device.DeviceType.UNKNOWN:
      return undefined;
  }
};

export const getDeviceInfo = async () => {
  const info = {
    os: {
      name: Device.osName,
      version: Device.osVersion,
    },
    client: {
      name: "React Native",
      type: "app",
      version: Constants.nativeAppVersion,
      build: Constants.nativeBuildVersion,
    },
    device: {
      type: getDeviceType(await Device.getDeviceTypeAsync()),
      brand: Device.brand,
      model: Constants.deviceName || Device.modelName,
      deviceId: Device.modelId,
    },
  };
  console.log("info=", info);
  return info;
};

export const getName = () => {
  const os = Device.osName + " " + Device.osVersion;
  const device = {
    model: Constants.deviceName || Device.modelName,
    deviceId: Device.modelId,
  }
  return `${device.model}, ${device.deviceId} - ${os}`;
};

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  ({ data, error, executionInfo }) => {
    alert("Received a notification in the background!");
    schedulePushNotification();
  }
);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function schedulePushNotification(data) {
  console.log("notif", getDeviceType(await Device.getDeviceTypeAsync()));
  if (data?.activity && data?.activity?.name) {
    await Notifications.scheduleNotificationAsync({
      content: {
        _contentAvailable: true,
        title: data.activity.name,
        body: data.activity?.description || "1 min left!",
        data: { data: "goes here" },
      },

      trigger: null,
    });
  } else {
    console.error("no name in data for notification!", data);
  }
}

export async function registerForPushNotificationsAsync() {
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
