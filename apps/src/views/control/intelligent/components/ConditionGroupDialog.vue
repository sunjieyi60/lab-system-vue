<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑条件组' : '添加条件组'"
    width="750px"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="条件类型">
        <el-radio-group v-model="form.type">
          <el-radio label="ALL">全部满足 (AND)</el-radio>
          <el-radio label="ANY">任一满足 (OR)</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-divider>条件列表</el-divider>

      <div class="conditions-list">
        <div
          v-for="(condition, index) in form.conditions"
          :key="index"
          class="condition-row"
        >
          <el-card shadow="never">
            <template #header>
              <div class="condition-header">
                <span>条件 {{ index + 1 }}</span>
                <el-button
                  type="danger"
                  link
                  size="small"
                  @click="removeCondition(index)"
                >
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </div>
            </template>

            <!-- 设备选择（从数据组中选择） -->
            <el-form-item label="选择设备" :required="true">
              <el-select
                v-model="condition.deviceId"
                placeholder="请选择设备"
                style="width: 100%"
                @change="(val) => { handleDeviceChange(val, condition); updateConditionDesc(condition); }"
              >
                <el-option
                  v-for="device in availableDevices"
                  :key="device.deviceId"
                  :label="device.deviceName || getDeviceLabel(device)"
                  :value="device.deviceId"
                />
              </el-select>
            </el-form-item>

            <!-- 属性选择 -->
            <el-form-item label="属性" :required="true">
              <el-select
                v-model="condition.property"
                placeholder="请选择属性"
                style="width: 100%"
                :disabled="!condition.deviceType"
                @change="(val) => { handlePropertyChange(val, condition); updateConditionDesc(condition); }"
              >
                <el-option
                  v-for="prop in getPropertiesByDeviceType(
                    condition.deviceType,
                  )"
                  :key="prop.value"
                  :label="prop.label"
                  :value="prop.value"
                />
              </el-select>
            </el-form-item>

            <!-- 条件值设置 - 根据属性类型动态渲染 -->
            <el-form-item label="条件" :required="true">
              <!-- 温度类属性：比较符 + 数值 -->
              <div
                v-if="isTemperatureProperty(condition.property)"
                class="condition-expr-row"
              >
                <el-select v-model="condition.operator" style="width: 90px" @change="updateConditionDesc(condition)">
                  <el-option label=">" value=">" />
                  <el-option label="≥" value=">=" />
                  <el-option label="<" value="<" />
                  <el-option label="≤" value="<=" />
                  <el-option label="=" value="==" />
                </el-select>
                <el-input-number
                  v-model="condition.value"
                  :min="0"
                  :max="50"
                  :precision="0"
                  style="flex: 1; margin-left: 8px"
                  placeholder="温度值"
                  @change="updateConditionDesc(condition)"
                />
                <span style="margin-left: 8px; color: #606266">°C</span>
              </div>

              <!-- 开关状态：选择开/关 -->
              <div
                v-else-if="isSwitchProperty(condition.property)"
                class="condition-expr-row"
              >
                <el-select
                  v-model="condition.operator"
                  style="width: 90px; display: none"
                >
                  <el-option label="=" value="==" />
                </el-select>
                <el-radio-group v-model="condition.value" style="flex: 1" @change="updateConditionDesc(condition)">
                  <el-radio-button label="开" :value="true" />
                  <el-radio-button label="关" :value="false" />
                </el-radio-group>
              </div>

              <!-- 空调模式：选择模式 -->
              <div
                v-else-if="condition.property === 'mode'"
                class="condition-expr-row"
              >
                <el-select
                  v-model="condition.operator"
                  style="width: 90px; display: none"
                >
                  <el-option label="=" value="==" />
                </el-select>
                <el-radio-group v-model="condition.value" style="flex: 1" @change="updateConditionDesc(condition)">
                  <el-radio-button label="制冷" :value="2" />
                  <el-radio-button label="制热" :value="1" />
                  <el-radio-button label="送风" :value="4" />
                  <el-radio-button label="除湿" :value="8" />
                </el-radio-group>
              </div>

              <!-- 风速：选择风速 -->
              <div
                v-else-if="condition.property === 'speed'"
                class="condition-expr-row"
              >
                <el-select
                  v-model="condition.operator"
                  style="width: 90px; display: none"
                >
                  <el-option label="=" value="==" />
                </el-select>
                <el-radio-group v-model="condition.value" style="flex: 1" @change="updateConditionDesc(condition)">
                  <el-radio-button label="自动" :value="0" />
                  <el-radio-button label="低速" :value="1" />
                  <el-radio-button label="中速" :value="2" />
                  <el-radio-button label="高速" :value="3" />
                </el-radio-group>
              </div>

              <!-- 电压/电流/功率/漏电流：比较符 + 数值 -->
              <div
                v-else-if="isNumericProperty(condition.property)"
                class="condition-expr-row"
              >
                <el-select v-model="condition.operator" style="width: 90px" @change="updateConditionDesc(condition)">
                  <el-option label=">" value=">" />
                  <el-option label="≥" value=">=" />
                  <el-option label="<" value="<" />
                  <el-option label="≤" value="<=" />
                  <el-option label="=" value="==" />
                </el-select>
                <el-input-number
                  v-model="condition.value"
                  :min="0"
                  :precision="0"
                  style="flex: 1; margin-left: 8px"
                  placeholder="数值"
                  @change="updateConditionDesc(condition)"
                />
                <span style="margin-left: 8px; color: #606266">{{
                  getUnit(condition.property)
                }}</span>
              </div>

              <!-- 其他属性：比较符 + 输入框 -->
              <div v-else class="condition-expr-row">
                <el-select v-model="condition.operator" style="width: 90px" @change="updateConditionDesc(condition)">
                  <el-option label="=" value="==" />
                  <el-option label="≠" value="!=" />
                  <el-option label=">" value=">" />
                  <el-option label="≥" value=">=" />
                  <el-option label="<" value="<" />
                  <el-option label="≤" value="<=" />
                </el-select>
                <el-input
                  v-model="condition.value"
                  placeholder="请输入值"
                  style="flex: 1; margin-left: 8px"
                  @change="updateConditionDesc(condition)"
                />
              </div>
            </el-form-item>

            <!-- 表达式预览 -->
            <el-form-item>
              <div class="expr-preview">
                <span class="expr-label">表达式预览：</span>
                <el-tag type="info" size="small">{{
                  generateExprPreview(condition)
                }}</el-tag>
              </div>
            </el-form-item>

            <el-form-item label="描述">
              <el-input
                v-model="condition.desc"
                type="textarea"
                :rows="2"
                placeholder="条件描述（可选，为空时自动生成）"
              />
            </el-form-item>
          </el-card>
        </div>

        <el-button
          type="primary"
          link
          @click="addCondition"
          style="margin-top: 10px"
        >
          <el-icon><Plus /></el-icon>添加条件
        </el-button>

        <el-empty
          v-if="form.conditions.length === 0"
          description="暂无条件，请添加"
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
import { ref, reactive, computed, watch, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Delete } from "@element-plus/icons-vue";
import { useDeviceStore } from "@/stores";
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
  dataGroup: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.data);

