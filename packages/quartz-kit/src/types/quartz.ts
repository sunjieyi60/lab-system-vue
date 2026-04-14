// ============================================
// Quartz 定时任务表单类型定义
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

/** 指令行类型 */
export type CommandLine = 
  // 空调控制
  | 'OPEN_AIR_CONDITION_RS485'
  | 'CLOSE_AIR_CONDITION_RS485'
  | 'ENHANCE_CONTROL_AIR_CONDITION'
  | 'REQUEST_AIR_CONDITION_DATA_RS485'
  // 断路器控制
  | 'OPEN_CIRCUITBREAK'
  | 'CLOSE_CIRCUITBREAK'
  | 'REQUEST_CIRCUITBREAK_DATA'
  // 照明控制
  | 'OPEN_LIGHT'
  | 'CLOSE_LIGHT'
  | 'REQUEST_LIGHT_DATA'
  // 门禁控制
  | 'OPEN_ACCESS_ONCE'
  | 'CLOSE_ACCESS_ONCE'
  | 'REQUEST_ACCESS_DATA'
  | 'OPEN_ACCESS_PERSIST_LOCK'
  | 'OPEN_ACCESS_PERSIST_UNLOCK'
  | 'OPEN_ACCESS_PERSIST_KEEP'
  | 'CLOSE_ACCESS_PERSIST_LOCK'
  | 'CLOSE_ACCESS_PERSIST_UNLOCK'
  | 'CLOSE_ACCESS_PERSIST_KEEP'
  | 'KEEP_ACCESS_STATUS_LOCK'
  | 'KEEP_ACCESS_STATUS_UNLOCK'
  | 'SET_ACCESS_DELAY'
  // 传感器控制
  | 'REQUEST_SENSOR_DATA'

/** 指令行常量 */
export const CommandLine = {
  // 空调控制
  OPEN_AIR_CONDITION_RS485: 'OPEN_AIR_CONDITION_RS485' as const,
  CLOSE_AIR_CONDITION_RS485: 'CLOSE_AIR_CONDITION_RS485' as const,
  ENHANCE_CONTROL_AIR_CONDITION: 'ENHANCE_CONTROL_AIR_CONDITION' as const,
  REQUEST_AIR_CONDITION_DATA_RS485: 'REQUEST_AIR_CONDITION_DATA_RS485' as const,
  // 断路器控制
  OPEN_CIRCUITBREAK: 'OPEN_CIRCUITBREAK' as const,
  CLOSE_CIRCUITBREAK: 'CLOSE_CIRCUITBREAK' as const,
  REQUEST_CIRCUITBREAK_DATA: 'REQUEST_CIRCUITBREAK_DATA' as const,
  // 照明控制
  OPEN_LIGHT: 'OPEN_LIGHT' as const,
  CLOSE_LIGHT: 'CLOSE_LIGHT' as const,
  REQUEST_LIGHT_DATA: 'REQUEST_LIGHT_DATA' as const,
  // 门禁控制
  OPEN_ACCESS_ONCE: 'OPEN_ACCESS_ONCE' as const,
  CLOSE_ACCESS_ONCE: 'CLOSE_ACCESS_ONCE' as const,
  REQUEST_ACCESS_DATA: 'REQUEST_ACCESS_DATA' as const,
  OPEN_ACCESS_PERSIST_LOCK: 'OPEN_ACCESS_PERSIST_LOCK' as const,
  OPEN_ACCESS_PERSIST_UNLOCK: 'OPEN_ACCESS_PERSIST_UNLOCK' as const,
  OPEN_ACCESS_PERSIST_KEEP: 'OPEN_ACCESS_PERSIST_KEEP' as const,
  CLOSE_ACCESS_PERSIST_LOCK: 'CLOSE_ACCESS_PERSIST_LOCK' as const,
  CLOSE_ACCESS_PERSIST_UNLOCK: 'CLOSE_ACCESS_PERSIST_UNLOCK' as const,
  CLOSE_ACCESS_PERSIST_KEEP: 'CLOSE_ACCESS_PERSIST_KEEP' as const,
  KEEP_ACCESS_STATUS_LOCK: 'KEEP_ACCESS_STATUS_LOCK' as const,
  KEEP_ACCESS_STATUS_UNLOCK: 'KEEP_ACCESS_STATUS_UNLOCK' as const,
  SET_ACCESS_DELAY: 'SET_ACCESS_DELAY' as const,
  // 传感器控制
  REQUEST_SENSOR_DATA: 'REQUEST_SENSOR_DATA' as const,
}

/** 条件组类型 */
export type ConditionGroupType = 'ALL' | 'ANY'

/** 条件组类型常量 */
export const ConditionGroupType = {
  ALL: 'ALL' as const,
  ANY: 'ANY' as const,
}

/** 报警类型 */
export type AlarmType = 'SMS' | 'SMTP'

/** 报警类型常量 */
export const AlarmType = {
  SMS: 'SMS' as const,
  SMTP: 'SMTP' as const,
}

/** 周类型 */
export type WeekType = 'Both' | 'Single' | 'Double'

/** 周类型常量 */
export const WeekType = {
  ALL: 'Both' as const,
  ODD: 'Single' as const,
  EVEN: 'Double' as const,
}

