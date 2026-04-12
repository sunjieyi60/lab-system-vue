<template>
  <div class="lab-room-schedule">
    <!-- 表格主体 -->
    <div class="schedule-table-wrapper">
      <table class="schedule-table">
        <!-- 表头 -->
        <thead>
          <tr>
            <th class="col-section">节次</th>
            <th class="col-room">教室</th>
            <th v-for="day in weekDays" :key="day.key" class="col-day">
              {{ day.name }}
            </th>
          </tr>
        </thead>
        
        <!-- 表体 -->
        <tbody>
          <template v-for="section in sections" :key="section.name">
            <template v-for="(room, roomIdx) in roomList" :key="room.id">
              <tr>
                <!-- 节次列：只在每个节次的第一个教室显示，合并行 -->
                <td 
                  v-if="roomIdx === 0" 
                  class="cell-section"
                  :rowspan="roomList.length"
                >
                  <div class="section-name">{{ section.name }}</div>
                  <div class="section-time">{{ section.timeRange }}</div>
                </td>
                
                <!-- 教室列 -->
                <td class="cell-room">{{ room.laboratoryId || room.id }}</td>
                
                <!-- 周一到周日的课程单元格 -->
                <td 
                  v-for="day in weekDays" 
                  :key="day.key"
                  class="cell-course"
                  :class="{ 'has-course': getCourse(room.id, section, day.key) }"
                >
                  <div 
                    v-if="getCourse(room.id, section, day.key)"
                    class="course-card"
                    :style="{ backgroundColor: getCourseColor(getCourse(room.id, section, day.key)) }"
                  >
                    <div class="course-name">
                      {{ getCourse(room.id, section, day.key).courseName }}
                    </div>
                    <div class="course-info" v-if="getCourse(room.id, section, day.key).teacherName">
                      {{ getCourse(room.id, section, day.key).teacherName }}
                    </div>
                    <div class="course-week" v-if="getCourse(room.id, section, day.key).weekRange">
                      {{ getCourse(room.id, section, day.key).weekRange }}
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

/* -------------------- Props -------------------- */
const props = defineProps({
  courses: { type: Object, default: () => ({}) },
  rooms: { type: Array, default: () => [] },
  sections: {
    type: Array,
    default: () => [
      { name: "1-2节", timeRange: "08:00-09:40", startSlot: 1, endSlot: 2 },
      { name: "3-4节", timeRange: "10:00-11:40", startSlot: 3, endSlot: 4 },
      { name: "5-6节", timeRange: "14:00-15:40", startSlot: 5, endSlot: 6 },
      { name: "7-8节", timeRange: "16:00-17:40", startSlot: 7, endSlot: 8 },
      { name: "9-10节", timeRange: "18:40-20:15", startSlot: 9, endSlot: 10 },
      { name: "11-12节", timeRange: "20:20-21:05", startSlot: 11, endSlot: 11 },
    ],
  },
  // 当前选中的学期ID
  semesterId: { type: [Number, String], default: null },
});

/* -------------------- 星期配置 -------------------- */
const weekDays = [
  { key: 1, name: "星期一" },
  { key: 2, name: "星期二" },
  { key: 3, name: "星期三" },
  { key: 4, name: "星期四" },
  { key: 5, name: "星期五" },
  { key: 6, name: "星期六" },
  { key: 7, name: "星期日" },
];

/* -------------------- 颜色配置 -------------------- */
const courseColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

/* -------------------- 数据转换 -------------------- */
const roomList = computed(() => props.rooms || []);

// 将课程数据转换为 Map（按学期过滤）
const courseMap = computed(() => {
  const map = new Map();
  
  Object.entries(props.courses).forEach(([roomIdStr, courses]) => {
    if (!Array.isArray(courses)) return;
    
    courses.forEach((course) => {
      // 如果指定了学期ID，过滤掉不匹配的课程
      if (props.semesterId && course.semesterId !== parseInt(props.semesterId)) {
        return;
      }
      
      // 使用 startSection/endSection 确定节次
      const startSec = parseInt(course.startSection) || 1;
      const endSec = parseInt(course.endSection) || startSec;
      
      // 找到匹配的节次配置
      const section = props.sections.find(s => s.startSlot === startSec && s.endSlot === endSec);
      if (!section) return;
      
      // 遍历每个星期几
      (course.weekdays || []).forEach((dayKey) => {
        const key = `${roomIdStr}_${section.name}_${dayKey}`;
        map.set(key, {
          ...course,
          weekRange: course.startWeek === course.endWeek 
            ? `第${course.startWeek}周` 
            : `${course.startWeek}-${course.endWeek}周`,
        });
      });
    });
  });
  
  return map;
});

// 获取课程
function getCourse(roomId, section, dayKey) {
  const key = `${roomId}_${section.name}_${dayKey}`;
  return courseMap.value.get(key) || null;
}

// 获取课程颜色
function getCourseColor(course) {
  if (!course) return "transparent";
  const key = `${course.courseName}_${course.teacherName || 'unknown'}`;
  // 简单哈希
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return courseColors[Math.abs(hash) % courseColors.length];
}
</script>

<style scoped>
.lab-room-schedule {
  width: 100%;
  overflow-x: auto;
}

.schedule-table-wrapper {
  min-width: 1000px;
  border: 1px solid #c3d9ff;
  border-radius: 4px;
  overflow: hidden;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: #333;
  background-color: #fff;
}

.schedule-table thead th {
  background-color: #f5f7fa;
  border: 1px solid #c3d9ff;
  padding: 10px 8px;
  text-align: center;
  font-weight: 600;
  color: #606266;
}

.col-section { width: 60px; min-width: 60px; }
.col-room { width: 60px; min-width: 60px; }
.col-day { min-width: 120px; }

.schedule-table td {
  border: 1px solid #c3d9ff;
  padding: 4px;
  vertical-align: middle;
}

.cell-section {
  text-align: center;
  background-color: #fafafa;
}

.section-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.section-time {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.cell-room {
  text-align: center;
  font-weight: 500;
  background-color: #fafafa;
}

.cell-course {
  height: 60px;
  min-height: 60px;
  background-color: #fff;
}

.cell-course.has-course {
  padding: 2px;
}

.course-card {
  height: 100%;
  min-height: 56px;
  border-radius: 4px;
  padding: 6px 8px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  box-sizing: border-box;
  overflow: hidden;
}

.course-name {
  font-weight: 600;
  font-size: 12px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-info {
  font-size: 11px;
  opacity: 0.95;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-week {
  font-size: 10px;
  opacity: 0.9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
