<template>
  <div class="log-query-page">
    <!-- 搜索条件区 -->
    <div class="search-area">
      <span class="search-label">时间：</span>
      <el-date-picker
        v-model="searchForm.startTime"
        type="datetime"
        placeholder="开始时间"
        format="YYYY-MM-DD HH:mm"
        value-format="YYYY-MM-DD HH:mm"
        style="width: 160px"
        :clearable="false"
      />
      <span class="search-separator">至</span>
      <el-date-picker
        v-model="searchForm.endTime"
        type="datetime"
        placeholder="结束时间"
        format="YYYY-MM-DD HH:mm"
        value-format="YYYY-MM-DD HH:mm"
        style="width: 160px"
        :clearable="false"
      />

      <span class="search-label" style="margin-left: 20px">报警类型：</span>
      <el-select
        v-model="searchForm.alarmType"
        placeholder="全部"
        style="width: 120px"
        clearable
      >
        <el-option
          v-for="item in alarmTypeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>

      <el-button type="primary" :loading="isLoading" @click="handleSearch">
        查询
      </el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-box" v-loading="isLoading" element-loading-text="加载中...">
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
      @row-click="handleRowClick"
    >
      <el-table-column type="expand" width="50" align="center">
        <template #default="{ row }">
          <div class="expand-content">
            <div class="expand-label">报警内容：</div>
            <div class="expand-detail">{{ row.content }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="alarmTime"
        label="报警时间"
        header-align="center"
        align="center"
      />
      <el-table-column
        prop="alarmType"
        label="报警类型"
        header-align="center"
        align="center"
      />
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
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { apiGetAlarmLogs } from "@/api/log";

// 搜索表单
const searchForm = ref({
  startTime: "",
  endTime: "",
  alarmType: "",
});

// 报警类型选项
const alarmTypeOptions = [
  { label: "全部", value: "" },
  { label: "门禁报警", value: "门禁报警" },
  { label: "电气报警", value: "电气报警" },
  { label: "电灯开关报警", value: "电灯开关报警" },
  { label: "中央空调报警", value: "中央空调报警" },
  { label: "环境报警", value: "环境报警" },
];

const tableRef = ref(null);
const tableData = ref([]);
const isLoading = ref(false);

// 点击行展开/收起
const handleRowClick = (row) => {
  tableRef.value?.toggleRowExpansion(row);
};
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 获取默认时间范围（最近7天）
const getDefaultTimeRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    startTime: formatDate(start),
    endTime: formatDate(end),
  };
};

// 格式化日期为 YYYY-MM-DD HH:mm
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 将 YYYY-MM-DD HH:mm 转换为 YYYY-M-d-HH:mm
const convertToBackendFormat = (dateStr) => {
  if (!dateStr) return '';
  const [datePart, timePart] = dateStr.split(' ');
  const [year, month, day] = datePart.split('-');
  return `${year}-${parseInt(month)}-${parseInt(day)}-${timePart}`;
};

// 查询报警日志
const fetchLogs = async () => {
  // 校验时间必填
  if (!searchForm.value.startTime || !searchForm.value.endTime) {
    ElMessage.warning("请选择时间范围");
    return;
  }

  isLoading.value = true;
  try {
    const params = {
      startTime: convertToBackendFormat(searchForm.value.startTime),
      endTime: convertToBackendFormat(searchForm.value.endTime),
      pageNum: currentPage.value,
      pageSize: pageSize.value,
    };

    // 可选参数
    if (searchForm.value.alarmType) {
      params.alarmType = searchForm.value.alarmType;
    }

    const res = await apiGetAlarmLogs(params);
    const data = res.data.data;
    
    // 假设返回格式: { list: [], total: 0 }
    tableData.value = data.list || data.records || [];
    total.value = data.total || 0;
  } catch (error) {
    console.error("获取报警日志失败:", error);
    ElMessage.error(error.response?.data?.msg || "获取数据失败");
  } finally {
    isLoading.value = false;
  }
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchLogs();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchLogs();
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchLogs();
};

onMounted(() => {
  // 设置默认时间范围
  const { startTime, endTime } = getDefaultTimeRange();
  searchForm.value.startTime = startTime;
  searchForm.value.endTime = endTime;
  
  // 加载数据
  fetchLogs();
});
</script>

<style scoped>
.log-query-page {
  padding-top: 6px;
}

.search-area {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.search-label {
  font-size: 14px;
  color: #333;
}

.search-separator {
  margin: 0 8px;
  color: #666;
}

.expand-content {
  padding: 12px 24px;
  background: #f5f7fa;
  display: flex;
  align-items: flex-start;
}

.expand-label {
  font-weight: 500;
  color: #333;
  margin-right: 8px;
  white-space: nowrap;
}

.expand-detail {
  color: #666;
  line-height: 1.6;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

/* 页面布局 */
.log-query-page {
  padding-top: 6px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 表格区域 - 占据剩余空间 */
:deep(.el-table) {
  flex: 1;
}

/* 旧样式保留 */
.pagination-wrapper-old {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(
    .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell
  ) {
  background-color: #226ee00d !important;
}

:deep(.el-button--primary) {
  margin-left: 20px;
}
@media (max-width: 768px) {
  .log-query-page {
    padding: 8px;
    height: auto;
  }
  .search-area {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
    gap: 8px;
  }
  .search-area > * {
    flex-shrink: 0;
  }
  .search-label {
    white-space: nowrap;
  }
}
</style>
