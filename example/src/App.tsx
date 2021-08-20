import * as React from 'react';

import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import PlugPag, {
  PlugPagAppIdentification,
  PlugPagEventData,
  PlugPagPaymentData,
  PlugPagPrintResult,
  PlugPagTransactionResult,
} from 'react-native-plugpag-service-wrapper';
import { version as appVersion } from '../package.json';
const activationCode = '403938';

const plugpagInstance = new PlugPag(
  new PlugPagAppIdentification('TEST APP', appVersion)
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  loadingBackground: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'flex-start',
    left: 0,
    position: 'absolute',
    right: 0,
    top: -300,
    backgroundColor: 'white',
  },
  activityIndicator: {
    flex: 1,
  },
  loadingContainer: {
    backgroundColor: 'transparent',
    bottom: 0,
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  textContainer: {
    alignItems: 'center',
    bottom: 0,
    flex: 1,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  textContent: {
    fontSize: 20,
    fontWeight: 'bold',
    height: 50,
    top: 80,
  },
});

interface LoadingProps {
  message: String | undefined;
  passwordDigits: number | undefined;
}

const LoadingView = ({ message, passwordDigits }: LoadingProps) => (
  <Modal visible={true}>
    <View style={styles.loadingBackground}>
      <ActivityIndicator
        color={'black'}
        size={'large'}
        style={styles.activityIndicator}
      />

      <View style={styles.textContainer}>
        <Text style={styles.textContent}>{message}</Text>
        {passwordDigits && passwordDigits > 0 ? (
          <Text style={styles.textContent}>{'⬤'.repeat(+passwordDigits)}</Text>
        ) : null}
      </View>
    </View>
  </Modal>
);

interface AppProps {}

interface AppState {
  isActivated: boolean;
  isLoading: boolean;
  loadingMessage: String;
  passwordDigits: number;
}
export default class App extends React.Component<AppProps, AppState> {
  constructor(props: any) {
    super(props);

    this.state = {
      isActivated: false,
      isLoading: false,
      loadingMessage: '',
      passwordDigits: 0,
    };
  }

  componentDidMount() {
    plugpagInstance.initializeEventListener();
  }

  componentWillUnmount() {
    plugpagInstance.clearEventListener();
  }

  handleActivationCallback = (eventData: PlugPagEventData) => {
    console.log(eventData);
    this.setState({
      isLoading: true,
      loadingMessage: eventData.customMessage,
    });
  };

  activateLibrary = () => {
    plugpagInstance
      .initializeAndActivatePinpad(
        activationCode,
        this.handleActivationCallback
      )
      .then((result) => {
        if (result === PlugPag.RET_OK) {
          this.setState(
            {
              isLoading: false,
              isActivated: true,
            },
            () => {
              Alert.alert('Activation Status', 'Activated');
            }
          );
        } else {
          this.setState(
            {
              isLoading: false,
              isActivated: false,
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
          },
          () => {
            Alert.alert('Activation Status', `Error activating: ${reason}`);
          }
        );
      });
  };

  handlePaymentResults = (eventData: PlugPagEventData) => {
    console.log(eventData);
    if (eventData.eventCode === 17) {
      this.setState({
        passwordDigits: 0,
      });
    } else if (eventData.eventCode === 16) {
      this.setState(
        {
          passwordDigits: this.state.passwordDigits + 1,
        },
        () => {
          console.log(this.state.passwordDigits);
        }
      );
    } else {
      this.setState({
        isLoading: true,
        loadingMessage: eventData.customMessage,
      });
    }
  };

  handlePrintResults = (eventData: PlugPagPrintResult) => {
    console.log(eventData);
  };

  doCharge = async (type: Number) => {
    this.setState(
      {
        passwordDigits: 0,
      },
      () => {
        plugpagInstance
          .doPayment(
            {
              amount: Math.random() * 10000,
              type: type,
              printReceipt: false,
              installmentType: PlugPag.INSTALLMENT_TYPE_A_VISTA,
              installments: 1,
              userReference: 'TEST123',
            } as PlugPagPaymentData,
            this.handlePaymentResults,
            this.handlePrintResults
          )
          .then((transactionData: PlugPagTransactionResult) => {
            console.log(transactionData);
            this.setState(
              {
                isLoading: false,
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

  render() {
    return (
      <View style={styles.container}>
        {this.state.isLoading ? (
          <LoadingView
            message={this.state.loadingMessage}
            passwordDigits={this.state.passwordDigits}
          />
        ) : null}

        {this.state.isActivated ? (
          <React.Fragment>
            <Pressable
              onPress={this.doCreditCharge}
              style={{
                backgroundColor: 'green',
                width: '80%',
                height: 50,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                Do Credit Charge
              </Text>
            </Pressable>
            <Pressable
              onPress={this.doDebitCharge}
              style={{
                backgroundColor: 'green',
                width: '80%',
                height: 50,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 10,
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                Do Debit Charge
              </Text>
            </Pressable>
          </React.Fragment>
        ) : (
          <Pressable
            onPress={this.activateLibrary}
            style={{
              backgroundColor: 'green',
              width: '80%',
              height: 50,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Activate</Text>
          </Pressable>
        )}
      </View>
    );
  }
}
