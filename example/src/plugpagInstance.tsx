import PlugPag, {
  PlugPagAppIdentification,
} from 'react-native-plugpag-service-wrapper';

export const activationCode = '403938';

const plugpagInstance = new PlugPag(
  new PlugPagAppIdentification('TEST APP', '1.2.1')
);

export default plugpagInstance;
