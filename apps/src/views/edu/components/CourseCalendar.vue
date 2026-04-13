<template>
  <div ref="calendarRef" class="course-calendar-custom">
    <!-- 1. 顶部星期标题行 -->
    <div class="week-header">
      <!-- 左上角空白角 -->
      <div class="corner-cell">节次</div>
      <div v-for="d in weekDays" :key="d.key" class="week-cell">
        {{ d.name }}
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

        <!-- 当天事件组 - 按时间段分组显示 -->
        <div
          v-for="(group, groupKey) in eventGroupsOfDay(d.iso)"
          :key="groupKey"
        >
          <!-- 单个课程 - 正常显示 -->
          <el-tooltip
            v-if="group.events.length === 1"
            :content="getEventTooltip(group.mainEvent)"
            placement="top"
            :show-after="300"
            effect="dark"
          >
            <div
              class="event-card"
              :class="{
                'is-selected':
                  group.mainEvent.scheduleId &&
                  group.mainEvent.scheduleId === selectedScheduleId,
              }"
              :style="{
                top: (group.mainEvent.gridRowStart - 1) * rowHeight + 2 + 'px',
                height:
                  (group.mainEvent.gridRowEnd - group.mainEvent.gridRowStart) *
                    rowHeight -
                  4 +
                  'px',
                left: '4px',
                right: '4px',
                width: 'auto',
                backgroundColor: group.mainEvent.backgroundColor || '#3b82f6',
              }"
              @click.stop="handleCardClick(group.mainEvent)"
            >
              <div class="event-title">{{ group.mainEvent.title }}</div>
              <!-- 第二行：教师 + 周次 -->
              <div
                class="event-teacher"
                v-if="group.mainEvent.teacher || group.mainEvent.weekRange"
              >
                <span v-if="group.mainEvent.teacher">{{
                  group.mainEvent.teacher
                }}</span>
                <span
                  v-if="group.mainEvent.teacher && group.mainEvent.weekRange"
                  class="separator"
                  >|</span
                >
                <span v-if="group.mainEvent.weekRange"
                  >{{ group.mainEvent.weekRange }}</span
                >
              </div>
              <!-- 第三行：班级 + 人数 + 时间 -->
              <div
                class="event-info"
                v-if="
                  group.mainEvent.majorClass ||
                  group.mainEvent.studentCount ||
                  group.mainEvent.timeRange
                "
              >
                <span v-if="group.mainEvent.majorClass">{{
                  group.mainEvent.majorClass
                }}</span>
                <span
                  v-if="group.mainEvent.majorClass && group.mainEvent.studentCount"
                  class="separator"
                  >|</span
                >
                <span v-if="group.mainEvent.studentCount"
                  >{{ group.mainEvent.studentCount }}人</span
                >
                <span
                  v-if="(group.mainEvent.majorClass || group.mainEvent.studentCount) && group.mainEvent.timeRange"
                  class="separator"
                  >|</span
                >
                <span v-if="group.mainEvent.timeRange"
                  >{{ group.mainEvent.timeRange }}</span
                >
              </div>
            </div>
          </el-tooltip>

          <!-- 多个课程 - 对半分显示，每个课程占一半长度（宽度） -->
          <template v-else>
            <el-tooltip
              v-for="(ev, idx) in group.events"
              :key="ev.scheduleId"
              :content="getEventTooltip(ev)"
              placement="top"
              :show-after="300"
              effect="dark"
            >
              <div
                class="event-card"
                :class="{ 'is-selected': ev.scheduleId === selectedScheduleId }"
                :style="
                  getSplitCardStyle(group.mainEvent, ev, idx, group.events.length)
                "
                @click.stop="handleSingleCardClick(ev)"
              >
                <div class="event-title">{{ ev.title }}</div>
                <!-- 第二行：教师 + 周次 -->
                <div class="event-teacher" v-if="ev.teacher || ev.weekRange">
                  <span v-if="ev.teacher">{{ ev.teacher }}</span>
                  <span v-if="ev.teacher && ev.weekRange" class="separator"
                    >|</span
                  >
                  <span v-if="ev.weekRange">{{ ev.weekRange }}</span>
                </div>
                <!-- 第三行：班级 + 人数 + 时间 -->
                <div
                  class="event-info"
                  v-if="ev.majorClass || ev.studentCount || ev.timeRange"
                >
                  <span v-if="ev.majorClass">{{ ev.majorClass }}</span>
                  <span
                    v-if="ev.majorClass && ev.studentCount"
                    class="separator"
                    >|</span
                  >
                  <span v-if="ev.studentCount">{{ ev.studentCount }}人</span>
                  <span
                    v-if="(ev.majorClass || ev.studentCount) && ev.timeRange"
                    class="separator"
                    >|</span
                  >
                  <span v-if="ev.timeRange">{{ ev.timeRange }}</span>
                </div>
              </div>
            </el-tooltip>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";

/* -------------------- 响应式行高 -------------------- */
const calendarRef = ref(null);
const rowHeight = ref(42); // 默认行高

