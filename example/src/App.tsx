import * as React from 'react';

import { Text, Pressable, Alert, SafeAreaView, ScrollView } from 'react-native';

import PlugPag, {
  PlugPagEventData,
  PlugPagPaymentData,
  PlugPagPrintResult,
  PlugPagTransactionResult,
  PlugPagVoidData,
} from 'react-native-plugpag-service-wrapper';

import plugpagInstance, { activationCode } from './plugpagInstance';

import styles from './styles';

import LoadingView from './LoadingView';
import ActivityLog from './ActivityLog';

interface AppProps {}

interface AppState {
  isActivated: boolean;
  isLoading: boolean;
  loadingMessage: String;
  passwordDigits: number;
  logMessages: String[];
  showCancelButton: boolean;
}

export default class App extends React.Component<AppProps, AppState> {
  constructor(props: any) {
    super(props);

    this.state = {
      isActivated: false,
      isLoading: false,
      loadingMessage: '',
      passwordDigits: 0,
      logMessages: [],
      showCancelButton: false,
    };
  }

  componentDidMount() {
    plugpagInstance.initializeEventListener();
  }

  componentWillUnmount() {
    plugpagInstance.clearEventListener();
  }

  private showLoadingScreen(
    showCancelButton: boolean,
    executionCallback: Function
  ) {
    this.setState(
      {
        isLoading: true,
        loadingMessage: 'Loading...',
        showCancelButton,
      },
      async () => {
        try {
          await executionCallback();

          this.setState({
            isLoading: false,
          });
        } catch (e) {
          this.setState({
            isLoading: false,
            logMessages: [
              ...this.state.logMessages,
              `Something bad happened: ${JSON.stringify(e, null, 2)}`,
            ],
          });
        }
      }
    );
  }

  handleActivationCallback = (eventData: PlugPagEventData) => {
    this.setState({
      isLoading: true,
      loadingMessage: eventData.customMessage,
      logMessages: [...this.state.logMessages, JSON.stringify(eventData)],
    });
  };

  activateLibrary = () => {
    this.showLoadingScreen(false, async () => {
      plugpagInstance
        .initializeAndActivatePinpad(
          activationCode,
          this.handleActivationCallback
        )
        .then((result) => {
          if (result === PlugPag.RET_OK) {
            this.setState({
              isLoading: false,
              isActivated: true,
              logMessages: [
                ...this.state.logMessages,
                'Activated successfully',
              ],
            });
          } else {
            this.setState(
              {
                isLoading: false,
                isActivated: false,
                logMessages: [
                  ...this.state.logMessages,
                  'Unknow error activating',
                ],
              },
              () => {
                Alert.alert('Activation Status', 'Unknow error activating');
              }
            );
          }
        })
        .catch((reason) => {
          this.setState(
            {
              isLoading: false,
              isActivated: false,
              logMessages: [
                ...this.state.logMessages,
                `Error activating: ${reason}`,
              ],
            },
            () => {
              Alert.alert('Activation Status', `Error activating: ${reason}`);
            }
          );
        });
    });
  };

  handlePaymentResults = (eventData: PlugPagEventData) => {
    if (eventData.eventCode === 17) {
      this.setState({
        passwordDigits: 0,
        logMessages: [...this.state.logMessages, 'Reset password digits'],
      });
    } else if (eventData.eventCode === 16) {
      this.setState({
        passwordDigits: this.state.passwordDigits + 1,
        logMessages: [...this.state.logMessages, 'Add password digit'],
      });
    } else {
      this.setState({
        isLoading: true,
        loadingMessage: eventData.customMessage,
        logMessages: [
          ...this.state.logMessages,
          `Event: ${JSON.stringify(eventData, null, 2)}`,
        ],
      });
    }
  };

  handlePrintResults = (eventData: PlugPagPrintResult) => {
    this.setState({
      logMessages: [
        ...this.state.logMessages,
        `Event: ${JSON.stringify(eventData, null, 2)}`,
      ],
    });
  };

