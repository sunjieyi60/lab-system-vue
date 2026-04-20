<template>
  <div class="schedule-page">
    <div class="filter-bar">
      <div class="form-item">
        学年学期：
        <el-select v-model="term" placeholder="请选择学年学期">
          <el-option v-for="item in termList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </div>
      <div class="form-item">
        单位：
        <el-select v-model="department" placeholder="请选择单位" @change="handleDeptChange" clearable>
          <el-option v-for="item in deptList" :key="item.id" :label="item.deptName" :value="item.id" />
        </el-select>
      </div>
      <div class="form-item">
        楼栋：
        <el-select v-model="building" placeholder="请选择楼栋" @change="handleBuildingChange" clearable>
          <el-option v-for="item in buildingList" :key="item.id" :label="item.buildingName" :value="item.id" />
        </el-select>
      </div>
      <div class="form-item">
        实验室编号：
        <el-select v-model="room" placeholder="请选择实验室" style="width: 200px" @change="handleLabChange" clearable>
          <el-option v-for="item in laboratoryList" :key="item.id" :label="item.laboratoryId" :value="item.id" />
        </el-select>
      </div>
    </div>
    <div class="button-bar">
      <el-button type="primary" @click="handleManualSchedule">
        <template #icon><el-icon>
            <Plus />
          </el-icon></template>
        手动排课
      </el-button>
      <el-button @click="handleImportSchedule">
        <template #icon><el-icon>
            <Upload />
          </el-icon></template>
        导入课表
      </el-button>
      <el-button @click="handleRefresh">
        <template #icon>
          <el-icon :class="{ 'is-rotating': refreshing }">
            <Refresh />
          </el-icon>
        </template>
        刷新
      </el-button>

      <el-button plain @click="handleDelete">
        <template #icon><el-icon>
            <Delete />
          </el-icon></template>
        删除
      </el-button>
      <el-button plain type="danger" @click="handleDeleteAll">
        <template #icon><el-icon>
            <DeleteFilled />
          </el-icon></template>
        全部删除
      </el-button>
    </div>
    <!-- 排课组件 -->
    <div class="calendar-wrapper" v-loading="courseLoading" element-loading-text="加载中...">
      <CourseCalendar :courses="courseList" :selected-schedule-id="selectedScheduleId"
        @select-schedule="handleSelectSchedule" />
    </div>
  </div>

  <!-- 手动排课弹窗 -->
  <ManualScheduling v-model="scheduleDialogVisible" :edit-data="currentEditData" :semester-id="currentSemesterId"
    :laboratory-id="currentLaboratoryId" :dept-list="deptList" @success="handleScheduleSuccess"
    @delete="handleScheduleDelete" />

  <!-- 导入课表弹窗 -->
  <ImportScheduleDialog v-model="importDialogVisible" top="30vh" :semester-id="currentSemesterId"
    :laboratory-id="currentLaboratoryId" :laboratory-list="laboratoryList" @success="handleImportSuccess" />
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useEduStore } from "@/stores";
import { useUserStore } from "@/stores";

import { getLaboratoryInfo } from "@/api/base";
import {
  getCourseSchedule,
  deleteCourseScheduleByLaboratory,
  deleteCourseSchedule,
} from "@/api/edu";
import CourseCalendar from "@/views/edu/components/CourseCalendar.vue";
import ManualScheduling from "@/views/edu/components/ManualScheduling.vue";
import ImportScheduleDialog from "@/views/edu/components/ImportScheduleDialog.vue";
import {
  Plus,
  Upload,
  Refresh,
  DocumentChecked,
  Delete,
  DeleteFilled,
} from "@element-plus/icons-vue";

// Store
const eduStore = useEduStore();
const userStore = useUserStore();

// 查询条件
const term = ref("");
const department = ref(null);
const building = ref(null);
const room = ref(null);

// 原始数据列表（从API获取）
const allLaboratories = ref([]);
const allBuildings = ref([]);
const allDepts = ref([]);

// 计算属性：学年学期列表
const termList = computed(() => eduStore.termList);

