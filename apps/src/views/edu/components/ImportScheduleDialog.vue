<template>
  <el-dialog
    v-model="visible"
    title="导入课表"
    class="custom-import-container"
    :close-on-click-modal="false"
    @closed="reset"
  >
    <div class="import-container">
      <!-- 步骤提示 -->
      <el-steps :active="currentStep" finish-status="success" simple>
        <el-step title="上传文件" />
        <el-step title="数据预览" />
        <el-step title="导入完成" />
      </el-steps>

      <!-- 步骤1: 上传文件 -->
      <div v-if="currentStep === 0" class="step-content">
        <el-upload
          class="upload-area"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="1"
          accept=".xlsx,.xls"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">
              请上传 Excel 格式的课表文件（.xlsx 或 .xls）
            </div>
          </template>
        </el-upload>

        <div class="template-download">
          <el-link type="primary" @click="downloadTemplate">
            <el-icon><download /></el-icon>
            下载导入模板
          </el-link>
        </div>
      </div>

      <!-- 步骤2: 数据预览 -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="preview-header">
          <span
            >共解析到
            <strong>{{ parsedCourses.length }}</strong> 条课程记录</span
          >
          <el-button type="primary" size="small" @click="currentStep = 0"
            >重新上传</el-button
          >
        </div>

        <el-table :data="parsedCourses" height="300" border stripe>
          <el-table-column prop="courseName" label="课程名称" width="150" />
          <el-table-column prop="majorClass" label="专业班级" width="120" />
          <el-table-column prop="studentCount" label="人数" width="70" />
          <el-table-column prop="teacherName" label="教师" width="100" />
          <el-table-column prop="weekRange" label="周次" width="100" />
          <el-table-column prop="weekday" label="星期" width="80" />
          <el-table-column prop="section" label="节次" width="80" />
        </el-table>

        <div class="import-options">
          <el-form :model="importOptions" label-width="120px">
            <el-form-item label="课程容量">
              <el-input-number
                v-model="importOptions.defaultVolume"
                :min="1"
                :max="200"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 步骤3: 导入完成 -->
      <div v-if="currentStep === 2" class="step-content">
        <el-result
          :icon="importResult.success ? 'success' : 'warning'"
          :title="importResult.success ? '导入成功' : '部分导入成功'"
          :sub-title="importResult.message"
        >
          <template #extra>
            <el-button type="primary" @click="handleClose">完成</el-button>
          </template>
        </el-result>

        <div v-if="importResult.errors.length > 0" class="error-list">
          <el-divider>错误信息</el-divider>
          <el-alert
            v-for="(error, index) in importResult.errors"
            :key="index"
            :title="error"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
        </div>
      </div>
    </div>

    <template #footer v-if="currentStep === 1">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="importing" @click="handleImport">
        确认导入
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { UploadFilled, Download } from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import {
  createCourseSchedule,
  createCourse,
  getCourseList,
  getTeacherList,
  createTeacher,
} from "@/api/edu.js";

const props = defineProps({
  modelValue: Boolean,
  // 当前选中的学期ID（从排课页面传入）
  semesterId: {
    type: Number,
    default: null,
  },
  // 当前选中的实验室ID（从排课页面传入）
  laboratoryId: {
    type: Number,
    default: null,
  },
  // 实验室列表（用于获取部门信息）
  laboratoryList: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "success"]);

const visible = ref(false);
const currentStep = ref(0);
const importing = ref(false);
const parsedCourses = ref([]);
const rawFile = ref(null);
const parsedSemesterName = ref("");

// 导入选项
const importOptions = reactive({
  defaultVolume: 48,
});

// 导入结果
const importResult = reactive({
  success: false,
  message: "",
  errors: [],
});

// 缓存课程和教师列表
let courseCache = [];
let teacherCache = [];

// 节次映射（用于计算 startSection, endSection, startTime, endTime）
const sectionConfig = {
  "1-2": {
    startSection: 1,
    endSection: 2,
    startTime: "08:00",
    endTime: "09:40",
  },
  "3-4": {
    startSection: 3,
    endSection: 4,
    startTime: "10:00",
    endTime: "11:40",
  },
  "5-6": {
    startSection: 5,
    endSection: 6,
    startTime: "14:10",
    endTime: "15:50",
  },
  "7-8": {
    startSection: 7,
    endSection: 8,
    startTime: "16:00",
    endTime: "17:40",
  },
  "9-11": {
    startSection: 9,
    endSection: 11,
    startTime: "18:40",
    endTime: "21:05",
  },
};

