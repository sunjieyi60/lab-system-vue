// ============================================
// 设备管理类型定义
// ============================================

/** 设备类型 */
export type DeviceType = 'AirCondition' | 'CircuitBreak' | 'Light' | 'Sensor' | 'Access'

/** 设备类型常量 */
export const DeviceType = {
  AirCondition: 'AirCondition' as const,
  CircuitBreak: 'CircuitBreak' as const,
  Light: 'Light' as const,
  Sensor: 'Sensor' as const,
  Access: 'Access' as const,
}

/** 设备类型中文映射 */
export const DeviceTypeName: Record<DeviceType, string> = {
  [DeviceType.AirCondition]: '空调',
  [DeviceType.CircuitBreak]: '断路器',
  [DeviceType.Light]: '照明',
  [DeviceType.Sensor]: '传感器',
  [DeviceType.Access]: '门禁',
}

/** 设备类型配置 */
export const DeviceTypeConfig: Record<DeviceType, {
  label: string
  addressRange: [number, number]
  hasSelfId: boolean
  hasRs485Gateway: boolean
  hasSocketGateway: boolean
  icon?: string
}> = {
  [DeviceType.AirCondition]: {
    label: '空调',
    addressRange: [31, 40],
    hasSelfId: true,
    hasRs485Gateway: true,
    hasSocketGateway: true,
    icon: 'Cold',
  },
  [DeviceType.CircuitBreak]: {
    label: '断路器',
    addressRange: [11, 30],
    hasSelfId: false,
    hasRs485Gateway: true,
    hasSocketGateway: false,
    icon: 'Lightning',
  },
  [DeviceType.Light]: {
    label: '照明',
    addressRange: [41, 60],
    hasSelfId: true,
    hasRs485Gateway: true,
    hasSocketGateway: false,
    icon: 'Sunrise',
  },
  [DeviceType.Sensor]: {
    label: '传感器',
    addressRange: [61, 80],
    hasSelfId: true,
    hasRs485Gateway: true,
    hasSocketGateway: false,
    icon: 'DataLine',
  },
  [DeviceType.Access]: {
    label: '门禁',
    addressRange: [1, 10],
    hasSelfId: true,
    hasRs485Gateway: true,
    hasSocketGateway: false,
    icon: 'Lock',
  },
}

// ============================================
// 基础实体
// ============================================

/** 基础设备 */
export interface Device {
  id: number
  deviceName: string
  deviceType: DeviceType
  belongToLaboratoryId: number
  pollingEnabled: boolean
  createTime?: string
  updateTime?: string
}

/** 空调设备 */
export interface AirCondition extends Device {
  deviceType: typeof DeviceType.AirCondition
  address: number
  selfId: number
  rs485GatewayId?: number
  socketGatewayId?: number
  groupId?: string
  isLock?: boolean
}

/** 照明设备 */
export interface Light extends Device {
  deviceType: typeof DeviceType.Light
  address: number
  selfId: number
  rs485GatewayId: number
  isLock?: boolean
}

/** 门禁设备 */
export interface Access extends Device {
  deviceType: typeof DeviceType.Access
  address: number
  selfId: number
  rs485GatewayId: number
  isLock?: boolean
}

/** 传感器设备 */
export interface Sensor extends Device {
  deviceType: typeof DeviceType.Sensor
  address: number
  selfId: number
  rs485GatewayId: number
}

/** 断路器设备 */
export interface CircuitBreak extends Device {
  deviceType: typeof DeviceType.CircuitBreak
  address: number
  rs485GatewayId: number
}

// ============================================
// DTO
// ============================================

/** 创建设备基础 DTO */
export interface CreateDeviceBase {
  deviceName: string
  deviceType: DeviceType
  belongToLaboratoryId: number
  groupId?: string
}

/** 创建空调 DTO */
export interface CreateAirConditionDTO extends CreateDeviceBase {
  deviceType: typeof DeviceType.AirCondition
  address: number
  selfId: number
  rs485GatewayId?: number
  socketGatewayId?: number
}

/** 创建照明 DTO */
export interface CreateLightDTO extends CreateDeviceBase {
  deviceType: typeof DeviceType.Light
  address: number
  selfId: number
  rs485GatewayId: number
}

/** 创建门禁 DTO */
export interface CreateAccessDTO extends CreateDeviceBase {
  deviceType: typeof DeviceType.Access
  address: number
  selfId: number
  rs485GatewayId: number
}

/** 创建传感器 DTO */
export interface CreateSensorDTO extends CreateDeviceBase {
  deviceType: typeof DeviceType.Sensor
  address: number
  selfId: number
  rs485GatewayId: number
}

/** 创建断路器 DTO */
export interface CreateCircuitBreakDTO extends CreateDeviceBase {
  deviceType: typeof DeviceType.CircuitBreak
  address: number
  rs485GatewayId: number
}

/** 创建设备联合类型 */
export type CreateDeviceDTO =
  | CreateAirConditionDTO
  | CreateLightDTO
  | CreateAccessDTO
  | CreateSensorDTO
  | CreateCircuitBreakDTO

/** 编辑设备 DTO */
export interface UpdateDeviceDTO {
  deviceId: number
  deviceName?: string
  pollingEnabled?: boolean
}

/** 删除设备 DTO */
export interface DeleteDeviceDTO {
  deviceId: number
}

// ============================================
// 网关实体
// ============================================

/** RS485 网关 */
export interface RS485Gateway {
  id: number
  gatewayName: string
  sendTopic: string
  acceptTopic: string
  belongToLaboratoryId: number
  createTime?: string
  updateTime?: string
}

/** Socket 网关 */
export interface SocketGateway {
  id: number
  gatewayName: string
  mac: string
  ip: string
  belongToLaboratoryId: number
  createTime?: string
  updateTime?: string
}

/** 创建 RS485 网关 DTO */
export interface CreateRS485GatewayDTO {
  gatewayName: string
  sendTopic: string
  acceptTopic: string
  belongToLaboratoryId: number
}

/** 创建 Socket 网关 DTO */
export interface CreateSocketGatewayDTO {
  gatewayName: string
  mac: string
  belongToLaboratoryId: number
}

/** 删除 RS485 网关 DTO */
export interface DeleteRS485GatewayDTO {
  rs485GatewayId: number
}

/** 删除 Socket 网关 DTO */
export interface DeleteSocketGatewayDTO {
  socketGatewayId: number
}

// ============================================
// VO
// ============================================

/** 设备记录 VO */
export interface DeviceRecordVo<T> {
  data: T
  deviceType: DeviceType
}

/** 设备视图 VO */
export interface DeviceVo {
  device: Device | AirCondition | Light | Access | Sensor | CircuitBreak
  deviceRecord: DeviceRecordVo<any>
}

/** RS485 网关视图 VO */
export interface Rs485GatewayVo {
  gatewayId: number
  laboratoryId: number
  gatewayName: string
  acceptTopic: string
  sendTopic: string
}

/** Socket 网关视图 VO */
export interface SocketGatewayVo {
  gatewayId: number
  gatewayName: string
  laboratoryId: number
  mac: string
  ip: string
}

// ============================================
// 实验室
// ============================================

/** 实验室 */
export interface Laboratory {
  id: number
  laboratoryName?: string
  laboratoryId?: string
}

// ============================================
// 表单模式
// ============================================

export type FormMode = 'create' | 'edit' | 'view'
