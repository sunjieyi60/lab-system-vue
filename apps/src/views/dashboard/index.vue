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
          <el-card
            v-loading="facilityLoading"
            element-loading-text="加载中..."
            class="dashboard-card facility-card"
          >
            <template #header>
              <span>实验室智能设施</span>
            </template>
            <div class="facility-content">
              <template v-if="facilityList.length">
                <el-table
                  :data="facilityList"
                  stripe
                  style="width: 100%"
                  :header-cell-style="{
                    background: '#226EE04D',
                    color: '#333',
                    height: '40px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }"
                  :cell-style="{ textAlign: 'center', fontSize: '13px' }"
                  :row-style="{ height: '44px' }"
                >
                  <el-table-column
                    prop="name"
                    label="类型"
                    min-width="80"
                  />
                  <el-table-column
                    prop="total"
                    label="总数"
                    min-width="60"
                  />
                  <el-table-column
                    prop="open"
                    label="开启"
                    min-width="60"
                  />
                  <el-table-column
                    prop="online"
                    label="在线"
                    min-width="60"
                  />
                </el-table>
              </template>
              <el-empty
                v-else
                description="暂无数据"
                :image-size="60"
              />
            </div>
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
              <div class="alarm-header">
                <span>报警信息</span>
                <el-select
                  v-model="timeRange"
                  size="small"
                  style="width: 90px"
                  @change="handleTimeRangeChange"
                >
                  <el-option label="最近一天" value="day" />
                  <el-option label="最近一周" value="week" />
                  <el-option label="最近一月" value="month" />
                  <el-option label="全部" value="all" />
                </el-select>
              </div>
            </template>
            <div
              v-loading="isLoading"
              element-loading-text="加载中..."
              class="alarm-content"
            >
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
import { ref, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { apiGetAlarmLogs } from "@/api/log";
import { get_overview_device_statistics } from "@/api/overview";

// 报警日志数据
const alarmData = ref([]);
const currentPage = ref(1);
const pageSize = ref(8);
const total = ref(0);
const timeRange = ref("week");
const isLoading = ref(false);

// 实验室智能设施数据
const facilityStats = ref({});
const facilityLoading = ref(false);

const deviceTypeMap = {
  Light: "照明",
  AirCondition: "空调",
  Sensor: "传感器",
  CircuitBreak: "断路器",
  Access: "门禁",
};

const getOpenCount = (devices) => {
  if (!Array.isArray(devices) || !devices.length) return "-";
  const hasRecord = devices.some((d) => d.deviceRecord !== undefined);
  if (!hasRecord) return "-";
  return devices.filter((d) => d.deviceRecord?.data?.isOpen === true).length;
};

const facilityList = computed(() => {
  return Object.entries(facilityStats.value).map(([key, value]) => ({
    key,
    name: deviceTypeMap[key] || key,
    total: value.total || 0,
    online: value.online || 0,
    open: getOpenCount(value.devices),
  }));
});

// 根据选择的时间范围计算起止时间
const getTimeRange = () => {
  const end = new Date();
  const start = new Date();

  switch (timeRange.value) {
    case "day":
      start.setDate(start.getDate() - 1);
      break;
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setMonth(start.getMonth() - 1);
      break;
    case "all":
      start.setFullYear(2000, 0, 1);
      break;
    default:
      start.setDate(start.getDate() - 7);
  }

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
  const { startTime, endTime } = getTimeRange();

  isLoading.value = true;
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
  } finally {
    isLoading.value = false;
  }
};

// 分页变化
const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchAlarmLogs();
};

// 时间范围变化
const handleTimeRangeChange = () => {
  currentPage.value = 1;
  fetchAlarmLogs();
};

// 获取实验室智能设施统计
const fetchFacilityStats = async () => {
  facilityLoading.value = true;
  try {
    const res = await get_overview_device_statistics();
    facilityStats.value = res.data?.data || {};
  } catch (error) {
    console.error("获取实验室智能设施统计失败:", error);
    ElMessage.error(error.response?.data?.msg || "获取数据失败");
    facilityStats.value = {};
  } finally {
    facilityLoading.value = false;
  }
};

onMounted(() => {
  fetchAlarmLogs();
  fetchFacilityStats();
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

.alarm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.facility-card :deep(.el-card__body) {
  padding: 16px;
  height: calc(100% - 40px);
}

.facility-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

.facility-content :deep(.el-table) {
  border-radius: 4px;
  overflow: hidden;
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
