<!-- 环境监控 -->
<template>
  <div class="env-monitor-page">
    <div class="main-content">
      <!-- 顶部工具栏 -->
      <div class="toolbar-row">
        <div class="left-actions">
          <el-button :loading="isLoading" @click="handleRefresh">手动刷新</el-button>
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
          <el-table-column prop="deviceName" label="环境采集器" align="center" min-width="120" />
          <el-table-column prop="temperature" label="温度(℃)" align="center" min-width="90" />
          <el-table-column prop="humidity" label="湿度(%)" align="center" min-width="80" />
          <el-table-column prop="light" label="亮度(Lux)" align="center" min-width="100" />
          <el-table-column prop="smoke" label="烟雾浓度" align="center" min-width="90" />
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
  
  
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "@/stores/modules/user.js";
import { useDeviceStore, DeviceType } from "@/stores/modules/device.js";

const userStore = useUserStore();
const deviceStore = useDeviceStore();

const searchKey = ref("");
const tableRef = ref();
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 计算属性：表格数据（使用字符串拼接搜索）
const tableData = computed(() => {
  let data = deviceStore.getSensorTableData || [];

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
        item.temperature,
        item.humidity,
        item.light,
        item.smoke,
        item.online ? '在线' : '离线'
      ].join('-').toLowerCase();
      return searchStr.includes(k);
    });
  }

  return data;
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

// 表格选择变化处理
const handleSelectionChange = (selection) => {
  console.log("【选中行数据】", selection);
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

    // 把所有实验室ID传给接口
    await deviceStore.fetchDevicesByType(DeviceType.SENSOR, allLabIds);

    console.log("【加载所有设备完成】");
    console.log("【检查】deviceStore.deviceMap:", deviceStore.deviceMap);
    console.log("【检查】所有传感器数据:", deviceStore.getSensorTableData);
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

  // 设置当前设备类型为传感器
  deviceStore.setDeviceType(DeviceType.SENSOR);

  // 加载所有实验室的设备数据
  await loadAllDeviceData();

  // ===== console.log 检查数据 =====
  console.log("========== onMounted 数据检查 ==========");
  console.log("【检查】实验室列表:", laboratoryList.value);
  console.log(
    "【检查】实验室ID列表:",
    laboratoryList.value.map((item) => item.id),
  );
  console.log("【检查】当前表格数据:", tableData.value);
  console.log("【检查】表格数据条数:", tableData.value.length);
  console.log("========================================");
});

// 生命周期 - 卸载时清空数据
onUnmounted(() => {
  deviceStore.clear()
})
</script>

<style scoped>
.env-monitor-page {
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
</style>
