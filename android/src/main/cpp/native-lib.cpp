/*
 * The JNI layer between the native Java code and the Node.js bridge.
 */

#include <jni.h>
#include <string>
#include <stdlib.h>
#include <cstdlib>
#include <pthread.h>
#include <unistd.h>
#include <android/log.h>

#include "node.h"
#include "bridge.h"

const char *AdbTag = "NodeJS-Engine";

// Forward declaration.
int startRedirectingStdoutStderr();

// Cache the variables for the thread running node to call into Java.
JNIEnv *cacheEnvPointer = NULL;
jobject cacheClassObject = NULL;

void receiveMessageFromNode(const char *channelName, const char *channelMessage)
{
    JNIEnv *env = cacheEnvPointer;
    jobject object = cacheClassObject;

    if (!env || !object)
        return;

    // Try to find the class.
    jclass javaClass = env->GetObjectClass(object);
    if (javaClass != nullptr)
    {
        // Find the method.
        jmethodID javaSendMessageMethod = env->GetMethodID(javaClass, "receiveMessageFromNode", "(Ljava/lang/String;Ljava/lang/String;)V");

        if (javaSendMessageMethod != nullptr)
        {
            jstring javaChannel = env->NewStringUTF(channelName);
            jstring javaMessage = env->NewStringUTF(channelMessage);

            // Call the method.
            env->CallVoidMethod(object, javaSendMessageMethod, javaChannel, javaMessage);

            // Release the JNI references.
            env->DeleteLocalRef(javaChannel);
            env->DeleteLocalRef(javaMessage);
        }

        env->DeleteLocalRef(javaClass);
    }
}

extern "C" JNIEXPORT void JNICALL
Java_net_hampoelz_capacitor_nodejs_CapacitorNodeJS_sendMessageToNode(
    JNIEnv *env,
    jobject /* this */,
    jstring channelName,
    jstring channelMessage)
{
    const char *nativeChannel = env->GetStringUTFChars(channelName, 0);
    const char *nativeMessage = env->GetStringUTFChars(channelMessage, 0);

    SendMessageToNode(nativeChannel, nativeMessage);

    // Release the JNI references.
    env->ReleaseStringUTFChars(channelName, nativeChannel);
    env->ReleaseStringUTFChars(channelMessage, nativeMessage);
}

// Node's libUV requires all arguments being on contiguous memory.
extern "C" jint JNICALL
Java_net_hampoelz_capacitor_nodejs_CapacitorNodeJS_startNodeWithArguments(
    JNIEnv *env,
    jobject object /* this */,
    jobjectArray arguments,
    jstring nodePath,
    jboolean redirectOutputToLogcat)
{
    // Node's libuv requires all arguments being on contiguous memory.
    const char* path_path = env->GetStringUTFChars(nodePath, 0);
    setenv("NODE_PATH", path_path, 1);
    env->ReleaseStringUTFChars(nodePath, path_path);

    // argc
    jsize argumentCount = env->GetArrayLength(arguments);

    // Compute byte size need for all arguments in contiguous memory.
    int argumentsSize = 0;
    for (int i = 0; i < argumentCount; i++)
    {
        jstring arg = (jstring)env->GetObjectArrayElement(arguments, i);
        const char *argContents = env->GetStringUTFChars(arg, 0);

        argumentsSize += strlen(argContents);
        argumentsSize++; // for '\0'

        // Release the JNI references.
        env->ReleaseStringUTFChars(arg, argContents);
        env->DeleteLocalRef(arg);
    }

    // Stores arguments in contiguous memory.
    char *argsBuffer = (char *)calloc(argumentsSize, sizeof(char));

    // argv to pass into node.
    char *argv[argumentCount];

    // To iterate through the expected start position of each argument in argsBuffer.
    char *currentArgsPosition = argsBuffer;

    // Populate the argsBuffer and argv.
    for (int i = 0; i < argumentCount; i++)
    {
        jstring arg = (jstring)env->GetObjectArrayElement(arguments, i);
        const char *currentArgument = env->GetStringUTFChars(arg, 0);

        // Copy current argument to its expected position in argsBuffer
        strncpy(currentArgsPosition, currentArgument, strlen(currentArgument));

        // Release the JNI references.
        env->ReleaseStringUTFChars(arg, currentArgument);
        env->DeleteLocalRef(arg);

        // Save current argument start position in argv
        argv[i] = currentArgsPosition;

        // Increment to the next argument's expected position.
        currentArgsPosition += strlen(currentArgsPosition) + 1;
    }

    if (redirectOutputToLogcat == true)
    {
        // Start threads to show stdout and stderr in logcat.
        if (startRedirectingStdoutStderr() == -1)
            __android_log_write(ANDROID_LOG_ERROR, AdbTag, "Couldn't start redirecting stdout and stderr to logcat.");
    }

    RegisterCallback(&receiveMessageFromNode);

    cacheEnvPointer = env;
    cacheClassObject = object;

    // Start node, with argc and argv.
    int exitCode = node::Start(argumentCount, argv);
    free(argsBuffer);

    return jint(exitCode);
}

// Start threads to redirect stdout and stderr to logcat.
int stdoutPipe[2];
int stderrPipe[2];
pthread_t stdoutThread;
pthread_t stderrThread;

void *stderrThreadFunc(void *)
{
    ssize_t redirectSize;
    char buf[2048];
    while ((redirectSize = read(stderrPipe[0], buf, sizeof buf - 1)) > 0)
    {
        // __android_log will add a new line anyway.
        if (buf[redirectSize - 1] == '\n')
            --redirectSize;
        buf[redirectSize] = 0;
        __android_log_write(ANDROID_LOG_ERROR, AdbTag, buf);
    }
    return 0;
}

void *stdoutThreadFunc(void *)
{
    ssize_t redirectSize;
    char buf[2048];
    while ((redirectSize = read(stdoutPipe[0], buf, sizeof buf - 1)) > 0)
    {
        // __android_log will add a new line anyway.
        if (buf[redirectSize - 1] == '\n')
            --redirectSize;
        buf[redirectSize] = 0;
        __android_log_write(ANDROID_LOG_INFO, AdbTag, buf);
    }
    return 0;
}

int startRedirectingStdoutStderr()
{
    // Set stdout as unbuffered.
    setvbuf(stdout, 0, _IONBF, 0);
    pipe(stdoutPipe);
    dup2(stdoutPipe[1], STDOUT_FILENO);

    // Set stderr as unbuffered.
    setvbuf(stderr, 0, _IONBF, 0);
    pipe(stderrPipe);
    dup2(stderrPipe[1], STDERR_FILENO);

    if (pthread_create(&stdoutThread, 0, stdoutThreadFunc, 0) == -1)
        return -1;
    pthread_detach(stdoutThread);

    if (pthread_create(&stderrThread, 0, stderrThreadFunc, 0) == -1)
        return -1;
    pthread_detach(stderrThread);

    return 0;
}