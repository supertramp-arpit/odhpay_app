package com.ODHPAY_PROJ.com.integrity

import android.util.Log
import com.facebook.react.bridge.*
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest

class IntegrityModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "IntegrityModule"

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
    fun getIntegrityToken(nonce: String, promise: Promise) {
        try {
            val integrityManager = IntegrityManagerFactory.create(reactApplicationContext)

            val request = IntegrityTokenRequest.builder()
                .setNonce(nonce)
                .build()

            integrityManager.requestIntegrityToken(request)
                .addOnSuccessListener { response ->
                    promise.resolve(response.token())
                }
                .addOnFailureListener { err ->
                    Log.e("Integrity", "Error requesting token", err)
                    promise.reject("ERR_INTEGRITY", err.message)
                }

        } catch (e: Exception) {
            promise.reject("ERR_EXCEPTION", e.message)
        }
    }
}
