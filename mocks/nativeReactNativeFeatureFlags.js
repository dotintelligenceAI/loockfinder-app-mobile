// Mock completo para NativeReactNativeFeatureFlags
module.exports = {
  get: () => false,
  set: () => {},
  delete: () => {},
  getAll: () => ({}),
  setMultiple: () => {},
  deleteMultiple: () => {},
  // Mock para evitar erros de módulos nativos
  __fbBatchedBridgeConfig: {
    remoteModuleConfig: [],
    localModulesConfig: null
  },
  NativeModules: {},
  TurboModuleRegistry: {
    get: () => null,
    set: () => {},
    delete: () => {},
    getAll: () => ({}),
    setMultiple: () => {},
    deleteMultiple: () => {},
  },
};
