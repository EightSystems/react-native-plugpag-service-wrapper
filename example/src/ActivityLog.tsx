import React, { useRef, useEffect } from 'react';

import { View, Text, FlatList } from 'react-native';
import styles from './styles';

const ActivityLogItem = ({ text, isOdd }: { text: String; isOdd: boolean }) => {
  return (
    <View
      style={[styles.activityLogItem, isOdd ? styles.activityLogItemOdd : null]}
    >
      <Text
        style={[
          styles.activityLogItemText,
          isOdd ? styles.activityLogItemOddText : null,
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const ActivityLog = ({
  logMessages,
  style,
}: {
  logMessages: String[];
  style: any;
}) => {
  const flatListRef = useRef<FlatList<any>>(null);

  useEffect(() => {
    flatListRef.current?.scrollToOffset({
      animated: true,
      offset: 0,
    });
  }, [logMessages]);

  const logMessagesReserved = [...logMessages].reverse();

  return (
    <View style={style}>
      <FlatList
        ref={flatListRef}
        inverted={false}
        data={logMessagesReserved}
        keyExtractor={(_, index) => `activity-log-${index}`}
        ListEmptyComponent={() => (
          <ActivityLogItem text={'Nothing here'} isOdd={false} />
        )}
        renderItem={({ item, index }) => {
          return <ActivityLogItem text={item} isOdd={index % 2 === 0} />;
        }}
      />
    </View>
  );
};

export default ActivityLog;
