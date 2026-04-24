<!-- 智能控制 -->
<template>
  <div class="intelligent-control-page">
    <div class="main-content">
      <!-- QuartzTaskForm 对话框 -->
      <el-dialog
        v-model="formDialogVisible"
        :title="formMode === 'create' ? '添加定时策略' : '编辑定时策略'"
        width="90%"
        top="5vh"
        :close-on-click-modal="false"
        destroy-on-close
      >
        <QuartzTaskForm
          v-if="formDialogVisible"
          :mode="formMode"
          :laboratory-id="selectedLabId"
          :devices="availableDevices"
          :users="availableUsers"
          :semesters="availableSemesters"
          :laboratories="availableLaboratories"
          :initial-value="currentEditData"
          :loading="formLoading"
          @submit="handleFormSubmit"
          @cancel="handleFormCancel"
          @lab-change="handleLabChange"
        />
      </el-dialog>

      <!-- 课表生成对话框 -->
      <el-dialog
        v-model="courseScheduleDialogVisible"
        title="从课表生成定时任务"
        width="90%"
        top="5vh"
        :close-on-click-modal="false"
        destroy-on-close
      >
        <CourseScheduleTaskForm
          v-if="courseScheduleDialogVisible"
          :laboratories="availableLaboratories"
          :semesters="availableSemesters"
          :devices="courseScheduleDevices"
          :loading="courseScheduleLoading"
          @submit="handleCourseScheduleSubmit"
          @cancel="handleCourseScheduleCancel"
        />
      </el-dialog>

      <!-- 操作栏 -->
      <div class="operation-bar">
        <div class="left-buttons">
          <el-button type="primary" plain @click="handleAdd">添加</el-button>
          <el-button type="info" plain @click="handleGenerateFromCourse">从课表生成</el-button>
          <el-button type="danger" plain @click="handleDelete">删除</el-button>
          <el-button type="success" plain @click="handleBatchEnable">批量启用</el-button>
          <el-button type="warning" plain @click="handleBatchDisable">批量禁用</el-button>
        </div>
        
        <div style="display: flex;">
          <div class="search-box">
            <el-input
              v-model="searchKey"
              placeholder="请输入关键字"
              class="search-input"
              @keyup.enter="handleSearch"
            >
              <template #suffix>
                <el-icon class="search-icon" @click="handleSearch">
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </div>

          <div class="stat-info">
            <span class="stat-item">
              <span class="stat-dot black"></span>
              共 {{ tableData.length }} 条
            </span>
            <span class="stat-item">
              <span class="stat-dot green"></span>
              启用 {{ enabledCount }} 条
            </span>
          </div>
        </div>
      </div>

      <!-- 表格 -->
      <div class="table-box">
        <el-table
          ref="tableRef"
          v-loading="smartControlStore.loading"
          :data="tableData"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="strategyType" label="策略类型" align="center" width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="cell-ellipsis">{{ row.strategyType }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="strategyName" label="策略名称" align="center" min-width="150" show-overflow-tooltip />
          <el-table-column prop="labNo" label="实验室编号" align="center" width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="cell-ellipsis">{{ getLabNo(row.labId) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="frequency" label="执行频率" align="center" width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="cell-ellipsis">{{ row.frequency }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="startDate" label="起始时间" align="center" width="120" show-overflow-tooltip />
          <el-table-column prop="endDate" label="截至时间" align="center" width="120" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" align="center" width="100">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                :active-value="'启用'"
                :inactive-value="'禁用'"
                @change="(val) => handleStatusChange(row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="100">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleEditRow(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
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
import { Search } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/modules/user.js";
import { useSmartControlStore } from "@/stores/modules/smartControl.js";
import { useDeviceStore } from "@/stores/modules/device.js";
import { useEduStore } from "@/stores/modules/edu.js";
// 不再直接导入API，使用store方法
import QuartzTaskForm from "@packages/quartz-kit/src/components/QuartzTaskForm.vue";
import CourseScheduleTaskForm from "@packages/quartz-kit/src/components/CourseScheduleTaskForm.vue";

const userStore = useUserStore();
const smartControlStore = useSmartControlStore();
const deviceStore = useDeviceStore();
const eduStore = useEduStore();

// 查询条件
const searchKey = ref("");

// 表格相关
const tableRef = ref();
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const selectedRows = ref([]);

// 表单对话框相关
const formDialogVisible = ref(false);
const formMode = ref("create");
const formLoading = ref(false);
const currentEditData = ref(null);

// 课表生成对话框相关
const courseScheduleDialogVisible = ref(false);
const courseScheduleLoading = ref(false);
const courseScheduleDevices = ref([]);

// 当前选中的实验室ID（用于表单）
const selectedLabId = ref(0);

// 可用设备列表（从新的接口获取）
const availableDevices = ref([]);

// 当前实验室ID（从store获取默认）
const currentLabId = computed(() => {
  const labs = userStore.getLaboratoryList;
  return labs.length > 0 ? labs[0].id : 0;
});

// 策略数据从 store 获取
const strategyList = computed(() => smartControlStore.getStrategyList);

// 分页信息
const pagination = computed(() => smartControlStore.getStrategyPagination);

// 计算属性：实验室列表
const laboratoryList = computed(() => userStore.getLaboratoryList);

// 可用实验室列表（传递给表单）
const availableLaboratories = computed(() => {
  return laboratoryList.value.map(lab => ({
    id: lab.id,
    laboratoryName: lab.laboratoryName,
    laboratoryId: lab.laboratoryId,
  }));
});

// 加载实验室设备列表
const loadLabDevices = async (labId) => {
  if (!labId) return;
  try {
    const devices = await deviceStore.fetchDevicesByLabId(labId);
    availableDevices.value = devices;
  } catch (error) {
    console.error("加载实验室设备失败:", error);
    availableDevices.value = [];
  }
};

// 实验室切换处理
const handleLabChange = (labId) => {
  selectedLabId.value = labId;
  loadLabDevices(labId);
};

// 可用用户列表（从用户store获取）
const availableUsers = computed(() => {
  // 这里可以从userStore或其他地方获取用户列表
  // 暂时返回空数组，实际项目中应该根据业务获取
  return [];
});

// 可用学期列表（从 edu store 获取）
const availableSemesters = computed(() => {
  const termList = eduStore.getAllTerms;
  return termList.map(term => ({
    id: term.id,
    name: term.termName || term.name || `学期${term.id}`,
    startDate: term.startDate,
    endDate: term.endDate,
    totalWeeks: term.totalWeeks,
  }));
});

// 获取实验室编号
const getLabNo = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  return lab?.laboratoryId || labId || "-";
};

// 计算属性：将策略数据映射为表格数据
const mappedTableData = computed(() => {
  console.log("【智能控制】strategyList原始数据:", strategyList.value);
  if (!strategyList.value || strategyList.value.length === 0) {
    return [];
  }
  return strategyList.value.map((item) => {
    const task = item.task || {};
    const actionGroups = item.actionGroups || [];
    const conditionGroups = item.conditionGroups || [];
    const timeRule = item.timeRule || {};

    // 判断策略类型
    let strategyType = "定时策略";
    if (conditionGroups.length > 0) {
      strategyType = "联动策略";
    } else if (actionGroups.length > 1) {
      strategyType = "场景策略";
    }

    // Cron 表达式转执行频率
    const getFrequency = (cron) => {
      if (!cron) return "-";
      const cronMap = {
        "*/5 * * * * ?": "每5秒",
        "*/10 * * * * ?": "每10秒",
        "*/30 * * * * ?": "每30秒",
        "0 * * * * ?": "1分钟",
        "0 */5 * * * ?": "每5分钟",
        "0 */10 * * * ?": "每10分钟",
        "0 */30 * * * ?": "每30分钟",
        "0 0 * * * ?": "每小时",
        "0 0 0 * * ?": "每天",
      };
      return cronMap[cron] || cron;
    };
    const frequency = getFrequency(task.cron);

    return {
      id: task.id,
      taskId: task.id,
      strategyName: task.taskName || "-",
      strategyType: strategyType,
      labId: task.laboratoryId,
      frequency: frequency,
      startDate: task.startDate || "-",
      endDate: task.endDate || "-",
      status: task.enable ? "启用" : "禁用",
      rawData: item,
    };
  });
});

// 计算属性：表格数据（带筛选和前端分页）
const tableData = computed(() => {
  let data = [...mappedTableData.value];

  // 搜索关键字筛选 - 所有row属性字符串拼接，分隔符为"-"
  if (searchKey.value.trim()) {
    const k = searchKey.value.trim().toLowerCase();
    data = data.filter((item) => {
      const searchStr = [
        item.strategyType,
        item.strategyName,
        getLabNo(item.labId),
        item.frequency,
        item.startDate,
        item.endDate,
        item.status,
      ].join("-").toLowerCase();
      return searchStr.includes(k);
    });
  }

  // 更新总条数（筛选后的）
  total.value = data.length;

  // 前端分页切片
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return data.slice(start, end);
});

// 启用的策略数量
const enabledCount = computed(() => {
  return mappedTableData.value.filter((item) => item.status === "启用").length;
});

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
};

// 加载策略数据（使用批量查询接口）
const loadStrategyData = async () => {
  // 获取当前用户所有的实验室ID列表
  smartControlStore.clear()
  const labIds = laboratoryList.value.map((lab) => lab.id);
  await smartControlStore.fetchStrategyListByLabBatch(labIds);
};

// 添加
const handleAdd = async () => {
  formMode.value = "create";
  currentEditData.value = null;
  // 设置默认实验室并加载设备
  selectedLabId.value = currentLabId.value;
  await loadLabDevices(selectedLabId.value);
  formDialogVisible.value = true;
};

// 从课表生成
const handleGenerateFromCourse = async () => {
  // 加载所有实验室的设备
  const labIds = laboratoryList.value.map((lab) => lab.id);
  if (labIds.length > 0) {
    try {
      const allDevices = await deviceStore.fetchDevicesByLabIds(labIds);
      // 转换为 CourseScheduleTaskForm 需要的格式
      courseScheduleDevices.value = allDevices.map(item => ({
        id: item.id,
        name: item.deviceName,
        type: item.deviceType,
        address: item.address,
        selfId: item.selfId,
        labId: item.belongToLaboratoryId,
      }));
    } catch (error) {
      console.error("加载设备列表失败:", error);
      courseScheduleDevices.value = [];
    }
  }
  courseScheduleDialogVisible.value = true;
};

// 课表生成提交
const handleCourseScheduleSubmit = async (data) => {
  courseScheduleLoading.value = true;
  try {
    await smartControlStore.generateFromCourseSchedule(data);
    ElMessage.success("课表任务生成成功");
    courseScheduleDialogVisible.value = false;
    // 刷新列表
    loadStrategyData();
  } catch (error) {
    console.error("课表生成失败:", error);
    // 错误消息已在store中显示
  } finally {
    courseScheduleLoading.value = false;
  }
};

// 课表生成取消
const handleCourseScheduleCancel = () => {
  courseScheduleDialogVisible.value = false;
};

// 行内编辑
const handleEditRow = async (row) => {
  formMode.value = "edit";
  // 转换数据为 QuartzTaskForm 需要的格式
  currentEditData.value = row.rawData;
  // 设置实验室ID并加载设备
  selectedLabId.value = row.labId || currentLabId.value;
  await loadLabDevices(selectedLabId.value);
  formDialogVisible.value = true;
};

// 表单提交
const handleFormSubmit = async ({ isCreate, data }) => {
  formLoading.value = true;
  try {
    if (isCreate) {
      await smartControlStore.createStrategy(data);
    } else {
      await smartControlStore.updateStrategy(data);
    }
    formDialogVisible.value = false;
    loadStrategyData();
  } catch (error) {
    console.error(isCreate ? "创建策略失败:" : "更新策略失败:", error);
    // 错误消息已在store中显示
  } finally {
    formLoading.value = false;
  }
};

// 表单取消
const handleFormCancel = () => {
  formDialogVisible.value = false;
};

// 批量启用
const handleBatchEnable = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请至少选择一条记录");
    return;
  }
  try {
    const taskIds = selectedRows.value.map((row) => row.taskId);
    await smartControlStore.batchEnableStrategy(taskIds);
    // 不需要重新加载，store已更新本地状态
  } catch (error) {
    console.error("批量启用失败:", error);
    // 错误消息已在store中显示
  }
};

