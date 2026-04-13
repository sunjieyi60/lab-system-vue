<!-- 智能控制 -->
<template>
  <div class="intelligent-control-page">
    <div class="main-content">
      <!-- 添加/编辑策略弹窗 -->
      <AddStrategyDialog
        v-model="showAddDialog"
        :edit-data="currentEditData"
        @confirm="handleAddConfirm"
        @cancel="handleAddCancel"
      />
      <!-- 添加/编辑联动策略弹窗 -->
      <LinkageStrategyDialog
        v-model="showLinkageDialog"
        :edit-data="currentEditData"
        @confirm="handleLinkageConfirm"
        @cancel="handleLinkageCancel"
      />
      <!-- 第一行：筛选条件 -->
      <div class="filter-row first-row">
        <span class="select-label">单位：</span>
        <el-select v-model="unit" class="filter-select">
          <el-option label="全部" value="all" />
          <el-option
            v-for="item in deptList"
            :key="item.id"
            :label="item.deptName"
            :value="item.id"
          />
        </el-select>

        <span class="select-label">楼栋：</span>
        <el-select v-model="building" class="filter-select">
          <el-option label="全部" value="all" />
          <el-option
            v-for="item in buildingList"
            :key="item.id"
            :label="item.buildingName"
            :value="item.id"
          />
        </el-select>

        <span class="select-label">实验室编号：</span>
        <el-select
          v-model="labNo"
          class="filter-select"
          @change="handleLabChange"
        >
          <el-option label="全部" value="all" />
          <el-option
            v-for="item in filteredLaboratoryList"
            :key="item.id"
            :label="item.laboratoryId"
            :value="item.id"
          />
        </el-select>

        <div class="stat">
          <span>{{ tableData.length }}条策略，{{ enabledCount }}条启用</span>
        </div>
      </div>

      <!-- 第二行：操作按钮 -->
      <div class="filter-row second-row">
        <div class="button-group left-buttons">
          <el-button :loading="isLoading" @click="handleRefresh"
            >手动刷新</el-button
          >
          <el-button :loading="isLoading" @click="handleStartPolling"
            >开启轮询</el-button
          >
          <el-button
            :loading="isLoading"
            @click="handleBatchEnable"
            type="success"
            >批量启用</el-button
          >
          <el-button
            :loading="isLoading"
            @click="handleBatchDisable"
            type="warning"
            >批量禁用</el-button
          >
        </div>

        <div class="button-group right-buttons">
          <el-input
            v-model="searchKey"
            placeholder="请输入关键字"
            class="search-input"
          >
            <template #suffix>
              <img src="/images/搜索.png" style="width: 16px; height: 16px" />
            </template>
          </el-input>
          <el-dropdown
            split-button
            type="primary"
            @click="handleAdd"
            @command="handleAddCommand"
          >
            添加
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="time">定时策略</el-dropdown-item>
                <el-dropdown-item command="linkage">联动策略</el-dropdown-item>
                <el-dropdown-item command="scene">场景策略</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button @click="handleDelete">删除</el-button>
        </div>
      </div>

      <!-- 表格盒子 -->
      <div class="table-box">
        <el-table
          ref="tableRef"
          v-loading="smartControlStore.loading"
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
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column
            prop="taskName"
            label="策略名称"
            align="center"
            min-width="16"
            show-overflow-tooltip
          />
          <el-table-column
            prop="cron"
            label="执行频率"
            align="center"
            min-width="15"
          >
            <template #default="{ row }">
              <el-tag size="small" type="info">{{
                getCronDesc(row.cron)
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="labName"
            label="实验室编号"
            min-width="10"
            align="center"
          >
            <template #default="{ row }">
              {{ getLabName(row.laboratoryId) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="startDate"
            label="起始时间"
            align="center"
            min-width="15"
          />
          <el-table-column
            prop="endDate"
            label="截止时间"
            align="center"
            min-width="15"
          />
          <el-table-column prop="enable" label="状态" align="center" width="90">
            <template #default="{ row }">
              <el-switch
                v-model="row.enable"
                @change="(val) => handleStatusChange(row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            align="center"
            min-width="10"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button link type="primary" @click="handleEditRow(row)">
                编辑
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-box">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore, useSmartControlStore, useDeviceStore } from "@/stores";
import {
  createQuartz,
  updateQuartz,
  deleteQuartz,
  enableQuartz,
  cancelQuartz,
} from "@/api/smartControl";
import { startDevicePolling } from "@/api/device";
import AddStrategyDialog from "@/views/control/intelligent/components/AddStrategyDialog.vue";
import LinkageStrategyDialog from "@/views/control/intelligent/components/LinkageStrategyDialog.vue";

const userStore = useUserStore();
const smartControlStore = useSmartControlStore();
const deviceStore = useDeviceStore();

// 查询条件
const unit = ref("all");
const building = ref("all");
const labNo = ref("all");
const searchKey = ref("");

// 表格相关
const tableRef = ref();
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const selectedRows = ref([]);

// 添加/编辑策略弹窗显示状态
const showAddDialog = ref(false);
// 添加/编辑联动策略弹窗显示状态
const showLinkageDialog = ref(false);
// 当前编辑的策略数据
const currentEditData = ref(null);

// 定时任务列表数据从 store 获取（简化数据，用于表格显示）
const quartzList = computed(() => smartControlStore.getQuartzList);
// 完整策略数据从 store 获取（用于编辑）
const strategyList = computed(() => smartControlStore.getStrategyList);

// 分页信息
const pagination = computed(() => smartControlStore.getStrategyPagination);

// 计算属性：楼栋列表
const buildingList = computed(() => userStore.getBuildingList);

// 计算属性：部门列表
const rawDeptData = computed(() => userStore.userInfo?.depts || []);
const deptList = computed(() => rawDeptData.value.map((item) => item.dept));

// 计算属性：实验室列表
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

  // 按单位过滤
  if (unit.value && unit.value !== "all") {
    result = result.filter((room) => {
      const depts = room.belongToDepts || [];
      return depts.map(String).includes(String(unit.value));
    });
  }

  return result;
});

// 计算属性：将定时任务数据映射为表格数据（直接使用 /quartz/list 返回的数据）
const mappedTableData = computed(() => {
  console.log("【智能控制】quartzList原始数据:", quartzList.value);
  if (!quartzList.value || quartzList.value.length === 0) {
    console.log("【智能控制】quartzList为空");
    return [];
  }
  // 直接使用 API 返回的数据结构，添加 taskId 兼容原有代码
  return quartzList.value.map((item) => ({
    ...item,
    taskId: item.id,
  }));
});

// Cron 表达式转可读描述
const getCronDesc = (cron) => {
  if (!cron) return "-";
  // 标准化 cron 表达式（去除多余空格）
  const normalizedCron = cron.trim().replace(/\s+/g, " ");
  const cronMap = {
    "*/5 * * * * ?": "每5秒",
    "*/10 * * * * ?": "每10秒",
    "*/30 * * * * ?": "每30秒",
    "0 * * * * ?": "每分钟",
    "0 */5 * * * ?": "每5分钟",
    "0 0/5 * * * ?": "每5分钟",
    "0 */10 * * * ?": "每10分钟",
    "0 0/10 * * * ?": "每10分钟",
    "0 */30 * * * ?": "每30分钟",
    "0 0/30 * * * ?": "每30分钟",
    "0 0 * * * ?": "每小时",
    "0 0 0 * * ?": "每天",
  };
  return cronMap[normalizedCron] || normalizedCron;
};

// 计算属性：表格数据（带筛选和分页）
const tableData = computed(() => {
  console.log("【智能控制】mappedTableData:", mappedTableData.value);
  let data = [...mappedTableData.value];
  console.log("【智能控制】筛选前数据条数:", data.length);

  // 按楼栋筛选
  if (building.value && building.value !== "all") {
    const labIdsInBuilding = laboratoryList.value
      .filter((lab) => String(lab.belongToBuilding) === String(building.value))
      .map((lab) => String(lab.id));
    data = data.filter((item) =>
      labIdsInBuilding.includes(String(item.laboratoryId)),
    );
  }

  // 按单位筛选
  if (unit.value && unit.value !== "all") {
    const labIdsInUnit = laboratoryList.value
      .filter((lab) => {
        const depts = lab.belongToDepts || [];
        return depts.map(String).includes(String(unit.value));
      })
      .map((lab) => String(lab.id));
    data = data.filter((item) =>
      labIdsInUnit.includes(String(item.laboratoryId)),
    );
  }

  // 按实验室筛选
  if (labNo.value !== "all") {
    data = data.filter(
      (item) => String(item.laboratoryId) === String(labNo.value),
    );
  }

  // 搜索关键字筛选
  if (searchKey.value.trim()) {
    const k = searchKey.value.trim().toLowerCase();
    data = data.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(k)),
    );
  }

  // 使用后端分页
  total.value = pagination.value.total || data.length;
  console.log("【智能控制】最终表格数据:", data, "总条数:", total.value);
  return data;
});

