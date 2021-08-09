import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Haptics from "expo-haptics";

export const isWeb = Platform.OS === "web";

export const vibrate = (intensity = "medium") => {
  if (!isWeb) {
    let hapticIntensity: Haptics.ImpactFeedbackStyle;
    switch (intensity) {
      case "light":
        hapticIntensity = Haptics.ImpactFeedbackStyle.Light;
        break;
      case "medium":
        hapticIntensity = Haptics.ImpactFeedbackStyle.Medium;
        break;
      case "hard":
        hapticIntensity = Haptics.ImpactFeedbackStyle.Heavy;
        break;
      default:
        hapticIntensity = Haptics.ImpactFeedbackStyle.Medium;
    }
    Haptics.impactAsync(hapticIntensity);
  }
};

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
  return info;
};
export const getName = () => {
  const os = Device.osName + " " + Device.osVersion;
  const device = {
    model: Constants.deviceName || Device.modelName,
    deviceId: Device.modelId,
  };
  return `${device.model}, ${device.deviceId} - ${os}`;
};

export const COLOR_ACCENT = "#0891b2";
export const COLOR_HIGHLIGHT = "#A5F3FC";
export const TAB_HEIGHT = 70;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function schedulePushNotification(activity, seconds, callback) {
  if (activity && activity?.name && seconds) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        _contentAvailable: true,
        title: `It's time to start '${activity.name}'!`,
        body: activity?.description || activity?.message || "Have fun!",
        ios: { sound: true },
        sound: "default",
      },

      trigger: { seconds: seconds },
    });
    callback(id);
  }
}

export async function registerForPushNotificationsAsync() {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
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
      lightColor: COLOR_ACCENT,
    });
  }

  return token;
}

export function useInterval(callback: () => void, interval: number = 1000) {
  const callbackRef = useRef<any>(null);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const tick = () => {
      callbackRef.current && callbackRef.current();
    };

    let id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval]);
}

export const useCombinedRefs = (...refs) => {
  const targetRef = useRef();

  useEffect(() => {
    refs.forEach((ref) => {
      if (!ref) {
        return;
      }

      if (typeof ref === "function") {
        ref(targetRef.current);
      } else {
        ref.current = targetRef.current;
      }
    });
  }, [refs]);

  return targetRef;
};
