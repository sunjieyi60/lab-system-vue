/**
 * 设备控制组件库 - 类型定义
 * 基于 Lab System 设备控制 Skill 规范
 */

/** 任务优先级 */
export type Priority = 'NORMAL' | 'AUTOMATIC' | 'POLLING';

/** 设备类型 */
export type DeviceType = 'AirCondition' | 'CircuitBreak' | 'Light' | 'Sensor' | 'Access';

/** 任务对象 */
export interface Task {
  /** 优先级: NORMAL(0) 用户操作, AUTOMATIC(1) 自动任务, POLLING(1) 轮询 */
  priority: Priority;
  /** 设备类型 */
  deviceType: DeviceType;
  /** 设备ID */
  deviceId: number;
  /** 指令行 (CommandLine 枚举名) */
  commandLine: string;
  /** 参数列表 - 按 [address, selfId, ...操作参数] 顺序传递 */
  args: number[];
}

/** 控制指令负载 */
export interface ControlPayload {
  commandLine: string;
  args: number[];
}

/** 设备基础属性 */
export interface Device {
  id: number;
  deviceName: string;
  deviceType: DeviceType;
  belongToLaboratoryId: number;
  pollingEnabled: boolean;
}

/** 空调设备 */
export interface AirCondition extends Device {
  address: number;
  selfId: number;
  rs485GatewayId: number;
  socketGatewayId?: number;
  groupId: string;
  isLock: boolean;
}

/** 照明设备 */
export interface Light extends Device {
  address: number;
  selfId: number;
  rs485GatewayId: number;
  isLock: boolean;
}

/** 门禁设备 */
export interface Access extends Device {
  address: number;
  rs485GatewayId: number;
  isLock: boolean;
}

/** 断路器设备 */
export interface CircuitBreak extends Device {
  address: number;
  rs485GatewayId: number;
}

/** 传感器设备 */
export interface Sensor extends Device {
  address: number;
  selfId: number;
  rs485GatewayId: number;
}

/** 联合设备类型 */
export type DeviceUnion = AirCondition | Light | Access | CircuitBreak | Sensor;

// ==================== 空调控制相关 ====================

/** 空调开关 */
export const AC_SWITCH_MAP: Record<number, string> = {
  0: '关',
  1: '开',
};

/** 空调模式 */
export const AC_MODE_MAP: Record<number, string> = {
  1: '制热',
  2: '制冷',
  4: '送风',
  8: '除湿',
};

/** 空调温度范围 */
export const AC_TEMP_RANGE = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];

/** 空调风速 */
export const AC_SPEED_MAP: Record<number, string> = {
  0: '自动',
  1: '低风',
  2: '中风',
  3: '高风',
};

/** 空调增强控制表单 */
export interface ACEnhancedForm {
  switch: number;
  mode: number;
  temperature: number;
  speed: number;
}

// ==================== 门禁控制相关 ====================

/** 门禁持续状态 */
export type AccessState = 'open' | 'close' | 'keep';

/** 门禁锁定状态 */
export type AccessLock = 'lock' | 'unlock' | 'keep';

/** 门禁持续控制表单 */
export interface AccessPersistForm {
  state: AccessState;
  lock: AccessLock;
}

/** 门禁持续控制指令映射 */
export const ACCESS_PERSIST_COMMAND_MAP: Record<string, string> = {
  'open-lock': 'OPEN_ACCESS_PERSIST_LOCK',
  'open-unlock': 'OPEN_ACCESS_PERSIST_UNLOCK',
  'open-keep': 'OPEN_ACCESS_PERSIST_KEEP',
  'close-lock': 'CLOSE_ACCESS_PERSIST_LOCK',
  'close-unlock': 'CLOSE_ACCESS_PERSIST_UNLOCK',
  'close-keep': 'CLOSE_ACCESS_PERSIST_KEEP',
  'keep-lock': 'KEEP_ACCESS_STATUS_LOCK',
  'keep-unlock': 'KEEP_ACCESS_STATUS_UNLOCK',
};

// ==================== 指令常量 ====================

/** 空调指令 */
export const AC_COMMANDS = {
  OPEN: 'OPEN_AIR_CONDITION_RS485',
  CLOSE: 'CLOSE_AIR_CONDITION_RS485',
  ENHANCE_CONTROL: 'ENHANCE_CONTROL_AIR_CONDITION',
  REQUEST_DATA: 'REQUEST_AIR_CONDITION_DATA_RS485',
} as const;

/** 门禁指令 */
export const ACCESS_COMMANDS = {
  OPEN_ONCE: 'OPEN_ACCESS_ONCE',
  CLOSE_ONCE: 'CLOSE_ACCESS_ONCE',
  REQUEST_DATA: 'REQUEST_ACCESS_DATA',
  OPEN_PERSIST_LOCK: 'OPEN_ACCESS_PERSIST_LOCK',
  OPEN_PERSIST_UNLOCK: 'OPEN_ACCESS_PERSIST_UNLOCK',
  OPEN_PERSIST_KEEP: 'OPEN_ACCESS_PERSIST_KEEP',
  CLOSE_PERSIST_LOCK: 'CLOSE_ACCESS_PERSIST_LOCK',
  CLOSE_PERSIST_UNLOCK: 'CLOSE_ACCESS_PERSIST_UNLOCK',
  CLOSE_PERSIST_KEEP: 'CLOSE_ACCESS_PERSIST_KEEP',
  KEEP_STATUS_LOCK: 'KEEP_ACCESS_STATUS_LOCK',
  KEEP_STATUS_UNLOCK: 'KEEP_ACCESS_STATUS_UNLOCK',
  SET_DELAY: 'SET_ACCESS_DELAY',
} as const;

/** 照明指令 */
export const LIGHT_COMMANDS = {
  OPEN: 'OPEN_LIGHT',
  CLOSE: 'CLOSE_LIGHT',
  REQUEST_DATA: 'REQUEST_LIGHT_DATA',
} as const;

/** 断路器指令 */
export const CIRCUIT_COMMANDS = {
  OPEN: 'OPEN_CIRCUITBREAK',
  CLOSE: 'CLOSE_CIRCUITBREAK',
  REQUEST_DATA: 'REQUEST_CIRCUITBREAK_DATA',
} as const;

/** 传感器指令 */
export const SENSOR_COMMANDS = {
  REQUEST_DATA: 'REQUEST_SENSOR_DATA',
} as const;

/** 设备类型标签 */
export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  AirCondition: '空调',
  Access: '门禁',
  Light: '照明',
  CircuitBreak: '断路器',
  Sensor: '传感器',
};

/** 设备类型图标（用于 UI 展示） */
export const DEVICE_TYPE_ICONS: Record<DeviceType, string> = {
  AirCondition: '❄️',
  Access: '🚪',
  Light: '💡',
  CircuitBreak: '⚡',
  Sensor: '📡',
};
