/**
 * Control Kit - 设备控制组件库
 * 
 * 基于 Lab System 设备控制 Skill 规范实现的 Vue3 组件库
 * 支持空调、门禁、照明、断路器、传感器等设备的控制
 */

// ==================== 类型导入（用于工具函数）====================
import type {
  Task,
  DeviceType,
  DeviceUnion,
} from './types/device';

// ==================== 常量导入（用于工具函数）====================
import {
  DEVICE_TYPE_LABELS,
  DEVICE_TYPE_ICONS,
} from './types/device';

// ==================== 类型导出 ====================
export type {
  // 基础类型
  Priority,
  DeviceType,
  Task,
  ControlPayload,
  Device,
  
  // 设备类型
  AirCondition,
  Light,
  Access,
  CircuitBreak,
  Sensor,
  DeviceUnion,
  
  // 控制表单类型
  ACEnhancedForm,
  AccessPersistForm,
  AccessState,
  AccessLock,
} from './types/device';

// ==================== 常量导出 ====================
export {
  // 空调相关
  AC_SWITCH_MAP,
  AC_MODE_MAP,
  AC_TEMP_RANGE,
  AC_SPEED_MAP,
  
  // 门禁相关
  ACCESS_PERSIST_COMMAND_MAP,
  
  // 指令常量
  AC_COMMANDS,
  ACCESS_COMMANDS,
  LIGHT_COMMANDS,
  CIRCUIT_COMMANDS,
  SENSOR_COMMANDS,
  
  // 设备类型标签和图标
  DEVICE_TYPE_LABELS,
  DEVICE_TYPE_ICONS,
} from './types/device';

// ==================== 组件导出 ====================
export { default as DeviceControlPanel } from './components/DeviceControlPanel.vue';
export { default as DeviceTypeSelector } from './components/DeviceTypeSelector.vue';

// 各设备控制组件
export { default as AirConditionControl } from './components/controls/AirConditionControl.vue';
export { default as AccessControl } from './components/controls/AccessControl.vue';
export { default as LightControl } from './components/controls/LightControl.vue';
export { default as CircuitBreakControl } from './components/controls/CircuitBreakControl.vue';
export { default as SensorControl } from './components/controls/SensorControl.vue';

// DeviceTypeSelector 选项类型
export type { DeviceTypeOption } from './components/DeviceTypeSelector.vue';

// ==================== 工具函数 ====================

/**
 * 创建设备控制任务对象
 */
export function createTask(
  deviceType: DeviceType,
  deviceId: number,
  commandLine: string,
  args: number[],
  priority: 'NORMAL' | 'AUTOMATIC' | 'POLLING' = 'NORMAL'
): Task {
  return {
    priority,
    deviceType,
    deviceId,
    commandLine,
    args,
  };
}

/**
 * 构建控制指令参数
 * 根据设备类型和指令生成正确的 args 数组
 */
export function buildControlArgs(
  _deviceType: DeviceType,
  _commandLine: string,
  device: { address: number; selfId?: number },
  extraArgs: number[] = []
): number[] {
  const baseArgs = [device.address];
  if (device.selfId !== undefined) {
    baseArgs.push(device.selfId);
  }
  return [...baseArgs, ...extraArgs];
}

/**
 * 获取设备类型标签
 */
export function getDeviceTypeLabel(type: DeviceType): string {
  return DEVICE_TYPE_LABELS[type];
}

/**
 * 获取设备类型图标
 */
export function getDeviceTypeIcon(type: DeviceType): string {
  return DEVICE_TYPE_ICONS[type];
}

/**
 * 检查设备是否支持锁定
 */
export function supportsLock(device: DeviceUnion): boolean {
  return 'isLock' in device;
}

/**
 * 检查设备是否被锁定
 */
export function isDeviceLocked(device: DeviceUnion): boolean {
  return supportsLock(device) && (device as { isLock: boolean }).isLock;
}

// ==================== 版本信息 ====================
export const version = '0.1.0';

// ==================== 默认导出 ====================
import type { App } from 'vue';
import DeviceControlPanel from './components/DeviceControlPanel.vue';
import DeviceTypeSelector from './components/DeviceTypeSelector.vue';

// 插件安装函数
export function install(app: App) {
  app.component('DeviceControlPanel', DeviceControlPanel);
  app.component('DeviceTypeSelector', DeviceTypeSelector);
}

export default {
  version,
  install,
};
