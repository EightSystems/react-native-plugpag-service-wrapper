import { StyleSheet, Platform, ViewStyle, TextStyle } from 'react-native';
import Theme from './theme';

const buttonStyles: ViewStyle = {
  width: '80%',
  paddingTop: 18,
  paddingBottom: 18,
  paddingLeft: 24,
  paddingRight: 24,
  borderRadius: 4,
  marginTop: 10,
  alignItems: 'center',
  justifyContent: 'center',
};

const buttonTextStyles: TextStyle = {
  fontWeight: 'bold',
};

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
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
    justifyContent: 'space-evenly',
    paddingBottom: '50%',
  },
  textContainer: {
    alignItems: 'center',
    backgroundColor: 'blue',
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  textContent: {
    fontSize: 20,
    fontWeight: 'bold',
    height: 50,
    textAlign: 'center',
    paddingLeft: 10,
    paddingRight: 10,
  },
  primaryButton: {
    ...buttonStyles,
    backgroundColor: Theme.colors.primary,
  },
  primaryButtonText: {
    color: Theme.colors.primaryContrast,
    ...buttonTextStyles,
  },
  dangerButton: {
    ...buttonStyles,
    backgroundColor: Theme.colors.danger,
  },
  dangerButtonText: {
    color: Theme.colors.primaryContrast,
    ...buttonTextStyles,
  },
  secondaryButton: {
    ...buttonStyles,
    backgroundColor: Theme.colors.textBody,
  },
  secondaryButtonText: {
    color: Theme.colors.primaryContrast,
    ...buttonTextStyles,
  },
  activityLog: {
    height: '50%',
    width: '100%',
    backgroundColor: Theme.colors.background,
    borderTopColor: Theme.colors.gray,
    borderTopWidth: 3,
  },
  buttonContainer: {
    height: '50%',
    width: '100%',
    backgroundColor: Theme.colors.background,
  },
  buttonContainerContent: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  activityLogItem: {
    paddingTop: 18,
    paddingBottom: 18,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: Theme.colors.secondary,
    borderBottomColor: Theme.colors.grayShade,
    borderBottomWidth: 2,
  },
  activityLogItemOdd: {
    backgroundColor: Theme.colors.gray,
  },
  activityLogItemText: {
    color: Theme.colors.secondaryContrast,
    textAlign: 'justify',
    fontSize: 18,
  },
  activityLogItemOddText: {
    color: Theme.colors.textPrimary,
  },
});

export default styles;
