<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑条件组' : '添加条件组'"
    width="700px"
    :close-on-click-modal="false"
    append-to-body
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
                <el-button type="danger" link size="small" @click="removeCondition(index)">
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </div>
            </template>
            
            <!-- 设备类型选择 -->
            <el-form-item label="设备类型" :required="true">
              <el-select v-model="condition.deviceType" placeholder="请选择设备类型" style="width: 100%">
                <el-option label="空调" value="AirCondition" />
                <el-option label="断路器" value="CircuitBreak" />
                <el-option label="照明" value="Light" />
                <el-option label="传感器" value="Sensor" />
                <el-option label="门禁" value="Access" />
              </el-select>
            </el-form-item>

            <!-- 属性选择 -->
            <el-form-item label="属性" :required="true">
              <el-select v-model="condition.property" placeholder="请选择属性" style="width: 100%">
                <el-option
                  v-for="prop in getPropertiesByDeviceType(condition.deviceType)"
                  :key="prop.value"
                  :label="prop.label"
                  :value="prop.value"
                />
              </el-select>
            </el-form-item>

            <!-- 运算符和值 -->
            <el-form-item label="条件" :required="true">
              <div class="condition-expr-row">
                <el-select v-model="condition.operator" style="width: 100px">
                  <el-option label="=" value="==" />
                  <el-option label="≠" value="!=" />
                  <el-option label="<" value="<" />
                  <el-option label="≤" value="<=" />
                  <el-option label=">" value=">" />
                  <el-option label="≥" value=">=" />
                </el-select>
                <el-input
                  v-model="condition.value"
                  placeholder="请输入值"
                  style="flex: 1; margin-left: 8px"
                />
              </div>
            </el-form-item>

            <!-- 表达式预览 -->
            <el-form-item>
              <div class="expr-preview">
                <span class="expr-label">表达式预览：</span>
                <el-tag type="info" size="small">{{ generateExprPreview(condition) }}</el-tag>
              </div>
            </el-form-item>

            <el-form-item label="描述">
              <el-input
                v-model="condition.desc"
                type="textarea"
                :rows="2"
                placeholder="条件描述（可选）"
              />
            </el-form-item>
          </el-card>
        </div>

        <el-button type="primary" link @click="addCondition" style="margin-top: 10px">
          <el-icon><Plus /></el-icon>添加条件
        </el-button>

        <el-empty v-if="form.conditions.length === 0" description="暂无条件，请添加" :image-size="60" />
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
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Delete } from "@element-plus/icons-vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.data);

const form = reactive({
  id: "",
  type: "ALL",
  conditions: [],
});

// 设备类型对应的属性列表
const deviceTypeProperties = {
  AirCondition: [
    { label: "房间温度", value: "roomTemperature" },
    { label: "设定温度", value: "temperature" },
    { label: "开关状态", value: "isOpen" },
    { label: "模式", value: "mode" },
    { label: "风速", value: "speed" },
  ],
  CircuitBreak: [
    { label: "开关状态", value: "isOpen" },
    { label: "电压", value: "voltage" },
    { label: "电流", value: "current" },
    { label: "功率", value: "power" },
    { label: "漏电流", value: "leakage" },
    { label: "温度", value: "temperature" },
  ],
  Light: [
    { label: "开关状态", value: "isOpen" },
    { label: "锁定状态", value: "isLock" },
  ],
  Sensor: [
    { label: "温度", value: "temperature" },
    { label: "湿度", value: "humidity" },
    { label: "光照", value: "light" },
    { label: "烟雾", value: "smoke" },
  ],
  Access: [
    { label: "门状态", value: "isOpen" },
    { label: "锁状态", value: "lockStatus" },
  ],
};

// 根据设备类型获取属性列表
const getPropertiesByDeviceType = (deviceType) => {
  return deviceTypeProperties[deviceType] || [];
};

// 生成表达式预览
const generateExprPreview = (condition) => {
  if (!condition.property || !condition.operator) {
    return "请选择完整的条件";
  }
  const propLabel = getPropertiesByDeviceType(condition.deviceType).find(
    p => p.value === condition.property
  )?.label || condition.property;
  return `${propLabel} ${condition.operator} ${condition.value || "?"}`;
};

// 生成实际的 SpEL 表达式
const generateExpr = (condition) => {
  // 格式：#{conditionId}.property operator value
  return `#{${condition.id}}.${condition.property} ${condition.operator} ${condition.value}`;
};

// 重置表单
const resetForm = () => {
  form.id = "";
  form.type = "ALL";
  form.conditions = [];
};

// 生成雪花ID
const generateSnowflakeId = () => {
  return `${Date.now()}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
};

const addCondition = () => {
  form.conditions.push({
    id: generateSnowflakeId(),
    deviceType: "",
    property: "",
    operator: "<=",
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

// 监听数据变化
watch(() => props.data, (newVal) => {
  if (newVal) {
    // 解析表达式回显
    const parsedConditions = (newVal.conditions || []).map(cond => {
      // 尝试解析已有表达式
      const parsed = parseExpr(cond.expr);
      return {
        id: cond.id || generateSnowflakeId(),
        deviceType: parsed.deviceType || cond.deviceType || "",
        property: parsed.property || "",
        operator: parsed.operator || "<=",
        value: parsed.value || "",
        desc: cond.desc || "",
        expr: cond.expr || "",
        conditionGroupId: cond.conditionGroupId || "",
        scheduleTaskId: cond.scheduleTaskId || "",
      };
    });
    
    Object.assign(form, {
      id: newVal.id || "",
      type: newVal.type || "ALL",
      conditions: parsedConditions,
    });
  } else {
    resetForm();
  }
}, { immediate: true });

// 解析表达式
const parseExpr = (expr) => {
  if (!expr) return {};
  // 匹配格式：#{id}.property operator value
  const match = expr.match(/#\{([^}]+)\}\.(\s+)\s*(==|!=|<|<=|>|>=)\s*(.+)/);
  if (match) {
    return {
      conditionId: match[1],
      property: match[2],
      operator: match[3],
      value: match[4],
    };
  }
  return {};
};

const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};

// 设备类型中文映射
const deviceTypeNameMap = {
  AirCondition: "空调",
  CircuitBreak: "断路器",
  Light: "照明",
  Sensor: "传感器",
  Access: "门禁",
};

// 获取属性标签
const getPropertyLabel = (deviceType, property) => {
  const props = deviceTypeProperties[deviceType] || [];
  const found = props.find(p => p.value === property);
  return found ? found.label : property;
};

// 生成友好显示文本
const generateDisplayText = (condition) => {
  const typeName = deviceTypeNameMap[condition.deviceType] || condition.deviceType;
  const propLabel = getPropertyLabel(condition.deviceType, condition.property);
  return `${typeName}${propLabel} ${condition.operator} ${condition.value}`;
};

const handleSave = () => {
  // 验证条件
  for (let i = 0; i < form.conditions.length; i++) {
    const cond = form.conditions[i];
    if (!cond.deviceType) {
      ElMessage.warning(`条件 ${i + 1} 请选择设备类型`);
      return;
    }
    if (!cond.property) {
      ElMessage.warning(`条件 ${i + 1} 请选择属性`);
      return;
    }
    if (!cond.value && cond.value !== "0") {
      ElMessage.warning(`条件 ${i + 1} 请输入值`);
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
</style>
