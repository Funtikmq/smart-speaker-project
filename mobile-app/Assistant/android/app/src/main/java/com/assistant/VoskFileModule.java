package com.assistant;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import org.json.JSONObject;
import org.vosk.Model;
import org.vosk.Recognizer;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class VoskFileModule extends ReactContextBaseJavaModule {
    private Model model = null;

    public VoskFileModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "VoskFile";
    }

    @ReactMethod
    public void loadModel(String modelPath, Promise promise) {
        try {
            if (model != null) {
                model.close();
                model = null;
            }
            model = new Model(modelPath);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("VOSK_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void copyModelFromAssets(String assetFolder, String destPath, Promise promise) {
        new Thread(() -> {
            try {
                copyAssetFolder(assetFolder, destPath);
                promise.resolve(null);
            } catch (Exception e) {
                promise.reject("COPY_ERROR", e.getMessage());
            }
        }).start();
    }

    private void copyAssetFolder(String assetPath, String destPath) throws IOException {
        String[] files = getReactApplicationContext().getAssets().list(assetPath);
        if (files == null) {
            throw new IOException("Asset path not found: " + assetPath);
        }

        File destDir = new File(destPath);
        if (!destDir.exists() && !destDir.mkdirs()) {
            throw new IOException("Failed to create directory: " + destPath);
        }

        for (String file : files) {
            String subAsset = assetPath + "/" + file;
            String subDest = destPath + "/" + file;
            String[] subFiles = getReactApplicationContext().getAssets().list(subAsset);

            if (subFiles != null && subFiles.length > 0) {
                copyAssetFolder(subAsset, subDest);
            } else {
                try (InputStream in = getReactApplicationContext().getAssets().open(subAsset);
                     FileOutputStream out = new FileOutputStream(subDest)) {
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                    }
                    out.flush();
                }
            }
        }
    }

    @ReactMethod
    public void transcribeFile(String wavPath, Promise promise) {
        if (model == null) {
            promise.reject("VOSK_ERROR", "Model not loaded");
            return;
        }

        new Thread(() -> {
            try (Recognizer recognizer = new Recognizer(model, 16000.0f);
                 InputStream stream = new FileInputStream(new File(wavPath))) {

                stream.skip(44);

                byte[] buffer = new byte[4096];
                int bytesRead;
                StringBuilder transcript = new StringBuilder();

                while ((bytesRead = stream.read(buffer)) != -1) {
                    if (recognizer.acceptWaveForm(buffer, bytesRead)) {
                        String chunk = parseTextFromVoskJson(recognizer.getResult());
                        if (!chunk.isEmpty()) {
                            if (transcript.length() > 0) {
                                transcript.append(" ");
                            }
                            transcript.append(chunk);
                        }
                    }
                }
                String finalChunk = parseTextFromVoskJson(recognizer.getFinalResult());
                if (!finalChunk.isEmpty()) {
                    if (transcript.length() > 0) {
                        transcript.append(" ");
                    }
                    transcript.append(finalChunk);
                }

                String text = transcript.toString().trim();
                promise.resolve(text);

            } catch (Exception e) {
                promise.reject("VOSK_ERROR", e.getMessage());
            }
        }).start();
    }

    private String parseTextFromVoskJson(String json) {
        if (json == null) {
            return "";
        }
        String trimmed = json.trim();
        if (trimmed.isEmpty()) {
            return "";
        }

        try {
            JSONObject obj = new JSONObject(trimmed);
            return obj.optString("text", "").trim();
        } catch (Exception ignored) {
            return "";
        }
    }
}
