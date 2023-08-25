package net.hampoelz.capacitor.nodejs;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import androidx.annotation.Nullable;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Logger;
import com.getcapacitor.PluginCall;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import org.json.JSONException;
import org.json.JSONObject;

public class CapacitorNodeJS {

    private PackageInfo packageInfo;
    private final Context context;
    private final SharedPreferences preferences;
    private final CapacitorNodeJSPlugin.PluginEventNotifier eventNotifier;
    private final EngineStatus engineStatus = new EngineStatus();
    private final NodeProcess nodeProcess = new NodeProcess(new ReceiveCallback());

    protected CapacitorNodeJS(Context context, CapacitorNodeJSPlugin.PluginEventNotifier eventNotifier) {
        this.context = context;
        this.preferences = context.getSharedPreferences(CapacitorNodeJSPlugin.PREFS_TAG, Context.MODE_PRIVATE);
        this.eventNotifier = eventNotifier;

        try {
            this.packageInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
        } catch (PackageManager.NameNotFoundException e) {
            Logger.error(CapacitorNodeJSPlugin.LOGGER_TAG, "Failed to get the application's package information.", e);
        }
    }

    /** @noinspection InnerClassMayBeStatic*/
    private class EngineStatus {

        private final ArrayList<PluginCall> whenEngineReadyListeners = new ArrayList<>();
        private boolean isEngineStarted = false;
        private boolean isEngineReady = false;

        protected void setStarted() {
            isEngineStarted = true;
        }

        protected boolean isStarted() {
            return isEngineStarted;
        }

        protected void setReady() {
            isEngineReady = true;

            while (whenEngineReadyListeners.size() > 0) {
                final PluginCall whenEngineReadyListener = whenEngineReadyListeners.get(0);
                whenEngineReadyListeners.remove(0);
                whenEngineReadyListener.resolve();
            }
        }

        protected boolean isReady() {
            return isEngineReady;
        }

        protected void resolveWhenReady(PluginCall call) {
            if (this.isReady()) {
                call.resolve();
            } else {
                whenEngineReadyListeners.add(call);
            }
        }
    }

    protected void startEngine(@Nullable PluginCall call, String projectDir, @Nullable String mainFile, String[] args, Map<String, String> env) {
        final var callWrapper = new Object() {
            public void resolve() {
                if (call != null) {
                    call.resolve();
                }
            }

            public void reject(String message) {
                if (call != null) {
                    call.reject(message);
                } else {
                    Logger.debug(CapacitorNodeJSPlugin.LOGGER_TAG, message);
                }
            }

            public void reject(String message, Exception e) {
                if (call != null) {
                    call.reject(message, e);
                } else {
                    Logger.error(CapacitorNodeJSPlugin.LOGGER_TAG, message, e);
                }
            }
        };

        if (engineStatus.isStarted()) {
            callWrapper.reject("The Node.js engine has already been started.");
            return;
        }
        engineStatus.setStarted();

        new Thread(() -> {
            final String filesPath = context.getFilesDir().getAbsolutePath();
            final String cachePath = context.getCacheDir().getAbsolutePath();

            final String basePath = FileOperations.CombinePath(filesPath, "nodejs");
            final String projectPath = FileOperations.CombinePath(basePath, "public");
            final String modulesPath = FileOperations.CombinePath(basePath, "builtin_modules");
            final String dataPath = FileOperations.CombinePath(basePath, "data");

            final boolean copyNodeProjectSuccess = copyNodeProjectFromAPK(projectDir, projectPath, modulesPath);
            if (!copyNodeProjectSuccess) {
                callWrapper.reject("Unable to copy the Node.js project from APK.");
                return;
            }

            if (!FileOperations.ExistsPath(projectPath)) {
                callWrapper.reject("Unable to access the Node.js project. (No such directory)");
                return;
            }

            final boolean createDataDirSuccess = FileOperations.CreateDir(dataPath);
            if (!createDataDirSuccess) {
                Logger.debug(CapacitorNodeJSPlugin.LOGGER_TAG, "Unable to create a directory for persistent data storage.");
            }

            final String projectPackageJsonPath = FileOperations.CombinePath(projectPath, "package.json");

            String projectMainFile = "index.js";
            if (mainFile != null && !mainFile.isEmpty()) {
                projectMainFile = mainFile;
            } else if (FileOperations.ExistsPath(projectPackageJsonPath)) {
                try {
                    final String projectPackageJsonData = FileOperations.ReadFileFromPath(projectPackageJsonPath);
                    final JSONObject projectPackageJson = new JSONObject(projectPackageJsonData);
                    final String projectPackageJsonMainFile = projectPackageJson.getString("main");

                    if (!projectPackageJsonMainFile.isEmpty()) {
                        projectMainFile = projectPackageJsonMainFile;
                    }
                } catch (JSONException | IOException e) {
                    callWrapper.reject("Failed to read the package.json file of the Node.js project.", e);
                    return;
                }
            }

            final String projectMainPath = FileOperations.CombinePath(projectPath, projectMainFile);

            if (!FileOperations.ExistsPath(projectMainPath)) {
                callWrapper.reject("Unable to access main script of the Node.js project. (No such file)");
                return;
            }

            final String modulesPaths = FileOperations.CombineEnv(projectPath, modulesPath);

            final Map<String, String> nodeEnv = new HashMap<>();
            nodeEnv.put("DATADIR", dataPath);
            nodeEnv.put("NODE_PATH", modulesPaths);
            nodeEnv.putAll(env);

            nodeProcess.start(projectMainPath, args, nodeEnv, cachePath);
            callWrapper.resolve();
        }).start();
    }

