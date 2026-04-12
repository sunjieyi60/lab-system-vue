<template>
  <el-card class="form-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-icon><DataLine /></el-icon>
        <span>数据源配置</span>
        <el-tag type="info" effect="plain" size="small" style="margin-left: 8px">
          用于SpEL表达式引用
        </el-tag>
        <el-button
          v-if="!readonly"
          type="primary"
          :icon="Plus"
          size="small"
          style="margin-left: auto"
          @click="emit('add')"
        >
          添加数据源
        </el-button>
      </div>
    </template>

    <el-empty v-if="dataGroup.length === 0" description="暂无数据源" />
    
    <div
      v-for="(dataSource, index) in dataGroup"
      :key="dataSource.id"
      class="data-source-item"
    >
      <div class="item-header">
        <span class="item-title">数据源 {{ index + 1 }}</span>
        <el-tag type="warning" size="small" effect="dark">
          ID: {{ dataSource.id.slice(-8) }}
        </el-tag>
        <el-button
          v-if="!readonly"
          type="danger"
          :icon="Delete"
          size="small"
          circle
          @click="emit('remove', index)"
        />
      </div>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="设备选择" required>
            <el-select
              :model-value="dataSource.deviceId"
              placeholder="选择设备"
              style="width: 100%"
              @update:model-value="(val: number) => emit('updateDevice', index, val)"
            >
              <el-option
                v-for="device in availableDevices"
                :key="device.id"
                :label="device.name"
                :value="device.id"
              >
                <span style="float: left">{{ device.name }}</span>
                <el-tag size="small" style="float: right">{{ device.type }}</el-tag>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备类型">
            <el-tag :type="getDeviceTypeTag(dataSource.deviceType)">
              {{ dataSource.deviceType || '未选择' }}
            </el-tag>
          </el-form-item>
        </el-col>
      </el-row>
      <el-divider v-if="index < dataGroup.length - 1" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DataLine, Plus, Delete } from '@element-plus/icons-vue'
import type { DataSource, Device, DeviceType } from '../../types/quartz'

const props = defineProps<{
  dataGroup: DataSource[]
  devices: Device[]
  readonly?: boolean
  laboratoryId?: number
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
  updateDevice: [index: number, deviceId: number]
}>()

// 根据实验室过滤设备，并排除已使用的设备
const availableDevices = computed(() => {
  const usedDeviceIds = new Set(props.dataGroup.map(d => d.deviceId).filter(id => id > 0))
  let filtered = props.devices.filter(d => !usedDeviceIds.has(d.id))
  
  // 如果指定了实验室，只显示该实验室的设备
  if (props.laboratoryId) {
    filtered = filtered.filter(d => (d as any).labId === props.laboratoryId)
  }
  
  return filtered
})

const tagMap: Record<DeviceType, string> = {
  AirCondition: 'success',
  CircuitBreak: 'warning',
  Light: 'primary',
  Sensor: 'info',
  Access: 'danger',
}

function getDeviceTypeTag(type?: DeviceType) {
  return type ? tagMap[type] : 'info'
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

.data-source-item {
  margin-bottom: 16px;
  padding: 16px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.item-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
