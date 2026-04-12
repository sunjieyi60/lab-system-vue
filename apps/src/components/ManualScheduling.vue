<template>
  <!-- 主弹窗：手动排课 -->
  <el-dialog
    v-model="visible"
    title="手动排课"
    width="480px"
    top="27vh"
    :close-on-click-modal="false"
    custom-class="manual-schedule-dialog"
    @closed="reset"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="schedule-form"
    >
      <!-- 课程选择 -->
      <el-form-item label="课程名称:" prop="courseId" required>
        <el-select
          v-model="form.courseId"
          placeholder="请选择或输入课程"
          filterable
          allow-create
          clearable
          class="rounded-select"
          style="width: 100%"
          @change="handleCourseChange"
        >
          <el-option
            v-for="item in courseList"
            :key="item.id"
            :label="`${item.courseName} (${item.grade}, ${item.volumn}人)`"
            :value="item.id"
          />
        </el-select>
        <div class="form-tip">提示：如果没有合适课程，可直接输入新课程名称</div>
      </el-form-item>

      <!-- 新课程信息（当用户输入新课程时显示） -->
      <template v-if="isNewCourse">
        <el-form-item label="课程容量:" prop="courseVolume" required>
          <el-input-number
            v-model="form.courseVolume"
            :min="1"
            :max="200"
            placeholder="请输入课程容量"
            class="rounded-input-number"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="年级:" prop="courseGrade" required>
          <el-input
            v-model="form.courseGrade"
            placeholder="请输入年级，如：2025级"
            class="rounded-input"
          />
        </el-form-item>
      </template>

      <!-- 课程时间 -->
      <el-form-item label="课程时间:" prop="courseTime" required>
        <el-input
          v-model="form.courseTime"
          placeholder="请选择课程时间"
          class="rounded-input"
          readonly
          @click="openTimeDialog"
        />
      </el-form-item>

      <!-- 授课教师 -->
      <el-form-item label="授课教师:" prop="teacherId" required>
        <el-select
          v-model="form.teacherId"
          placeholder="请选择授课教师"
          filterable
          class="rounded-select"
          style="width: 100%"
        >
          <el-option
            v-for="item in teacherList"
            :key="item.id"
            :label="item.teacherName"
            :value="item.id"
          />
        </el-select>
      </el-form-item>

      <!-- 上课人数 -->
      <el-form-item label="上课人数:" prop="studentCount">
        <el-input-number
          v-model="form.studentCount"
          :min="1"
          :max="200"
          placeholder="请输入上课人数"
          class="rounded-input-number"
          style="width: 100%"
        />
      </el-form-item>

      <!-- 所属部门 -->
      <el-form-item label="所属部门:" prop="belongToDeptId" required>
        <el-select
          v-model="form.belongToDeptId"
          placeholder="请选择所属部门"
          class="rounded-select"
          style="width: 100%"
        >
          <el-option
            v-for="item in deptList"
            :key="item.id"
            :label="item.deptName"
            :value="item.id"
          />
        </el-select>
      </el-form-item>

      <!-- 备注 -->
      <el-form-item label="备注:" prop="mark">
        <el-input
          v-model="form.mark"
          type="textarea"
          :rows="2"
          placeholder="请输入备注信息"
          class="rounded-textarea"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="btn-confirm" @click="submit">确定</el-button>
        <el-button class="btn-delete" type="primary" @click="handleDelete">
          删除
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 课程时间选择弹窗 -->
  <el-dialog
    v-model="timeDialogVisible"
    title="课程时间"
    width="420px"
    top="26vh"
    :close-on-click-modal="false"
    custom-class="course-time-dialog"
    append-to-body
    :style="{ left: 'calc(50% + 250px)' }"
  >
    <div class="time-form">
      <!-- 周次 -->
      <div class="form-row">
        <span class="label required">周次：</span>
        <div class="content">
          <el-checkbox-group
            v-model="timeForm.weekType"
            class="week-type-group"
          >
            <el-checkbox label="Single">单周</el-checkbox>
            <el-checkbox label="Double">双周</el-checkbox>
          </el-checkbox-group>
          <div class="week-range">
            <el-input-number
              v-model="timeForm.startWeek"
              :min="1"
              :max="20"
              :controls="false"
              class="week-input"
            />
            <span class="range-text">周 至 第</span>
            <el-input-number
              v-model="timeForm.endWeek"
              :min="1"
              :max="20"
              :controls="false"
              class="week-input"
            />
            <span class="range-text">周</span>
          </div>
        </div>
      </div>

      <!-- 星期 -->
      <div class="form-row">
        <span class="label required">星期：</span>
        <div class="content">
          <el-radio-group v-model="timeForm.weekDay" class="weekday-group">
            <el-radio
              v-for="day in weekDaysOptions"
              :key="day.value"
              :label="day.value"
            >
              {{ day.label }}
            </el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 节次 -->
      <div class="form-row">
        <span class="label required">节次：</span>
        <div class="content">
          <el-checkbox-group
            v-model="timeForm.periods"
            class="period-group"
            @change="onPeriodsChange"
          >
            <el-checkbox v-for="p in 11" :key="p" :label="p">{{
              p
            }}</el-checkbox>
          </el-checkbox-group>
          <div class="time-range-row">
            <el-time-picker
              v-model="timeForm.startTime"
              placeholder="开始时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 120px"
            />
            <span class="range-text">至</span>
            <el-time-picker
              v-model="timeForm.endTime"
              placeholder="结束时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 110px"
            />
          </div>
        </div>
      </div>

      <!-- 备注 -->
      <div class="form-row remark-row">
        <span class="label">备注：</span>
        <div class="content">
          <el-input
            v-model="timeForm.remark"
            type="textarea"
            :rows="2"
            class="remark-input"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="btn-confirm-gray" @click="confirmTime"
          >确定</el-button
        >
        <el-button class="btn-delete-blue" type="primary" @click="clearTime">
          清空
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getCourseList, createCourse, createCourseSchedule, getTeacherList } from "@/api/edu";

