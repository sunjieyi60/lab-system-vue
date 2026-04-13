<template>
  <div class="dashboard-container">
    <!-- 筛选区域 -->
    <el-card shadow="hover" class="filter-card">
      <div class="filter-section">
        <div class="filter-item">
          <label>时间:</label>
          <el-date-picker
            v-model="query.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            style="width: 280px"
          />
        </div>

        <div class="filter-item">
          <label>楼栋:</label>
          <el-select
            v-model="query.buildingId"
            clearable
            placeholder="全部"
            style="width: 90px"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="item in buildingList"
              :key="item.id"
              :label="item.buildingName"
              :value="item.id"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label>单位:</label>
          <el-select
            v-model="query.deptId"
            clearable
            placeholder="全部"
            style="width: 90px"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="item in deptList"
              :key="item.id"
              :label="item.deptName"
              :value="item.id"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label>实验室编号:</label>
          <el-select
            v-model="query.laboratoryIds"
            multiple
            collapse-tags
            :collapse-tags-tooltip="false"
            placeholder="请选择"
            style="width: 140px"
            @change="handleLabChange"
          >
            <!-- 添加"全部"选项 -->
            <el-option label="全部" :value="ALL_OPTION_VALUE" />
            <el-option
              v-for="item in laboratoryList"
              :key="item.id"
              :label="item.laboratoryId"
              :value="item.id"
            />
          </el-select>
        </div>

        <el-button type="primary" :loading="loading" @click="loadData">
          查询
        </el-button>
      </div>

      <!-- 显示方式切换 -->
      <div class="display-tabs">
        <el-radio-group v-model="displayType" size="default">
          <el-radio-button label="list">列表显示</el-radio-button>
          <el-radio-button label="chart">饼图显示</el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <!-- 数据列表 - 可折叠展示 -->
    <el-card v-if="displayType === 'list'" shadow="hover" class="data-card">
      <el-collapse v-model="activeCollapse" accordion>
        <el-collapse-item name="summary">
          <!-- 自定义标题区域 - 显示总结信息 -->
          <template #title>
            <div class="summary-header">
              <div class="summary-title">
                <el-icon class="summary-icon"><Info-Filled /></el-icon>
                <span>运行总结</span>
              </div>
              <div v-if="summaryRow" class="summary-content">
                <span class="summary-item">
                  <span class="summary-label">时间范围:</span>
                  <span class="summary-value">{{ summaryRow.timeRange }}</span>
                </span>
                <span class="summary-item">
                  <span class="summary-label">实验室:</span>
                  <span class="summary-value">{{ summaryRow.laboratoryNos }}</span>
                </span>
                <span class="summary-item">
                  <span class="summary-label">单位:</span>
                  <span class="summary-value">{{ summaryRow.deptName }}</span>
                </span>
                <span class="summary-item">
                  <span class="summary-label">设备汇总:</span>
                  <span class="summary-value">{{ summaryRow.acUnitSummary }}</span>
                </span>
                <span class="summary-item highlight">
                  <span class="summary-label">总运行时长:</span>
                  <span class="summary-value">{{ summaryRow.totalHours }} 小时</span>
                </span>
                <span class="summary-item">
                  <span class="summary-label">占比:</span>
                  <span class="summary-value">{{ summaryRow.proportion }}</span>
                </span>
              </div>
              <div v-else class="summary-empty">暂无数据</div>
            </div>
          </template>
          
          <!-- 展开后的详情表格 -->
          <el-table
            :data="tableData"
            stripe
            style="width: 100%; margin-top: 10px;"
            :header-cell-style="{
              background: '#e6f0fa',
              color: '#606266',
              fontWeight: '500',
            }"
            :cell-style="{ padding: '8px 0' }"
          >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column
              prop="timeRange"
              label="时间"
              min-width="220"
              align="center"
            />
            <el-table-column
              prop="laboratoryNo"
              label="实验室编号"
              min-width="120"
              align="center"
            />
            <el-table-column
              prop="deptName"
              label="单位"
              min-width="180"
              align="center"
            />
            <el-table-column
              prop="acUnitName"
              label="空调设备"
              min-width="140"
              align="center"
            />
            <el-table-column
              prop="durationHours"
              label="运行时长(小时)"
              width="120"
              align="center"
            >
              <template #default="{ row }">
                <span style="color: #409eff">{{ row.durationHours }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="proportion"
              label="占比"
              width="80"
              align="center"
            />
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 图表显示 -->
    <el-card v-else shadow="hover" class="data-card chart-card">
      <div class="chart-container">
        <div class="total-hours">
          <span class="label">总运行时长:</span>
          <span class="value">{{ totalHours }}</span>
          <span class="unit">小时</span>
        </div>
        <div ref="chartRef" style="height: 350px; width: 100%"></div>
        <div class="chart-title">空调运行时长分布</div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  onMounted,
  watch,
  onBeforeUnmount,
} from "vue";
import { InfoFilled } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores";
import * as echarts from "echarts";
import { getAirConditionRunning } from "@/api/analysis";

