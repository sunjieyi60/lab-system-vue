<template>
  <el-dialog
    v-model="showDialog"
    top="33vh"
    :close-on-click-modal="false"
    destroy-on-close
    style="
      --el-dialog-header-text-align: center;
      height: 70vh;
      overflow: hidden;
      width: 1100px;
      left: calc(50% - 1100px / 2);
    "
    class="strategy-dialog"
  >
    <template #header>
      <div
        style="
          width: 100%;
          text-align: center;
          font-size: 18px;
          font-weight: 500;
        "
      >
        智能设置
      </div>
    </template>

    <!-- 主体容器：flex垂直布局，高度100%，让表格区域自动填充剩余空间 -->
    <div
      style="
        padding: 0 20px 20px;
        height: calc(100% - 60px);
        display: flex;
        flex-direction: column;
      "
    >
      <!-- 顶部操作栏：固定高度，保留间距 -->
      <div
        style="
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        "
      >
        <div style="display: flex; gap: 8px; flex-wrap: wrap; row-gap: 6px">
          <el-button type="default" @click="handleManualAdd"
            >手动添加</el-button
          >
          <el-button type="default" @click="handleAutoAdd">自动添加</el-button>
          <el-button type="default" @click="handleEdit">修改</el-button>
          <el-button type="default" @click="handleDelete">删除</el-button>
          <el-button type="default" @click="handleApply">应用</el-button>
          <el-button type="default" @click="handleCancelApply"
            >取消应用</el-button
          >
        </div>
        <div style="display: flex; gap: 8px; flex-shrink: 0">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入关键字"
            style="width: 180px; font-size: 13px"
            clearable
          />
          <el-button type="primary" :icon="Search" @click="handleSearch" />
        </div>
      </div>

      <!-- 策略表格：核心滚动区域，flex:1 自动填充剩余空间，overflow:auto 滚动 -->
      <div style="flex: 1; overflow: auto; margin-bottom: 12px">
        <el-table
          ref="tableRef"
          :data="tableData"
          style="width: 100%"
          border
          stripe
          highlight-current-row
          @selection-change="handleSelectionChange"
          size="small"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column
            prop="name"
            label="策略名称"
            min-width="140"
            sortable
            show-overflow-tooltip
          />
          <el-table-column
            prop="addType"
            label="添加方式"
            width="90"
            sortable
            align="center"
          />
          <el-table-column
            prop="devices"
            label="空调内机"
            min-width="160"
            show-overflow-tooltip
          />
          <el-table-column
            prop="details"
            label="策略详情"
            min-width="240"
            show-overflow-tooltip
          />
          <el-table-column
            prop="status"
            label="应用状态"
            width="90"
            sortable
            align="center"
          >
            <template #default="{ row }">
              <el-tag
                :type="row.status === '应用' ? 'success' : 'info'"
                size="small"
              >
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页：固定在弹窗最底部，适配内边距，不被压缩 -->
      <div
        style="
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          padding: 8px 0;
          gap: 10px;
          background: #fff;
          display: flex;
          justify-content: center; /* 水平居中（必要，行内保留更精准） */
          align-items: center;
          z-index: 1;
        "
      >
        <span>总共 {{ total }} 页</span>

        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="prev, pager, next"
          background
          @current-change="handlePageChange"
          size="small"
        />
        <span style="color: #606266; font-size: 13px">跳至</span>
        <el-input-number
          v-model="jumpPage"
          :min="1"
          :max="Math.ceil(total / pageSize)"
          style="width: 60px"
          controls-position="right"
          size="small"
          @change="handleJumpPage"
        />
        <span style="color: #606266; font-size: 13px">页</span>
      </div>
    </div>
  </el-dialog>
  <ManualStrategy v-model="showManual" :on-close-child="handleCloseChild" />
  <AutoStrategy v-model="showAuto" :on-close-child="handleCloseChild" />
</template>

