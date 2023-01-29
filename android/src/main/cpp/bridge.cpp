/*
 * Implements the bridge APIs between the native Java code and the Node.js engine.
 */

#include <map>
#include <mutex>
#include <queue>
#include <string>

#include "uv.h"
#include "bridge.h"
#include "node_api.h"

#define NM_F_LINKED 0x2

// Forward declarations
void FlushMessageQueue(uv_async_t *handle);

// Channel class
class Channel
{
private:
  napi_env env = NULL;
  napi_ref functionRef = NULL;
  uv_async_t *uvHandleQueue = NULL;
  std::mutex uvHandleMutex;
  std::mutex mutexQueue;
  std::queue<char *> messageQueue;
  std::string name;
  bool initialized = false;

public:
  Channel(std::string name) : name(name){};

  // Set up the channel's node api data. This method can be called only once per channel.
  void setNapiRefs(napi_env &env, napi_ref &functionRef)
  {
    this->uvHandleMutex.lock();

    if (this->uvHandleQueue == NULL)
    {
      this->env = env;
      this->functionRef = functionRef;

      this->uvHandleQueue = (uv_async_t *)malloc(sizeof(uv_async_t));
      uv_async_init(uv_default_loop(), this->uvHandleQueue, FlushMessageQueue);
      this->uvHandleQueue->data = (void *)this;
      initialized = true;
      uv_async_send(this->uvHandleQueue);
    }
    else
      napi_throw_error(env, NULL, "Channel already exists.");

    this->uvHandleMutex.unlock();
  };

  // Add a new message to the channel's queue and notify libuv to
  // call us back to do the actual message delivery.
  void queueMessage(char *message)
  {
    this->mutexQueue.lock();
    this->messageQueue.push(message);
    this->mutexQueue.unlock();

    if (initialized)
      uv_async_send(this->uvHandleQueue);
  };

  // Process one message at the time, to simplify synchronization between
  // threads and minimize lock retention.
  void flushQueue()
  {
    char *message = NULL;
    bool empty = true;

    this->mutexQueue.lock();
    if (!(this->messageQueue.empty()))
    {
      message = this->messageQueue.front();
      this->messageQueue.pop();
      empty = this->messageQueue.empty();
    }
    this->mutexQueue.unlock();

    if (message != NULL)
    {
      this->invokeNodeListener(message);
      free(message);
    }

    if (!empty)
      uv_async_send(this->uvHandleQueue);
  };

  // Calls into Node to execute the registered Node listener.
  // This method is always executed on the main libuv loop thread.
  void invokeNodeListener(char *message)
  {
    napi_handle_scope scope;
    napi_open_handle_scope(this->env, &scope);

    napi_value nodeFunction;
    napi_get_reference_value(this->env, this->functionRef, &nodeFunction);
    napi_value global;
    napi_get_global(this->env, &global);

    napi_value channelName;
    napi_create_string_utf8(this->env, this->name.c_str(), this->name.size(), &channelName);

    napi_value channelMessage;
    napi_create_string_utf8(this->env, message, strlen(message), &channelMessage);

    size_t argc = 2;
    napi_value argv[argc];
    argv[0] = channelName;
    argv[1] = channelMessage;

    napi_value result;
    napi_call_function(this->env, global, nodeFunction, argc, argv, &result);
    napi_close_handle_scope(this->env, scope);
  };
};

// Flush the specific channel queue
void FlushMessageQueue(uv_async_t *handle)
{
  Channel *channel = (Channel *)handle->data;
  channel->flushQueue();
}

// Global variables
std::mutex channelsMutex;
std::map<std::string, Channel *> channels;

callbackFunction sendMessageToNative = NULL;

/*
 * Called by the native Java code to register the callback
 * that receives the messages sent from Node.
 */
void RegisterCallback(callbackFunction function)
{
  sendMessageToNative = function;
}

// Return an existing channel or create a new one if it doesn't exist already.
Channel *GetOrCreateChannel(std::string channelName)
{
  channelsMutex.lock();
  Channel *channel = NULL;
  auto it = channels.find(channelName);
  if (it != channels.end())
    channel = it->second;
  else
  {
    channel = new Channel(channelName);
    channels[channelName] = channel;
  }
  channelsMutex.unlock();
  return channel;
};

// This method is the public API called by the native Java code
void SendMessageToNode(const char *channelName, const char *channelMessage)
{
  size_t messageLength = strlen(channelMessage);
  char *message = (char *)calloc(sizeof(char), messageLength + 1);
  strncpy(message, channelMessage, messageLength);

  Channel *channel = GetOrCreateChannel(std::string(channelName));
  channel->queueMessage(message);
}

#define GET_AND_THROW_LAST_ERROR(env)                                                                                 \
  do                                                                                                                  \
  {                                                                                                                   \
    const napi_extended_error_info *errorInfo;                                                                        \
    napi_get_last_error_info((env), &errorInfo);                                                                      \
                                                                                                                      \
    bool isPending;                                                                                                   \
    napi_is_exception_pending((env), &isPending);                                                                     \
                                                                                                                      \
    /* If an exception is already pending, don't rethrow it */                                                        \
    if (!isPending)                                                                                                   \
    {                                                                                                                 \
      const char *errorMessage = errorInfo->error_message != NULL ? errorInfo->error_message : "empty error message"; \
      napi_throw_error((env), NULL, errorMessage);                                                                    \
    }                                                                                                                 \
  } while (0)