const userStore = useUserStore();

// "全部"选项的特殊值
const ALL_OPTION_VALUE = "___ALL___";

// 获取实际要传给后端的实验室ID列表
const getLaboratoryIdsForRequest = () => {
  const selectedIds = query.laboratoryIds;
  // 如果选了"全部"或者没有选择任何实验室，则返回所有实验室ID
  if (selectedIds.includes(ALL_OPTION_VALUE) || selectedIds.length === 0) {
    return getAllLaboratoryIds();
  }
  return selectedIds;
};

// 显示方式：list=列表, chart=图表
const displayType = ref("list");
// 监听实验室选择变化
const handleLabChange = (val) => {
  // 如果选了"全部"
  if (val.includes(ALL_OPTION_VALUE)) {
    // 如果之前没有选"全部"，现在选了，则只保留"全部"
    // 如果之前选了"全部"，现在又选了其他，则移除"全部"
    const prevHasAll = query.laboratoryIds.includes(ALL_OPTION_VALUE);
    const currentHasAll = val.includes(ALL_OPTION_VALUE);
    
    if (currentHasAll && !prevHasAll) {
      // 刚选了"全部"，清除其他选择
      query.laboratoryIds = [ALL_OPTION_VALUE];
    } else if (currentHasAll && prevHasAll && val.length > 1) {
      // 选了"全部"后又选了其他，移除"全部"
      query.laboratoryIds = val.filter(id => id !== ALL_OPTION_VALUE);
    }
  }
  
  // 如果清空（取消所有选择），则自动选择"全部"
  if (!val || val.length === 0) {
    query.laboratoryIds = [ALL_OPTION_VALUE];
  }
};

// 查询条件
const query = reactive({
  timeRange: [],
  buildingId: "",
  deptId: "",
  laboratoryIds: [],
});

// 数据
const loading = ref(false);
const tableData = ref([]);
const chartSegments = ref([]);
const totalHours = ref(0);
const summaryRow = ref(null);
const activeCollapse = ref([]); // 折叠面板激活项

// 图表
const chartRef = ref();
let chart = null;

// 下拉数据
const buildingList = computed(() => userStore.getBuildingList);
const deptList = computed(() =>
  (userStore.userInfo.depts || []).map((item) => item.dept),
);
const laboratoryList = computed(() => userStore.getLaboratoryList);

// 是否显示合计行
const showSummary = computed(() => summaryRow.value !== null);

// 当数据加载完成后，自动展开总结面板
watch(summaryRow, (val) => {
  if (val) {
    activeCollapse.value = ['summary'];
  }
}, { immediate: true });