<script setup>
import { reactive, ref, defineModel, defineEmits } from "vue";
import { Search } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ManualStrategy from "./ManualStrategy.vue";
import AutoStrategy from "./AutomaticStrategy.vue";
const showDialog = defineModel({ default: false });
const emit = defineEmits([
  "manual-add",
  "auto-add",
  "edit",
  "delete",
  "apply",
  "cancel-apply",
]);

// 搜索和分页
const searchKeyword = ref("");
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(4);
const jumpPage = ref(1);
const selectedRows = ref([]);
const tableRef = ref(null); // 新增表格ref，按需使用
const showAuto = ref(false);
const showManual = ref(false);
// 表格数据（与原代码一致）
const tableData = ref([
  {
    id: 1,
    name: "定时检测报警控制",
    addType: "手动",
    devices: "16-202-1、16-202-2...",
    details:
      "1-16周，星期一，7：45-8：50，每5分钟检测一次；室温大于31℃，空调状态关；通过系统、短信自动报警；自动控制空调开、制冷。",
    status: "应用",
  },
  {
    id: 2,
    name: "课表起止时段检测报警控制",
    addType: "手动",
    devices: "16-203-1、16-203-2...",
    details:
      "根据课表时间，提前15分钟，延后5分钟，每5分钟检测一次；室温大于31℃，空调状态关；通过系统自动报警，自动控制空调开...",
    status: "应用",
  },
  {
    id: 3,
    name: "晚9点自动控制关机",
    addType: "手动",
    devices: "16-203-1、16-203-2...",
    details: "1-16周，21：00；空调状态开；自动控制空调关。",
    status: "应用",
  },
  {
    id: 4,
    name: "课表起止时间控制开机",
    addType: "手动",
    devices: "16-203-1、16-203-2...",
    details:
      "根据课表起始时间，提前15分钟；室温大于31℃，自动控制空调开、制冷、中风、26℃",
    status: "应用",
  },
]);

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
};
// 子弹窗关闭时的回调方法（传给子组件，核心：打开父弹窗）
const handleCloseChild = () => {
  showDialog.value = true; // 子弹窗关闭 → 打开父弹窗
};
// 搜索
const handleSearch = () => {
  console.log("搜索关键字：", searchKeyword.value);
  // 实现搜索逻辑
};

// 分页操作
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
};

const handlePageChange = (val) => {
  currentPage.value = val;
  jumpPage.value = val;
};

const handleJumpPage = (val) => {
  if (val) {
    currentPage.value = val;
  }
};

// 按钮操作
const handleManualAdd = () => {
  showManual.value = true;
  showDialog.value = false;
};

const handleAutoAdd = () => {
  showAuto.value = true;
  showDialog.value = false;
};

const handleEdit = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请先选择要修改的策略");
    return;
  }
  if (selectedRows.value.length > 1) {
    ElMessage.warning("只能选择一个策略进行修改");
    return;
  }
  emit("edit", selectedRows.value[0]);
};

const handleDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请先选择要删除的策略");
    return;
  }
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRows.value.length} 条策略吗？`,
    "警告",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    },
  ).then(() => {
    emit("delete", selectedRows.value);
    ElMessage.success("删除成功");
  });
};

const handleApply = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请先选择要应用的策略");
    return;
  }
  emit("apply", selectedRows.value);
  ElMessage.success("应用成功");
};

const handleCancelApply = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请先选择要取消应用的策略");
    return;
  }
  emit("cancel-apply", selectedRows.value);
  ElMessage.success("取消应用成功");
};
</script>

<style scoped>
/* 按钮样式调整 - 匹配图片中的灰色按钮 */
:deep(.el-button--default) {
  background-color: #f4f4f5;
  border-color: #e9e9eb;
  color: #606266;
}

:deep(.el-button--default:hover) {
  background-color: #e9e9eb;
  border-color: #dcdfe6;
  color: #606266;
}

/* 表格样式优化 */
:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

/* 滚动条优化，提升体验 */
:deep(.el-table__body-wrapper) {
  scrollbar-width: thin;
}
:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}
:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background-color: #dcdfe6;
  border-radius: 3px;
}
</style>
