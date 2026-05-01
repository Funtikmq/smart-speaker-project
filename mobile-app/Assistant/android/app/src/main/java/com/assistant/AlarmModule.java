package com.assistant;

import android.content.Context;
import android.content.Intent;
import android.provider.AlarmClock;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AlarmModule extends ReactContextBaseJavaModule {
  public AlarmModule(ReactApplicationContext ctx) {
    super(ctx);
  }

  @Override
  public String getName() {
    return "AlarmModule";
  }

  /**
   * Setează o alarmă în Android Clock app nativă.
   * @param hours - ora (0-23)
   * @param minutes - minute (0-59)
   * @param label - descriere alarme (ex: "8:00 AM tomorrow")
   * @param promise - callback
   */
  @ReactMethod
  public void setAlarmInClockApp(int hours, int minutes, String label, Promise promise) {
    try {
      Context context = getReactApplicationContext();

      // Intent pentru Android Clock app
      Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM);
      intent.putExtra(AlarmClock.EXTRA_HOUR, hours);
      intent.putExtra(AlarmClock.EXTRA_MINUTES, minutes);
      intent.putExtra(AlarmClock.EXTRA_MESSAGE, label != null ? label : "Smart Speaker Alarm");
      intent.putExtra(AlarmClock.EXTRA_SKIP_UI, false); // Afișează Clock app UI

      // Deschide Clock app cu dialogul de alarmă
      intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      context.startActivity(intent);

      promise.resolve("Alarm dialog opened in Clock app");
    } catch (Exception e) {
      promise.reject("ERROR", e.getMessage());
    }
  }
}
