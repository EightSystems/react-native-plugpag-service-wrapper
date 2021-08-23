import { NativeModules } from 'react-native';

export type PlugPagCustomPrinterLayout = {
  title: String;
  buttonBackgroundColor: String;
  buttonBackgroundColorDisabled: String;
  cancelTextColor: String;
  sendSMSTextColor: String;
  confirmTextColor: String;
  titleColor: String;
  windowBackgoundColor: String;
  maxTimeShowPopup: Number;
};

export type PlugPagPrinterData = {
  filePath: String;
  printerQuality: Number;
  step: Number;
};

export type PlugPagPaymentData = {
  type: Number;
  amount: Number;
  installmentType: Number;
  installments: Number;
  userReference: String;
  printReceipt: Boolean;
};

export type PlugPagVoidData = {
  transactionCode: String;
  transactionId: String;
  printReceipt: Boolean;
};

export type PlugPagNearFieldCardData = {
  startSlot: Number;
  endSlot: Number;
  slots?: Map<String, String>[];
};

export type PlugPagNFCResult = {
  startSlot: Number;
  endSlot: Number;
  result: Number;
  slots?: Map<String, String>[];
};

export type PlugPagTransactionResult = {
  amount: String;
  appIdentification: String;
  autoCode: String;
  availableBalance: String;
  bin: String;
  buyerName: String;
  cardApplication: String;
  cardBrand: String;
  cardHash: String;
  date: String;
  errorCode: String;
  extendedHolderName: String;
  holder: String;
  holderName: String;
  hostNsu: String;
  installments: String;
  label: String;
  message: String;
  nsu: String;
  originalAmount: Number;
  paymentType: Number;
  preAutoDueDate: String;
  preAutoOriginalAmount: String;
  readerModel: String;
  result: Number;
  terminalSerialNumber: String;
  time: String;
  transactionCode: String;
  transactionId: String;
  typeTransaction: String;
  userReference: String;
};

export type EventInformation = {
  eventName: string;
  params: any;
};

export type CallbackMapping = {
  [key: string]: Function;
};

export type PlugPagEventData = {
  eventCode: Number;
  customMessage: String;
};

export type PlugPagPrintResult = {
  errorCode: String;
  message: String;
  result: Number;
  steps: Number;
};

type PlugpagServiceWrapperType = {
  abort(): Promise<boolean>;

  getApplicationCode(): Promise<string>;
  getLibVersion(): Promise<string>;

  checkIsDeviceSupported(): Promise<boolean>;

  invalidateAuthentication(): Promise<boolean>;
  isAuthenticated(): Promise<boolean>;
  isServiceBusy(): Promise<boolean>;

  setPlugPagCustomPrinterLayout(
    layoutParams: PlugPagCustomPrinterLayout
  ): Promise<boolean>;
  printFromFile(printerData: PlugPagPrinterData): Promise<boolean>;

  reprintStablishmentReceipt(): Promise<PlugPagPrintResult>;
  reprintCustomerReceipt(): Promise<PlugPagPrintResult>;

  calculateInstallments(saleValue: Number): Promise<String[]>;

  initializeAndActivatePinpad(
    appName: String,
    appVersion: String,
    activationCode: String,
    eventName: String
  ): Promise<Number>;

  doPayment(
    paymentData: PlugPagPaymentData,
    paymentProgressEventName: String,
    printerEventName: String
  ): Promise<PlugPagTransactionResult>;

  voidPayment(
    paymentData: PlugPagVoidData,
    paymentProgressEventName: String,
    printerEventName: String
  ): Promise<PlugPagTransactionResult>;

  getLastApprovedTransaction(): Promise<PlugPagTransactionResult>;

  readFromNFCCard(
    nearFieldCardData: PlugPagNearFieldCardData
  ): Promise<PlugPagNFCResult>;
  writeToNFCCard(
    nearFieldCardData: PlugPagNearFieldCardData
  ): Promise<PlugPagNFCResult>;
};

const { PlugpagServiceWrapper } = NativeModules;

export default PlugpagServiceWrapper as PlugpagServiceWrapperType;