const props = defineProps({
  modelValue: Boolean,
  // 编辑时传入的数据，包含 laboratoryId 和 laboratoryName
  editData: {
    type: Object,
    default: null,
  },
  // 当前选中的学期ID
  semesterId: {
    type: Number,
    default: null,
  },
  // 当前选中的实验室ID（从父组件传入，优先级低于 editData 中的 laboratoryId）
  laboratoryId: {
    type: Number,
    default: null,
  },

  // 部门列表
  deptList: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "success", "delete"]);

const visible = defineModel();
const formRef = ref();

// 课程列表和教师列表
const courseList = ref([]);
const teacherList = ref([]);
const loading = ref(false);

// 是否为新课程（用户输入的课程名称不在列表中）
const isNewCourse = computed(() => {
  if (!form.courseId) return false;
  // 如果 courseId 是字符串，说明是用户输入的新课程
  return (
    typeof form.courseId === "string" ||
    (typeof form.courseId === "number" &&
      !courseList.value.find((c) => c.id === form.courseId))
  );
});

// 主表单
const form = reactive({
  courseId: "", // 课程ID或新课程名称
  courseName: "", // 课程名称（用于显示）
  courseVolume: 48, // 课程容量（新课程时必填）
  courseGrade: "", // 年级（新课程时必填）
  courseTime: "",
  teacherId: null,
  studentCount: null,
  belongToDeptId: null,
  mark: "",
  // 时间相关字段（用于提交）
  weekType: "Both",
  startWeek: 1,
  endWeek: 16,
  weekdays: [],
  startTime: "",
  endTime: "",
  startSection: 1,
  endSection: 2,
});

const rules = {
  courseId: [
    { required: true, message: "请选择或输入课程", trigger: "change" },
  ],
  courseVolume: [
    { required: true, message: "请输入课程容量", trigger: "blur" },
  ],
  courseGrade: [{ required: true, message: "请输入年级", trigger: "blur" }],
  courseTime: [{ required: true, message: "请选择课程时间", trigger: "blur" }],
  teacherId: [{ required: true, message: "请选择授课教师", trigger: "change" }],
  belongToDeptId: [
    { required: true, message: "请选择所属部门", trigger: "change" },
  ],
};

// 课程时间弹窗
const timeDialogVisible = ref(false);

// 星期选项
const weekDaysOptions = [
  { label: "星期一", value: 1 },
  { label: "星期二", value: 2 },
  { label: "星期三", value: 3 },
  { label: "星期四", value: 4 },
  { label: "星期五", value: 5 },
  { label: "星期六", value: 6 },
  { label: "星期日", value: 7 },
];

// 节次与时间的映射关系
const periodTimeMap = {
  1: { start: "08:00", end: "08:45" },
  2: { start: "08:55", end: "09:40" },
  3: { start: "10:00", end: "10:45" },
  4: { start: "10:55", end: "11:40" },
  5: { start: "14:10", end: "14:55" },
  6: { start: "15:05", end: "15:50" },
  7: { start: "16:00", end: "16:45" },
  8: { start: "16:55", end: "17:40" },
  9: { start: "18:40", end: "19:25" },
  10: { start: "19:30", end: "20:15" },
  11: { start: "20:20", end: "21:05" },
};

