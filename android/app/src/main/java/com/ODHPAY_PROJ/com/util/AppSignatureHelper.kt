package com.ODHPAY_PROJ.com.util

import android.content.Context
import android.content.ContextWrapper
import android.content.pm.PackageManager
import android.content.pm.Signature
import android.os.Build
import android.util.Base64
import android.util.Log
import java.security.MessageDigest

class AppSignatureHelper(context: Context) : ContextWrapper(context) {

  companion object {
    private const val TAG = "AppSignatureHelper"
    private const val NUM_HASHED_BYTES = 9
    private const val NUM_BASE64_CHAR = 11
  }

  fun getAppSignatures(): List<String> {
    return try {
      val certBytesList: List<ByteArray> = if (Build.VERSION.SDK_INT >= 28) {
        val pkgInfo = packageManager.getPackageInfo(
          packageName,
          PackageManager.GET_SIGNING_CERTIFICATES
        )
        val sigArray: Array<Signature> = pkgInfo.signingInfo?.let { s ->
          if (s.hasMultipleSigners()) {
            s.apkContentsSigners ?: emptyArray()
          } else {
            s.signingCertificateHistory ?: emptyArray()
          }
        } ?: emptyArray()
        sigArray.map { it.toByteArray() }
      } else {
        @Suppress("DEPRECATION")
        packageManager.getPackageInfo(packageName, PackageManager.GET_SIGNATURES)
          .signatures?.map { it.toByteArray() } ?: emptyList()
      }

      val hashes = certBytesList.map { certBytes ->
        val certSha256Hex = sha256(certBytes).toHexUpper()
        val input = "$packageName $certSha256Hex"
        val full = sha256(input.toByteArray(Charsets.UTF_8))
        val truncated = full.copyOfRange(0, NUM_HASHED_BYTES)
        val b64 = Base64.encodeToString(truncated, Base64.NO_PADDING or Base64.NO_WRAP)
        b64.substring(0, NUM_BASE64_CHAR)
      }

      Log.i(TAG, "App Signatures: $hashes")
      hashes
    } catch (t: Throwable) {
      Log.e(TAG, "Unable to obtain hash.", t)
      emptyList()
    }
  }

  private fun sha256(data: ByteArray): ByteArray =
    MessageDigest.getInstance("SHA-256").digest(data)

  private fun ByteArray.toHexUpper(): String =
    joinToString("") { "%02X".format(it) }
}
