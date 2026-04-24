<template>
  <div class="dashboard">
    <el-row :gutter="30" class="dashboard-row">
      <!-- 左侧：两个卡片 -->
      <el-col :xs="24" :sm="24" :md="6">
        <div class="left-column">
          <el-card class="dashboard-card lab-card">
            <template #header>
              <span>实验室</span>
            </template>
            <div class="lab-stat-content">
              <div class="stat-item">
                <div class="stat-value">{{ userStore.userInfo?.buildings?.length || "暂无数据" }}</div>
                <div class="stat-label">楼栋数量</div>
              </div>
            </div>
          </el-card>
          <el-card v-loading="facilityLoading" element-loading-text="加载中..." class="dashboard-card facility-card">
            <template #header>
              <span>实验室智能设施</span>
            </template>
            <div class="facility-content">
              <template v-if="facilityList.length">
                <el-table :data="facilityList" stripe class="data-table full-table">
                  <el-table-column prop="name" label="类型" min-width="80" />
                  <el-table-column prop="total" label="总数" min-width="60" />
                  <el-table-column prop="open" label="开启" min-width="60" />
                  <el-table-column prop="online" label="在线" min-width="60" />
                </el-table>
              </template>
              <el-empty v-else description="暂无数据" :image-size="60" />
            </div>
          </el-card>
        </div>
      </el-col>

      <!-- 中间：一个卡片 -->
      <el-col :xs="24" :sm="24" :md="12">
        <div class="center-column">
          <el-card class="dashboard-card single-card" v-loading="labOverviewLoading" element-loading-text="加载中...">
            <template #header>
              <div class="control-header">
                <span>实验室运行信息</span>
                <div class="filter-selects">
                  <el-select v-model="labFilterType" size="small" class="select-filter" @change="handleLabFilterChange">
                    <el-option label="全部" value="all" />
                    <el-option label="当前有课" value="hasCourse" />
                    <el-option label="即将上课" value="soon" />
                  </el-select>
                  <el-select v-model="selectedSemester" size="small" class="select-semester"
                    @change="handleSemesterChange">
                    <el-option v-for="item in termList" :key="item.id" :label="item.name" :value="item.id" />
                  </el-select>
                </div>
              </div>
            </template>
            <div class="lab-table-content">
              <el-table :data="pagedLabData" stripe class="data-table full-table">
                <el-table-column prop="labId" label="实验室" min-width="80" />
                <el-table-column prop="course" label="课程" min-width="120" show-overflow-tooltip />
                <el-table-column prop="access" label="房门" min-width="60" />
                <el-table-column prop="circuitBreak" label="空开" min-width="60" />
                <el-table-column prop="light" label="开关" min-width="60" />
                <el-table-column prop="airCondition" label="空调" min-width="60" />
                <el-table-column prop="env" label="环境信息" min-width="160" show-overflow-tooltip />
              </el-table>
            </div>
            <div class="pagination-wrapper">
              <el-pagination v-model:current-page="labCurrentPage" v-model:page-size="labPageSize"
                :page-sizes="[8, 10, 20]" layout="prev, pager, next" :total="labTotal"
                @current-change="handleLabCurrentChange" small />
            </div>
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
                <el-select v-model="timeRange" size="small" class="select-time" @change="handleTimeRangeChange">
                  <el-option label="最近一天" value="day" />
                  <el-option label="最近一周" value="week" />
                  <el-option label="最近一月" value="month" />
                  <el-option label="全部" value="all" />
                </el-select>
              </div>
            </template>
            <div v-loading="isLoading" element-loading-text="加载中..." class="alarm-content">
              <template v-if="alarmData.length > 0">
                <div v-for="(item, index) in alarmData" :key="index" class="alarm-item">
                  <div class="alarm-time">{{ item.alarmTime }}</div>
                  <el-tooltip
                    v-if="item.content && item.content.length > 40"
                    :content="item.content"
                    placement="top"
                    effect="dark"
                  >
                    <div class="alarm-text">{{ item.content }}</div>
                  </el-tooltip>
                  <div v-else class="alarm-text">{{ item.content }}</div>
                </div>
              </template>
              <el-empty v-else description="暂无报警数据" :image-size="80" />
            </div>
            <div class="pagination-wrapper">
              <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[8, 10, 20]"
                layout="prev, pager, next" :total="total" @current-change="handleCurrentChange" small />
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { useUserStore, useEduStore } from "@/stores";
import { apiGetAlarmLogs } from "@/api/log";
import { get_overview_device_statistics, get_overview_laboratories, get_overview_laboratories_soon } from "@/api/overview";

const userStore = useUserStore();
const eduStore = useEduStore();

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

// 学期选择
const termList = computed(() => eduStore.termList);
const selectedSemester = ref(null);

// 实验室概览数据
const allLabData = ref([]);
const overviewLabData = ref([]);
const labOverviewLoading = ref(false);
const labCurrentPage = ref(1);
const labPageSize = ref(8);
const labFilterType = ref("all");

const labTotal = computed(() => overviewLabData.value?.length || 0);

const labTableData = computed(() => {
  return (overviewLabData.value || []).map((item) => ({
    labId: item.laboratory?.laboratoryId || "-",
    course: item.course ? course : "当前无课",
    access: getDeviceRatio(item.devices, "Access"),
    circuitBreak: getDeviceRatio(item.devices, "CircuitBreak"),
    light: getDeviceRatio(item.devices, "Light"),
    airCondition: getDeviceRatio(item.devices, "AirCondition"),
    env: getEnvText(item.env),
  }));
});