// 使用 deviceStore 获取设备信息
const deviceStore = useDeviceStore();
const { deviceMap } = storeToRefs(deviceStore);

const form = reactive({
  id: "",
  type: "ALL",
  conditions: [],
});

// 设备类型对应的属性列表
const deviceTypeProperties = {
  AirCondition: [
    { label: "房间温度", value: "roomTemperature", type: "temperature" },
    { label: "设定温度", value: "temperature", type: "temperature" },
    { label: "开关状态", value: "isOpen", type: "switch" },
    { label: "模式", value: "mode", type: "mode" },
    { label: "风速", value: "speed", type: "speed" },
  ],
  CircuitBreak: [
    { label: "开关状态", value: "isOpen", type: "switch" },
    { label: "电压", value: "voltage", type: "numeric" },
    { label: "电流", value: "current", type: "numeric" },
    { label: "功率", value: "power", type: "numeric" },
    { label: "漏电流", value: "leakage", type: "numeric" },
    { label: "温度", value: "temperature", type: "temperature" },
  ],
  Light: [
    { label: "开关状态", value: "isOpen", type: "switch" },
    { label: "锁定状态", value: "isLock", type: "switch" },
  ],
  Sensor: [
    { label: "温度", value: "temperature", type: "temperature" },
    { label: "湿度", value: "humidity", type: "numeric" },
    { label: "光照", value: "light", type: "numeric" },
    { label: "烟雾", value: "smoke", type: "switch" },
  ],
  Access: [
    { label: "门状态", value: "isOpen", type: "switch" },
    { label: "锁状态", value: "lockStatus", type: "switch" },
  ],
};

