<template>
  <el-card class="form-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-icon><Switch /></el-icon>
        <span>动作配置</span>
        <el-tag type="info" effect="plain" size="small" style="margin-left: 8px">
          设备控制指令
        </el-tag>
        <el-button
          v-if="!readonly"
          type="primary"
          :icon="Plus"
          size="small"
          style="margin-left: auto"
          @click="emit('addGroup')"
        >
          添加动作组
        </el-button>
      </div>
    </template>

    <el-empty v-if="actionGroups.length === 0" description="暂无动作组，请至少添加一个" />

    <div
      v-for="(group, groupIndex) in actionGroups"
      :key="group.id"
      class="action-group"
    >
      <div class="group-header">
        <div class="group-title">
          <span>动作组 {{ groupIndex + 1 }}</span>
          <el-select
            v-model="group.conditionGroupId"
            placeholder="关联条件组（可选）"
            clearable
            size="small"
            style="width: 180px; margin-left: 12px"
          >
            <el-option
              v-for="(cg, idx) in conditionGroups"
              :key="cg.id"
              :label="`条件组${idx + 1}`"
              :value="cg.id"
            />
          </el-select>
        </div>
        <el-button
          v-if="!readonly"
          type="danger"
          :icon="Delete"
          size="small"
          circle
          @click="emit('removeGroup', groupIndex)"
        />
      </div>

      <div
        v-for="(action, actIndex) in group.actions"
        :key="action.id"
        class="action-item"
      >
        <el-row :gutter="10" align="middle">
          <el-col :span="5">
            <el-select
              v-model="action.deviceType"
              placeholder="设备类型"
              @change="onDeviceTypeChange(action)"
            >
              <el-option
                v-for="type in deviceTypeOptions"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-select
              v-model="action.deviceId"
              placeholder="设备"
              @change="onDeviceChange(action)"
            >
              <el-option
                v-for="device in getDevicesByType(action.deviceType)"
                :key="device.id"
                :label="device.name"
                :value="device.id"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="action.commandLine"
              placeholder="指令"
              @change="onCommandChange(action)"
            >
              <el-option
                v-for="cmd in getCommandsByType(action.deviceType)"
                :key="cmd.value"
                :label="cmd.label"
                :value="cmd.value"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <!-- 空调增强控制参数 -->
            <template v-if="action.commandLine === CommandLineValues.ENHANCE_CONTROL_AIR_CONDITION">
              <el-button
                type="primary"
                link
                @click="emit('configArgs', groupIndex, actIndex, action)"
              >
                配置参数
                <el-tag v-if="action.args.length > 2" size="small" type="success">
                  已配置
                </el-tag>
              </el-button>
            </template>
            <!-- 门禁延时设定 -->
            <template v-else-if="action.commandLine === CommandLineValues.SET_ACCESS_DELAY">
              <el-input-number
                v-if="!readonly"
                v-model="action.args[1]"
                :min="0"
                :max="255"
                :step="1"
                size="small"
                placeholder="延时(秒)"
                style="width: 120px"
              />
              <span v-else class="args-preview">
                延时: {{ action.args[1] ?? '-' }} 秒
              </span>
            </template>
            <template v-else-if="action.deviceId">
              <span class="args-preview">
                参数: {{ formatArgsPreview(action.args) }}
              </span>
            </template>
          </el-col>
          <el-col :span="2">
            <el-button
              v-if="!readonly"
              type="danger"
              :icon="Delete"
              size="small"
              circle
              @click="emit('removeAction', groupIndex, actIndex)"
            />
          </el-col>
        </el-row>
      </div>

      <el-button
        v-if="!readonly"
        type="primary"
        link
        :icon="Plus"
        @click="emit('addAction', groupIndex)"
      >
        添加动作
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Switch, Plus, Delete } from '@element-plus/icons-vue'
import type { 
  ActionGroup, 
  Action, 
  ConditionGroup, 
  Device, 
  DeviceType, 
  CommandLine,
} from '../../types/quartz'
import { DeviceType as DeviceTypeEnum, CommandLine as CommandLineEnum } from '../../types/quartz'