// 启用的策略数量
const enabledCount = computed(() => {
  return mappedTableData.value.filter((item) => item.enable === true).length;
});

// 获取实验室名称
const getLabName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  return lab?.laboratoryId || lab?.laboratoryName || labId || "-";
};

// 获取设备类型名称
const getDeviceTypeName = (deviceType) => {
  const typeMap = {
    AirCondition: "空调",
    CircuitBreak: "断路器",
    Light: "照明",
    Sensor: "传感器",
    Access: "门禁",
  };
  return typeMap[deviceType] || deviceType;
};

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
};

// 实验室下拉框变化
const handleLabChange = (val) => {
  console.log("【实验室选择变化】选中值:", val);
};

// 手动刷新
const handleRefresh = async () => {
  isLoading.value = true;
  try {
    await loadStrategyData();
    ElMessage.success("刷新成功");
  } finally {
    isLoading.value = false;
  }
};

// 加载策略数据
const loadStrategyData = async () => {
  // 等待实验室列表加载完成
  if (laboratoryList.value.length === 0) {
    console.log("【智能控制】等待实验室列表加载...");
    return;
  }

  const params = {
    current: currentPage.value,
    size: pageSize.value,
  };

  // 准备实验室ID列表
  let labIds = [];
  if (labNo.value && labNo.value !== "all") {
    // 如果选择了特定实验室，只请求该实验室
    labIds = [labNo.value];
  } else {
    // 如果没选，用所有实验室的ID
    labIds = laboratoryList.value.map((lab) => lab.id);
  }

  console.log("【智能控制】请求参数:", params);
  console.log("【智能控制】实验室ID列表:", labIds);

  // 同时获取简化列表和完整策略数据
  await smartControlStore.fetchAllQuartzData(params, labIds);

  console.log(
    "【智能控制】Store定时任务列表(quartzList):",
    smartControlStore.getQuartzList,
  );
  console.log(
    "【智能控制】Store完整策略列表(strategyList):",
    smartControlStore.getStrategyList,
  );

  // 打印 strategyList 的详细结构
  const strategyList = smartControlStore.getStrategyList;
  if (strategyList.length > 0) {
    console.log(
      "【智能控制】strategyList[0] 结构:",
      JSON.parse(JSON.stringify(strategyList[0])),
    );
    console.log("【智能控制】strategyList[0].task:", strategyList[0].task);
    console.log(
      "【智能控制】strategyList[0].task.id:",
      strategyList[0].task?.id,
    );
  } else {
    console.warn("【智能控制】strategyList 为空！");
  }

  console.log(
    "【智能控制】Store分页信息:",
    smartControlStore.getStrategyPagination,
  );
};

