package net.hampoelz.capacitor.nodejs;

import android.content.res.AssetManager;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class FileOperations {

    public static void DeleteFolderRecursively(File file) throws IOException {
        for (File childFile : file.listFiles()) {
            if (childFile.isDirectory()) DeleteFolderRecursively(childFile);
            else childFile.delete();
        }
        file.delete();
    }

    public static void CopyAssetFolder(AssetManager assetManager, String assetFolder, String destinationFolder) throws IOException {
        String[] files = assetManager.list(assetFolder);

        if (files.length==0) {
            //If it's a file, it won't have any assets "inside" it.
            CopyAsset(assetManager, assetFolder, destinationFolder);
        } else {
            new File(destinationFolder).mkdirs();
            for (String file : files) {
                CopyAssetFolder(assetManager, assetFolder + "/" + file, destinationFolder + "/" + file);
            }
        }
    }

    public static void CopyAsset(AssetManager assetManager, String assetPath, String destinationPath) throws IOException {
        new File(destinationPath).createNewFile();

        InputStream in = assetManager.open(assetPath);
        OutputStream out = new FileOutputStream(destinationPath);

        CopyFile(in, out);

        in.close();
        out.flush();
        out.close();
    }

    public static void CopyFile(InputStream in, OutputStream out) throws IOException {
        byte[] buffer = new byte[1024];
        int read;
        while ((read = in.read(buffer)) != -1) {
            out.write(buffer, 0, read);
        }
    }

    public static String ReadFile(File file) {
        if (!file.isFile()) return null;

        try {
            StringBuilder content = new StringBuilder();
            BufferedReader buffer = new BufferedReader(new FileReader(file));

            String line;
            while ((line = buffer.readLine()) != null) {
                content.append(line);
                content.append('\n');
            }
            buffer.close();

            return content.toString();
        }
        catch (IOException e) {
            e.printStackTrace();
        }

        return null;
    }
}