// 时间表单
const timeForm = reactive({
  weekType: ["Single", "Double"], // Single: 单周, Double: 双周
  startWeek: 1,
  endWeek: 16,
  weekDay: null,
  periods: [],
  startTime: "",
  endTime: "",
  remark: "",
});

// 获取课程列表
const fetchCourseList = async () => {
  try {
    const res = await getCourseList();
    if (res.data?.ok) {
      courseList.value = res.data.data || [];
    }
  } catch (error) {
    console.error("获取课程列表失败:", error);
  }
};

// 获取教师列表
const fetchTeacherList = async () => {
  try {
    const res = await getTeacherList();
    if (res.data?.ok) {
      teacherList.value = res.data.data || [];
    }
  } catch (error) {
    console.error("获取教师列表失败:", error);
  }
};

// 处理课程选择变化
const handleCourseChange = (val) => {
  if (val && typeof val === "number") {
    const selected = courseList.value.find((c) => c.id === val);
    if (selected) {
      form.courseName = selected.courseName;
      form.courseVolume = selected.volumn || 48;
      form.courseGrade = selected.grade || "";
    }
  } else if (val && typeof val === "string") {
    // 用户输入了新课程名称
    form.courseName = val;
    form.courseVolume = 48;
    form.courseGrade = "";
  }
};

// 节次变化时自动更新时间
const onPeriodsChange = (val) => {
  if (!val || val.length === 0) {
    timeForm.startTime = "";
    timeForm.endTime = "";
    return;
  }

  // 按顺序排序
  const sortedPeriods = [...val].sort((a, b) => a - b);
  const firstPeriod = sortedPeriods[0];
  const lastPeriod = sortedPeriods[sortedPeriods.length - 1];

  // 根据第一个节次设置开始时间，最后一个节次设置结束时间
  timeForm.startTime = periodTimeMap[firstPeriod]?.start || "";
  timeForm.endTime = periodTimeMap[lastPeriod]?.end || "";
};

// 打开时间选择弹窗
const openTimeDialog = () => {
  timeDialogVisible.value = true;
};

// 确认时间选择
const confirmTime = () => {
  // 验证必填项
  if (!timeForm.weekDay) {
    ElMessage.warning("请选择星期");
    return;
  }
  if (timeForm.periods.length === 0) {
    ElMessage.warning("请至少选择一个节次");
    return;
  }

  // 生成课程时间字符串
  const weekTypeText = [];
  if (timeForm.weekType.includes("Single")) weekTypeText.push("单周");
  if (timeForm.weekType.includes("Double")) weekTypeText.push("双周");

  const weekDaysText = weekDaysOptions.find((o) => o.value === timeForm.weekDay)?.label || "";

  const periodsText =
    timeForm.periods.length > 0
      ? `第${timeForm.periods.sort((a, b) => a - b).join("、")}节`
      : "";

  const timeRangeText =
    timeForm.startTime && timeForm.endTime
      ? `${timeForm.startTime}-${timeForm.endTime}`
      : "";

  const parts = [];
  if (weekTypeText.length > 0) parts.push(weekTypeText.join("、"));
  parts.push(`第${timeForm.startWeek}-${timeForm.endWeek}周`);
  if (weekDaysText) parts.push(weekDaysText);
  if (periodsText) parts.push(periodsText);
  if (timeRangeText) parts.push(timeRangeText);

  form.courseTime = parts.join(" ");

  // 同步到表单数据
  const sortedPeriods = [...timeForm.periods].sort((a, b) => a - b);
  form.startWeek = timeForm.startWeek;
  form.endWeek = timeForm.endWeek;
  form.weekdays = [timeForm.weekDay];
  form.startTime = timeForm.startTime;
  form.endTime = timeForm.endTime;
  form.startSection = sortedPeriods[0];
  form.endSection = sortedPeriods[sortedPeriods.length - 1];
  form.mark = timeForm.remark;

  // 处理周类型
  if (timeForm.weekType.length === 2) {
    form.weekType = "Both";
  } else if (timeForm.weekType.length === 1) {
    form.weekType = timeForm.weekType[0];
  } else {
    form.weekType = "Both";
  }

  timeDialogVisible.value = false;
};

// 清空时间选择
const clearTime = () => {
  timeForm.weekType = ["Single", "Double"];
  timeForm.startWeek = 1;
  timeForm.endWeek = 16;
  timeForm.weekDay = null;
  timeForm.periods = [];
  timeForm.startTime = "";
  timeForm.endTime = "";
  timeForm.remark = "";
  form.courseTime = "";
  form.weekdays = [];
  form.startTime = "";
  form.endTime = "";
};