// 批量启用
const handleBatchEnable = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请至少选择一条记录");
    return;
  }
  try {
    const enablePromises = selectedRows.value.map((row) =>
      enableQuartz(row.taskId),
    );
    await Promise.all(enablePromises);
    ElMessage.success(`已启用 ${selectedRows.value.length} 条策略`);
    // 刷新列表
    loadStrategyData();
  } catch (error) {
    console.error("批量启用失败:", error);
    ElMessage.error(error.message || "启用失败");
  }
};

// 批量禁用
const handleBatchDisable = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请至少选择一条记录");
    return;
  }
  try {
    const cancelPromises = selectedRows.value.map((row) =>
      cancelQuartz(row.taskId),
    );
    await Promise.all(cancelPromises);
    ElMessage.success(`已禁用 ${selectedRows.value.length} 条策略`);
    // 刷新列表
    loadStrategyData();
  } catch (error) {
    console.error("批量禁用失败:", error);
    ElMessage.error(error.message || "禁用失败");
  }
};

// 状态切换
const handleStatusChange = async (row, val) => {
  console.log("【状态切换】", row, val);
  try {
    if (val === true) {
      await enableQuartz(row.taskId);
    } else {
      await cancelQuartz(row.taskId);
    }
    ElMessage.success(
      `任务"${row.taskName}"已${val === true ? "启用" : "禁用"}`,
    );
    // 刷新列表
    loadStrategyData();
  } catch (error) {
    console.error("状态切换失败:", error);
    ElMessage.error(error.message || "操作失败");
    // 恢复原状态
    row.enable = !val;
  }
};

