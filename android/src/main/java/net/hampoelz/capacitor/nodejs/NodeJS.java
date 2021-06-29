package net.hampoelz.capacitor.nodejs;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.system.ErrnoException;
import android.system.Os;
import java.io.File;
import java.io.IOException;
import org.json.JSONException;
import org.json.JSONObject;

public class NodeJS {

    private static final String SHARED_PREFS = "NODEJS_PREFS";
    private static final String APP_UPDATED_TIME = "AppUpdateTime";

    private static boolean isNodeEngineRunning = false;
    private static boolean isNodeEngineReady = false;

    static {
        System.loadLibrary("native-lib");
        System.loadLibrary("node");
    }

    private NodeJSPlugin plugin;
    private Context pluginContext;
    private PackageInfo packageInfo = null;

    public NodeJS(NodeJSPlugin plugin) {
        this.plugin = plugin;
        pluginContext = plugin.getActivity().getApplicationContext();

        try {
            packageInfo = pluginContext.getPackageManager().getPackageInfo(pluginContext.getPackageName(), 0);
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
    }

    public void StartEngine(boolean redirectOutputToLogcat) {
        if (isNodeEngineRunning) return;
        isNodeEngineRunning = true;

        // Sets the TMPDIR environment to the cacheDir, to be used in Node as os.tmpdir
        try {
            Os.setenv("TMPDIR", pluginContext.getCacheDir().getAbsolutePath(), true);
        } catch (ErrnoException e) {
            e.printStackTrace();
        }

        new Thread(
            () -> {
                try {
                    String nodeLocation = plugin.getConfig().getString("nodeDir");

                    if (nodeLocation == null) nodeLocation = ".";

                    if (nodeLocation.startsWith("./")) nodeLocation = nodeLocation.substring(2); else if (
                        nodeLocation.startsWith(".") || nodeLocation.startsWith("/")
                    ) nodeLocation = nodeLocation.substring(1);

                    if (nodeLocation.length() > 0 && !nodeLocation.startsWith("/")) nodeLocation = "/" + nodeLocation;

                    String filesDir = pluginContext.getFilesDir().getAbsolutePath();
                    String nodeFolder = filesDir + "/public/"/* + nodeLocation */;
                    String modulesFolder = filesDir + "/builtin_modules";
                    String nodePath = nodeFolder + ":" + modulesFolder;

                    copyNodeJsAssets(nodeLocation, nodeFolder, modulesFolder);

                    File packageFile = new File(nodeFolder + "/package.json");
                    JSONObject packageJSON = new JSONObject(FileOperations.ReadFile(packageFile));

                    String mainFile = packageJSON.getString("main");
                    if (mainFile.startsWith("./")) mainFile = mainFile.substring(1); else if (!mainFile.startsWith("/")) mainFile =
                        "/" + mainFile;

                    String mainPath = nodeFolder + mainFile;

                    startNodeWithArguments(new String[] { "node", mainPath }, nodePath, redirectOutputToLogcat);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        )
            .start();
    }

    public boolean SendEventMessage(JSONObject data) {
        if (!isNodeEngineReady) return false;

        try {
            sendMessageToNode("EVENT_CHANNEL", data.toString());
            return true;
        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }

    private native Integer startNodeWithArguments(String[] arguments, String nodePath, boolean redirectOutputToLogcat);

    private native void sendMessageToNode(String channelName, String message);

    private void receiveMessageFromNode(String channelName, String message) {
        try {
            JSONObject data = new JSONObject(message);

            if (channelName.equals("EVENT_CHANNEL")) plugin.receive(data); else if (channelName.equals(("APP_CHANNEL"))) {
                String event = data.get("event").toString();
                if (event.equals("ready")) isNodeEngineReady = true;
            }
        } catch (JSONException e) {
            // TODO
            e.printStackTrace();
        }
    }

    private void copyNodeJsAssets(String nodeLocation, String nodeFolder, String modulesFolder) throws IOException {
        String assetNodeFolder = "public" + nodeLocation;
        String assetModulesFolder = "builtin_modules";

        File nodeFolderReference = new File(nodeFolder);
        if (nodeFolderReference.exists() && wasAppUpdated()) FileOperations.DeleteFolderRecursively(nodeFolderReference);

        File modulesFolderReference = new File(nodeFolder);
        if (modulesFolderReference.exists() && wasAppUpdated()) FileOperations.DeleteFolderRecursively(modulesFolderReference);

        FileOperations.CopyAssetFolder(pluginContext.getAssets(), assetNodeFolder, nodeFolder);
        FileOperations.CopyAssetFolder(pluginContext.getAssets(), assetModulesFolder, modulesFolder);

        saveAppUpdateTime();
    }

    private boolean wasAppUpdated() {
        SharedPreferences prefs = pluginContext.getSharedPreferences(SHARED_PREFS, Context.MODE_PRIVATE);
        long previousLastUpdateTime = prefs.getLong(APP_UPDATED_TIME, 0);
        long lastUpdateTime = packageInfo.lastUpdateTime;
        return (lastUpdateTime != previousLastUpdateTime);
    }

    private void saveAppUpdateTime() {
        long lastUpdateTime = packageInfo.lastUpdateTime;
        SharedPreferences prefs = pluginContext.getSharedPreferences(SHARED_PREFS, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putLong(APP_UPDATED_TIME, lastUpdateTime);
        editor.commit();
    }
}
