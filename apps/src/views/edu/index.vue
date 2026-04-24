<template>
  <div class="edu-term-page">
    <div class="page-header">
      <el-button @click="openAdd">添加</el-button>
      <el-button :disabled="selected.length !== 1" @click="batchMod">
        修改
      </el-button>
      <el-button :disabled="!selected.length" @click="batchDel">
        删除
      </el-button>
      <el-input
        placeholder="请输入学期名称"
        style="width: 200px; margin-left: 20px"
        v-model="searchKey"
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

    <div class="table-box">
      <el-table
      :data="tableData"
      row-key="id"
      @selection-change="selected = $event"
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
        min-width="55"
        header-align="center"
        align="center"
      />
      <el-table-column
        type="index"
        label="序号"
        min-width="60"
        header-align="center"
        align="center"
      />
      <el-table-column
        prop="name"
        label="学年学期"
        min-width="160"
        header-align="center"
        align="center"
      />
      <el-table-column
        prop="startDate"
        label="起始时间"
        min-width="110"
        header-align="center"
        align="center"
      />
      <el-table-column
        prop="endDate"
        label="截止时间"
        min-width="110"
        header-align="center"
        align="center"
      />
    </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 弹窗：只绑定 success 事件 -->
    <TermDialog
      v-model="showDlg"
      :row="currentRow"
      :is-batch="isBatch"
      @success="submitMod"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useEduStore } from "@/stores";
import TermDialog from "@/views/edu/components/TermDialog.vue";

/* ---------- 基础分页 & 搜索 ---------- */
const searchKey = ref("");
const page = ref(1);
const size = ref(10);
const total = ref(0);
const selected = ref([]);
const showDlg = ref(false);
const currentRow = ref(null);
const isBatch = ref(false);

const eduStore = useEduStore();

/* 计算属性：前端搜索 + 分页 */
const tableData = computed(() => {
  const list = (eduStore.termList || []).filter((t) =>
    t.name?.toLowerCase().includes(searchKey.value.toLowerCase()),
  );
  total.value = list.length;
  const start = (page.value - 1) * size.value;
  return list.slice(start, start + size.value);
});

/* 加载数据 */
async function loadData() {
  try {
    await eduStore.initTermData();
  } catch (e) {
    ElMessage.error("加载学期列表失败");
    console.error(e);
  }
}

/* 分页处理 */
const handleSizeChange = (val) => {
  size.value = val;
  page.value = 1;
};

const handlePageChange = (val) => {
  page.value = val;
};

onMounted(loadData);



/* ---------- 新增 / 批量修改 ---------- */
function openAdd() {
  currentRow.value = null;
  isBatch.value = false;
  showDlg.value = true;
}

function batchMod() {
  if (selected.value.length !== 1) {
    ElMessage.warning("请选中一条记录进行修改");
    return;
  }

  // 单条修改模式
  currentRow.value = {
    ...selected.value[0],
  };

  isBatch.value = false;
  showDlg.value = true;
}

/* 批量删除 */
async function batchDel() {
  if (!selected.value.length) return;

  // 先保存选中数量，避免删除过程中被清空
  const deleteCount = selected.value.length;

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${deleteCount} 个学期吗？此操作不可恢复！`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning",
        confirmButtonClass: "el-button--danger",
      },
    );

    const results = await Promise.all(selected.value.map((t) => eduStore.removeTerm(t.id)));
    const successCount = results.filter(r => r).length;
    ElMessage.success(`已删除 ${successCount} 条`);
    selected.value = []; // 清空选中
    await loadData();
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error("批量删除失败");
      console.error(err);
    }
  }
}

/* 提交新增/修改（单条 or 批量） */
async function submitMod(form) {
  try {
    if (isBatch.value) {
      /* 批量修改：只改时间，循环调用 modifyTerm */
      await Promise.all(
        selected.value.map((t) =>
          eduStore.modifyTerm(t.id, {
            name: t.name, // 保持原名称
            startDate: form.startDate, // 统一字段名
            endDate: form.endDate,
          }),
        ),
      );
      isBatch.value = false;
      selected.value = [];
    } else if (currentRow.value?.id) {
      /* 单条修改 */
      await eduStore.modifyTerm(currentRow.value.id, form);
      ElMessage.success("修改成功");
    } else {
      /* 新增：调用 addNewTerm */
      await eduStore.addNewTerm(form);
      ElMessage.success("新增成功");
    }
    showDlg.value = false;
    await loadData();
  } catch (err) {
    ElMessage.error("操作失败");
    console.error(err);
  }
}
</script>

<style scoped>
.edu-term-page {
  padding-top: 6px;
}
:deep(
  .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell
) {
  background-color: #226ee00d !important;
}
.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
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
}

/* 页面布局 - 分页器固定在底部 */
.edu-term-page {
  padding-top: 6px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 分页器固定在底部 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

/* 表格区域占据剩余空间 */
:deep(.el-table) {
  flex: 1;
  box-shadow: none;
}
@media (max-width: 768px) {
  .edu-term-page {
    padding: 8px;
    height: auto;
  }
  .page-header {
    flex-wrap: wrap;
  }
}
</style>