// 监听显示，回填数据
watch(
  () => visible.value,
  (val) => {
    if (val) {
      // 弹窗打开时重新获取课程列表和教师列表
      fetchCourseList();
      fetchTeacherList();
      if (props.editData) {
        // 编辑模式：回填数据
        Object.assign(form, props.editData);
      }
    } else if (!val) {
      reset();
    }
  },
);

const reset = () => {
  formRef.value?.resetFields();
  Object.assign(form, {
    courseId: "",
    courseName: "",
    courseVolume: 48,
    courseGrade: "",
    courseTime: "",
    teacherId: null,
    studentCount: null,
    belongToDeptId: null,
    mark: "",
    weekType: "Both",
    startWeek: 1,
    endWeek: 16,
    weekdays: [],
    startTime: "",
    endTime: "",
    startSection: 1,
    endSection: 2,
  });
  clearTime();
};

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  // 检查必要的参数
  if (!props.semesterId) {
    ElMessage.warning("请先选择学期");
    return;
  }

  // 获取实验室ID：优先使用 editData 中的，否则使用 props.laboratoryId
  const labId = props.editData?.laboratoryId || props.laboratoryId;
  if (!labId) {
    ElMessage.warning("请先选择实验室");
    return;
  }

  loading.value = true;
  try {
    let courseId = form.courseId;

    // 如果是新课程，先创建课程
    if (isNewCourse.value) {
      const courseRes = await createCourse({
        courseName: form.courseName,
        volume: form.courseVolume,
        grade: form.courseGrade,
      });

      if (!courseRes.data?.ok) {
        ElMessage.error(courseRes.data?.msg || "创建课程失败");
        return;
      }

      // 获取新创建的课程ID
      courseId = courseRes.data.data?.id;
      if (!courseId) {
        ElMessage.error("创建课程失败，未返回课程ID");
        return;
      }
    }

    // 构建排课数据
    const scheduleData = {
      semesterId: props.semesterId,
      laboratoryId: labId,
      weekType: form.weekType,
      startWeek: form.startWeek,
      endWeek: form.endWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      weekdays: form.weekdays,
      courseId: courseId,
      teacherId: form.teacherId,
      belongToDeptId: form.belongToDeptId,
      startSection: form.startSection,
      endSection: form.endSection,
      mark: form.mark || form.courseTime,
    };

    const scheduleRes = await createCourseSchedule(scheduleData);

    if (scheduleRes.data?.ok) {
      ElMessage.success("排课成功");
      emit("success", scheduleData);
      visible.value = false;
    } else {
      ElMessage.error(scheduleRes.data?.msg || "排课失败");
    }
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("提交失败，请检查网络或联系管理员");
  } finally {
    loading.value = false;
  }
};

const handleDelete = () => {
  ElMessageBox.confirm("确定要删除该排课记录吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      emit("delete", props.editData);
      visible.value = false;
      ElMessage.success("删除成功");
    })
    .catch(() => {});
};

// 组件挂载时获取课程列表
onMounted(() => {
  // 首次挂载时不获取，等待弹窗打开时再获取
  // fetchCourseList();
});
</script>

<style scoped>
/* 对话框整体样式 */
:deep(.manual-schedule-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.manual-schedule-dialog .el-dialog__header) {
  text-align: center;
  padding: 20px 0 10px;
  margin: 0;
}

