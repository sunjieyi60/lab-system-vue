<!--电气监控 -->
<template>
  <div class="electric-control-page">
    <div class="main-content">
      <!-- 顶部工具栏 -->
      <div class="toolbar-row">
        <div class="left-actions">
          <el-button :loading="isLoading" @click="handleRefresh">手动刷新</el-button>
          <el-button :loading="isLoading" @click="handleRemoteControl">远程控制</el-button>
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
              共 {{ tableData.length }} 个
            </span>
            <span class="stat-item">
              <span class="stat-dot green"></span>
              合闸 {{ closedCount }} 个
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
          <el-table-column prop="deptName" label="单位" align="center" min-width="180">
            <template #default="{ row }">
              {{ getDeptName(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column prop="buildingName" label="楼栋" align="center" min-width="80">
            <template #default="{ row }">
              {{ getBuildingName(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column prop="labNo" label="实验室编号" align="center" min-width="100">
            <template #default="{ row }">
              {{ getLabNo(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column prop="deviceName" label="电源空开" align="center" min-width="100" />
          <el-table-column prop="isOpen" label="空开状态" align="center" min-width="90">
            <template #default="{ row }">
              <el-tag
                :type="row.isOpen ? 'success' : 'danger'"
                size="big"
              >
                {{ row.isOpen ? '合闸' : '分闸' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="energy" label="电能(Kwh)" align="center" min-width="90" />
          <el-table-column prop="power" label="功率(Kw)" align="center" min-width="90" />
          <el-table-column prop="voltage" label="电压(V)" align="center" min-width="80" />
          <el-table-column prop="current" label="电流(A)" align="center" min-width="80" />
          <el-table-column prop="leakage" label="漏电流(A)" align="center" min-width="90" />
          <el-table-column prop="temperature" label="线温(℃)" align="center" min-width="80" />
          <el-table-column prop="online" label="在线" align="center" min-width="70">
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

  <!-- 远程控制弹窗 - 使用 CircuitBreakControl 组件 -->
  <el-dialog
    v-model="showRemote"
    :title="currentSelectedRows.length > 1 ? `批量控制 (${currentSelectedRows.length}台设备)` : '断路器远程控制'"
    width="480px"
    :close-on-click-modal="false"
    destroy-on-close
    @open="handleDialogOpen"
    @closed="handleDialogClosed"
  >
    <div v-if="currentSelectedRows.length === 0" class="dialog-empty">
      未选择设备
    </div>
    
    <!-- 批量控制模式 -->
    <div v-else-if="currentSelectedRows.length > 1" class="dialog-content">
      <CircuitBreakControl
        :device="selectedCircuitBreakDevices"
        v-bind="circuitBreakControlConfig"
        @execute="handleBatchControlExecute"
      />

      <!-- 批量控制设备列表预览 -->
      <div class="batch-device-list">
        <div class="batch-device-list-title">
          <span>待控制设备列表 ({{ currentSelectedRows.length }})</span>
          <el-button type="primary" link size="small" @click="showDeviceList = !showDeviceList">
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
              {{ index + 1 }}. {{ row.deviceName }} - {{ getLabName(row.labId) }}
            </el-tag>
          </div>
        </el-collapse-transition>
      </div>
    </div>

    <!-- 单设备控制模式 -->
    <div v-else class="dialog-content">
      <!-- 设备信息 -->
      <div class="selected-device-info">
        <span class="device-label">当前设备：</span>
        <span class="device-value">{{ currentSelectedRows[0].deviceName }}</span>
        <span class="device-location">{{ getLabName(currentSelectedRows[0].labId) }}</span>
      </div>

      <CircuitBreakControl
        ref="circuitBreakControlRef"
        :device="selectedCircuitBreakDevice"
        v-bind="circuitBreakControlConfig"
        @execute="handleControlExecute"
      />
    </div>
  </el-dialog>
  
  
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "@/stores/modules/user.js";
import { useDeviceStore, DeviceType } from "@/stores/modules/device.js";
import { controlDevice } from "@/api/device.js";

// 引入 control-kit 组件
import CircuitBreakControl from "@packages/control-kit/src/components/controls/CircuitBreakControl.vue";

const userStore = useUserStore();
const deviceStore = useDeviceStore();

const searchKey = ref("");
const tableRef = ref();
const circuitBreakControlRef = ref();
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 选中的行数据
const selectedRows = ref([]);

// 保存选中的行数据（用于传给弹窗）
const currentSelectedRows = ref([]);

// 批量控制设备列表展开状态
const showDeviceList = ref(false);

// 弹窗显示状态
const showRemote = ref(false);

// 计算属性：表格数据（使用字符串拼接搜索）
const tableData = computed(() => {
  let data = deviceStore.getCircuitBreakTableData || [];

  // 如果有搜索关键字，按关键字筛选
  if (searchKey.value.trim()) {
    const k = searchKey.value.trim().toLowerCase();
    data = data.filter((item) => {
      // 将关键属性拼接为字符串，使用 "-" 作为分隔符
      const searchStr = [
        getDeptName(item.labId),
        getBuildingName(item.labId),
        getLabNo(item.labId),
        item.deviceName,
        item.isOpen ? '合闸' : '分闸',
        item.energy,
        item.power,
        item.voltage,
        item.current,
        item.leakage,
        item.temperature,
        item.online ? '在线' : '离线'
      ].join('-').toLowerCase();
      return searchStr.includes(k);
    });
  }

  // 映射字段并补充控制参数
  return data.map((item) => ({
    ...item,
    // 显式添加控制参数到顶层，方便子组件获取
    address: item.rawRecord?.address || item.address,
  }));
});

// 合闸数量统计
const closedCount = computed(() => {
  return tableData.value.filter((item) => item.isOpen).length;
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

const buildingList = computed(() => userStore.getBuildingList);
const rawDeptData = computed(() => userStore.userInfo.depts || []);
const deptList = computed(() => rawDeptData.value.map((item) => item.dept));
const laboratoryList = computed(() => userStore.getLaboratoryList);

// 断路器控制配置
const circuitBreakControlConfig = {
  priority: 'NORMAL',
  showWarning: true,
  showStatus: false,
  showControlButtons: true,
  showOpenButton: true,
  showCloseButton: true,
  showConfirmDialog: true,
  showQuickActions: false,
  showQueryStatus: false,
  showDeviceInfo: true,
  showInfoId: true,
  showInfoName: true,
  showInfoAddress: true,
  showInfoGateway: true,
  showSectionTitles: true,
  statusTitle: '当前状态',
  controlTitle: '控制操作',
  quickActionsTitle: '快捷操作',
  deviceInfoTitle: '设备信息',
  warningTitle: '断路器操作警告',
  warningDesc: '分闸/合闸操作将影响该区域供电，请谨慎操作',
  openButtonText: '合闸 (通电)',
  closeButtonText: '分闸 (断电)',
  queryStatusText: '查询状态',
  openIcon: '⚡',
  closeIcon: '⏻',
  confirmDialogTitle: '确认操作',
  confirmHint: '此操作将影响设备供电，请确认是否继续？',
  confirmButtonText: '确认执行',
  cancelButtonText: '取消',
  openConfirmMessage: '确认执行合闸操作？设备将恢复供电。',
  closeConfirmMessage: '确认执行分闸操作？设备将断电。',
};

// 将选中的行数据转换为 CircuitBreak 类型设备对象（单设备）
const selectedCircuitBreakDevice = computed(() => {
  if (currentSelectedRows.value.length === 0) return null;
  const row = currentSelectedRows.value[0];
  return {
    id: row.id,
    deviceName: row.deviceName || '断路器设备',
    deviceType: 'CircuitBreak',
    belongToLaboratoryId: row.labId,
    pollingEnabled: false,
    address: row.address || row.rawRecord?.address || 1,
    rs485GatewayId: row.rs485GatewayId || row.rawRecord?.rs485GatewayId || 1,
  };
});

// 将选中的行数据转换为 CircuitBreak 类型设备对象列表（批量）
const selectedCircuitBreakDevices = computed(() => {
  return currentSelectedRows.value.map(row => ({
    id: row.id,
    deviceName: row.deviceName || '断路器设备',
    deviceType: 'CircuitBreak',
    belongToLaboratoryId: row.labId,
    pollingEnabled: false,
    address: row.address || row.rawRecord?.address || 1,
    rs485GatewayId: row.rs485GatewayId || row.rawRecord?.rs485GatewayId || 1,
  }));
});

// 表格选择变化处理
const handleSelectionChange = (selection) => {
  // 补充 labName 到选中行数据
  selectedRows.value = selection.map((row) => ({
    ...row,
    labName: getLabName(row.labId),
  }));

  console.log("【选中行数据】", selectedRows.value);
};

// 加载所有设备数据（获取所有实验室的ID传给接口）
const loadAllDeviceData = async () => {
  isLoading.value = true;
  try {
    // 从 laboratoryList 获取所有实验室ID
    const allLabIds = laboratoryList.value
      .map((item) => item.id)
      .filter((id) => id);

    console.log("【加载所有设备】实验室ID列表:", allLabIds);

    // 把所有实验室ID传给接口，使用断路器类型（电气监控）
    await deviceStore.fetchDevicesByType(DeviceType.CIRCUIT_BREAK, allLabIds);

    console.log("【加载所有设备完成】");
    console.log("【检查】deviceStore.deviceMap:", deviceStore.deviceMap);
    console.log("【检查】所有断路器数据:", deviceStore.getCircuitBreakTableData);
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
  // 保存当前选中的行数据
  const rawData = deviceStore.getCircuitBreakTableData;
  currentSelectedRows.value = selectedRows.value.map((selectRow) => {
    return rawData.find((rawRow) => rawRow.id === selectRow.id) || selectRow;
  });
  showRemote.value = true;
};

// 弹窗打开时设置初始状态
const handleDialogOpen = () => {
  nextTick(() => {
    if (circuitBreakControlRef.value && currentSelectedRows.value.length === 1) {
      const device = currentSelectedRows.value[0];
      // isOpen: true 表示合闸（闭合），对应 isClosed: true
      const isClosed = device.isOpen;
      console.log('【设置断路器状态】isClosed:', isClosed, 'isOpen:', device.isOpen);
      circuitBreakControlRef.value.setStatus(isClosed);
    }
  });
};

// 弹窗关闭时清理数据
const handleDialogClosed = () => {
  currentSelectedRows.value = [];
};

/**
 * 处理单设备控制命令执行
 * @param {Task[]} tasks - 任务列表
 * @param {Function} callback - 执行结果回调
 */
const handleControlExecute = async (tasks, callback) => {
  console.log('【CircuitBreakControl】执行控制命令:', tasks);
  
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
  console.log('【CircuitBreakControl】批量执行控制命令:', tasks);
  
  try {
    // 批量调用 API 发送控制命令
    for (const task of tasks) {
      const res = await controlDevice(task);
      console.log('【批量控制响应】', res);
    }
    
    ElMessage.success(`批量控制命令已发送（${tasks.length}台设备）`);
    handleRefresh();
    
    if (callback) callback(true, '批量执行成功');
    showRemote.value = false;
    
  } catch (error) {
    console.error('批量控制命令执行失败:', error);
    ElMessage.error('批量控制命令执行失败: ' + (error.message || '未知错误'));
    if (callback) callback(false, error.message || '执行失败');
  }
};



const handleEdit = () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (selection.length !== 1) {
    ElMessage.warning("请选择一条要修改的记录");
    return;
  }
  console.log("编辑记录：", selection[0]);
};

const handleDelete = () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (!selection.length) {
    ElMessage.warning("请至少选择一条要删除的记录");
    return;
  }
  ElMessageBox.confirm(
    `确定要删除选中的 ${selection.length} 条记录吗？`,
    "提示",
    { type: "warning" },
  ).then(() => {
    console.log("删除记录：", selection);
    ElMessage.success("删除成功");
  });
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

  // 设置当前设备类型为断路器（电气监控）
  deviceStore.setDeviceType(DeviceType.CIRCUIT_BREAK);

  // 加载所有实验室的设备数据
  await loadAllDeviceData();

  // ===== console.log 检查数据 =====
  console.log("========== onMounted 数据检查 ==========");
  console.log("【检查】实验室列表:", laboratoryList.value);
  console.log(
    "【检查】实验室ID列表:",
    laboratoryList.value.map((item) => item.id),
  );
  console.log("【检查】deviceStore.deviceMap:", deviceStore.deviceMap);
  console.log("【检查】所有断路器数据:", deviceStore.getCircuitBreakTableData);
  console.log("========================================");
});

// 生命周期 - 卸载时清空数据
onUnmounted(() => {
  deviceStore.clear()
})
</script>

<style scoped>
.electric-control-page {
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
