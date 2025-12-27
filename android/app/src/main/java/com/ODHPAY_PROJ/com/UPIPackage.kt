package com.ODHPAY_PROJ.com

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class UPIPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> {
    return listOf(UPIModule(context))
  }
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