// 批量禁用
const handleBatchDisable = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请至少选择一条记录");
    return;
  }
  try {
    const taskIds = selectedRows.value.map((row) => row.taskId);
    await smartControlStore.batchDisableStrategy(taskIds);
    // 不需要重新加载，store已更新本地状态
  } catch (error) {
    console.error("批量禁用失败:", error);
    // 错误消息已在store中显示
  }
};

// 状态切换
const handleStatusChange = async (row, val) => {
  try {
    if (val === "启用") {
      await smartControlStore.enableStrategy(row.taskId);
    } else {
      await smartControlStore.disableStrategy(row.taskId);
    }
    ElMessage.success(`策略"${row.strategyName}"已${val === "启用" ? "启用" : "禁用"}`);
    // store已更新本地状态，不需要重新加载
  } catch (error) {
    console.error("状态切换失败:", error);
    // 错误消息已在store中显示
    // 恢复原状态
    row.status = val === "启用" ? "禁用" : "启用";
  }
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
      { type: "warning" }
    );
    const taskIds = selection.map((row) => row.taskId);
    await smartControlStore.batchDeleteStrategy(taskIds);
    // store已更新本地状态，不需要重新加载
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除失败:", error);
      // 错误消息已在store中显示
    }
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
};

// 分页大小变化（前端分页，不重新请求）
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  // 新接口返回所有数据，前端分页即可，无需重新请求
};

