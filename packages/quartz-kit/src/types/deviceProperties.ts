/**
 * 设备属性类型定义
 * 从 Java Record 类自动生成，用于 SpEL 表达式构建
 */

import { DeviceType } from './quartz'

// ============================================
// 基础类型映射
// ============================================

export type JavaType = 'Integer' | 'Long' | 'Double' | 'Float' | 'Boolean' | 'String'

export interface PropertyDefinition {
  name: string                    // 属性名（英文）
  label: string                   // 显示名（中文）
  javaType: JavaType              // Java 数据类型
  description?: string            // 属性说明
  enumValues?: { value: string | number; label: string }[]  // 枚举值（如果有）
  min?: number                    // 数值最小值
  max?: number                    // 数值最大值
  unit?: string                   // 单位
}

// ============================================
// 传感器属性 (SensorRecord)
// ============================================

export const SensorProperties: PropertyDefinition[] = [
  { name: 'address', label: '设备地址', javaType: 'Integer', description: '设备通信地址' },
  { name: 'selfId', label: '子设备ID', javaType: 'Integer', description: '子设备编号' },
  { name: 'temperature', label: '温度', javaType: 'Double', unit: '°C', description: '环境温度' },
  { name: 'humidity', label: '湿度', javaType: 'Double', unit: '%RH', description: '环境湿度', min: 0, max: 100 },
  { name: 'light', label: '光照强度', javaType: 'Double', unit: 'lux', description: '光照强度' },
  { name: 'smoke', label: '烟雾浓度', javaType: 'Integer', description: '烟雾检测值' },
]

// ============================================
// 门禁属性 (AccessRecord)
// ============================================

export const AccessProperties: PropertyDefinition[] = [
  { name: 'address', label: '设备地址', javaType: 'Integer', description: '门禁通信地址' },
  { 
    name: 'isOpen', 
    label: '开关状态', 
    javaType: 'Boolean', 
    description: '门禁开关状态',
    enumValues: [
      { value: true, label: '开启' },
      { value: false, label: '关闭' },
    ],
  },
  { 
    name: 'isLock', 
    label: '通电状态', 
    javaType: 'Boolean', 
    description: '门禁通电状态',
    enumValues: [
      { value: true, label: '通电' },
      { value: false, label: '断电' },
    ],
  },
  { name: 'lockStatus', label: '锁定状态', javaType: 'Integer', description: '锁定状态码' },
  { name: 'delayTime', label: '延时时间', javaType: 'Integer', unit: '秒', description: '延时关闭时间' },
]

// ============================================
// 照明属性 (LightRecord)
// ============================================

export const LightProperties: PropertyDefinition[] = [
  { name: 'address', label: '设备地址', javaType: 'Integer', description: '照明设备地址' },
  { name: 'selfId', label: '子设备ID', javaType: 'Integer', description: '子设备编号' },
  { 
    name: 'isOpen', 
    label: '开关状态', 
    javaType: 'Boolean', 
    description: '照明开关状态',
    enumValues: [
      { value: true, label: '开启' },
      { value: false, label: '关闭' },
    ],
  },
  { 
    name: 'isLock', 
    label: '锁定状态', 
    javaType: 'Boolean', 
    description: '照明锁定状态',
    enumValues: [
      { value: true, label: '锁定' },
      { value: false, label: '未锁定' },
    ],
  },
]

// ============================================
// 空调属性 (AirConditionRecord)
// ============================================

export const AirConditionProperties: PropertyDefinition[] = [
  { name: 'address', label: '设备地址', javaType: 'Integer', description: '空调通信地址' },
  { name: 'selfId', label: '子设备ID', javaType: 'Integer', description: '子设备编号' },
  { 
    name: 'isOpen', 
    label: '运行状态', 
    javaType: 'Boolean', 
    description: '空调运行状态',
    enumValues: [
      { value: true, label: '运行中' },
      { value: false, label: '已停止' },
    ],
  },
  { 
    name: 'mode', 
    label: '运行模式', 
    javaType: 'String', 
    description: '空调工作模式',
    enumValues: [
      { value: '1', label: '制冷' },
      { value: '2', label: '制热' },
      { value: '3', label: '除湿' },
      { value: '4', label: '送风' },
      { value: '5', label: '自动' },
    ],
  },
  { name: 'temperature', label: '设定温度', javaType: 'Integer', unit: '°C', min: 16, max: 30, description: '目标温度' },
  { 
    name: 'speed', 
    label: '风速', 
    javaType: 'String', 
    description: '风扇转速',
    enumValues: [
      { value: '1', label: '低风' },
      { value: '2', label: '中风' },
      { value: '3', label: '高风' },
    ],
  },
  { name: 'roomTemperature', label: '房间温度', javaType: 'Integer', unit: '°C', min: 16, max: 30, description: '当前室温' },
  { 
    name: 'errorCode', 
    label: '错误码', 
    javaType: 'Integer', 
    description: '设备故障代码',
    enumValues: [
      { value: 0, label: '正常' },
      { value: 1, label: '设备故障' },
      { value: 2, label: '通信失败' },
    ],
  },
]

