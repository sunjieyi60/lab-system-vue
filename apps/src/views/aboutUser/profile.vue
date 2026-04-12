<template>
  <div class="account-center-page">
    <UserDialog
      v-model="showDialog"
      :is-add="isAdd"
      :row="currentRow"
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
        placeholder="请输入关键字"
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
      :data="filteredTableData"
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
        prop="username"
        label="账号"
        header-align="center"
        align="center"
      />
      <el-table-column
        prop="realName"
        label="姓名"
        header-align="center"
        align="center"
      />
      <el-table-column
        prop="phone"
        label="手机号码"
        header-align="center"
        align="center"
      />
      <el-table-column
        prop="email"
        label="邮箱"
        header-align="center"
        align="center"
      />
    </el-table>

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
import { ref, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "@/stores/user";
import { apiDeleteUser } from "@/api/user";
import UserDialog from "@/components/UserDialog.vue";

const userStore = useUserStore();

/* ------ 表格数据 ------ */
const tableRef = ref();
const isLoading = ref(false);
const searchKey = ref("");

// 从 store 获取可见用户树数据
const visibleTree = computed(() => userStore.visibleTree || []);

// 搜索过滤后的数据
const filteredTableData = computed(() => {
  let data = visibleTree.value;

  // 搜索过滤
  if (searchKey.value.trim()) {
    const key = searchKey.value.trim().toLowerCase();
    data = data.filter(
      (item) =>
        item.username?.toLowerCase().includes(key) ||
        item.realName?.toLowerCase().includes(key) ||
        item.phone?.includes(key) ||
        item.email?.toLowerCase().includes(key)
    );
  }

  return data;
});

const total = computed(() => filteredTableData.value.length);

// 分页
const currentPage = ref(1);
const pageSize = ref(10);

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
};

/* ------ 生命周期 ------ */
onMounted(async () => {
  // 如果 visibleTree 为空，获取数据
  if (!userStore.visibleTree || userStore.visibleTree.length === 0) {
    isLoading.value = true;
    try {
      await userStore.fetchVisibleTree();
    } catch (error) {
      console.error("获取用户树失败:", error);
    } finally {
      isLoading.value = false;
    }
  }
});

/* ------ 搜索 ------ */
const handleSearch = () => {
  currentPage.value = 1;
};

/* ------ 刷新数据 ------ */
const handleReload = async () => {
  isLoading.value = true;
  try {
    await userStore.fetchVisibleTree();
    ElMessage.success("操作成功");
  } catch (error) {
    console.error("刷新失败:", error);
  } finally {
    isLoading.value = false;
  }
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
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (selection.length !== 1) {
    ElMessage.warning("请选择一条要修改的记录");
    return;
  }
  isAdd.value = false;
  currentRow.value = selection[0];
  showDialog.value = true;
};

const handleDelete = async () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (!selection.length) {
    ElMessage.warning("请至少选择一条要删除的记录");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selection.length} 条用户记录吗？`,
      "提示",
      { type: "warning" }
    );

    isLoading.value = true;
    // 批量删除
    const deletePromises = selection.map((row) => apiDeleteUser(row.id));
    await Promise.all(deletePromises);

    ElMessage.success("删除成功");
    // 刷新列表
    await handleReload();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error(error.response?.data?.msg || "删除失败，请重试");
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.account-center-page {
  padding-top: 6px;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
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
