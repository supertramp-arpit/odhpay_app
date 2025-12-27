package com.ODHPAY_PROJ.com

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

import com.ODHPAY_PROJ.com.phonehint.PhoneHintPackage
import com.ODHPAY_PROJ.com.UPIPackage
import com.ODHPAY_PROJ.com.integrity.IntegrityPackage
import com.ODHPAY_PROJ.com.appupdate.AppUpdatePackage



// ✅ Just this one import is required for OTA:
// import expo.modules.updates.UpdatesController

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
      this,
      object : DefaultReactNativeHost(this) {

        



          override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages.toMutableList()
            packages.add(PhoneHintPackage())
            packages.add(UPIPackage())
            packages.add(IntegrityPackage())
            packages.add(AppUpdatePackage())

            return packages
  }


          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"
          
          // 🔑 Tell RN to use expo-updates bundle when not using Metro
          // override fun getJSBundleFile(): String? =
          // expo.modules.updates.UpdatesController.instance.launchAssetFile

          // override fun getBundleAssetName(): String? =
          // expo.modules.updates.UpdatesController.instance.bundleAssetName

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()

    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)


    // ✅ Initialize Updates (works for both release & dev-client when Metro is off)
    // UpdatesController.initialize(this)
    
    ApplicationLifecycleDispatcher.onApplicationCreate(this)


    com.ODHPAY_PROJ.com.util.AppSignatureHelper(this).getAppSignatures()
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
