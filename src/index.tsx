import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';

import PlugpagServiceWrapper, {
  PlugPagCustomPrinterLayout,
  PlugPagPrinterData,
  PlugPagPaymentData,
  PlugPagTransactionResult,
  CallbackMapping,
  EventInformation,
  PlugPagEventData,
  PlugPagPrintResult,
} from './serviceWrapper';

export {
  PlugPagCustomPrinterLayout,
  PlugPagPrinterData,
  PlugPagPaymentData,
  PlugPagTransactionResult,
  CallbackMapping,
  EventInformation,
  PlugPagEventData,
  PlugPagPrintResult,
};

export class PlugPagAppIdentification {
  public name: String;
  public version: String;

  constructor(name: String, version: String) {
    this.name = name;
    this.version = version;
  }
}

export default class PlugPag {
  static readonly RET_OK = 0;
  static readonly REQUEST_CODE_AUTHENTICATION = 46981;
  static readonly TYPE_CREDITO = 1;
  static readonly TYPE_DEBITO = 2;
  static readonly TYPE_VOUCHER = 3;
  static readonly TYPE_QRCODE = 4;
  static readonly TYPE_PIX = 5;
  static readonly INSTALLMENT_TYPE_A_VISTA = 1;
  static readonly INSTALLMENT_TYPE_PARC_VENDEDOR = 2;
  static readonly INSTALLMENT_TYPE_PARC_COMPRADOR = 3;
  static readonly ERROR_REQUIREMENTS_MISSING_PERMISSIONS = -3000;
  static readonly ERROR_REQUIREMENTS_ROOT_PERMISSION = -3001;

  public appIdentification: PlugPagAppIdentification;

  constructor(appIdentification: PlugPagAppIdentification) {
    this.appIdentification = appIdentification;
  }

  private eventListener: EmitterSubscription | undefined;
  private callbackMapping: CallbackMapping = {};
  public initializeEventListener() {
    if (!this.eventListener) {
      const eventEmitter: NativeEventEmitter = new NativeEventEmitter(
        NativeModules.PlugpagServiceWrapper
      );
      this.eventListener = eventEmitter.addListener(
        'PlugpagServiceWrapperEvents',
        async (event: EventInformation) => {
          if (this.callbackMapping[event.eventName]) {
            await this.callbackMapping[event.eventName](event.params);
          }
        }
      );
    }
  }
  public clearEventListener() {
    this.eventListener?.remove();
  }

  private getEventNameForCallback(callBack: Function): String {
    const eventName = `PlugPag-Event-${Math.random()}-${new Date().getTime()}`;
    this.callbackMapping[eventName] = callBack;

    return eventName;
  }

  public getAppIdentification(): PlugPagAppIdentification {
    return this.appIdentification;
  }

  public getApplicationCode(): Promise<String> {
    return PlugpagServiceWrapper.getApplicationCode();
  }

  public getLibVersion(): Promise<string> {
    return PlugpagServiceWrapper.getLibVersion();
  }

  public invalidateAuthentication(): Promise<boolean> {
    return PlugpagServiceWrapper.invalidateAuthentication();
  }

  public isAuthenticated(): Promise<boolean> {
    return PlugpagServiceWrapper.isAuthenticated();
  }

  public isServiceBusy(): Promise<boolean> {
    return PlugpagServiceWrapper.isServiceBusy();
  }

  public setPlugPagCustomPrinterLayout(
    layoutParams: PlugPagCustomPrinterLayout
  ): Promise<boolean> {
    return PlugpagServiceWrapper.setPlugPagCustomPrinterLayout(layoutParams);
  }

  public printFromFile(printerData: PlugPagPrinterData): Promise<boolean> {
    return PlugpagServiceWrapper.printFromFile(printerData);
  }

  public initializeAndActivatePinpad(
    activationCode: string,
    activationCallback: Function
  ): Promise<Number> {
    const eventName = this.getEventNameForCallback(activationCallback);

    return PlugpagServiceWrapper.initializeAndActivatePinpad(
      this.appIdentification.name,
      this.appIdentification.version,
      activationCode,
      eventName
    );
  }

  public doPayment(
    paymentData: PlugPagPaymentData,
    paymentProgressCallback: Function,
    printerEventCallback: Function
  ): Promise<PlugPagTransactionResult> {
    const paymentProgressEventName = this.getEventNameForCallback(
      paymentProgressCallback
    );
    const printerEventName = this.getEventNameForCallback(printerEventCallback);

    return PlugpagServiceWrapper.doPayment(
      paymentData,
      paymentProgressEventName,
      printerEventName
    );
  }
}