// 计算属性：单位列表（根据楼栋和实验室筛选）
const deptList = computed(() => {
  let result = [...allDepts.value];

  // 如果选了楼栋，筛选包含该楼栋的单位
  if (building.value) {
    const buildingData = allBuildings.value.find(
      (b) => String(b.id) === String(building.value),
    );
    if (buildingData?.deptIds?.length) {
      result = result.filter((dept) =>
        buildingData.deptIds.some((id) => String(id) === String(dept.id)),
      );
    }
  }

  // 如果选了实验室，筛选包含该实验室的单位
  if (room.value) {
    const labData = allLaboratories.value.find(
      (l) => String(l.id) === String(room.value),
    );
    // 兼容两种字段名
    const labDeptIds = labData?.belongToDepts || labData?.belongToDeptIds || [];
    if (labDeptIds.length) {
      result = result.filter((dept) =>
        labDeptIds.some((id) => String(id) === String(dept.id)),
      );
    }
  }

  return result;
});

// 计算属性：楼栋列表（根据单位和实验室筛选）
const buildingList = computed(() => {
  let result = [...allBuildings.value];
  // 如果选了单位，筛选该单位下的楼栋
  if (department.value) {
    result = result.filter((b) => {
      if (!b.deptIds?.length) return false;
      return b.deptIds.some((id) => String(id) === String(department.value));
    });
  }

  // 如果选了实验室，筛选该实验室所在的楼栋
  if (room.value) {
    const labData = allLaboratories.value.find(
      (l) => String(l.id) === String(room.value),
    );
    if (labData?.belongToBuilding) {
      result = result.filter(
        (b) => String(b.id) === String(labData.belongToBuilding),
      );
    }
  }

  return result;
});

// 计算属性：实验室列表（根据单位和楼栋筛选）
const laboratoryList = computed(() => {
  let result = [...allLaboratories.value];

  // 如果选了单位，筛选该单位下的实验室
  if (department.value) {
    result = result.filter((lab) => {
      // 兼容两种字段名
      const labDeptIds = lab.belongToDepts || lab.belongToDeptIds || [];
      if (!labDeptIds.length) return false;
      return labDeptIds.some((id) => String(id) === String(department.value));
    });
  }

  // 如果选了楼栋，筛选该楼栋下的实验室
  if (building.value) {
    result = result.filter(
      (lab) => String(lab.belongToBuilding) === String(building.value),
    );
  }
  return result;
});

// 手动排课弹窗控制
const scheduleDialogVisible = ref(false);
const currentEditData = ref(null);

// 导入课表弹窗控制
const importDialogVisible = ref(false);

// 当前选中的学期ID
const currentSemesterId = computed(() => {
  return term.value || null;
});

// 当前选中的实验室ID
const currentLaboratoryId = computed(() => {
  return room.value || null;
});

// 课表数据
const courseList = ref([]);
const courseLoading = ref(false);
const refreshing = ref(false);

// 当前选中的排课实例ID
const selectedScheduleId = ref(null);

// 处理选中课程
const handleSelectSchedule = (scheduleId) => {
  selectedScheduleId.value = scheduleId;
  if (scheduleId) {
    console.log("选中课程:", scheduleId);
  } else {
    console.log("取消选中课程");
  }
};

// 获取课表数据（按学期过滤）
const fetchCourseSchedule = async (laboratoryId) => {
  if (!laboratoryId) {
    courseList.value = [];
    return;
  }
  courseLoading.value = true;
  try {
    const res = await getCourseSchedule([laboratoryId]);
    if (res.data?.ok) {
      // 返回的数据格式：{ "200": [ {courseData}, ... ], "201": [...] }
      const data = res.data.data || {};
      // 获取当前实验室的课程
      let courses = data[String(laboratoryId)] || [];

      // 按学期过滤
      if (currentSemesterId.value) {
        courses = courses.filter(
          (course) => course.semesterId === parseInt(currentSemesterId.value),
        );
      }

      courseList.value = courses;
    } else {
      courseList.value = [];
    }
  } catch (error) {
    console.error("获取课表数据失败:", error);
    courseList.value = [];
  } finally {
    courseLoading.value = false;
  }
};