// 星期映射
const weekdayMap = {
  星期一: 1,
  星期二: 2,
  星期三: 3,
  星期四: 4,
  星期五: 5,
  星期六: 6,
  星期日: 7,
};

watch(
  () => props.modelValue,
  async (val) => {
    visible.value = val;
    if (val) {
      // 打开时加载课程和教师列表
      await loadCourseAndTeacherCache();
    }
  },
);

watch(visible, (val) => {
  emit("update:modelValue", val);
});

// 加载课程和教师缓存
async function loadCourseAndTeacherCache() {
  try {
    const [courseRes, teacherRes] = await Promise.all([
      getCourseList(),
      getTeacherList(),
    ]);
    if (courseRes.data?.ok) {
      courseCache = courseRes.data.data || [];
    }
    if (teacherRes.data?.ok) {
      teacherCache = teacherRes.data.data || [];
    }
  } catch (error) {
    console.error("加载缓存失败:", error);
  }
}

// 处理文件上传
function handleFileChange(file) {
  if (!file) return;

  rawFile.value = file.raw;
  parseExcel(file.raw);
}

// 解析 Excel
function parseExcel(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      console.log("解析到的原始数据:", jsonData);

      // 从第一行提取学期信息
      const firstRow = jsonData[0];
      if (firstRow && firstRow[0]) {
        const fullTitle = String(firstRow[0]).trim();
        // 提取学期：如 "2025-2026 第一学期 1区课表" -> "2025-2026 第一学期"
        const semesterMatch = fullTitle.match(/(.+?学期)/);
        parsedSemesterName.value = semesterMatch ? semesterMatch[1] : fullTitle;

        // 学期使用父页面已选中的学期，不再手动选择
      }

      // 解析课程数据
      const courses = extractCourses(jsonData);
      parsedCourses.value = courses;

      if (courses.length > 0) {
        currentStep.value = 1;
        ElMessage.success(`成功解析 ${courses.length} 条课程记录`);
      } else {
        ElMessage.warning("未解析到课程数据，请检查文件格式");
      }
    } catch (error) {
      console.error("解析失败:", error);
      ElMessage.error(error.response?.data?.msg || "文件解析失败，请检查文件格式");
    }
  };

  reader.readAsArrayBuffer(file);
}

// 从表格数据中提取课程信息
function extractCourses(data) {
  const courses = [];

  // 表头行（第3行，索引2）
  const headerRow = data[2];
  if (!headerRow) return courses;

  // 从第4行开始是数据（索引3）
  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;

    const section = row[0]; // 节次

    if (!section || !sectionConfig[section]) continue;

    // 遍历星期列（列2-8对应星期一到星期日，列1是教室但不使用）
    const weekdays = [
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
      "星期日",
    ];

    for (let j = 0; j < weekdays.length; j++) {
      const cellValue = row[j + 2];
      if (!cellValue || typeof cellValue !== "string") continue;

      const courseInfo = parseCourseCell(cellValue);
      if (courseInfo) {
        // 基础节次配置
        const baseConfig = { ...sectionConfig[section] };

        // 如果单元格中提供了具体时间（如 13:00-15:00），覆盖标准节次时间
        const timeMatch = courseInfo.sectionOrTime?.match(
          /(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/,
        );
        if (timeMatch) {
          baseConfig.startTime = timeMatch[1];
          baseConfig.endTime = timeMatch[2];
        }

        courses.push({
          ...courseInfo,
          weekday: weekdays[j],
          weekdayNum: weekdayMap[weekdays[j]],
          section,
          ...baseConfig,
        });
      }
    }
  }

  return courses;
}

