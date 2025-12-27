package com.ODHPAY_PROJ.com.phonehint

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import com.facebook.react.bridge.*
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest
import com.google.android.gms.auth.api.identity.Identity

class PhoneHintModule(private val reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private val RC_PHONE_HINT = 9911
  private var pendingPromise: Promise? = null

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName() = "PhoneHint"

  // Required for NativeEventEmitter (suppresses warnings)
  @ReactMethod
  fun addListener(eventName: String) {
    // No-op: Required for RN built-in Event Emitter
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // No-op: Required for RN built-in Event Emitter
  }

  @ReactMethod
  fun getPhoneNumber(promise: Promise) {
    val activity: Activity? = reactContext.currentActivity   // ✅ fixed
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Current activity is null")
      return
    }
    if (pendingPromise != null) {
      promise.reject("BUSY", "Another phone hint request is in flight")
      return
    }
    pendingPromise = promise

    val signInClient = Identity.getSignInClient(activity)
    val request = GetPhoneNumberHintIntentRequest.builder().build()

    signInClient.getPhoneNumberHintIntent(request)
      .addOnSuccessListener { pendingIntent ->
        try {
          activity.startIntentSenderForResult(
            pendingIntent.intentSender,
            RC_PHONE_HINT, null, 0, 0, 0, Bundle()
          )
        } catch (e: Exception) {
          pendingPromise?.reject("LAUNCH_FAILED", e)
          pendingPromise = null
        }
      }
      .addOnFailureListener { e ->
        pendingPromise?.reject("HINT_UNAVAILABLE", e)
        pendingPromise = null
      }
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?
  ) {
    if (requestCode != RC_PHONE_HINT) return
    val promise = pendingPromise
    pendingPromise = null
    if (promise == null) return

    if (resultCode == Activity.RESULT_OK) {
      val signInClient = Identity.getSignInClient(activity)
      try {
        val phoneNumber = signInClient.getPhoneNumberFromIntent(data)
        if (phoneNumber != null) {
          promise.resolve(phoneNumber)
        } else {
          promise.reject("NO_NUMBER", "No phone number returned")
        }
      } catch (e: Exception) {
        promise.reject("PARSE_ERROR", e)
      }
    } else {
      promise.reject("CANCELED", "User canceled phone hint")
    }
  }

  override fun onNewIntent(intent: Intent) { /* no-op */ }
}
