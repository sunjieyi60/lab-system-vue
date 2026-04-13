<template>
  <div class="door-control-page">
    <div class="main-content">
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
          <el-button
            :loading="isLoading"
            style="margin-right: 10px"
            @click="handleLockSetting"
            >锁定设置</el-button
          >
          <el-button
            :loading="isLoading"
            style="margin-right: 10px"
            @click="handleStartPolling"
            >开启轮询</el-button
          >
        </div>

        <div class="button-group right-buttons">
          <el-input
            v-model="searchKey"
            placeholder="请输入关键字"
            style="width: 180px; flex-shrink: 1"
          >
            <template #suffix>
              <img src="/images/搜索.png" style="width: 16px; height: 16px" />
            </template>
          </el-input>
          <span class="device-stat">
            {{ onlineDeviceCount }}台内机在线，总共{{ totalDeviceCount }}台
          </span>
        </div>
      </div>

      <!-- 表格盒子 -->
      <div class="table-box">
        <el-table
          ref="tableRef"
          :data="paginatedTableData"
          stripe
          style="width: 100%"
          :header-cell-style="{
            background: '#226EE04D',
            color: '#333',
            height: '48px',
          }"
          :row-style="{ height: '56px' }"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column
            prop="deptName"
            label="单位"
            width="120px"
            align="center"
            sortable
          >
            <template #default="{ row }">
              <el-tooltip
                v-if="getDeptName(row.labId).length > 5"
                :content="getDeptName(row.labId)"
                placement="top"
                effect="dark"
              >
                <span>{{ getDeptName(row.labId).slice(0, 5) }}...</span>
              </el-tooltip>
              <span v-else>{{ getDeptName(row.labId) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="buildingName"
            label="楼栋"
            width="100px"
            align="center"
            sortable
          >
            <template #default="{ row }">
              {{ getBuildingName(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="labName"
            label="实验室编号"
            width="130px"
            align="center"
            sortable
          >
            <template #default="{ row }">
              {{ getLabName(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="airCond"
            label="空调内机"
            align="center"
            sortable
          />
          <el-table-column prop="switch" label="开关" align="center" sortable>
            <template #default="{ row }">
              <el-tag
                :type="row.switch === '开' ? 'success' : 'info'"
                size="small"
              >
                {{ row.switch }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="mode" label="模式" align="center" sortable />
          <el-table-column prop="temp" label="温度" align="center" sortable />
          <el-table-column
            prop="windSpeed"
            label="风速"
            align="center"
            sortable
          />
          <el-table-column
            prop="roomTemp"
            label="室温"
            align="center"
            sortable
          />
          <el-table-column prop="fault" label="故障" align="center" sortable>
            <template #default="{ row }">
              <span
                :style="{ color: row.fault !== '无' ? '#f56c6c' : '#67c23a' }"
              >
                {{ row.fault }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="机组" align="center" sortable />
          <el-table-column prop="online" label="在线" align="center" sortable>
            <template #default="{ row }">
              <el-tag :type="row.online ? 'success' : 'info'" size="small">
                {{ row.online ? "在线" : "离线" }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>

  <!-- 弹窗组件 -->
  <AddNode
    v-model="showAddNode"
    device-type="AirCondition"
    :laboratory-list="laboratoryList"
    @success="handleRefresh"
  />
  <RemoteControl
    v-model="showRemote"
    :selected-rows="currentSelectedRows"
    :laboratory-list="laboratoryList"
    @success="handleRefresh"
    @closed="currentSelectedRows = []"
  />
  <LockSetting
    v-model="showLock"
    :selected-rows="currentSelectedRows"
    @success="handleRefresh"
    @closed="currentSelectedRows = []"
  />
  <IntelligentControl
    v-model="showIntelligent"
    :selected-rows="currentSelectedRows"
    @closed="currentSelectedRows = []"
  />
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";
import { deleteDevice, startDevicePolling } from "@/api/device";
import AddNode from "@/views/control/components/AddNodeHvac.vue";
import RemoteControl from "@/views/control/components/RemoteControl.vue";
import LockSetting from "@/views/control/components/LockSetting.vue";
import IntelligentControl from "@/views/control/components/IntelligentControl.vue";
import { useUserStore } from "@/stores";
import { useDeviceStore, DeviceType, DeviceTypeName } from "@/stores";
import { ElMessage, ElMessageBox } from "element-plus";
import { useLabFilter } from "@/composables/useLabFilter.js";

const userStore = useUserStore();
const deviceStore = useDeviceStore();

// 使用平行筛选逻辑
const {
  selectedDept,
  selectedBuilding,
  selectedLab,
  availableDepts,
  availableBuildings,
  availableLabs,
  currentFilteredLabs,
  handleDeptChange,
  handleBuildingChange,
  handleLabChange,
} = useLabFilter();
const searchKey = ref("");
const tableRef = ref();
const isLoading = ref(false);
const showAddNode = ref(false);
const showLock = ref(false);
const showRemote = ref(false);
const showIntelligent = ref(false);

// 保存选中的行数据（用于传给弹窗）
const currentSelectedRows = ref([]);

// 计算属性：表格数据（根据选择的实验室筛选）
const tableData = computed(() => {
  // 先获取所有空调数据
  let data = deviceStore.getAirConditionTableData;

  // 获取当前筛选后的实验室ID列表
  const filteredLabIds = currentFilteredLabs.value.map((lab) => String(lab.id));

  // 如果有任何筛选条件，按实验室ID过滤
  if (selectedDept.value || selectedBuilding.value || selectedLab.value) {
    data = data.filter((item) => filteredLabIds.includes(String(item.labId)));
  }

  // 如果有搜索关键字，再按关键字筛选
  if (searchKey.value.trim()) {
    const k = searchKey.value.trim().toLowerCase();
    data = data.filter((item) => {
      // 搜索所有原始字段
      const originalMatch = Object.values(item).some((val) =>
        String(val).toLowerCase().includes(k),
      );
      if (originalMatch) return true;

      // 搜索动态计算的字段（单位、楼栋、实验室名称）
      const deptName = getDeptName(item.labId);
      const buildingName = getBuildingName(item.labId);
      const labName = getLabName(item.labId);

      return (
        deptName.toLowerCase().includes(k) ||
        buildingName.toLowerCase().includes(k) ||
        labName.toLowerCase().includes(k)
      );
    });
  }

  return data;
});

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = computed(() => tableData.value.length);

// 设备统计
const totalDeviceCount = computed(() => tableData.value.length);
const onlineDeviceCount = computed(
  () => tableData.value.filter((item) => item.online).length,
);

// 分页后的数据
const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableData.value.slice(start, end);
});

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
};

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
  return lab?.laboratoryId || lab?.laboratoryName || labId || "-";
};

// 获取单位名称
const getDeptName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  if (!lab) return "-";
  const deptIds = lab.belongToDepts || [];
  if (deptIds.length === 0) return "-";
  const dept = deptList.value.find((d) => String(d.id) === String(deptIds[0]));
  return dept?.deptName || "-";
};

// 获取楼栈名称
const getBuildingName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  if (!lab) return "-";
  const building = buildingList.value.find(
    (b) => String(b.id) === String(lab.belongToBuilding),
  );
  return building?.buildingName || "-";
};

const handleAdd = () => {
  showAddNode.value = true;
};

// 实验室列表（用于弹窗等需要完整列表的地方）
const laboratoryList = computed(() => userStore.getLaboratoryList);
const buildingList = computed(() => userStore.getBuildingList);
const rawDeptData = computed(() => userStore.userInfo.depts || []);
const deptList = computed(() => rawDeptData.value.map((item) => item.dept));

// 加载所有设备数据（获取所有实验室的ID传给接口）
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
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (selection.length === 0) {
    ElMessage.warning("请至少选择一台设备进行锁定设置");
    return;
  }

  showLock.value = true;
};

// 手动刷新
const handleRefresh = async () => {
  await loadAllDeviceData();
  ElMessage.success("刷新成功");
};

const handleEdit = () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (selection.length !== 1) {
    ElMessage.warning("请选择一条要修改的记录");
    return;
  }
  console.log("编辑记录：", selection[0]);
};

const handleDelete = async () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (!selection.length) {
    ElMessage.warning("请至少选择一条要删除的记录");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selection.length} 条记录吗？`,
      "提示",
      { type: "warning" },
    );
    // 批量删除设备
    const deletePromises = selection.map((row) => deleteDevice(row.deviceId));
    await Promise.all(deletePromises);
    ElMessage.success("删除成功");
    // 清除表格选中状态
    tableRef.value?.clearSelection?.();
    // 刷新列表
    await loadAllDeviceData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error(error.message || "删除失败");
    }
  }
};

// 监听搜索关键字变化，实时筛选
watch(searchKey, () => {
  currentPage.value = 1; // 搜索时重置到第一页
});

// 开启轮询
const handleStartPolling = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请至少选择一条记录");
    return;
  }
  try {
    isLoading.value = true;
    for (const row of selectedRows.value) {
      if (row.deviceId) {
        await startDevicePolling(row.deviceId);
      }
    }
    ElMessage.success("轮询开启成功");
  } catch (error) {
    console.error("开启轮询失败:", error);
    ElMessage.error("开启轮询失败");
  } finally {
    isLoading.value = false;
  }
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
  console.log("【检查】当前选中实验室:", selectedLab.value);
});
</script>

<style scoped>
.door-control-page {
  padding-top: 6px;
  background: #fafbfc;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table-box {
  flex: 1;
  overflow: auto;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
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
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.select-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.filter-row.second-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 0 0 16px 8px;
}

.stat {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  line-height: 1.8;
}

.button-group.left-buttons {
  display: flex;
  gap: 10px;
}

.button-group.right-buttons {
  display: flex;
  gap: 10px;
  margin-left: auto;
  flex-wrap: wrap;
}

:deep(.el-button:focus) {
  outline: none;
  box-shadow: none;
}

.device-stat {
  font-size: 14px;
  color: #606266;
  margin-left: 12px;
  white-space: nowrap;
}
</style>
