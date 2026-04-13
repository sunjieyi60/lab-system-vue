import { createPinia } from 'pinia'

// 创建 pinia 实例
export const pinia = createPinia()

// 从 modules 重新导出所有 store
export { useUserStore } from './modules/user'
export { useDeviceStore, DeviceType, DeviceTypeName } from './modules/device'
export { useBaseStore } from './modules/base'
export { useEduStore } from './modules/edu'
export { useSmartControlStore } from './modules/smartControl'
