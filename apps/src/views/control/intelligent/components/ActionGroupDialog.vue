<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑动作组' : '添加动作组'"
    width="750px"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="关联条件组">
        <el-select
          v-model="form.conditionGroupId"
          placeholder="选择关联的条件组（可选，满足条件时执行）"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="(group, index) in availableConditionGroups"
            :key="group.id"
            :label="`条件组${index + 1} (${group.type || 'ALL'})`"
            :value="group.id"
          />
        </el-select>
        <div class="hint-text">
          当前选中: {{ form.conditionGroupId || "无" }} |
          不选择条件组则表示无条件执行
        </div>
      </el-form-item>

      <el-divider>动作列表</el-divider>

      <div class="actions-list">
        <div
          v-for="(action, index) in form.actions"
          :key="index"
          class="action-row"
        >
          <el-card shadow="never">
            <template #header>
              <div class="action-header">
                <span>动作 {{ index + 1 }}</span>
                <el-button
                  type="danger"
                  link
                  size="small"
                  @click="removeAction(index)"
                >
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </div>
            </template>

            <!-- 设备类型和设备选择 -->
            <div class="device-select-row">
              <div class="device-select-item">
                <div class="select-label">
                  设备类型 <span class="required">*</span>
                </div>
                <el-select
                  v-model="action.deviceType"
                  placeholder="选择设备类型"
                  style="width: 100%"
                  @change="(val) => { handleDeviceTypeChange(action); updateActionDesc(action); }"
                >
                  <el-option label="空调" value="AirCondition" />
                  <el-option label="断路器" value="CircuitBreak" />
                  <el-option label="照明" value="Light" />
                  <el-option label="门禁" value="Access" />
                </el-select>
              </div>
              <div class="device-select-item device-name-item">
                <div class="select-label">
                  设备 <span class="required">*</span>
                </div>
                <el-select
                  v-model="action.deviceId"
                  :placeholder="
                    props.laboratoryId ? '选择设备' : '请先选择实验室'
                  "
                  style="width: 100%"
                  filterable
                  :disabled="!action.deviceType || !props.laboratoryId"
                  @change="updateActionDesc(action)"
                >
                  <el-option
                    v-for="device in getDevicesByType(action.deviceType)"
                    :key="device.id"
                    :label="
                      device.deviceName || device.name || `设备${device.id}`
                    "
                    :value="device.id"
                  />
                </el-select>
                <div
                  v-if="!props.laboratoryId"
                  class="hint-text"
                  style="color: #f56c6c; margin-top: 4px"
                >
                  <el-icon><Warning /></el-icon> 提示：请返回上一级选择实验室
                </div>
              </div>
            </div>

            <!-- 动作描述预览 -->
            <el-form-item v-if="action.desc">
              <div class="expr-preview">
                <span class="expr-label">动作描述：</span>
                <el-tag type="info" size="small">{{ action.desc }}</el-tag>
              </div>
            </el-form-item>

            <!-- 指令控制区域 -->
            <div class="control-section">
              <!-- 空调控制 -->
              <template v-if="action.deviceType === 'AirCondition'">
                <div class="control-title">
                  <el-icon><SetUp /></el-icon>
                  <span>空调控制</span>
                </div>
                <!-- 第一行：开关和模式 -->
                <el-row :gutter="12">
                  <el-col :span="12">
                    <el-form-item label="开关" label-width="50px">
                      <el-select
                        v-model="action.params.power"
                        size="small"
                        style="width: 100%"
                        @change="updateActionDesc(action)"
                      >
                        <el-option label="开" :value="1" />
                        <el-option label="关" :value="0" />
                      </el-select>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="模式" label-width="50px">
                      <el-select
                        v-model="action.params.mode"
                        size="small"
                        style="width: 100%"
                        @change="updateActionDesc(action)"
                      >
                        <el-option label="制热" :value="1" />
                        <el-option label="制冷" :value="2" />
                        <el-option label="送风" :value="4" />
                        <el-option label="除湿" :value="8" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <!-- 第二行：温度和风速 -->
                <el-row :gutter="12" style="margin-top: 0px">
                  <el-col :span="12">
                    <el-form-item label="温度" label-width="50px">
                      <el-select
                        v-model="action.params.temperature"
                        size="small"
                        style="width: 100%"
                        @change="updateActionDesc(action)"
                      >
                        <el-option
                          v-for="temp in temperatureOptions"
                          :key="temp"
                          :label="temp + '℃'"
                          :value="temp"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="风速" label-width="50px">
                      <el-select
                        v-model="action.params.fanSpeed"
                        size="small"
                        style="width: 100%"
                        @change="updateActionDesc(action)"
                      >
                        <el-option label="自动" :value="0" />
                        <el-option label="低速" :value="1" />
                        <el-option label="中速" :value="2" />
                        <el-option label="高速" :value="3" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
              </template>

              <!-- 断路器控制 -->
              <template v-if="action.deviceType === 'CircuitBreak'">
                <div class="control-title">
                  <el-icon><Switch /></el-icon>
                  <span>断路器控制</span>
                </div>
                <el-form-item>
                  <el-radio-group v-model="action.commandLine" size="large" @change="updateActionDesc(action)">
                    <el-radio-button label="OPEN_CIRCUITBREAK">
                      <el-icon><CircleCheck /></el-icon> 通电
                    </el-radio-button>
                    <el-radio-button label="CLOSE_CIRCUITBREAK">
                      <el-icon><CircleClose /></el-icon> 断电
                    </el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </template>

              <!-- 照明控制 -->
              <template v-if="action.deviceType === 'Light'">
                <div class="control-title">
                  <el-icon><Lightning /></el-icon>
                  <span>照明控制</span>
                </div>
                <el-form-item>
                  <el-radio-group v-model="action.commandLine" size="large" @change="updateActionDesc(action)">
                    <el-radio-button label="OPEN_LIGHT">
                      <el-icon><Sunny /></el-icon> 打开
                    </el-radio-button>
                    <el-radio-button label="CLOSE_LIGHT">
                      <el-icon><Moon /></el-icon> 关闭
                    </el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </template>

              <!-- 门禁控制 -->
              <template v-if="action.deviceType === 'Access'">
                <div class="control-title">
                  <el-icon><Lock /></el-icon>
                  <span>门禁控制</span>
                </div>
                <el-form-item>
                  <el-radio-group v-model="action.commandLine" size="large" @change="updateActionDesc(action)">
                    <el-radio-button label="OPEN_ACCESS_ONCE">
                      <el-icon><Unlock /></el-icon> 开启
                    </el-radio-button>
                    <el-radio-button label="CLOSE_ACCESS_ONCE">
                      <el-icon><Lock /></el-icon> 关闭
                    </el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </template>
            </div>
          </el-card>
        </div>

        <el-button
          type="primary"
          link
          @click="addAction"
          style="margin-top: 10px"
        >
          <el-icon><Plus /></el-icon>添加动作
        </el-button>

        <el-empty
          v-if="form.actions.length === 0"
          description="暂无动作，请添加"
          :image-size="60"
        />
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import {
  Plus,
  Delete,
  SetUp,
  Switch,
  CircleCheck,
  CircleClose,
  Sunny,
  Moon,
  Lock,
  Unlock,
  View,
  Lightning,
  Warning,
} from "@element-plus/icons-vue";
import { useDeviceStore, DeviceType } from "@/stores";
import { storeToRefs } from "pinia";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: null,
  },
  // 可选的条件组列表
  conditionGroups: {
    type: Array,
    default: () => [],
  },
  // 所属实验室ID
  laboratoryId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const deviceStore = useDeviceStore();