// 添加
const handleAdd = () => {
  console.log("添加策略");
  currentEditData.value = null; // 新增模式
  showAddDialog.value = true;
};

// 添加命令处理
const handleAddCommand = (command) => {
  const typeMap = {
    time: "定时策略",
    linkage: "联动策略",
    scene: "场景策略",
  };
  console.log("添加" + typeMap[command]);
  // 打开添加策略弹窗
  currentEditData.value = null; // 新增模式

  // 联动策略使用专门的弹窗
  if (command === "linkage") {
    showLinkageDialog.value = true;
  } else {
    showAddDialog.value = true;
  }
};

// 添加/编辑策略确认
const handleAddConfirm = async (data) => {
  console.log("保存策略数据:", data);

  try {
    // 判断是新增还是编辑（有 task.id 且从 store 能找到对应数据则为编辑）
    const isEdit = smartControlStore.getStrategyByTaskId(String(data.task.id));

    if (isEdit) {
      // 编辑模式：调用更新接口
      const res = await updateQuartz(data);
      console.log("更新策略成功:", res);
      ElMessage.success(`策略"${data.task.taskName}"更新成功`);
    } else {
      // 新增模式：调用创建接口
      const res = await createQuartz(data);
      console.log("创建策略成功:", res);
      ElMessage.success(`策略"${data.task.taskName}"创建成功`);
    }

    // 刷新列表
    loadStrategyData();
    // 清空编辑状态
    currentEditData.value = null;
  } catch (error) {
    console.error("保存策略失败:", error);
    ElMessage.error(error.message || "保存策略失败");
  }
};

// 添加/编辑策略取消
const handleAddCancel = () => {
  console.log("取消添加/编辑策略");
  // 清空编辑状态
  currentEditData.value = null;
};

// 添加/编辑联动策略确认（已在弹窗中调用接口，此处仅刷新列表）
const handleLinkageConfirm = async (data) => {
  console.log("联动策略已保存:", data);
  // 刷新列表
  loadStrategyData();
  // 清空编辑状态
  currentEditData.value = null;
};

// 添加/编辑联动策略取消
const handleLinkageCancel = () => {
  console.log("取消添加/编辑联动策略");
  // 清空编辑状态
  currentEditData.value = null;
};

// 修改（批量）
const handleEdit = () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (selection.length !== 1) {
    ElMessage.warning("请选择一条要修改的记录");
    return;
  }
  const row = selection[0];
  console.log("编辑记录：", row);
  // 从 strategyList（完整数据）中查找对应的策略数据
  // 使用 String() 确保类型匹配
  const fullData = smartControlStore.getStrategyByTaskId(String(row.id));
  console.log("完整策略数据：", fullData);
  currentEditData.value = fullData || null;
  showAddDialog.value = true;
};