// 解析单元格中的课程信息
// 格式：课程名称[编号] 专业班级 人数 周次 节次或时间 上课教师
// 例如：人工智能与计算思维[12] 自动化2401班 56人 3-18周 1-2节 莫海芳
// 例如：电子电路CAD[01] 电信2401班 56人 3-18周 13:00-15:00 莫海芳
function parseCourseCell(cellValue) {
  if (!cellValue || cellValue.trim() === "") return null;

  // 匹配课程名称（忽略方括号内的编号）
  const courseMatch = cellValue.match(/^(.+?)\[(\d+)\]\s+/);
  if (!courseMatch) return null;

  const courseName = courseMatch[1].trim();
  let rest = cellValue.substring(courseMatch[0].length).trim();

  // 专业班级：匹配如 "自动化2401班"、"电信2401班"
  const classMatch = rest.match(/^(.+?班)\s+/);
  if (!classMatch) return null;
  const majorClass = classMatch[1].trim();
  rest = rest.substring(classMatch[0].length).trim();

  // 人数
  const peopleMatch = rest.match(/^(\d+)人\s+/);
  const studentCount = peopleMatch ? parseInt(peopleMatch[1]) : null;
  if (peopleMatch) rest = rest.substring(peopleMatch[0].length).trim();

  // 周次
  const weekMatch = rest.match(/^(\d+)-(\d+)周\s+/);
  const startWeek = weekMatch ? parseInt(weekMatch[1]) : 1;
  const endWeek = weekMatch ? parseInt(weekMatch[2]) : 16;
  if (weekMatch) rest = rest.substring(weekMatch[0].length).trim();

  // 节次或时间（可能以"节"结尾，也可能不是，如 13:00-15:00）
  const sectionMatch = rest.match(/^(.+?)(?:节)?\s+/);
  const sectionOrTime = sectionMatch ? sectionMatch[1].trim() : "";
  if (sectionMatch) rest = rest.substring(sectionMatch[0].length).trim();

  // 上课教师（剩余部分）
  const teacherName = rest.trim();

  // 从专业班级中提取年级，如 "自动化2401班" -> "2024级"
  const gradeMatch = majorClass.match(/(\d{2})(\d{2})班$/);
  const grade = gradeMatch ? `20${gradeMatch[1]}级` : "";

  return {
    courseName,
    majorClass,
    grade,
    studentCount,
    weekRange: `${startWeek}-${endWeek}周`,
    startWeek,
    endWeek,
    sectionOrTime,
    teacherName,
  };
}

// 执行导入
async function handleImport() {
  if (!props.semesterId) {
    ElMessage.warning("未选择学期，请先选择学期");
    return;
  }
  if (!props.laboratoryId) {
    ElMessage.warning("未选择实验室，请先选择实验室");
    return;
  }

  importing.value = true;
  importResult.errors = [];

  try {
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < parsedCourses.value.length; i++) {
      const course = parsedCourses.value[i];
      try {
        await importSingleCourse(course);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(
          `导入失败 [${i + 1}/${parsedCourses.value.length}]:`,
          error,
        );
        importResult.errors.push(`第${i + 1}条: ${error.message}`);
      }
    }

    importResult.success = failCount === 0;
    importResult.message = `成功导入 ${successCount} 条，失败 ${failCount} 条`;

    currentStep.value = 2;

    if (failCount === 0) {
      emit("success");
    }
  } catch (error) {
    console.error("导入失败:", error);
    ElMessage.error(error.response?.data?.msg || "导入过程发生错误");
  } finally {
    importing.value = false;
  }
}

// 获取或创建教师
async function getOrCreateTeacher(teacherName) {
  if (!teacherName) return null;

  // 先在缓存中查找（根据教师名称匹配，重复则选第一个）
  const existing = teacherCache.find((t) => t.teacherName === teacherName);

  if (existing) {
    console.log(`教师已存在: ${teacherName}, ID: ${existing.id}`);
    return existing.id;
  }

  // 创建新教师
  console.log(`创建新教师: ${teacherName}`);
  try {
    const res = await createTeacher({
      teacherName: teacherName,
    });

    if (res.data?.ok && res.data.data?.teacherId) {
      const newTeacher = {
        id: res.data.data.teacherId,
        teacherName: teacherName,
      };
      teacherCache.push(newTeacher);
      return newTeacher.id;
    }

    throw new Error(res.data?.message || "创建教师失败");
  } catch (error) {
    throw new Error(`创建教师[${teacherName}]失败: ${error.message}`);
  }
}

