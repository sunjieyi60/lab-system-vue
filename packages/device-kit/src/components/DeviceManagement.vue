<template>
  <div class="device-management">
    <!-- 设备列表卡片 -->
    <el-card class="device-list-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Monitor /></el-icon>
            <span class="title">设备管理</span>
            <el-tag v-if="filterDeviceType" type="info" size="small">
              {{ DeviceTypeName[filterDeviceType] }}
            </el-tag>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="handleCreate">
              新增设备
            </el-button>
            <el-button type="success" :icon="Setting" @click="showGatewayDialog = true">
              网关管理
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-select
          v-model="filterDeviceType"
          placeholder="设备类型"
          clearable
          style="width: 140px"
          @change="handleTypeChange"
        >
          <el-option
            v-for="(label, type) in DeviceTypeName"
            :key="type"
            :label="label"
            :value="type"
          />
        </el-select>

        <el-select
          v-model="filterLabId"
          placeholder="所属实验室"
          clearable
          style="width: 180px; margin-left: 12px"
        >
          <el-option
            v-for="lab in laboratories"
            :key="lab.id"
            :label="lab.laboratoryName || lab.laboratoryId"
            :value="lab.id"
          />
        </el-select>

        <el-input
          v-model="searchKeyword"
          placeholder="搜索设备名称"
          style="width: 200px; margin-left: 12px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-button type="primary" :icon="Refresh" style="margin-left: auto" @click="handleRefresh">
          刷新
        </el-button>
      </div>

      <!-- 设备表格 -->
      <el-table
        v-loading="loading"
        :data="filteredDeviceList"
        style="width: 100%; margin-top: 16px"
        :header-cell-style="{ background: '#f5f7fa' }"
      >
        <el-table-column type="index" width="50" align="center" />
        
        <el-table-column prop="deviceName" label="设备名称" min-width="150">
          <template #default="{ row }">
            <div class="device-name-cell">
              <el-icon :size="18" class="device-icon">
                <component :is="getDeviceIcon(row.deviceType)" />
              </el-icon>
              <span>{{ row.deviceName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="deviceType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getDeviceTypeTag(row.deviceType as DeviceType)" size="small">
              {{ DeviceTypeName[row.deviceType as DeviceType] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="labName" label="所属实验室" min-width="120">
          <template #default="{ row }">
            {{ getLabName(row.belongToLaboratoryId) }}
          </template>
        </el-table-column>

        <el-table-column prop="address" label="地址/编号" width="120">
          <template #default="{ row }">
            {{ formatAddress(row) }}
          </template>
        </el-table-column>

        <el-table-column prop="gatewayName" label="网关" min-width="120">
          <template #default="{ row }">
            {{ getGatewayName(row) }}
          </template>
        </el-table-column>

        <el-table-column prop="pollingEnabled" label="轮询" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.pollingEnabled"
              size="small"
              @change="(val: any) => handlePollingChange(row, val)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.online ? 'success' : 'info'" size="small">
              {{ row.online ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="!loading && filteredDeviceList.length === 0" description="暂无设备数据" />
    </el-card>

    <!-- 创建设备对话框 -->
    <DeviceForm
      v-model:visible="showCreateDialog"
      :mode="formMode"
      :initial-data="editingDevice"
      :laboratories="laboratories"
      :rs485-gateways="rs485GatewayList"
      :socket-gateways="socketGatewayList"
      @submit="handleFormSubmit"
      @cancel="showCreateDialog = false"
    />

    <!-- 网关管理对话框 -->
    <el-dialog
      v-model="showGatewayDialog"
      title="网关管理"
      width="800px"
      destroy-on-close
    >
      <GatewayManagement
        :laboratories="laboratories"
        :rs485-gateways="rs485GatewayList"
        @refresh="handleRefreshGateways"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import {
  Monitor,
  Plus,
  Setting,
  Search,
  Refresh,
  Cpu,
  Lightning,
  Sunny,
  DataLine,
  Lock,
} from '@element-plus/icons-vue'
import type { Component } from 'vue'
import DeviceForm from './DeviceForm.vue'
import GatewayManagement from './GatewayManagement.vue'
import type {
  DeviceType,
  Device,
  DeviceVo,
  Laboratory,
  Rs485GatewayVo,
  SocketGatewayVo,
  FormMode,
} from '../types/device'
import { DeviceTypeName } from '../types/device'

// ============================================
// Props & Emits
// ============================================
const props = defineProps<{
  /** 设备列表数据 */
  deviceList: DeviceVo[]
  /** 实验室列表 */
  laboratories: Laboratory[]
  /** RS485网关列表 */
  rs485Gateways: Rs485GatewayVo[]
  /** Socket网关列表（可选） */
  socketGateways?: SocketGatewayVo[]
  /** 加载状态 */
  loading?: boolean
  /** 默认设备类型筛选 */
  defaultDeviceType?: DeviceType
}>()

const emit = defineEmits<{
  /** 刷新数据 */
  refresh: []
  /** 创建设备 */
  create: [data: any]
  /** 编辑设备 */
  update: [data: { deviceId: number; deviceName?: string; pollingEnabled?: boolean }]
  /** 删除设备 */
  delete: [deviceId: number]
  /** 切换轮询状态 */
  togglePolling: [deviceId: number, enabled: boolean]
}>()

// ============================================
// 状态
// ============================================
const filterDeviceType = ref<DeviceType | ''>(props.defaultDeviceType || '')
const filterLabId = ref<number | ''>('')
const searchKeyword = ref('')
const showCreateDialog = ref(false)
const showGatewayDialog = ref(false)
const formMode = ref<FormMode>('create')
const editingDevice = ref<Device | null>(null)
// Form ref (used in template ref)
const deviceFormRef = ref<any>(null)
// Mark as used to avoid TS error
deviceFormRef.value

// ============================================
// 计算属性
// ============================================
const rs485GatewayList = computed(() => props.rs485Gateways)
const socketGatewayList = computed(() => props.socketGateways || [])

/** 筛选后的设备列表 */
const filteredDeviceList = computed(() => {
  let list = props.deviceList.map((item) => ({
    ...item.device,
    deviceType: item.device.deviceType as DeviceType,
    online: item.deviceRecord?.data?.origin === 'Redis',
    labName: getLabName(item.device.belongToLaboratoryId),
    gatewayName: getGatewayName(item.device),
    rawDevice: item.device,
    rawRecord: item.deviceRecord,
  }))

  // 按设备类型筛选
  if (filterDeviceType.value) {
    list = list.filter((item) => item.deviceType === filterDeviceType.value)
  }

  // 按实验室筛选
  if (filterLabId.value) {
    list = list.filter((item) => item.belongToLaboratoryId === filterLabId.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter((item) => item.deviceName.toLowerCase().includes(keyword))
  }

  return list
})

// ============================================
// 方法
// ============================================
function getDeviceIcon(type: DeviceType): Component {
  const iconMap: Record<DeviceType, Component> = {
    AirCondition: Cpu,
    CircuitBreak: Lightning,
    Light: Sunny,
    Sensor: DataLine,
    Access: Lock,
  }
  return iconMap[type] || Monitor
}

function getDeviceTypeTag(type: DeviceType): string {
  const tagMap: Record<DeviceType, string> = {
    AirCondition: 'primary',
    CircuitBreak: 'warning',
    Light: 'success',
    Sensor: 'info',
    Access: 'danger',
  }
  return tagMap[type] || ''
}

function getLabName(labId: number): string {
  const lab = props.laboratories.find((l) => l.id === labId)
  return lab?.laboratoryName || lab?.laboratoryId || `实验室${labId}`
}

function getGatewayName(device: Device): string {
  if ('rs485GatewayId' in device && device.rs485GatewayId) {
    const gateway = props.rs485Gateways.find((g) => g.gatewayId === device.rs485GatewayId)
    return gateway?.gatewayName || `RS485-${device.rs485GatewayId}`
  }
  if ('socketGatewayId' in device && device.socketGatewayId) {
    const gateway = socketGatewayList.value.find((g) => g.gatewayId === device.socketGatewayId)
    return gateway?.gatewayName || `Socket-${device.socketGatewayId}`
  }
  return '-'
}

function formatAddress(device: Device & { address?: number; selfId?: number }): string {
  const parts: string[] = []
  if ('address' in device && device.address !== undefined) {
    parts.push(String(device.address))
  }
  if ('selfId' in device && device.selfId !== undefined) {
    parts.push(String(device.selfId))
  }
  return parts.join('/') || '-'
}

function handleTypeChange(val: DeviceType | '') {
  filterDeviceType.value = val
}

function handleRefresh() {
  emit('refresh')
}

function handleRefreshGateways() {
  emit('refresh')
}

function handleCreate() {
  formMode.value = 'create'
  editingDevice.value = null
  showCreateDialog.value = true
}

function handleEdit(row: any) {
  formMode.value = 'edit'
  editingDevice.value = row.rawDevice
  showCreateDialog.value = true
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除设备 "${row.deviceName}" 吗？删除后不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    emit('delete', row.id)
  } catch {
    // 用户取消
  }
}

function handlePollingChange(row: any, val: any) {
  emit('togglePolling', row.id, Boolean(val))
}

function handleFormSubmit(data: any) {
  if (formMode.value === 'create') {
    emit('create', data)
  } else {
    emit('update', data)
  }
  showCreateDialog.value = false
}
</script>

<style scoped>
.device-management {
  padding: 20px;
}

.device-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
}

.header-left .el-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.filter-bar {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.device-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-icon {
  color: var(--el-color-primary);
}
</style>