    protected void resolveWhenReady(PluginCall call) {
        if (!engineStatus.isStarted()) {
            call.reject("The Node.js engine has not been started yet.");
        }

        engineStatus.resolveWhenReady(call);
    }

    protected void sendMessage(PluginCall call) {
        if (!engineStatus.isStarted()) {
            call.reject("The Node.js engine has not been started yet.");
            return;
        }

        if (!engineStatus.isReady()) {
            call.reject("The Node.js engine is not ready yet.");
            return;
        }

        final String eventName = call.getString("eventName");
        final JSArray args = call.getArray("args", new JSArray());

        if (eventName == null || args == null) return;

        final String eventMessage = args.toString();

        final JSObject data = new JSObject();
        data.put("eventName", eventName);
        data.put("eventMessage", eventMessage);

        final String channelName = CapacitorNodeJSPlugin.CHANNEL_NAME_EVENTS;
        final String channelMessage = data.toString();

        nodeProcess.send(channelName, channelMessage);
        call.resolve();
    }

    class ReceiveCallback implements NodeProcess.ReceiveCallback {

        @Override
        public void receive(String channelName, String message) {
            receiveMessage(channelName, message);
        }
    }

    protected void receiveMessage(String channelName, String channelMessage) {
        try {
            final JSObject payload = new JSObject(channelMessage);

            final String eventName = payload.getString("eventName");
            final String eventMessage = payload.getString("eventMessage");

            JSArray args = new JSArray();
            if (eventMessage != null && !eventMessage.isEmpty()) {
                args = new JSArray(eventMessage);
            }

            if (Objects.equals(channelName, CapacitorNodeJSPlugin.CHANNEL_NAME_APP) && Objects.equals(eventName, "ready")) {
                engineStatus.setReady();
            } else if (Objects.equals(channelName, CapacitorNodeJSPlugin.CHANNEL_NAME_EVENTS)) {
                eventNotifier.channelReceive(eventName, args);
            }
        } catch (JSONException e) {
            Logger.error(CapacitorNodeJSPlugin.LOGGER_TAG, "Failed to deserialize received data from the Node.js process.", e);
        }
    }

    private boolean copyNodeProjectFromAPK(String projectDir, String projectPath, String modulesPath) {
        final String nodeAssetDir = FileOperations.CombinePath("public", projectDir);
        final String modulesAssetDir = FileOperations.CombinePath("builtin_modules");
        final AssetManager assetManager = context.getAssets();

        boolean success = true;
        if (FileOperations.ExistsPath(projectPath) && isAppUpdated()) {
            success = FileOperations.DeleteDir(projectPath);
        }
        success &= FileOperations.CopyAssetDir(assetManager, nodeAssetDir, projectPath);

        if (FileOperations.ExistsPath(modulesPath) && isAppUpdated()) {
            success = FileOperations.DeleteDir(modulesPath);
        }
        success &= FileOperations.CopyAssetDir(assetManager, modulesAssetDir, modulesPath);

        saveAppUpdateTime();
        return success;
    }

    private boolean isAppUpdated() {
        final long previousLastUpdateTime = preferences.getLong(CapacitorNodeJSPlugin.PREFS_APP_UPDATED_TIME, 0);
        final long lastUpdateTime = packageInfo.lastUpdateTime;
        return lastUpdateTime != previousLastUpdateTime;
    }

    private void saveAppUpdateTime() {
        final long lastUpdateTime = packageInfo.lastUpdateTime;
        final SharedPreferences.Editor editor = preferences.edit();
        editor.putLong(CapacitorNodeJSPlugin.PREFS_APP_UPDATED_TIME, lastUpdateTime);
        editor.apply();
    }
}
