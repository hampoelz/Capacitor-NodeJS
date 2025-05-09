/*
 * The JNI layer between the native Java code and the Node.js bridge.
 */

#include <jni.h>
#include <string>
#include <cstdlib>
#include <pthread.h>
#include <unistd.h>
#include <android/log.h>

#include "node.h"
#include "bridge.h"

const char* AdbTag = "NodeJS-Engine";

// Forward declaration.
int startRedirectingStdoutStderr();

// Cache the variables for the thread running node to call into Java.
JNIEnv* cacheEnvPointer = nullptr;
jobject cacheClassObject = nullptr;

void receiveMessageFromNode(const char* channelName, const char* channelMessage)
{
    auto env = cacheEnvPointer;
    auto object = cacheClassObject;

    if (!env || !object)
        return;

    // Try to find the class.
    auto javaClass = env->GetObjectClass(object);
    if (javaClass != nullptr)
    {
        // Find the method.
        auto javaSendMessageMethod = env->GetMethodID(javaClass, "nativeReceive", "(Ljava/lang/String;Ljava/lang/String;)V");
        if (javaSendMessageMethod != nullptr)
        {
            auto javaChannel = env->NewStringUTF(channelName);
            auto javaMessage = env->NewStringUTF(channelMessage);

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
Java_net_hampoelz_capacitor_nodejs_NodeProcess_nativeSend(
    JNIEnv* env,
    jobject /* this */,
    jstring channelName,
    jstring channelMessage)
{
    const char* nativeChannel = env->GetStringUTFChars(channelName, nullptr);
    const char* nativeMessage = env->GetStringUTFChars(channelMessage, nullptr);

    SendMessageToNode(nativeChannel, nativeMessage);

    // Release the JNI references.
    env->ReleaseStringUTFChars(channelName, nativeChannel);
    env->ReleaseStringUTFChars(channelMessage, nativeMessage);
}

// Node's libUV requires all arguments being on contiguous memory.
extern "C" jint JNICALL
Java_net_hampoelz_capacitor_nodejs_NodeProcess_nativeStart(
    JNIEnv* env,
    jobject object /* this */,
    jobjectArray arguments,
    jobjectArray environmentVariables,
    jboolean redirectOutputToLogcat)
{
    auto environmentVariablesCount = env->GetArrayLength(environmentVariables);
    for (int i = 0; i < environmentVariablesCount; i++) {
        auto environmentVariablePair = (jobjectArray)env->GetObjectArrayElement(environmentVariables, i);
        auto environmentVariablePairSize = env->GetArrayLength(environmentVariablePair);
        if (environmentVariablePairSize != 2) {
            continue;
        }

        auto key = (jstring)env->GetObjectArrayElement(environmentVariablePair, 0);
        auto value = (jstring)env->GetObjectArrayElement(environmentVariablePair, 1);

        // Node's libuv requires all arguments being on contiguous memory.
        const char* keyContents = env->GetStringUTFChars(key, nullptr);
        const char* valueContents = env->GetStringUTFChars(value, nullptr);

        setenv(keyContents, valueContents, 1);

        env->ReleaseStringUTFChars(key, keyContents);
        env->ReleaseStringUTFChars(value, valueContents);

        env->DeleteLocalRef(key);
        env->DeleteLocalRef(value);
        env->DeleteLocalRef(environmentVariablePair);
    }

    // argc
    auto argumentCount = env->GetArrayLength(arguments);

    // Compute byte size need for all arguments in contiguous memory.
    size_t argumentsSize = 0;
    for (int i = 0; i < argumentCount; i++)
    {
        auto arg = (jstring)env->GetObjectArrayElement(arguments, i);
        const char* argContents = env->GetStringUTFChars(arg, nullptr);

        argumentsSize += strlen(argContents);
        argumentsSize++; // for '\0'

        // Release the JNI references.
        env->ReleaseStringUTFChars(arg, argContents);
        env->DeleteLocalRef(arg);
    }

    // Stores arguments in contiguous memory.
    char* argsBuffer = (char*)calloc(argumentsSize, sizeof(char));

    // argv to pass into node.
    char* argv[argumentCount];

    // To iterate through the expected start position of each argument in argsBuffer.
    char* currentArgsPosition = argsBuffer;

    // Populate the argsBuffer and argv.
    for (int i = 0; i < argumentCount; i++)
    {
        auto arg = (jstring)env->GetObjectArrayElement(arguments, i);
        const char* currentArgument = env->GetStringUTFChars(arg, nullptr);

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
    auto exitCode = node::Start(argumentCount, argv);
    free(argsBuffer);

    return jint(exitCode);
}

// Start threads to redirect stdout and stderr to logcat.
int stdoutPipe[2];
int stderrPipe[2];
pthread_t stdoutThread;
pthread_t stderrThread;

void* stderrThreadFunc(void*)
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
    return nullptr;
}

void* stdoutThreadFunc(void*)
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
    return nullptr;
}

int startRedirectingStdoutStderr()
{
    // Set stdout as unbuffered.
    setvbuf(stdout, nullptr, _IONBF, 0);
    pipe(stdoutPipe);
    dup2(stdoutPipe[1], STDOUT_FILENO);

    // Set stderr as unbuffered.
    setvbuf(stderr, nullptr, _IONBF, 0);
    pipe(stderrPipe);
    dup2(stderrPipe[1], STDERR_FILENO);

    if (pthread_create(&stdoutThread, nullptr, stdoutThreadFunc, nullptr) != 0)
        return -1;
    pthread_detach(stdoutThread);

    if (pthread_create(&stderrThread, nullptr, stderrThreadFunc, nullptr) != 0)
        return -1;
    pthread_detach(stderrThread);

    return 0;
}
