import { NativeModules } from 'react-native';

type PlugpagServiceWrapperType = {
  multiply(a: number, b: number): Promise<number>;
};

const { PlugpagServiceWrapper } = NativeModules;

export default PlugpagServiceWrapper as PlugpagServiceWrapperType;
