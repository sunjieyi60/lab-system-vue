<template>
    <div class="device-manage-page">
        <div class="main-content">
            <!-- 工具栏 -->
            <div class="toolbar">
                <div class="left-actions">
                    <el-button @click="handleAdd">添加</el-button>
                    <el-button @click="handleBatchEdit" :disabled="!selectedRows.length">修改</el-button>
                    <el-button @click="handleBatchDelete" :disabled="!selectedRows.length">删除</el-button>
                </div>
                <div class="right-actions">
                    <el-input 
                    v-model="searchKeyword" 
                    placeholder="请输入关键字" 
                    clearable 
                    class="search-input"
                    >
                    <template #prefix>
                        <el-icon><Search /></el-icon>
                    </template>
                    </el-input>
                    <span class="total-badge"><span class="dot"></span>共 {{ filteredList.length }} 台</span>
                </div>
            </div>

            <!-- 数据表格 -->
            <div class="table-box">
            <el-table
            :data="paginatedList"
            stripe
            style="width: 100%"
            v-loading="deviceStore.loading"
            @selection-change="handleSelectionChange"
            >
                <el-table-column type="selection" width="50" align="center" />
                <el-table-column prop="unit" label="单位" min-width="140" show-overflow-tooltip align="center" />
                <el-table-column prop="building" label="楼栋" width="70" align="center" />
                <el-table-column prop="labCode" label="实验室编号" width="100" show-overflow-tooltip align="center" />
                <el-table-column prop="deviceType" label="设备类型" width="80" show-overflow-tooltip align="center">
                    <template #default="{ row }">
                    <span class="cell-ellipsis">{{ getDeviceTypeName(row.deviceType) }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="deviceName" label="设备名称" min-width="120" show-overflow-tooltip align="center" />
                <el-table-column prop="sendTopic" label="发送主题" min-width="140" show-overflow-tooltip align="center">
                    <template #default="{ row }">
                    <span v-if="row.sendTopic" class="topic-text">{{ row.sendTopic }}</span>
                    <span v-else class="dash">—</span>
                    </template>
                </el-table-column>
                <el-table-column prop="acceptTopic" label="接收主题" min-width="140" show-overflow-tooltip align="center">
                    <template #default="{ row }">
                    <span v-if="row.acceptTopic" class="topic-text">{{ row.acceptTopic }}</span>
                    <span v-else class="dash">—</span>
                    </template>
                </el-table-column>
                <el-table-column prop="address" label="设备地址" width="80" align="center">
                    <template #default="{ row }">
                    <span v-if="row.address !== undefined && row.address !== null" class="cell-ellipsis">{{ row.address }}</span>
                    <span v-else class="dash">—</span>
                    </template>
                </el-table-column>
                <el-table-column prop="selfId" label="设备编码" width="80" align="center">
                    <template #default="{ row }">
                    <span v-if="row.selfId !== undefined && row.selfId !== null" class="cell-ellipsis">{{ row.selfId }}</span>
                    <span v-else class="dash">—</span>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" width="140" align="center">
                    <template #default="{ row }">
                    <span class="cell-ellipsis">{{ formatDateTime(row.createTime) }}</span>
                    </template>
                </el-table-column>
            </el-table>
            </div>

            <!-- 分页 -->
            <div class="pagination-wrapper">
            <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[8]"
                layout="sizes, prev, pager, next, jumper"
                :total="filteredList.length"
            />
            </div>

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
            :laboratories="laboratoriesForForm"
            :rs485-gateways="rs485GatewaysForForm"
            :socket-gateways="socketGatewaysForForm"
            @submit="handleDeviceSubmit"
            @cancel="deviceFormVisible = false"
            />

            <!-- 网关表单 -->
            <GatewayForm
            v-model:visible="gatewayFormVisible"
            :mode="formMode"
            :initial-data="currentGateway"
            :laboratories="laboratoriesForForm"
            @submit="handleGatewaySubmit"
            @cancel="gatewayFormVisible = false"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Cpu, Connection } from '@element-plus/icons-vue'
import { useDeviceStore } from '@/stores/modules/device.js'
import { useBaseStore } from '@/stores/modules/base.js'
import { useUserStore } from '@/stores/modules/user.js'
import { 
  createDevice, 
  deleteDevice as apiDeleteDevice,
  createRS485Gateway,
  updateRS485Gateway,
  deleteRS485Gateway,
  updateDevice as apiUpdateDevice,
} from '@/api/device.js'

