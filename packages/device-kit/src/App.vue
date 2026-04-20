<template>
  <div class="app">
    <header class="app-header">
      <h1>🔧 设备管理</h1>
    </header>

    <main class="app-main">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="left-actions">
          <el-button type="primary" :icon="Plus" @click="handleAdd">添加</el-button>
          <el-button :icon="Edit" @click="handleBatchEdit" :disabled="!selectedRows.length">修改</el-button>
          <el-button :icon="Delete" @click="handleBatchDelete" :disabled="!selectedRows.length">删除</el-button>
          <el-input v-model="searchKeyword" placeholder="请输入关键字" clearable style="width: 200px; margin-left: 12px">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="right-info">
          <span class="total-badge">共 {{ filteredList.length }} 台</span>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table
        :data="paginatedList"
        stripe
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="unit" label="单位" min-width="160" show-overflow-tooltip />
        <el-table-column prop="building" label="楼栋" width="80" align="center" />
        <el-table-column prop="labCode" label="实验室编号" width="100" align="center" />
        <el-table-column prop="deviceType" label="设备类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getDeviceTypeType(row.deviceType)" size="small">
              {{ getDeviceTypeName(row.deviceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceName" label="设备名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="sendTopic" label="发送主题" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.sendTopic" class="topic-text">{{ row.sendTopic }}</span>
            <span v-else class="dash">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="acceptTopic" label="接收主题" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.acceptTopic" class="topic-text">{{ row.acceptTopic }}</span>
            <span v-else class="dash">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="设备地址" width="90" align="center">
          <template #default="{ row }">
            <span v-if="row.address !== undefined && row.address !== null">{{ row.address }}</span>
            <span v-else class="dash">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="selfId" label="设备编码" width="90" align="center">
          <template #default="{ row }">
            <span v-if="row.selfId !== undefined && row.selfId !== null">{{ row.selfId }}</span>
            <span v-else class="dash">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <span class="total-text">共{{ filteredList.length }}条</span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          :total="filteredList.length"
          background
          small
        />
      </div>
    </main>

    <!-- 添加类型选择对话框 -->
    <el-dialog
      title="选择添加类型"
      v-model="typeSelectVisible"
      width="400px"
      :close-on-click-modal="false"
      center
    >
      <div class="type-selector">
        <div
          class="type-option"
          :class="{ active: selectedAddType === 'device' }"
          @click="selectedAddType = 'device'"
        >
          <el-icon class="type-icon"><Cpu /></el-icon>
          <div class="type-name">添加设备</div>
          <div class="type-desc">空调、断路器、照明等设备</div>
        </div>
        <div
          class="type-option"
          :class="{ active: selectedAddType === 'gateway' }"
          @click="selectedAddType = 'gateway'"
        >
          <el-icon class="type-icon"><Connection /></el-icon>
          <div class="type-name">添加网关</div>
          <div class="type-desc">RS485、Socket 网关</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="typeSelectVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddType">确定</el-button>
      </template>
    </el-dialog>

    <!-- 设备表单 -->
    <DeviceForm
      v-model:visible="deviceFormVisible"
      :mode="formMode"
      :initial-data="currentDevice"
      :laboratories="laboratories"
      :rs485-gateways="rs485Gateways"
      :socket-gateways="socketGateways"
      @submit="handleDeviceSubmit"
    />

    <!-- 网关表单 -->
    <GatewayForm
      v-model:visible="gatewayFormVisible"
      :mode="formMode"
      :initial-data="currentGateway"
      :laboratories="laboratories"
      @submit="handleGatewaySubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Cpu, Connection } from '@element-plus/icons-vue'
import DeviceForm from './components/DeviceForm.vue'
import GatewayForm from './components/GatewayForm.vue'

// ============================================
// 类型定义
// ============================================
interface DeviceItem {
  id: number
  deviceType: 'Gateway' | 'AirCondition' | 'CircuitBreak' | 'Light' | 'Access' | 'Sensor'
  deviceName: string
  unit: string
  building: string
  labCode: string
  laboratoryId: number
  sendTopic?: string
  acceptTopic?: string
  address?: number
  selfId?: number
  rs485GatewayId?: number
  socketGatewayId?: number
  createTime: string
  updateTime: string
}

interface Laboratory {
  id: number
  laboratoryName: string
  laboratoryId: string
  unit?: string
  building?: string
}

// ============================================
// 模拟数据
// ============================================
const laboratories = ref<Laboratory[]>([
  { id: 1, laboratoryName: '空调控制实验室', laboratoryId: '16-208', unit: '计算机基础实验教学中心', building: '16栋' },
  { id: 2, laboratoryName: '电气监控实验室', laboratoryId: '16-205', unit: '计算机基础实验教学中心', building: '16栋' },
  { id: 3, laboratoryName: '照明控制实验室', laboratoryId: '16-206', unit: '计算机基础实验教学中心', building: '16栋' },
  { id: 4, laboratoryName: '门禁管理实验室', laboratoryId: '16-207', unit: '计算机基础实验教学中心', building: '16栋' },
])

const deviceList = ref<DeviceItem[]>([
  // 网关
  {
    id: 101,
    deviceType: 'Gateway',
    deviceName: '4G网关1',
    unit: '计算机基础实验教学中心',
    building: '16栋',
    labCode: '16-208',
    laboratoryId: 1,
    sendTopic: 'aircon/send1',
    acceptTopic: 'aircon/receive1',
    address: undefined,
    selfId: undefined,
    createTime: '2026-04-01T10:00:00',
    updateTime: '2026-04-01T10:00:00',
  },
  {
    id: 102,
    deviceType: 'Gateway',
    deviceName: 'RS485-电气网关',
    unit: '计算机基础实验教学中心',
    building: '16栋',
    labCode: '16-205',
    laboratoryId: 2,
    sendTopic: 'lab/cb/send',
    acceptTopic: 'lab/cb/accept',
    address: undefined,
    selfId: undefined,
    createTime: '2026-04-01T10:00:00',
    updateTime: '2026-04-01T10:00:00',
  },
  // 设备
  {
    id: 1001,
    deviceType: 'AirCondition',
    deviceName: '16-208-1',
    unit: '计算机基础实验教学中心',
    building: '16栋',
    labCode: '16-208',
    laboratoryId: 1,
    sendTopic: undefined,
    acceptTopic: undefined,
    address: 52,
    selfId: 1,
    rs485GatewayId: 101,
    createTime: '2026-04-01T10:00:00',
    updateTime: '2026-04-01T10:00:00',
  },
  {
    id: 1002,
    deviceType: 'AirCondition',
    deviceName: '16-208-2',
    unit: '计算机基础实验教学中心',
    building: '16栋',
    labCode: '16-208',
    laboratoryId: 1,
    sendTopic: undefined,
    acceptTopic: undefined,
    address: 53,
    selfId: 1,
    rs485GatewayId: 101,
    createTime: '2026-04-01T10:00:00',
    updateTime: '2026-04-01T10:00:00',
  },
  {
    id: 2001,
    deviceType: 'CircuitBreak',
    deviceName: '总闸-1号',
    unit: '计算机基础实验教学中心',
    building: '16栋',
    labCode: '16-205',
    laboratoryId: 2,
    sendTopic: undefined,
    acceptTopic: undefined,
    address: 11,
    rs485GatewayId: 102,
    createTime: '2026-04-01T10:00:00',
    updateTime: '2026-04-01T10:00:00',
  },
])

// 为 DeviceForm 准备的网关数据
const rs485Gateways = computed(() =>
  deviceList.value
    .filter((d) => d.deviceType === 'Gateway')
    .map((g) => ({
      gatewayId: g.id,
      laboratoryId: g.laboratoryId,
      gatewayName: g.deviceName,
      acceptTopic: g.acceptTopic || '',
      sendTopic: g.sendTopic || '',
    })),
)

const socketGateways = ref<any[]>([])

// ============================================
// 状态
// ============================================
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedRows = ref<DeviceItem[]>([])

// 添加类型选择
const typeSelectVisible = ref(false)
const selectedAddType = ref<'device' | 'gateway'>('device')

// 表单
const deviceFormVisible = ref(false)
const gatewayFormVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const currentDevice = ref<any>(null)
const currentGateway = ref<any>(null)

// ============================================
// 计算属性
// ============================================
const filteredList = computed(() => {
  let result = [...deviceList.value]

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      (d) =>
        d.deviceName.toLowerCase().includes(keyword) ||
        d.unit.toLowerCase().includes(keyword) ||
        d.labCode.toLowerCase().includes(keyword) ||
        d.deviceType.toLowerCase().includes(keyword),
    )
  }

  return result
})

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredList.value.slice(start, end)
})

