package com.madebymitzi.orders;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.PowerManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashSet;
import java.util.Set;

public class OrderAlarmReceiver extends BroadcastReceiver {
    private static final String PREFS_NAME = "mbm_orders_prefs";
    private static final String KEY_KNOWN_ORDERS = "known_orders";
    private static final String KEY_INITIALIZED = "orders_initialized";
    private static final int ALARM_INTERVAL_MS = 30000; // Check every 30 seconds while sleeping

    @Override
    public void onReceive(Context context, Intent intent) {
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MadeByMitzi:AlarmWakeLock");
            wakeLock.acquire(15000); // Hold lock for max 15s to complete check
        }

        final PowerManager.WakeLock finalLock = wakeLock;
        new Thread(() -> {
            try {
                checkOrders(context);
            } catch (Throwable t) {
                t.printStackTrace();
            } finally {
                // Schedule next wakeup
                scheduleNext(context);
                if (finalLock != null && finalLock.isHeld()) {
                    try {
                        finalLock.release();
                    } catch (Exception e) {}
                }
            }
        }).start();
    }

    public static void scheduleNext(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(context, OrderAlarmReceiver.class);
        PendingIntent pi = PendingIntent.getBroadcast(
            context,
            1002,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        long triggerAtMillis = System.currentTimeMillis() + ALARM_INTERVAL_MS;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
        } else {
            am.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
        }
    }

    private void checkOrders(Context context) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL("https://firestore.googleapis.com/v1/projects/madebymitzi-store/databases/(default)/documents/mbm_orders?pageSize=20");
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

                processResponse(context, response.toString());
            }
        } catch (Exception e) {
            // Transient network error
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private void processResponse(Context context, String json) {
        try {
            JSONObject root = new JSONObject(json);
            if (!root.has("documents")) return;

            JSONArray docs = root.getJSONArray("documents");
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            Set<String> known = new HashSet<>(prefs.getStringSet(KEY_KNOWN_ORDERS, new HashSet<>()));
            boolean isFirstRun = !prefs.getBoolean(KEY_INITIALIZED, false);

            for (int i = 0; i < docs.length(); i++) {
                JSONObject doc = docs.getJSONObject(i);
                String name = doc.optString("name", "");
                String orderId = name.substring(name.lastIndexOf('/') + 1);

                if (orderId.isEmpty()) continue;

                JSONObject fields = doc.optJSONObject("fields");
                if (fields == null) continue;

                String status = "";
                if (fields.has("status") && fields.getJSONObject("status").has("stringValue")) {
                    status = fields.getJSONObject("status").getString("stringValue");
                }

                if (!known.contains(orderId)) {
                    known.add(orderId);

                    // If newly discovered pending order, alert immediately with Ka-Ching
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

                        OrderNotificationService.showOrderNotification(
                            context,
                            "🛍️ New Order: ₱" + String.format("%.2f", total) + " (" + payMethod + ")",
                            custName + " placed order #" + orderId + " (Tap to view details)",
                            orderId
                        );

                        OrderNotificationService.playKaChing(context);
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
}
