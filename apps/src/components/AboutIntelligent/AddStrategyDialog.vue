<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? `编辑策略 - ${form.task.taskName || ''}` : '添加策略'"
    width="1100px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="add-strategy-dialog"
    style="--el-dialog-width: 1100px"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      style="padding: 10px 20px; max-height: 75vh; overflow-y: auto"
    >
      <!-- ========== 任务主体 ========== -->
      <el-divider content-position="left">任务主体</el-divider>

      <!-- 策略名称 -->
      <el-form-item label="策略名称" prop="task.taskName">
        <el-input
          v-model="form.task.taskName"
          placeholder="请输入策略名称"
          clearable
        />
      </el-form-item>

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
            :label="lab.laboratoryName || lab.laboratoryId"
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

      <!-- ========== 时间规则 ========== -->
      <el-divider content-position="left">
        时间规则
        <el-button type="primary" link size="small" @click="handleEditTimeRule">
          <el-icon><Edit /></el-icon>编辑
        </el-button>
      </el-divider>

      <div class="time-rule-preview" v-if="hasTimeRule">
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="适用星期">{{
            timeRuleWeekdaysText
          }}</el-descriptions-item>
          <el-descriptions-item label="适用周次">{{
            timeRuleWeeksText
          }}</el-descriptions-item>
          <el-descriptions-item label="每日时段"
            >{{ form.timeRule.startTime }} -
            {{ form.timeRule.endTime }}</el-descriptions-item
          >
          <el-descriptions-item label="学期">{{
            timeRuleSemesterText
          }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-empty v-else description="未设置时间规则" :image-size="60" />

      <!-- ========== 数据组 ========== -->
      <el-divider content-position="left">数据组</el-divider>

      <div class="group-section">
        <div class="group-header">
          <span class="group-label"
            >当前数据组 ({{ form.dataGroup.length }})</span
          >
          <el-button type="primary" size="small" @click="handleAddDataGroup">
            <el-icon><Plus /></el-icon>添加数据组
          </el-button>
        </div>
        <div class="group-content">
          <el-card
            v-for="(item, index) in form.dataGroup"
            :key="item.id || index"
            class="group-card"
            shadow="hover"
          >
            <template #header>
              <div class="card-header">
                <span>{{ item.deviceType || "未命名" }}</span>
                <div class="card-actions">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    @click="handleEditDataGroup(item, index)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    type="danger"
                    link
                    size="small"
                    @click="handleRemoveDataGroup(index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </template>
            <div class="card-body">
              <p>
                设备:
                {{
                  item.deviceName ||
                  getDeviceName(item.deviceId) ||
                  `设备${item.deviceId}`
                }}
              </p>
            </div>
          </el-card>
          <el-empty
            v-if="form.dataGroup.length === 0"
            description="暂无数据组，请添加"
            :image-size="60"
          />
        </div>
      </div>

      <!-- ========== 条件组 ========== -->
      <el-divider content-position="left">条件组</el-divider>

      <div class="group-section">
        <div class="group-header">
          <span class="group-label"
            >当前条件组 ({{ form.conditionGroups.length }})</span
          >
          <el-button
            type="primary"
            size="small"
            @click="handleAddConditionGroup"
          >
            <el-icon><Plus /></el-icon>添加条件组
          </el-button>
        </div>
        <div class="group-content">
          <el-card
            v-for="(item, index) in form.conditionGroups"
            :key="item.id || index"
            class="group-card"
            shadow="hover"
          >
            <template #header>
              <div class="card-header">
                <el-tag
                  size="small"
                  :type="item.type === 'ALL' ? 'success' : 'warning'"
                  >{{ item.type }}</el-tag
                >
                <span style="margin-left: 8px">条件组{{ index + 1 }}</span>
                <div class="card-actions">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    @click="handleEditConditionGroup(item, index)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    type="danger"
                    link
                    size="small"
                    @click="handleRemoveConditionGroup(index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </template>
            <div class="card-body">
              <div
                v-for="(cond, cIndex) in item.conditions"
                :key="cond.id || cIndex"
                class="condition-item"
              >
                <el-tag size="small" type="info">条件{{ cIndex + 1 }}</el-tag>
                <span
                  class="condition-desc"
                  :title="cond.displayText || cond.desc"
                  >{{ cond.displayText || cond.desc || "无描述" }}</span
                >
              </div>
              <el-empty
                v-if="!item.conditions || item.conditions.length === 0"
                description="无条件"
                :image-size="40"
              />
            </div>
          </el-card>
          <el-empty
            v-if="form.conditionGroups.length === 0"
            description="暂无条件组，请添加"
            :image-size="60"
          />
        </div>
      </div>

      <!-- ========== 动作组 ========== -->
      <el-divider content-position="left">动作组</el-divider>

      <div class="group-section">
        <div class="group-header">
          <span class="group-label"
            >当前动作组 ({{ form.actionGroups.length }})</span
          >
          <el-button type="primary" size="small" @click="handleAddActionGroup">
            <el-icon><Plus /></el-icon>添加动作组
          </el-button>
        </div>
        <div class="group-content">
          <el-card
            v-for="(item, index) in form.actionGroups"
            :key="item.id || index"
            class="group-card"
            shadow="hover"
          >
            <template #header>
              <div class="card-header">
                <span>动作组{{ index + 1 }}</span>
                <div class="card-actions">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    @click="handleEditActionGroup(item, index)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    type="danger"
                    link
                    size="small"
                    @click="handleRemoveActionGroup(index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </template>
            <div class="card-body">
              <div
                v-for="(action, aIndex) in item.actions"
                :key="action.id || aIndex"
                class="action-item"
              >
                <span class="action-cmd">{{
                  getDeviceName(action.deviceId)
                }}</span>
                <span class="action-cmd-small">{{
                  getCommandDesc(action)
                }}</span>
              </div>
              <el-empty
                v-if="!item.actions || item.actions.length === 0"
                description="无动作"
                :image-size="40"
              />
            </div>
          </el-card>
          <el-empty
            v-if="form.actionGroups.length === 0"
            description="暂无动作组，请添加"
            :image-size="60"
          />
        </div>
      </div>

      <!-- ========== 报警组 ========== -->
      <el-divider content-position="left">报警组</el-divider>

      <div class="group-section">
        <div class="group-header">
          <span class="group-label"
            >当前报警组 ({{ form.alarmGroup.length }})</span
          >
          <el-button type="primary" size="small" @click="handleAddAlarmGroup">
            <el-icon><Plus /></el-icon>添加报警组
          </el-button>
        </div>
        <div class="group-content">
          <el-card
            v-for="(item, index) in form.alarmGroup"
            :key="item.id || index"
            class="group-card"
            shadow="hover"
          >
            <template #header>
              <div class="card-header">
                <el-tag size="small" type="danger">报警</el-tag>
                <div class="card-actions">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    @click="handleEditAlarmGroup(item, index)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    type="danger"
                    link
                    size="small"
                    @click="handleRemoveAlarmGroup(index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </template>
            <div class="card-body">
              <p>{{ item.name || `报警组${index + 1}` }}</p>
            </div>
          </el-card>
          <el-empty
            v-if="form.alarmGroup.length === 0"
            description="暂无报警组"
            :image-size="60"
          />
        </div>
      </div>

      <!-- ========== 看门狗配置 ========== -->
      <el-divider content-position="left">
        看门狗配置
        <el-switch
          v-model="form.watchDog.watchEnabled"
          style="margin-left: 10px"
        />
      </el-divider>

      <div v-if="form.watchDog.watchEnabled" class="watchdog-section">
        <el-form-item label="检查间隔">
          <el-input-number
            v-model="form.watchDog.watchIntervalSec"
            :min="5"
            :max="3600"
          />
          <span class="unit-text">秒</span>
        </el-form-item>
        <el-form-item label="超时时间">
          <el-input-number
            v-model="form.watchDog.watchTimeoutSec"
            :min="10"
            :max="7200"
          />
          <span class="unit-text">秒</span>
        </el-form-item>
        <el-form-item label="首次成功后停止">
          <el-switch v-model="form.watchDog.stopOnFirstSuccess" />
        </el-form-item>
      </div>
      <el-empty v-else description="看门狗已禁用" :image-size="60" />
    </el-form>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- ========== 时间规则编辑弹窗 ========== -->
  <TimeRuleDialog
    v-model="showTimeRuleDialog"
    :data="form.timeRule"
    @save="handleSaveTimeRule"
    top="35vh"
  />

  <!-- ========== 数据组编辑弹窗 ========== -->
  <DataGroupDialog
    v-model="showDataGroupDialog"
    :data="currentEditingDataGroup"
    :laboratory-id="form.task.laboratoryId"
    @save="handleSaveDataGroup"
    top="35vh"
  />

  <!-- ========== 条件组编辑弹窗 ========== -->
  <ConditionGroupDialog
    v-model="showConditionGroupDialog"
    :data="currentEditingConditionGroup"
    @save="handleSaveConditionGroup"
    top="30vh"
  />

  <!-- ========== 动作组编辑弹窗 ========== -->
  <ActionGroupDialog
    v-model="showActionGroupDialog"
    :data="currentEditingActionGroup"
    :condition-groups="form.conditionGroups"
    :laboratory-id="form.task.laboratoryId"
    @save="handleSaveActionGroup"
    top="25vh"
  />

  <!-- ========== 报警组编辑弹窗 ========== -->
  <AlarmGroupDialog
    v-model="showAlarmGroupDialog"
    :data="currentEditingAlarmGroup"
    @save="handleSaveAlarmGroup"
    top="35vh"
  />
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/user.js";
import { useEduStore } from "@/stores/edu.js";
import { useDeviceStore } from "@/stores/device.js";
import { storeToRefs } from "pinia";
import { Plus, Edit, Delete } from "@element-plus/icons-vue";
import TimeRuleDialog from "./TimeRuleDialog.vue";
import DataGroupDialog from "./DataGroupDialog.vue";
import ConditionGroupDialog from "./ConditionGroupDialog.vue";
import ActionGroupDialog from "./ActionGroupDialog.vue";
import AlarmGroupDialog from "./AlarmGroupDialog.vue";

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
const deviceStore = useDeviceStore();
const { termList } = storeToRefs(eduStore);
const { deviceMap } = storeToRefs(deviceStore);
const formRef = ref(null);

// ========== 对话框状态 ==========
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.editData);

