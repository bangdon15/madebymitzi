package com.madebymitzi.orders;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            if (intent != null && (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) ||
                Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction()))) {

                // Safely schedule background alarm cycle
                OrderAlarmReceiver.scheduleNext(context);

                // Only start service if running on older Android versions that allow background service start
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                    try {
                        Intent serviceIntent = new Intent(context, OrderNotificationService.class);
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            context.startForegroundService(serviceIntent);
                        } else {
                            context.startService(serviceIntent);
                        }
                    } catch (Throwable t) {
                        t.printStackTrace();
                    }
                }
            }
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }
}