// 计算行高：根据容器高度自动调整
function calculateRowHeight() {
  if (!calendarRef.value) return;

  const containerHeight = calendarRef.value.clientHeight;
  const headerHeight = 42; // 表头高度
  const availableHeight = containerHeight - headerHeight;
  const sectionCount = 11; // 11节课

  // 计算行高，最小30px，最大根据可用空间
  const calculatedHeight = Math.floor(availableHeight / sectionCount);
  rowHeight.value = Math.max(30, Math.min(calculatedHeight, 60)); // 限制在30-60px之间

  // 更新CSS变量
  calendarRef.value.style.setProperty("--row-height", rowHeight.value + "px");
}

// 监听窗口大小变化
let resizeObserver = null;
onMounted(() => {
  calculateRowHeight();
  resizeObserver = new ResizeObserver(() => {
    calculateRowHeight();
  });
  if (calendarRef.value) {
    resizeObserver.observe(calendarRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

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
        majorClass: course.majorClass,
        studentCount: course.studentCount,
        weekRange:
          course.weekRange ||
          (course.startWeek != null && course.endWeek != null
            ? `${course.startWeek}-${course.endWeek}周`
            : ""),
        timeRange:
          course.startTime && course.endTime
            ? `${course.startTime.slice(0, 5)}-${course.endTime.slice(0, 5)}`
            : "",
        mark: course.mark,
        rawData: course, // 保留原始数据用于详情展示
      });
    });
  });

  // 打印转换为时间格式后的数据
  console.log("[CourseCalendar] 转换后的课程事件数据:", events);
  
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
    d.getMinutes(),
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
  // 优先按节次直接定位，不受具体时间影响
  const raw = event.rawData;
  if (raw && raw.startSection != null && raw.endSection != null) {
    return {
      gridRowStart: raw.startSection,
      gridRowEnd: raw.endSection + 1,
    };
  }

  // 回退：根据时间匹配
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
  { immediate: true },
);

