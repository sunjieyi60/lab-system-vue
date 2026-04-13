<template>
  <div class="ac-control-page">
    <div class="main-content">
      <!-- 顶部工具栏 -->
      <div class="toolbar-row">
        <div class="left-actions">
          <el-button :loading="isLoading" @click="handleRefresh">手动刷新</el-button>
          <el-button :loading="isLoading" @click="handleRemoteControl">远程控制</el-button>
          <el-button :loading="isLoading" @click="handleLockSetting">锁定设置</el-button>
        </div>

        <div class="right-actions">
          <el-input
            v-model="searchKey"
            placeholder="请输入关键字"
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template #suffix>
              <img
                src="/images/搜索.png"
                style="width: 16px; height: 16px; cursor: pointer"
                @click="handleSearch"
              />
            </template>
          </el-input>
          <div class="statistics">
            <span class="stat-item">
              <span class="stat-dot black"></span>
              共 {{ tableData.length }} 台
            </span>
            <span class="stat-item">
              <span class="stat-dot green"></span>
              开 {{ openCount }} 台
            </span>
          </div>
        </div>
      </div>

      <!-- 表格 -->
      <div class="table-box">
        <el-table
          ref="tableRef"
          :data="tableData"
          stripe
          style="width: 100%"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '500',
            height: '48px',
          }"
          :row-style="{ height: '48px' }"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="deptName" label="单位" align="center" min-width="140">
            <template #default="{ row }">
              {{ getDeptName(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column prop="buildingName" label="楼栋" align="center" min-width="100">
            <template #default="{ row }">
              {{ getBuildingName(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column prop="labNo" label="实验室编号" align="center" min-width="120">
            <template #default="{ row }">
              {{ getLabNo(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column prop="airCond" label="空调内机" align="center" min-width="120" />
          <el-table-column prop="switch" label="开关" align="center" min-width="80">
            <template #default="{ row }">
              <el-tag
                :type="row.isOpen ? 'success' : 'danger'"
                size="large"
              >
                {{ row.isOpen ? '开' : '关' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="mode" label="模式" align="center" min-width="80" />
          <el-table-column prop="temp" label="温度" align="center" min-width="80" />
          <el-table-column prop="windSpeed" label="风速" align="center" min-width="80" />
          <el-table-column prop="roomTemp" label="室温" align="center" min-width="80" />
          <el-table-column prop="fault" label="故障" align="center" min-width="80">
            <template #default="{ row }">
              <span :style="{ color: row.fault !== '无' ? '#f56c6c' : '#67c23a' }">
                {{ row.fault }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="机组" align="center" min-width="80" />
          <el-table-column prop="online" label="在线" align="center" min-width="80">
            <template #default="{ row }">
              <el-tag
                :type="row.online ? 'success' : 'danger'"
                size="large"
              >
                {{ row.online ? "在线" : "离线" }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <span class="total-text">共{{ tableData.length }}条</span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>

  <!-- 远程控制弹窗 - 使用 AirConditionControl 组件 -->
  <el-dialog
    v-model="showRemote"
    :title="currentSelectedRows.length > 1 ? `批量控制 (${currentSelectedRows.length}台设备)` : '空调远程控制'"
    width="560px"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="onRemoteDialogClosed"
  >
    <div v-if="currentSelectedRows.length === 0" class="dialog-empty">
      未选择设备
    </div>
    
    <!-- 批量控制模式 -->
    <div v-else-if="currentSelectedRows.length > 1" class="dialog-content">
      <!-- 控制模式切换 -->
      <div class="control-mode-switch">
        <el-radio-group v-model="controlMode" size="large">
          <el-radio-button label="simple">简单控制</el-radio-button>
          <el-radio-button label="enhanced">增强控制</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 批量控制 -->
      <AirConditionControl
        :device="selectedAirConditionDevices"
        v-bind="controlMode === 'simple' ? simpleControlConfig : enhancedControlConfig"
        @execute="handleBatchControlExecute"
      />

      <!-- 批量控制设备列表预览 -->
      <div class="batch-device-list">
        <div class="batch-device-list-title">
          <span>待控制设备列表 ({{ currentSelectedRows.length }})</span>
          <el-button type="primary" link size="small" @click="toggleDeviceList">
            {{ showDeviceList ? '收起' : '展开' }}
          </el-button>
        </div>
        <el-collapse-transition>
          <div v-show="showDeviceList" class="batch-device-list-content">
            <el-tag 
              v-for="(row, index) in currentSelectedRows" 
              :key="row.id"
              size="small"
              class="device-tag"
            >
              {{ index + 1 }}. {{ row.airCond }} - {{ getLabName(row.labId) }}
            </el-tag>
          </div>
        </el-collapse-transition>
      </div>
    </div>

    <!-- 单设备控制模式 -->
    <div v-else class="dialog-content">
      <!-- 控制模式切换 -->
      <div class="control-mode-switch">
        <el-radio-group v-model="controlMode" size="large">
          <el-radio-button label="simple">简单控制</el-radio-button>
          <el-radio-button label="enhanced">增强控制</el-radio-button>
        </el-radio-group>
      </div>
      
      <!-- 设备信息 -->
      <div class="selected-device-info">
        <span class="device-label">当前设备：</span>
        <span class="device-value">{{ currentSelectedRows[0].airCond }}</span>
        <span class="device-location">{{ getLabName(currentSelectedRows[0].labId) }}</span>
      </div>

      <!-- 单设备控制 -->
      <AirConditionControl
        :device="selectedAirConditionDevice"
        v-bind="controlMode === 'simple' ? simpleControlConfig : enhancedControlConfig"
        @execute="handleControlExecute"
      />
    </div>
  </el-dialog>
  
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useUserStore } from "@/stores/modules/user.js";
import { useDeviceStore, DeviceType } from "@/stores/modules/device.js";
import { ElMessage } from "element-plus";
import { controlDevice } from "@/api/device.js";

// 引入 control-kit 组件
import AirConditionControl from "@packages/control-kit/src/components/controls/AirConditionControl.vue";

const userStore = useUserStore();
const deviceStore = useDeviceStore();

const searchKey = ref("");
const tableRef = ref();
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const showRemote = ref(false);

// 远程控制模式
const controlMode = ref('simple'); // 'simple' | 'enhanced'

// 批量控制设备列表展开状态
const showDeviceList = ref(false);

// 保存选中的行数据（用于传给弹窗）
const currentSelectedRows = ref([]);

// 统计：开着的空调数量
const openCount = computed(() => {
  return tableData.value.filter(item => item.isOpen).length;
});

// 计算属性：表格数据（使用字符串拼接搜索）
const tableData = computed(() => {
  let data = deviceStore.getAirConditionTableData;

  // 如果有搜索关键字，按关键字筛选
  if (searchKey.value.trim()) {
    const k = searchKey.value.trim().toLowerCase();
    data = data.filter((item) => {
      // 将关键属性拼接为字符串，使用 "-" 作为分隔符
      const searchStr = [
        getDeptName(item.labId),
        getBuildingName(item.labId),
        getLabNo(item.labId),
        item.airCond,
        item.switch,
        item.mode,
        item.temp,
        item.windSpeed,
        item.roomTemp,
        item.fault,
        item.unit,
        item.online ? '在线' : '离线'
      ].join('-').toLowerCase();
      return searchStr.includes(k);
    });
  }

  return data;
});

// 获取选中的完整行数据（传给远程控制弹窗）
const selectedRows = computed(() => {
  // 如果有手动保存的选中行，优先使用（用于弹窗打开时固定数据）
  if (currentSelectedRows.value.length > 0) {
    return currentSelectedRows.value;
  }

  // 1. 获取表格选中的行（筛选后的数据）
  const tableSelection = tableRef.value?.getSelectionRows?.() || [];
  // 2. 获取 store 原始完整数据
  const rawData = deviceStore.getAirConditionTableData;

  // 3. 通过唯一标识（比如 id）匹配完整数据
  const fullSelectedRows = tableSelection.map((selectRow) => {
    // 这里假设每行数据的唯一标识是 id，你可以换成实际的字段（如 deviceId/labId 等）
    return rawData.find((rawRow) => rawRow.id === selectRow.id) || selectRow;
  });
  return fullSelectedRows;
});

// 获取实验室名称
const getLabName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  return lab?.laboratoryName || lab?.laboratoryId || labId || "-";
};

// 获取单位名称
const getDeptName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  if (!lab) return "-";
  const depts = lab.belongToDepts || [];
  if (depts.length === 0) return "-";
  const dept = deptList.value.find(d => depts.includes(d.id) || depts.includes(String(d.id)));
  return dept?.deptName || "-";
};

// 获取楼栋名称
const getBuildingName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  if (!lab) return "-";
  const building = buildingList.value.find(b => b.id === lab.belongToBuilding || String(b.id) === String(lab.belongToBuilding));
  return building?.buildingName || "-";
};

// 获取实验室编号
const getLabNo = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  return lab?.laboratoryId || lab?.laboratoryName || labId || "-";
};

// 将选中的行数据转换为 AirCondition 类型设备对象（单设备）
const selectedAirConditionDevice = computed(() => {
  if (currentSelectedRows.value.length === 0) return null;
  const row = currentSelectedRows.value[0];
  return {
    id: row.id,
    deviceName: row.airCond || '空调设备',
    deviceType: 'AirCondition',
    belongToLaboratoryId: row.labId,
    pollingEnabled: false,
    address: row.address || row.rawRecord?.address || 1,
    selfId: row.selfId || row.rawRecord?.selfId || 1,
    groupId: row.groupId || row.rawRecord?.groupId || 1,
    rs485GatewayId: row.rs485GatewayId || row.rawRecord?.rs485GatewayId || 1,
    socketGatewayId: row.socketGatewayId || row.rawRecord?.socketGatewayId,
    isLock: row.isLock || row.rawRecord?.isLock || false,
  };
});

// 将选中的行数据转换为 AirCondition 类型设备对象列表（批量）
const selectedAirConditionDevices = computed(() => {
  return currentSelectedRows.value.map(row => ({
    id: row.id,
    deviceName: row.airCond || '空调设备',
    deviceType: 'AirCondition',
    belongToLaboratoryId: row.labId,
    pollingEnabled: false,
    address: row.address || row.rawRecord?.address || 1,
    selfId: row.selfId || row.rawRecord?.selfId || 1,
    groupId: row.groupId || row.rawRecord?.groupId || 1,
    rs485GatewayId: row.rs485GatewayId || row.rawRecord?.rs485GatewayId || 1,
    socketGatewayId: row.socketGatewayId || row.rawRecord?.socketGatewayId,
    isLock: row.isLock || row.rawRecord?.isLock || false,
  }));
});

// 切换设备列表展开状态
const toggleDeviceList = () => {
  showDeviceList.value = !showDeviceList.value;
};

// 弹窗关闭处理
const onRemoteDialogClosed = () => {
  currentSelectedRows.value = [];
  showDeviceList.value = false;
  controlMode.value = 'simple';
};

// 简单控制配置 - 只显示快速开关
const simpleControlConfig = {
  priority: 'NORMAL',
  showLockWarning: false,
  showQuickActions: true,
  showPowerOn: true,
  showPowerOff: true,
  showQueryStatus: false,
  showEnhancedControl: false,
  showDeviceInfo: true,
  showInfoId: true,
  showInfoName: true,
  showInfoAddress: true,
  showInfoSelfId: true,
  showInfoGroupId: false,
  showInfoGateway: true,
  showInfoSocketGateway: false,
  showSectionTitles: true,
  enhancedControlTitle: '增强控制',
  deviceInfoTitle: '设备信息',
  powerOnText: '开机',
  powerOffText: '关机',
  queryStatusText: '查询状态',
  applyButtonText: '应用设置',
  powerSwitchLabel: '开关',
  modeLabel: '模式',
  temperatureLabel: '温度',
  speedLabel: '风速',
  tempMin: 16,
  tempMax: 30,
  tempStep: 1,
};

// 增强控制配置 - 显示完整控制面板
const enhancedControlConfig = {
  priority: 'NORMAL',
  showLockWarning: false,
  showQuickActions: false,
  showPowerOn: true,
  showPowerOff: true,
  showQueryStatus: true,
  showEnhancedControl: true,
  showPowerSwitch: true,
  showMode: true,
  showTemperature: true,
  showSpeed: true,
  showApplyButton: true,
  showDeviceInfo: true,
  showInfoId: true,
  showInfoName: true,
  showInfoAddress: true,
  showInfoSelfId: true,
  showInfoGroupId: false,
  showInfoGateway: true,
  showInfoSocketGateway: false,
  showSectionTitles: true,
  enhancedControlTitle: '增强控制',
  deviceInfoTitle: '设备信息',
  powerOnText: '开机',
  powerOffText: '关机',
  queryStatusText: '查询状态',
  applyButtonText: '应用设置',
  powerSwitchLabel: '开关',
  modeLabel: '模式',
  temperatureLabel: '温度',
  speedLabel: '风速',
  tempMin: 16,
  tempMax: 30,
  tempStep: 1,
};

/**
 * 处理单设备控制命令执行
 * @param {Task[]} tasks - 任务列表
 * @param {Function} callback - 执行结果回调
 */
const handleControlExecute = async (tasks, callback) => {
  console.log('【AirConditionControl】执行控制命令:', tasks);
  
  try {
    // 调用实际 API 发送控制命令，task 原封不动发送
    for (const task of tasks) {
      const res = await controlDevice(task);
      console.log('【控制响应】', res);
    }
    
    ElMessage.success('控制命令已发送');
    
    if (callback) callback(true, '执行成功');
    showRemote.value = false;
    
  } catch (error) {
    console.error('控制命令执行失败:', error);
    ElMessage.error('控制命令执行失败: ' + (error.message || '未知错误'));
    if (callback) callback(false, error.message || '执行失败');
  }
};

/**
 * 处理批量控制命令执行
 * @param {Task[]} tasks - 任务列表
 * @param {Function} callback - 执行结果回调
 */
const handleBatchControlExecute = async (tasks, callback) => {
  console.log('【BatchAirConditionControl】批量执行控制命令:', tasks);
  
  try {
    // 批量调用 API 发送控制命令
    // 使用 Promise.all 并发发送，或者使用 for 循环逐个发送
    // 这里使用 for 循环逐个发送，避免一次性发送过多请求导致服务器压力过大
    for (const task of tasks) {
      const res = await controlDevice(task);
      console.log('【批量控制响应】', res);
    }
    
    ElMessage.success(`批量控制命令已发送（${tasks.length}台设备）`);
    
    if (callback) callback(true, '批量执行成功');
    showRemote.value = false;
    
  } catch (error) {
    console.error('批量控制命令执行失败:', error);
    ElMessage.error('批量控制命令执行失败: ' + (error.message || '未知错误'));
    if (callback) callback(false, error.message || '执行失败');
  }
};

const buildingList = computed(() => userStore.getBuildingList);
const rawDeptData = computed(() => userStore.userInfo.depts || []);
const deptList = computed(() => rawDeptData.value.map((item) => item.dept));
const laboratoryList = computed(() => userStore.getLaboratoryList);

// 表格选择变化处理
const handleSelectionChange = (selection) => {
  // 保持与弹窗使用同一数据源
};

// 加载所有设备数据
const loadAllDeviceData = async () => {
  isLoading.value = true;
  try {
    const allLabIds = laboratoryList.value
      .map((item) => item.id)
      .filter((id) => id);

    if (!allLabIds.length) {
      console.warn("实验室ID为空，取消刷新");
      return;
    }

    await deviceStore.fetchDevicesByType(DeviceType.AIR_CONDITION, allLabIds);
  } finally {
    isLoading.value = false;
  }
};

const handleRemoteControl = () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (selection.length === 0) {
    ElMessage.warning("请至少选择一台设备进行远程控制");
    return;
  }

  // 保存当前选中的行数据
  const rawData = deviceStore.getAirConditionTableData;
  currentSelectedRows.value = selection.map((selectRow) => {
    return rawData.find((rawRow) => rawRow.id === selectRow.id) || selectRow;
  });

  showRemote.value = true;
};

const handleLockSetting = () => {
  ElMessage.warning("锁定设置功能暂未实现");
};

// 手动刷新
const handleRefresh = async () => {
  await loadAllDeviceData();
  ElMessage.success("刷新成功");
};

const handleSearch = () => {
  console.log("【搜索】关键字:", searchKey.value);
};

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val;
};

// 页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val;
};

onMounted(async () => {
  // 先尝试从 localStorage 恢复用户信息
  await userStore.refreshUserInfo();

  // 等待实验室列表加载完成（如果需要）
  // 确保 laboratoryList 有数据
  if (!laboratoryList.value || laboratoryList.value.length === 0) {
    console.log("【警告】实验室列表为空，尝试重新获取...");
    // 如果有刷新实验室列表的方法，这里调用
    // await userStore.refreshLaboratories();
  }

  // 设置当前设备类型为空调
  deviceStore.setDeviceType(DeviceType.AIR_CONDITION);

  // 加载所有实验室的设备数据
  await loadAllDeviceData();

  // ===== console.log 检查数据 =====
  console.log("========== onMounted 数据检查 ==========");
  console.log("【检查】实验室列表:", laboratoryList.value);
  console.log(
    "【检查】实验室ID列表:",
    laboratoryList.value.map((item) => item.id),
  );
  console.log("【检查】当前选中实验室:");
});

// 生命周期 - 卸载时清空数据
onUnmounted(() => {
  deviceStore.clear()
})
</script>

<style scoped>
.ac-control-page {
  padding: 16px;
  background: #f5f7fa;
  overflow-y: auto;
  box-sizing: border-box;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ---------------- 工具栏 ---------------- */
.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 16px 20px;
  border-radius: 4px;
}

.left-actions {
  display: flex;
  gap: 12px;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-input {
  width: 220px;
}

.statistics {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.stat-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
}

.stat-dot.black {
  background-color: #303133;
}

.stat-dot.green {
  background-color: #67c23a;
}

/* ---------------- 表格 ---------------- */
.table-box {
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.el-table--striped .el-table__row--striped td.el-table__cell) {
  background-color: #fafafa;
}

:deep(.el-table th.el-table__cell) {
  background-color: #f5f7fa !important;
}

/* 状态标签样式 */
.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.status-tag.status-open {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.status-tag.status-close {
  background-color: #f4f4f5;
  color: #909399;
  border: 1px solid #e9e9eb;
}

/* 在线状态标签 */
.online-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid;
}

.online-tag.online {
  color: #409eff;
  border-color: #d9ecff;
  background-color: #ecf5ff;
}

.online-tag.offline {
  color: #909399;
  border-color: #e9e9eb;
  background-color: #f4f4f5;
}

/* ---------------- 分页 ---------------- */
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  background: #fff;
  padding: 12px 20px;
  border-radius: 4px;
}

.total-text {
  font-size: 14px;
  color: #606266;
}

:deep(.el-pagination .el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-pagination .el-select .el-input__wrapper) {
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

/* ---------------- 弹窗样式 ---------------- */
.dialog-empty {
  padding: 40px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.dialog-content {
  padding: 0 10px;
}

.control-mode-switch {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.control-mode-switch :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #1890ff;
  border-color: #1890ff;
}

.selected-device-info {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-label {
  font-size: 14px;
  color: #606266;
}

.device-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.device-location {
  font-size: 13px;
  color: #909399;
  margin-left: auto;
}

:deep(.el-dialog__body) {
  padding-top: 10px;
}

/* 批量控制设备列表样式 */
.batch-device-list {
  margin-top: 20px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.batch-device-list-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.batch-device-list-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.device-tag {
  margin: 0;
}
</style>