// 获取基础数据（单位、楼栋、实验室）
const fetchBaseData = async () => {
  try {
    // 获取实验室信息（包含楼栋和单位关系）
    const res = await getLaboratoryInfo();
    if (res.data?.ok) {
      allLaboratories.value = res.data.data || [];
      console.log("初始数据如下", allLaboratories.value);
    }

    // 从用户信息中获取单位和楼栋
    const userInfo = userStore.userInfo;
    allDepts.value = (userInfo.depts || []).map((d) => d.dept);
    allBuildings.value = userInfo.buildings || [];

    // 从实验室数据中提取楼栋与单位的关联关系（deptIds）
    const buildingDeptMap = new Map();
    allLaboratories.value.forEach((lab) => {
      if (lab.belongToBuilding) {
        // 初始化该楼栋的 deptIds 数组
        if (!buildingDeptMap.has(lab.belongToBuilding)) {
          buildingDeptMap.set(lab.belongToBuilding, new Set());
        }
        // 将该实验室所属的单位添加到对应楼栋的 deptIds 中
        const deptIdsSet = buildingDeptMap.get(lab.belongToBuilding);
        // 兼容两种字段名：belongToDepts 和 belongToDeptIds
        const labDeptIds = lab.belongToDepts || lab.belongToDeptIds || [];
        labDeptIds.forEach((deptId) => {
          deptIdsSet.add(deptId);
        });
      }
    });

    // 如果没有楼栋数据，从实验室数据中提取楼栋基本信息
    if (allBuildings.value.length === 0) {
      const buildingMap = new Map();
      allLaboratories.value.forEach((lab) => {
        if (lab.belongToBuilding && lab.buildingName) {
          if (!buildingMap.has(lab.belongToBuilding)) {
            buildingMap.set(lab.belongToBuilding, {
              id: lab.belongToBuilding,
              buildingName: lab.buildingName,
              deptIds: [],
            });
          }
        }
      });
      allBuildings.value = Array.from(buildingMap.values());
    }

    // 为所有楼栋补充 deptIds（从实验室数据中推断的楼栋与单位关系）
    allBuildings.value = allBuildings.value.map((building) => {
      const deptIdsSet = buildingDeptMap.get(building.id);
      return {
        ...building,
        deptIds: deptIdsSet ? Array.from(deptIdsSet) : building.deptIds || [],
      };
    });

    // 调试输出
    console.log("=== 调试数据 ===");
    console.log("实验室列表:", allLaboratories.value);
    console.log("楼栋列表:", allBuildings.value);
    console.log("单位列表:", allDepts.value);
    allBuildings.value.forEach((b) => {
      console.log(`楼栋 ${b.buildingName}(id=${b.id}): deptIds=`, b.deptIds);
    });
    allLaboratories.value.forEach((lab) => {
      console.log(
        `实验室 ${lab.laboratoryId}: belongToBuilding=${lab.belongToBuilding}, belongToDepts=`,
        lab.belongToDepts,
      );
    });

    // 默认选中第一个实验室
    if (laboratoryList.value.length > 0 && !room.value) {
      room.value = laboratoryList.value[0].id;
    }
  } catch (error) {
    console.error("获取基础数据失败:", error);
  }
};

// 处理单位变化
const handleDeptChange = (val) => {
  department.value = val;
  // 如果当前楼栋不在可选列表，清空
  if (
    building.value &&
    !buildingList.value.some((b) => String(b.id) === String(building.value))
  ) {
    building.value = null;
  }
  // 如果当前实验室不在可选列表，清空
  if (
    room.value &&
    !laboratoryList.value.some((l) => String(l.id) === String(room.value))
  ) {
    room.value = null;
  }
};

// 处理楼栋变化
const handleBuildingChange = (val) => {
  console.log("选择楼栋:", val, "类型:", typeof val);
  building.value = val;

  // 如果当前单位不在可选列表，清空
  if (
    department.value &&
    !deptList.value.some((d) => String(d.id) === String(department.value))
  ) {
    department.value = null;
  }
  // 如果当前实验室不在可选列表，清空
  if (
    room.value &&
    !laboratoryList.value.some((l) => String(l.id) === String(room.value))
  ) {
    room.value = null;
  }
};

// 处理实验室变化
const handleLabChange = (val) => {
  room.value = val;
  // 如果当前单位不在可选列表，清空
  if (
    department.value &&
    !deptList.value.some((d) => String(d.id) === String(department.value))
  ) {
    department.value = null;
  }
  // 如果当前楼栋不在可选列表，清空
  if (
    building.value &&
    !buildingList.value.some((b) => String(b.id) === String(building.value))
  ) {
    building.value = null;
  }
};

