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
            <template v-if="action.commandLine === CommandLine.ENHANCE_CONTROL_AIR_CONDITION">
              <el-button
                type="primary"
                link
                @click="emit('configArgs', groupIndex, actIndex, action)"
              >
                配置参数
                <el-tag v-if="action.args.length > 0" size="small" type="success">
                  已配置
                </el-tag>
              </el-button>
            </template>
            <template v-else-if="action.deviceId">
              <span class="args-preview">
                地址: {{ getDeviceAddress(action.deviceId) || '-' }}
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
  CommandLine 
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

const CommandLine = CommandLineEnum

const deviceTypeOptions = [
  { label: '空调', value: DeviceTypeEnum.AirCondition },
  { label: '断路器', value: DeviceTypeEnum.CircuitBreak },
  { label: '照明', value: DeviceTypeEnum.Light },
]

const commandOptions: Record<DeviceType, { label: string; value: CommandLine }[]> = {
  [DeviceTypeEnum.AirCondition]: [
    { label: '开启空调', value: CommandLineEnum.OPEN_AIR_CONDITION_RS485 },
    { label: '关闭空调', value: CommandLineEnum.CLOSE_AIR_CONDITION_RS485 },
    { label: '增强控制', value: CommandLineEnum.ENHANCE_CONTROL_AIR_CONDITION },
  ],
  [DeviceTypeEnum.CircuitBreak]: [
    { label: '合闸', value: CommandLineEnum.OPEN_CIRCUIT_BREAK },
    { label: '分闸', value: CommandLineEnum.CLOSE_CIRCUIT_BREAK },
  ],
  [DeviceTypeEnum.Light]: [
    { label: '开灯', value: CommandLineEnum.OPEN_LIGHT },
    { label: '关灯', value: CommandLineEnum.CLOSE_LIGHT },
  ],
  [DeviceTypeEnum.Sensor]: [],
  [DeviceTypeEnum.Access]: [],
}

function onDeviceTypeChange(action: Action) {
  action.deviceId = 0
  const commands = commandOptions[action.deviceType]
  action.commandLine = commands[0]?.value || CommandLineEnum.OPEN_AIR_CONDITION_RS485
  action.args = []
}

function onCommandChange(action: Action) {
  action.args = []
}

function getDevicesByType(type?: DeviceType): Device[] {
  if (!type) return []
  return props.devices.filter(d => d.type === type)
}

function getCommandsByType(type?: DeviceType) {
  if (!type) return []
  return commandOptions[type] || []
}

function getDeviceAddress(deviceId: number): number | undefined {
  return props.devices.find(d => d.id === deviceId)?.address
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