const computedEvents = computed(() =>
  events.value.map((ev) => {
    const pos = calcEventGrid(ev);
    return {
      ...ev,
      gridRowStart: pos.gridRowStart,
      gridRowEnd: pos.gridRowEnd,
    };
  }),
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
// 获取时间段分组的唯一key
function getGroupKey(startSection, endSection, startTime) {
  return `${startSection}-${endSection}-${startTime}`;
}

// 判断两个节次范围是否有重叠
function hasSectionOverlap(start1, end1, start2, end2) {
  // 节次有重叠当且仅当：较早开始的结束时间 >= 较晚开始的开始时间
  return Math.max(start1, start2) <= Math.min(end1, end2);
}

// 按时间段对事件进行分组（有重叠的节次分到同一组）
function eventGroupsOfDay(dateIso) {
  const dayEvents = computedEvents.value.filter((ev) =>
    ev.start.startsWith(dateIso),
  );

  // 按节次重叠进行分组
  const groups = [];

  dayEvents.forEach((ev) => {
    const evStart = ev.rawData?.startSection || ev.gridRowStart;
    const evEnd = ev.rawData?.endSection || ev.gridRowEnd - 1;

    // 查找是否有已存在的组与当前事件有重叠
    let foundGroup = null;
    for (const group of groups) {
      const groupStart = group.startSection;
      const groupEnd = group.endSection;

      if (hasSectionOverlap(evStart, evEnd, groupStart, groupEnd)) {
        foundGroup = group;
        break;
      }
    }

    if (foundGroup) {
      // 加入已有组，并更新组的节次范围为合并后的最大范围
      foundGroup.events.push(ev);
      foundGroup.startSection = Math.min(foundGroup.startSection, evStart);
      foundGroup.endSection = Math.max(foundGroup.endSection, evEnd);
      // 更新卡片显示的节次范围
      foundGroup.mainEvent.gridRowStart = foundGroup.startSection;
      foundGroup.mainEvent.gridRowEnd = foundGroup.endSection + 1;
    } else {
      // 创建新组
      const newGroup = {
        key: `group-${groups.length}`,
        startSection: evStart,
        endSection: evEnd,
        mainEvent: {
          ...ev,
          gridRowStart: evStart,
          gridRowEnd: evEnd + 1,
        },
        events: [ev],
      };
      groups.push(newGroup);
    }
  });

  // 转换为对象格式返回
  const result = {};
  groups.forEach((group, index) => {
    result[group.key] = group;
  });
  return result;
}

// 计算对半分卡片的样式（长度/宽度对半，水平方向排列）
function getSplitCardStyle(mainEvent, ev, index, total) {
  // 计算当前事件自身的节次范围
  const evStart = ev.rawData?.startSection || ev.gridRowStart;
  const evEnd = ev.rawData?.endSection || ev.gridRowEnd - 1;

  // 计算卡片的高度和顶部位置（基于事件自身的节次范围）
  const cardHeight = (evEnd - evStart + 1) * rowHeight.value - 4;
  const topOffset = (evStart - 1) * rowHeight.value + 2;

  // 计算每个卡片的宽度和左侧位置（水平方向分割）
  const gap = 2; // 卡片之间的间距
  const totalWidthPercent = 100;
  const singleWidthPercent = totalWidthPercent / total;

  // 左侧偏移百分比
  const leftPercent = index * singleWidthPercent;

  // 实际宽度百分比（减去间距）
  const finalWidthPercent = singleWidthPercent - (total > 1 ? gap / total : 0);

  return {
    top: topOffset + "px",
    height: cardHeight + "px",
    left: `calc(5px + ${leftPercent}%)`,
    right: "auto",
    width: `calc(${finalWidthPercent}% - 8px)`,
    backgroundColor: ev.backgroundColor || "#3b82f6",
  };
}

// 单个卡片点击处理
function handleSingleCardClick(ev) {
  if (ev.scheduleId) {
    if (props.selectedScheduleId === ev.scheduleId) {
      emit("select-schedule", null);
      ElMessage.info(`已取消选择：${ev.title}`);
    } else {
      emit("select-schedule", ev.scheduleId);
      ElMessage.success(`已选择课程：${ev.title}`);
    }
  }
}

// 生成课程卡片的悬浮提示内容
function getEventTooltip(ev) {
  const lines = [];
  
  // 课程名称
  lines.push(`课程：${ev.title || '未知'}`);
  
  // 教师
  if (ev.teacher) {
    lines.push(`教师：${ev.teacher}`);
  }
  
  // 班级
  if (ev.majorClass) {
    lines.push(`班级：${ev.majorClass}`);
  }
  
  // 人数
  if (ev.studentCount) {
    lines.push(`人数：${ev.studentCount}人`);
  }
  
  // 周次范围
  if (ev.weekRange) {
    lines.push(`周次：${ev.weekRange}`);
  } else if (ev.rawData?.startWeek != null && ev.rawData?.endWeek != null) {
    lines.push(`周次：第${ev.rawData.startWeek}-${ev.rawData.endWeek}周`);
  }
  
  // 时间范围
  if (ev.timeRange) {
    lines.push(`时间：${ev.timeRange}`);
  } else if (ev.rawData?.startTime && ev.rawData?.endTime) {
    lines.push(`时间：${ev.rawData.startTime.slice(0, 5)}-${ev.rawData.endTime.slice(0, 5)}`);
  }
  
  // 节次
  if (ev.rawData?.startSection && ev.rawData?.endSection) {
    lines.push(`节次：第${ev.rawData.startSection}-${ev.rawData.endSection}节`);
  }
  
  // 备注
  if (ev.mark) {
    lines.push(`备注：${ev.mark}`);
  }
  
  return lines.join('\n');
}

function handleCardClick(ev) {
  // 单门课程，正常选中逻辑
  if (ev.scheduleId) {
    if (props.selectedScheduleId === ev.scheduleId) {
      emit("select-schedule", null);
      ElMessage.info(`已取消选择：${ev.title}`);
    } else {
      emit("select-schedule", ev.scheduleId);
      ElMessage.success(`已选择课程：${ev.title}`);
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
  height: 100%;
  font-size: 13px;
  color: #333;
  --row-height: 42px;
}

/* ---------- 顶部星期栏 ---------- */
.week-header {
  display: grid;
  grid-template-columns: 120px repeat(7, 1fr);
  height: var(--row-height);
  line-height: var(--row-height);
  text-align: center;
  border-bottom: 1px solid #c3d9ff;
  border-top: 1px solid #c3d9ff;
}
/* 左上角单元格的样式 */
.corner-cell {
  width: 120px;
  box-sizing: border-box;
  /* border-right: 1px solid #c3d9ff; */
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
  grid-template-rows: repeat(
    11,
    var(--row-height)
  ); /* 11行，行高由CSS变量控制 */
}

/* ---------- 左侧节次整体列--------- */
.left-col {
  display: grid;
  grid-template-rows: repeat(11, var(--row-height)); /* 与右侧完全一致 */
}
/* 左侧的每个网格 */
.left-slot {
  height: var(--row-height);
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
  font-size: 12px;
}
.sec-time {
  font-size: 10px;
  color: #666;
}

/* ---------- 每日网格,每一列的样式 ---------- */
.day-grid {
  display: grid;
  position: relative;
  /* border-right: 1px solid #c3d9ff; */
  grid-template-rows: repeat(11, var(--row-height)); /* 与左侧完全一致 */
}
/* 每个背景格子 */
.row-slot {
  box-sizing: border-box;
  position: relative;
  border-bottom: 1px solid #c3d9ff;
  border-right: 1px solid #c3d9ff; /* 添加右边框 */
  z-index: 1;
}

/* ---------- 事件卡片 ---------- */
.event-card {
  position: absolute;
  /* 宽度和位置由行内样式动态控制，单个卡片时左右4px，多个时对半分 */
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
.event-teacher .separator {
  margin: 0 4px;
  opacity: 0.7;
}
.event-info {
  font-size: 10px;
  opacity: 0.85;
  margin-top: 2px;
  padding-left: 6px;
  padding-right: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.event-info .separator {
  margin: 0 4px;
  opacity: 0.7;
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
  box-shadow:
    0 0 0 4px #409eff,
    0 6px 16px rgba(0, 0, 0, 0.4);
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