// 设备类型中文映射
const deviceTypeNameMap = {
  AirCondition: "空调",
  CircuitBreak: "断路器",
  Light: "照明",
  Sensor: "传感器",
  Access: "门禁",
};

// 属性类型中文映射
const propertyTypeMap = {
  roomTemperature: "温度",
  temperature: "温度",
  isOpen: "开关",
  mode: "模式",
  speed: "风速",
  isLock: "锁定",
  voltage: "电压",
  current: "电流",
  power: "功率",
  leakage: "漏电流",
  humidity: "湿度",
  light: "光照",
  smoke: "烟雾",
  lockStatus: "锁状态",
};

// 模式值映射
const modeValueMap = {
  1: "制热",
  2: "制冷",
  4: "送风",
  8: "除湿",
};

// 风速值映射
const speedValueMap = {
  0: "自动",
  1: "低速",
  2: "中速",
  3: "高速",
};

// 可用的设备列表（从dataGroup中获取）
const availableDevices = computed(() => {
  return props.dataGroup || [];
});

// 获取设备显示标签（优先从 deviceStore 查找设备名）
const getDeviceLabel = (device) => {
  // 先从 deviceStore 中查找设备名称
  if (device.deviceId) {
    for (const arr of Object.values(deviceMap.value)) {
      const found = arr.find((item) => {
        const id = item.device?.id;
        const devId = item.deviceId;
        return (
          String(id) === String(device.deviceId) ||
          String(devId) === String(device.deviceId)
        );
      });
      if (found) {
        const deviceName = found.device?.deviceName || found.device?.name;
        if (deviceName) return deviceName;
      }
    }
  }
  //  fallback：使用类型+ID
  const typeName = deviceTypeNameMap[device.deviceType] || device.deviceType;
  return `${typeName} - 设备${device.deviceId}`;
};

// 根据设备类型获取属性列表
const getPropertiesByDeviceType = (deviceType) => {
  return deviceTypeProperties[deviceType] || [];
};

// 判断是否是温度类属性
const isTemperatureProperty = (property) => {
  return property === "temperature" || property === "roomTemperature";
};

// 判断是否是开关类属性
const isSwitchProperty = (property) => {
  return ["isOpen", "isLock", "smoke", "lockStatus"].includes(property);
};

// 判断是否是数值类属性
const isNumericProperty = (property) => {
  return [
    "voltage",
    "current",
    "power",
    "leakage",
    "humidity",
    "light",
  ].includes(property);
};

// 获取单位
const getUnit = (property) => {
  const unitMap = {
    voltage: "V",
    current: "A",
    power: "W",
    leakage: "mA",
    humidity: "%",
    light: "lux",
  };
  return unitMap[property] || "";
};

// 设备选择变化处理
const handleDeviceChange = (deviceId, condition) => {
  const device = availableDevices.value.find((d) => d.deviceId === deviceId);
  if (device) {
    condition.deviceType = device.deviceType;
    // 清空已选属性
    condition.property = "";
    condition.value = "";
    condition.operator = "==";
  }
};