// ========== 子弹窗显示状态 ==========
const showTimeRuleDialog = ref(false);
const showDataGroupDialog = ref(false);
const showConditionGroupDialog = ref(false);
const showActionGroupDialog = ref(false);
const showAlarmGroupDialog = ref(false);

// ========== 当前编辑项 ==========
const currentEditingDataGroup = ref(null);
const currentEditingDataGroupIndex = ref(-1);
const currentEditingConditionGroup = ref(null);
const currentEditingConditionGroupIndex = ref(-1);
const currentEditingActionGroup = ref(null);
const currentEditingActionGroupIndex = ref(-1);
const currentEditingAlarmGroup = ref(null);
const currentEditingAlarmGroupIndex = ref(-1);

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
  },
  timeRule: {
    id: "",
    weekdays: [1, 2, 3, 4, 5],
    startWeek: 1,
    endWeek: 20,
    weekType: "Both",
    startTime: "08:00:00",
    endTime: "18:00:00",
    semesterId: termList.value[0]?.id || null,
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

// ========== 计算属性 ==========
const hasTimeRule = computed(() => {
  return (
    form.timeRule && form.timeRule.weekdays && form.timeRule.weekdays.length > 0
  );
});

const timeRuleWeekdaysText = computed(() => {
  if (!form.timeRule.weekdays || form.timeRule.weekdays.length === 0)
    return "未设置";
  const weekdayMap = {
    1: "一",
    2: "二",
    3: "三",
    4: "四",
    5: "五",
    6: "六",
    7: "日",
  };
  return "周" + form.timeRule.weekdays.map((d) => weekdayMap[d]).join("、");
});

const timeRuleWeeksText = computed(() => {
  if (!form.timeRule.startWeek || !form.timeRule.endWeek) return "未设置";
  const typeText =
    form.timeRule.weekType === "Odd"
      ? "(单周)"
      : form.timeRule.weekType === "Even"
        ? "(双周)"
        : "";
  return `第${form.timeRule.startWeek}-${form.timeRule.endWeek}周${typeText}`;
});

const timeRuleSemesterText = computed(() => {
  const term = termList.value.find((t) => t.id === form.timeRule.semesterId);
  return term?.termName || term?.name || "未设置学期";
});

// ========== 表单校验规则 ==========
const rules = {
  "task.taskName": [
    { required: true, message: "请输入策略名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在2到50个字符", trigger: "blur" },
  ],
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
  // 确保设备数据已加载
  if (Object.keys(deviceMap.value).length === 0) {
    await deviceStore.fetchDevices();
  }
});

