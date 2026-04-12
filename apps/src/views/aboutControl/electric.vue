<!--电气监控 -->
<template>
  <div class="door-control-page">
    <div class="main-content">
      <!-- 第一行 -->
      <div class="filter-row first-row">
        <span class="select-label">所在楼栋：</span>
        <el-select v-model="building" style="width: 120px; margin-right: 20px">
          <el-option label="全部" value="all" />
          <el-option
            v-for="item in buildingList"
            :key="item.id"
            :label="item.buildingName"
            :value="item.id"
          />
        </el-select>

        <span class="select-label">所属单位：</span>
        <el-select v-model="unit" style="width: 160px; margin-right: 20px">
          <el-option label="全部" value="all" />
          <el-option
            v-for="item in deptList"
            :key="item.id"
            :label="item.deptName"
            :value="item.id"
          />
        </el-select>

        <span class="select-label">实验室编号：</span>
        <el-select
          v-model="labNo"
          style="width: 120px; margin-right: 20px"
          @change="handleLabChange"
        >
          <el-option label="全部" value="all" />
          <el-option
            v-for="item in filteredLaboratoryList"
            :key="item.id"
            :label="item.laboratoryName"
            :value="item.id"
          />
        </el-select>

        <div class="stat">
          <span>{{ tableData.length }}个设备</span>
        </div>
      </div>

      <!-- 第二行部分 -->
      <div class="filter-row second-row">
        <div class="button-group left-buttons">
          <el-button
            :loading="isLoading"
            style="margin-right: 10px"
            @click="handleRefresh"
            >手动刷新</el-button
          >
          <el-button
            :loading="isLoading"
            style="margin-right: 10px"
            @click="handleRemoteControl"
            >远程控制</el-button
          >


        </div>

 <div class="button-group right-buttons">
          <el-input
            v-model="searchKey"
            placeholder="请输入关键字"
            style="width: 180px; margin-right: 10px; flex-shrink: 1"
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
          <el-dropdown
            split-button
            type="primary"
            @click="handleAdd"
            style="margin-right: 10px"
          >
            添加
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="lab">实验室</el-dropdown-item>
                <el-dropdown-item command="node">节点</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button style="width: 90px; margin-right: 10px" @click="handleEdit"
            >修改</el-button
          >
          <el-button
            style="width: 90px; margin-right: 10px"
            @click="handleDelete"
            >删除</el-button
          >
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
            background: '#226EE04D',
            color: '#333',
            height: '48px',
          }"
          :row-style="{ height: '56px' }"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" align="center" />
          <el-table-column
            prop="labName"
            label="实验室"
            align="center"
            width="120"
          >
            <template #default="{ row }">
              {{ getLabName(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column prop="deviceName" label="电源空开" align="center" />
          <el-table-column prop="isOpen" label="空开状态" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.isOpen ? 'success' : 'danger'"
                size="small"
              >
                {{ row.isOpen ? '通电' : '断电' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="energy" label="电能" align="center" />
          <el-table-column prop="power" label="功率(Kw)" align="center" />
          <el-table-column prop="voltage" label="电压(V)" align="center" />
          <el-table-column prop="current" label="电流(A)" align="center" />
          <el-table-column
            prop="leakageCurrent"
            label="漏电流(A)"
            align="center"
          />
          <el-table-column prop="lineTemp" label="线温(℃)" align="center" />
          <el-table-column prop="online" label="在线" align="center">
            <template #default="{ row }">
              <el-tag :type="row.online ? 'success' : 'info'" size="small">
                {{ row.online ? "在线" : "掉线" }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
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
  <AddNode
    v-model="showAddNode"
    device-type="CircuitBreak"
    :laboratory-list="laboratoryList"
    @success="handleRefresh"
  />
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "@/stores/user.js";
import { useDeviceStore, DeviceType } from "@/stores/device.js";
import { controlDevice } from "@/api/device.js";
import AddNode from "@/components/AboutControl/AddNodeHvac.vue";
// 引入 control-kit 组件
import CircuitBreakControl from "@packages/control-kit/src/components/controls/CircuitBreakControl.vue";

const userStore = useUserStore();
const deviceStore = useDeviceStore();

const unit = ref("all");
const building = ref("all");
const labNo = ref("all");
const searchKey = ref("");
const tableRef = ref();
const circuitBreakControlRef = ref();
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 选中的行数据
const selectedRows = ref([]);

// 弹窗显示状态
const showRemote = ref(false);
const showAddNode = ref(false);

// 保存选中的行数据（用于传给弹窗）
const currentSelectedRows = ref([]);

// 批量控制设备列表展开状态
const showDeviceList = ref(false);

// 计算属性：表格数据（根据选择的实验室筛选）
const tableData = computed(() => {
  // 先获取所有断路器数据（电气监控对应断路器类型）
  let data = deviceStore.getCircuitBreakTableData || [];

  // 如果选择了楼栋，按楼栋筛选
  if (building.value && building.value !== 'all') {
    // 获取该楼栋下的所有实验室ID
    const labIdsInBuilding = laboratoryList.value
      .filter(lab => String(lab.belongToBuilding) === String(building.value))
      .map(lab => String(lab.id));
    data = data.filter((item) => labIdsInBuilding.includes(String(item.labId)));
  }

  // 如果选择了单位，按单位筛选
  if (unit.value && unit.value !== 'all') {
    // 获取该单位下的所有实验室ID
    const labIdsInUnit = laboratoryList.value
      .filter(lab => {
        const depts = lab.belongToDepts || [];
        return depts.map(String).includes(String(unit.value));
      })
      .map(lab => String(lab.id));
    data = data.filter((item) => labIdsInUnit.includes(String(item.labId)));
  }

  // 如果选择了具体实验室，按实验室ID筛选
  if (labNo.value !== "all") {
    data = data.filter((item) => String(item.labId) === String(labNo.value));
  }

  // 如果有搜索关键字，再按关键字筛选
  if (searchKey.value.trim()) {
    const k = searchKey.value.trim().toLowerCase();
    data = data.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(k)),
    );
  }

  // 映射字段名以匹配表格列，并补充控制参数
  return data.map((item) => ({
    ...item,
    // 映射字段名
    leakageCurrent: item.leakage, // store: leakage -> 组件: leakageCurrent
    lineTemp: item.temperature, // store: temperature -> 组件: lineTemp
    // 显式添加控制参数到顶层，方便子组件获取
    address: item.rawRecord?.address || item.address,
  }));
});

// 获取实验室名称
const getLabName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  return lab?.laboratoryName || lab?.laboratoryId || labId || "-";
};

const buildingList = computed(() => userStore.getBuildingList);
const rawDeptData = computed(() => userStore.userInfo.depts || []);
const deptList = computed(() => rawDeptData.value.map((item) => item.dept));
const laboratoryList = computed(() => userStore.getLaboratoryList);

// 过滤后的实验室列表
const filteredLaboratoryList = computed(() => {
  let result = laboratoryList.value;
  
  // 按楼栋过滤
  if (building.value && building.value !== 'all') {
    result = result.filter((room) => String(room.belongToBuilding) === String(building.value));
  }
  
  // 按单位过滤 - belongToDepts是数组
  if (unit.value && unit.value !== 'all') {
    result = result.filter((room) => {
      const depts = room.belongToDepts || [];
      return depts.map(String).includes(String(unit.value));
    });
  }
  
  return result;
});

// 表格选择变化处理
const handleSelectionChange = (selection) => {
  // 补充 labName 到选中行数据
  selectedRows.value = selection.map((row) => ({
    ...row,
    labName: getLabName(row.labId), // 补充实验室名称
  }));

  console.log("【选中行数据】", selectedRows.value);
};

// 实验室下拉框变化处理
const handleLabChange = (val) => {
  console.log("【实验室选择变化】选中值:", val);
  console.log("【实验室选择变化】当前表格数据:", tableData.value);
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
    console.log(
      "【检查】所有断路器数据:",
      deviceStore.getCircuitBreakTableData,
    );
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
  
  // 根据设备状态设置控制组件的初始状态
  nextTick(() => {
    if (circuitBreakControlRef.value && currentSelectedRows.value.length === 1) {
      const device = currentSelectedRows.value[0];
      // isOpen: true 表示合闸（闭合），对应 isClosed: true
      const isClosed = device.isOpen;
      circuitBreakControlRef.value.setStatus(isClosed);
    }
  });
};

const handleAdd = () => {
  showAddNode.value = true;
};

const handleEdit = () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (selection.length !== 1) {
    ElMessage.warning("请选择一条要修改的记录");
    return;
  }
  console.log("编辑记录：", selection[0]);
};

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
  console.log("【搜索】结果:", tableData.value);
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
  console.log("【检查】当前选中实验室:", labNo.value);
  console.log("【检查】deviceStore.deviceMap:", deviceStore.deviceMap);
  console.log("【检查】所有断路器数据:", deviceStore.getCircuitBreakTableData);
  console.log("【检查】当前表格数据:", tableData.value);
  console.log("【检查】表格数据条数:", tableData.value.length);
  console.log("========================================");
});
</script>

<style scoped>
.door-control-page {
  padding-top: 6px;
  background: #fafbfc;
  min-height: 85vh;
  box-sizing: border-box;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;
  padding: 0 16px;
}

.filter-row.first-row {
  background: #f4f7fd;
  padding: 12px;
  border-radius: 8px;
  height: 26px;
  font-size: 15px;
}

.filter-row.second-row {
  padding: 0 0 0 8px;
}

.stat {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  line-height: 1.8;
}

/* ---------------- 表格 ---------------- */
.table-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex: 1;
  overflow-x: auto;
}

:deep(.el-table--striped .el-table__row--striped td.el-table__cell) {
  background-color: #226ee00d !important;
}

.button-group {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
}

.button-group.right-buttons {
  margin-left: auto;
  flex: 0 0 auto;
  justify-content: flex-end;
}

.pagination-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

:deep(.el-button:focus) {
  outline: none;
  box-shadow: none;
}

:deep(.el-table) {
  font-size: 13px;
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
