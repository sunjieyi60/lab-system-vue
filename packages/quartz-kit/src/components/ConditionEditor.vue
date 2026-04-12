<template>
  <div class="condition-editor">
    <el-row :gutter="10" align="middle">
      <!-- 数据源选择 -->
      <el-col :span="6">
        <el-select
          v-model="rule.dataSourceId"
          placeholder="选择数据源"
          @change="onDataSourceChange"
        >
          <el-option
            v-for="ds in dataSources"
            :key="ds.id"
            :label="getDeviceName(ds.deviceId)"
            :value="ds.id"
            style="padding: 2px 5px;"
          >
            <div class="datasource-option-content">
              <span>{{ getDeviceName(ds.deviceId) }}</span>
              <el-tag size="small" type="info">
                {{ ds.deviceType }}
              </el-tag>
            </div>
          </el-option>
        </el-select>
      </el-col>

      <!-- 属性选择 -->
      <el-col :span="5">
        <el-select
          v-model="rule.property"
          placeholder="选择属性"
          :disabled="!availableProperties.length"
          @change="onPropertyChange"
        >
          <el-option
            v-for="prop in availableProperties"
            :key="prop.name"
            :label="prop.label"
            :value="prop.name"
          >
            <span>{{ prop.label }}</span>
            <span class="property-meta">
              {{ prop.javaType }}
              <template v-if="prop.unit">({{ prop.unit }})</template>
            </span>
          </el-option>
        </el-select>
      </el-col>

      <!-- 操作符选择 -->
      <el-col :span="4">
        <el-select
          v-model="rule.operator"
          placeholder="操作符"
          :disabled="!selectedProperty"
        >
          <el-option
            v-for="op in availableOperators"
            :key="op.value"
            :label="op.label"
            :value="op.value"
          />
        </el-select>
      </el-col>

      <!-- 值输入（根据类型动态渲染） -->
      <el-col :span="7">
        <!-- 布尔值：使用开关或按钮组 -->
        <template v-if="selectedProperty?.javaType === 'Boolean'">
          <el-radio-group v-model="rule.value">
            <el-radio-button
              v-for="item in selectedProperty.enumValues || booleanOptions"
              :key="String(item.value)"
              :label="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </template>

        <!-- 枚举字符串：使用下拉选择 -->
        <template v-else-if="selectedProperty?.enumValues?.length">
          <el-select v-model="rule.value" placeholder="选择值" style="width: 100%">
            <el-option
              v-for="item in selectedProperty.enumValues"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>

        <!-- 数值类型：使用数字输入框或滑块 -->
        <template v-else-if="isNumberType(selectedProperty?.javaType)">
          <template v-if="selectedProperty?.min !== undefined && selectedProperty?.max !== undefined">
            <el-slider
              v-model="rule.value"
              :min="selectedProperty.min"
              :max="selectedProperty.max"
              show-input
            />
          </template>
          <template v-else>
            <el-input-number
              v-model="rule.value"
              style="width: 100%"
              :placeholder="`输入${selectedProperty?.unit || '数值'}`"
            />
          </template>
        </template>

        <!-- 其他字符串：文本输入 -->
        <template v-else>
          <el-input
            v-model="rule.value"
            placeholder="输入值"
          />
        </template>
      </el-col>

      <!-- 删除按钮 -->
      <el-col :span="2" style="text-align: center">
        <slot name="actions" />
      </el-col>
    </el-row>

    <!-- 表达式预览 -->
    <div class="expr-preview">
      <el-tag type="info" size="small">SpEL预览</el-tag>
      <code>{{ generatedExpression || '请选择完整条件' }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { DataSource, Device } from '../types/quartz'
import {
  getPropertiesByDeviceType,
  getPropertyByName,
  getSupportedOperators,
  buildSpELExpression,
  parseSpELExpression,
  type ConditionRule,
} from '../types/deviceProperties'

const props = defineProps<{
  dataSources: DataSource[]
  devices: Device[]
  modelValue: string  // SpEL 表达式
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [rule: ConditionRule]
}>()

// ============================================
// 本地状态
// ============================================
const rule = reactive<ConditionRule>({
  dataSourceId: '',
  property: '',
  operator: '==',
  value: '',
})

const booleanOptions = [
  { value: true, label: '是' },
  { value: false, label: '否' },
]

// ============================================
// 计算属性
// ============================================
const selectedDataSource = computed(() => {
  return props.dataSources.find(ds => ds.id === rule.dataSourceId)
})

const selectedDeviceType = computed(() => {
  return selectedDataSource.value?.deviceType
})

const availableProperties = computed(() => {
  const deviceType = selectedDeviceType.value
  if (!deviceType) return []
  return getPropertiesByDeviceType(deviceType)
})

const selectedProperty = computed(() => {
  const deviceType = selectedDeviceType.value
  if (!deviceType || !rule.property) return undefined
  return getPropertyByName(deviceType, rule.property)
})

const availableOperators = computed(() => {
  const property = selectedProperty.value
  if (!property) return []
  return getSupportedOperators(property.javaType)
})

const generatedExpression = computed(() => {
  if (!rule.dataSourceId || !rule.property || !rule.operator) return ''
  return buildSpELExpression(rule)
})

// ============================================
// 方法
// ============================================
function getDeviceName(deviceId: number): string {
  const device = props.devices.find(d => d.id === deviceId)
  return device?.name || `设备${deviceId}`
}

function isNumberType(javaType?: string): boolean {
  return ['Integer', 'Long', 'Double', 'Float'].includes(javaType || '')
}

function onDataSourceChange() {
  // 切换数据源时，清空属性和值
  rule.property = ''
  rule.operator = '=='
  rule.value = ''
}

function onPropertyChange() {
  const property = selectedProperty.value
  if (!property) return

  // 重置操作符和值
  const operators = getSupportedOperators(property.javaType)
  rule.operator = operators[0]?.value || '=='

  // 根据属性类型设置默认值
  if (property.javaType === 'Boolean') {
    rule.value = true
  } else if (property.enumValues?.length) {
    rule.value = property.enumValues[0].value
  } else if (isNumberType(property.javaType)) {
    rule.value = property.min ?? 0
  } else {
    rule.value = ''
  }
}

// ============================================
// 初始化：解析已有表达式
// ============================================
function initFromExpression(expr: string) {
  if (!expr) {
    rule.dataSourceId = ''
    rule.property = ''
    rule.operator = '=='
    rule.value = ''
    return
  }

  const parsed = parseSpELExpression(expr)
  if (parsed) {
    rule.dataSourceId = parsed.dataSourceId
    // 等待下一个 tick 让属性列表更新
    setTimeout(() => {
      rule.property = parsed.property
      rule.operator = parsed.operator
      rule.value = parsed.value
    }, 0)
  }
}

// ============================================
// 监听
// ============================================
watch(() => props.modelValue, initFromExpression, { immediate: true })

watch(rule, () => {
  if (generatedExpression.value) {
    emit('update:modelValue', generatedExpression.value)
    emit('change', { ...rule })
  }
}, { deep: true })
</script>

<style scoped>

.datasource-option-content {
  display: flex; 
  justify-content: space-between; 
  align-items: center;
}

.condition-editor {
  padding: 12px;
  background-color: var(--el-bg-color);
  border-radius: 6px;
}

.property-meta {
  float: right;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.expr-preview {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.expr-preview code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  color: var(--el-color-primary);
  background-color: var(--el-fill-color);
  padding: 2px 8px;
  border-radius: 3px;
}

:deep(.el-slider) {
  margin-right: 16px;
}

:deep(.el-slider__runway.show-input) {
  margin-right: 10px;
}
</style>
