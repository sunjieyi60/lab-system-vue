<template>
  <div class="dashboard-container">
    <!-- 筛选区域 -->
    <el-card shadow="hover" class="filter-card">
      <div class="filter-section">
        <div class="filter-item">
          <label>时间:</label>
          <!-- 修改：value-format 去掉秒 -->
          <el-date-picker
            v-model="query.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            style="width: 300px"
          />
        </div>

        <div class="filter-item">
          <label>*所在楼栋:</label>
          <el-select
            v-model="query.building"
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
          <label>所属单位:</label>
          <el-select
            v-model="query.unit"
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
            v-model="query.labId"
            clearable
            placeholder="全部"
            style="width: 90px"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="item in laboratoryList"
              :key="item.id"
              :label="item.laboratoryName"
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

    <!-- 数据列表 -->
    <el-card v-if="displayType === 'list'" shadow="hover" class="data-card">
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="该时间范围内无能耗数据"
      />

      <el-table
        v-else
        :data="tableData"
        stripe
        style="width: 100%"
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
          min-width="200"
          align="center"
        />
        <el-table-column
          prop="labNo"
          label="实验室编号"
          min-width="120"
          align="center"
        />
        <el-table-column
          prop="deptName"
          label="所属单位"
          min-width="180"
          align="center"
        />
        <el-table-column
          prop="switchName"
          label="智能空开"
          min-width="140"
          align="center"
        />
        <el-table-column
          prop="energy"
          label="电能(KWh)"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <span style="color: #409eff">{{ row.energy }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="ratio" label="占比" width="80" align="center">
          <template #default="{ row }">
            <span>{{ row.ratio }}%</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 图表显示 -->
    <el-card v-else shadow="hover" class="data-card chart-card">
      <el-empty
        v-if="!loading && chartData.length === 0"
        description="该时间范围内无能耗数据"
      />

      <div v-else class="chart-container">
        <div class="total-energy">
          <span class="label">总能耗:</span>
          <span class="value">{{ totalEnergy }}</span>
          <span class="unit">Kwh</span>
        </div>
        <div ref="chartRef" style="height: 350px; width: 100%"></div>
        <div class="chart-title">能耗分布与占比</div>
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
import { useUserStore } from "@/stores/user.js";
import * as echarts from "echarts";
import service from "@/api/request";
import { ElMessage } from "element-plus";

const userStore = useUserStore();

// 显示方式：list=列表, chart=图表
const displayType = ref("list");

// 查询条件 - 时间格式改为 yyyy-MM-dd HH:mm
const query = reactive({
  timeRange: ["2026-01-01 21:00", "2026-02-28 19:00"],
  building: "",
  unit: "",
  labId: "",
  switch: "",
  pageNum: 1,
  pageSize: 10,
});

// 数据
const loading = ref(false);
const tableData = ref([]);
const chartData = ref([]);
const totalEnergy = ref(0);

// 图表
const chartRef = ref();
let chart = null;

// 下拉数据
const buildingList = computed(() => userStore.getBuildingList);
const deptList = computed(() =>
  (userStore.userInfo.depts || []).map((item) => item.dept),
);
const laboratoryList = computed(() => userStore.getLaboratoryList);

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    // 如果没有选择特定实验室，默认传入所有实验室ID
    let labIds = [];
    if (query.labId) {
      labIds = [query.labId];
    } else {
      labIds = laboratoryList.value.map((item) => item.id);
    }

    // 直接使用时间选择器的值，已经是 yyyy-MM-dd HH:mm 格式
    const params = {
      startTime: query.timeRange?.[0] || "",
      endTime: query.timeRange?.[1] || "",
      buildingId: query.building || null,
      deptId: query.unit || null,
      laboratoryIds: labIds,
      deviceIds: [],
    };

    const res = await service({
      url: "/analysis/energy-consumption",
      method: "post",
      data: params,
    });
    console.log(res);
    if (res.data.ok) {
      const data = res.data || {};
      // 总能耗
      totalEnergy.value = data.totalKwh || 0;

      // 列表数据
      const list = data.list || [];
      tableData.value = list.map((item) => ({
        timeRange: `${params.startTime}至${params.endTime}`,
        labNo: item.labNo || item.laboratoryName || "-",
        deptName: item.deptName || "-",
        switchName: item.switchName || "-",
        energy: item.energy || 0,
        ratio: item.ratio || 0,
      }));

      // 图表数据
      chartData.value = data.chartSegments || [];

      // 如果当前是图表模式且有数据，刷新图表
      if (displayType.value === "chart" && chartData.value.length > 0) {
        setTimeout(initChart, 100);
      }
    } else {
      ElMessage.error(res.msg || "查询失败");
    }
  } catch (error) {
    console.error("查询失败:", error);
    ElMessage.error("网络错误，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 初始化饼图
const initChart = () => {
  if (!chartRef.value || chartData.value.length === 0) return;

  if (chart) {
    chart.dispose();
  }

  chart = echarts.init(chartRef.value);

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} Kwh ({d}%)",
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
        name: "能耗分布",
        type: "pie",
        radius: ["0%", "70%"],
        center: ["40%", "50%"],
        data: chartData.value.map((item) => ({
          value: item.value || item.energy || 0,
          name: item.name || item.switchName || "-",
        })),
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
          formatter: "{d}%",
          fontSize: 14,
          fontWeight: "bold",
          color: "#fff",
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: "#fff",
        },
        color: [
          "#3b82f6",
          "#22c55e",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#06b6d4",
          "#84cc16",
        ],
      },
    ],
  };

  chart.setOption(option);
};

// 监听显示类型变化
watch(displayType, (val) => {
  if (val === "chart" && chartData.value.length > 0) {
    setTimeout(initChart, 100);
  }
});

// 监听窗口大小变化
const handleResize = () => {
  chart?.resize();
};

onMounted(async () => {
  await userStore.refreshUserInfo();
  // 页面加载完成后自动查询全部实验室数据
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

.display-tabs {
  display: flex;
  justify-content: flex-start;
}

.display-tabs
  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.data-card {
  border-radius: 8px;
}

.chart-card {
  padding: 20px;
}

.chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.total-energy {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.total-energy .label {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.total-energy .value {
  font-size: 32px;
  color: #3b82f6;
  font-weight: bold;
}

.total-energy .unit {
  font-size: 14px;
  color: #606266;
}

.chart-title {
  margin-top: 10px;
  font-size: 14px;
  color: #303133;
}
</style>