// ========== 设备名称映射 ==========
const getDeviceName = (deviceId) => {
  if (!deviceId) return "-";
  // 从 deviceStore 中查找设备名称
  for (const arr of Object.values(deviceMap.value)) {
    const found = arr.find((item) => {
      const id = item.device?.id;
      const devId = item.deviceId;
      return (
        String(id) === String(deviceId) || String(devId) === String(deviceId)
      );
    });
    if (found) {
      return (
        found.device?.deviceName || found.device?.name || `设备${deviceId}`
      );
    }
  }
  return `设备${deviceId}`;
};

// 获取指令中文描述
const getCommandDesc = (action) => {
  if (!action.commandLine) return "未设置指令";

  // 空调只显示"增强控制"
  if (
    action.deviceType === "AirCondition" &&
    action.commandLine === "ENHANCE_CONTROL_AIR_CONDITION"
  ) {
    return "增强控制";
  }

  const commandMap = {
    OPEN_CIRCUITBREAK: "通电",
    CLOSE_CIRCUITBREAK: "断电",
    OPEN_LIGHT: "打开照明",
    CLOSE_LIGHT: "关闭照明",
    OPEN_ACCESS_ONCE: "开启门禁",
    CLOSE_ACCESS_ONCE: "关闭门禁",
  };
  return commandMap[action.commandLine] || action.commandLine;
};

