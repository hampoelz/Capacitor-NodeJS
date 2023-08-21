package net.hampoelz.capacitor.nodejs;

import android.content.Context;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginConfig;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONException;

@CapacitorPlugin(name = "CapacitorNodeJS")
public class CapacitorNodeJSPlugin extends Plugin {

    protected static final String LOGGER_TAG = "CapacitorNodeJS";
    protected static final String PREFS_TAG = "CapacitorNodeJS_PREFS";
    protected static final String PREFS_APP_UPDATED_TIME = "AppUpdateTime";
    protected static final String CHANNEL_NAME_APP = "APP_CHANNEL";
    protected static final String CHANNEL_NAME_EVENTS = "EVENT_CHANNEL";

    private final PluginEventNotifier eventNotifier = new PluginEventNotifier();
    private CapacitorNodeJS implementation;

    public void load() {
        final Context context = getContext();
        implementation = new CapacitorNodeJS(context, eventNotifier);

        // TODO: Allow manual startup of the Node.js runtime
        final PluginSettings pluginSettings = readPluginSettings();
        implementation.startEngine(null, pluginSettings.nodeDir);
    }

    /** @noinspection InnerClassMayBeStatic*/
    private class PluginSettings {
        protected String nodeDir = "nodejs";
    }

    private PluginSettings readPluginSettings() {
        final PluginSettings settings = new PluginSettings();
        final PluginConfig config = getConfig();

        settings.nodeDir = config.getString("nodeDir", settings.nodeDir);

        return settings;
    }

    //region PluginMethods
    //---------------------------------------------------------------------------------------

    @PluginMethod
    public void send(PluginCall call) {
        final String eventName = call.getString("eventName");
        if (eventName == null || eventName.isEmpty()) {
            call.reject("Required parameter 'eventName' was not specified.");
            return;
        }

        implementation.sendMessage(call);
        call.resolve();
    }

    @PluginMethod
    public void whenReady(PluginCall call) {
        implementation.resolveWhenReady(call);
    }

    //---------------------------------------------------------------------------------------
    //endregion

    //region PluginEvents
    //---------------------------------------------------------------------------------------

    protected class PluginEventNotifier {

        // Bridge -------------------------------------------------------------------------------

        protected void channelReceive(String eventName, String data) {
            //? TODO: Deserialize data
            JSArray payloadArray;
            try {
                payloadArray = new JSArray(data);
            } catch (JSONException e) {
                payloadArray = new JSArray();
                try {
                    JSObject payload = new JSObject(data);
                    payloadArray.put(payload);
                } catch (JSONException ex) {
                    payloadArray.put(data);
                }
            }

            notifyChannelListeners(eventName, payloadArray);
        }
    }

    //---------------------------------------------------------------------------------------
    //endregion

    //region PluginListeners
    //---------------------------------------------------------------------------------------

    private void notifyChannelListeners(String eventName, JSArray payloadArray) {
        final JSObject args = new JSObject();
        args.put("args", payloadArray);

        notifyListeners(eventName, args);
    }

    //---------------------------------------------------------------------------------------
    //endregion
}
