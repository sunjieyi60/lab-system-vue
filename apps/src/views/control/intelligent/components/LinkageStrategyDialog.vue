<template>
  <el-dialog
    v-model="dialogVisible"
    :title="
      isEdit ? `编辑联动策略 - ${form.task.taskName || ''}` : '添加联动策略'
    "
    width="1100px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
    class="linkage-strategy-dialog"
    style="--el-dialog-width: 1100px"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      style="padding: 10px 20px; max-height: 75vh; overflow-y: auto"
    >
      <!-- ========== 任务主体 ========== -->
      <el-divider content-position="left">任务主体</el-divider>

      <!-- 绑定实验室 -->
      <el-form-item label="绑定实验室" prop="task.laboratoryId">
        <el-select
          v-model="form.task.laboratoryId"
          placeholder="请选择实验室"
          style="width: 100%"
          clearable
        >
          <el-option
            v-for="lab in laboratoryList"
            :key="lab.id"
            :label="lab.laboratoryId"
            :value="lab.id"
          />
        </el-select>
      </el-form-item>

      <!-- 执行频率 (cron表达式) -->
      <el-form-item label="执行频率" prop="task.cron">
        <el-select
          v-model="form.task.cron"
          placeholder="请选择执行频率"
          style="width: 100%"
        >
          <el-option
            v-for="item in cronOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <!-- 是否开启 -->
      <el-form-item label="是否开启" prop="task.enable">
        <el-switch
          v-model="form.task.enable"
          :active-value="true"
          :inactive-value="false"
          active-text="开启"
          inactive-text="关闭"
        />
      </el-form-item>

      <!-- 生效日期 -->
      <el-form-item label="生效日期" required>
        <el-col :span="11">
          <el-form-item prop="task.startDate">
            <el-date-picker
              v-model="form.task.startDate"
              type="date"
              placeholder="开始日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
        <el-col :span="2" class="text-center">至</el-col>
        <el-col :span="11">
          <el-form-item prop="task.endDate">
            <el-date-picker
              v-model="form.task.endDate"
              type="date"
              placeholder="结束日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
      </el-form-item>

      <!-- 上课提前开启 -->
      <el-form-item label="上课提前开启" prop="task.advanceMinutes">
        <el-input-number
          v-model="form.task.advanceMinutes"
          :min="0"
          :max="120"
          placeholder="请输入提前分钟数"
        />
        <span class="unit-text">分</span>
      </el-form-item>

      <!-- 下课延迟关闭 -->
      <el-form-item label="下课延迟关闭" prop="task.delayMinutes">
        <el-input-number
          v-model="form.task.delayMinutes"
          :min="0"
          :max="120"
          placeholder="请输入延迟分钟数"
        />
        <span class="unit-text">分</span>
      </el-form-item>

      <!-- 数据组、条件组、动作组、报警组、看门狗配置已移除，提交时传空值 -->
    </el-form>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 数据组、条件组、动作组、报警组编辑弹窗已移除 -->
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores";
import { useEduStore } from "@/stores";
import { useDeviceStore } from "@/stores";
import { storeToRefs } from "pinia";
import { generateFromCourseSchedule } from "@/api/smartControl";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  editData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

const userStore = useUserStore();
const eduStore = useEduStore();
const { termList } = storeToRefs(eduStore);
const formRef = ref(null);

// ========== 对话框状态 ==========
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.editData);

// 子弹窗相关状态已移除（数据组、条件组、动作组、报警组）

// ========== 数据 ==========
const laboratoryList = computed(() => userStore.getLaboratoryList);

// 常用cron表达式选项
const cronOptions = [
  { label: "每5秒执行一次", value: "*/5 * * * * ?" },
  { label: "每10秒执行一次", value: "*/10 * * * * ?" },
  { label: "每30秒执行一次", value: "*/30 * * * * ?" },
  { label: "每分钟执行一次", value: "0 * * * * ?" },
  { label: "每5分钟执行一次", value: "0 */5 * * * ?" },
  { label: "每10分钟执行一次", value: "0 */10 * * * ?" },
  { label: "每30分钟执行一次", value: "0 */30 * * * ?" },
  { label: "每小时执行一次", value: "0 0 * * * ?" },
  { label: "每天执行一次", value: "0 0 0 * * ?" },
];

// ========== 表单数据 ==========
const createDefaultForm = () => ({
  task: {
    id: "",
    taskName: "",
    cron: "0 */5 * * * ?",
    enable: true,
    startDate: "",
    endDate: "",
    laboratoryId: null,
    advanceMinutes: 10,
    delayMinutes: 10,
  },
  dataGroup: [],
  conditionGroups: [],
  actionGroups: [],
  alarmGroup: [],
  watchDog: {
    watchEnabled: false,
    watchIntervalSec: 30,
    watchTimeoutSec: 300,
    stopOnFirstSuccess: false,
  },
});

