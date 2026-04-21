<template>
  <div class="course-schedule-task-form">
    <el-form
      :model="formData"
      label-position="top"
      class="task-form"
    >
      <!-- 课表任务生成配置 -->
      <CourseScheduleCard
        v-model="formData"
        :laboratories="laboratories"
        :semesters="semesters"
      />

      <!-- 数据源配置 -->
      <DataSourceCard
        :data-group="formData.dataGroup"
        :devices="devices"
        @add="handleAddDataSource"
        @remove="handleRemoveDataSource"
        @update-device="handleUpdateDataSourceDevice"
      />

      <!-- 条件配置 -->
      <ConditionCard
        :condition-groups="formData.conditionGroups"
        :data-sources="formData.dataGroup"
        :devices="devices"
        @add-group="handleAddConditionGroup"
        @remove-group="handleRemoveConditionGroup"
        @add-condition="handleAddCondition"
        @remove-condition="handleRemoveCondition"
      />

      <!-- 动作配置 -->
      <ActionCard
        :action-groups="formData.actionGroups"
        :condition-groups="formData.conditionGroups"
        :devices="devices"
        @add-group="handleAddActionGroup"
        @remove-group="handleRemoveActionGroup"
        @add-action="handleAddAction"
        @remove-action="handleRemoveAction"
        @config-args="handleConfigArgs"
      />

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          生成任务
        </el-button>
      </div>
    </el-form>

    <!-- 空调参数配置对话框 -->
    <AirConditionArgsDialog
      v-model="argsDialogVisible"
      :initial-args="currentEditingArgs"
      :default-address="currentEditingDevice?.address"
      :default-self-id="currentEditingDevice?.selfId"
      @confirm="handleArgsConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import CourseScheduleCard from './cards/CourseScheduleCard.vue'
import DataSourceCard from './cards/DataSourceCard.vue'
import ConditionCard from './cards/ConditionCard.vue'
import ActionCard from './cards/ActionCard.vue'
import AirConditionArgsDialog from './AirConditionArgsDialog.vue'
import { generateSnowflakeId } from '../utils/snowflake'
import type {
  DataSource,
  ConditionGroup,
  Condition,
  ActionGroup,
  Action,
  Device,
  DeviceType,
} from '../types/quartz'
import { CommandLine } from '../types/quartz'

interface Laboratory {
  id: number
  laboratoryName?: string
  laboratoryId?: string
}

interface Semester {
  id: number
  name: string
  startDate?: string
  endDate?: string
  totalWeeks?: number
}

interface CourseScheduleFormData {
  laboratoryId: number[]
  semesterId: number | undefined
  cron: string
  earlyStart: number
  delayEnd: number
  enable: boolean
  dataGroup: DataSource[]
  conditionGroups: ConditionGroup[]
  actionGroups: ActionGroup[]
}

// ============================================
// Props & Emits
// ============================================
const props = defineProps<{
  laboratories: Laboratory[]
  semesters: Semester[]
  devices: Device[]
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CourseScheduleFormData]
  cancel: []
}>()

// ============================================
// 表单状态
// ============================================
const defaultFormData: CourseScheduleFormData = {
  laboratoryId: [],
  semesterId: undefined,
  cron: '0 0/5 * * * ?',
  earlyStart: 7,
  delayEnd: 7,
  enable: true,
  dataGroup: [],
  conditionGroups: [],
  actionGroups: [],
}

const formData = reactive<CourseScheduleFormData>({ ...defaultFormData })

// ============================================
// 空调参数对话框状态
// ============================================
const argsDialogVisible = ref(false)
const currentEditingAction = ref<{ groupIndex: number; actionIndex: number } | null>(null)
const currentEditingArgs = ref<number[]>([])

const currentEditingDevice = computed(() => {
  if (!currentEditingAction.value) return undefined
  const { groupIndex, actionIndex } = currentEditingAction.value
  const action = formData.actionGroups[groupIndex]?.actions[actionIndex]
  if (!action) return undefined
  return props.devices.find(d => d.id === action.deviceId)
})

// ============================================
// 数据源操作
// ============================================
function handleAddDataSource() {
  const newDataSource: DataSource = {
    id: generateSnowflakeId(),
    scheduleTaskId: '',
    deviceId: 0,
    deviceType: 'Sensor' as DeviceType,
  }
  formData.dataGroup.push(newDataSource)
}

function handleRemoveDataSource(index: number, dataSourceId: string) {
  formData.dataGroup.splice(index, 1)

  // 清理条件组中引用该数据源的条件
  for (let gi = formData.conditionGroups.length - 1; gi >= 0; gi--) {
    const group = formData.conditionGroups[gi]
    for (let ci = group.conditions.length - 1; ci >= 0; ci--) {
      const condition = group.conditions[ci]
      if (condition.expr.includes(`#{${dataSourceId}}`)) {
        group.conditions.splice(ci, 1)
      }
    }
  }

  ElMessage.info('已清理关联的条件设置')
}

function handleUpdateDataSourceDevice(index: number, deviceId: number) {
  const device = props.devices.find(d => d.id === deviceId)
  if (device) {
    formData.dataGroup[index].deviceId = deviceId
    formData.dataGroup[index].deviceType = device.type
  }
}

// ============================================
// 条件组操作
// ============================================
function handleAddConditionGroup() {
  const groupId = generateSnowflakeId()
  const newGroup: ConditionGroup = {
    id: groupId,
    scheduleTaskId: '',
    type: 'ALL',
    conditions: [],
  }
  formData.conditionGroups.push(newGroup)
  // 自动添加一个条件
  const groupIndex = formData.conditionGroups.indexOf(newGroup)
  handleAddCondition(groupIndex)
}

