package com.ODHPAY_PROJ.com.appupdate

import android.app.Activity
import android.content.Intent
import android.content.IntentSender
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability

class AppUpdateModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var appUpdateManager: AppUpdateManager? = null
    private var updatePromise: Promise? = null
    private var installStateListener: InstallStateUpdatedListener? = null

    companion object {
        private const val TAG = "AppUpdateModule"
        private const val UPDATE_REQUEST_CODE = 1001
        
        // Update type constants
        const val UPDATE_TYPE_FLEXIBLE = 0
        const val UPDATE_TYPE_IMMEDIATE = 1
    }

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "AppUpdateModule"

    override fun getConstants(): MutableMap<String, Any> {
        return hashMapOf(
            "UPDATE_TYPE_FLEXIBLE" to UPDATE_TYPE_FLEXIBLE,
            "UPDATE_TYPE_IMMEDIATE" to UPDATE_TYPE_IMMEDIATE
        )
    }

    // Required for NativeEventEmitter
    @ReactMethod
    fun addListener(eventName: String) {
        // Keep: Required for RN NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Keep: Required for RN NativeEventEmitter
    }

    /**
     * Check if an update is available
     */
    @ReactMethod
    fun checkForUpdate(promise: Promise) {
        try {
            val activity = reactContext.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "Activity is not available")
                return
            }

            appUpdateManager = AppUpdateManagerFactory.create(reactContext)
            val appUpdateInfoTask = appUpdateManager?.appUpdateInfo

            appUpdateInfoTask?.addOnSuccessListener { appUpdateInfo ->
                val result = Arguments.createMap().apply {
                    putInt("updateAvailability", appUpdateInfo.updateAvailability())
                    putBoolean(
                        "isUpdateAvailable",
                        appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                    )
                    putBoolean(
                        "isImmediateUpdateAllowed",
                        appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)
                    )
                    putBoolean(
                        "isFlexibleUpdateAllowed",
                        appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)
                    )
                    
                    // Version info
                    appUpdateInfo.availableVersionCode().let { 
                        putInt("availableVersionCode", it) 
                    }
                    
                    // Staleness days (how many days since update became available)
                    appUpdateInfo.clientVersionStalenessDays()?.let {
                        putInt("stalenessDays", it)
                    }
                    
                    // Update priority (0-5, set in Play Console)
                    putInt("updatePriority", appUpdateInfo.updatePriority())
                    
                    // Install status
                    putInt("installStatus", appUpdateInfo.installStatus())
                }
                promise.resolve(result)
            }?.addOnFailureListener { exception ->
                Log.e(TAG, "Failed to check for update", exception)
                promise.reject("CHECK_FAILED", exception.message, exception)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error checking for update", e)
            promise.reject("ERROR", e.message, e)
        }
    }

    /**
     * Start the update flow
     * @param updateType 0 = FLEXIBLE, 1 = IMMEDIATE
     */
    @ReactMethod
    fun startUpdate(updateType: Int, promise: Promise) {
        try {
            val activity = reactContext.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "Activity is not available")
                return
            }

            updatePromise = promise
            appUpdateManager = AppUpdateManagerFactory.create(reactContext)
            
            val appUpdateInfoTask = appUpdateManager?.appUpdateInfo
            appUpdateInfoTask?.addOnSuccessListener { appUpdateInfo ->
                if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE) {
                    val type = if (updateType == UPDATE_TYPE_IMMEDIATE) {
                        AppUpdateType.IMMEDIATE
                    } else {
                        AppUpdateType.FLEXIBLE
                    }
                    
                    // For flexible updates, register a listener
                    if (type == AppUpdateType.FLEXIBLE) {
                        registerInstallStateListener()
                    }

                    try {
                        val options = AppUpdateOptions.newBuilder(type).build()
                        appUpdateManager?.startUpdateFlowForResult(
                            appUpdateInfo,
                            activity,
                            options,
                            UPDATE_REQUEST_CODE
                        )
                    } catch (e: IntentSender.SendIntentException) {
                        Log.e(TAG, "Failed to start update flow", e)
                        updatePromise?.reject("START_FAILED", e.message, e)
                        updatePromise = null
                    }
                } else {
                    promise.reject("NO_UPDATE", "No update available")
                }
            }?.addOnFailureListener { exception ->
                Log.e(TAG, "Failed to get app update info", exception)
                promise.reject("INFO_FAILED", exception.message, exception)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting update", e)
            promise.reject("ERROR", e.message, e)
        }
    }

    /**
     * Complete the flexible update (triggers app restart)
     */
    @ReactMethod
    fun completeUpdate(promise: Promise) {
        try {
            appUpdateManager?.completeUpdate()
                ?.addOnSuccessListener {
                    promise.resolve(true)
                }
                ?.addOnFailureListener { exception ->
                    promise.reject("COMPLETE_FAILED", exception.message, exception)
                }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message, e)
        }
    }

    /**
     * Get the current install status
     */
    @ReactMethod
    fun getInstallStatus(promise: Promise) {
        try {
            appUpdateManager?.appUpdateInfo?.addOnSuccessListener { appUpdateInfo ->
                promise.resolve(appUpdateInfo.installStatus())
            }?.addOnFailureListener { exception ->
                promise.reject("STATUS_FAILED", exception.message, exception)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message, e)
        }
    }

    private fun registerInstallStateListener() {
        installStateListener = InstallStateUpdatedListener { state ->
            when (state.installStatus()) {
                InstallStatus.DOWNLOADED -> {
                    // Update downloaded, notify JS
                    sendEvent("onUpdateDownloaded", Arguments.createMap())
                }
                InstallStatus.INSTALLED -> {
                    // Update installed
                    unregisterInstallStateListener()
                    sendEvent("onUpdateInstalled", Arguments.createMap())
                }
                InstallStatus.FAILED -> {
                    unregisterInstallStateListener()
                    sendEvent("onUpdateFailed", Arguments.createMap())
                }
                InstallStatus.DOWNLOADING -> {
                    val progress = Arguments.createMap().apply {
                        putDouble("bytesDownloaded", state.bytesDownloaded().toDouble())
                        putDouble("totalBytesToDownload", state.totalBytesToDownload().toDouble())
                        val percent = if (state.totalBytesToDownload() > 0) {
                            (state.bytesDownloaded() * 100 / state.totalBytesToDownload()).toInt()
                        } else 0
                        putInt("percentComplete", percent)
                    }
                    sendEvent("onDownloadProgress", progress)
                }
            }
        }
        installStateListener?.let { appUpdateManager?.registerListener(it) }
    }

    private fun unregisterInstallStateListener() {
        installStateListener?.let { appUpdateManager?.unregisterListener(it) }
        installStateListener = null
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == UPDATE_REQUEST_CODE) {
            when (resultCode) {
                Activity.RESULT_OK -> {
                    updatePromise?.resolve("UPDATE_ACCEPTED")
                }
                Activity.RESULT_CANCELED -> {
                    updatePromise?.reject("UPDATE_CANCELED", "User canceled the update")
                }
                else -> {
                    updatePromise?.reject("UPDATE_FAILED", "Update failed with result code: $resultCode")
                }
            }
            updatePromise = null
        }
    }

    override fun onNewIntent(intent: Intent) {
        // Not needed for in-app updates
    }

    override fun invalidate() {
        super.invalidate()
        unregisterInstallStateListener()
        reactContext.removeActivityEventListener(this)
    }
}
