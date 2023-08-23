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

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

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

        final PluginSettings pluginSettings = readPluginSettings();
        if (pluginSettings.startMode.equals("auto")) {
            implementation.startEngine(null, pluginSettings.nodeDir, null, new String[] { }, new HashMap<>());
        }
    }

    /** @noinspection InnerClassMayBeStatic*/
    private class PluginSettings {
        protected String nodeDir = "nodejs";
        protected String startMode = "auto";
    }

    private PluginSettings readPluginSettings() {
        final PluginSettings settings = new PluginSettings();
        final PluginConfig config = getConfig();

        settings.nodeDir = config.getString("nodeDir", settings.nodeDir);
        settings.startMode = config.getString("startMode", settings.startMode);

        return settings;
    }

    //region PluginMethods
    //---------------------------------------------------------------------------------------

    @PluginMethod
    public void start(PluginCall call) {
        final PluginSettings pluginSettings = readPluginSettings();

        if (!pluginSettings.startMode.equals("manual")) {
            call.reject("Manual startup of the Node.js engine is not enabled.");
        }

        final String projectDir = call.getString("nodeDir", pluginSettings.nodeDir);
        final String nodeMain = call.getString("script");
        final JSArray nodeArgs = call.getArray("args");
        final JSObject nodeEnv = call.getObject("env");

        final String[] nodeArgsArray;
        if (nodeArgs != null) {
            nodeArgsArray = new String[nodeArgs.length()];

            try {
                for (int i = 0; i < nodeArgs.length(); i++) {
                    nodeArgsArray[i] = nodeArgs.getString(i);
                }
            } catch (JSONException ex) {
                call.reject("Parameter 'args' is not valid.", ex);
                return;
            }
        } else {
            nodeArgsArray = new String[] { };
        }

        final Map<String, String> nodeEnvMap = new HashMap<>();
        if (nodeEnv != null) {
            Iterator<String> keys = nodeEnv.keys();
            while(keys.hasNext()) {
                String key = keys.next();
                if (key == null || key.isEmpty()) continue;

                String value = nodeEnv.getString(key);
                if (value == null || value.isEmpty()) continue;

                nodeEnvMap.put(key, value);
            }
        }

        implementation.startEngine(call, projectDir, nodeMain, nodeArgsArray, nodeEnvMap);
        call.resolve();
    }

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

        protected void channelReceive(String eventName, JSArray payloadArray) {
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