// ========== 重置表单 ==========
const resetForm = () => {
  const defaultForm = createDefaultForm();
  Object.assign(form, defaultForm);
};

// ========== 监听编辑数据 ==========
watch(
  () => props.editData,
  (newVal) => {
    if (newVal) {
      // 编辑模式：回填数据
      Object.assign(form.task, newVal.task || {});
      Object.assign(form.timeRule, newVal.timeRule || {});
      form.dataGroup = JSON.parse(JSON.stringify(newVal.dataGroup || []));
      form.conditionGroups = JSON.parse(
        JSON.stringify(newVal.conditionGroups || []),
      );
      form.actionGroups = JSON.parse(JSON.stringify(newVal.actionGroups || []));
      form.alarmGroup = JSON.parse(JSON.stringify(newVal.alarmGroup || []));
      Object.assign(form.watchDog, newVal.watchDog || {});
    } else {
      resetForm();
    }
  },
  { immediate: true },
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

    // 生成ID（新增时）
    if (!isEdit.value) {
      form.task.id = generateSnowflakeId();
    }

    // 获取 dataGroup 的第一个设备ID用于 expr（如果没有 dataGroup 则用 condition 自己的 id）
    const dataGroupId = form.dataGroup.length > 0 ? form.dataGroup[0].id : null;

    const submitData = {
      task: { ...form.task },
      timeRule: {
        ...form.timeRule,
        id: form.timeRule.id || generateSnowflakeId(),
        scheduleTaskId: form.task.id,
        semesterId: form.timeRule.semesterId || null,
      },
      dataGroup: form.dataGroup.map((item) => ({
        id: item.id || generateSnowflakeId(),
        scheduleTaskId: form.task.id,
        deviceId: item.deviceId,
        deviceType: item.deviceType,
      })),
      conditionGroups: form.conditionGroups.map((group) => ({
        id: group.id || generateSnowflakeId(),
        scheduleTaskId: form.task.id,
        type: group.type,
        conditions: (group.conditions || []).map((cond) => ({
          id: cond.id || generateSnowflakeId(),
          scheduleTaskId: form.task.id,
          conditionGroupId: group.id || generateSnowflakeId(),
          // 使用 dataGroupId 生成 expr
          expr: dataGroupId
            ? `#{${dataGroupId}}.${cond.property} ${cond.operator} ${cond.value}`
            : cond.expr,
          desc:
            cond.desc ||
            cond.displayText ||
            `${cond.property} ${cond.operator} ${cond.value}`,
        })),
      })),
      actionGroups: form.actionGroups.map((group) => ({
        id: group.id || generateSnowflakeId(),
        scheduleTaskId: form.task.id,
        conditionGroupId: group.conditionGroupId,
        actions: (group.actions || []).map((action) => ({
          id: action.id || generateSnowflakeId(),
          scheduleTaskId: form.task.id,
          actionGroupId: group.id || generateSnowflakeId(),
          deviceType: action.deviceType,
          deviceId: action.deviceId,
          commandLine: action.commandLine,
          args: action.args,
        })),
      })),
      alarmGroup: form.alarmGroup.map((item) => ({
        id: item.id || generateSnowflakeId(),
        scheduleTaskId: form.task.id,
      })),
      watchDog: { ...form.watchDog },
    };

    emit("confirm", submitData);
    dialogVisible.value = false;
    resetForm();
  } catch (error) {
    // 表单校验失败
  }
};

