package com.reactnativeplugpagservicewrapper

import android.annotation.SuppressLint
import android.os.Build
import android.util.Log
import br.com.uol.pagseguro.plugpagservice.wrapper.*
import br.com.uol.pagseguro.plugpagservice.wrapper.listeners.*
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class PlugpagServiceWrapperModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    @SuppressLint("StaticFieldLeak")
    var plugpag: PlugPag? = null
    var isTransactionInCourse: Boolean = false
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

  private fun resolveTransactionResultToPromise(it: PlugPagTransactionResult, promise: Promise) {
    promise.resolve(
      writableMapOf(
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
      )
    )
  }

  private fun resolvePrintResultToWritableMap(printerResult: PlugPagPrintResult): WritableMap {
    return writableMapOf(
      "errorCode" to printerResult.errorCode,
      "message" to printerResult.message,
      "result" to printerResult.result,
      "steps" to printerResult.steps
    )
  }

  /*
  * TODO: Test this method with a proper NFC card
  */
  private fun resolveNFCResultToWriteableMap(nfcResult: PlugPagNFCResult): WritableMap {
    val returnResult = writableMapOf(
      "startSlot" to nfcResult.startSlot,
      "endSlot" to nfcResult.endSlot,
      "result" to nfcResult.result
    )

    val slotsArray = Arguments.createArray()
    nfcResult.slots.iterator().forEach { itMap ->
      val slotMap = Arguments.createMap()
      itMap.iterator().forEach { itObject ->
        slotMap.putString(itObject.key, itObject.value.toString())
      }
      slotsArray.pushMap(slotMap)
    }

    returnResult.putArray("slots", slotsArray)

    return returnResult
  }

  /*
  * TODO: Test this method with a proper NFC card
  */
  private fun resolveNearFieldCardDataToPlugPag(nearFieldCardData: ReadableMap): PlugPagNearFieldCardData {
    val nearFieldCardDataInstance = PlugPagNearFieldCardData()
    nearFieldCardDataInstance.startSlot = nearFieldCardData.getInt("startSlot")
    nearFieldCardDataInstance.endSlot = nearFieldCardData.getInt("endSlot")

    if ( nearFieldCardData.hasKey("slots") ) {
      nearFieldCardData.getArray("slots")?.toArrayList()?.forEach {
        val slotIndex = nearFieldCardDataInstance.slots.count()
        val slotData = it as String
        nearFieldCardDataInstance.slots[slotIndex].put(
          "data", slotData.toByteArray()
        )
      }
    }

    return nearFieldCardDataInstance
  }

  @ReactMethod
  fun checkIsDeviceSupported(promise: Promise) {
    if (Build.VERSION.SDK_INT in 25..28) {
      promise.resolve(true)
    }
    else {
      promise.reject("1", "Android SDK version is not supported, it requires between 25-28 (inclusive)")
    }
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
  fun abort(promise: Promise) {
    if ( plugpag != null ) {
      plugpag?.asyncAbort(object : PlugPagAbortListener {
        override fun onAbortRequested(abortRequested: Boolean) {
          promise.resolve(abortRequested)
        }

        override fun onError(errorMessage: String) {
          promise.reject("2", errorMessage)
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
    val appIdentification = PlugPagAppIdentification(appName, appVersion)
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
    if ( plugpag != null ) {
      if ( ! isTransactionInCourse ) {
        val pPagPaymentData = PlugPagPaymentData(
          paymentData.getInt("type"),
          paymentData.getInt("amount"),
          paymentData.getInt("installmentType"),
          paymentData.getInt("installments"),
          paymentData.getString("userReference"),
          paymentData.getBoolean("printReceipt")
        );

        isTransactionInCourse = true
        plugpag?.doAsyncPayment(pPagPaymentData, object : PlugPagPaymentListener {
          override fun onError(it: PlugPagTransactionResult) {
            isTransactionInCourse = false

            promise.reject(it.errorCode, it.message)
          }

          override fun onPaymentProgress(eventData: PlugPagEventData) {
            sendEvent(
              reactApplicationContext, paymentProgressEventName, writableMapOf(
                "customMessage" to eventData.customMessage,
                "eventCode" to eventData.eventCode
              )
            )
          }

          override fun onPrinterError(printerResult: PlugPagPrintResult) {
            sendEvent(
              reactApplicationContext, printerEventName, resolvePrintResultToWritableMap(printerResult)
            )
          }

          override fun onPrinterSuccess(printerResult: PlugPagPrintResult) {
            sendEvent(
              reactApplicationContext, printerEventName, resolvePrintResultToWritableMap(printerResult)
            )
          }

          override fun onSuccess(it: PlugPagTransactionResult) {
            isTransactionInCourse = false

            resolveTransactionResultToPromise(it, promise)
          }
        })
      }
      else {
        promise.reject("2", "There's a transaction in course, please cancel, or complete, any transactions before starting a new one")
      }
    }
    else {
      promise.reject("1", "PlugPag is not initialized")
    }
  }

  @ReactMethod
  fun voidPayment(paymentData: ReadableMap, paymentProgressEventName: String, printerEventName: String, promise: Promise) {
    if ( plugpag != null ) {
      if ( ! isTransactionInCourse ) {
        isTransactionInCourse = true

        val voidData = PlugPagVoidData(
          transactionCode = paymentData.getString("transactionCode")!!,
          transactionId = paymentData.getString("transactionId")!!,
          printReceipt = paymentData.getBoolean("printReceipt"),
        )

        plugpag?.doAsyncVoidPayment(voidData, object: PlugPagPaymentListener {
          override fun onError(it: PlugPagTransactionResult) {
            isTransactionInCourse = false

            promise.reject(it.errorCode, it.message)
          }

          override fun onPaymentProgress(eventData: PlugPagEventData) {
            sendEvent(
              reactApplicationContext, paymentProgressEventName, writableMapOf(
                "customMessage" to eventData.customMessage,
                "eventCode" to eventData.eventCode
              )
            )
          }

          override fun onPrinterError(printerResult: PlugPagPrintResult) {
            sendEvent(
              reactApplicationContext, printerEventName, resolvePrintResultToWritableMap(printerResult)
            )
          }

          override fun onPrinterSuccess(printerResult: PlugPagPrintResult) {
            sendEvent(
              reactApplicationContext, printerEventName, resolvePrintResultToWritableMap(printerResult)
            )
          }

          override fun onSuccess(it: PlugPagTransactionResult) {
            isTransactionInCourse = false

            resolveTransactionResultToPromise(it, promise)
          }
        })
      }
      else {
        promise.reject("2", "There's a transaction in course, please cancel, or complete, any transactions before starting a new one")
      }
    }
    else {
      promise.reject("1", "PlugPag is not initialized")
    }
  }

  @ReactMethod
  fun reprintStablishmentReceipt(promise: Promise) {
    if ( plugpag != null ) {
      plugpag?.asyncReprintEstablishmentReceipt(object : PlugPagPrinterListener {
        override fun onError(printerResult: PlugPagPrintResult) {
          promise.reject("2", resolvePrintResultToWritableMap(printerResult))
        }

        override fun onSuccess(printerResult: PlugPagPrintResult) {
          promise.resolve(resolvePrintResultToWritableMap(printerResult))
        }
      })
    }
    else {
      promise.reject("1", writableMapOf(
        "errorCode" to "1",
        "message" to "PlugPag is not initialized",
        "result" to "",
        "steps" to 0
      ))
    }
  }

  @ReactMethod
  fun reprintCustomerReceipt(promise: Promise) {
    if ( plugpag != null ) {
      plugpag?.asyncReprintCustomerReceipt(object : PlugPagPrinterListener {
        override fun onError(printerResult: PlugPagPrintResult) {
          promise.reject("2", resolvePrintResultToWritableMap(printerResult))
        }

        override fun onSuccess(printerResult: PlugPagPrintResult) {
          promise.resolve(resolvePrintResultToWritableMap(printerResult))
        }
      })
    }
    else {
      promise.reject("1", writableMapOf(
        "errorCode" to "1",
        "message" to "PlugPag is not initialized",
        "result" to "",
        "steps" to 0
      ))
    }
  }

  @ReactMethod
  fun calculateInstallments(saleValue: Int, promise: Promise) {
    if ( plugpag != null ) {
      plugpag?.asyncCalculateInstallments(saleValue.toString(), object: PlugPagInstallmentsListener {
        override fun onCalculateInstallments(installments: Array<String>) {
          promise.resolve(installments)
        }

        override fun onError(errorMessage: String) {
          promise.reject("2", errorMessage)
        }
      })
    }
    else {
      promise.reject("1", "PlugPag is not initialized")
    }
  }

  @ReactMethod
  fun getLastApprovedTransaction(promise: Promise) {
    if ( plugpag != null ) {
      plugpag?.asyncGetLastApprovedTransaction(object: PlugPagLastTransactionListener {
        override fun onError(errorMessage: String) {
          promise.reject("2", errorMessage)
        }

        override fun onRequestedLastTransaction(lastTransaction: PlugPagTransactionResult) {
          resolveTransactionResultToPromise(lastTransaction, promise)
        }
      })
    }
    else {
      promise.reject("1", "PlugPag is not initialized")
    }
  }

  @ReactMethod
  fun readFromNFCCard(nearFieldCardData: ReadableMap, promise: Promise) {
    if ( plugpag != null ) {
      val nearFieldCardDataInstance = resolveNearFieldCardDataToPlugPag(nearFieldCardData)

      plugpag?.asyncReadNFC(nearFieldCardDataInstance, object : PlugPagNFCListener {
        override fun onError(errorMessage: String) {
          promise.reject("2", errorMessage)
        }

        override fun onSuccess(plugPagNFCResult: PlugPagNFCResult) {
          promise.resolve(resolveNFCResultToWriteableMap(plugPagNFCResult))
        }
      })
    }
    else {
      promise.reject("1", "PlugPag is not initialized")
    }
  }

  @ReactMethod
  fun writeToNFCCard(nearFieldCardData: ReadableMap, promise: Promise) {
    if ( plugpag != null ) {
      val nearFieldCardDataInstance = resolveNearFieldCardDataToPlugPag(nearFieldCardData)

      plugpag?.asyncWriteNFC(nearFieldCardDataInstance, object : PlugPagNFCListener {
        override fun onError(errorMessage: String) {
          promise.reject("2", errorMessage)
        }

        override fun onSuccess(plugPagNFCResult: PlugPagNFCResult) {
          promise.resolve(resolveNFCResultToWriteableMap(plugPagNFCResult))
        }
      })
    }
    else {
      promise.reject("1", "PlugPag is not initialized")
    }
  }
}
