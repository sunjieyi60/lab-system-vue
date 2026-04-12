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
    </div>

    <!-- 数据表格 -->
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
    >
      <el-table-column
        type="selection"
        width="55"
        header-align="center"
        align="center"
      />
      <el-table-column
        prop="laboratoryId"
        label="实验室编号"
        width="110px"
        header-align="center"
        align="center"
      />
      <el-table-column
        prop="laboratoryName"
        label="实验室名称"
        width="140px"
        header-align="center"
        align="center"
      />
      <el-table-column label="所属单位" header-align="center" align="center">
        <template #default="{ row }">
          {{ getDeptNamesByIds(row.belongToDepts, deptList).join("、") }}
        </template>
      </el-table-column>
      <el-table-column label="所在楼栋" header-align="center" align="center">
        <template #default="{ row }">
          {{ getBuildingNameById(row.belongToBuilding, buildingList) }}
        </template>
      </el-table-column>
      <el-table-column
        label="负责人"
        header-align="center"
        align="center"
        width="120"
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
        header-align="center"
        align="center"
        width="140"
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
        header-align="center"
        align="center"
      />
      <el-table-column
        prop="classCapacity"
        label="课容量"
        header-align="center"
        align="center"
      />
      <el-table-column
        prop="area"
        label="面积"
        header-align="center"
        align="center"
      />
      <el-table-column
        prop="intro"
        label="实验室简介"
        header-align="center"
        align="center"
      />
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import LabDialog from "@/components/LabDialog.vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { getBuildingNameById, getDeptNamesByIds } from "@/maps/baseMap";
import { useUserStore } from "@/stores/user";
import { useBaseStore } from "@/stores/base";

const userStore = useUserStore(); // 数据来源：用户信息、实验室列表
const baseStore = useBaseStore(); // 操作方法：增删改

/* ------ 表格数据 ------ */
const tableRef = ref();
// 从 userStore 获取实验室数据
const tableData = computed(() => userStore.userInfo.laboratories || []);
const searchKey = ref("");
const isLoading = ref(false);
const buildingList = computed(() => userStore.userInfo.buildings || []);
const deptList = computed(() => userStore.userInfo.depts || []);

/* ------ 生命周期 ------ */
onMounted(async () => {
  // 如果 laboratories 为空，刷新用户数据
  if (
    !userStore.userInfo.laboratories ||
    userStore.userInfo.laboratories.length === 0
  ) {
    isLoading.value = true;
    await userStore.refreshUserInfo();
    isLoading.value = false;
  }
});

/* ------ 搜索 ------ */
const handleSearch = () => {
  baseStore.searchLab(searchKey.value.trim());
};

const handleReload = async () => {
  isLoading.value = true;
  await userStore.refreshUserInfo(); // 使用 store 方法刷新
  isLoading.value = false;
  ElMessage.success("操作成功");
};

// ---------------- 弹窗控制 ----------------
const showDialog = ref(false);
const isAdd = ref(true);
const currentRow = ref(null);

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
    // 还用 baseStore 删除
    const deletePromises = selection.map((row) =>
      baseStore.deleteLaboratory(row.id),
    );

    await Promise.all(deletePromises);

    ElMessage.success("删除成功");
    // 删除后刷新 userStore 数据
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
</style>
