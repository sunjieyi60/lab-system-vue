<template>
  <div class="device-control-panel">
    <!-- 标题栏 -->
    <div v-if="showHeader" class="panel-header">
      <h3 class="panel-title">
        <span class="title-icon">🎛️</span>
        {{ title }}
      </h3>
      <div v-if="subtitle" class="panel-subtitle">{{ subtitle }}</div>
    </div>

    <!-- 设备类型选择器 -->
    <div v-if="showTypeSelector" class="panel-section">
      <DeviceTypeSelector
        v-model="selectedType"
        :label="typeSelectorLabel"
        :direction="typeSelectorDirection"
        :options="typeSelectorOptions"
        :filter="typeFilter"
        :disabled="loading"
        @change="handleTypeChange"
      />
    </div>

    <!-- 设备选择器 -->
    <div v-if="showDeviceSelector && selectedType" class="panel-section">
      <label class="section-label">{{ deviceSelectorLabel }}</label>
      <div class="device-selector">
        <select
          v-model="selectedDevice"
          class="device-select"
          :disabled="loading || availableDevices.length === 0"
        >
          <option value="">{{ deviceSelectorPlaceholder }}</option>
          <option
            v-for="device in availableDevices"
            :key="device.id"
            :value="device"
          >
            {{ device.deviceName }} (ID: {{ device.id }})
          </option>
        </select>
        <span v-if="availableDevices.length === 0" class="no-device-hint">
          {{ noDeviceHint }}
        </span>
      </div>
    </div>

    <!-- 控制组件区域 -->
    <div v-if="selectedDevice" class="panel-section control-area">
      <component
        :is="currentControlComponent"
        :device="selectedDevice"
        :priority="priority"
        v-bind="currentControlConfig"
        @execute="handleExecute"
      />
    </div>

    <!-- 空状态 -->
    <div v-else-if="showEmptyState" class="empty-state">
      <div class="empty-icon">📱</div>
      <div class="empty-title">{{ emptyStateTitle }}</div>
      <div class="empty-desc">{{ emptyStateDesc }}</div>
    </div>

    <!-- 日志面板 -->
    <div v-if="showLog && commandLogs.length > 0" class="panel-section log-section">
      <div class="log-header">
        <span class="log-title">{{ logTitle }}</span>
        <button class="clear-btn" @click="clearLogs">{{ clearLogText }}</button>
      </div>
      <div class="log-list">
        <div
          v-for="(log, index) in commandLogs"
          :key="index"
          class="log-item"
          :class="log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-content">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, watch } from 'vue';
import type { Component } from 'vue';
import DeviceTypeSelector from './DeviceTypeSelector.vue';
import type { DeviceTypeOption } from './DeviceTypeSelector.vue';
import AirConditionControl from './controls/AirConditionControl.vue';
import AccessControl from './controls/AccessControl.vue';
import LightControl from './controls/LightControl.vue';
import CircuitBreakControl from './controls/CircuitBreakControl.vue';
import SensorControl from './controls/SensorControl.vue';
import type {
  DeviceType,
  DeviceUnion,
  Task,
  Priority,
} from '../types/device';

// 控制组件映射
const controlComponentMap: Record<DeviceType, Component> = {
  AirCondition: markRaw(AirConditionControl),
  Access: markRaw(AccessControl),
  Light: markRaw(LightControl),
  CircuitBreak: markRaw(CircuitBreakControl),
  Sensor: markRaw(SensorControl),
};

