package net.hampoelz.capacitor.nodejs;

import android.content.res.AssetManager;

import com.getcapacitor.Logger;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class FileOperations {

    public static Boolean ExistsPath(String path) {
        final File file = new File(path);
        return file.exists();
    }

    public static String CombinePath(String... paths) {
        File file = new File(paths[0]);

        for (int index = 1; index < paths.length; index++) {
            file = new File(file, paths[index]);
        }

        return file.getPath();
    }

    public static String CombineEnv(String... variables) {
        final StringBuilder builder = new StringBuilder();

        for (int index = 1; index < variables.length; index++) {
            final String variable = variables[index];

            if (variable == null || variable.isEmpty()) {
                continue;
            }

            builder.append(variable);
            if (index < variables.length - 1) {
                builder.append(":");
            }
        }

        return builder.toString();
    }

    public static String ReadFileFromPath(String path) throws IOException {
        final File file = new File(path);

        final StringBuilder builder = new StringBuilder();
        final BufferedReader reader = new BufferedReader(new FileReader(file));

        String line;
        while ((line = reader.readLine()) != null) {
            builder.append(line);
            builder.append("\n");
        }

        reader.close();

        return builder.toString();
    }

    public static boolean DeleteDir(String dirPath) {
        final File directory = new File(dirPath);
        return DeleteDir(directory);
    }

    public static boolean DeleteDir(File directory) {
        if (!directory.exists()) return true;

        final File[] files = directory.listFiles();
        boolean success = true;

        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    success &= DeleteDir(file);
                } else {
                    success &= file.delete();
                }
            }
        }

        success &= directory.delete();
        return success;
    }

    public static boolean CopyAssetDir(AssetManager assetManager, String assetPath, String destinationPath) {
        try {
            final String[] files = assetManager.list(assetPath);
            if (files == null) return false;

            boolean success = true;

            if (files.length == 0) {
                success = CopyAsset(assetManager, assetPath, destinationPath);
            } else {
                final File destinationDir = new File(destinationPath);

                //noinspection ResultOfMethodCallIgnored
                destinationDir.mkdirs();

                for (String file : files) {
                    success &= CopyAssetDir(assetManager, CombinePath(assetPath, file), CombinePath(destinationPath, file));
                }
            }

            return success;
        } catch (IOException e) {
            Logger.error(CapacitorNodeJSPlugin.LOGGER_TAG, "Failed to copy assets from '" + assetPath + "'.", e);
            return false;
        }
    }

    public static boolean CopyAsset(AssetManager assetManager, String assetPath, String destinationPath) {
        try {
            final File destinationFile = new File(destinationPath);

            //noinspection ResultOfMethodCallIgnored
            destinationFile.createNewFile();

            final InputStream in = assetManager.open(assetPath);
            final OutputStream out = new FileOutputStream(destinationPath);

            CopyStream(in, out);

            in.close();
            out.flush();
            out.close();

            return true;
        } catch (Exception e) {
            Logger.error(CapacitorNodeJSPlugin.LOGGER_TAG, "Failed to copy the asset '" + assetPath + "' to '" + destinationPath + "'.", e);
            return false;
        }
    }

    public static void CopyStream(InputStream in, OutputStream out) throws IOException {
        byte[] buffer = new byte[1024];

        int size;
        while ((size = in.read(buffer)) != -1) {
            out.write(buffer, 0, size);
        }
    }
}
