<template>
  <div class="schedule-page">
    <div class="filter-bar">
      <div class="form-item">
        学年学期：
        <el-select v-model="term" placeholder="请选择学年学期">
          <el-option
            v-for="item in termList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </div>
      <div class="form-item">
        所属单位：
        <el-select v-model="department" placeholder="请选择所属单位">
          <el-option
            v-for="item in deptList"
            :key="item.id"
            :label="item.deptName"
            :value="item.id"
          />
        </el-select>
      </div>
      <div class="form-item">
        所在楼栋：
        <el-select v-model="building" placeholder="请选择所在楼栋">
          <el-option
            v-for="item in buildingList"
            :key="item.id"
            :label="item.buildingName"
            :value="item.id"
          />
        </el-select>
      </div>
      <div class="form-item">
        实验室编号：
        <el-select
          v-model="room"
          placeholder="请选择实验室"
          style="width: 200px"
        >
          <el-option
            v-for="item in laboratoryList"
            :key="item.id"
            :label="item.laboratoryId"
            :value="item.id"
          />
        </el-select>
      </div>
    </div>
    <div class="button-bar">
      <el-button type="primary" @click="handleManualSchedule">
        <template #icon
          ><el-icon><Plus /></el-icon
        ></template>
        手动排课
      </el-button>
      <el-button @click="handleImportSchedule">
        <template #icon
          ><el-icon><Upload /></el-icon
        ></template>
        导入课表
      </el-button>
      <el-button>
        <template #icon
          ><el-icon><Refresh /></el-icon
        ></template>
        刷新
      </el-button>
      <el-button>
        <template #icon
          ><el-icon><DocumentChecked /></el-icon
        ></template>
        保存
      </el-button>
      <el-button plain @click="handleDelete">
        <template #icon
          ><el-icon><Delete /></el-icon
        ></template>
        删除
      </el-button>
      <el-button plain type="danger" @click="handleDeleteAll">
        <template #icon
          ><el-icon><DeleteFilled /></el-icon
        ></template>
        全部删除
      </el-button>
    </div>
    <!-- 排课组件 -->
    <CourseCalendar
      :courses="courseList"
      :selected-schedule-id="selectedScheduleId"
      @select-schedule="handleSelectSchedule"
    />
  </div>

  <!-- 手动排课弹窗 -->
  <ManualScheduling
    v-model="scheduleDialogVisible"
    :edit-data="currentEditData"
    :semester-id="currentSemesterId"
    :laboratory-id="currentLaboratoryId"
    :dept-list="deptList"
    @success="handleScheduleSuccess"
    @delete="handleScheduleDelete"
  />

  <!-- 导入课表弹窗 -->
  <ImportScheduleDialog
    v-model="importDialogVisible"
    top="30vh"
    :semester-list="termList"
    :laboratory-id="currentLaboratoryId"
    :laboratory-list="laboratoryList"
    @success="handleImportSuccess"
  />
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useEduStore } from "@/stores/edu.js";
import { useUserStore } from "@/stores/user.js";

import { getLaboratoryInfo } from "@/api/base.js";
import {
  getCourseSchedule,
  editCourseSchedule,
  deleteCourseScheduleByLaboratory,
  deleteCourseSchedule,
  getTerm,
} from "@/api/edu.js";
import CourseCalendar from "@/components/CourseCalendar.vue";
import ManualScheduling from "@/components/ManualScheduling.vue";
import ImportScheduleDialog from "@/components/ImportScheduleDialog.vue";
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
const building = ref("");
const department = ref("");
const room = ref(null); // 单选，值为实验室ID

// 实验室列表
const laboratoryList = ref([]);

// 计算属性：学年学期列表
const termList = computed(() => eduStore.termList);

// 计算属性：所属单位列表
const deptList = computed(() => {
  const depts = userStore.userInfo?.depts || [];
  return depts.map((item) => item.dept);
});

// 计算属性：楼栋列表
const buildingList = computed(() => userStore.getBuildingList);

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
  }
};

// 获取实验室列表
const fetchLaboratoryList = async () => {
  try {
    const res = await getLaboratoryInfo();
    if (res.data?.ok) {
      laboratoryList.value = res.data.data || [];
      // 默认只选中第一个实验室
      if (laboratoryList.value.length > 0 && !room.value) {
        room.value = laboratoryList.value[0].id;
      }
    } else {
      laboratoryList.value = [];
    }
  } catch (error) {
    console.error("获取实验室列表失败:", error);
    laboratoryList.value = [];
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
    ElMessage.error("删除失败，请检查网络或稍后重试");
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
        ElMessage.error("删除失败，请检查网络或稍后重试");
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
        ElMessage.error("删除失败，请检查网络或稍后重试");
      }
    })
    .catch(() => {
      // 用户点击取消，不做任何操作
      console.log("用户取消全部删除");
    });
};

// 刷新课表方法
const refreshCourseCalendar = () => {
  // TODO: 调用CourseCalendar的刷新方法
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
  }

  // 刷新用户信息（获取楼栋和单位）
  await userStore.refreshUserInfo();

  // 获取实验室列表
  await fetchLaboratoryList();

  // 如果已选择实验室，获取课表
  if (room.value) {
    await fetchCourseSchedule(room.value);
  }
});
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
  align-items: center;
  overflow-x: auto;
  min-width: 0;
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
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  flex-wrap: wrap;
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

/* 页面容器 */
.schedule-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;
}
</style>
