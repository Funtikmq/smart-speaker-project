package com.assistant;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;

public class AlarmReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    if (intent != null && "com.assistant.ALARM_TRIGGER".equals(intent.getAction())) {
      int alarmId = intent.getIntExtra("alarmId", -1);
      triggerAlarm(context, alarmId);
    }
  }

  private void triggerAlarm(Context context, int alarmId) {
    // Vibrează telefonul
    Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
    if (vibrator != null) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        // Pentru Android 8+, folosim VibrationEffect
        VibrationEffect effect = VibrationEffect.createOneShot(500, VibrationEffect.DEFAULT_AMPLITUDE);
        vibrator.vibrate(effect);
      } else {
        // Fallback pentru versiuni mai vechi
        vibrator.vibrate(500);
      }
    }

    // Redă sunetul de alarmă implicit al sistemului
    try {
      Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
      android.media.Ringtone ringtone = RingtoneManager.getRingtone(context, alarmUri);
      if (ringtone != null) {
        ringtone.play();
      }
    } catch (Exception e) {
      e.printStackTrace();
    }

    // Logare
    android.util.Log.i("AlarmReceiver", "Alarm triggered: " + alarmId);
  }
}