const { deviceMap } = storeToRefs(deviceStore);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.data);

// 可用的条件组（确保ID统一为字符串类型）
const availableConditionGroups = computed(() => {
  return (props.conditionGroups || []).map((group, index) => ({
    ...group,
    id: group.id ? String(group.id) : `temp_${index}`,
  }));
});

const temperatureOptions = Array.from({ length: 15 }, (_, i) => i + 16);

const form = reactive({
  id: "",
  conditionGroupId: null,
  actions: [],
});

// 设备类型对应的指令列表
const deviceTypeCommands = {
  AirCondition: [
    {
      label: "增强控制（开关+模式+温度+风速）",
      value: "ENHANCE_CONTROL_AIR_CONDITION",
    },
  ],
  CircuitBreak: [
    { label: "通电", value: "OPEN_CIRCUITBREAK" },
    { label: "断电", value: "CLOSE_CIRCUITBREAK" },
  ],
  Light: [
    { label: "打开照明", value: "OPEN_LIGHT" },
    { label: "关闭照明", value: "CLOSE_LIGHT" },
  ],
  Access: [
    { label: "开启门禁", value: "OPEN_ACCESS_ONCE" },
    { label: "关闭门禁", value: "CLOSE_ACCESS_ONCE" },
  ],
};

// 根据设备类型获取指令列表
const getCommandsByDeviceType = (deviceType) => {
  return deviceTypeCommands[deviceType] || [];
};