// 导入 device-kit 组件
import DeviceForm from '@packages/device-kit/src/components/DeviceForm.vue'
import GatewayForm from '@packages/device-kit/src/components/GatewayForm.vue'

// Stores
const deviceStore = useDeviceStore()
const baseStore = useBaseStore()
const userStore = useUserStore()

// 计算属性 - 部门和楼栋列表
const deptList = computed(() => userStore.getDeptList.map(item => item.dept || item))
const buildingList = computed(() => userStore.getBuildingList)
const laboratoryList = computed(() => userStore.getLaboratoryList)

// 状态
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedRows = ref([])

// 添加类型选择
const typeSelectVisible = ref(false)
const selectedAddType = ref('device')

// 表单
const deviceFormVisible = ref(false)
const gatewayFormVisible = ref(false)
const formMode = ref('create')
const currentDevice = ref(null)
const currentGateway = ref(null)

// 计算属性 - 设备列表（包含网关和设备）
const deviceList = computed(() => {
  const list = []
  const deviceMap = deviceStore.deviceMap
  const gatewayMap = deviceStore.rs485GatewayMap
  
  // 1. 先添加网关数据
  Object.values(gatewayMap).forEach((arr) => {
    arr.forEach((gateway) => {
      const labId = gateway.laboratoryId
      const lab = baseStore.laboratories.find(l => l.id === labId)
      
      // 获取单位和楼栋
      const unit = getDeptName(labId)
      const building = getBuildingName(labId)
      
      list.push({
        id: gateway.gatewayId,
        deviceType: 'Gateway',
        deviceName: gateway.gatewayName,
        unit: unit,
        building: building,
        labCode: lab?.laboratoryId || '',
        laboratoryId: labId,
        sendTopic: gateway.sendTopic || '',
        acceptTopic: gateway.acceptTopic || '',
        address: undefined,
        selfId: undefined,
        createTime: undefined,
        rawDevice: gateway,
      })
    })
  })
  
  // 2. 再添加设备数据
  Object.values(deviceMap).forEach((arr) => {
    arr.forEach((item) => {
      const device = item.device || {}
      const record = item.deviceRecord?.data || {}
      const labId = device.belongToLaboratoryId
      const lab = baseStore.laboratories.find(l => l.id === labId)
      
      // 获取单位和楼栋
      const unit = getDeptName(labId)
      const building = getBuildingName(labId)
      
      list.push({
        id: device.id,
        deviceType: device.deviceType,
        deviceName: device.deviceName,
        unit: unit,
        building: building,
        labCode: lab?.laboratoryId || '',
        laboratoryId: labId,
        sendTopic: '',
        acceptTopic: '',
        address: device.address ?? record.address,
        selfId: device.selfId ?? record.selfId,
        createTime: device.createTime,
        rawDevice: device,
      })
    })
  })
  
  return list
})

// 计算属性 - 筛选后的列表
const filteredList = computed(() => {
  let result = [...deviceList.value]
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(d =>
      d.deviceName?.toLowerCase().includes(keyword) ||
      d.unit?.toLowerCase().includes(keyword) ||
      d.labCode?.toLowerCase().includes(keyword) ||
      getDeviceTypeName(d.deviceType)?.toLowerCase().includes(keyword)
    )
  }
  return result
})

// 计算属性 - 分页后的列表
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredList.value.slice(start, end)
})

// 为表单准备的实验室列表
const laboratoriesForForm = computed(() => {
  return baseStore.laboratories.map(lab => ({
    id: lab.id,
    laboratoryId: lab.laboratoryId,
    laboratoryName: lab.laboratoryName || lab.laboratoryId,
  }))
})

// 为表单准备的 RS485 网关列表
const rs485GatewaysForForm = computed(() => {
  const gateways = []
  Object.values(deviceStore.rs485GatewayMap).forEach((arr) => {
    arr.forEach((g) => {
      gateways.push({
        gatewayId: g.gatewayId,
        laboratoryId: g.laboratoryId,
        gatewayName: g.gatewayName,
        acceptTopic: g.acceptTopic,
        sendTopic: g.sendTopic,
      })
    })
  })
  return gateways
})