// 属性选择变化处理
const handlePropertyChange = (property, condition) => {
  // 根据属性类型设置默认操作符和值
  const props = getPropertiesByDeviceType(condition.deviceType);
  const propInfo = props.find((p) => p.value === property);

  if (propInfo.type) {
    if (propInfo.type === "temperature" || propInfo.type === "numeric") {
      condition.operator = ">=";
      condition.value = 0;
    } else if (propInfo.type === "switch") {
      condition.operator = "==";
      condition.value = true;
    } else if (propInfo.type === "mode") {
      condition.operator = "==";
      condition.value = 2; // 默认制冷
    } else if (propInfo.type === "speed") {
      condition.operator = "==";
      condition.value = 0; // 默认自动
    }
  }
};

// 生成表达式预览
const generateExprPreview = (condition) => {
  if (!condition.property) {
    return "请选择完整的条件";
  }

  const propLabel = getPropertyLabel(condition.deviceType, condition.property);
  const deviceLabel = getDeviceLabel(
    availableDevices.value.find((d) => d.deviceId === condition.deviceId) || {},
  );

  let valueText = condition.value;
  if (condition.property === "mode") {
    valueText = modeValueMap[condition.value] || condition.value;
  } else if (condition.property === "speed") {
    valueText = speedValueMap[condition.value] || condition.value;
  } else if (isSwitchProperty(condition.property)) {
    valueText = condition.value ? "开" : "关";
  }

  const operatorText =
    isSwitchProperty(condition.property) ||
    condition.property === "mode" ||
    condition.property === "speed"
      ? ""
      : ` ${condition.operator} `;

  return `${deviceLabel} ${propLabel}${operatorText}${valueText}`;
};

// 生成实际的 SpEL 表达式
const generateExpr = (condition) => {
  // 格式：#{dataGroupId}.property operator value
  // 找到对应的dataGroup项
  const dataGroupItem = availableDevices.value.find(
    (d) => d.deviceId === condition.deviceId,
  );
  const dataGroupId = dataGroupItem?.id || condition.deviceId;
  // 确保数值类型为整数
  const value = isNumericProperty(condition.property) || isTemperatureProperty(condition.property)
    ? parseInt(condition.value)
    : condition.value;
  return `#{${dataGroupId}}.${condition.property} ${condition.operator} ${value}`;
};

// 获取属性标签
const getPropertyLabel = (deviceType, property) => {
  const props = deviceTypeProperties[deviceType] || [];
  const found = props.find((p) => p.value === property);
  return found ? found.label : property;
};

// 更新条件描述
const updateConditionDesc = (condition) => {
  if (!condition.deviceId || !condition.property) {
    condition.desc = "";
    return;
  }
  condition.desc = generateDisplayText(condition);
};

// 生成友好显示文本
const generateDisplayText = (condition) => {
  const device = availableDevices.value.find(
    (d) => d.deviceId === condition.deviceId,
  );
  const deviceLabel = getDeviceLabel(device);
  const propLabel = getPropertyLabel(condition.deviceType, condition.property);

  let valueText = condition.value;
  if (condition.property === "mode") {
    valueText = modeValueMap[condition.value] || condition.value;
  } else if (condition.property === "speed") {
    valueText = speedValueMap[condition.value] || condition.value;
  } else if (isSwitchProperty(condition.property)) {
    valueText = condition.value ? "开" : "关";
  }

  const operatorText =
    isSwitchProperty(condition.property) ||
    condition.property === "mode" ||
    condition.property === "speed"
      ? "为"
      : ` ${condition.operator} `;

  return `${deviceLabel} ${propLabel}${operatorText}${valueText}`;
};

// 重置表单
const resetForm = () => {
  form.id = "";
  form.type = "ALL";
  form.conditions = [];
};

// 生成雪花ID
const generateSnowflakeId = () => {
  return `${Date.now()}${Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0")}`;
};

const addCondition = () => {
  form.conditions.push({
    id: generateSnowflakeId(),
    deviceId: "",
    deviceType: "",
    property: "",
    operator: "==",
    value: "",
    desc: "",
    expr: "",
    conditionGroupId: "",
    scheduleTaskId: "",
  });
};

const removeCondition = (index) => {
  form.conditions.splice(index, 1);
};

