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
                  :class="{ 'has-course': getCourses(room.id, section, day.key).length > 0 }"
                >
                  <!-- 单个课程 - 正常显示 -->
                  <div 
                    v-if="getCourses(room.id, section, day.key).length === 1"
                    class="course-card"
                    :style="{ backgroundColor: getCourseColor(getCourses(room.id, section, day.key)[0]) }"
                  >
                    <!-- 第一行：课程名称 -->
                    <div class="course-name">
                      {{ getCourses(room.id, section, day.key)[0].courseName }}
                    </div>
                    <!-- 第二行：教师 + 周次 -->
                    <div class="course-info-line">
                      <span v-if="getCourses(room.id, section, day.key)[0].teacherName">{{ getCourses(room.id, section, day.key)[0].teacherName }}</span>
                      <span v-if="getCourses(room.id, section, day.key)[0].teacherName && getCourses(room.id, section, day.key)[0].weekRange" class="separator">|</span>
                      <span v-if="getCourses(room.id, section, day.key)[0].weekRange">{{ getCourses(room.id, section, day.key)[0].weekRange }}</span>
                    </div>
                    <!-- 第三行：班级 + 人数 + 时间 -->
                    <div class="course-extra-line">
                      <span v-if="getCourses(room.id, section, day.key)[0].majorClass">{{ getCourses(room.id, section, day.key)[0].majorClass }}</span>
                      <span v-if="getCourses(room.id, section, day.key)[0].majorClass && getCourses(room.id, section, day.key)[0].studentCount" class="separator">|</span>
                      <span v-if="getCourses(room.id, section, day.key)[0].studentCount">{{ getCourses(room.id, section, day.key)[0].studentCount }}人</span>
                      <span v-if="(getCourses(room.id, section, day.key)[0].majorClass || getCourses(room.id, section, day.key)[0].studentCount) && getCourses(room.id, section, day.key)[0].timeRange" class="separator">|</span>
                      <span v-if="getCourses(room.id, section, day.key)[0].timeRange">{{ getCourses(room.id, section, day.key)[0].timeRange }}</span>
                    </div>
                  </div>
                  
                  <!-- 多个课程 - 水平并排显示 -->
                  <div 
                    v-else-if="getCourses(room.id, section, day.key).length > 1"
                    class="course-card-container"
                  >
                    <div
                      v-for="(course, idx) in getCourses(room.id, section, day.key)"
                      :key="idx"
                      class="course-card split-card"
                      :style="{ 
                        backgroundColor: getCourseColor(course),
                        flex: 1,
                      }"
                    >
                      <!-- 第一行：课程名称 -->
                      <div class="course-name">{{ course.courseName }}</div>
                      <!-- 第二行：教师 + 周次 -->
                      <div class="course-info-line">
                        <span v-if="course.teacherName">{{ course.teacherName }}</span>
                        <span v-if="course.teacherName && course.weekRange" class="separator">|</span>
                        <span v-if="course.weekRange">{{ course.weekRange }}</span>
                      </div>
                      <!-- 第三行：班级 + 人数 + 时间 -->
                      <div class="course-extra-line">
                        <span v-if="course.majorClass">{{ course.majorClass }}</span>
                        <span v-if="course.majorClass && course.studentCount" class="separator">|</span>
                        <span v-if="course.studentCount">{{ course.studentCount }}人</span>
                        <span v-if="(course.majorClass || course.studentCount) && course.timeRange" class="separator">|</span>
                        <span v-if="course.timeRange">{{ course.timeRange }}</span>
                      </div>
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

// 判断两个节次范围是否有重叠
function hasSectionOverlap(start1, end1, start2, end2) {
  return Math.max(start1, start2) <= Math.min(end1, end2);
}

// 从 mark 字段中提取周次信息（如 "1-16周" 或 "第3周"）
function extractWeekFromMark(mark) {
  if (!mark) return '';
  // 匹配 "数字-数字周" 或 "数字周" 或 "第数字周"
  const match = mark.match(/(\d+-\d+周|\d+周|第\d+周)/);
  return match ? match[1] : '';
}

// 从 mark 中移除周次信息，返回清理后的内容
// 如果 mark 只包含周次信息（与计算的 weekRange 相同），返回空字符串
function cleanMark(mark, computedWeekRange) {
  if (!mark) return '';
  
  // 提取 mark 中的周次信息
  const weekInMark = extractWeekFromMark(mark);
  
  // 如果 mark 只包含周次信息，且与计算的 weekRange 相同，返回空
  if (weekInMark && weekInMark === computedWeekRange) {
    return '';
  }
  
  // 如果 mark 包含其他内容，移除周次信息后返回
  let cleaned = mark.replace(/(\d+-\d+周|\d+周|第\d+周)/, '');
  // 移除可能残留的分隔符和多余空格
  cleaned = cleaned.replace(/\|\s*\||^\s*\||\|\s*$/g, '').trim();
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

// 将课程数据转换为 Map（按学期过滤，支持同一时间段多个课程）
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
      
      // 遍历每个星期几
      (course.weekdays || []).forEach((dayKey) => {
        // 找到所有与该课程节次有重叠的节次配置
        props.sections.forEach(section => {
          if (hasSectionOverlap(startSec, endSec, section.startSlot, section.endSlot)) {
            const key = `${roomIdStr}_${section.name}_${dayKey}`;
            
            if (!map.has(key)) {
              map.set(key, []);
            }
            
            // 检查是否已存在相同课程（避免重复添加）
            const existingList = map.get(key);
            const exists = existingList.some(c => c.id === course.id);
            
            if (!exists) {
              // 计算 weekRange
              let weekRange = '';
              if (course.startWeek && course.endWeek) {
                weekRange = course.startWeek === course.endWeek 
                  ? `第${course.startWeek}周` 
                  : `第${course.startWeek}-${course.endWeek}周`;
              } else if (course.weekRange) {
                weekRange = course.weekRange;
              } else {
                // 从 mark 中提取周次
                weekRange = extractWeekFromMark(course.mark);
              }
              
              // 清理 mark，移除周次信息避免重复
              const cleanedMark = cleanMark(course.mark, weekRange);
              
              // 计算时间范围
              const timeRange = course.startTime && course.endTime
                ? `${course.startTime.slice(0, 5)}-${course.endTime.slice(0, 5)}`
                : '';
              
              existingList.push({
                ...course,
                weekRange,
                displayMark: cleanedMark,
                timeRange,
              });
            }
          }
        });
      });
    });
  });
  
  return map;
});

// 获取课程列表（可能是多个）
function getCourses(roomId, section, dayKey) {
  const key = `${roomId}_${section.name}_${dayKey}`;
  return courseMap.value.get(key) || [];
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
  overflow-x: scroll;
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

.course-card-container {
  display: flex;
  height: 100%;
  min-height: 56px;
  gap: 2px;
}

.course-card {
  height: 100%;
  min-height: 56px;
  border-radius: 4px;
  padding: 4px 6px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1px;
  box-sizing: border-box;
  overflow: hidden;
}

.split-card {
  flex: 1;
  min-width: 0; /* 允许flex item收缩 */
}

.course-name {
  font-weight: 600;
  font-size: 12px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.course-info-line {
  font-size: 11px;
  opacity: 0.9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.course-extra-line {
  font-size: 10px;
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.course-info-line .separator,
.course-extra-line .separator {
  margin: 0 4px;
  opacity: 0.7;
}
</style>
