package com.reactnativeplugpagservicewrapper

import android.util.Log
import br.com.uol.pagseguro.plugpagservice.wrapper.*
import br.com.uol.pagseguro.plugpagservice.wrapper.listeners.PlugPagAbortListener
import br.com.uol.pagseguro.plugpagservice.wrapper.listeners.PlugPagActivationListener
import br.com.uol.pagseguro.plugpagservice.wrapper.listeners.PlugPagIsActivatedListener
import br.com.uol.pagseguro.plugpagservice.wrapper.listeners.PlugPagPaymentListener
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class PlugpagServiceWrapperModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    var plugpag: PlugPag? = null
  }

  override fun getName(): String {
    return "PlugpagServiceWrapper"
  }

  private fun sendEvent(reactContext: ReactContext, eventName: String, params: WritableMap) {
    Log.d(this.name, "Sending event: $eventName");
    reactContext
      .getJSModule<DeviceEventManagerModule.RCTDeviceEventEmitter>(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(this.name + "Events", writableMapOf(
        "eventName" to eventName,
        "params" to params
      ))
  }

  @ReactMethod
  fun getApplicationCode(promise: Promise) {
    if ( plugpag == null ) {
      promise.reject("1", "PlugPag is not initialized");
    }
    else {
      val applicationCode = plugpag?.getApplicationCode();
      promise.resolve(applicationCode);
    }
  }

  @ReactMethod
  fun getLibVersion(promise: Promise) {
    if ( plugpag == null ) {
      promise.reject("1", "PlugPag is not initialized");
    }
    else {
      val libVersion = plugpag?.getLibVersion();
      promise.resolve(libVersion);
    }
  }

  @ReactMethod
  fun invalidateAuthentication(promise: Promise) {
    if ( plugpag == null ) {
      promise.reject("1", "PlugPag is not initialized");
    }
    else {
      plugpag?.invalidateAuthentication()
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun isAuthenticated(promise: Promise) {
    if ( plugpag == null ) {
      promise.reject("1", "PlugPag is not initialized");
    }
    else {
      plugpag?.asyncIsAuthenticated(object: PlugPagIsActivatedListener {
        override fun onError(errorMessage: String) {
          promise.reject("2", errorMessage);
        }

        override fun onIsActivated(isActivated: Boolean) {
          promise.resolve(isActivated);
        }

      })
    }
  }

  @ReactMethod
  fun isServiceBusy(promise: Promise) {
    if ( plugpag == null ) {
      promise.reject("1", "PlugPag is not initialized");
    }
    else {
      promise.resolve(
        plugpag?.isServiceBusy()
      )
    }
  }

  @ReactMethod
  fun printFromFile(printerData: ReadableMap, promise: Promise) {
    if ( plugpag == null ) {
      promise.reject("1", "PlugPag is not initialized");
    }
    else {
      val result: PlugPagPrintResult? = plugpag?.printFromFile(PlugPagPrinterData(
        printerData.getString("filePath")!!,
        printerData.getInt("printerQuality"),
        printerData.getInt("step")
      ))

      if ( result?.result == PlugPag.RET_OK ) {
        promise.resolve(true)
      }
      else {
        promise.reject(result?.errorCode, result?.message)
      }
    }
  }

  @ReactMethod
  fun abort(eventName: String, promise: Promise) {
    if ( plugpag != null ) {
      plugpag?.asyncAbort(object : PlugPagAbortListener {
        override fun onAbortRequested(abortRequested: Boolean) {
          sendEvent(reactApplicationContext, eventName, writableMapOf(
            "abortRequested" to abortRequested
          ))
        }

        override fun onError(errorMessage: String) {
          sendEvent(reactApplicationContext, eventName, writableMapOf(
            "errorMessage" to errorMessage
          ))
        }
      })
    }
    else {
      promise.reject("1", "PlugPag is not initialized");
    }
  }

  @ReactMethod
  fun setPlugPagCustomPrinterLayout(layoutParams: ReadableMap, promise: Promise) {
    if ( plugpag != null ) {
      plugpag?.setPlugPagCustomPrinterLayout(PlugPagCustomPrinterLayout(
        title = layoutParams.getString("title"),
        buttonBackgroundColor = layoutParams.getString("buttonBackgroundColor"),
        buttonBackgroundColorDisabled = layoutParams.getString("buttonBackgroundColorDisabled"),
        cancelTextColor = layoutParams.getString("cancelTextColor"),
        sendSMSTextColor = layoutParams.getString("sendSMSTextColor"),
        confirmTextColor = layoutParams.getString("confirmTextColor"),
        titleColor = layoutParams.getString("titleColor"),
        windowBackgoundColor = layoutParams.getString("windowBackgroundColor"),
        maxTimeShowPopup = layoutParams.getInt("maxTimeShowPopup")
      ))

      promise.resolve(true);
    }
    else {
      promise.reject("1", "PlugPag is not initialized");
    }
  }

  @ReactMethod
  fun initializeAndActivatePinpad(appName: String, appVersion: String, activationCode: String, eventName: String, promise: Promise) {
    val appIdentification: PlugPagAppIdentification = PlugPagAppIdentification(appName, appVersion)
    if ( plugpag == null ) {
      plugpag = PlugPag(reactApplicationContext, appIdentification)
    }

    plugpag?.doAsyncInitializeAndActivatePinpad(
      PlugPagActivationData(activationCode),
      object: PlugPagActivationListener {
        override fun onActivationProgress(data: PlugPagEventData) {
          sendEvent(reactApplicationContext, eventName, writableMapOf(
            "customMessage" to data.customMessage,
            "eventCode" to data.eventCode
          ))
        }

        override fun onError(result: PlugPagInitializationResult) {
          promise.reject(result.errorCode, result.errorMessage)
        }

        override fun onSuccess(result: PlugPagInitializationResult) {
          promise.resolve(result.result)
        }
      }
    )
  }

  @ReactMethod
  fun doPayment(paymentData: ReadableMap, paymentProgressEventName: String, printerEventName: String, promise: Promise) {
    val pPagPaymentData: PlugPagPaymentData = PlugPagPaymentData(
      paymentData.getInt("type"),
      paymentData.getInt("amount"),
      paymentData.getInt("installmentType"),
      paymentData.getInt("installments"),
      paymentData.getString("userReference"),
      paymentData.getBoolean("printReceipt")
    );

    plugpag?.doAsyncPayment(pPagPaymentData, object: PlugPagPaymentListener {
      override fun onError(it: PlugPagTransactionResult) {
        promise.reject(it.errorCode, it.message)
      }

      override fun onPaymentProgress(eventData: PlugPagEventData) {
        sendEvent(reactApplicationContext, paymentProgressEventName, writableMapOf(
          "customMessage" to eventData.customMessage,
          "eventCode" to eventData.eventCode
        ))
      }

      override fun onPrinterError(printerResult: PlugPagPrintResult) {
        sendEvent(reactApplicationContext, printerEventName, writableMapOf(
          "errorCode" to printerResult.errorCode,
          "message" to printerResult.message,
          "result" to printerResult.result,
          "steps" to printerResult.steps
        ))
      }

      override fun onPrinterSuccess(printerResult: PlugPagPrintResult) {
        sendEvent(reactApplicationContext, printerEventName, writableMapOf(
          "errorCode" to printerResult.errorCode,
          "message" to printerResult.message,
          "result" to printerResult.result,
          "steps" to printerResult.steps
        ))
      }

      override fun onSuccess(it: PlugPagTransactionResult) {
        promise.resolve(writableMapOf(
          "amount" to it.amount,
          "appIdentification" to it.appIdentification,
          "autoCode" to it.autoCode,
          "availableBalance" to it.availableBalance,
          "bin" to it.bin,
          "buyerName" to it.buyerName,
          "cardApplication" to it.cardApplication,
          "cardBrand" to it.cardBrand,
          "cardHash" to it.cardHash,
          "date" to it.date,
          "errorCode" to it.errorCode,
          "extendedHolderName" to it.extendedHolderName,
          "holder" to it.holder,
          "holderName" to it.holderName,
          "hostNsu" to it.hostNsu,
          "installments" to String.format("%s", it.installments),
          "label" to it.label,
          "message" to it.message,
          "nsu" to it.nsu,
          "originalAmount" to it.originalAmount,
          "paymentType" to it.paymentType,
          "preAutoDueDate" to it.preAutoDueDate,
          "preAutoOriginalAmount" to it.preAutoOriginalAmount,
          "readerModel" to it.readerModel,
          "result" to it.result,
          "terminalSerialNumber" to it.terminalSerialNumber,
          "time" to it.time,
          "transactionCode" to it.transactionCode,
          "transactionId" to it.transactionId,
          "typeTransaction" to it.typeTransaction,
          "userReference" to it.userReference
        ))
      }
    })
  }
}