// ============================================
// 断路器属性 (CircuitBreakRecord)
// ============================================

export const CircuitBreakProperties: PropertyDefinition[] = [
  { name: 'address', label: '设备地址', javaType: 'Integer', description: '断路器通信地址' },
  { 
    name: 'isOpen', 
    label: '分闸状态', 
    javaType: 'Boolean', 
    description: '是否分闸',
    enumValues: [
      { value: true, label: '已分闸' },
      { value: false, label: '已合闸' },
    ],
  },
  { 
    name: 'isFix', 
    label: '维修状态', 
    javaType: 'Boolean', 
    description: '是否维修中',
    enumValues: [
      { value: true, label: '维修中' },
      { value: false, label: '正常' },
    ],
  },
  { 
    name: 'isLock', 
    label: '锁定状态', 
    javaType: 'Boolean', 
    description: '是否锁定',
    enumValues: [
      { value: true, label: '已锁定' },
      { value: false, label: '未锁定' },
    ],
  },
  { name: 'voltage', label: '电压', javaType: 'Float', unit: 'V', description: '当前电压' },
  { name: 'current', label: '电流', javaType: 'Float', unit: 'A', description: '当前电流' },
  { name: 'power', label: '功率', javaType: 'Float', unit: 'W', description: '当前功率' },
  { name: 'energy', label: '能耗', javaType: 'Float', unit: 'kWh', description: '累计能耗' },
  { name: 'leakage', label: '漏电流', javaType: 'Float', unit: 'mA', description: '漏电检测值' },
  { name: 'temperature', label: '线温', javaType: 'Float', unit: '°C', description: '线路温度' },
]

// ============================================
// 属性映射表
// ============================================

export const DevicePropertiesMap: Record<DeviceType, PropertyDefinition[]> = {
  [DeviceType.Sensor]: SensorProperties,
  [DeviceType.Access]: AccessProperties,
  [DeviceType.Light]: LightProperties,
  [DeviceType.AirCondition]: AirConditionProperties,
  [DeviceType.CircuitBreak]: CircuitBreakProperties,
}

// ============================================
// 根据设备ID获取属性列表
// ============================================

export function getPropertiesByDeviceType(deviceType: DeviceType): PropertyDefinition[] {
  return DevicePropertiesMap[deviceType] || []
}

export function getPropertyByName(deviceType: DeviceType, propertyName: string): PropertyDefinition | undefined {
  return DevicePropertiesMap[deviceType]?.find(p => p.name === propertyName)
}

// ============================================
// 操作符定义
// ============================================

export interface OperatorDefinition {
  value: string
  label: string
  supportedTypes: JavaType[]
  description: string
}

export const Operators: OperatorDefinition[] = [
  { value: '==', label: '等于', supportedTypes: ['Integer', 'Long', 'Double', 'Float', 'Boolean', 'String'], description: '等于' },
  { value: '!=', label: '不等于', supportedTypes: ['Integer', 'Long', 'Double', 'Float', 'Boolean', 'String'], description: '不等于' },
  { value: '>', label: '大于', supportedTypes: ['Integer', 'Long', 'Double', 'Float'], description: '大于' },
  { value: '>=', label: '大于等于', supportedTypes: ['Integer', 'Long', 'Double', 'Float'], description: '大于等于' },
  { value: '<', label: '小于', supportedTypes: ['Integer', 'Long', 'Double', 'Float'], description: '小于' },
  { value: '<=', label: '小于等于', supportedTypes: ['Integer', 'Long', 'Double', 'Float'], description: '小于等于' },
]

export function getSupportedOperators(javaType: JavaType): OperatorDefinition[] {
  return Operators.filter(op => op.supportedTypes.includes(javaType))
}

// ============================================
// SpEL 表达式构建
// ============================================

export interface ConditionRule {
  dataSourceId: string
  property: string
  operator: string
  value: string | number | boolean
}

export function buildSpELExpression(rule: ConditionRule): string {
  const { dataSourceId, property, operator, value } = rule
  
  // 布尔值和字符串需要特殊处理
  let formattedValue: string
  if (typeof value === 'boolean') {
    formattedValue = value.toString()
  } else if (typeof value === 'string') {
    formattedValue = `'${value}'`
  } else {
    formattedValue = String(value)
  }
  
  return `#{${dataSourceId}}.${property} ${operator} ${formattedValue}`
}

export function parseSpELExpression(expr: string): ConditionRule | null {
  // 解析形如: #{1234567890123456789}.temperature > 25
  const match = expr.match(/#\{(\d+)\}\.(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)/)
  if (!match) return null
  
  const [, dataSourceId, property, operator, valueStr] = match
  
  // 尝试解析值类型
  let value: string | number | boolean = valueStr.trim()
  if (value === 'true') value = true
  else if (value === 'false') value = false
  else if (!isNaN(Number(value))) value = Number(value)
  else if (value.startsWith("'") && value.endsWith("'")) {
    value = value.slice(1, -1)
  }
  
  return {
    dataSourceId,
    property,
    operator,
    value,
  }
}