// 导入单条课程
async function importSingleCourse(course) {
  try {
    // 1. 查找或创建课程
    let courseId = await getOrCreateCourse(course);

    // 2. 查找教师ID（找不到则不关联）
    let teacherId = null;
    if (course.teacherName) {
      // 处理多个教师的情况，取第一个
      const firstTeacher = course.teacherName.split(/[,，]/)[0].trim();
      teacherId = await getOrCreateTeacher(firstTeacher);
    }

    // 3. 使用父组件传入的实验室ID，并查找对应的部门ID
    const laboratoryId = props.laboratoryId;
    if (!laboratoryId) {
      throw new Error(`未选择目标实验室`);
    }

    // 从实验室列表中查找部门ID（注意类型转换，id可能是字符串或数字）
    const lab = props.laboratoryList.find(
      (l) => String(l.id) === String(laboratoryId),
    );
    const belongToDeptId = lab?.belongToDepts?.[0] || null;

    console.log("实验室查找:", {
      laboratoryId,
      lab,
      belongToDeptId,
      labList: props.laboratoryList,
    });

    // 4. 构建排课数据
    // 时间格式化为 HH:mm:ss
    const formatTime = (time) => {
      if (!time) return "";
      if (time.length === 5) return time + ":00"; // HH:mm -> HH:mm:ss
      return time;
    };
    
    const scheduleData = {
      semesterId: props.semesterId,
      laboratoryId: laboratoryId,
      weekType: "Both", // 默认单双周都上
      startWeek: course.startWeek,
      endWeek: course.endWeek,
      startTime: formatTime(course.startTime),
      endTime: formatTime(course.endTime),
      weekdays: [course.weekdayNum],
      courseId: courseId,
      teacherId: teacherId,
      belongToDeptId: belongToDeptId,
      majorClass: course.majorClass,
      startSection: course.startSection,
      endSection: course.endSection,
      mark: `第${course.startWeek}-${course.endWeek}周`,
    };

    console.log("创建排课:", scheduleData);

    // 5. 调用接口创建排课
    const res = await createCourseSchedule(scheduleData);
    if (!res.data?.ok) {
      const errorMsg = res.data?.message || res.data?.msg || "创建排课失败";
      throw new Error(errorMsg);
    }
  } catch (error) {
    // 添加更详细的错误上下文
    const courseInfo = `${course.courseName}(${course.weekday} 第${course.section}节)`;
    throw new Error(`${courseInfo}: ${error.message}`);
  }
}

// 获取或创建课程
async function getOrCreateCourse(course) {
  // 先在缓存中查找（根据课程名称匹配，重复则选第一个）
  const existing = courseCache.find((c) => c.courseName === course.courseName);

  if (existing) {
    console.log(`课程已存在: ${course.courseName}, ID: ${existing.id}`);
    return existing.id;
  }

  // 创建新课程
  console.log(`创建新课程: ${course.courseName}`);
  try {
    const res = await createCourse({
      courseName: course.courseName,
      volume: importOptions.defaultVolume,
      grade: course.grade || "",
    });

    if (res.data?.ok && res.data.data?.courseId) {
      const newCourse = {
        id: res.data.data.courseId,
        courseName: course.courseName,
      };
      courseCache.push(newCourse);
      return newCourse.id;
    }

    throw new Error(res.data?.message || "创建课程失败");
  } catch (error) {
    throw new Error(`创建课程[${course.courseName}]失败: ${error.message}`);
  }
}

// 下载模板
function downloadTemplate() {
  // 创建模板数据
  const templateData = [
    ["2025-2026 第一学期 课表模板"],
    [],
    [
      "节次",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
      "星期日",
    ],
    ["1-2", "课程名称[编号] 周次 教师", "", "", "", "", "", ""],
    ["3-4", "", "", "", "", "", "", ""],
    ["5-6", "", "", "", "", "", "", ""],
    ["7-8", "", "", "", "", "", "", ""],
    ["9-11", "", "", "", "", "", "", ""],
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "课表模板");

  // 下载文件
  XLSX.writeFile(wb, "课表导入模板.xlsx");
}

// 重置状态
function reset() {
  currentStep.value = 0;
  parsedCourses.value = [];
  rawFile.value = null;
  importResult.success = false;
  importResult.message = "";
  importResult.errors = [];
}

// 关闭弹窗
function handleClose() {
  visible.value = false;
  reset();
  emit("success");
}
</script>

<style scoped>
.import-container {
  padding: 20px 0;
}

.step-content {
  margin-top: 30px;
}

.upload-area {
  width: 100%;
}

.template-download {
  margin-top: 20px;
  text-align: center;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.import-options {
  margin-top: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.error-list {
  max-height: 200px;
  overflow-y: auto;
}

.semester-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #67c23a;
}
</style>
