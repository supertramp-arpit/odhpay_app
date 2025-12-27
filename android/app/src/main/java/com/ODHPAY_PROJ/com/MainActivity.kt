package com.ODHPAY_PROJ.com
import android.graphics.Color
import androidx.core.view.WindowInsetsControllerCompat

import android.os.Build
import android.os.Bundle
import android.util.Log     

import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.net.Uri
import android.widget.Toast

import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper

import com.ODHPAY_PROJ.com.util.AppSignatureHelper
import com.ODHPAY_PROJ.com.BuildConfig


class MainActivity : ReactActivity() {

   // IMPORTANT: declare launcher here
  private lateinit var upiLauncher: ActivityResultLauncher<Intent>



  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)


    // Force system bars to black with light icons.
    window.statusBarColor = Color.BLACK
    window.navigationBarColor = Color.BLACK
    val insetsController = WindowInsetsControllerCompat(window, window.decorView)
    insetsController.isAppearanceLightStatusBars = false
    insetsController.isAppearanceLightNavigationBars = false


    // ✅ Print app hash(es) — guard to debug only if you want
    if (BuildConfig.DEBUG) {
      val sigHelper = AppSignatureHelper(this)
      val appCodes = sigHelper.getAppSignatures()
      Log.e("AppSignatureHelper", "App Signatures: $appCodes")
    }




    // Register UPI Launcher
    upiLauncher =
      registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val data = result.data
        Log.d("UPI_RESULT", "Returned: $data")

        val status = data?.getStringExtra("Status")
        if (status != null) {
          Toast.makeText(this, status, Toast.LENGTH_LONG).show()
        }
      }
  }


    // ============================================================================================
  //   PUBLIC METHODS: usable from React Native through Native Module
  // ============================================================================================

  fun startUPIPayment(uriString: String, packageName: String?) {
    val uri = Uri.parse(uriString)
    val intent = Intent(Intent.ACTION_VIEW, uri)

    if (packageName != null) {
      intent.setPackage(packageName)
    }

    upiLauncher.launch(intent)
  }

  fun isAppInstalled(packageName: String): Boolean {
    return try {
      packageManager.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
      true
    } catch (e: PackageManager.NameNotFoundException) {
      false
    }
  }

  fun isAppUpiReady(packageName: String): Boolean {
    val upiIntent = Intent(Intent.ACTION_VIEW, Uri.parse("upi://pay"))
    val activities: List<ResolveInfo> =
      packageManager.queryIntentActivities(upiIntent, PackageManager.MATCH_DEFAULT_ONLY)

    return activities.any { it.activityInfo.packageName == packageName }
  }
 // ============================================================================================


  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
