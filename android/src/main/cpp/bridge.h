/*
 * The bridge APIs between the native Java code and the Node.js engine.
 * https://github.com/nodejs-mobile/nodejs-mobile-cordova/blob/unstable/src/common/cordova-bridge/cordova-bridge.h
 */

#ifndef ANDROID_BRIDGE_H
#define ANDROID_BRIDGE_H

typedef void (*callbackFunction)(const char* channelName, const char* channelMessage);
void RegisterCallback(callbackFunction);
void SendMessageToNode(const char* channelName, const char* channelMessage);

#endif //ANDROID_BRIDGE_H