// 监听弹窗显示状态，处理数据回填
watch(
  () => dialogVisible.value,
  (visible) => {
    if (visible) {
      // 加载设备数据
      loadDevices();
      nextTick(() => {
        if (props.data) {
          // 解析表达式回显
          const parsedConditions = (props.data.conditions || []).map((cond) => {
            // 尝试解析已有表达式
            const parsed = parseExpr(cond.expr);
            console.log(parsed);
            // 先从dataGroup中按id查找，找不到则按deviceId查找
            let dataGroupItem = availableDevices.value.find(
              (d) => d.id === parsed.dataGroupId,
            );
            if (!dataGroupItem && parsed.dataGroupId) {
              // 尝试按deviceId匹配（兼容旧数据或重新生成id的情况）
              dataGroupItem = availableDevices.value.find(
                (d) => String(d.deviceId) === String(parsed.dataGroupId),
              );
            }

            // 如果还是找不到，但有deviceType和deviceId，尝试直接匹配
            if (!dataGroupItem && cond.deviceType && cond.deviceId) {
              dataGroupItem = availableDevices.value.find(
                (d) =>
                  d.deviceType === cond.deviceType &&
                  String(d.deviceId) === String(cond.deviceId),
              );
            }

            return {
              id: cond.id || generateSnowflakeId(),
              deviceId:
                dataGroupItem?.deviceId ||
                cond.deviceId ||
                parsed.dataGroupId ||
                "",
              deviceType: dataGroupItem?.deviceType || cond.deviceType || "",
              property: parsed.property || cond.property || "",
              operator: parsed.operator || cond.operator || "==",
              value: parsed.value !== undefined ? parsed.value : cond.value || "",
              desc: cond.desc || cond.displayText || "",
              expr: cond.expr || "",
              conditionGroupId: cond.conditionGroupId || "",
              scheduleTaskId: cond.scheduleTaskId || "",
            };
          });

          Object.assign(form, {
            id: props.data.id || "",
            type: props.data.type || "ALL",
            conditions: parsedConditions,
          });
        } else {
          resetForm();
        }
      });
    }
  },
);

// 解析表达式
const parseExpr = (expr) => {
  if (!expr) return {};
  // 修复：>= 和 <= 放在 > 和 < 前面
  const match = expr.match(/#\{([^}]+)\}\.(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)/);
  if (match) {
    let value = match[4];
    if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (!isNaN(Number(value))) value = Number(value);

    return {
      dataGroupId: match[1],
      property: match[2],
      operator: match[3],
      value: value,
    };
  }
  return {};
};

// 加载设备数据
const loadDevices = async () => {
  try {
    if (Object.keys(deviceMap.value).length === 0) {
      await deviceStore.fetchDevices();
    }
  } catch (error) {
    console.error("【ConditionGroupDialog】加载设备失败:", error);
  }
};

const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};

const handleSave = () => {
  // 验证条件
  for (let i = 0; i < form.conditions.length; i++) {
    const cond = form.conditions[i];
    if (!cond.deviceId) {
      ElMessage.warning(`条件 ${i + 1} 请选择设备`);
      return;
    }
    if (!cond.property) {
      ElMessage.warning(`条件 ${i + 1} 请选择属性`);
      return;
    }
    if (cond.value === "" || cond.value === undefined || cond.value === null) {
      ElMessage.warning(`条件 ${i + 1} 请设置条件值`);
      return;
    }
    // 生成表达式
    cond.expr = generateExpr(cond);
    // 生成友好显示文本
    cond.displayText = cond.desc || generateDisplayText(cond);
  }

  emit("save", { ...form });
  dialogVisible.value = false;
  resetForm();
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.conditions-list {
  max-height: 500px;
  overflow-y: auto;
}

.condition-row {
  margin-bottom: 12px;
}

.condition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.condition-expr-row {
  display: flex;
  align-items: center;
}

.expr-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expr-label {
  font-size: 12px;
  color: #606266;
}

:deep(.el-card__header) {
  padding: 10px 15px;
  background-color: #f5f7fa;
}

:deep(.el-card__body) {
  padding: 15px;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.el-radio-group) {
  flex-wrap: wrap;
  gap: 8px;
}
</style>