  doCharge = async (type: Number) => {
    this.setState(
      {
        passwordDigits: 0,
        showCancelButton: true,
      },
      () => {
        plugpagInstance
          .doPayment(
            {
              amount: Math.random() * 10000,
              type: type,
              printReceipt: true,
              installmentType: PlugPag.INSTALLMENT_TYPE_A_VISTA,
              installments: 1,
              userReference: 'TEST123',
            } as PlugPagPaymentData,
            this.handlePaymentResults,
            this.handlePrintResults
          )
          .then((transactionData: PlugPagTransactionResult) => {
            this.setState(
              {
                isLoading: false,
                logMessages: [
                  ...this.state.logMessages,
                  `Transaction Data: ${JSON.stringify(
                    transactionData,
                    null,
                    2
                  )}`,
                ],
              },
              () => {
                Alert.alert(
                  'Transaction Status',
                  `Transação efetuada com sucesso! ${transactionData.transactionId} - ${transactionData.transactionCode}`
                );
              }
            );
          })
          .catch((reason: any) => {
            this.setState(
              {
                isLoading: false,
                logMessages: [
                  ...this.state.logMessages,
                  `Transaction Failed: ${reason}`,
                ],
              },
              () => {
                Alert.alert(
                  'Transaction Status',
                  `Erro ao fazer transação: ${reason}`
                );
              }
            );
          });
      }
    );
  };

  doCreditCharge = () => {
    this.doCharge(PlugPag.TYPE_CREDITO);
  };

  doDebitCharge = () => {
    this.doCharge(PlugPag.TYPE_DEBITO);
  };

  isAuthenticated = () => {
    this.showLoadingScreen(false, async () => {
      try {
        const isAuthenticated = await plugpagInstance.isAuthenticated();
        Alert.alert(
          'Is Authenticated',
          `Is Authenticated: ${isAuthenticated ? 'Yes' : 'No'}`
        );
      } catch (e) {
        Alert.alert('Is Authenticated', `Something bad happened ${e}`);
      }
    });
  };

  isServiceBusy = () => {
    this.showLoadingScreen(false, async () => {
      try {
        const isServiceBusy = await plugpagInstance.isServiceBusy();
        Alert.alert(
          'Is Service Busy',
          `Is Service Busy: ${isServiceBusy ? 'Yes' : 'No'}`
        );
      } catch (e) {
        Alert.alert('Is Service Busy', `Something bad happened ${e}`);
      }
    });
  };

  getServiceInfo = () => {
    this.showLoadingScreen(false, async () => {
      try {
        const applicationCode = await plugpagInstance.getApplicationCode();
        const libVersion = await plugpagInstance.getLibVersion();

        Alert.alert(
          'Get Service Info',
          `Application Code: ${applicationCode}, Lib Version: ${libVersion}`
        );
      } catch (e) {
        Alert.alert('Get Service Info', `Something bad happened ${e}`);
      }
    });
  };

  abortAnyTransaction = () => {
    this.showLoadingScreen(false, async () => {
      try {
        const isAborted = await plugpagInstance.abort();

        Alert.alert(
          'Abort Transactions',
          `Is Aborted: ${isAborted ? 'Yes' : 'No'}`
        );
      } catch (e) {
        Alert.alert('Abort Transactions', `Something bad happened ${e}`);
      }
    });
  };

  reprintReceipt = (isCustomer: boolean) => {
    this.showLoadingScreen(false, async () => {
      try {
        var reprintResult: PlugPagPrintResult;
        if (isCustomer) {
          reprintResult = await plugpagInstance.reprintCustomerReceipt();
        } else {
          reprintResult = await plugpagInstance.reprintStablishmentReceipt();
        }

        this.setState({
          logMessages: [
            ...this.state.logMessages,
            `Reprint Result: ${JSON.stringify(reprintResult, null, 2)}`,
          ],
        });
      } catch (e) {
        this.setState({
          logMessages: [
            ...this.state.logMessages,
            `Something Bad Happened: ${JSON.stringify(e, null, 2)}`,
          ],
        });
      }
    });
  };

  reprintStablishmentReceipt = () => {
    this.reprintReceipt(false);
  };

  reprintCustomerReceipt = () => {
    this.reprintReceipt(true);
  };

