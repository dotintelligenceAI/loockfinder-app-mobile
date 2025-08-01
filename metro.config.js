const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver problemas de compatibilidade com React Native
config.resolver.alias = {
  crypto: 'react-native-quick-crypto',
  stream: 'readable-stream',
  buffer: '@craftzdog/react-native-buffer',
};

config.resolver.unstable_enablePackageExports = false;

module.exports = config; 