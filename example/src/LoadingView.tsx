import * as React from 'react';

import { View, Text, Pressable, ActivityIndicator, Modal } from 'react-native';

import plugpagInstance from './plugpagInstance';
import styles from './styles';

interface LoadingProps {
  message: String | undefined;
  passwordDigits: number | undefined;
  eventDataCallback: Function;
  showCancelButton: boolean;
}

const LoadingView = ({
  message,
  passwordDigits,
  eventDataCallback,
  showCancelButton,
}: LoadingProps) => {
  const cancelTransactionInCourse = async () => {
    try {
      const isAborted = plugpagInstance.abort();

      eventDataCallback({
        isAborted: isAborted,
      });
    } catch (e) {
      eventDataCallback({
        abortErrror: `${e}`,
      });
    }
  };

  return (
    <Modal visible={true}>
      <View style={styles.loadingBackground}>
        <ActivityIndicator color={'black'} size={'large'} />

        <Text style={styles.textContent}>{message}</Text>

        {passwordDigits && passwordDigits > 0 ? (
          <Text style={styles.textContent}>{'⬤'.repeat(+passwordDigits)}</Text>
        ) : null}

        {showCancelButton ? (
          <Pressable
            onPress={cancelTransactionInCourse}
            style={styles.dangerButton}
          >
            <Text style={styles.dangerButtonText}>Cancelar Transação</Text>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
};

export default LoadingView;
