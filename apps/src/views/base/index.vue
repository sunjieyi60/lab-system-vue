<template>
  <div class="lab-management-page">
    <LabDialog
      v-model="showDialog"
      :is-add="isAdd"
      :row="currentRow"
      :custom-class="'custom-dialog'"
      @success="handleReload"
    />
    <!-- 头部操作区 -->
    <div class="page-header">
      <el-button :loading="isLoading" @click="handleAdd">添加</el-button>
      <el-button :loading="isLoading" @click="handleEdit">修改</el-button>
      <el-button :loading="isLoading" @click="handleDelete">删除</el-button>
      <el-input
        style="width: 200px; margin-left: 20px"
        v-model="searchKey"
        placeholder="请输入关键词搜索"
        clearable
      >
        <template #suffix>
          <img
            src="/images/搜索.png"
            style="width: 16px; height: 16px;"
          />
        </template>
      </el-input>
    </div>

    <!-- 数据表格 -->
    <el-table
      ref="tableRef"
      :data="paginatedTableData"
      stripe
      style="width: 100%"
      :header-cell-style="{
        background: '#226EE04D',
        color: '#333',
        textAlign: 'center',
        height: '48px',
      }"
      :row-style="{ height: '56px' }"
    >
      <el-table-column
        type="selection"
        min-width="5"
        header-align="center"
        align="center"
      />
      <el-table-column
        prop="laboratoryId"
        label="实验室编号"
        min-width="15"
        align="center"
        sortable
      />
      <el-table-column
        prop="laboratoryName"
        label="实验室名称"
        min-width="20"
        header-align="center"
        align="center"
        sortable
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-tooltip
            v-if="row.laboratoryName?.length > 5"
            :content="row.laboratoryName"
            placement="top"
            effect="dark"
          >
            <span>{{ row.laboratoryName.slice(0, 5) }}...</span>
          </el-tooltip>
          <span v-else>{{ row.laboratoryName }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="单位"
        min-width="20"
        header-align="center"
        align="center"
        sortable
        :sort-method="sortByDept"
      >
        <template #default="{ row }">
          <span v-if="!row.belongToDepts?.length">-</span>
          <template v-else>
            <el-tooltip
              v-if="getDeptNamesByIds(row.belongToDepts, deptList).join('、').length > 5"
              :content="getDeptNamesByIds(row.belongToDepts, deptList).join('、')"
              placement="top"
              effect="dark"
            >
              <span>{{ getDeptNamesByIds(row.belongToDepts, deptList).join("、").slice(0, 5) }}...</span>
            </el-tooltip>
            <span v-else>{{ getDeptNamesByIds(row.belongToDepts, deptList).join("、") }}</span>
          </template>
        </template>
      </el-table-column>
      <el-table-column
        label="楼栋"
        min-width="15"
        header-align="center"
        align="center"
        sortable
        :sort-method="sortByBuilding"
      >
        <template #default="{ row }">
          {{ getBuildingNameById(row.belongToBuilding, buildingList) }}
        </template>
      </el-table-column>
      <el-table-column
        label="负责人"
        min-width="10"
        header-align="center"
        align="center"
        sortable
        :sort-method="sortByManager"
      >
        <template #default="{ row }">
          <el-tooltip
            placement="top"
            :disabled="!row.managers || row.managers.length <= 1"
          >
            <template #content>
              <div style="max-width: 200px">
                <div
                  v-for="(manager, index) in row.managers"
                  :key="index"
                  style="margin-bottom: 4px"
                >
                  <span style="color: #409eff; font-weight: bold">{{
                    manager.realName
                  }}</span>
                  <span style="color: #909399; margin-left: 8px">{{
                    manager.phone
                  }}</span>
                </div>
              </div>
            </template>
            <span>{{ row.managers?.[0]?.realName || "-" }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        label="联系方式"
        min-width="15"
        header-align="center"
        align="center"
        sortable
        :sort-method="sortByPhone"
      >
        <template #default="{ row }">
          <el-tooltip
            placement="top"
            :disabled="!row.managers || row.managers.length <= 1"
          >
            <template #content>
              <div style="max-width: 200px">
                <div
                  v-for="(manager, index) in row.managers"
                  :key="index"
                  style="margin-bottom: 4px"
                >
                  <span style="color: #409eff; font-weight: bold">{{
                    manager.realName
                  }}</span>
                  <span style="color: #909399; margin-left: 8px">{{
                    manager.phone
                  }}</span>
                </div>
              </div>
            </template>
            <span>{{ row.managers?.[0]?.phone || "-" }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        prop="securityLevel"
        label="安全等级"
        min-width="15"
        header-align="center"
        align="center"
        sortable
      />
      <el-table-column
        prop="classCapacity"
        label="容量"
        min-width="10"
        header-align="center"
        align="center"
        sortable
      />
      <el-table-column
        prop="area"
        label="面积"
        min-width="10"
        header-align="center"
        align="center"
        sortable
      />
      <!-- 实验室简介 -->
      <el-table-column
        label="简介"
        min-width="10"
        header-align="center"
        align="center"
      >
        <template #default="{ row }">
          <span class="detail-link" @click="handleViewIntro(row)"> 查看 </span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 简介弹窗 -->
    <el-dialog
      v-model="showIntroDialog"
      title="实验室简介"
      :close-on-click-modal="true"
      class="intro-dialog"
    >
      <div class="intro-wrapper">
        <div class="intro-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="intro-content">
          {{ currentIntro || "暂无简介" }}
        </div>
      </div>
    </el-dialog>

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
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import LabDialog from "@/components/common/LabDialog.vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { Document } from "@element-plus/icons-vue";
import { getBuildingNameById, getDeptNamesByIds } from "@/maps/baseMap";
import { useUserStore } from "@/stores";
import { useBaseStore } from "@/stores";

const userStore = useUserStore();
const baseStore = useBaseStore();

/* ------ 表格数据 ------ */
const tableRef = ref();
const searchKey = ref("");
const isLoading = ref(false);
const buildingList = computed(() => userStore.userInfo.buildings || []);
const deptList = computed(() => userStore.userInfo.depts || []);

// 使用 baseStore 的 laboratories 和搜索功能
const tableData = computed(() => baseStore.getLaboratories);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = computed(() => tableData.value.length);

const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableData.value.slice(start, end);
});

/* ------ 排序方法 ------ */
// 按单位排序
const sortByDept = (a, b) => {
  const deptA = getDeptNamesByIds(a.belongToDepts, deptList.value).join("、");
  const deptB = getDeptNamesByIds(b.belongToDepts, deptList.value).join("、");
  return deptA.localeCompare(deptB, "zh-CN");
};

// 按楼栋排序
const sortByBuilding = (a, b) => {
  const buildingA = getBuildingNameById(a.belongToBuilding, buildingList.value);
  const buildingB = getBuildingNameById(b.belongToBuilding, buildingList.value);
  return buildingA.localeCompare(buildingB, "zh-CN");
};

// 按负责人排序
const sortByManager = (a, b) => {
  const managerA = a.managers?.[0]?.realName || "";
  const managerB = b.managers?.[0]?.realName || "";
  return managerA.localeCompare(managerB, "zh-CN");
};

// 按联系方式排序
const sortByPhone = (a, b) => {
  const phoneA = a.managers?.[0]?.phone || "";
  const phoneB = b.managers?.[0]?.phone || "";
  return phoneA.localeCompare(phoneB);
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
};

/* ------ 生命周期 ------ */
onMounted(async () => {
  isLoading.value = true;
  // 同步 userStore 和 baseStore 的数据
  if (
    !userStore.userInfo.laboratories ||
    userStore.userInfo.laboratories.length === 0
  ) {
    await userStore.refreshUserInfo();
  }
  // 将 userStore 的 laboratories 同步到 baseStore
  baseStore.laboratories = userStore.userInfo.laboratories || [];
  isLoading.value = false;
});

/* ------ 搜索 ------ */
// 监听搜索关键字变化，实时筛选
watch(searchKey, (val) => {
  baseStore.searchLab(val.trim());
});

const handleReload = async () => {
  isLoading.value = true;
  await userStore.refreshUserInfo();
  // 同步到 baseStore
  baseStore.laboratories = userStore.userInfo.laboratories || [];
  // 清空搜索关键词
  searchKey.value = "";
  baseStore.searchLab("");
  isLoading.value = false;
  ElMessage.success("操作成功");
};

// ---------------- 弹窗控制 ----------------
const showDialog = ref(false);
const isAdd = ref(true);
const currentRow = ref(null);

// 简介弹窗
const showIntroDialog = ref(false);
const currentIntro = ref("");

const handleViewIntro = (row) => {
  currentIntro.value = row.intro || "";
  showIntroDialog.value = true;
};

const handleAdd = () => {
  isAdd.value = true;
  currentRow.value = null;
  showDialog.value = true;
};

const handleEdit = () => {
  const selection = tableRef.value.getSelectionRows?.() || [];
  if (selection.length !== 1) {
    ElMessage.warning("请选择一条要修改的记录");
    return;
  }
  isAdd.value = false;
  currentRow.value = selection[0];
  showDialog.value = true;
};

const handleDelete = async () => {
  const selection = tableRef.value.getSelectionRows?.() || [];
  if (!selection.length) {
    ElMessage.warning("请至少选择一条要删除的记录");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selection.length} 条实验室记录吗？`,
      "提示",
      { type: "warning" },
    );

    isLoading.value = true;
    const deletePromises = selection.map((row) =>
      baseStore.deleteLaboratory(row.id),
    );

    await Promise.all(deletePromises);

    ElMessage.success("删除成功");
    await userStore.refreshUserInfo();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败，请重试");
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.lab-management-page {
  padding-top: 6px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.el-table) {
  flex: 1;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

:deep(
  .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell
) {
  background-color: #226ee00d !important;
  white-space: nowrap; /* 防止换行破坏居中效果 */
}

.page-header :deep(.el-button) {
  border-radius: 6px;
  padding: 6px 14px;
  margin-left: 0;
  margin-right: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.page-header :deep(.el-button),
.page-header :deep(.el-button.el-button--default) {
  width: 78px;
  margin-right: 15px;
  color: #777777;
  background: #fafafa;
  border: 1px solid #b5d4e6;
}

.page-header :deep(.el-button:hover),
.page-header :deep(.el-button.el-button--default:hover) {
  background: #669ffc;
  border-color: #4b87e6;
  color: #fff;
}

.page-header :deep(.el-button:active),
.page-header :deep(.el-button.el-button--default:active) {
  background: #1a5bb8;
  border-color: #1a5bb8;
}

.page-header :deep(.el-button:focus) {
  outline: none;
  box-shadow: none;
}

/* 详情链接样式 */
.detail-link {
  color: #409eff;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 2px;
}

.detail-link:hover {
  color: #66b1ff;
}

/* 简介弹窗样式 */
:deep(.intro-dialog .el-dialog__header) {
  margin: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.intro-dialog .el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

:deep(.intro-dialog .el-dialog__body) {
  padding: 0;
}

:deep(.intro-dialog .el-dialog__headerbtn) {
  top: 20px;
  right: 20px;
}

.intro-wrapper {
  padding: 32px 28px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.intro-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #226ee0 0%, #4b87e6 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(34, 110, 224, 0.25);
}

.intro-icon .el-icon {
  font-size: 24px;
  color: #fff;
}

.intro-content {
  width: 100%;
  line-height: 1.9;
  font-size: 14.5px;
  color: #374151;
  text-align: center;
  word-break: break-word;
  white-space: pre-wrap;
  background: #fff;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}
</style>
