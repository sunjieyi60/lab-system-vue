<!-- 门禁管理 -->
<template>
  <div class="door-control-page">
    <div class="main-content">
      <!-- 顶部操作栏 -->
      <div class="toolbar-row">
        <div class="left-actions">
          <el-button :loading="isLoading" @click="handleRefresh"
            >手动刷新</el-button
          >
          <el-button :loading="isLoading" @click="handleRemoteControl"
            >远程控制</el-button
          >
          <el-button :loading="isLoading" @click="handleDelaySetting"
            >延时设置</el-button
          >
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
              共 {{ tableData.length }} 扇
            </span>
            <span class="stat-item">
              <span class="stat-dot green"></span>
              开 {{ openCount }} 扇
            </span>
          </div>
        </div>
      </div>

      <!-- 表格盒子 -->
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
          <el-table-column prop="deviceName" label="房门" align="center" min-width="100" />
          <el-table-column prop="doorStatus" label="房门状态" align="center" min-width="100">
            <template #default="{ row }">
              <span
                class="status-tag"
                :class="row.doorStatus === '开' ? 'status-open' : 'status-close'"
              >
                {{ row.doorStatus }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="lockStatus" label="门锁状态" align="center" min-width="120">
            <template #default="{ row }">
              {{ row.lockStatus }}{{ row.isLock ? '（锁定）' : '（未锁定）' }}
            </template>
          </el-table-column>
          <el-table-column prop="delayTime" label="延时时间" align="center" min-width="100">
            <template #default="{ row }">
              {{ row.delayTime }}s
            </template>
          </el-table-column>
          <el-table-column prop="online" label="在线" align="center" min-width="80">
            <template #default="{ row }">
              <span class="online-tag" :class="row.online ? 'online' : 'offline'">
                {{ row.online ? "在线" : "离线" }}
              </span>
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

  <!-- 远程控制弹窗 - 使用 AccessControl 组件 -->
  <el-dialog
    v-model="showRemote"
    title="远程控制"
    width="480px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-if="selectedRows.length === 0" class="dialog-empty">
      请先选择设备
    </div>
    <div v-else-if="selectedRows.length === 1" class="dialog-content">
      <div class="selected-device-info">
        <span class="device-label">当前设备：</span>
        <span class="device-value">{{ selectedRows[0].deviceName }}</span>
      </div>
      <AccessControl
        :device="selectedAccessDevice"
        v-bind="remoteControlConfig"
        @execute="handleControlExecute"
      />
    </div>
    <div v-else class="dialog-content">
      <div class="batch-notice">
        <el-alert
          title="批量控制"
          :description="`已选择 ${selectedRows.length} 个设备，将同时执行控制命令`"
          type="info"
          :closable="false"
          show-icon
        />
      </div>
      <AccessControl
        :device="selectedAccessDevice"
        v-bind="remoteControlConfig"
        @execute="handleBatchControlExecute"
      />
    </div>
  </el-dialog>

  <!-- 延时设置弹窗 - 使用 AccessControl 组件 -->
  <el-dialog
    v-model="showLock"
    title="延时设置"
    width="480px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-if="selectedRows.length === 0" class="dialog-empty">
      请先选择设备
    </div>
    <div v-else-if="selectedRows.length === 1" class="dialog-content">
      <div class="selected-device-info">
        <span class="device-label">当前设备：</span>
        <span class="device-value">{{ selectedRows[0].deviceName }}</span>
      </div>
      <AccessControl
        :device="selectedAccessDevice"
        v-bind="delaySettingConfig"
        @execute="handleControlExecute"
      />
    </div>
    <div v-else class="dialog-content">
      <div class="batch-notice">
        <el-alert
          title="批量设置"
          :description="`已选择 ${selectedRows.length} 个设备，将同时应用延时设置`"
          type="info"
          :closable="false"
          show-icon
        />
      </div>
      <AccessControl
        :device="selectedAccessDevice"
        v-bind="delaySettingConfig"
        @execute="handleBatchControlExecute"
      />
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/user.js";
import { useDeviceStore, DeviceType } from "@/stores/device.js";
import { controlDevice } from "@/api/device.js";

// 引入 control-kit 组件
import AccessControl from "@packages/control-kit/src/components/controls/AccessControl.vue";

const userStore = useUserStore();
const deviceStore = useDeviceStore();

const searchKey = ref("");
const tableRef = ref();
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 选中的行数据
const selectedRows = ref([]);

// 弹窗显示状态
const showRemote = ref(false);
const showLock = ref(false);

// 统计：开着的门数量
const openCount = computed(() => {
  return tableData.value.filter(item => item.doorStatus === '开').length;
});

// ==================== AccessControl 组件配置 ====================

// 远程控制配置 - 显示所有控制功能
const remoteControlConfig = {
  priority: 'NORMAL',
  showLockWarning: true,
  showSingleControl: true,
  showOpenButton: true,
  showCloseButton: true,
  showQueryStatus: true,
  showPersistControl: true,
  showStateSelector: true,
  showLockSelector: true,
  showDelayControl: false, // 远程控制弹窗不显示延时设置
  delayMin: 0,
  delayMax: 60,
  delayStep: 1,
  delayUnit: 's',
  showDeviceInfo: true,
  showInfoId: true,
  showInfoName: true,
  showInfoAddress: true,
  showInfoGateway: true,
  showSectionTitles: true,
  singleControlTitle: '单次控制',
  persistControlTitle: '持续状态设置',
  delayControlTitle: '延时设置',
  deviceInfoTitle: '设备信息',
  largeButtons: true,
  showApplyButton: true,
  openButtonText: '开门',
  closeButtonText: '关门',
  queryStatusText: '查询状态',
  persistApplyButtonText: '应用设置',
  setDelayButtonText: '设置延时',
  openIcon: '🚪',
  closeIcon: '🔒',
  stateLabel: '门状态',
  lockLabel: '锁定状态',
};

// 延时设置配置 - 只显示延时相关功能
const delaySettingConfig = {
  priority: 'NORMAL',
  showLockWarning: true,
  showSingleControl: false, // 延时设置不显示单次控制
  showOpenButton: false,
  showCloseButton: false,
  showQueryStatus: false,
  showPersistControl: false, // 延时设置不显示持续状态
  showStateSelector: false,
  showLockSelector: false,
  showDelayControl: true, // 只显示延时控制
  delayMin: 0,
  delayMax: 60,
  delayStep: 1,
  delayUnit: 's',
  showDeviceInfo: true,
  showInfoId: true,
  showInfoName: true,
  showInfoAddress: true,
  showInfoGateway: true,
  showSectionTitles: true,
  singleControlTitle: '单次控制',
  persistControlTitle: '持续状态设置',
  delayControlTitle: '延时设置',
  deviceInfoTitle: '设备信息',
  largeButtons: true,
  showApplyButton: true,
  openButtonText: '开门',
  closeButtonText: '关门',
  queryStatusText: '查询状态',
  persistApplyButtonText: '应用设置',
  setDelayButtonText: '设置延时',
  openIcon: '🚪',
  closeIcon: '🔒',
  stateLabel: '门状态',
  lockLabel: '锁定状态',
};

// 将选中的行数据转换为 Access 类型设备对象
const selectedAccessDevice = computed(() => {
  if (selectedRows.value.length === 0) return null;
  const row = selectedRows.value[0];
  return {
    id: row.id,
    deviceName: row.deviceName || '门禁设备',
    deviceType: 'Access',
    belongToLaboratoryId: row.labId,
    pollingEnabled: false,
    address: row.address || row.rawRecord?.address || 1,
    rs485GatewayId: row.rs485GatewayId || row.rawRecord?.rs485GatewayId || 1,
    isLock: row.isLock || row.rawRecord?.isLock || false,
  };
});

// ==================== 控制命令执行回调 ====================
/**
 * 处理单设备控制命令执行
 * @param {Task[]} tasks - 任务列表
 * @param {Function} callback - 执行结果回调
 */
const handleControlExecute = async (tasks, callback) => {
  console.log('【AccessControl】执行控制命令:', tasks);
  
  try {
    // 调用实际 API 发送控制命令，task 原封不动发送
    for (const task of tasks) {
      const res = await controlDevice(task);
      console.log('【控制响应】', res);
    }
    
    ElMessage.success('控制命令已发送');
    handleRefresh();
    
    if (callback) callback(true, '执行成功');
    showRemote.value = false;
    showLock.value = false;
    
  } catch (error) {
    console.error('控制命令执行失败:', error);
    ElMessage.error('控制命令执行失败: ' + (error.message || '未知错误'));
    if (callback) callback(false, error.message || '执行失败');
  }
};

/**
 * 处理批量控制命令执行
 * @param {Task[]} tasks - 任务列表（单设备）
 * @param {Function} callback - 执行结果回调
 */
const handleBatchControlExecute = async (tasks, callback) => {
  console.log('【AccessControl】批量执行控制命令:', tasks);
  
  try {
    // 为每个选中的设备生成对应的任务
    const batchTasks = selectedRows.value.flatMap(row => {
      const device = {
        id: row.id,
        deviceName: row.deviceName || '门禁设备',
        deviceType: 'Access',
        belongToLaboratoryId: row.labId,
        pollingEnabled: false,
        address: row.address || row.rawRecord?.address || 1,
        rs485GatewayId: row.rs485GatewayId || row.rawRecord?.rs485GatewayId || 1,
        isLock: row.isLock || row.rawRecord?.isLock || false,
      };
      
      // 根据原始任务生成每个设备的任务
      return tasks.map(task => ({
        ...task,
        deviceId: device.id,
        args: [device.address, ...(task.args.slice(1) || [])],
      }));
    });
    
    console.log('【批量任务】', batchTasks);
    
    // 批量调用 API 发送控制命令，task 原封不动发送
    const promises = batchTasks.map(task => controlDevice(task));
    
    await Promise.all(promises);
    
    ElMessage.success(`批量控制命令已发送（${selectedRows.value.length}个设备）`);
    handleRefresh();
    
    // 关闭弹窗
    showRemote.value = false;
    showLock.value = false;
    
    if (callback) callback(true, '批量执行成功');
  } catch (error) {
    console.error('批量控制命令执行失败:', error);
    ElMessage.error('批量控制命令执行失败: ' + (error.message || '未知错误'));
    if (callback) callback(false, error.message || '执行失败');
  }
};

// 计算属性：表格数据
const tableData = computed(() => {
  let data = deviceStore.getAccessTableData;

  // 如果有搜索关键字，按关键字筛选
  if (searchKey.value.trim()) {
    const k = searchKey.value.trim().toLowerCase();
    data = data.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(k)),
    );
  }

  return data.map((item) => ({
    ...item,
    address: item.rawRecord?.address || item.address,
    selfId: item.rawRecord?.selfId || item.selfId,
    isLock: item.rawRecord?.isLock ?? item.isLock ?? false,
  }));
});

