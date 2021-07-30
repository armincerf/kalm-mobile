import { useRef } from 'react';
import { AppState } from 'react-native';
import { analytics } from '@splitbee/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActiveSeconds, resetTime } from './timer';
import { getDeviceInfo } from './utils';
const UID_KEY = 'splitbee_uid';
const USERID_KEY = 'splitbee_userId';
let projectToken;
let uid;
let userId;
let requestId;
let lastPage;
const generateUid = () => Math.random()
    .toString(36)
    .substring(7);
const loadUid = async () => {
    uid = uid || (await AsyncStorage.getItem('splitbee_uid')) || undefined;
    userId =
        userId || (await AsyncStorage.getItem('splitbee_userId')) || undefined;
};

const sendEnd = async (closeApp) => {
    if (requestId) {
        await analytics.end({
            requestId,
            data: {
                duration: getActiveSeconds(),
                ...(closeApp && { destination: 'close' }),
            },
            context: { projectId: projectToken, uid, userId },
        });
    }
    resetTime();
};
const onChange = async (state) => {
    if (state === 'background' && requestId) {
        await sendEnd(true);
    }
    else if (state === 'active') {
        if (lastPage) {
            splitbee.screen(lastPage);
        }
    }
};
const processResponse = async (response) => {
    if (response?.uid) {
        uid = response.uid;
        await AsyncStorage.setItem(UID_KEY, response.uid);
    }
};
const getContext = async () => ({
    projectId: projectToken,
    uid,
    userId,
    device: await getDeviceInfo(),
});
const splitbee = {
    init: (token) => {
        projectToken = token;
        loadUid();
    },
    setUserId: (id) => {
        userId = id;
        AsyncStorage.setItem(USERID_KEY, id)
            .then(() => { })
            .catch(() => { });
    },
    screen: async (page) => {
        sendEnd();
        requestId = generateUid();
        if (projectToken) {
            lastPage = page;
            const response = await analytics.page({
                page,
                data: {
                    requestId,
                },
                context: await getContext(),
            });
            processResponse(response);
        }
    },
    track: async (event, data) => {
        if (projectToken) {
            const response = await analytics.track({
                event,
                data,
                context: await getContext(),
            });
            processResponse(response);
        }
    },
    identify: async (userData) => {
        if (projectToken) {
            const response = await analytics.identify({
                userData,
                context: await getContext(),
            });
            processResponse(response);
        }
    },
};
export default splitbee;