// 根据设备类型获取设备列表
const getDevicesByType = (deviceType) => {
  if (!deviceType) return [];

  const list = [];
  Object.values(deviceMap.value).forEach((arr) => {
    arr.forEach((item) => {
      const itemDeviceType = item.device?.deviceType;
      const deviceLabId = item.device?.belongToLaboratoryId;

      // 类型匹配
      if (itemDeviceType !== deviceType) return;

      // 实验室筛选（如果指定了实验室）
      if (props.laboratoryId) {
        const targetLabId = String(props.laboratoryId);
        const currentLabId = String(deviceLabId);
        if (currentLabId !== targetLabId) return;
      }

      list.push({
        id: item.device?.id,
        deviceId: item.deviceId,
        deviceName: item.device?.deviceName || item.device?.name,
        deviceType: itemDeviceType,
        address: item.device?.address || item.deviceRecord?.data?.address,
        selfId: item.device?.selfId || item.deviceRecord?.data?.selfId,
      });
    });
  });
  return list;
};

// 设备类型改变时，清空已选设备和指令
const handleDeviceTypeChange = (action) => {
  action.deviceId = null;
  action.deviceName = "";
  action.params = createDefaultParams();
  // 根据设备类型设置默认指令
  if (action.deviceType === "AirCondition") {
    action.commandLine = "ENHANCE_CONTROL_AIR_CONDITION";
  } else {
    action.commandLine = "";
  }
};

// 指令类型改变时，重置参数
const handleCommandChange = (action) => {
  action.params = createDefaultParams();
};

// 创建默认参数
const createDefaultParams = () => ({
  power: 1,
  mode: 2,
  temperature: 24,
  fanSpeed: 0,
});

// 更新动作描述
const updateActionDesc = (action) => {
  if (!action.deviceType || !action.deviceId) {
    action.desc = "";
    return;
  }
  action.desc = generateCommandPreview(action);
};

// 生成指令预览文本
const generateCommandPreview = (action) => {
  if (!action.deviceType || !action.commandLine) {
    return "请选择设备类型和指令";
  }

  const deviceTypeName =
    {
      AirCondition: "空调",
      CircuitBreak: "断路器",
      Light: "照明",
      Access: "门禁",
    }[action.deviceType] || action.deviceType;

  const device = getDevicesByType(action.deviceType).find(
    (d) => d.id === action.deviceId,
  );
  const deviceName = device?.deviceName || device?.name || "未选择设备";

  let operation = "";
  switch (action.commandLine) {
    case "ENHANCE_CONTROL_AIR_CONDITION":
      const powerText = action.params.power === 1 ? "开" : "关";
      const modeText =
        { 1: "制热", 2: "制冷", 4: "送风", 8: "除湿" }[action.params.mode] ||
        "制冷";
      operation = `${powerText}, ${modeText}, ${action.params.temperature}℃, ${["自动", "低速", "中速", "高速"][action.params.fanSpeed]}`;
      break;
    case "OPEN_CIRCUITBREAK":
      operation = "通电";
      break;
    case "CLOSE_CIRCUITBREAK":
      operation = "断电";
      break;
    case "OPEN_LIGHT":
      operation = "打开";
      break;
    case "CLOSE_LIGHT":
      operation = "关闭";
      break;
    case "OPEN_ACCESS_ONCE":
      operation = "开启";
      break;
    case "CLOSE_ACCESS_ONCE":
      operation = "关闭";
      break;
    default:
      operation = action.commandLine;
  }

  return `${deviceTypeName} ${deviceName}: ${operation}`;
};