  getLastApprovedTransaction = () => {
    this.showLoadingScreen(false, async () => {
      try {
        var lastApprovedTransaction: PlugPagTransactionResult =
          await plugpagInstance.getLastApprovedTransaction();

        this.setState({
          logMessages: [
            ...this.state.logMessages,
            `Last Approved Transaction: ${JSON.stringify(
              lastApprovedTransaction,
              null,
              2
            )}`,
          ],
        });
      } catch (e) {
        this.setState({
          logMessages: [
            ...this.state.logMessages,
            `Something Bad Happened: ${JSON.stringify(e, null, 2)}`,
          ],
        });
      }
    });
  };

  voidLastTransaction = () => {
    this.showLoadingScreen(false, async () => {
      try {
        var lastApprovedTransaction: PlugPagTransactionResult =
          await plugpagInstance.getLastApprovedTransaction();
        var cancelTransactionReturn: PlugPagTransactionResult =
          await plugpagInstance.voidPayment(
            {
              transactionCode: lastApprovedTransaction.transactionCode,
              transactionId: lastApprovedTransaction.transactionId,
              printReceipt: true,
            } as PlugPagVoidData,
            this.handlePaymentResults,
            this.handlePrintResults
          );

        this.setState(
          {
            isLoading: false,
            logMessages: [
              ...this.state.logMessages,
              `Transaction Data: ${JSON.stringify(
                cancelTransactionReturn,
                null,
                2
              )}`,
            ],
          },
          () => {
            Alert.alert(
              'Transaction Status',
              `Transação estornada com sucesso! ${cancelTransactionReturn.transactionId} - ${cancelTransactionReturn.transactionCode}`
            );
          }
        );
      } catch (e) {
        this.setState(
          {
            isLoading: false,
            logMessages: [
              ...this.state.logMessages,
              `Transaction Failed: ${e}`,
            ],
          },
          () => {
            Alert.alert(
              'Transaction Status',
              `Erro ao estornar transação: ${e}`
            );
          }
        );
      }
    });
  };

  renderPaymentButtons = () => {
    return (
      <React.Fragment>
        <Pressable onPress={this.doCreditCharge} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Do Credit Charge</Text>
        </Pressable>

        <Pressable onPress={this.doDebitCharge} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Do Debit Charge</Text>
        </Pressable>

        <Pressable
          onPress={this.isAuthenticated}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Check Is Authenticated</Text>
        </Pressable>

        <Pressable onPress={this.getServiceInfo} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Get Service Info</Text>
        </Pressable>

        <Pressable onPress={this.isServiceBusy} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Check Is Service Busy</Text>
        </Pressable>

        <Pressable
          onPress={this.reprintStablishmentReceipt}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            Reprint Stablishment Receipt
          </Text>
        </Pressable>

        <Pressable
          onPress={this.reprintCustomerReceipt}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Reprint Customer Receipt</Text>
        </Pressable>

        <Pressable
          onPress={this.getLastApprovedTransaction}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            Get Last Approved Transaction
          </Text>
        </Pressable>

        <Pressable
          onPress={this.voidLastTransaction}
          style={styles.dangerButton}
        >
          <Text style={styles.dangerButtonText}>Void Last Transaction</Text>
        </Pressable>
      </React.Fragment>
    );
  };

  renderInitialButtons = () => {
    return (
      <React.Fragment>
        <Pressable onPress={this.activateLibrary} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Activate</Text>
        </Pressable>
        <Pressable
          onPress={this.abortAnyTransaction}
          style={styles.dangerButton}
        >
          <Text style={styles.dangerButtonText}>Abort Transactions</Text>
        </Pressable>
      </React.Fragment>
    );
  };

  render() {
    return (
      <SafeAreaView style={styles.container}>
        {this.state.isLoading ? (
          <LoadingView
            message={this.state.loadingMessage}
            passwordDigits={this.state.passwordDigits}
            showCancelButton={this.state.showCancelButton}
            eventDataCallback={(eventData: any) => {
              this.setState({
                logMessages: [
                  ...this.state.logMessages,
                  `Event: ${JSON.stringify(eventData)}`,
                ],
              });
            }}
          />
        ) : null}

        <ScrollView
          style={styles.buttonContainer}
          contentContainerStyle={styles.buttonContainerContent}
        >
          {this.state.isActivated
            ? this.renderPaymentButtons()
            : this.renderInitialButtons()}
        </ScrollView>

        <ActivityLog
          logMessages={this.state.logMessages}
          style={styles.activityLog}
        />
      </SafeAreaView>
    );
  }
}