const form = reactive(createDefaultForm());

// ========== 表单校验规则 ==========
const rules = {
  "task.laboratoryId": [
    { required: true, message: "请选择实验室", trigger: "change" },
  ],
  "task.cron": [
    { required: true, message: "请选择执行频率", trigger: "change" },
  ],
  "task.startDate": [
    { required: true, message: "请选择开始日期", trigger: "change" },
  ],
  "task.endDate": [
    { required: true, message: "请选择结束日期", trigger: "change" },
  ],
};

// ========== 雪花ID生成 ==========
const generateSnowflakeId = () => {
  // 简化版雪花ID生成（纯数字）
  return `${Date.now()}${Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0")}`;
};

// ========== 组件挂载时加载数据 ==========
onMounted(async () => {
  // 确保学期数据已加载
  if (termList.value.length === 0) {
    await eduStore.initTermData();
  }
});

// 设备名称映射和指令描述方法已移除（不再需要）

// ========== 重置表单 ==========
const resetForm = () => {
  const defaultForm = createDefaultForm();
  // 深拷贝重置，避免污染原始数据
  Object.assign(form.task, defaultForm.task);
  // 数据组、条件组、动作组、报警组、看门狗保持为空值
  form.dataGroup = [];
  form.conditionGroups = [];
  form.actionGroups = [];
  form.alarmGroup = [];
  form.watchDog = { watchEnabled: false };
};

// ========== 监听弹窗显示状态，处理数据回填 ==========
watch(
  () => dialogVisible.value,
  (visible) => {
    if (visible) {
      // 弹窗打开时处理数据
      nextTick(() => {
        if (props.editData) {
          // 编辑模式：只回填 task 数据
          Object.assign(
            form.task,
            JSON.parse(JSON.stringify(props.editData.task || {})),
          );
          // 数据组、条件组、动作组、报警组、看门狗保持为空值
          form.dataGroup = [];
          form.conditionGroups = [];
          form.actionGroups = [];
          form.alarmGroup = [];
          form.watchDog = { watchEnabled: false };
        } else {
          resetForm();
        }
      });
    }
  },
);

// ========== 取消/关闭 ==========
const handleCancel = () => {
  dialogVisible.value = false;
  emit("cancel");
  resetForm();
};

const handleClose = () => {
  resetForm();
};

// ========== 确认提交 ==========
const handleConfirm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // 验证结束日期
    if (form.task.startDate && form.task.endDate) {
      const start = new Date(form.task.startDate);
      const end = new Date(form.task.endDate);
      if (end <= start) {
        ElMessage.warning("结束日期必须晚于开始日期");
        return;
      }
    }

    // 构建请求数据
    const requestData = {
      laboratoryId: [form.task.laboratoryId],
      cron: form.task.cron,
      earlyStart: form.task.advanceMinutes || 7,
      delayEnd: form.task.delayMinutes || 7,
      enable: form.task.enable,
    };

    // 调用生成定时任务接口
    const res = await generateFromCourseSchedule(requestData);
    
    // 显示返回的msg内容
    if (res.data && res.data.msg) {
      ElMessage.success(res.data.msg);
    } else {
      ElMessage.success("生成定时任务成功");
    }

    // 通知父组件刷新列表
    emit("confirm", requestData);
    dialogVisible.value = false;
    resetForm();
  } catch (error) {
    console.error("生成定时任务失败:", error);
    ElMessage.error(error.message || "生成定时任务失败");
  }
};

// 数据组、条件组、动作组、报警组相关操作方法已移除
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.text-center {
  text-align: center;
}

.unit-text {
  margin-left: 8px;
  color: #606266;
}

.group-section {
  margin-bottom: 20px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.group-label {
  font-size: 14px;
  color: #606266;
}

.group-content {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.group-card {
  width: calc(50% - 6px);
  min-width: 300px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.card-body {
  font-size: 13px;
  color: #606266;
}

.card-body p {
  margin: 4px 0;
}

.condition-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
  padding: 6px;
  background: #f5f7fa;
  border-radius: 4px;
}

.condition-desc {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 6px 0;
  padding: 6px;
  background: #f5f7fa;
  border-radius: 4px;
}

.action-cmd {
  font-weight: 500;
}

.action-cmd-small {
  font-size: 12px;
  color: #909399;
}

.watchdog-section {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.time-rule-preview {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

:deep(.el-divider__text) {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
