package net.hampoelz.capacitor.nodejs;

import android.system.ErrnoException;
import android.system.Os;
import com.getcapacitor.Logger;
import java.util.Map;
import java.util.Map.Entry;

public class NodeProcess {
    static {
        System.loadLibrary("native-lib");
        System.loadLibrary("node");
    }

    private native int nativeStart(String[] arguments, String[][] environmentVariables, boolean redirectOutputToLogcat);

    private native void nativeSend(String channelName, String message);

    /** @noinspection unused*/
    private void nativeReceive(String channelName, String message) {
        receiveCallback.receive(channelName, message);
    }

    private final ReceiveCallback receiveCallback;

    protected NodeProcess(ReceiveCallback receiveCallback) {
        this.receiveCallback = receiveCallback;
    }

    protected void start(String modulePath, String[] parameter, Map<String, String> env, String cachePath) {
        try {
            Os.setenv("TMPDIR", cachePath, true);
        } catch (ErrnoException e) {
            Logger.error(CapacitorNodeJSPlugin.LOGGER_TAG, "Failed to set the environment variable for the Node.js cache directory.", e);
        }

        final String[] arguments = new String[parameter.length + 2];
        System.arraycopy(parameter, 0, arguments, 2, parameter.length);
        arguments[0] = "node";
        arguments[1] = modulePath;

        final String[][] environmentVariables = new String[env.size()][2];

        int envCount = 0;
        for (Entry<String, String> entry : env.entrySet()) {
            environmentVariables[envCount][0] = entry.getKey();
            environmentVariables[envCount][1] = entry.getValue();
            envCount++;
        }

        nativeStart(arguments, environmentVariables, true);
    }

    protected interface ReceiveCallback {
        void receive(String channelName, String message);
    }

    protected void send(String channelName, String message) {
        nativeSend(channelName, message);
    }
}
