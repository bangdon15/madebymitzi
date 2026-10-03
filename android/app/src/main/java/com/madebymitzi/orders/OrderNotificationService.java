package com.madebymitzi.orders;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class OrderNotificationService extends Service {
    public static final String CHANNEL_ORDERS = "madebymitzi_orders_v5";
    public static final String CHANNEL_SERVICE = "madebymitzi_foreground_v1";
    private static final int SERVICE_NOTIFICATION_ID = 9001;
    private static final String PREFS_NAME = "mbm_orders_prefs";
    private static final String KEY_KNOWN_ORDERS = "known_orders";
    private static final String KEY_INITIALIZED = "orders_initialized";

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean isRunning = false;
    private SharedPreferences prefs;

    @Override
    public void onCreate() {
        super.onCreate();
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        createNotificationChannels();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(SERVICE_NOTIFICATION_ID, buildForegroundNotification(), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            } else {
                startForeground(SERVICE_NOTIFICATION_ID, buildForegroundNotification());
            }
        } catch (Throwable t) {
            t.printStackTrace();
            try {
                startForeground(SERVICE_NOTIFICATION_ID, buildForegroundNotification());
            } catch (Throwable t2) {
                t2.printStackTrace();
            }
        }

        try {
            // Keep Alarm cycle active
            OrderAlarmReceiver.scheduleNext(this);
        } catch (Throwable t) {
            t.printStackTrace();
        }

        if (!isRunning) {
            isRunning = true;
            startPollingLoop();
        }

        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        try {
            // Keep alarm receiver active when user swipes app
            OrderAlarmReceiver.scheduleNext(this);
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        executor.shutdownNow();
        super.onDestroy();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            // 1. Silent Foreground Persistent Service Channel
            NotificationChannel serviceChannel = new NotificationChannel(
                CHANNEL_SERVICE,
                "Order Listener Monitor",
                NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Keeps order alerts active while the phone is locked or app is minimized");
            serviceChannel.setShowBadge(false);
            nm.createNotificationChannel(serviceChannel);

            // 2. High-Priority Filipino "Pabili!" Order Alert Channel
            NotificationChannel orderChannel = new NotificationChannel(
                CHANNEL_ORDERS,
                "New Order Alerts (Pabili!)",
                NotificationManager.IMPORTANCE_HIGH
            );
            orderChannel.setDescription("Friendly Filipino 'Paaaah. Bi-leeeee!' voice alerts for new orders");
            orderChannel.enableLights(true);
            orderChannel.setLightColor(Color.parseColor("#FF84BA"));
            orderChannel.enableVibration(true);
            orderChannel.setVibrationPattern(new long[]{0, 250, 150, 350});
            orderChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.pabili);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .build();
            orderChannel.setSound(soundUri, audioAttributes);

            nm.createNotificationChannel(orderChannel);
        }
    }

    private Notification buildForegroundNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        return new NotificationCompat.Builder(this, CHANNEL_SERVICE)
            .setContentTitle("🌸 MadeByMitzi Order Alerts Active")
            .setContentText("Listening for incoming orders & payments in background...")
            .setSmallIcon(R.drawable.ic_launcher)
            .setColor(Color.parseColor("#FF84BA"))
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void startPollingLoop() {
        executor.execute(() -> {
            while (isRunning) {
                try {
                    checkOrdersFromCloud();
                } catch (Throwable t) {
                    t.printStackTrace();
                }

                try {
                    Thread.sleep(15000); // Poll every 15 seconds
                } catch (InterruptedException e) {
                    break;
                }
            }
        });
    }

    private void checkOrdersFromCloud() {
        HttpURLConnection conn = null;
        try {
            URL url = new URL("https://firestore.googleapis.com/v1/projects/madebymitzi-store/databases/(default)/documents/mbm_orders?pageSize=25");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);

            if (conn.getResponseCode() == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();

                parseAndNotifyOrders(response.toString());
            }
        } catch (Exception e) {
            // Ignore transient network errors
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private void parseAndNotifyOrders(String jsonString) {
        try {
            JSONObject root = new JSONObject(jsonString);
            if (!root.has("documents")) return;

            JSONArray docs = root.getJSONArray("documents");
            Set<String> known = new HashSet<>(prefs.getStringSet(KEY_KNOWN_ORDERS, new HashSet<>()));
            boolean isFirstRun = !prefs.getBoolean(KEY_INITIALIZED, false);

            for (int i = 0; i < docs.length(); i++) {
                JSONObject doc = docs.getJSONObject(i);
                String name = doc.optString("name", "");
                String orderId = name.substring(name.lastIndexOf('/') + 1);

                if (orderId.isEmpty()) continue;

                JSONObject fields = doc.optJSONObject("fields");
                if (fields == null) continue;

                // Check order status
                String status = "";
                if (fields.has("status") && fields.getJSONObject("status").has("stringValue")) {
                    status = fields.getJSONObject("status").getString("stringValue");
                }

                // If not in known orders
                if (!known.contains(orderId)) {
                    known.add(orderId);

                    // Only notify if not the very first app launch (avoid blasting on old orders)
                    if (!isFirstRun && (status.isEmpty() || status.equalsIgnoreCase("pending") || status.equalsIgnoreCase("pending_verification"))) {
                        String custName = "Customer";
                        if (fields.has("customer") && fields.getJSONObject("customer").has("mapValue")) {
                            JSONObject custMap = fields.getJSONObject("customer").getJSONObject("mapValue").optJSONObject("fields");
                            if (custMap != null && custMap.has("name") && custMap.getJSONObject("name").has("stringValue")) {
                                custName = custMap.getJSONObject("name").getString("stringValue");
                            }
                        }

                        double total = 0.0;
                        if (fields.has("total")) {
                            JSONObject totalObj = fields.getJSONObject("total");
                            if (totalObj.has("doubleValue")) total = totalObj.getDouble("doubleValue");
                            else if (totalObj.has("integerValue")) total = totalObj.getDouble("integerValue");
                        }

                        String payMethod = "GCash";
                        if (fields.has("paymentMethod") && fields.getJSONObject("paymentMethod").has("stringValue")) {
                            payMethod = fields.getJSONObject("paymentMethod").getString("stringValue").toUpperCase();
                        }

                        final String finalCustName = custName;
                        final double finalTotal = total;
                        final String finalPayMethod = payMethod;
                        final String finalOrderId = orderId;

                        mainHandler.post(() -> {
                            showOrderNotification(this,
                                "🛍️ New Order: ₱" + String.format("%.2f", finalTotal) + " (" + finalPayMethod + ")",
                                finalCustName + " placed order #" + finalOrderId,
                                finalOrderId
                            );
                            playKaChing(this);
                        });
                    }
                }
            }

            prefs.edit()
                .putStringSet(KEY_KNOWN_ORDERS, known)
                .putBoolean(KEY_INITIALIZED, true)
                .apply();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void showOrderNotification(Context context, String title, String body, String orderId) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("orderId", orderId);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            (int) System.currentTimeMillis(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Uri soundUri = Uri.parse("android.resource://" + context.getPackageName() + "/" + R.raw.pabili);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ORDERS)
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_EVENT)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(Color.parseColor("#FF84BA"))
            .setAutoCancel(true)
            .setSound(soundUri)
            .setVibrate(new long[]{0, 250, 150, 350})
            .setContentIntent(pendingIntent);

        int notifId = (int) (System.currentTimeMillis() % 100000);
        nm.notify(notifId, builder.build());
    }

    public static void playKaChing(Context context) {
        try {
            // Play custom Filipino 'Paaaah. Bi-leeeee!' sound
            MediaPlayer mp = MediaPlayer.create(context, R.raw.pabili);
            if (mp != null) {
                mp.setOnCompletionListener(MediaPlayer::release);
                mp.start();
            }

            // Vibrate device
            Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 250, 150, 350}, -1));
                } else {
                    vibrator.vibrate(new long[]{0, 250, 150, 350}, -1);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