// 指令日志
interface CommandLog {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

// ==================== Props 定义 ====================
const props = withDefaults(defineProps<{
  // ========== 标题配置 ==========
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  
  // ========== 全局优先级配置 ==========
  priority?: Priority;
  
  // ========== 设备类型选择器配置 ==========
  showTypeSelector?: boolean;
  typeSelectorLabel?: string;
  typeSelectorDirection?: 'horizontal' | 'vertical';
  typeSelectorOptions?: DeviceTypeOption[];
  typeFilter?: DeviceType[];
  defaultType?: DeviceType;
  
  // ========== 设备选择器配置 ==========
  showDeviceSelector?: boolean;
  deviceSelectorLabel?: string;
  deviceSelectorPlaceholder?: string;
  noDeviceHint?: string;
  devices?: DeviceUnion[];
  defaultDevice?: DeviceUnion;
  
  // ========== 状态配置 ==========
  loading?: boolean;
  showEmptyState?: boolean;
  emptyStateTitle?: string;
  emptyStateDesc?: string;
  
  // ========== 日志配置 ==========
  showLog?: boolean;
  logTitle?: string;
  clearLogText?: string;
  
  // ========== 控制组件配置 ==========
  acConfig?: Record<string, any>;
  accessConfig?: Record<string, any>;
  lightConfig?: Record<string, any>;
  circuitConfig?: Record<string, any>;
  sensorConfig?: Record<string, any>;
  
  // ========== v-model ==========
  modelValue?: {
    type: DeviceType;
    device: DeviceUnion;
  } | null;
}>(), {
  title: '设备控制面板',
  priority: 'NORMAL',
  showHeader: true,
  showTypeSelector: true,
  typeSelectorLabel: '选择设备类型',
  typeSelectorDirection: 'horizontal',
  typeSelectorOptions: undefined,
  typeFilter: () => [],
  defaultType: undefined,
  showDeviceSelector: true,
  deviceSelectorLabel: '选择设备',
  deviceSelectorPlaceholder: '请选择设备',
  noDeviceHint: '暂无可用设备',
  devices: () => [],
  defaultDevice: undefined,
  loading: false,
  showEmptyState: true,
  emptyStateTitle: '请选择设备',
  emptyStateDesc: '选择设备类型和设备后即可进行控制操作',
  showLog: true,
  logTitle: '操作日志',
  clearLogText: '清空',
  acConfig: () => ({}),
  accessConfig: () => ({}),
  lightConfig: () => ({}),
  circuitConfig: () => ({}),
  sensorConfig: () => ({}),
  modelValue: undefined,
});

const emit = defineEmits<{
  /**
   * 执行控制指令
   * @param tasks 任务列表
   * @param device 当前设备
   * @param callback 执行结果回调
   */
  execute: [tasks: Task[], device: DeviceUnion, callback: (success: boolean, message?: string) => void];
  typeChange: [type: DeviceType];
  deviceChange: [device: DeviceUnion];
  'update:modelValue': [value: { type: DeviceType; device: DeviceUnion } | null];
}>();

// 内部状态
const selectedType = ref<DeviceType | ''>(props.defaultType || '');
const selectedDevice = ref<DeviceUnion | null>(props.defaultDevice || null);
const commandLogs = ref<CommandLog[]>([]);

// 计算当前控制组件
const currentControlComponent = computed(() => {
  if (!selectedType.value) return null;
  return controlComponentMap[selectedType.value];
});

// 计算当前控制组件配置
const currentControlConfig = computed(() => {
  if (!selectedType.value) return {};
  switch (selectedType.value) {
    case 'AirCondition':
      return props.acConfig;
    case 'Access':
      return props.accessConfig;
    case 'Light':
      return props.lightConfig;
    case 'CircuitBreak':
      return props.circuitConfig;
    case 'Sensor':
      return props.sensorConfig;
    default:
      return {};
  }
});

// 计算可用设备列表
const availableDevices = computed(() => {
  if (!selectedType.value) return [];
  return props.devices.filter(d => d.deviceType === selectedType.value);
});

// 监听 modelValue 变化（受控模式）
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    selectedType.value = newVal.type;
    selectedDevice.value = newVal.device;
  }
}, { immediate: true });

// 监听 selectedType 变化
watch(selectedType, (newType) => {
  if (newType) {
    emit('typeChange', newType);
    if (selectedDevice.value && selectedDevice.value.deviceType !== newType) {
      selectedDevice.value = null;
    }
  }
});

// 监听 selectedDevice 变化
watch(selectedDevice, (newDevice) => {
  if (newDevice) {
    emit('deviceChange', newDevice);
    emit('update:modelValue', {
      type: newDevice.deviceType,
      device: newDevice,
    });
  } else {
    emit('update:modelValue', null);
  }
});

// 处理类型变化
const handleTypeChange = (type: DeviceType) => {
  selectedType.value = type;
  const devicesOfType = props.devices.filter(d => d.deviceType === type);
  if (devicesOfType.length > 0 && !selectedDevice.value) {
    selectedDevice.value = devicesOfType[0];
  }
};

// 处理指令执行
const handleExecute = (tasks: Task[], callback?: (success: boolean, message?: string) => void) => {
  if (!selectedDevice.value || tasks.length === 0) return;

  // 记录日志
  tasks.forEach(t => {
    const log: CommandLog = {
      time: new Date().toLocaleTimeString(),
      message: `[${selectedDevice.value!.deviceName}] ${t.commandLine} - ${JSON.stringify(t.args)}`,
      type: 'info',
    };
    commandLogs.value.unshift(log);
  });

  if (commandLogs.value.length > 20) {
    commandLogs.value = commandLogs.value.slice(0, 20);
  }

  // 传递给父组件
  emit('execute', tasks, selectedDevice.value, (success, message) => {
    // 更新日志状态
    tasks.forEach((_, index) => {
      if (commandLogs.value[index]) {
        commandLogs.value[index].type = success ? 'success' : 'error';
        if (message) {
          commandLogs.value[index].message += ` - ${message}`;
        }
      }
    });
    callback?.(success, message);
  });
};

// 清空日志
const clearLogs = () => {
  commandLogs.value = [];
};

// 暴露方法
defineExpose({
  getSelectedDevice: () => selectedDevice.value,
  getSelectedType: () => selectedType.value,
  setDevice: (device: DeviceUnion) => {
    selectedType.value = device.deviceType;
    selectedDevice.value = device;
  },
  clear: () => {
    selectedType.value = '';
    selectedDevice.value = null;
  },
  getLogs: () => [...commandLogs.value],
  clearLogs,
});
</script>

<style scoped>
.device-control-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
  background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%);
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 22px;
}

.panel-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #666;
}

.panel-section {
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
}

.panel-section:last-child {
  border-bottom: none;
}

.section-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.device-selector {
  position: relative;
}

.device-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.device-select:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.device-select:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.no-device-hint {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.control-area {
  background: #fafafa;
  min-height: 300px;
}

.empty-state {
  padding: 60px 24px;
  text-align: center;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 13px;
}

.log-section {
  background: #fafafa;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.log-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.clear-btn {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.log-list {
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 8px 0;
}

.log-item {
  padding: 8px 16px;
  font-size: 12px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #999;
  flex-shrink: 0;
  font-family: monospace;
}

.log-content {
  flex: 1;
  word-break: break-all;
}

.log-item.success .log-content {
  color: #52c41a;
}

.log-item.error .log-content {
  color: #ff4d4f;
}

.log-item.info .log-content {
  color: #333;
}
</style>