#define NAPI_ASSERT_BASE(env, assertion, message, returnValue)                      \
  do                                                                                \
  {                                                                                 \
    if (!(assertion))                                                               \
    {                                                                               \
      napi_throw_error((env), NULL, "assertion (" #assertion ") failed: " message); \
      return returnValue;                                                           \
    }                                                                               \
  } while (0)

// Returns NULL on failed assertion.
// This is meant to be used inside napi_callback methods.
#define NAPI_ASSERT(env, assertion, message) NAPI_ASSERT_BASE(env, assertion, message, NULL)

#define NAPI_CALL_BASE(env, call, returnValue) \
  do                                           \
  {                                            \
    if ((call) != napi_ok)                     \
    {                                          \
      GET_AND_THROW_LAST_ERROR((env));         \
      return returnValue;                      \
    }                                          \
  } while (0)

// Returns NULL if the_call doesn't return napi_ok.
#define NAPI_CALL(env, call) NAPI_CALL_BASE(env, call, NULL)

// Send a message to the native Java code
napi_value Method_SendMessage(napi_env env, napi_callback_info info)
{
  size_t argc = 2;
  napi_value args[argc];

  NAPI_CALL(env, napi_get_cb_info(env, info, &argc, args, NULL, NULL));
  NAPI_ASSERT(env, argc == 2, "Wrong number of arguments.");

  // args[0] is the channel name
  napi_value channelName = args[0];
  napi_valuetype valueType0;
  NAPI_CALL(env, napi_typeof(env, channelName, &valueType0));
  NAPI_ASSERT(env, valueType0 == napi_string, "Expected a string.");

  size_t length;
  NAPI_CALL(env, napi_get_value_string_utf8(env, channelName, NULL, 0, &length));
  std::unique_ptr<char[]> uniqueChannelNameBuffer(new char[length + 1]());
  char *channelNameUtf8 = uniqueChannelNameBuffer.get();

  size_t lengthCopied;
  NAPI_CALL(env, napi_get_value_string_utf8(env, channelName, channelNameUtf8, length + 1, &lengthCopied));
  NAPI_ASSERT(env, lengthCopied == length, "Couldn't fully copy the channel name.");

  // args[1] is the message string
  napi_value channelMessage = args[1];
  napi_valuetype valueType1;
  NAPI_CALL(env, napi_typeof(env, channelMessage, &valueType1));
  if (valueType1 != napi_string)
    NAPI_CALL(env, napi_coerce_to_string(env, channelMessage, &channelMessage));

  length = 0;
  NAPI_CALL(env, napi_get_value_string_utf8(env, channelMessage, NULL, 0, &length));
  std::unique_ptr<char[]> uniqueMessageBuffer(new char[length + 1]());
  char *channelMessageUtf8 = uniqueMessageBuffer.get();

  lengthCopied = 0;
  NAPI_CALL(env, napi_get_value_string_utf8(env, channelMessage, channelMessageUtf8, length + 1, &lengthCopied));
  NAPI_ASSERT(env, lengthCopied == length, "Couldn't fully copy the message.");

  NAPI_ASSERT(env, sendMessageToNative, "No callback is set in native code to receive the message.");
  if (sendMessageToNative)
    sendMessageToNative(channelNameUtf8, channelMessageUtf8);

  return nullptr;
}

// Register a channel and its listener
napi_value Method_RegisterChannel(napi_env env, napi_callback_info info)
{
  size_t argc = 2;
  napi_value args[argc];
  NAPI_CALL(env, napi_get_cb_info(env, info, &argc, args, NULL, NULL));
  NAPI_ASSERT(env, argc == 2, "Wrong number of arguments.");

  // args[0] is the channel name
  napi_value channelName = args[0];
  napi_valuetype valueType0;
  NAPI_CALL(env, napi_typeof(env, channelName, &valueType0));
  NAPI_ASSERT(env, valueType0 == napi_string, "Expected a string.");

  size_t length;
  NAPI_CALL(env, napi_get_value_string_utf8(env, channelName, NULL, 0, &length));
  std::unique_ptr<char[]> uniqueChannelNameBuffer(new char[length + 1]());
  char *channelNameUtf8 = uniqueChannelNameBuffer.get();

  size_t lengthCopied;
  NAPI_CALL(env, napi_get_value_string_utf8(env, channelName, channelNameUtf8, length + 1, &lengthCopied));
  NAPI_ASSERT(env, lengthCopied == length, "Couldn't fully copy the channel name.");

  // args[1] is the channel listener
  napi_value listenerFunction = args[1];
  napi_valuetype valueType1;
  NAPI_CALL(env, napi_typeof(env, listenerFunction, &valueType1));
  NAPI_ASSERT(env, valueType1 == napi_function, "Expected a function.");

  napi_ref functionRef;
  NAPI_CALL(env, napi_create_reference(env, listenerFunction, 1, &functionRef));

  Channel *channel = GetOrCreateChannel(channelNameUtf8);
  channel->setNapiRefs(env, functionRef);
  return nullptr;
}

#define DECLARE_NAPI_METHOD(name, func)     \
  {                                         \
    name, 0, func, 0, 0, 0, napi_default, 0 \
  }

napi_value Init(napi_env env, napi_value exports)
{
  napi_status status;
  napi_property_descriptor properties[] = {
      DECLARE_NAPI_METHOD("emit", Method_SendMessage),
      DECLARE_NAPI_METHOD("registerChannel", Method_RegisterChannel),
  };
  NAPI_CALL(env, napi_define_properties(env, exports, sizeof(properties) / sizeof(*properties), properties));
  return exports;
}

// Register the bridge to the native Java code at libnode startup
NAPI_MODULE_X(nativeBridge, Init, NULL, NM_F_LINKED)