// 点击手动排课
const handleManualSchedule = () => {
  if (!currentLaboratoryId.value) {
    ElMessage.warning("请先选择实验室");
    return;
  }
  if (!currentSemesterId.value) {
    ElMessage.warning("请先选择学期");
    return;
  }
  // 将当前选中的实验室信息传入编辑数据
  const selectedLab = laboratoryList.value.find((lab) => lab.id === room.value);
  currentEditData.value = {
    laboratoryId: room.value,
    laboratoryName: selectedLab?.laboratoryId || "",
  };
  scheduleDialogVisible.value = true;
};

// 保存成功回调
const handleScheduleSuccess = () => {
  // 刷新课表数据
  if (room.value) {
    fetchCourseSchedule(room.value);
  }
  ElMessage.success("排课成功");
};

// 打开导入课表弹窗
const handleImportSchedule = () => {
  importDialogVisible.value = true;
};

// 导入成功回调
const handleImportSuccess = () => {
  // 刷新课表数据
  if (room.value) {
    fetchCourseSchedule(room.value);
  }
  ElMessage.success("课表导入成功");
};

// 删除回调
const handleScheduleDelete = async (rowData) => {
  console.log("删除排课:", rowData);

  // 从 selectedScheduleId 中解析出 courseScheduleId
  // selectedScheduleId 格式: "courseId-weekday-dateStr"
  if (!selectedScheduleId.value) {
    ElMessage.warning("未找到要删除的课程");
    return;
  }

  const parts = selectedScheduleId.value.split("-");
  if (parts.length < 1) {
    ElMessage.error("课程数据格式错误");
    return;
  }

  const courseScheduleId = parseInt(parts[0]);
  if (isNaN(courseScheduleId)) {
    ElMessage.error("课程ID格式错误");
    return;
  }

  try {
    const res = await deleteCourseSchedule(courseScheduleId);
    console.log("删除课程 - 接口返回:", res);

    if (res.data?.ok) {
      ElMessage.success("删除成功");
      // 清空选中状态
      selectedScheduleId.value = null;
      // 关闭弹窗
      scheduleDialogVisible.value = false;
      // 刷新课表数据
      if (room.value) {
        fetchCourseSchedule(room.value);
      }
    } else {
      ElMessage.error(res.data?.message || "删除失败");
    }
  } catch (error) {
    console.error("删除课程失败:", error);
    ElMessage.error(error.response?.data?.msg || "删除失败");
  }
};

// 处理删除按钮点击
const handleDelete = () => {
  // 1. 检查是否已选中课程
  if (!selectedScheduleId.value) {
    ElMessage.warning("请先选中要删除的课程节次");
    return;
  }

  // 2. 解析 scheduleId: 格式为 "courseId-weekday-dateStr"
  const parts = selectedScheduleId.value.split("-");
  if (parts.length < 1) {
    ElMessage.error("选中的课程数据格式错误");
    return;
  }

  const courseScheduleId = parseInt(parts[0]);
  if (isNaN(courseScheduleId)) {
    ElMessage.error("课程ID格式错误");
    return;
  }

  // 3. 弹出确认框
  ElMessageBox.confirm("确定删除选中的课程？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      console.log("删除课程 - courseScheduleId:", courseScheduleId);

      try {
        // 4. 调用删除接口
        const res = await deleteCourseSchedule(courseScheduleId);
        console.log("删除课程 - 接口返回:", res);

        if (res.data?.ok) {
          ElMessage.success("删除成功");
          // 清空选中状态
          selectedScheduleId.value = null;
          // 刷新课表数据
          if (room.value) {
            fetchCourseSchedule(room.value);
          }
        } else {
          ElMessage.error(res.data?.message || "删除失败");
        }
      } catch (error) {
        console.error("删除课程失败:", error);
        ElMessage.error(error.response?.data?.msg || "删除失败");
      }
    })
    .catch(() => {
      // 用户点击取消，不做任何操作
      console.log("用户取消删除课程");
    });
};