// 获取单位名称
const getDeptName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  if (!lab) return "-";
  const depts = lab.belongToDepts || [];
  if (depts.length === 0) return "-";
  const dept = deptList.value.find(d => depts.includes(d.id) || depts.includes(String(d.id)));
  return dept?.deptName || "计算机基础实验教...";
};

// 获取楼栋名称
const getBuildingName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  if (!lab) return "-";
  const building = buildingList.value.find(b => b.id === lab.belongToBuilding || String(b.id) === String(lab.belongToBuilding));
  return building?.buildingName || "16栋";
};

// 获取实验室编号
const getLabNo = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  return lab?.laboratoryId || lab?.laboratoryName || labId || "-";
};

const buildingList = computed(() => userStore.getBuildingList);
const rawDeptData = computed(() => userStore.userInfo.depts || []);
const deptList = computed(() => rawDeptData.value.map((item) => item.dept));
const laboratoryList = computed(() => userStore.getLaboratoryList);

// 表格选择变化处理
const handleSelectionChange = (selection) => {
  selectedRows.value = selection.map((row) => ({
    ...row,
    labName: getLabName(row.labId),
  }));
};

// 获取实验室名称
const getLabName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  return lab?.laboratoryName || lab?.laboratoryId || labId || "-";
};

// 加载所有设备数据
const loadAllDeviceData = async () => {
  isLoading.value = true;
  try {
    const allLabIds = laboratoryList.value
      .map((item) => item.id)
      .filter((id) => id);
    await deviceStore.fetchDevicesByType(DeviceType.ACCESS, allLabIds);
  } catch (error) {
    console.error("【加载设备失败】", error);
    ElMessage.error("加载设备数据失败");
  } finally {
    isLoading.value = false;
  }
};

// 手动刷新
const handleRefresh = async () => {
  await loadAllDeviceData();
  ElMessage.success("刷新成功");
};

// 远程控制 - 打开弹窗
const handleRemoteControl = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请至少选择一条记录");
    return;
  }
  showRemote.value = true;
};

// 延时设置 - 打开弹窗
const handleDelaySetting = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请至少选择一条记录");
    return;
  }
  showLock.value = true;
};

// 搜索
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
  await userStore.refreshUserInfo();
  deviceStore.setDeviceType(DeviceType.ACCESS);
  await loadAllDeviceData();
});
</script>

<style scoped>
.door-control-page {
  padding: 16px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);
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

.batch-notice {
  margin-bottom: 20px;
}

:deep(.el-dialog__body) {
  padding-top: 10px;
}
</style>