:deep(.manual-schedule-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

:deep(.manual-schedule-dialog .el-dialog__body) {
  padding: 20px 30px 10px;
}

:deep(.manual-schedule-dialog .el-dialog__footer) {
  padding: 10px 30px 25px;
  border-top: none;
}

/* 课程时间弹窗样式 */
:deep(.course-time-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.course-time-dialog .el-dialog__header) {
  text-align: center;
  padding: 15px 0 10px;
  margin: 0;
  background: linear-gradient(180deg, #e8f4fc 0%, #f5f9fc 100%);
}

:deep(.course-time-dialog .el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

:deep(.course-time-dialog .el-dialog__body) {
  padding: 20px 25px 10px;
}

:deep(.course-time-dialog .el-dialog__footer) {
  padding: 10px 25px 20px;
  border-top: none;
}

/* 表单样式 */
.schedule-form {
  .el-form-item {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__label) {
    color: #666;
    font-size: 14px;
    padding-right: 12px;
    height: 40px;
    line-height: 40px;
  }

  /* 必填项红星 */
  :deep(.el-form-item.is-required .el-form-item__label::before) {
    content: "*";
    color: #ff4d4f;
    margin-right: 4px;
  }
}

/* 提示文字 */
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

/* 圆角输入框 */
.rounded-input {
  :deep(.el-input__wrapper) {
    border-radius: 20px;
    box-shadow: 0 0 0 1px #e0e0e0 inset;
    padding: 0 15px;
    height: 40px;
    transition: all 0.3s;
  }

  :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px #c0c0c0 inset;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #409eff inset;
  }

  :deep(.el-input__inner) {
    height: 40px;
    line-height: 40px;
    font-size: 14px;
    color: #333;
  }

  :deep(.el-input__inner::placeholder) {
    color: #bbb;
    font-size: 13px;
  }
}

/* 圆角下拉框 */
.rounded-select {
  :deep(.el-input__wrapper) {
    border-radius: 20px;
    box-shadow: 0 0 0 1px #e0e0e0 inset;
    padding: 0 15px;
    height: 40px;
    transition: all 0.3s;
  }

  :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px #c0c0c0 inset;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #409eff inset;
  }

  :deep(.el-input__inner) {
    height: 40px;
    line-height: 40px;
    font-size: 14px;
    color: #333;
  }

  :deep(.el-input__inner::placeholder) {
    color: #bbb;
    font-size: 13px;
  }
}

/* 圆角数字输入框 */
.rounded-input-number {
  :deep(.el-input__wrapper) {
    border-radius: 20px;
    box-shadow: 0 0 0 1px #e0e0e0 inset;
    padding: 0 15px;
    height: 40px;
    transition: all 0.3s;
  }

  :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px #c0c0c0 inset;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #409eff inset;
  }
}

/* 圆角文本域 */
.rounded-textarea {
  :deep(.el-textarea__inner) {
    border-radius: 12px;
    padding: 10px 15px;
  }
}

/* 课程时间弹窗表单样式 */
.time-form {
  .form-row {
    display: flex;
    margin-bottom: 16px;
    align-items: flex-start;

    &.remark-row {
      align-items: center;
    }

    .label {
      width: 60px;
      color: #666;
      font-size: 14px;
      flex-shrink: 0;
      line-height: 32px;

      &.required::before {
        content: "*";
        color: #ff4d4f;
        margin-right: 4px;
      }
    }

    .content {
      flex: 1;
    }
  }

  /* 周次类型 */
  .week-type-group {
    display: flex;
    gap: 20px;
    margin-bottom: 10px;
  }

  /* 周范围 */
  .week-range {
    display: flex;
    align-items: center;
    gap: 8px;

    .week-input {
      width: 60px;

      :deep(.el-input__wrapper) {
        padding: 0 8px;
      }

      :deep(.el-input__inner) {
        text-align: center;
      }
    }

    .range-text {
      color: #666;
      font-size: 14px;
    }
  }

  /* 星期选择 */
  .weekday-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;

    :deep(.el-checkbox) {
      margin-right: 0;
    }
  }

  /* 节次选择 */
  .period-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-bottom: 10px;

    :deep(.el-checkbox) {
      margin-right: 0;
    }
  }

  /* 时间范围 */
  .time-range-row {
    display: flex;
    align-items: center;
    gap: 8px;

    .range-text {
      color: #666;
      font-size: 14px;
    }
  }

  /* 备注输入 */
  .remark-input {
    :deep(.el-textarea__inner) {
      border-radius: 4px;
    }
  }
}

/* 底部按钮区域 */
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding-top: 10px;
}

/* 确定按钮 - 灰色边框样式 */
.btn-confirm {
  width: 100px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #666;
  font-size: 14px;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;
    color: #409eff;
    background: #fff;
  }

  &:active {
    border-color: #096dd9;
    color: #096dd9;
  }
}

/* 删除按钮 - 蓝色背景样式 */
.btn-delete {
  width: 100px;
  height: 36px;
  border-radius: 6px;
  border: none;
  background: #409eff;
  color: #fff;
  font-size: 14px;
  transition: all 0.3s;

  &:hover {
    background: #66b1ff;
  }

  &:active {
    background: #096dd9;
  }
}

/* 时间弹窗按钮样式 */
.btn-confirm-gray {
  width: 100px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  background: #f5f5f5;
  color: #666;
  font-size: 14px;
  transition: all 0.3s;

  &:hover {
    border-color: #c0c0c0;
    background: #e8e8e8;
  }
}

.btn-delete-blue {
  width: 100px;
  height: 36px;
  border-radius: 6px;
  border: none;
  background: #409eff;
  color: #fff;
  font-size: 14px;
  transition: all 0.3s;

  &:hover {
    background: #66b1ff;
  }

  &:active {
    background: #096dd9;
  }
}
</style>
