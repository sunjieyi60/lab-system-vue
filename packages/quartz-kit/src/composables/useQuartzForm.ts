/**
 * Quartz 表单状态管理 Composable
 * 提供表单数据的响应式状态、初始化和操作方法
 */

import { reactive, ref, computed, watch, toRaw } from 'vue'
import type {
  ScheduleConfigRoot,
  ScheduleTask,
  TimeRule,
  DataSource,
  ConditionGroup,
  Condition,
  ActionGroup,
  Action,
  Alarm,
  WatchDog,
  DeviceType,
  FormMode,
} from '../types/quartz'
import { createEmptyScheduleConfig, generateSnowflakeId } from '../utils/snowflake'

export interface UseQuartzFormOptions {
  laboratoryId: number
  mode: FormMode
  initialValue?: ScheduleConfigRoot
}

export interface DateTimeRanges {
  dateRange: [string, string]
  timeRange: [string | undefined, string | undefined]
}

export function useQuartzForm(options: UseQuartzFormOptions) {
  // ============ 核心表单状态 ============
  const formData = reactive<ScheduleConfigRoot>({
    task: {} as ScheduleTask,
    timeRule: {} as TimeRule,
    dataGroup: [],
    conditionGroups: [],
    actionGroups: [],
    alarmGroup: [],
    watchDog: {} as WatchDog,
  })

  // UI 辅助状态
  const ranges = reactive<DateTimeRanges>({
    dateRange: ['', ''],
    timeRange: [undefined, undefined],
  })

  const isDirty = ref(false)

  // ============ 计算属性 ============
  const taskId = computed(() => formData.task.id)
  
  const hasDataSources = computed(() => formData.dataGroup.length > 0)
  
  const hasConditionGroups = computed(() => formData.conditionGroups.length > 0)
  
  const hasActionGroups = computed(() => formData.actionGroups.length > 0)
  
  const dataSourceIdMap = computed(() => {
    const map = new Map<string, DataSource>()
    formData.dataGroup.forEach(ds => map.set(ds.id, ds))
    return map
  })

  // ============ 初始化方法 ============
  function initFormData(initialValue?: ScheduleConfigRoot) {
    let data: ScheduleConfigRoot

    if (initialValue) {
      // 编辑/查看模式：深拷贝保持原有ID
      data = JSON.parse(JSON.stringify(initialValue))
    } else {
      // 新建模式：创建空配置
      data = createEmptyScheduleConfig(options.laboratoryId)
    }

    // 填充表单数据
    Object.assign(formData.task, data.task)
    Object.assign(formData.timeRule, data.timeRule)
    formData.dataGroup = data.dataGroup || []
    formData.conditionGroups = data.conditionGroups || []
    formData.actionGroups = data.actionGroups || []
    formData.alarmGroup = data.alarmGroup || []
    Object.assign(formData.watchDog, data.watchDog || {
      watchEnabled: false,
      watchIntervalSec: 30,
      watchTimeoutSec: 300,
      stopOnFirstSuccess: true,
    })

    // 恢复日期/时间范围绑定
    ranges.dateRange = [formData.task.startDate, formData.task.endDate]
    ranges.timeRange = [formData.timeRule.startTime, formData.timeRule.endTime]
    
    isDirty.value = false
  }

  // ============ 同步方法 ============
  function syncRangesToForm() {
    const [startDate, endDate] = ranges.dateRange
    if (startDate && endDate) {
      formData.task.startDate = startDate
      formData.task.endDate = endDate
    }
    
    formData.timeRule.startTime = ranges.timeRange[0]
    formData.timeRule.endTime = ranges.timeRange[1]
  }

  function syncIdsToEntities() {
    const tid = taskId.value
    
    // 同步 timeRule
    formData.timeRule.scheduleTaskId = tid
    
    // 同步 dataGroup
    formData.dataGroup.forEach(d => d.scheduleTaskId = tid)
    
    // 同步 conditionGroups
    formData.conditionGroups.forEach(cg => {
      cg.scheduleTaskId = tid
      cg.conditions.forEach(c => {
        c.scheduleTaskId = tid
        c.conditionGroupId = cg.id
      })
    })
    
    // 同步 actionGroups
    formData.actionGroups.forEach(ag => {
      ag.scheduleTaskId = tid
      ag.actions.forEach(a => {
        a.scheduleTaskId = tid
        a.actionGroupId = ag.id
      })
    })
    
    // 同步 alarmGroup
    formData.alarmGroup.forEach(a => a.scheduleTaskId = tid)
  }

  // ============ 数据源操作 ============
  function addDataSource(deviceId?: number, deviceType?: DeviceType) {
    const newDataSource: DataSource = {
      id: generateSnowflakeId(),
      scheduleTaskId: taskId.value,
      deviceId: deviceId || 0,
      deviceType: deviceType || 'Sensor' as DeviceType,
    }
    formData.dataGroup.push(newDataSource)
    isDirty.value = true
    return newDataSource
  }

  function removeDataSource(index: number) {
    const removed = formData.dataGroup.splice(index, 1)[0]
    isDirty.value = true
    return removed
  }

  function updateDataSourceDevice(index: number, deviceId: number, deviceType: DeviceType) {
    const ds = formData.dataGroup[index]
    if (ds) {
      ds.deviceId = deviceId
      ds.deviceType = deviceType
      isDirty.value = true
    }
  }

  // ============ 条件组操作 ============
  function addConditionGroup(type: 'ALL' | 'ANY' = 'ALL') {
    const groupId = generateSnowflakeId()
    const newGroup: ConditionGroup = {
      id: groupId,
      scheduleTaskId: taskId.value,
      type,
      conditions: [],
    }
    formData.conditionGroups.push(newGroup)
    isDirty.value = true
    return newGroup
  }

  function removeConditionGroup(index: number) {
    const removed = formData.conditionGroups.splice(index, 1)[0]
    // 清理关联的动作组
    formData.actionGroups.forEach(ag => {
      if (ag.conditionGroupId === removed.id) {
        ag.conditionGroupId = undefined
      }
    })
    isDirty.value = true
    return removed
  }

  function addCondition(groupIndex: number) {
    const group = formData.conditionGroups[groupIndex]
    if (!group) return null
    
    const newCondition: Condition = {
      id: generateSnowflakeId(),
      scheduleTaskId: taskId.value,
      conditionGroupId: group.id,
      expr: '',
      desc: '',
    }
    group.conditions.push(newCondition)
    isDirty.value = true
    return newCondition
  }

  function removeCondition(groupIndex: number, conditionIndex: number) {
    const group = formData.conditionGroups[groupIndex]
    if (!group) return null
    const removed = group.conditions.splice(conditionIndex, 1)[0]
    isDirty.value = true
    return removed
  }

  function updateConditionExpr(groupIndex: number, conditionIndex: number, expr: string) {
    const group = formData.conditionGroups[groupIndex]
    if (group?.conditions[conditionIndex]) {
      group.conditions[conditionIndex].expr = expr
      isDirty.value = true
    }
  }

  // ============ 动作组操作 ============
  function addActionGroup(conditionGroupId?: string) {
    const groupId = generateSnowflakeId()
    const newGroup: ActionGroup = {
      id: groupId,
      scheduleTaskId: taskId.value,
      conditionGroupId,
      actions: [],
    }
    formData.actionGroups.push(newGroup)
    isDirty.value = true
    return newGroup
  }

  function removeActionGroup(index: number) {
    const removed = formData.actionGroups.splice(index, 1)[0]
    isDirty.value = true
    return removed
  }

  function addAction(groupIndex: number, action?: Partial<Action>) {
    const group = formData.actionGroups[groupIndex]
    if (!group) return null
    
    const newAction: Action = {
      id: generateSnowflakeId(),
      scheduleTaskId: taskId.value,
      actionGroupId: group.id,
      deviceType: action?.deviceType || 'AirCondition' as DeviceType,
      deviceId: action?.deviceId || 0,
      commandLine: action?.commandLine || 'OPEN_AIR_CONDITION_RS485' as any,
      args: action?.args || [],
    }
    group.actions.push(newAction)
    isDirty.value = true
    return newAction
  }

  function removeAction(groupIndex: number, actionIndex: number) {
    const group = formData.actionGroups[groupIndex]
    if (!group) return null
    const removed = group.actions.splice(actionIndex, 1)[0]
    isDirty.value = true
    return removed
  }

  function updateActionArgs(groupIndex: number, actionIndex: number, args: number[]) {
    const group = formData.actionGroups[groupIndex]
    if (group?.actions[actionIndex]) {
      group.actions[actionIndex].args = args
      isDirty.value = true
    }
  }

  // ============ 报警操作 ============
  function addAlarm(userId?: number, type: 'SMS' | 'SMTP' = 'SMS') {
    const newAlarm: Alarm = {
      id: generateSnowflakeId(),
      scheduleTaskId: taskId.value,
      userId: userId || 0,
      type,
    }
    formData.alarmGroup.push(newAlarm)
    isDirty.value = true
    return newAlarm
  }

  function removeAlarm(index: number) {
    const removed = formData.alarmGroup.splice(index, 1)[0]
    isDirty.value = true
    return removed
  }

  // ============ 验证方法 ============
  function validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!formData.task.taskName?.trim()) {
      errors.push('请输入任务名称')
    }

    if (!formData.task.cron?.trim()) {
      errors.push('请输入Cron表达式')
    }

    if (formData.actionGroups.length === 0) {
      errors.push('请至少添加一个动作组')
    }

    // 验证动作组中的动作
    formData.actionGroups.forEach((ag, gi) => {
      ag.actions.forEach((a, ai) => {
        if (!a.deviceId) {
          errors.push(`动作组${gi + 1} - 动作${ai + 1}: 请选择设备`)
        }
      })
    })

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  // ============ 获取提交数据 ============
  function getSubmitData(): ScheduleConfigRoot {
    // 先同步所有ID
    syncRangesToForm()
    syncIdsToEntities()

    // 返回深拷贝数据
    return {
      task: { ...formData.task },
      timeRule: { ...formData.timeRule },
      dataGroup: formData.dataGroup.map(d => ({ ...d })),
      conditionGroups: formData.conditionGroups.map(cg => ({
        ...cg,
        conditions: cg.conditions.map(c => ({ ...c })),
      })),
      actionGroups: formData.actionGroups.map(ag => ({
        ...ag,
        actions: ag.actions.map(a => ({ ...a })),
      })),
      alarmGroup: formData.alarmGroup.map(a => ({ ...a })),
      watchDog: { ...formData.watchDog },
    }
  }

  // ============ 重置方法 ============
  function reset() {
    initFormData()
    isDirty.value = false
  }

  // 监听范围变化
  watch(() => ranges.dateRange, syncRangesToForm, { deep: true })
  watch(() => ranges.timeRange, syncRangesToForm, { deep: true })

  // 监听表单变化标记脏状态
  watch(formData, () => {
    isDirty.value = true
  }, { deep: true })

  return {
    // 状态
    formData,
    ranges,
    isDirty,
    
    // 计算属性
    taskId,
    hasDataSources,
    hasConditionGroups,
    hasActionGroups,
    dataSourceIdMap,
    
    // 初始化
    initFormData,
    
    // 数据源操作
    addDataSource,
    removeDataSource,
    updateDataSourceDevice,
    
    // 条件组操作
    addConditionGroup,
    removeConditionGroup,
    addCondition,
    removeCondition,
    updateConditionExpr,
    
    // 动作组操作
    addActionGroup,
    removeActionGroup,
    addAction,
    removeAction,
    updateActionArgs,
    
    // 报警操作
    addAlarm,
    removeAlarm,
    
    // 验证与提交
    validate,
    getSubmitData,
    reset,
    syncIdsToEntities,
  }
}

export type QuartzFormInstance = ReturnType<typeof useQuartzForm>