/** 设备信息（用于选择） */
export interface Device {
  id: number;
  name: string;
  type: DeviceType;
  address?: number;
  selfId?: number;
  labId?: number; // 所属实验室ID，用于过滤
}

/** 用户信息（用于报警配置） */
export interface User {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

/** 学期信息 */
export interface Semester {
  id: number;
  name: string;
  startDate?: string;    // 学期开始日期 yyyy-MM-dd
  endDate?: string;      // 学期结束日期 yyyy-MM-dd
  totalWeeks?: number;   // 学期总周数
}

// ============================================
// 核心业务实体
// ============================================

/** 任务主体 */
export interface ScheduleTask {
  id: string;              // 雪花ID
  taskName: string;
  cron: string;
  enable: boolean;
  startDate: string;       // yyyy-MM-dd
  endDate: string;
  laboratoryId: number;
}

/** 动作 */
export interface Action {
  id: string;
  deviceType: DeviceType;
  deviceId: number;
  commandLine: CommandLine;
  args: number[];
  actionGroupId: string;   // 【必须】关联动作组
  scheduleTaskId: string;  // 【必须】关联任务
}

/** 动作组 */
export interface ActionGroup {
  id: string;
  scheduleTaskId: string;  // 【必须】
  conditionGroupId?: string; // 关联条件组（可选）
  actions: Action[];
}

/** 条件 */
export interface Condition {
  id: string;
  expr: string;            // SpEL: #{id}.property > value
  desc: string;
  conditionGroupId: string;// 【必须】关联条件组
  scheduleTaskId: string;  // 【必须】
}

/** 条件组 */
export interface ConditionGroup {
  id: string;
  type: ConditionGroupType; // ALL=全部满足, ANY=任一满足
  scheduleTaskId: string;   // 【必须】
  conditions: Condition[];
}

/** 数据源（用于SpEL引用） */
export interface DataSource {
  id: string;              // 【关键】SpEL中通过 #{id} 引用
  scheduleTaskId: string;  // 【必须】
  deviceId: number;
  deviceType: DeviceType;
}

/** 时间规则 */
export interface TimeRule {
  id: string;
  scheduleTaskId: string;  // 【必须】
  semesterId?: number;     // 学期ID（可选），选择后周次相关参数才有效
  weekdays: number[];      // [1,2,3,4,5,6,7]
  startWeek: number;
  endWeek: number;
  weekType: WeekType;
  startTime?: string;      // HH:mm:ss
  endTime?: string;
}

/** 报警 */
export interface Alarm {
  id: string;
  scheduleTaskId: string;  // 【必须】
  userId: number;
  type: AlarmType;
}

/** 看门狗 */
export interface WatchDog {
  watchEnabled: boolean;
  watchIntervalSec: number;
  watchTimeoutSec: number;
  stopOnFirstSuccess: boolean;
}

/** 根对象 - 完整的定时任务配置 */
export interface ScheduleConfigRoot {
  task: ScheduleTask;
  actionGroups: ActionGroup[];
  dataGroup: DataSource[];
  conditionGroups: ConditionGroup[];
  timeRule: TimeRule;
  alarmGroup: Alarm[];
  watchDog: WatchDog;
}

// ============================================
// 表单组件 Props 和 Events
// ============================================

/** 表单模式 */
export type FormMode = 'create' | 'edit' | 'view';

/** 表单组件 Props */
export interface QuartzTaskFormProps {
  /** 初始值（编辑/查看模式时使用） */
  initialValue?: ScheduleConfigRoot;
  /** 表单模式 */
  mode?: FormMode;
  /** 实验室ID */
  laboratoryId: number;
  /** 可用设备列表 */
  devices: Device[];
  /** 可用用户列表 */
  users: User[];
  /** 可用学期列表 */
  semesters: Semester[];
  /** 加载状态 */
  loading?: boolean;
}

/** 表单提交数据 */
export interface FormSubmitData {
  /** 是否是新建 */
  isCreate: boolean;
  /** 表单数据 */
  data: ScheduleConfigRoot;
}

/** 表单组件 Events */
export interface QuartzTaskFormEvents {
  /** 提交表单 */
  (e: 'submit', data: FormSubmitData): void;
  /** 取消 */
  (e: 'cancel'): void;
  /** 表单变化（用于实时预览） */
  (e: 'change', data: ScheduleConfigRoot): void;
}

// ============================================
// 表单内部状态
// ============================================

/** 表单数据状态（包含UI绑定用的转换字段） */
export interface FormState {
  task: ScheduleTask;
  timeRule: TimeRule;
  dataGroup: DataSource[];
  conditionGroups: ConditionGroup[];
  actionGroups: ActionGroup[];
  alarmGroup: Alarm[];
  watchDog: WatchDog;
  // UI 辅助字段
  dateRange: [string, string];
  timeRange: [string | undefined, string | undefined];
}

/** 空调增强控制参数 */
export interface AirConditionArgs {
  address: number;
  selfId: number;
  power: 0 | 1;        // 0=关, 1=开
  mode: 1 | 2 | 4 | 8; // 1=制热, 2=制冷, 4=送风, 8=除湿
  temperature: number; // 16-30
  fanSpeed: 0 | 1 | 2 | 3; // 0=自动, 1=低, 2=中, 3=高
}
