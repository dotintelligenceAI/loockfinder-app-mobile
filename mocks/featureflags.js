// Mock para NativeReactNativeFeatureFlags
module.exports = {
  get: () => false,
  set: () => {},
  delete: () => {},
  getAll: () => ({}),
  setMultiple: () => {},
  deleteMultiple: () => {},
  // Mock para evitar erros de módulos nativos
  __fbBatchedBridgeConfig: {},
  NativeModules: {},
  TurboModuleRegistry: {},
};