const pagedLabData = computed(() => {
  const start = (labCurrentPage.value - 1) * labPageSize.value;
  return labTableData.value.slice(start, start + labPageSize.value);
});

const handleSemesterChange = (val) => {
  console.log("选中学期:", val);
  loadLabData(val);
};

const handleLabFilterChange = () => {
  loadLabData(selectedSemester.value);
};

const handleLabCurrentChange = (val) => {
  labCurrentPage.value = val;
};

const getDeviceRatio = (devices, type) => {
  const d = devices?.[type];
  if (!d) return "0/0";
  return `${d.isOpen || 0}/${d.total || 0}`;
};

const getEnvText = (env) => {
  if (!env || !env.data) return "-";
  const { temperature, humidity, light } = env.data;
  const parts = [];
  if (temperature !== undefined && temperature !== null) parts.push(`${temperature}℃`);
  if (humidity !== undefined && humidity !== null) parts.push(`${humidity}%`);
  if (light !== undefined && light !== null) parts.push(`${light}Lux`);
  return parts.join("，") || "-";
};

const deviceTypeMap = {
  Light: "照明",
  AirCondition: "空调",
  CircuitBreak: "断路器",
  Access: "门禁",
  Sensor: "传感器",
};

const getOpenCount = (value) => {
  if (value.isOpen === null || value.isOpen === undefined) return "-";
  return value.isOpen;
};

const facilityList = computed(() => {
  return Object.entries(facilityStats.value).map(([key, value]) => ({
    key,
    name: deviceTypeMap[key] || key,
    total: value.total || 0,
    online: value.online || 0,
    open: getOpenCount(value),
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

// 刷新所有数据
const refreshAllData = () => {
  userStore.refreshUserInfo();
  if (selectedSemester.value) {
    loadLabData(selectedSemester.value);
  }
  fetchAlarmLogs();
  fetchFacilityStats();
};

let refreshTimer = null;

onMounted(async () => {
  await userStore.refreshUserInfo();
  if (eduStore.termList.length === 0) {
    await eduStore.initTermData();
  }
  selectedSemester.value = eduStore.currentTerm?.id || null;
  if (selectedSemester.value) {
    await loadLabData(selectedSemester.value);
  }
  await fetchAlarmLogs();
  await fetchFacilityStats();

  refreshTimer = setInterval(() => {
    console.log("[Dashboard] 定时刷新数据...");
    refreshAllData();
  }, 300000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    console.log("[Dashboard] 定时器已销毁");
  }
});

// 加载实验室概览数据
const loadLabData = async (semesterId) => {
  if (!semesterId) return;
  labOverviewLoading.value = true;
  try {
    if (labFilterType.value === "soon") {
      const res = await get_overview_laboratories_soon(semesterId);
      overviewLabData.value = res.data?.data || [];
      console.log("[loadLabData] 即将上课:", res);
    } else {
      const res = await get_overview_laboratories(semesterId);
      allLabData.value = res.data?.data || [];
      if (labFilterType.value === "hasCourse") {
        overviewLabData.value = allLabData.value.filter((item) => item.hasCourse);
      } else {
        overviewLabData.value = allLabData.value;
      }
      console.log("[loadLabData] 全部/当前有课:", res);
    }
    labCurrentPage.value = 1;
    console.log("[loadLabData] 解析后数据:", overviewLabData.value);
  } catch (error) {
    console.error("[loadLabData] 获取实验室概览信息失败:", error);
    ElMessage.error(error.response?.data?.msg || "获取实验室概览信息失败");
    overviewLabData.value = [];
  } finally {
    labOverviewLoading.value = false;
  }
};
</script>

<style scoped>
.dashboard {
  height: 100%;
  padding: 16px 8px;
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
  display: flex;
  flex-direction: column;
}

.single-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  padding: 12px;
  height: calc(100% - 40px);
}

.lab-table-content {
  flex: 1;
  overflow: hidden;
  overflow-x: auto;
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
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 12px;
  flex-shrink: 0;
}

.alarm-header,
.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-selects {
  display: flex;
  gap: 8px;
}

.lab-card :deep(.el-card__body) {
  padding: 16px;
  height: calc(100% - 40px);
}

.lab-stat-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 48px;
  font-weight: 700;
  color: #226ee0;
  line-height: 1;
}

.stat-label {
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
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
  overflow-x: auto;
}

.facility-content :deep(.el-table) {
  border-radius: 4px;
  overflow: hidden;
}

.data-table.full-table {
  width: 100%;
  height: 100%;
}

.data-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: #226EE04D;
  color: #333;
  height: 40px;
  font-size: 13px;
  font-weight: bold;
  text-align: center;
}

.data-table :deep(.el-table__cell) {
  text-align: center;
  font-size: 13px;
}

.data-table :deep(.el-table__row) {
  height: 44px;
}

.select-filter {
  width: 110px;
}

.select-semester {
  width: 180px;
}

.select-time {
  width: 90px;
}

/* 响应式：小屏幕时调整 */
@media (max-width: 768px) {
  .dashboard {
    padding: 8px 4px;
  }
  .dashboard-row {
    flex-direction: column;
    height: auto;
    gap: 12px;
  }
  .left-column,
  .center-column,
  .right-column {
    gap: 12px;
  }
  .stat-value {
    font-size: 36px;
  }
  .control-header,
  .alarm-header {
    flex-direction: column;
  }
  .filter-selects {
    width: 100%;
  }
  .filter-selects .el-select {
    flex: 1;
  }

  /* 表格横向滚动 */
  .facility-content,
  .lab-table-content {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .data-table {
    width: auto !important;
    min-width: 500px;
  }
}
</style>