function handleRemoveConditionGroup(index: number) {
  const removed = formData.conditionGroups.splice(index, 1)[0]
  // 清理关联的动作组
  formData.actionGroups.forEach(ag => {
    if (ag.conditionGroupId === removed.id) {
      ag.conditionGroupId = undefined
    }
  })
}

function handleAddCondition(groupIndex: number) {
  const group = formData.conditionGroups[groupIndex]
  if (!group) return
  const newCondition: Condition = {
    id: generateSnowflakeId(),
    scheduleTaskId: '',
    conditionGroupId: group.id,
    expr: '',
    desc: '',
  }
  group.conditions.push(newCondition)
}

function handleRemoveCondition(groupIndex: number, conditionIndex: number) {
  const group = formData.conditionGroups[groupIndex]
  if (!group) return
  group.conditions.splice(conditionIndex, 1)
}

// ============================================
// 动作组操作
// ============================================
function handleAddActionGroup() {
  const groupId = generateSnowflakeId()
  const newGroup: ActionGroup = {
    id: groupId,
    scheduleTaskId: '',
    actions: [],
  }
  formData.actionGroups.push(newGroup)
  // 自动添加一个动作
  const groupIndex = formData.actionGroups.indexOf(newGroup)
  handleAddAction(groupIndex)
}

function handleRemoveActionGroup(index: number) {
  formData.actionGroups.splice(index, 1)
}

function handleAddAction(groupIndex: number) {
  const group = formData.actionGroups[groupIndex]
  if (!group) return
  const newAction: Action = {
    id: generateSnowflakeId(),
    scheduleTaskId: '',
    actionGroupId: group.id,
    deviceType: 'AirCondition' as DeviceType,
    deviceId: 0,
    commandLine: 'OPEN_AIR_CONDITION_RS485' as CommandLine,
    args: [],
  }
  group.actions.push(newAction)
}

function handleRemoveAction(groupIndex: number, actionIndex: number) {
  const group = formData.actionGroups[groupIndex]
  if (!group) return
  group.actions.splice(actionIndex, 1)
}

// 空调参数配置
function handleConfigArgs(groupIndex: number, actionIndex: number, action: Action) {
  currentEditingAction.value = { groupIndex, actionIndex }
  currentEditingArgs.value = [...action.args]
  argsDialogVisible.value = true
}

function handleArgsConfirm(args: number[]) {
  if (currentEditingAction.value) {
    const { groupIndex, actionIndex } = currentEditingAction.value
    const action = formData.actionGroups[groupIndex]?.actions[actionIndex]
    if (action) {
      action.args = args
      ElMessage.success('参数已保存')
    }
  }
}

// ============================================
// 表单验证
// ============================================
function validate(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!formData.semesterId) {
    errors.push('请选择学期')
  }

  if (!formData.laboratoryId || formData.laboratoryId.length === 0) {
    errors.push('请至少选择一个实验室')
  }

  if (!formData.cron || formData.cron.trim() === '') {
    errors.push('请输入Cron表达式')
  }

  if (formData.earlyStart < 0 || formData.earlyStart > 60) {
    errors.push('提前执行时间必须在0-60分钟之间')
  }

  if (formData.delayEnd < 0 || formData.delayEnd > 60) {
    errors.push('延迟结束时间必须在0-60分钟之间')
  }

  // 验证数据源（如果有填写）
  formData.dataGroup.forEach((ds, i) => {
    if (!ds.deviceId) {
      errors.push(`数据源${i + 1}: 请选择设备`)
    }
  })

  // 验证条件组（如果有填写）
  formData.conditionGroups.forEach((cg, gi) => {
    if (!cg.conditions || cg.conditions.length === 0) {
      errors.push(`条件组${gi + 1}: 请至少添加一个条件`)
    }
    cg.conditions.forEach((c, ci) => {
      if (!c.expr || c.expr.trim() === '') {
        errors.push(`条件组${gi + 1}-条件${ci + 1}: 请填写条件表达式`)
      }
    })
  })

  // 验证动作组（如果有填写）
  formData.actionGroups.forEach((ag, gi) => {
    if (!ag.actions || ag.actions.length === 0) {
      errors.push(`动作组${gi + 1}: 请至少添加一个动作`)
    }
    ag.actions.forEach((a, ai) => {
      if (!a.deviceId) {
        errors.push(`动作组${gi + 1}-动作${ai + 1}: 请选择设备`)
      }
    })
    // 验证 conditionGroupId 是否在条件组中存在
    if (ag.conditionGroupId) {
      const exists = formData.conditionGroups.some(cg => cg.id === ag.conditionGroupId)
      if (!exists) {
        errors.push(`动作组${gi + 1}: 关联的条件组不存在`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================
// 事件处理
// ============================================
function handleSubmit() {
  const { valid, errors } = validate()

  if (!valid) {
    errors.forEach(err => ElMessage.error(err))
    return
  }

  emit('submit', { ...formData })
}

function handleCancel() {
  emit('cancel')
}

function handleReset() {
  Object.assign(formData, defaultFormData)
  ElMessage.success('表单已重置')
}

// ============================================
// 暴露方法
// ============================================
defineExpose({
  getFormData: () => ({ ...formData }),
  validate: () => validate().valid,
  reset: handleReset
})
</script>

<style scoped>
.course-schedule-task-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
}
</style>
