<template>
  <div class="dashboard">
    <el-row :gutter="30" class="dashboard-row">
      <!-- 左侧：两个卡片 -->
      <el-col :xs="24" :sm="24" :md="6">
        <div class="left-column">
          <el-card class="dashboard-card">
            <template #header>
              <span>基础管理</span>
            </template>
          </el-card>
          <el-card class="dashboard-card">
            <template #header>
              <span>教务管理</span>
            </template>
          </el-card>
        </div>
      </el-col>

      <!-- 中间：一个卡片 -->
      <el-col :xs="24" :sm="24" :md="12">
        <div class="center-column">
          <el-card class="dashboard-card single-card">
            <template #header>
              <span>控制中心</span>
            </template>
          </el-card>
        </div>
      </el-col>

      <!-- 右侧：报警日志 -->
      <el-col :xs="24" :sm="24" :md="6">
        <div class="right-column">
          <el-card class="dashboard-card alarm-card">
            <template #header>
              <span>报警信息</span>
            </template>
            <div class="alarm-content">
              <template v-if="alarmData.length > 0">
                <div
                  v-for="(item, index) in alarmData"
                  :key="index"
                  class="alarm-item"
                >
                  <div class="alarm-time">{{ item.alarmTime }}</div>
                  <div class="alarm-text">{{ item.content }}</div>
                </div>
              </template>
              <el-empty v-else description="暂无报警数据" :image-size="80" />
            </div>
            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[8, 10, 20]"
                layout="prev, pager, next"
                :total="total"
                @current-change="handleCurrentChange"
                small
              />
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { apiGetAlarmLogs } from "@/api/log";

// 报警日志数据
const alarmData = ref([]);
const currentPage = ref(1);
const pageSize = ref(8);
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
  if (!dateStr) return "";
  const [datePart, timePart] = dateStr.split(" ");
  const [year, month, day] = datePart.split("-");
  return `${year}-${parseInt(month)}-${parseInt(day)}-${timePart}`;
};

// 查询报警日志
const fetchAlarmLogs = async () => {
  const { startTime, endTime } = getDefaultTimeRange();

  try {
    const params = {
      startTime: convertToBackendFormat(startTime),
      endTime: convertToBackendFormat(endTime),
      pageNum: currentPage.value,
      pageSize: pageSize.value,
    };

    const res = await apiGetAlarmLogs(params);
    const data = res.data.data;

    alarmData.value = data.list || data.records || [];
    total.value = data.total || 0;
  } catch (error) {
    console.error("获取报警日志失败:", error);
    ElMessage.error(error.response?.data?.msg || "获取数据失败");
  }
};

// 分页变化
const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchAlarmLogs();
};

onMounted(() => {
  fetchAlarmLogs();
});
</script>

<style scoped>
.dashboard {
  height: 100%;
}

.dashboard-row {
  display: flex;
  align-items: stretch;
  height: 100%;
}

.left-column,
.center-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 30px;
  height: 100%;
}

.dashboard-card {
  flex: 1;
  min-height: 180px;
}

.single-card {
  flex: 1;
  min-height: 376px;
}

.alarm-card {
  flex: 1;
  min-height: 376px;
  display: flex;
  flex-direction: column;
}

.alarm-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  padding: 12px;
  height: calc(100% - 40px);
}

.alarm-content {
  flex: 1;
  overflow-y: auto;
}

.alarm-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.alarm-item:last-child {
  border-bottom: none;
}

.alarm-time {
  font-size: 13px;
  color: #0960bd;
  margin-bottom: 4px;
}

.alarm-text {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 12px;
  flex-shrink: 0;
}

.dashboard-card :deep(.el-card__body) {
  padding: 24px;
}

.alarm-card :deep(.el-card__body) {
  padding: 12px;
}

/* 响应式：小屏幕时调整 */
@media (max-width: 768px) {
  .dashboard-card,
  .single-card,
  .alarm-card {
    min-height: 180px;
  }
}
</style>