// 重置表单
const resetForm = () => {
  form.id = "";
  form.conditionGroupId = null;
  form.actions = [];
};

// 生成雪花ID
const generateSnowflakeId = () => {
  return `${Date.now()}${Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0")}`;
};

const addAction = () => {
  form.actions.push({
    id: generateSnowflakeId(),
    deviceType: "",
    deviceId: null,
    deviceName: "",
    commandLine: "",
    params: createDefaultParams(),
    args: [],
    actionGroupId: "",
    scheduleTaskId: "",
    desc: "",
  });
};

const removeAction = (index) => {
  form.actions.splice(index, 1);
};

// 构建控制指令参数（返回数字数组，确保都是整数）
const buildCommandArgs = (action, device) => {
  switch (action.deviceType) {
    case "AirCondition":
      if (action.commandLine === "ENHANCE_CONTROL_AIR_CONDITION") {
        return [
          parseInt(device.address ?? 31),
          parseInt(device.selfId ?? 1),
          parseInt(action.params?.power ?? 1),
          parseInt(action.params?.mode ?? 2),
          parseInt(action.params?.temperature ?? 24),
          parseInt(action.params?.fanSpeed ?? 0),
        ];
      }
      break;
    case "CircuitBreak":
      return [parseInt(device.address ?? 0)];
    case "Access":
      return [parseInt(device.address ?? 0), parseInt(device.selfId ?? 1)];
    case "Light":
      return [parseInt(device.address ?? 0)];
  }
  return [];
};
// 从 args 数组反解出 params（用于回显）
const parseParamsFromArgs = (action) => {
  // 如果有 params 直接用（兼容后端可能返回的情况）
  if (action.params) return action.params;

  const args = action.args || [];

  switch (action.deviceType) {
    case "AirCondition":
      if (args.length >= 6) {
        return {
          power: args[2],
          mode: args[3],
          temperature: args[4],
          fanSpeed: args[5],
        };
      }
      break;

    case "CircuitBreak":
      // 断路器只有 address，没有复杂参数
      return {};

    case "Light":
      // 照明只有开关，没有复杂参数
      return {};

    case "Access":
      // 门禁只有 address 和 selfId，没有复杂参数
      return {};
  }

  // 兜底：返回默认值
  return createDefaultParams();
};
// 监听弹窗显示状态，处理数据回填
watch(
  () => dialogVisible.value,
  (visible) => {
    if (visible) {
      nextTick(() => {
        if (props.data) {
          // 深拷贝 actions，避免污染原始数据
          console.log("【回显】原始 props.data:", props.data);
          const actions = JSON.parse(
            JSON.stringify(props.data.actions || []),
          ).map((action) => ({
            ...action,
            params: parseParamsFromArgs(action), // ← 关键修改
          }));
          Object.assign(form, {
            id: props.data.id || "",
            conditionGroupId: props.data.conditionGroupId
              ? String(props.data.conditionGroupId)
              : null,
            actions: actions,
          });
          console.log(
            "【回显】最终 form 数据:",
            JSON.parse(JSON.stringify(form)),
          );
        } else {
          resetForm();
        }
      });
    }
  },
);

const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};

