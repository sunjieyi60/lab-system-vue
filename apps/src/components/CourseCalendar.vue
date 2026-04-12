<template>
  <div class="course-calendar-custom">
    <!-- 1. 顶部星期标题行 -->
    <div class="week-header">
      <!-- 左上角空白角 -->
      <div class="corner-cell">节次</div>
      <div v-for="d in weekDays" :key="d.key" class="week-cell">
        {{ d.name }} ({{ d.date }})
      </div>
    </div>

    <!-- 2. 主体：左侧节次 + 7 列网格 -->
    <div class="body-wrapper">
      <!-- 2.1 左侧节次列 -->
      <div class="left-col">
        <div v-for="(sec, idx) in sections" :key="idx" class="left-slot">
          <div class="sec-name">{{ sec.name }}</div>
          <div class="sec-time">( {{ sec.start }} ~ {{ sec.end }} )</div>
        </div>
      </div>

      <!-- 2.2 7 列网格（每日一列） -->
      <div v-for="d in weekDays" :key="d.key" class="day-grid">
        <!-- 背景行 -->
        <div v-for="(_, idx) in sections" :key="idx" class="row-slot"></div>

        <!-- 当天事件 -->
        <div
          v-for="(ev, i) in eventsOfDay(d.iso)"
          :key="i"
          class="event-card"
          :class="{ 'is-selected': ev.scheduleId && ev.scheduleId === selectedScheduleId }"
          :style="{
            top: (ev.gridRowStart - 1) * 42 + 3 + 'px',
            height: (ev.gridRowEnd - ev.gridRowStart) * 42 - 6 + 'px',
            backgroundColor: ev.backgroundColor || '#3b82f6',
          }"
          @click.stop="handleCardClick(ev)"
        >
          <div class="event-title">{{ ev.title }}</div>
          <div class="event-teacher" v-if="ev.teacher">{{ ev.teacher }}</div>
          <div class="event-mark" v-if="ev.mark">{{ ev.mark }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

/* -------------------- Props -------------------- */
const props = defineProps({
  courses: {
    type: Array,
    default: () => [],
  },
  selectedScheduleId: {
    // 改为选中排课实例ID
    type: String,
    default: null,
  },
});

const emit = defineEmits(["select-schedule"]); // 改为选中排课实例

/* -------------------- 节次配置 -------------------- */
const sections = [
  { start: "08:00", end: "08:45", name: "第1节" },
  { start: "08:55", end: "09:40", name: "第2节" },
  { start: "10:00", end: "10:45", name: "第3节" },
  { start: "10:55", end: "11:40", name: "第4节" },
  { start: "14:10", end: "14:55", name: "第5节" },
  { start: "15:05", end: "15:50", name: "第6节" },
  { start: "16:00", end: "16:45", name: "第7节" },
  { start: "16:55", end: "17:40", name: "第8节" },
  { start: "18:40", end: "19:25", name: "第9节" },
  { start: "19:30", end: "20:15", name: "第10节" },
  { start: "20:20", end: "21:05", name: "第11节" },
];

/* -------------------- 颜色配置 -------------------- */
const courseColors = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

/* -------------------- 将课程数据转换为事件格式 -------------------- */
const convertCourseToEvents = (courses) => {
  if (!courses || courses.length === 0) return [];
  
  const events = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  
  courses.forEach((course, index) => {
    const color = courseColors[index % courseColors.length];
    const weekdays = course.weekdays || [];
    
    weekdays.forEach((weekday) => {
      // weekday: 1=周一, 2=周二, ..., 7=周日
      const dayIndex = weekday - 1; // 0=周一, 6=周日
      const courseDate = new Date(monday);
      courseDate.setDate(monday.getDate() + dayIndex);
      const dateStr = courseDate.toISOString().slice(0, 10);
      
      // 构建开始和结束时间
      const startDateTime = `${dateStr}T${course.startTime}`;
      const endDateTime = `${dateStr}T${course.endTime}`;
      
      // 生成唯一排课实例ID：课程ID + 星期 + 日期
      const scheduleId = `${course.id}-${weekday}-${dateStr}`;
      
      events.push({
        id: course.id,
        scheduleId: scheduleId, // 唯一的排课实例ID
        title: course.courseName,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: color,
        teacher: course.teacherName,
        mark: course.mark,
      });
    });
  });
  
  return events;
};

/* -------------------- 日期工具 -------------------- */
function hhmmToMin(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function isoToHHMM(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

/* 根据时间返回节次索引（0 开始） */
function findSectionIndexByTime(hhmm) {
  const t = hhmmToMin(hhmm);
  for (let i = 0; i < sections.length; i++) {
    const s = hhmmToMin(sections[i].start);
    const e = hhmmToMin(sections[i].end);
    if (t >= s && t < e) return i;
  }
  // 最接近
  for (let i = 0; i < sections.length; i++) {
    if (hhmmToMin(sections[i].start) > t) return i;
  }
  return sections.length - 1;
}

/* 计算 grid 起止行（1-based） */
function calcEventGrid(event) {
  const startHHMM = isoToHHMM(event.start);
  const endHHMM = isoToHHMM(event.end);
  const startIdx = findSectionIndexByTime(startHHMM);
  let endIdx = startIdx;
  const endMin = hhmmToMin(endHHMM);
  for (let i = startIdx; i < sections.length; i++) {
    const s = hhmmToMin(sections[i].start);
    if (endMin > s) endIdx = i;
    else break;
  }
  return { gridRowStart: startIdx + 1, gridRowEnd: endIdx + 2 };
}

/* -------------------- 动态当前周日期 -------------------- */
const weekDays = computed(() => {
  // 获取本周一
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=周日, 1=周一, ..., 6=周六
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 如果是周日，退到上周一
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const month = d.getMonth() + 1;
    const date = d.getDate();

    return {
      key: i,
      name: [
        "星期一",
        "星期二",
        "星期三",
        "星期四",
        "星期五",
        "星期六",
        "星期日",
      ][i],
      date: `${month}月${String(date).padStart(2, "0")}日`,
      iso: d.toISOString().slice(0, 10),
    };
  });
});

/* -------------------- 带 grid 信息的事件 -------------------- */
const events = ref([]);

// 监听 courses prop 变化
watch(
  () => props.courses,
  (newCourses) => {
    events.value = convertCourseToEvents(newCourses);
  },
  { immediate: true }
);

const computedEvents = computed(() =>
  events.value.map((ev) => {
    const pos = calcEventGrid(ev);
    return {
      ...ev,
      gridRowStart: pos.gridRowStart,
      gridRowEnd: pos.gridRowEnd,
    };
  })
);

/* -------------------- 按天过滤事件 -------------------- */
function eventsOfDay(dateIso) {
  return computedEvents.value.filter((ev) => ev.start.startsWith(dateIso));
}

/* -------------------- 格式化时间 -------------------- */
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* -------------------- 处理卡片点击 -------------------- */
function handleCardClick(ev) {
  if (ev.scheduleId) {
    // 如果点击的是已选中的卡片，则取消选中
    if (props.selectedScheduleId === ev.scheduleId) {
      emit("select-schedule", null);
    } else {
      emit("select-schedule", ev.scheduleId);
    }
  }
}
</script>

<style scoped>
/* ---------- 整体 ---------- */
.course-calendar-custom {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1250px;
  margin: 0;
  font-size: 13px;
  color: #333;
}

/* ---------- 顶部星期栏 ---------- */
.week-header {
  display: grid;
  grid-template-columns: 120px repeat(7, 1fr);
  height: 42px;
  line-height: 42px;
  text-align: center;
  border-bottom: 1px solid #c3d9ff;
  border-top: 1px solid #c3d9ff;
}
/* 左上角单元格的样式 */
.corner-cell {
  width: 120px;
  box-sizing: border-box;
  border-right: 1px solid #c3d9ff;
  border-left: 1px solid #c3d9ff;
}
/* 表格第一行 时间行 的样式 */
.week-cell {
  border-right: 1px solid #c3d9ff;
}
.week-name {
  font-weight: 600;
}
.week-date {
  font-size: 12px;
  color: #666;
}

/* ---------- 主体：左侧 + 7 列 ---------- */
.body-wrapper {
  display: grid;
  grid-template-columns: 120px repeat(7, 1fr);
}

/* ---------- 左侧节次整体列--------- */
.left-col {
  display: flex;
  flex-direction: column;
}
/* 左侧的每个网格 */
.left-slot {
  height: 42px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  border-bottom: 1px solid #c3d9ff;
  border-left: 1px solid #c3d9ff;
  border-right: 1px solid #c3d9ff;
}
.sec-name {
  font-weight: 600;
}
.sec-time {
  font-size: 12px;
  color: #666;
}

/* ---------- 每日网格,每一列的样式 ---------- */
.day-grid {
  display: grid;
  position: relative;
  border-right: 1px solid #c3d9ff;
  grid-auto-rows: 42px; /* ⭐固定每一行的高度 */
  /* 移除overflow: hidden，避免卡片被截断 */
}
/* 每个背景格子 */
.row-slot {
  box-sizing: border-box;
  position: relative;
  border-bottom: 1px solid #c3d9ff; /* 新增：浅蓝色竖线 */
  z-index: 1;
}

/* ---------- 事件卡片 ---------- */
.event-card {
  position: absolute;
  /* 左右各4px留白，实现对称 */
  left: 4px;
  right: 4px;
  box-sizing: border-box;
  /* 保留少量内边距，让文字不贴边 */
  padding: 4px 0;
  border-radius: 6px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 2;
  /* 防止卡片内容溢出 */
  overflow: hidden;
}

.event-title {
  font-weight: 600;
  font-size: 12px;
  padding-left: 6px;
  padding-right: 6px;
  /* 长标题溢出处理 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.event-teacher {
  font-size: 11px;
  opacity: 0.9;
  margin-top: 2px;
  padding-left: 6px;
  padding-right: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.event-mark {
  font-size: 10px;
  opacity: 0.8;
  margin-top: 2px;
  padding-left: 6px;
  padding-right: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 选中状态 */
.event-card.is-selected {
  outline: 3px solid #fff;
  outline-offset: -3px;
  box-shadow: 0 0 0 4px #409eff, 0 6px 16px rgba(0, 0, 0, 0.4);
  transform: scale(1.03);
  z-index: 10;
}

.event-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.event-card:hover {
  filter: brightness(1.1);
}
</style>