const socketGatewaysForForm = computed(() => [])

// 方法 - 获取设备类型名称
function getDeviceTypeName(type) {
  const map = {
    Gateway: '网关',
    AirCondition: '空调',
    CircuitBreak: '断路器',
    Light: '照明',
    Access: '门禁',
    Sensor: '传感器',
  }
  return map[type] || type
}

// 方法 - 获取单位名称（参考 env/index.vue）
function getDeptName(labId) {
  const lab = laboratoryList.value.find((item) => item.id === labId)
  if (!lab) return '-'
  const depts = lab.belongToDepts || []
  if (depts.length === 0) return '-'
  const dept = deptList.value.find(d => depts.includes(d.id) || depts.includes(String(d.id)))
  return dept?.deptName || '-'
}

// 方法 - 获取楼栋名称（参考 env/index.vue）
function getBuildingName(labId) {
  const lab = laboratoryList.value.find((item) => item.id === labId)
  if (!lab) return '-'
  const building = buildingList.value.find(b => b.id === lab.belongToBuilding || String(b.id) === String(lab.belongToBuilding))
  return building?.buildingName || '-'
}

// 方法 - 格式化日期时间
function formatDateTime(time) {
  if (!time) return '—'
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 方法 - 表格选择变更
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 方法 - 添加按钮
function handleAdd() {
  selectedAddType.value = 'device'
  typeSelectVisible.value = true
}

// 方法 - 确认添加类型
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

// 方法 - 编辑
function handleEdit(row) {
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
      belongToLaboratoryId: row.laboratoryId,
      pollingEnabled: row.pollingEnabled,
    }
    deviceFormVisible.value = true
  }
}

// 方法 - 删除
function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除 "${row.deviceName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    if (row.deviceType === 'Gateway') {
      await deleteRS485Gateway(row.id)
      ElMessage.success('删除网关成功')
      await deviceStore.fetchRS485Gateways()
    } else {
      await apiDeleteDevice(row.id)
      ElMessage.success('删除设备成功')
      const laboratoryIds = baseStore.laboratories.map(lab => lab.id).filter(id => id)
      await deviceStore.fetchDevicesByLabIds(laboratoryIds)
    }
  }).catch(() => {})
}

// 方法 - 批量编辑
function handleBatchEdit() {
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条记录进行修改')
    return
  }
  handleEdit(selectedRows.value[0])
}

// 方法 - 批量删除
function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条记录')
    return
  }
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    const gatewayIds = selectedRows.value.filter(r => r.deviceType === 'Gateway').map(r => r.id)
    const deviceIds = selectedRows.value.filter(r => r.deviceType !== 'Gateway').map(r => r.id)
    
    for (const id of gatewayIds) {
      await deleteRS485Gateway(id)
    }
    for (const id of deviceIds) {
      await apiDeleteDevice(id)
    }
    
    selectedRows.value = []
    ElMessage.success('批量删除成功')
    
    const laboratoryIds = baseStore.laboratories.map(lab => lab.id).filter(id => id)
    await Promise.all([
      deviceStore.fetchDevicesByLabIds(laboratoryIds),
      deviceStore.fetchRS485Gateways(),
    ])
  }).catch(() => {})
}

// 方法 - 设备表单提交
async function handleDeviceSubmit(data) {
  console.log('data',data)
  try {
    if (formMode.value === 'create') {
      const createData = {
        deviceType: data.deviceType,
        deviceName: data.deviceName,
        belongToLaboratoryId: data.belongToLaboratoryId,
        address: data.address,
        rs485GatewayId: data.rs485GatewayId,
      }
      if (data.groupId) {
        createData.groupId = data.groupId
      }
      if (data.deviceType !== 'CircuitBreak' && data.selfId !== undefined) {
        createData.selfId = data.selfId
      }
      if (data.deviceType === 'AirCondition' && data.socketGatewayId) {
        createData.socketGatewayId = data.socketGatewayId
      }
      await createDevice(createData)
      ElMessage.success('创建设备成功')
    } else {
      const updateData = { deviceId: data.deviceId }
      if (data.deviceName) {
        updateData.deviceName = data.deviceName
      }
      if (data.pollingEnabled !== undefined) {
        updateData.pollingEnabled = data.pollingEnabled
      }
      await apiUpdateDevice(updateData)
      ElMessage.success('更新设备成功')
    }
    deviceFormVisible.value = false
    const laboratoryIds = baseStore.laboratories.map(lab => lab.id).filter(id => id)
    await deviceStore.fetchDevicesByLabIds(laboratoryIds)
  } catch (error) {
    console.error('保存设备失败:', error)
    ElMessage.error('保存设备失败')
  }
}