// ========== 时间规则操作 ==========
const handleEditTimeRule = () => {
  showTimeRuleDialog.value = true;
};

const handleSaveTimeRule = (data) => {
  Object.assign(form.timeRule, {
    id: form.timeRule.id || generateSnowflakeId(),
    ...data,
  });
  ElMessage.success("时间规则保存成功");
};

// ========== 数据组操作 ==========
const handleAddDataGroup = () => {
  currentEditingDataGroup.value = null;
  currentEditingDataGroupIndex.value = -1;
  showDataGroupDialog.value = true;
};

const handleEditDataGroup = (item, index) => {
  currentEditingDataGroup.value = { ...item };
  currentEditingDataGroupIndex.value = index;
  showDataGroupDialog.value = true;
};

const handleRemoveDataGroup = (index) => {
  form.dataGroup.splice(index, 1);
  ElMessage.success("删除成功");
};

const handleSaveDataGroup = (data) => {
  if (currentEditingDataGroupIndex.value >= 0) {
    // 编辑
    form.dataGroup[currentEditingDataGroupIndex.value] = { ...data };
  } else {
    // 新增
    form.dataGroup.push({
      ...data,
      id: generateSnowflakeId(),
    });
  }
  showDataGroupDialog.value = false;
};

// ========== 条件组操作 ==========
const handleAddConditionGroup = () => {
  currentEditingConditionGroup.value = null;
  currentEditingConditionGroupIndex.value = -1;
  showConditionGroupDialog.value = true;
};

const handleEditConditionGroup = (item, index) => {
  currentEditingConditionGroup.value = JSON.parse(JSON.stringify(item));
  currentEditingConditionGroupIndex.value = index;
  showConditionGroupDialog.value = true;
};

const handleRemoveConditionGroup = (index) => {
  form.conditionGroups.splice(index, 1);
  ElMessage.success("删除成功");
};

