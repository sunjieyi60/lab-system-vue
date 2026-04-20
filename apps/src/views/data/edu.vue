<template>
  <div class="dashboard-container">
    <!-- 1. 筛选区域 -->
    <el-card shadow="hover" class="filter-card">
      <div class="filter-section">
        <div class="filter-item">
          <label>学年学期</label>
          <el-select v-model="query.term" clearable placeholder="请选择学期">
            <el-option label="全部" value="" />
            <el-option
              v-for="item in termList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label>楼栋</label>
          <el-select
            v-model="query.building"
            clearable
            placeholder="请选择楼栋"
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
          <label>单位</label>
          <el-select v-model="query.unit" clearable placeholder="请选择单位">
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
          <label>实验室编号</label>
          <el-select v-model="query.labId" clearable placeholder="请选择实验室">
            <el-option label="全部" value="" />
            <el-option
              v-for="item in laboratoryList"
              :key="item.id"
              :label="item.laboratoryId"
              :value="item.id"
            />
          </el-select>
        </div>

        <el-button
          type="primary"
          :loading="loading"
          @click="loadData"
          class="query-btn"
        >
          查询
        </el-button>
      </div>
    </el-card>

    <!-- 2. 状态提示 -->
    <div v-if="loading" class="tip">加载中…</div>
    <div v-else-if="error" class="tip error">{{ error }}</div>

    <!-- 3. 数据卡片 -->
    <template v-else>
      <!-- 课程数 -->
      <StatCard
        title="课程数"
        :total="rawData.totalCourseCount"
        :week-data="weekCourseData"
        :weekday-data="weekdayCourseData"
        :section-data="sectionCourseData"
        week-chart-title="实验室周次课程数"
        weekday-chart-title="实验室星期课程数"
        section-chart-title="实验室节次课程数"
        color="#409EFF"
      />

      <!-- 学时数 -->
      <StatCard
        title="学时数"
        :total="rawData.totalSectionCount"
        :week-data="weekSectionData"
        :weekday-data="weekdaySectionData"
        :section-data="sectionSectionData"
        week-chart-title="实验室周次学时数"
        weekday-chart-title="实验室星期学时数"
        section-chart-title="实验室节次学时数"
        color="#67C23A"
      />

      <!-- 人学时数 -->
      <StatCard
        title="人学时数"
        :total="rawData.totalStudentSectionCount"
        :week-data="weekStudentData"
        :weekday-data="weekdayStudentData"
        :section-data="sectionStudentData"
        week-chart-title="实验室周次人学时数"
        weekday-chart-title="实验室星期人学时数"
        section-chart-title="实验室节次人学时数"
        color="#E6A23C"
      />
    </template>
  </div>
</template>

<script setup>
/* --------------------  1. 引入  -------------------- */
import { reactive, ref, computed, onMounted } from "vue";
import StatCard from "@/components/common/StatCard.vue";
import { getEduAnalysisChart } from "@/api/edu";
import { useUserStore } from "@/stores";
import { useEduStore } from "@/stores";

const userStore = useUserStore();
const eduStore = useEduStore();

/* --------------------  2. 查询条件  -------------------- */
const query = reactive({
  term: "",
  building: "",
  unit: "",
  labId: "",
});

/* --------------------  3. 响应式数据  -------------------- */
const loading = ref(false);
const error = ref("");
const rawData = ref({
  totalCourseCount: 0,
  totalSectionCount: 0,
  totalStudentSectionCount: 0,
  byWeek: [],
  byWeekday: [],
  bySection: [],
});

/* --------------------  4. 计算属性：图表数据  -------------------- */
// 课程数图表数据
const weekCourseData = computed(() =>
  rawData.value.byWeek.map((item) => ({
    label: item.label,
    value: item.courseCount,
  })),
);

const weekdayCourseData = computed(() =>
  rawData.value.byWeekday.map((item) => ({
    label: item.label,
    value: item.courseCount,
  })),
);

const sectionCourseData = computed(() =>
  rawData.value.bySection.map((item) => ({
    label: item.label,
    value: item.courseCount,
  })),
);

// 学时数图表数据
const weekSectionData = computed(() =>
  rawData.value.byWeek.map((item) => ({
    label: item.label,
    value: item.sectionCount,
  })),
);

const weekdaySectionData = computed(() =>
  rawData.value.byWeekday.map((item) => ({
    label: item.label,
    value: item.sectionCount,
  })),
);

const sectionSectionData = computed(() =>
  rawData.value.bySection.map((item) => ({
    label: item.label,
    value: item.sectionCount,
  })),
);

// 人学时数图表数据
const weekStudentData = computed(() =>
  rawData.value.byWeek.map((item) => ({
    label: item.label,
    value: item.studentSectionCount,
  })),
);

const weekdayStudentData = computed(() =>
  rawData.value.byWeekday.map((item) => ({
    label: item.label,
    value: item.studentSectionCount,
  })),
);

const sectionStudentData = computed(() =>
  rawData.value.bySection.map((item) => ({
    label: item.label,
    value: item.studentSectionCount,
  })),
);

// 筛选下拉数据
const buildingList = computed(() => userStore.getBuildingList);
const deptList = computed(() =>
  (userStore.userInfo.depts || []).map((item) => item.dept),
);
const laboratoryList = computed(() => userStore.getLaboratoryList);
const termList = computed(() => eduStore.getAllTerms);

/* --------------------  5. 加载数据  -------------------- */
async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const params = {
      semester: query.term,
      buildingId: query.building,
      deptId: query.unit,
      labId: query.labId,
    };

    const res = await getEduAnalysisChart(params);
    if (res.data.ok) {
      rawData.value = res.data.data;
    } else {
      error.value = res.data.msg || "获取数据失败";
    }
  } catch (e) {
    error.value = e.message || "接口异常";
    console.error("加载教务数据失败:", e);
  } finally {
    loading.value = false;
  }
}

/* --------------------  6. 初始化  -------------------- */
onMounted(async () => {
  await userStore.refreshUserInfo();
  await eduStore.initTermData();
  console.log("[data-edu] 学期列表:", termList.value);
  loadData();
});
</script>

<style scoped>
/* 整体容器 */
.dashboard-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 筛选卡片 */
.filter-card {
  border-radius: 12px;
  margin-bottom: 24px;
}

.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 下拉框统一宽度 */
.filter-item .el-select {
  width: 180px;
}

.query-btn {
  margin-left: auto;
  height: 36px;
  border-radius: 6px;
}

/* 状态提示 */
.tip {
  text-align: center;
  padding: 60px 0;
  font-size: 15px;
  color: #909399;
}

.tip.error {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 8px;
    background: #fff;
  }
  .filter-card {
    margin-bottom: 12px;
  }
  .filter-section {
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 12px;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }
  .filter-item {
    flex-shrink: 0;
  }
  .filter-item .el-select {
    width: 140px;
  }
  .query-btn {
    margin-left: 0;
    flex-shrink: 0;
  }
}
</style>