// ============================================
// 方法
// ============================================
function getDeviceTypeName(type: string): string {
  const map: Record<string, string> = {
    Gateway: '网关',
    AirCondition: '空调',
    CircuitBreak: '断路器',
    Light: '照明',
    Access: '门禁',
    Sensor: '传感器',
  }
  return map[type] || type
}

function getDeviceTypeType(type: string): string {
  const map: Record<string, string> = {
    Gateway: 'danger',
    AirCondition: 'success',
    CircuitBreak: 'warning',
    Light: '',
    Access: 'info',
    Sensor: 'primary',
  }
  return map[type] || ''
}

function formatDateTime(time: string): string {
  if (!time) return '—'
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function handleSelectionChange(rows: DeviceItem[]) {
  selectedRows.value = rows
}

// 添加操作
function handleAdd() {
  selectedAddType.value = 'device'
  typeSelectVisible.value = true
}

function confirmAddType() {
  typeSelectVisible.value = false
  formMode.value = 'create'
  currentDevice.value = null
  currentGateway.value = null

  if (selectedAddType.value === 'device') {
    deviceFormVisible.value = true
  } else {
    gatewayFormVisible.value = true
  }
}

// 编辑操作
function handleEdit(row: DeviceItem) {
  formMode.value = 'edit'

  if (row.deviceType === 'Gateway') {
    currentGateway.value = {
      gatewayId: row.id,
      gatewayName: row.deviceName,
      laboratoryId: row.laboratoryId,
      sendTopic: row.sendTopic,
      acceptTopic: row.acceptTopic,
    }
    gatewayFormVisible.value = true
  } else {
    currentDevice.value = {
      deviceId: row.id,
      deviceName: row.deviceName,
      deviceType: row.deviceType,
      address: row.address,
      selfId: row.selfId,
      rs485GatewayId: row.rs485GatewayId,
      socketGatewayId: row.socketGatewayId,
      belongToLaboratoryId: row.laboratoryId,
      pollingEnabled: true,
    }
    deviceFormVisible.value = true
  }
}

// 删除操作
function handleDelete(row: DeviceItem) {
  ElMessageBox.confirm(`确定要删除 "${row.deviceName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const index = deviceList.value.findIndex((d) => d.id === row.id)
      if (index > -1) {
        deviceList.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {})
}

// 批量操作
function handleBatchEdit() {
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条记录进行修改')
    return
  }
  handleEdit(selectedRows.value[0])
}

function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条记录')
    return
  }
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const ids = selectedRows.value.map((r) => r.id)
      deviceList.value = deviceList.value.filter((d) => !ids.includes(d.id))
      selectedRows.value = []
      ElMessage.success('批量删除成功')
    })
    .catch(() => {})
}

// 表单提交
function handleDeviceSubmit(data: any) {
  const lab = laboratories.value.find((l) => l.id === data.belongToLaboratoryId)

  if (formMode.value === 'create') {
    const newId = Math.max(0, ...deviceList.value.map((d) => d.id)) + 1
    deviceList.value.push({
      id: newId,
      deviceType: data.deviceType,
      deviceName: data.deviceName,
      unit: lab?.unit || '',
      building: lab?.building || '',
      labCode: lab?.laboratoryId || '',
      laboratoryId: data.belongToLaboratoryId,
      sendTopic: undefined,
      acceptTopic: undefined,
      address: data.address,
      selfId: data.selfId,
      rs485GatewayId: data.rs485GatewayId,
      socketGatewayId: data.socketGatewayId,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    })
    ElMessage.success('创建设备成功')
  } else {
    const index = deviceList.value.findIndex((d) => d.id === data.deviceId)
    if (index > -1) {
      Object.assign(deviceList.value[index], {
        deviceName: data.deviceName,
        deviceType: data.deviceType,
        laboratoryId: data.belongToLaboratoryId,
        unit: lab?.unit || '',
        building: lab?.building || '',
        labCode: lab?.laboratoryId || '',
        address: data.address,
        selfId: data.selfId,
        rs485GatewayId: data.rs485GatewayId,
        socketGatewayId: data.socketGatewayId,
        updateTime: new Date().toISOString(),
      })
      ElMessage.success('更新设备成功')
    }
  }
  deviceFormVisible.value = false
}

function handleGatewaySubmit(data: any) {
  const lab = laboratories.value.find((l) => l.id === data.laboratoryId)

  if (formMode.value === 'create') {
    const newId = Math.max(0, ...deviceList.value.map((d) => d.id)) + 1
    deviceList.value.push({
      id: newId,
      deviceType: 'Gateway',
      deviceName: data.gatewayName,
      unit: lab?.unit || '',
      building: lab?.building || '',
      labCode: lab?.laboratoryId || '',
      laboratoryId: data.laboratoryId,
      sendTopic: data.sendTopic,
      acceptTopic: data.acceptTopic,
      address: undefined,
      selfId: undefined,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    })
    ElMessage.success('创建网关成功')
  } else {
    const index = deviceList.value.findIndex((d) => d.id === data.gatewayId)
    if (index > -1) {
      Object.assign(deviceList.value[index], {
        deviceName: data.gatewayName,
        laboratoryId: data.laboratoryId,
        unit: lab?.unit || '',
        building: lab?.building || '',
        labCode: lab?.laboratoryId || '',
        sendTopic: data.sendTopic,
        acceptTopic: data.acceptTopic,
        updateTime: new Date().toISOString(),
      })
      ElMessage.success('更新网关成功')
    }
  }
  gatewayFormVisible.value = false
}

onMounted(() => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.app-header {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  padding: 16px 24px;
}

.app-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.app-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  /* padding: 12px 16px; */
  background: white;
  border-radius: 4px;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-badge {
  background: #f0f9ff;
  color: #409eff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.topic-text {
  color: #409eff;
  font-family: monospace;
  font-size: 13px;
}

.dash {
  color: #c0c4cc;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 16px;
  gap: 16px;
  background: white;
  padding: 12px 16px;
  border-radius: 4px;
}

.total-text {
  color: #606266;
  font-size: 13px;
}

/* 类型选择器样式 */
.type-selector {
  display: flex;
  gap: 16px;
  padding: 20px 0;
}

.type-option {
  flex: 1;
  padding: 24px 16px;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.type-option:hover {
  border-color: #409eff;
}

.type-option.active {
  border-color: #409eff;
  background: #f0f9ff;
}

.type-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 12px;
}

.type-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.type-desc {
  font-size: 12px;
  color: #909399;
}
</style>
