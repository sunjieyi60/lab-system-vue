<template>
  <div class="quartz-task-form">
    <el-form
      ref="formRef"
      :model="form.formData"
      label-position="top"
      :disabled="isViewMode"
      class="task-form"
    >
      <!-- 任务主体 -->
      <TaskBasicCard
        v-model="form.ranges.dateRange"
        :task="form.formData.task"
      />

      <!-- 时间规则 -->
      <TimeRuleCard
        v-model:time-range="form.ranges.timeRange"
        :time-rule="form.formData.timeRule"
        :semesters="semesters"
      />

      <!-- 数据源配置 -->
      <DataSourceCard
        :data-group="form.formData.dataGroup"
        :devices="devices"
        :readonly="isViewMode"
        @add="handleAddDataSource"
        @remove="form.removeDataSource"
        @update-device="handleUpdateDataSourceDevice"
      />

      <!-- 条件配置 -->
      <ConditionCard
        :condition-groups="form.formData.conditionGroups"
        :data-sources="form.formData.dataGroup"
        :devices="devices"
        :readonly="isViewMode"
        @add-group="handleAddConditionGroup"
        @remove-group="form.removeConditionGroup"
        @add-condition="form.addCondition"
        @remove-condition="form.removeCondition"
      />

      <!-- 动作配置 -->
      <ActionCard
        :action-groups="form.formData.actionGroups"
        :condition-groups="form.formData.conditionGroups"
        :devices="devices"
        :readonly="isViewMode"
        @add-group="handleAddActionGroup"
        @remove-group="form.removeActionGroup"
        @add-action="form.addAction"
        @remove-action="form.removeAction"
        @config-args="handleConfigArgs"
      />

      <!-- 报警配置 -->
      <AlarmCard
        :alarm-group="form.formData.alarmGroup"
        :users="users"
        :readonly="isViewMode"
        @add="handleAddAlarm"
        @remove="form.removeAlarm"
      />

      <!-- 看门狗配置 -->
      <WatchDogCard :watch-dog="form.formData.watchDog" />

      <!-- 操作按钮 -->
      <div class="form-actions" v-if="!isViewMode">
        <el-button @click="handleCancel">取消</el-button>
        <el-button v-if="isCreateMode" @click="handleReset">重置</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ isCreateMode ? '创建' : '更新' }}
        </el-button>
      </div>
      <div class="form-actions" v-else>
        <el-button @click="handleCancel">返回</el-button>
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
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
// FormInstance type not currently used

import { useQuartzForm } from '../composables/useQuartzForm'
import TaskBasicCard from './cards/TaskBasicCard.vue'
import TimeRuleCard from './cards/TimeRuleCard.vue'
import DataSourceCard from './cards/DataSourceCard.vue'
import ConditionCard from './cards/ConditionCard.vue'
import ActionCard from './cards/ActionCard.vue'
import AlarmCard from './cards/AlarmCard.vue'
import WatchDogCard from './cards/WatchDogCard.vue'
import AirConditionArgsDialog from './AirConditionArgsDialog.vue'

import type {
  ScheduleConfigRoot,
  Device,
  User,
  Semester,
  FormMode,
  Action,
  DeviceType,
} from '../types/quartz'
import { CommandLine } from '../types/quartz'

// ============================================
// Props & Emits
// ============================================
const props = withDefaults(defineProps<{
  initialValue?: ScheduleConfigRoot
  mode?: FormMode
  laboratoryId: number
  devices: Device[]
  users: User[]
  semesters: Semester[]
  loading?: boolean
}>(), {
  mode: 'create',
  loading: false,
})

const emit = defineEmits<{
  submit: [data: { isCreate: boolean; data: ScheduleConfigRoot }]
  cancel: []
  change: [data: ScheduleConfigRoot]
}>()

// ============================================
// 表单状态管理
// ============================================
const form = useQuartzForm({
  laboratoryId: props.laboratoryId,
  mode: props.mode,
  initialValue: props.initialValue,
})

// ============================================
// 计算属性
// ============================================
const isCreateMode = computed(() => props.mode === 'create')
const isViewMode = computed(() => props.mode === 'view')

// ============================================
// 空调参数对话框状态
// ============================================
const argsDialogVisible = ref(false)
const currentEditingAction = ref<{ groupIndex: number; actionIndex: number } | null>(null)
const currentEditingArgs = ref<number[]>([])

const currentEditingDevice = computed(() => {
  if (!currentEditingAction.value) return undefined
  const { groupIndex, actionIndex } = currentEditingAction.value
  const action = form.formData.actionGroups[groupIndex]?.actions[actionIndex]
  if (!action) return undefined
  return props.devices.find(d => d.id === action.deviceId)
})

// ============================================
// 初始化监听
// ============================================
watch(() => props.initialValue, (val) => {
  form.initFormData(val)
}, { immediate: true, deep: true })

watch(() => props.laboratoryId, () => {
  form.initFormData()
})

// 监听表单变化并emit
watch(() => form.formData, () => {
  emit('change', form.getSubmitData())
}, { deep: true })

// ============================================
// 事件处理
// ============================================

// 数据源操作
function handleAddDataSource() {
  form.addDataSource()
}

function handleUpdateDataSourceDevice(index: number, deviceId: number) {
  const device = props.devices.find(d => d.id === deviceId)
  if (device) {
    form.updateDataSourceDevice(index, deviceId, device.type)
  }
}

// 条件组操作
function handleAddConditionGroup() {
  const group = form.addConditionGroup('ALL')
  // 自动添加一个条件
  if (group) {
    const groupIndex = form.formData.conditionGroups.indexOf(group)
    form.addCondition(groupIndex)
  }
}

// 动作组操作
function handleAddActionGroup() {
  const group = form.addActionGroup()
  // 自动添加一个动作
  if (group) {
    const groupIndex = form.formData.actionGroups.indexOf(group)
    form.addAction(groupIndex)
  }
}

// 报警操作
function handleAddAlarm() {
  form.addAlarm()
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
    form.updateActionArgs(groupIndex, actionIndex, args)
    ElMessage.success('参数已保存')
  }
}

// ============================================
// 表单提交
// ============================================
async function handleSubmit() {
  const { valid, errors } = form.validate()
  
  if (!valid) {
    errors.forEach(err => ElMessage.error(err))
    return
  }

  const submitData = form.getSubmitData()
  emit('submit', {
    isCreate: isCreateMode.value,
    data: submitData,
  })
}

function handleCancel() {
  emit('cancel')
}

function handleReset() {
  form.reset()
  ElMessage.success('表单已重置')
}

// ============================================
// 暴露方法
// ============================================
defineExpose({
  getFormData: form.getSubmitData,
  validate: () => form.validate().valid,
  reset: form.reset,
})
</script>

<style scoped>
.quartz-task-form {
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

:deep(.el-checkbox-button__inner) {
  min-width: 60px;
}
</style>