// 行内编辑
const handleEditRow = (row) => {
  console.log("编辑行：", row);
  // 从 strategyList（完整数据）中查找对应的策略数据
  // 使用 String() 确保类型匹配
  const fullData = smartControlStore.getStrategyByTaskId(String(row.id));
  console.log("完整策略数据：", fullData);
  currentEditData.value = fullData || null;
  showAddDialog.value = true;
};

// 删除（批量）
const handleDelete = async () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (!selection.length) {
    ElMessage.warning("请至少选择一条要删除的记录");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selection.length} 条策略吗？`,
      "提示",
      { type: "warning" },
    );

    // 批量删除
    const deletePromises = selection.map((row) => deleteQuartz(row.taskId));
    await Promise.all(deletePromises);

    ElMessage.success(`成功删除 ${selection.length} 条策略`);
    // 刷新列表
    loadStrategyData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除失败:", error);
      ElMessage.error(error.message || "删除失败");
    }
  }
};

// 行内删除
const handleDeleteRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除任务"${row.taskName}"吗？`, "提示", {
      type: "warning",
    });

    await deleteQuartz(row.taskId);
    ElMessage.success("删除成功");
    // 刷新列表
    loadStrategyData();
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

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  loadStrategyData();
};

// 页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val;
  loadStrategyData();
};

onMounted(async () => {
  // 刷新用户信息
  await userStore.refreshUserInfo();
  console.log("【智能控制】用户信息加载完成");
  console.log("【智能控制】实验室列表:", laboratoryList.value);
  console.log("【智能控制】楼栋列表:", buildingList.value);
  console.log("【智能控制】部门列表:", deptList.value);

  // 先加载设备数据（用于设备ID到设备名的映射）
  if (laboratoryList.value.length > 0) {
    const labIds = laboratoryList.value.map((lab) => lab.id);
    await deviceStore.fetchAllDeviceTypes(labIds);
    console.log("【智能控制】设备数据加载完成");

    // 实验室列表已加载，加载策略数据
    await loadStrategyData();
  } else {
    console.log("【智能控制】等待实验室列表加载...");
  }

  console.log("【智能控制】页面加载完成");
});

// 监听实验室选择变化，自动刷新数据
watch(labNo, async (newVal) => {
  currentPage.value = 1;
  await loadStrategyData();
});

// 监听实验室列表变化，加载完成后自动请求策略数据
watch(
  laboratoryList,
  async (newVal) => {
    if (newVal.length > 0 && smartControlStore.getQuartzList.length === 0) {
      console.log("【智能控制】实验室列表已加载，开始加载策略数据");
      await loadStrategyData();
    }
  },
  { immediate: false },
);
</script>

<style scoped>
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

/* 第一行筛选区 */
.filter-row.first-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  background: #f4f7fd;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  height: auto;
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

/* 筛选项样式 */
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

/* 第二行操作按钮区 */
.filter-row.second-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 0 0 16px 8px;
}

.button-group.left-buttons {
  display: flex;
  gap: 10px;
}

.button-group.right-buttons {
  display: flex;
  gap: 10px;
  margin-left: auto;
  margin-right: 10px;
  flex-wrap: wrap;
}

.search-input {
  width: 180px;
}

.stat {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  line-height: 1.8;
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
  /* flex: 1 1 auto; */
  min-width: 0;
}

.pagination-box {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

/* 页面布局 - 分页器固定在底部 */
.intelligent-control-page {
  padding-top: 6px;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

/* 表格区域占据剩余空间 */
.table-wrapper {
  flex: 1;
  overflow: auto;
}

:deep(.el-button:focus) {
  outline: none;
  box-shadow: none;
}

/* 固定列样式修复 */
:deep(.el-table__fixed-right) {
  z-index: 2 !important;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1) !important;
}

:deep(.el-table__fixed-right::before) {
  background-color: transparent !important;
}

:deep(.el-table__header-wrapper .el-table__fixed-right) {
  z-index: 3 !important;
}

:deep(.el-table__body-wrapper .el-table__fixed-right) {
  z-index: 2 !important;
}

:deep(.el-table__fixed-right .el-table__cell) {
  background-color: #fff !important;
}

:deep(.el-table__fixed-right .el-table__header-cell) {
  background-color: #226ee04d !important;
}
</style>
