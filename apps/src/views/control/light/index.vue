<!-- 电灯开关监控 -->
<template>
  <div class="light-env-page">
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
            {{ onlineDeviceCount }}个照明在线，总共{{ totalDeviceCount }}个
          </span>
        </div>
      </div>

      <!-- 表格盒子 -->
      <div class="table-box">
        <el-table
          ref="tableRef"
          :data="pagedTableData"
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
            align="center"
            sortable
          >
            <template #default="{ row }">
              {{ getLabName(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="deviceName"
            label="电灯空开"
            align="center"
            sortable
          />
          <el-table-column
            prop="isOpen"
            label="开关状态"
            align="center"
            sortable
          >
            <template #default="{ row }">
              <el-tag
                :type="row.isOpen === '开启' ? 'success' : 'info'"
                size="small"
              >
                {{ row.isOpen }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="online" label="在线" align="center" sortable>
            <template #default="{ row }">
              <el-tag :type="row.online ? 'success' : 'info'" size="small">
                {{ row.online ? "在线" : "掉线" }}
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

  <!-- 远程控制弹窗 -->
  <RemoteControl
    v-model="showRemote"
    :selected-rows="selectedRows"
    :laboratory-list="laboratoryList"
    @success="handleRefresh"
  />
  <AddNode
    v-model="showAddNode"
    device-type="Light"
    :laboratory-list="laboratoryList"
    @success="handleRefresh"
  />
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "@/stores";
import { deleteDevice, startDevicePolling } from "@/api/device";
import { useDeviceStore, DeviceType } from "@/stores";
import RemoteControl from "@/views/control/light/components/RemoteControl.vue";
import AddNode from "@/views/control/components/AddNodeHvac.vue";

const userStore = useUserStore();
const deviceStore = useDeviceStore();

const unit = ref("all");
const building = ref("all");
const labNo = ref("all");
const searchKey = ref("");
const tableRef = ref();
const isLoading = ref(false);
// 选中的行数据
const selectedRows = ref([]);

// 弹窗显示状态
const showRemote = ref(false);
const showAddNode = ref(false);

// 计算属性：表格数据（根据选择的实验室筛选）
const tableData = computed(() => {
  // 先获取所有照明数据
  let data = deviceStore.getLightTableData || [];

  // 如果选择了楼栋，按楼栋筛选
  if (building.value && building.value !== "all") {
    // 获取该楼栋下的所有实验室ID
    const labIdsInBuilding = laboratoryList.value
      .filter((lab) => String(lab.belongToBuilding) === String(building.value))
      .map((lab) => String(lab.id));
    data = data.filter((item) => labIdsInBuilding.includes(String(item.labId)));
  }

  // 如果选择了单位，按单位筛选
  if (unit.value && unit.value !== "all") {
    // 获取该单位下的所有实验室ID
    const labIdsInUnit = laboratoryList.value
      .filter((lab) => {
        const depts = lab.belongToDepts || [];
        return depts.map(String).includes(String(unit.value));
      })
      .map((lab) => String(lab.id));
    data = data.filter((item) => labIdsInUnit.includes(String(item.labId)));
  }

  // 如果选择了具体实验室，按实验室ID筛选
  if (labNo.value !== "all") {
    data = data.filter((item) => String(item.labId) === String(labNo.value));
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

  // 映射字段并补充控制参数
  return data.map((item) => ({
    ...item,
    // 显式添加控制参数到顶层，方便子组件获取
    address: item.rawRecord?.address || item.address,
    selfId: item.rawRecord?.selfId || item.selfId,
  }));
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
const pagedTableData = computed(() => {
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

// 开启数量统计
const openCount = computed(() => {
  return tableData.value.filter((item) => item.isOpen === "开启").length;
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

const buildingList = computed(() => userStore.getBuildingList);
const rawDeptData = computed(() => userStore.userInfo.depts || []);
const deptList = computed(() => rawDeptData.value.map((item) => item.dept));
const laboratoryList = computed(() => userStore.getLaboratoryList);

// 过滤后的实验室列表
const filteredLaboratoryList = computed(() => {
  let result = laboratoryList.value;

  // 按楼栋过滤
  if (building.value && building.value !== "all") {
    result = result.filter(
      (room) => String(room.belongToBuilding) === String(building.value),
    );
  }

  // 按单位过滤 - belongToDepts是数组
  if (unit.value && unit.value !== "all") {
    result = result.filter((room) => {
      const depts = room.belongToDepts || [];
      return depts.map(String).includes(String(unit.value));
    });
  }

  return result;
});

// 表格选择变化处理
const handleSelectionChange = (selection) => {
  // 补充 labName、address、selfId 到选中行数据
  selectedRows.value = selection.map((row) => ({
    ...row,
    labName: getLabName(row.labId), // 补充实验室名称
    address: row.rawRecord?.address || row.address, // 补充地址
    selfId: row.rawRecord?.selfId || row.selfId, // 补充selfId
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

    // 把所有实验室ID传给接口
    await deviceStore.fetchDevicesByType(DeviceType.LIGHT, allLabIds);

    console.log("【加载所有设备完成】");
    console.log("【检查】deviceStore.deviceMap:", deviceStore.deviceMap);
    console.log("【检查】所有照明数据:", deviceStore.getLightTableData);
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

  // 设置当前设备类型为照明
  deviceStore.setDeviceType(DeviceType.LIGHT);

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
  console.log("【检查】所有照明数据:", deviceStore.getLightTableData);
  console.log("【检查】当前表格数据:", tableData.value);
  console.log("【检查】表格数据条数:", tableData.value.length);
  console.log("【检查】开启数量:", openCount.value);
  console.log("========================================");
});
</script>

<style scoped>
.light-env-page {
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

.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;
  padding: 0 16px;
}

.filter-row.first-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  background: #f4f7fd;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.select-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.filter-select {
  width: 160px;
  margin-right: 20px;
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

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
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

.table-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex: 1;
  overflow: auto;
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

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.filter-panel :deep(.el-button) {
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  color: #777;
  background: #fafafa;
  border: 1px solid #b5d4e6;
}

.filter-panel :deep(.el-button:hover) {
  background: #669ffc;
  border-color: #4b87e6;
  color: #fff;
}

.filter-panel :deep(.el-button:active) {
  background: #1a5bb8;
  border-color: #1a5bb8;
}

.filter-panel :deep(.el-button:focus) {
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
