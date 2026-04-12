<template>
  <div class="device-type-selector">
    <label v-if="label" class="selector-label">{{ label }}</label>
    <div class="selector-options" :class="{ vertical: direction === 'vertical' }">
      <button
        v-for="type in deviceTypes"
        :key="type.value"
        class="type-option"
        :class="{ 
          active: modelValue === type.value,
          disabled: disabled || (type.disabled ?? false)
        }"
        :disabled="disabled || (type.disabled ?? false)"
        @click="selectType(type.value)"
      >
        <span class="type-icon">{{ type.icon }}</span>
        <span class="type-label">{{ type.label }}</span>
        <span v-if="type.count !== undefined" class="type-count">{{ type.count }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DeviceType } from '../types/device';
import { DEVICE_TYPE_LABELS, DEVICE_TYPE_ICONS } from '../types/device';

export interface DeviceTypeOption {
  value: DeviceType;
  label: string;
  icon: string;
  count?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<{
  modelValue: DeviceType | '';
  label?: string;
  disabled?: boolean;
  direction?: 'horizontal' | 'vertical';
  options?: DeviceTypeOption[];
  filter?: DeviceType[];
}>(), {
  label: '选择设备类型',
  disabled: false,
  direction: 'horizontal',
  options: undefined,
  filter: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: DeviceType];
  change: [value: DeviceType];
}>();

// 所有设备类型
const allDeviceTypes: DeviceType[] = ['AirCondition', 'Access', 'Light', 'CircuitBreak', 'Sensor'];

// 计算可用的设备类型选项
const deviceTypes = computed<DeviceTypeOption[]>(() => {
  // 如果提供了自定义选项，使用自定义选项
  if (props.options) {
    return props.options;
  }

  // 否则根据 filter 生成选项
  const typesToShow = props.filter.length > 0 ? props.filter : allDeviceTypes;
  
  return typesToShow.map(type => ({
    value: type,
    label: DEVICE_TYPE_LABELS[type],
    icon: DEVICE_TYPE_ICONS[type],
  }));
});

// 选择类型
const selectType = (type: DeviceType) => {
  if (props.disabled) return;
  emit('update:modelValue', type);
  emit('change', type);
};
</script>

<style scoped>
.device-type-selector {
  margin-bottom: 16px;
}

.selector-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.selector-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.selector-options.vertical {
  flex-direction: column;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.type-option:hover:not(.disabled) {
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
}

.type-option.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.type-option.active:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.type-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.type-icon {
  font-size: 20px;
}

.type-label {
  font-weight: 500;
}

.type-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.type-option.active .type-count {
  background: rgba(255, 255, 255, 0.3);
}

/* 垂直布局样式 */
.selector-options.vertical .type-option {
  justify-content: flex-start;
  padding: 16px 20px;
}

.selector-options.vertical .type-count {
  margin-left: auto;
}
</style>