// 页码变化（前端分页，不重新请求）
const handleCurrentChange = (val) => {
  currentPage.value = val;
  // 新接口返回所有数据，前端分页即可，无需重新请求
};

onMounted(async () => {
  await userStore.refreshUserInfo();
  // 初始化学期数据
  await eduStore.initTermData();
  await loadStrategyData();
});

// 生命周期 - 卸载时清空数据
onUnmounted(() => {
  deviceStore.clear()
})
</script>

<style scoped>
.intelligent-control-page {
  height:100%;
  padding: 16px;
  background: #fff;
  overflow-y: auto;
  box-sizing: border-box;
}

.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

/* 操作栏 */
.operation-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  /* padding: 16px 20px; */
  /* border-radius: 4px; */
  /* border: 1px solid #e8e8e8; */
  justify-content: space-between;
}

.left-buttons {
  display: flex;
  gap: 10px;
}

.search-box {
  flex: 1;
  max-width: 280px;
}

.search-input {
  width: 100%;
}

.search-icon {
  cursor: pointer;
  color: #909399;
}

.search-icon:hover {
  color: #409eff;
}

/* 统计信息 */
.stat-info {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-left: 2rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.stat-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
}

.stat-dot.black {
  background-color: #333;
}

.stat-dot.green {
  background-color: #67c23a;
}

/* 表格 */
.table-box {
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* 分页 */
.pagination-wrapper {
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

:deep(.el-button:focus) {
  outline: none;
  box-shadow: none;
}

/* 对话框样式 */
:deep(.el-dialog__body) {
  padding: 10px 20px;
  max-height: 70vh;
  overflow-y: auto;
}
@media (max-width: 768px) {
  .intelligent-control-page {
    padding: 8px;
    height: auto;
  }
  .main-content {
    gap: 8px;
  }
  .operation-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 0;
    gap: 8px;
    background: transparent;
    border: none;
  }
  .left-buttons {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 8px;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }
  .left-buttons :deep(.el-button) {
    flex-shrink: 0;
  }
  .operation-bar > div:last-child {
    display: flex !important;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
    width: 100%;
  }
  .search-box {
    flex: 1;
    max-width: none !important;
  }
  .search-input {
    width: 100%;
  }
  .stat-info {
    margin-left: 0 !important;
    flex-shrink: 0;
    white-space: nowrap;
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
