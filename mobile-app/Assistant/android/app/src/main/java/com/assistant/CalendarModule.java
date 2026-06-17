package com.assistant;

import android.Manifest;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.CalendarContract;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

import java.util.TimeZone;

public class CalendarModule extends ReactContextBaseJavaModule implements PermissionListener {
  private static final int CALENDAR_PERMISSION_REQUEST = 7312;
  private Promise pendingPromise;
  private String pendingTitle;
  private long pendingStartMillis;
  private long pendingEndMillis;
  private boolean pendingAutoIncrementHour;

  public CalendarModule(ReactApplicationContext ctx) {
    super(ctx);
  }

  @Override
  public String getName() {
    return "CalendarModule";
  }

  @ReactMethod
  public void createEvent(
    String title,
    double startMillis,
    double endMillis,
    boolean autoIncrementHour,
    Promise promise
  ) {
    if (title == null || title.trim().isEmpty()) {
      promise.reject("INVALID_TITLE", "Event title is required");
      return;
    }

    pendingPromise = promise;
    pendingTitle = title.trim();
    pendingStartMillis = (long) startMillis;
    pendingEndMillis = (long) endMillis;
    pendingAutoIncrementHour = autoIncrementHour;

    if (hasCalendarPermissions()) {
      insertPendingEvent();
      return;
    }

    requestCalendarPermissions();
  }

  private boolean hasCalendarPermissions() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return true;
    }

    return getReactApplicationContext().checkSelfPermission(Manifest.permission.READ_CALENDAR)
      == PackageManager.PERMISSION_GRANTED
      && getReactApplicationContext().checkSelfPermission(Manifest.permission.WRITE_CALENDAR)
      == PackageManager.PERMISSION_GRANTED;
  }

  private void requestCalendarPermissions() {
    Activity activity = getCurrentActivity();
    if (!(activity instanceof PermissionAwareActivity)) {
      rejectPending("NO_ACTIVITY", "Calendar permission cannot be requested");
      return;
    }

    ((PermissionAwareActivity) activity).requestPermissions(
      new String[] {
        Manifest.permission.READ_CALENDAR,
        Manifest.permission.WRITE_CALENDAR
      },
      CALENDAR_PERMISSION_REQUEST,
      this
    );
  }

  @Override
  public boolean onRequestPermissionsResult(
    int requestCode,
    String[] permissions,
    int[] grantResults
  ) {
    if (requestCode != CALENDAR_PERMISSION_REQUEST) {
      return false;
    }

    if (grantResults.length < 2
      || grantResults[0] != PackageManager.PERMISSION_GRANTED
      || grantResults[1] != PackageManager.PERMISSION_GRANTED) {
      rejectPending("PERMISSION_DENIED", "Calendar permission was denied");
      return true;
    }

    insertPendingEvent();
    return true;
  }

  private void insertPendingEvent() {
    try {
      ContentResolver resolver = getReactApplicationContext().getContentResolver();
      long calendarId = findWritableCalendarId(resolver);

      if (calendarId < 0) {
        rejectPending("NO_CALENDAR", "No writable calendar found on this device");
        return;
      }

      long startMillis = pendingStartMillis;
      long durationMillis = Math.max(30 * 60 * 1000L, pendingEndMillis - pendingStartMillis);

      if (pendingAutoIncrementHour) {
        startMillis = findAvailableHourlyStart(resolver, calendarId, startMillis, durationMillis);
      }

      ContentValues values = new ContentValues();
      values.put(CalendarContract.Events.CALENDAR_ID, calendarId);
      values.put(CalendarContract.Events.TITLE, pendingTitle);
      values.put(CalendarContract.Events.DTSTART, startMillis);
      values.put(CalendarContract.Events.DTEND, startMillis + durationMillis);
      values.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());

      Uri uri = resolver.insert(CalendarContract.Events.CONTENT_URI, values);
      if (uri == null) {
        rejectPending("INSERT_FAILED", "Calendar event could not be inserted");
        return;
      }

      long eventId = Long.parseLong(uri.getLastPathSegment());
      WritableMap result = Arguments.createMap();
      result.putDouble("eventId", eventId);
      result.putDouble("startMillis", startMillis);
      resolvePending(result);
    } catch (Exception e) {
      rejectPending("ERROR", e.getMessage());
    }
  }

  private long findWritableCalendarId(ContentResolver resolver) {
    String[] projection = new String[] {
      CalendarContract.Calendars._ID
    };
    String selection = CalendarContract.Calendars.VISIBLE + " = 1 AND "
      + CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL + " >= ?";
    String[] args = new String[] {
      String.valueOf(CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR)
    };
    String sort = CalendarContract.Calendars.IS_PRIMARY + " DESC";

    try (Cursor cursor = resolver.query(
      CalendarContract.Calendars.CONTENT_URI,
      projection,
      selection,
      args,
      sort
    )) {
      if (cursor != null && cursor.moveToFirst()) {
        return cursor.getLong(0);
      }
    }

    return -1;
  }

  private long findAvailableHourlyStart(
    ContentResolver resolver,
    long calendarId,
    long requestedStartMillis,
    long durationMillis
  ) {
    long candidate = requestedStartMillis;

    for (int i = 0; i < 16; i++) {
      if (!hasConflict(resolver, calendarId, candidate, candidate + durationMillis)) {
        return candidate;
      }
      candidate += 60 * 60 * 1000L;
    }

    return requestedStartMillis;
  }

  private boolean hasConflict(
    ContentResolver resolver,
    long calendarId,
    long startMillis,
    long endMillis
  ) {
    Uri.Builder builder = CalendarContract.Instances.CONTENT_URI.buildUpon();
    ContentUris.appendId(builder, startMillis);
    ContentUris.appendId(builder, endMillis);

    String[] projection = new String[] {
      CalendarContract.Instances.EVENT_ID
    };
    String selection = CalendarContract.Instances.CALENDAR_ID + " = ? AND "
      + CalendarContract.Instances.BEGIN + " < ? AND "
      + CalendarContract.Instances.END + " > ?";
    String[] args = new String[] {
      String.valueOf(calendarId),
      String.valueOf(endMillis),
      String.valueOf(startMillis)
    };

    try (Cursor cursor = resolver.query(builder.build(), projection, selection, args, null)) {
      return cursor != null && cursor.moveToFirst();
    }
  }

  private void resolvePending(WritableMap result) {
    if (pendingPromise != null) {
      pendingPromise.resolve(result);
    }
    clearPending();
  }

  private void rejectPending(String code, String message) {
    if (pendingPromise != null) {
      pendingPromise.reject(code, message != null ? message : "Calendar error");
    }
    clearPending();
  }

  private void clearPending() {
    pendingPromise = null;
    pendingTitle = null;
    pendingStartMillis = 0L;
    pendingEndMillis = 0L;
    pendingAutoIncrementHour = false;
  }
}
