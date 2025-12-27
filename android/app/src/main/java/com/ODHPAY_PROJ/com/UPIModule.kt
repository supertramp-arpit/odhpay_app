package com.ODHPAY_PROJ.com

import com.facebook.react.bridge.*

class UPIModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "UPIManager"

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
  fun pay(uri: String, packageName: String?, promise: Promise) {
    try {
      val activity = reactContext.currentActivity as? MainActivity
        ?: return promise.reject("NO_ACTIVITY", "Activity is null")

      activity.startUPIPayment(uri, packageName)
      promise.resolve("UPI Intent Sent")
    } catch (e: Exception) {
      promise.reject("UPI_ERROR", e)
    }
  }

  @ReactMethod
  fun isInstalled(packageName: String, promise: Promise) {
    val activity = reactContext.currentActivity as? MainActivity
      ?: return promise.reject("NO_ACTIVITY", "Activity is null")

    promise.resolve(activity.isAppInstalled(packageName))
  }

  @ReactMethod
  fun isUpiReady(packageName: String, promise: Promise) {
    val activity = reactContext.currentActivity as? MainActivity
      ?: return promise.reject("NO_ACTIVITY", "Activity is null")

    promise.resolve(activity.isAppUpiReady(packageName))
  }
}