// 处理全部删除按钮点击
const handleDeleteAll = () => {
  // 检查是否已选择实验室
  if (!currentLaboratoryId.value) {
    ElMessage.warning("请先选择实验室");
    return;
  }

  // 弹出确认框
  ElMessageBox.confirm("确定删除当前实验室下所有课程？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      // 用户点击确定
      const requestData = {
        laboratoryId: currentLaboratoryId.value,
      };
      console.log("全部删除课程 - 请求参数:", requestData);

      try {
        const res = await deleteCourseScheduleByLaboratory(
          currentLaboratoryId.value,
        );
        console.log("全部删除课程 - 接口返回:", res);

        if (res.data?.ok) {
          ElMessage.success("删除成功");
          // 清空选中状态
          selectedScheduleId.value = null;
          // 刷新课表数据
          if (room.value) {
            fetchCourseSchedule(room.value);
          }
        } else {
          ElMessage.error(res.data?.message || "删除失败");
        }
      } catch (error) {
        console.error("全部删除课程失败:", error);
        ElMessage.error(error.response?.data?.msg || "删除失败");
      }
    })
    .catch(() => {
      // 用户点击取消，不做任何操作
      console.log("用户取消全部删除");
    });
};

// 刷新
const handleRefresh = async () => {
  refreshing.value = true;
  try {
    await userStore.refreshUserInfo();
    await fetchBaseData();
    if (room.value) {
      await fetchCourseSchedule(room.value);
    }
    ElMessage.success("刷新成功");
  } catch (error) {
    console.error("刷新失败:", error);
    ElMessage.error(error.response?.data?.msg || "刷新失败");
  } finally {
    refreshing.value = false;
  }
};

// 监听实验室选择变化
watch(room, (newVal) => {
  if (newVal) {
    fetchCourseSchedule(newVal);
  } else {
    courseList.value = [];
  }
});

// 监听学期选择变化，刷新课表
watch(term, () => {
  if (room.value) {
    fetchCourseSchedule(room.value);
  }
});

// 初始化数据
onMounted(async () => {
  // 初始化 edu store 的学期数据
  if (eduStore.termList.length === 0) {
    await eduStore.initTermData();
  }
  // 默认选中学期（使用学期ID）
  if (eduStore.currentTerm) {
    term.value = eduStore.currentTerm.id;
    console.log("Sdsad");
  }

  // 刷新用户信息
  await userStore.refreshUserInfo();
  // 获取基础数据（单位、楼栋、实验室）
  await fetchBaseData();
  // 如果已选择实验室，获取课表
  if (room.value) {
    await fetchCourseSchedule(room.value);
  }
});
</script>

<style scoped>
.filter-bar {
  /* width:100%; */
  /* min-height:0%; */
  display: flex;
  flex-wrap: wrap;
  /* gap: 14px; */
  margin-bottom: 14px;
  align-items: center;
  /* padding :5px 0px; */
  gap: 5px;
  /* overflow-x: auto; */
  /* min-width: 0; */
  justify-content: start;
}

.form-item {
  margin-right: 25px;
  display: flex;
  align-items: center;
  margin-left: 5px;
  flex-shrink: 0;
}

.form-item label {
  width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.form-item .el-select {
  width: 180px;
}

/* 按钮栏容器 */
.button-bar {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  flex-wrap: wrap;
  flex-shrink: 0;
}

/* 统一按钮样式：核心修复 */
.button-bar .el-button {
  min-width: 96px;
  height: 36px;
  border-radius: 9px;
  font-weight: 500;
  transition: all 0.25s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  vertical-align: middle;
}

/* 修复图标与文字的间距 */
.button-bar .el-icon {
  margin-right: 4px;
  font-size: 14px;
}

/* 主按钮：渐变背景 */
.button-bar .el-button--primary {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: 0;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.35);
}

.is-rotating {
  animation: rotate 0.6s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.button-bar .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(64, 158, 255, 0.45);
}

/* 次按钮：悬停高亮 */
.button-bar .el-button:not(.el-button--primary):not(.el-button--danger):hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

/* 危险按钮：红色描边 */
.button-bar .el-button--danger.is-plain {
  border-color: #fbc4c4;
  color: #f56c6c;
}

.button-bar .el-button--danger.is-plain:hover {
  background: #fef0f0;
  border-color: #f56c6c;
}

.schedule-page {
  width: 100%;
  padding: 0 20px 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0%;
}

.calendar-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
@media (max-width: 768px) {
  .schedule-page {
    padding: 8px;
    height: auto;
  }

  .filter-bar {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 8px;
    padding-bottom: 4px;
  }

  .filter-bar > * {
    flex-shrink: 0;
  }

  .form-item {
    flex: none;
    margin-right: 0;
    margin-left: 0;
  }

  .button-bar {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 8px;
    padding-bottom: 4px;
  }

  .button-bar .el-button {
    flex: none;
    min-width: auto;
    white-space: nowrap;
  }

  .calendar-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