// 获取默认时间范围（当前月的起始和结束）
const getDefaultTimeRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startOfMonth = new Date(year, month, 1, 0, 0);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59);

  const format = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d} ${h}:${min}`;
  };

  return [format(startOfMonth), format(endOfMonth)];
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      startTime: query.timeRange[0] || "",
      endTime: query.timeRange[1] || "",
      buildingId: query.buildingId || null,
      deptId: query.deptId || null,
      laboratoryIds: getLaboratoryIdsForRequest(),
      deviceIds: [],
    };

    const res = await getAirConditionRunning(params);
    if (res.data?.ok) {
      const data = res.data.data;
      tableData.value = data.list || [];
      chartSegments.value = data.chartSegments || [];
      totalHours.value = data.totalHours || 0;
      summaryRow.value = data.summaryRow || null;

      // 如果当前是图表模式，刷新图表
      if (displayType.value === "chart") {
        setTimeout(initChart, 100);
      }
    } else {
      tableData.value = [];
      chartSegments.value = [];
      totalHours.value = 0;
      summaryRow.value = null;
    }
  } catch (error) {
    console.error("获取空调运行数据失败:", error);
    tableData.value = [];
    chartSegments.value = [];
    totalHours.value = 0;
    summaryRow.value = null;
  } finally {
    loading.value = false;
  }
};

// 获取所有实验室ID
const getAllLaboratoryIds = () => {
  return laboratoryList.value.map((item) => item.id);
};

// 监听实验室列表变化，初始化时默认选中"全部"
watch(
  laboratoryList,
  (newVal) => {
    if (newVal && newVal.length > 0 && query.laboratoryIds.length === 0) {
      query.laboratoryIds = [ALL_OPTION_VALUE];
    }
  },
  { immediate: true }
);


// 初始化饼图
const initChart = () => {
  if (!chartRef.value) return;

  if (chart) {
    chart.dispose();
  }

  chart = echarts.init(chartRef.value);

  const pieData = chartSegments.value.map((item) => ({
    value: item.hours,
    name: item.name,
    proportion: item.proportion,
  }));

  const colors = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];

  const option = {
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        return `${params.name}: ${params.value} 小时 (${params.data.proportion}%)`;
      },
    },
    legend: {
      orient: "vertical",
      right: "10%",
      top: "center",
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 14,
        color: "#606266",
      },
    },
    series: [
      {
        name: "运行时长分布",
        type: "pie",
        radius: ["0%", "70%"],
        center: ["40%", "50%"],
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        label: {
          show: true,
          position: "inner",
          formatter: (params) => {
            return params.percent > 5 ? `${params.percent}%` : "";
          },
          fontSize: 14,
          fontWeight: "bold",
          color: "#fff",
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: "#fff",
        },
        color: colors,
      },
    ],
  };

  chart.setOption(option);
};

// 监听显示类型变化
watch(displayType, (val) => {
  if (val === "chart") {
    setTimeout(initChart, 100);
  }
});

// 监听窗口大小变化
const handleResize = () => {
  chart?.resize();
};

onMounted(async () => {
  await userStore.refreshUserInfo();
  query.timeRange = getDefaultTimeRange();

  // laboratoryIds 通过 watch 自动初始化为 [ALL_OPTION_VALUE]

  loadData();
  window.addEventListener("resize", handleResize);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  chart?.dispose();
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 筛选卡片 */
.filter-card {
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 15px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-item label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}


/* 显示方式切换 */
.display-tabs {
  display: flex;
  justify-content: flex-start;
}

.display-tabs
  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

/* 数据卡片 */
.data-card {
  border-radius: 8px;
}

/* 图表卡片 */
.chart-card {
  padding: 20px;
}

.chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.total-hours {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.total-hours .label {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.total-hours .value {
  font-size: 32px;
  color: #3b82f6;
  font-weight: bold;
}

.total-hours .unit {
  font-size: 14px;
  color: #606266;
}

.chart-title {
  margin-top: 10px;
  font-size: 14px;
  color: #303133;
}

/* 折叠面板样式 */
.summary-header {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  padding: 0 10px;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex-shrink: 0;
}

.summary-icon {
  color: #3b82f6;
  font-size: 18px;
}

.summary-content {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-item.highlight .summary-value {
  color: #3b82f6;
  font-weight: 600;
  font-size: 16px;
}

.summary-label {
  font-size: 13px;
  color: #606266;
}

.summary-value {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.summary-empty {
  font-size: 14px;
  color: #909399;
}

/* 折叠面板深度样式 */
:deep(.el-collapse-item__header) {
  height: auto;
  min-height: 48px;
  padding: 10px 0;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f0fa 100%);
  border-radius: 6px;
}

:deep(.el-collapse-item__arrow) {
  margin-right: 15px;
  font-size: 16px;
  color: #3b82f6;
}

:deep(.el-collapse-item__content) {
  padding: 10px 0;
}

:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item) {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}
</style>