const handleSaveConditionGroup = (data) => {
  if (currentEditingConditionGroupIndex.value >= 0) {
    form.conditionGroups[currentEditingConditionGroupIndex.value] = JSON.parse(
      JSON.stringify(data),
    );
  } else {
    // 新增：为条件组和条件都生成ID
    const groupId = generateSnowflakeId();
    form.conditionGroups.push({
      ...data,
      id: groupId,
      conditions: (data.conditions || []).map((cond) => ({
        ...cond,
        id: cond.id || generateSnowflakeId(),
        conditionGroupId: groupId,
      })),
    });
  }
  showConditionGroupDialog.value = false;
};

// ========== 动作组操作 ==========
const handleAddActionGroup = () => {
  currentEditingActionGroup.value = null;
  currentEditingActionGroupIndex.value = -1;
  showActionGroupDialog.value = true;
};

const handleEditActionGroup = (item, index) => {
  currentEditingActionGroup.value = JSON.parse(JSON.stringify(item));
  currentEditingActionGroupIndex.value = index;
  showActionGroupDialog.value = true;
};

const handleRemoveActionGroup = (index) => {
  form.actionGroups.splice(index, 1);
  ElMessage.success("删除成功");
};

const handleSaveActionGroup = (data) => {
  if (currentEditingActionGroupIndex.value >= 0) {
    form.actionGroups[currentEditingActionGroupIndex.value] = JSON.parse(
      JSON.stringify(data),
    );
  } else {
    // 新增：为动作组和动作都生成ID
    const groupId = generateSnowflakeId();
    form.actionGroups.push({
      ...data,
      id: groupId,
      actions: (data.actions || []).map((action) => ({
        ...action,
        id: action.id || generateSnowflakeId(),
        actionGroupId: groupId,
      })),
    });
  }
  showActionGroupDialog.value = false;
};

// ========== 报警组操作 ==========
const handleAddAlarmGroup = () => {
  currentEditingAlarmGroup.value = null;
  currentEditingAlarmGroupIndex.value = -1;
  showAlarmGroupDialog.value = true;
};

const handleEditAlarmGroup = (item, index) => {
  currentEditingAlarmGroup.value = { ...item };
  currentEditingAlarmGroupIndex.value = index;
  showAlarmGroupDialog.value = true;
};

const handleRemoveAlarmGroup = (index) => {
  form.alarmGroup.splice(index, 1);
  ElMessage.success("删除成功");
};

const handleSaveAlarmGroup = (data) => {
  if (currentEditingAlarmGroupIndex.value >= 0) {
    form.alarmGroup[currentEditingAlarmGroupIndex.value] = { ...data };
  } else {
    form.alarmGroup.push({
      ...data,
      id: generateSnowflakeId(),
    });
  }
  showAlarmGroupDialog.value = false;
};
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

/* 时间规则预览 */
.time-rule-preview {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

/* 分组区域 */
.group-section {
  width: 100%;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.group-label {
  font-size: 14px;
  font-weight: bold;
  color: #606266;
}

.group-content {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

:deep(.add-strategy-dialog .el-dialog) {
  width: 1100px !important;
  left: calc(50% - 550px) !important;
}

/* 卡片样式 */
.group-card {
  width: calc(25% - 9px);
  min-width: 180px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.card-body {
  font-size: 12px;
  color: #606266;
}

.card-body p {
  margin: 2px 0;
}

/* 条件/动作项 */
.condition-item,
.action-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 3px 0;
  padding: 2px 4px;
  background-color: #f5f7fa;
  border-radius: 3px;
}

.condition-desc,
.action-cmd {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: #303133;
}

.action-cmd-small {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

/* 看门狗区域 */
.watchdog-section {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

:deep(.el-divider__text) {
  font-size: 14px;
  font-weight: bold;
  color: #409eff;
}

:deep(.el-empty) {
  padding: 20px 0;
}

:deep(.el-card__header) {
  padding: 8px 12px;
}

:deep(.el-card__body) {
  padding: 8px 12px;
}
</style>
