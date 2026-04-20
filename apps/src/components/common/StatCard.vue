<template>
  <div class="stat-row">
    <!-- 左侧：总数展示 -->
    <div class="total-section">
      <div class="total-label">总数</div>
      <div class="total-title">{{ title }}</div>
      <div class="total-value">{{ total.toLocaleString() }}</div>
    </div>

    <!-- 右侧：三个图表 -->
    <div class="charts-section">
      <!-- 周次图表 -->
      <div class="chart-item">
        <div class="chart-title">{{ weekChartTitle }}</div>
        <div ref="weekChartRef" class="chart-container"></div>
      </div>

      <!-- 星期图表 -->
      <div class="chart-item">
        <div class="chart-title">{{ weekdayChartTitle }}</div>
        <div ref="weekdayChartRef" class="chart-container"></div>
      </div>

      <!-- 节次图表 -->
      <div class="chart-item">
        <div class="chart-title">{{ sectionChartTitle }}</div>
        <div ref="sectionChartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import * as echarts from "echarts";

const props = defineProps({
  title: String,
  total: Number,
  weekData: Array,
  weekdayData: Array,
  sectionData: Array,
  weekChartTitle: {
    type: String,
    default: "实验室周次课程数",
  },
  weekdayChartTitle: {
    type: String,
    default: "实验室星期课程数",
  },
  sectionChartTitle: {
    type: String,
    default: "实验室节次课程数",
  },
  color: {
    type: String,
    default: "#409EFF",
  },
});

const weekChartRef = ref();
const weekdayChartRef = ref();
const sectionChartRef = ref();

let weekChart, weekdayChart, sectionChart;

const resize = () => {
  weekChart?.resize();
  weekdayChart?.resize();
  sectionChart?.resize();
};

onMounted(() => {
  weekChart = echarts.init(weekChartRef.value);
  weekdayChart = echarts.init(weekdayChartRef.value);
  sectionChart = echarts.init(sectionChartRef.value);

  renderCharts();
  window.addEventListener("resize", resize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  weekChart?.dispose();
  weekdayChart?.dispose();
  sectionChart?.dispose();
});

watch(
  () => [props.weekData, props.weekdayData, props.sectionData],
  renderCharts,
  { deep: true }
);

function renderCharts() {
  const commonOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    grid: {
      left: "3%",
      right: "3%",
      bottom: "3%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      axisLabel: {
        fontSize: 11,
        color: "#666",
      },
      axisLine: { lineStyle: { color: "#e0e0e0" } },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        fontSize: 11,
        color: "#666",
      },
      splitLine: { lineStyle: { color: "#f0f0f0" } },
    },
    series: [
      {
        type: "bar",
        barWidth: "50%",
        itemStyle: {
          color: props.color,
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  // 周次图表 (18周)
  const weekOption = {
    ...commonOption,
    xAxis: {
      ...commonOption.xAxis,
      data: props.weekData?.map((i) => i.label) || [],
    },
    series: [
      {
        ...commonOption.series[0],
        data: props.weekData?.map((i) => i.value) || [],
      },
    ],
  };
  weekChart?.setOption(weekOption);

  // 星期图表 (周一到周日)
  const weekdayOption = {
    ...commonOption,
    xAxis: {
      ...commonOption.xAxis,
      data: props.weekdayData?.map((i) => i.label) || [],
    },
    series: [
      {
        ...commonOption.series[0],
        data: props.weekdayData?.map((i) => i.value) || [],
      },
    ],
  };
  weekdayChart?.setOption(weekdayOption);

  // 节次图表 (1-2, 3-4等)
  const sectionOption = {
    ...commonOption,
    xAxis: {
      ...commonOption.xAxis,
      data: props.sectionData?.map((i) => i.label) || [],
    },
    series: [
      {
        ...commonOption.series[0],
        data: props.sectionData?.map((i) => i.value) || [],
      },
    ],
  };
  sectionChart?.setOption(sectionOption);
}
</script>

<style scoped>
.stat-row {
  display: flex;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* 左侧总数区域 */
.total-section {
  width: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #f0f0f0;
  padding-right: 24px;
}

.total-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.total-title {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
  margin-bottom: 16px;
}

.total-value {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  color: #1976d2;
}

/* 右侧图表区域 */
.charts-section {
  flex: 1;
  display: flex;
  gap: 20px;
  padding-left: 24px;
}

.chart-item {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 14px;
  color: #606266;
  text-align: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.chart-container {
  flex: 1;
  min-height: 200px;
}

@media (max-width: 768px) {
  .stat-row {
    flex-direction: column;
    padding: 16px;
  }
  .total-section {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
    padding-right: 0;
    padding-bottom: 16px;
    margin-bottom: 16px;
  }
  .charts-section {
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 16px;
    padding-left: 0;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }
  .chart-item {
    flex: 0 0 280px;
    min-width: 280px;
  }
  .chart-container {
    min-height: 180px;
  }
}
</style>