const props = defineProps<{
  actionGroups: ActionGroup[]
  conditionGroups: ConditionGroup[]
  devices: Device[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  addGroup: []
  removeGroup: [index: number]
  addAction: [groupIndex: number]
  removeAction: [groupIndex: number, actionIndex: number]
  configArgs: [groupIndex: number, actionIndex: number, action: Action]
}>()

const CommandLineValues = CommandLineEnum

const deviceTypeOptions = [
  { label: '空调', value: DeviceTypeEnum.AirCondition },
  { label: '断路器', value: DeviceTypeEnum.CircuitBreak },
  { label: '照明', value: DeviceTypeEnum.Light },
  { label: '门禁', value: DeviceTypeEnum.Access },
  { label: '传感器', value: DeviceTypeEnum.Sensor },
]

const commandOptions: Record<DeviceType, { label: string; value: CommandLine }[]> = {
  [DeviceTypeEnum.AirCondition]: [
    { label: '开启空调', value: CommandLineEnum.OPEN_AIR_CONDITION_RS485 },
    { label: '关闭空调', value: CommandLineEnum.CLOSE_AIR_CONDITION_RS485 },
    { label: '增强控制', value: CommandLineEnum.ENHANCE_CONTROL_AIR_CONDITION },
    { label: '请求数据', value: CommandLineEnum.REQUEST_AIR_CONDITION_DATA_RS485 },
  ],
  [DeviceTypeEnum.CircuitBreak]: [
    { label: '合闸通电', value: CommandLineEnum.OPEN_CIRCUITBREAK },
    { label: '分闸断电', value: CommandLineEnum.CLOSE_CIRCUITBREAK },
    { label: '请求数据', value: CommandLineEnum.REQUEST_CIRCUITBREAK_DATA },
  ],
  [DeviceTypeEnum.Light]: [
    { label: '开灯', value: CommandLineEnum.OPEN_LIGHT },
    { label: '关灯', value: CommandLineEnum.CLOSE_LIGHT },
    { label: '请求数据', value: CommandLineEnum.REQUEST_LIGHT_DATA },
  ],
  [DeviceTypeEnum.Sensor]: [
    { label: '请求数据', value: CommandLineEnum.REQUEST_SENSOR_DATA },
  ],
  [DeviceTypeEnum.Access]: [
    { label: '单次开门', value: CommandLineEnum.OPEN_ACCESS_ONCE },
    { label: '单次关门', value: CommandLineEnum.CLOSE_ACCESS_ONCE },
    { label: '请求数据', value: CommandLineEnum.REQUEST_ACCESS_DATA },
    { label: '长开锁定', value: CommandLineEnum.OPEN_ACCESS_PERSIST_LOCK },
    { label: '长开解锁', value: CommandLineEnum.OPEN_ACCESS_PERSIST_UNLOCK },
    { label: '长开保持', value: CommandLineEnum.OPEN_ACCESS_PERSIST_KEEP },
    { label: '长关锁定', value: CommandLineEnum.CLOSE_ACCESS_PERSIST_LOCK },
    { label: '长关解锁', value: CommandLineEnum.CLOSE_ACCESS_PERSIST_UNLOCK },
    { label: '长关保持', value: CommandLineEnum.CLOSE_ACCESS_PERSIST_KEEP },
    { label: '保持锁定', value: CommandLineEnum.KEEP_ACCESS_STATUS_LOCK },
    { label: '保持解锁', value: CommandLineEnum.KEEP_ACCESS_STATUS_UNLOCK },
    { label: '延时设定', value: CommandLineEnum.SET_ACCESS_DELAY },
  ],
}

function onDeviceTypeChange(action: Action) {
  action.deviceId = 0
  const commands = commandOptions[action.deviceType]
  action.commandLine = commands[0]?.value || CommandLineEnum.OPEN_AIR_CONDITION_RS485
  rebuildArgs(action)
}

function onDeviceChange(action: Action) {
  rebuildArgs(action)
}

function onCommandChange(action: Action) {
  rebuildArgs(action)
}

function rebuildArgs(action: Action) {
  const device = props.devices.find(d => d.id === action.deviceId)
  if (!device || device.address === undefined) {
    action.args = []
    return
  }

  const address = device.address
  const selfId = device.selfId

  // 根据指令确定基础参数
  let baseArgs: number[]
  switch (action.commandLine) {
    case CommandLineEnum.OPEN_CIRCUITBREAK:
    case CommandLineEnum.CLOSE_CIRCUITBREAK:
    case CommandLineEnum.REQUEST_CIRCUITBREAK_DATA:
    case CommandLineEnum.OPEN_ACCESS_ONCE:
    case CommandLineEnum.CLOSE_ACCESS_ONCE:
    case CommandLineEnum.REQUEST_ACCESS_DATA:
    case CommandLineEnum.OPEN_ACCESS_PERSIST_LOCK:
    case CommandLineEnum.OPEN_ACCESS_PERSIST_UNLOCK:
    case CommandLineEnum.OPEN_ACCESS_PERSIST_KEEP:
    case CommandLineEnum.CLOSE_ACCESS_PERSIST_LOCK:
    case CommandLineEnum.CLOSE_ACCESS_PERSIST_UNLOCK:
    case CommandLineEnum.CLOSE_ACCESS_PERSIST_KEEP:
    case CommandLineEnum.KEEP_ACCESS_STATUS_LOCK:
    case CommandLineEnum.KEEP_ACCESS_STATUS_UNLOCK:
      baseArgs = [address]
      break
    default:
      baseArgs = selfId !== undefined ? [address, selfId] : [address]
      break
  }

  // 特殊指令保留额外的操作参数
  if (action.commandLine === CommandLineEnum.ENHANCE_CONTROL_AIR_CONDITION) {
    if (action.args.length >= baseArgs.length + 4) {
      action.args = [
        ...baseArgs,
        action.args[baseArgs.length],
        action.args[baseArgs.length + 1],
        action.args[baseArgs.length + 2],
        action.args[baseArgs.length + 3],
      ]
    } else {
      action.args = [...baseArgs]
    }
  } else if (action.commandLine === CommandLineValues.SET_ACCESS_DELAY) {
    if (action.args.length >= baseArgs.length + 1) {
      action.args = [...baseArgs, action.args[baseArgs.length]]
    } else {
      action.args = [...baseArgs, 5]
    }
  } else {
    action.args = baseArgs
  }
}

function getDevicesByType(type?: DeviceType): Device[] {
  if (!type) return []
  return props.devices.filter(d => d.type === type)
}

function getCommandsByType(type?: DeviceType) {
  if (!type) return []
  return commandOptions[type] || []
}

function formatArgsPreview(args: number[]): string {
  if (args.length === 0) return '-'
  return args.join(', ')
}
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.card-header .el-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.action-group {
  margin-bottom: 16px;
  padding: 16px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.action-item {
  margin-bottom: 12px;
  padding: 12px;
  background-color: var(--el-bg-color);
  border-radius: 6px;
}

.args-preview {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
