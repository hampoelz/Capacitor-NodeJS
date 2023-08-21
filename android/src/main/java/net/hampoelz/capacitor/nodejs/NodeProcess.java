package net.hampoelz.capacitor.nodejs;

import android.system.ErrnoException;
import android.system.Os;

import com.getcapacitor.Logger;

public class NodeProcess {
    static {
        System.loadLibrary("native-lib");
        System.loadLibrary("node");
    }

    private native Integer nativeStart(String[] arguments, String nodePath, boolean redirectOutputToLogcat);

    private native void nativeSend(String channelName, String message);

    /** @noinspection unused*/
    private void nativeReceive(String channelName, String message) {
        receiveCallback.receive(channelName, message);
    }

    private final ReceiveCallback receiveCallback;

    protected NodeProcess(String modulePath, String[] parameter, String NODE_PATH, String cachePath, ReceiveCallback receiveCallback) {
        this.receiveCallback = receiveCallback;

        try {
            Os.setenv("TMPDIR", cachePath, true);
        } catch (ErrnoException e) {
            Logger.error(CapacitorNodeJSPlugin.LOGGER_TAG, "Failed to set the environment variable for the Node.js cache directory.", e);
        }

        final String[] arguments = new String[parameter.length + 2];
        System.arraycopy(parameter, 0, arguments, 2, parameter.length);
        arguments[0] = "node";
        arguments[1] = modulePath;

        // TODO: pass environment variables from java to jni
        new Thread(() -> nativeStart(arguments, NODE_PATH, true)).start();
    }

    protected interface ReceiveCallback {
        void receive(String channelName, String message);
    }

    protected void send(String channelName, String message) {
        nativeSend(channelName, message);
    }
}
