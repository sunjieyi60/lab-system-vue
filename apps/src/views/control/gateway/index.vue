<!-- 网关管理 -->
<template>
  <div class="door-control-page">
    <div class="main-content">
      <!-- 第一行 -->
      <div class="filter-row first-row">
        <span class="select-label">单位：</span>
        <el-select
          v-model="selectedDept"
          clearable
          placeholder="全部"
          style="width: 160px; margin-right: 20px"
          @change="handleDeptChange"
        >
          <el-option
            v-for="item in availableDepts"
            :key="item.id"
            :label="item.deptName"
            :value="item.id"
          />
        </el-select>

        <span class="select-label">楼栋：</span>
        <el-select
          v-model="selectedBuilding"
          clearable
          placeholder="全部"
          style="width: 120px; margin-right: 20px"
          @change="handleBuildingChange"
        >
          <el-option
            v-for="item in availableBuildings"
            :key="item.id"
            :label="item.buildingName"
            :value="item.id"
          />
        </el-select>

        <span class="select-label">实验室编号：</span>
        <el-select
          v-model="selectedLab"
          clearable
          placeholder="全部"
          style="width: 120px; margin-right: 20px"
          @change="handleLabChange"
        >
          <el-option
            v-for="item in availableLabs"
            :key="item.id"
            :label="item.laboratoryId"
            :value="item.id"
          />
        </el-select>

        <span class="select-label">网关类型：</span>
        <el-select
          v-model="gatewayType"
          clearable
          placeholder="全部"
          style="width: 120px; margin-right: 20px"
        >
          <el-option label="全部" value="all" />
          <el-option label="RS485" value="rs485" />
          <el-option label="Socket" value="socket" />
        </el-select>

        <div class="stat">
          <span>{{ tableData.length }}个网关</span>
        </div>
      </div>

      <!-- 第二行 -->
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
            @click="handleStartPolling"
            >开启轮询</el-button
          >
        </div>

        <div class="button-group right-buttons">
          <el-input
            v-model="searchKey"
            placeholder="请输入关键字"
            style="width: 180px; margin-right: 10px; flex-shrink: 1"
          >
            <template #suffix>
              <img
                src="/images/搜索.png"
                style="width: 16px; height: 16px;"
              />
            </template>
          </el-input>
          <el-button
            type="primary"
            @click="showAddGateway = true"
            style="margin-right: 10px; width: 90px"
          >
            添加
          </el-button>

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
          <el-table-column prop="gatewayType" label="网关类型" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.gatewayType === 'RS485' ? 'primary' : 'success'"
                size="small"
              >
                {{ row.gatewayType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="labName" label="实验室" align="center">
            <template #default="{ row }">
              {{ getLabName(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column prop="gatewayName" label="网关名称" align="center" />
          <el-table-column prop="gatewayId" label="网关ID" align="center" />
          <el-table-column prop="status" label="状态" align="center" />
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

  <!-- 添加网关弹窗 -->
  <AddGatewayDialog
    v-model="showAddGateway"
    :laboratory-list="laboratoryList"
    @success="handleAddSuccess"
  />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore, useDeviceStore } from "@/stores";
import AddGatewayDialog from "@/views/control/components/AddGatewayDialog.vue";
import { deleteRS485Gateway, deleteSocketGateway, startDevicePolling } from "@/api/device";
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

const gatewayType = ref("all");
const searchKey = ref("");
const tableRef = ref();
const isLoading = ref(false);
const showAddGateway = ref(false);

// 实验室列表
const laboratoryList = computed(() => userStore.getLaboratoryList);

// 计算属性：表格数据
const tableData = computed(() => {
  let data = [];

  // 获取RS485网关数据
  if (gatewayType.value === "all" || gatewayType.value === "rs485") {
    const rs485Data = deviceStore.getAllRS485Gateways.map((gateway) => ({
      id: `rs485-${gateway.gatewayId}`,
      labId: gateway.laboratoryId,
      gatewayName: gateway.gatewayName,
      gatewayId: gateway.gatewayId,
      ipAddress: gateway.ipAddress || "-",
      port: gateway.port || "-",
      online: gateway.online || false,
      lastOnlineTime: gateway.lastOnlineTime || "-",
      deviceCount: gateway.deviceCount || 0,
      gatewayType: "RS485",
      rawData: gateway,
    }));
    data = [...data, ...rs485Data];
  }

  // 获取Socket网关数据
  if (gatewayType.value === "all" || gatewayType.value === "socket") {
    const socketData = deviceStore.getAllSocketGateways.map((gateway) => ({
      id: `socket-${gateway.gatewayId}`,
      labId: gateway.laboratoryId,
      gatewayName: gateway.gatewayName,
      gatewayId: gateway.gatewayId,
      ipAddress: gateway.ipAddress || "-",
      port: gateway.port || "-",
      online: gateway.online || false,
      lastOnlineTime: gateway.lastOnlineTime || "-",
      deviceCount: gateway.deviceCount || 0,
      gatewayType: "Socket",
      rawData: gateway,
    }));
    data = [...data, ...socketData];
  }

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
      
      // 搜索动态计算的实验室名称
      const labName = getLabName(item.labId);
      return labName.toLowerCase().includes(k);
    });
  }

  return data;
});

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = computed(() => tableData.value.length);

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

// 获取实验室名称
const getLabName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  return lab?.laboratoryId || lab?.laboratoryName || labId || "-";
};

// 加载所有网关数据
const loadAllGatewayData = async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      deviceStore.fetchRS485Gateways(),
      deviceStore.fetchSocketGateways(),
    ]);
  } catch (error) {
    console.error("加载网关数据失败:", error);
  } finally {
    isLoading.value = false;
  }
};

// 手动刷新
const handleRefresh = async () => {
  await loadAllGatewayData();
  ElMessage.success("刷新成功");
};

// 添加成功回调
const handleAddSuccess = () => {
  loadAllGatewayData();
};

// 修改
const handleEdit = () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (selection.length !== 1) {
    ElMessage.warning("请选择一条要修改的记录");
    return;
  }
  console.log("编辑记录：", selection[0]);
  ElMessage.info("编辑功能开发中...");
};

// 删除
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
    // 批量删除网关（根据类型调用不同接口）
    const deletePromises = selection.map((row) => {
      if (row.gatewayType === "RS485") {
        return deleteRS485Gateway(row.gatewayId);
      } else {
        return deleteSocketGateway(row.gatewayId);
      }
    });
    await Promise.all(deletePromises);
    ElMessage.success("删除成功");
    // 清除表格选中状态
    tableRef.value?.clearSelection?.();
    // 刷新列表
    await loadAllGatewayData();
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

// 获取选中的行数据
const selectedRows = computed(() => {
  return tableRef.value?.getSelectionRows?.() || [];
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

  // 加载网关数据
  await loadAllGatewayData();
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
</style>
