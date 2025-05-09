/*
 * Implements the bridge APIs between the native Java code and the Node.js engine.
 * Based on https://github.com/nodejs-mobile/nodejs-mobile-react-native/blob/main/android/src/main/cpp/rn-bridge.cpp
 */

#include <map>
#include <mutex>
#include <queue>
#include <string>
#include <cstring>
#include <cstdlib>
#include <utility>

#include "uv.h"
#include "node.h"
#include "bridge.h"
#include "node_api.h"

// Forward declarations
void FlushMessageQueue(uv_async_t* handle);

// Channel class
class Channel
{
private:
  v8::Isolate* isolate_ = nullptr;
  v8::Persistent<v8::Function> function_;
  uv_async_t* uvHandleQueue_ = nullptr;
  std::mutex uvHandleMutex_;
  std::mutex queueMutex_;
  std::queue<char*> messageQueue_;
  std::string name_;
  bool initialized_ = false;

public:
  explicit Channel(std::string name) : name_(std::move(name)) {};

  // Set up the channel's V8 data. This method can be called only once per channel.
  void setV8Function(v8::Isolate* isolate, v8::Local<v8::Function> func)
  {
    isolate_ = isolate;
    function_.Reset(isolate, func);
    uvHandleMutex_.lock();
    if (uvHandleQueue_ == nullptr)
    {
      uvHandleQueue_ = (uv_async_t*)malloc(sizeof(uv_async_t));
      uv_async_init(uv_default_loop(), uvHandleQueue_, FlushMessageQueue);
      uvHandleQueue_->data = (void*)this;
      initialized_ = true;
      uv_async_send(uvHandleQueue_);
    }
    else
    {
      isolate->ThrowException(v8::Exception::TypeError(
        v8::String::NewFromUtf8(isolate, "Channel already exists.").ToLocalChecked()
      ));
    }
    uvHandleMutex_.unlock();
  };

  // Add a new message to the channel's queue and notify libuv to
  // call us back to do the actual message delivery.
  void queueMessage(char* message)
  {
    queueMutex_.lock();
    messageQueue_.push(message);
    queueMutex_.unlock();

    if (initialized_)
      uv_async_send(uvHandleQueue_);
  };

  // Process one message at the time, to simplify synchronization between
  // threads and minimize lock retention.
  void flushQueue()
  {
    char* message = nullptr;
    bool empty = true;

    queueMutex_.lock();
    if (!messageQueue_.empty())
    {
      message = messageQueue_.front();
      messageQueue_.pop();
      empty = messageQueue_.empty();
    }
    queueMutex_.unlock();

    if (message != nullptr)
    {
      invokeNodeListener(message);
      free(message);
    }

    if (!empty)
      uv_async_send(uvHandleQueue_);
  };

  // Calls into Node to execute the registered Node listener.
  // This method is always executed on the main libuv loop thread.
  void invokeNodeListener(char* message)
  {
    v8::HandleScope scope(isolate_);

    v8::Local<v8::Function> nodeFunction = v8::Local<v8::Function>::New(isolate_, function_);
    v8::Local<v8::Value> global = isolate_->GetCurrentContext()->Global();

    v8::Local<v8::String> channelName = v8::String::NewFromUtf8(isolate_, name_.c_str(), v8::NewStringType::kNormal).ToLocalChecked();
    v8::Local<v8::String> channelMessage = v8::String::NewFromUtf8(isolate_, message, v8::NewStringType::kNormal).ToLocalChecked();

    const int argc = 2;
    v8::Local<v8::Value> argv[argc] = { channelName, channelMessage };

    v8::MaybeLocal<v8::Value> result = nodeFunction->Call(isolate_->GetCurrentContext(), global, argc, argv);

    if (!result.IsEmpty())
    {
      v8::Local<v8::Value> local_result = result.ToLocalChecked();
      // Do something with the result if needed
    }
  };
};

// Flush the specific channel queue
void FlushMessageQueue(uv_async_t* handle)
{
  auto channel = (Channel*)handle->data;
  channel->flushQueue();
}

// Global variables
std::mutex channelsMutex;
std::map<std::string, Channel*> channels;

callbackFunction sendMessageToNative = nullptr;

/*
 * Called by the native Java code to register the callback
 * that receives the messages sent from Node.
 */
void RegisterCallback(callbackFunction function)
{
  sendMessageToNative = function;
}

// Return an existing channel or create a new one if it doesn't exist already.
Channel* GetOrCreateChannel(const std::string& channelName)
{
  channelsMutex.lock();
  Channel* channel = nullptr;
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
}

// This method is the public API called by the native Java code
void SendMessageToNode(const char* channelName, const char* channelMessage)
{
  size_t messageLength = strlen(channelMessage);
  char* message = (char*)calloc(sizeof(char), messageLength + 1);
  strncpy(message, channelMessage, messageLength);

  Channel* channel = GetOrCreateChannel(std::string(channelName));
  channel->queueMessage(message);
}

// Send a message to the native Java code
void Method_SendMessage(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  v8::Isolate* isolate = args.GetIsolate();
  if (args.Length() != 2)
  {
    isolate->ThrowException(v8::Exception::TypeError(
      v8::String::NewFromUtf8(isolate, "Wrong number of arguments.").ToLocalChecked()
    ));
    return;
  }

  v8::String::Utf8Value channelName(isolate, args[0]);
  std::string channelNameStr(*channelName);

  v8::String::Utf8Value channelMessage(isolate, args[1]);
  std::string channelMessageStr(*channelMessage);

  if (sendMessageToNative)
    sendMessageToNative(channelNameStr.c_str(), channelMessageStr.c_str());
}

// Register a channel and its listener
void Method_RegisterChannel(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  v8::Isolate* isolate = args.GetIsolate();
  if (args.Length() != 2)
  {
    isolate->ThrowException(v8::Exception::TypeError(
      v8::String::NewFromUtf8(isolate, "Wrong number of arguments.").ToLocalChecked()
    ));
    return;
  }

  v8::String::Utf8Value channelName(isolate, args[0]);
  std::string channelNameStr(*channelName);

  if (!args[1]->IsFunction())
  {
    isolate->ThrowException(v8::Exception::TypeError(
      v8::String::NewFromUtf8(isolate, "Expected a function.").ToLocalChecked()
    ));
    return;
  }

  v8::Local<v8::Function> listener = v8::Local<v8::Function>::Cast(args[1]);

  v8::Persistent<v8::Function> ref_to_function(isolate, listener);

  Channel* channel = GetOrCreateChannel(channelNameStr);
  channel->setV8Function(isolate, listener); // ref_to_function
}

void Init(v8::Local<v8::Object> exports)
{
  NODE_SET_METHOD(exports, "emit", Method_SendMessage);
  NODE_SET_METHOD(exports, "registerChannel", Method_RegisterChannel);
}

// Register the bridge to the native Java code at libnode startup
NODE_MODULE_LINKED(nativeBridge, Init)