// 方法 - 网关表单提交
async function handleGatewaySubmit(data) {
  try {
    if (formMode.value === 'create') {
      await createRS485Gateway({
        gatewayName: data.gatewayName,
        sendTopic: data.sendTopic,
        acceptTopic: data.acceptTopic,
        belongToLaboratoryId: data.laboratoryId,
      })
      ElMessage.success('创建网关成功')
    } else {
      await updateRS485Gateway({
        gatewayId: data.gatewayId,
        gatewayName: data.gatewayName,
        sendTopic: data.sendTopic,
        acceptTopic: data.acceptTopic,
        belongToLaboratoryId: data.laboratoryId,
      })
      ElMessage.success('更新网关成功')
    }
    gatewayFormVisible.value = false
    await deviceStore.fetchRS485Gateways()
  } catch (error) {
    console.error('保存网关失败:', error)
    ElMessage.error('保存网关失败')
  }
}

// 生命周期 - 挂载时加载数据
onMounted(async () => {
  // 确保实验室列表已加载
  if (baseStore.laboratories.length === 0) {
    await baseStore.refreshLaboratories()
  }
  
  // 从 baseStore 获取实验室ID列表
  const labIds = baseStore.laboratories.map(lab => lab.id).filter(id => id)
  
  // 获取设备数据
  await Promise.all([
    deviceStore.fetchDevicesByLabIds(labIds),
    deviceStore.fetchRS485Gateways(),
  ])
})

// 生命周期 - 卸载时清空数据
onUnmounted(() => {
  deviceStore.clear()
  deviceStore.clearRS485Gateways()
})
</script>

<style scoped>
.device-manage-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background: #fff;
  box-sizing: border-box;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* padding: 16px 20px; */
  border-radius: 4px;
  background: #fff;
  flex-shrink: 0;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.left-actions .el-button {
  background-color: #f5f5f5;
  border-color: #d9d9d9;
  color: #333;
}

.left-actions .el-button:hover {
  background-color: #e8e8e8;
  border-color: #c0c0c0;
  color: #333;
}

.left-actions .el-button:disabled {
  background-color: #f5f5f5;
  border-color: #d9d9d9;
  color: #999;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 200px;
  margin-left: 12px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 4px;
}

.total-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #333;
}

.total-badge .dot {
  width: 10px;
  height: 10px;
  background-color: #333;
  border-radius: 2px;
}

.topic-text {
  color: #666;
  font-family: monospace;
  font-size: 13px;
}

.dash {
  color: #999;
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #fff;
  padding: 12px 20px;
  border-radius: 4px;
  flex-shrink: 0;
}

:deep(.el-table) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

:deep(.el-pagination .el-select .el-input) {
  width: 80px;
}

:deep(.el-pagination .el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-pagination button) {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin: 0 4px;
}

:deep(.el-pagination .el-pager li) {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin: 0 4px;
  font-weight: normal;
}

:deep(.el-pagination .el-pager li.active) {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

/* 斑马纹和表头样式 */
:deep(.el-table--striped .el-table__row--striped td.el-table__cell) {
  background-color: #fafafa;
}

:deep(.el-table th.el-table__cell) {
  background-color: #f5f7fa !important;
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
@media (max-width: 768px) {
  .device-manage-page {
    padding: 8px;
    height: auto;
  }
  .main-content {
    gap: 8px;
  }
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 0;
    gap: 8px;
    background: transparent;
  }
  .left-actions {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 8px;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }
  .left-actions :deep(.el-button) {
    flex-shrink: 0;
  }
  .right-actions {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
    width: 100%;
  }
  .search-input {
    flex: 1;
    width: auto !important;
    min-width: 0;
    margin-left: 0;
    margin-top: 0;
  }
  .table-box {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    min-height: 60vh;
  }
  .pagination-wrapper {
    padding: 8px;
    gap: 8px;
  }
}
</style>
