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
        <el-select 
          v-model="selectedDepts" 
          placeholder="请选择所属单位"
          multiple
          collapse-tags
          collapse-tags-tooltip
          style="width: 180px"
        >
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
        <el-select 
          v-model="selectedBuildings" 
          placeholder="请选择所在楼栋"
          multiple
          collapse-tags
          collapse-tags-tooltip
          style="width: 180px"
        >
          <el-option
            v-for="item in buildingList"
            :key="item.id"
            :label="item.buildingName"
            :value="item.id"
          />
        </el-select>
      </div>
      <div class="form-item">
        所在实验室：
        <el-select 
          v-model="selectedLabs" 
          placeholder="请选择实验室"
          multiple
          collapse-tags
          collapse-tags-tooltip
          style="width: 200px"
        >
          <el-option
            v-for="item in filteredLaboratoryList"
            :key="item.id"
            :label="item.laboratoryId"
            :value="item.id"
          />
        </el-select>
      </div>
    </div>
    
    <!-- 教室课表组件 -->
    <LabRoomSchedule 
      :courses="courseData" 
      :rooms="filteredRoomList"
      :sections="sectionConfig"
      :semester-id="currentSemesterId"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { useEduStore } from "@/stores/edu.js";
import { useUserStore } from "@/stores/user.js";
import { getLaboratoryInfo } from "@/api/base.js";
import { getCourseSchedule } from "@/api/edu.js";
import LabRoomSchedule from "@/components/LabRoomSchedule.vue";

// Store
const eduStore = useEduStore();
const userStore = useUserStore();

// 查询条件
const term = ref("");
const selectedBuildings = ref([]); // 多选楼栋
const selectedDepts = ref([]); // 多选所属单位
const selectedLabs = ref([]); // 多选实验室

// 实验室列表
const laboratoryList = ref([]);

// 计算属性：学年学期列表
const termList = computed(() => eduStore.termList);

// 计算属性：当前选中的学期ID
const currentSemesterId = computed(() => {
  return term.value || null;
});

// 计算属性：所属单位列表
const deptList = computed(() => {
  const depts = userStore.userInfo?.depts || [];
  return depts.map((item) => item.dept);
});

// 计算属性：楼栋列表
const buildingList = computed(() => userStore.getBuildingList);

// 根据楼栋和部门筛选后的实验室列表（用于实验室选择下拉框）
const filteredLaboratoryList = computed(() => {
  return laboratoryList.value.filter((lab) => {
    // 楼栋筛选
    if (selectedBuildings.value.length > 0) {
      const labBuildingId = lab.buildingId || lab.building?.id;
      if (!selectedBuildings.value.includes(labBuildingId)) {
        return false;
      }
    }
    // 部门筛选
    if (selectedDepts.value.length > 0) {
      const labDeptId = lab.deptId || lab.dept?.id || lab.belongToDeptId;
      if (!selectedDepts.value.includes(labDeptId)) {
        return false;
      }
    }
    return true;
  });
});

// 过滤后的教室列表（根据选中的实验室决定）
const filteredRoomList = computed(() => {
  if (selectedLabs.value.length === 0) {
    return [];
  }
  return laboratoryList.value.filter((lab) => selectedLabs.value.includes(lab.id));
});

// 节次配置（与你数据中的时间匹配）
const sectionConfig = [
  { name: "1-2节", timeRange: "08:00-09:40", startSlot: 1, endSlot: 2 },
  { name: "3-4节", timeRange: "10:00-11:40", startSlot: 3, endSlot: 4 },
  { name: "5-6节", timeRange: "14:00-15:40", startSlot: 5, endSlot: 6 },
  { name: "7-8节", timeRange: "16:00-17:40", startSlot: 7, endSlot: 8 },
  { name: "9-10节", timeRange: "18:40-20:15", startSlot: 9, endSlot: 10 },
  { name: "11-12节", timeRange: "20:20-21:05", startSlot: 11, endSlot: 11 },
];

// 课表数据 { roomId: [courseData, ...] }
const courseData = ref({});

// 获取课表数据（所有过滤后的教室）
const fetchAllCourses = async () => {
  if (filteredRoomList.value.length === 0) {
    courseData.value = {};
    return;
  }
  
  // 获取所有教室的 ID
  const roomIds = filteredRoomList.value.map((room) => room.id);
  
  try {
    const res = await getCourseSchedule(roomIds);
    
    if (res.data?.ok) {
      // 直接使用后端返回的数据格式 { "200": [...], "201": [...] }
      courseData.value = res.data.data || {};
    } else {
      courseData.value = {};
    }
  } catch (error) {
    console.error("[课表] 获取课表数据失败:", error);
    ElMessage.error("获取课表数据失败");
    courseData.value = {};
  }
};

// 获取实验室列表
const fetchLaboratoryList = async () => {
  try {
    const res = await getLaboratoryInfo();
    if (res.data?.ok) {
      laboratoryList.value = res.data.data || [];
    } else {
      laboratoryList.value = [];
    }
  } catch (error) {
    console.error("[课表] 获取实验室列表失败:", error);
    ElMessage.error("获取实验室列表失败");
    laboratoryList.value = [];
  }
};

// 监听楼栋或部门筛选变化，自动更新实验室选中状态
watch(
  [selectedBuildings, selectedDepts],
  () => {
    const filteredIds = filteredLaboratoryList.value.map((lab) => lab.id);
    // 只保留在过滤后列表中的实验室
    selectedLabs.value = selectedLabs.value.filter((id) =>
      filteredIds.includes(id),
    );
    // 如果没有选中的实验室，默认全选过滤后的
    if (selectedLabs.value.length === 0 && filteredIds.length > 0) {
      selectedLabs.value = filteredIds;
    }
  },
  { deep: true }
);

// 监听实验室选择或学期变化，自动刷新课表
watch(
  [selectedLabs, term],
  () => {
    fetchAllCourses();
  },
  { immediate: false }
);

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

  // 刷新用户信息
  await userStore.refreshUserInfo();

  // 获取实验室列表
  await fetchLaboratoryList();
  
  // 默认全选所有筛选条件
  if (laboratoryList.value.length > 0) {
    // 全选部门
    const allDeptIds = [...new Set(laboratoryList.value.map(lab => lab.deptId || lab.dept?.id || lab.belongToDeptId).filter(Boolean))];
    selectedDepts.value = allDeptIds;
    // 全选楼栋
    const allBuildingIds = [...new Set(laboratoryList.value.map(lab => lab.buildingId || lab.building?.id).filter(Boolean))];
    selectedBuildings.value = allBuildingIds;
    // 全选实验室
    selectedLabs.value = laboratoryList.value.map(lab => lab.id);
  }
  
  // 获取所有教室的课程
  await fetchAllCourses();
});
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
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

/* 页面容器 */
.schedule-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;
}
</style>