const handleSave = () => {
  // 验证动作
  for (let i = 0; i < form.actions.length; i++) {
    const action = form.actions[i];
    if (!action.deviceType) {
      ElMessage.warning(`动作 ${i + 1} 的设备类型不能为空`);
      return;
    }
    if (!action.deviceId) {
      ElMessage.warning(`动作 ${i + 1} 的设备不能为空`);
      return;
    }
    if (!action.commandLine) {
      ElMessage.warning(`动作 ${i + 1} 的指令类型不能为空`);
      return;
    }

    // 获取设备信息并构建参数
    const device = getDevicesByType(action.deviceType).find(
      (d) => d.id === action.deviceId,
    );
    if (!device) {
      ElMessage.warning(`动作 ${i + 1} 找不到对应的设备信息`);
      return;
    }

    action.args = buildCommandArgs(action, device);

    // 保存时删除 params，只保留 args
    delete action.params;
  }

  emit("save", { ...form });
  dialogVisible.value = false;
  resetForm();
};

// 加载设备数据（参考门禁管理、电气监控页面的方式）
const loadDevices = async () => {
  if (!props.laboratoryId) return;

  try {
    const labIds = [props.laboratoryId];

    // 参考成功页面的方式：分别获取每种类型的设备
    await deviceStore.fetchDevicesByType(DeviceType.AIR_CONDITION, labIds);
    await deviceStore.fetchDevicesByType(DeviceType.CIRCUIT_BREAK, labIds);
    await deviceStore.fetchDevicesByType(DeviceType.LIGHT, labIds);
    await deviceStore.fetchDevicesByType(DeviceType.SENSOR, labIds);
    await deviceStore.fetchDevicesByType(DeviceType.ACCESS, labIds);
  } catch (error) {
    console.error("【ActionGroupDialog】加载设备失败:", error);
    ElMessage.error("加载设备列表失败");
  }
};

// 监听弹窗显示状态，当弹窗打开时加载设备
watch(
  () => dialogVisible.value,
  (visible) => {
    if (visible) loadDevices();
  },
);

// 组件挂载时也尝试加载
onMounted(() => {
  if (dialogVisible.value && props.laboratoryId) loadDevices();
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.actions-list {
  max-height: 520px;
  overflow-y: auto;
  padding-right: 4px;
}

.action-row {
  margin-bottom: 16px;
}

.action-row :deep(.el-card) {
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.action-row :deep(.el-card:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: #303133;
}

.hint-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 描述预览样式 */
.expr-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.expr-label {
  font-size: 12px;
  color: #606266;
}

/* 控制区域样式 */
.control-section {
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
  border: 1px solid #ebeef5;
}

.control-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.control-title .el-icon {
  font-size: 16px;
}

/* 指令预览区域 */
.command-preview-box {
  background: #f0f9ff;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 12px;
  border-left: 4px solid #409eff;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.preview-content {
  display: flex;
  align-items: center;
}

.preview-content .el-tag {
  font-size: 13px;
  padding: 6px 12px;
  height: auto;
  line-height: 1.4;
}

:deep(.el-card__header) {
  padding: 12px 16px;
  background: linear-gradient(90deg, #f5f7fa 0%, #ffffff 100%);
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

/* 添加按钮样式 */
:deep(.el-button--primary.is-link) {
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

:deep(.el-button--primary.is-link:hover) {
  background-color: #ecf5ff;
}

/* 标签左对齐 */
.label-left :deep(.el-form-item__label) {
  justify-content: flex-start;
  padding-left: 0;
}

/* 设备选择行 */
.device-select-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.device-select-item {
  flex: 1;
}

.device-name-item {
  flex: 1.5;
}

.select-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
  font-weight: 500;
}

.select-label .required {
  color: #f56c6c;
  margin-left: 2px;
}

/* 单选按钮组样式 */
:deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-radio-button__inner) {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 空状态样式 */
:deep(.el-empty) {
  padding: 40px 0;
}
</style>
