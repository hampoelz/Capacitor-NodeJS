package com.hampoelz.capacitor.nodejs;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "NodeJS")
public class NodeJSPlugin extends Plugin {

    private NodeJS implementation;

    public void load() {
        implementation = new NodeJS(this);
        implementation.StartEngine(true);
    }

    @PluginMethod
    public void send(PluginCall call) {
        try {
            String eventName = call.getString("eventName");
            JSONArray args = call.getArray("args");

            // Serialize data
            JSONObject data = new JSONObject();
            data.put("event", eventName);
            data.put("payload", args.toString());

            boolean result = implementation.SendEventMessage(data);

            call.resolve(new JSObject().put("value", result));
        } catch (JSONException e) {
            call.reject(e.toString());
        }
    }

    public void receive(JSONObject data) throws JSONException {
        String eventName = data.getString("event");
        String payload = data.getString("payload");

        // Deserialize data
        JSONArray payloadArray = new JSONArray(payload);
        JSObject args = new JSObject();
        args.put("args", payloadArray);

        notifyListeners(eventName, args, false);
    }
}
