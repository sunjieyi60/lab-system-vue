<template>
  <div class="ac-control">
    <!-- 快速开关 -->
    <div v-if="showQuickActions" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">
        快速开关{{ isBatchMode ? `（${deviceCount}台设备）` : '' }}
      </h4>
      <div class="quick-actions">
        <button 
          v-if="showPowerOn"
          class="btn btn-primary"
          :disabled="loading"
          @click="handlePowerOn"
        >
          <span v-if="loading && activeCommand === 'powerOn'" class="spinner"></span>
          <span v-else>⚡</span>
          {{ powerOnText }}
        </button>
        <button 
          v-if="showPowerOff"
          class="btn btn-danger"
          :disabled="loading"
          @click="handlePowerOff"
        >
          <span v-if="loading && activeCommand === 'powerOff'" class="spinner"></span>
          <span v-else>&#9899;</span>
          {{ powerOffText }}
        </button>
        <button 
          v-if="showQueryStatus"
          class="btn btn-info"
          :disabled="loading"
          @click="handleQueryStatus"
        >
          <span v-if="loading && activeCommand === 'queryStatus'" class="spinner"></span>
          <span v-else>📊</span>
          {{ queryStatusText }}
        </button>
      </div>
    </div>

    <!-- 增强控制面板 -->
    <div v-if="showEnhancedControl" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">
        {{ enhancedControlTitle }}{{ isBatchMode ? `（${deviceCount}台设备）` : '' }}
      </h4>
      <div class="enhanced-control">
        <!-- 开关 -->
        <div v-if="showPowerSwitch" class="form-row">
          <label class="form-label">{{ powerSwitchLabel }}</label>
          <div class="radio-group">
            <label 
              v-for="(label, value) in AC_SWITCH_MAP" 
              :key="value"
              class="radio-label"
              :class="{ active: enhancedForm.switch === Number(value) }"
            >
              <input 
                v-model="enhancedForm.switch" 
                type="radio" 
                :value="Number(value)"
              >
              {{ label }}
            </label>
          </div>
        </div>

        <!-- 模式选择 -->
        <div v-if="showMode" class="form-row">
          <label class="form-label">{{ modeLabel }}</label>
          <div class="radio-group">
            <label 
              v-for="(label, value) in AC_MODE_MAP" 
              :key="value"
              class="radio-label"
              :class="{ active: enhancedForm.mode === Number(value) }"
            >
              <input 
                v-model="enhancedForm.mode" 
                type="radio" 
                :value="Number(value)"
              >
              {{ label }}
            </label>
          </div>
        </div>

        <!-- 温度调节 -->
        <div v-if="showTemperature" class="form-row">
          <label class="form-label">
            {{ temperatureLabel }}
            <span class="temp-display">{{ enhancedForm.temperature }}°C</span>
          </label>
          <div class="slider-container">
            <input 
              :value="enhancedForm.temperature"
              type="range"
              :min="tempMin"
              :max="tempMax"
              :step="tempStep"
              class="slider"
              @input="enhancedForm.temperature = Number(($event.target as HTMLInputElement).value)"
            >
            <div class="slider-marks">
              <span v-for="temp in tempRange" :key="temp" class="mark" :class="{ active: temp === enhancedForm.temperature }">
                {{ temp % 2 === 0 ? temp : '' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 风速选择 -->
        <div v-if="showSpeed" class="form-row">
          <label class="form-label">{{ speedLabel }}</label>
          <div class="radio-group">
            <label 
              v-for="(label, value) in AC_SPEED_MAP" 
              :key="value"
              class="radio-label"
              :class="{ active: enhancedForm.speed === Number(value) }"
            >
              <input 
                v-model="enhancedForm.speed" 
                type="radio" 
                :value="Number(value)"
              >
              {{ label }}
            </label>
          </div>
        </div>

        <!-- 应用按钮 -->
        <button 
          v-if="showApplyButton"
          class="btn btn-primary btn-full"
          :disabled="loading"
          @click="handleEnhancedControl"
        >
          <span v-if="loading && activeCommand === 'enhanced'" class="spinner"></span>
          {{ applyButtonText }}{{ isBatchMode ? `（${deviceCount}台设备）` : '' }}
        </button>
      </div>
    </div>

    <!-- 设备信息（单设备模式时显示） -->
    <div v-if="showDeviceInfo && !isBatchMode" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">{{ deviceInfoTitle }}</h4>
      <div class="device-info">
        <div v-if="showInfoId" class="info-item">
          <span class="info-label">设备ID:</span>
          <span class="info-value">{{ deviceList[0]?.id }}</span>
        </div>
        <div v-if="showInfoName" class="info-item">
          <span class="info-label">设备名称:</span>
          <span class="info-value">{{ deviceList[0]?.deviceName }}</span>
        </div>
        <div v-if="showInfoAddress" class="info-item">
          <span class="info-label">地址:</span>
          <span class="info-value">{{ deviceList[0]?.address }}</span>
        </div>
        <div v-if="showInfoSelfId" class="info-item">
          <span class="info-label">子ID:</span>
          <span class="info-value">{{ deviceList[0]?.selfId }}</span>
        </div>
        <div v-if="showInfoGroupId" class="info-item">
          <span class="info-label">机组ID:</span>
          <span class="info-value">{{ deviceList[0]?.groupId }}</span>
        </div>
        <div v-if="showInfoGateway" class="info-item">
          <span class="info-label">RS485网关:</span>
          <span class="info-value">{{ deviceList[0]?.rs485GatewayId }}</span>
        </div>
        <div v-if="showInfoSocketGateway && deviceList[0]?.socketGatewayId" class="info-item">
          <span class="info-label">Socket网关:</span>
          <span class="info-value">{{ deviceList[0]?.socketGatewayId }}</span>
        </div>
      </div>
    </div>

    <!-- 批量设备信息汇总（批量模式时显示） -->
    <div v-if="showDeviceInfo && isBatchMode" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">设备信息汇总</h4>
      <div class="device-info-summary">
        <div class="info-item">
          <span class="info-label">设备数量:</span>
          <span class="info-value">{{ deviceCount }} 台</span>
        </div>
        <div v-if="showInfoAddress" class="info-item">
          <span class="info-label">地址范围:</span>
          <span class="info-value">{{ addressRange }}</span>
        </div>
        <div v-if="showInfoGateway" class="info-item">
          <span class="info-label">RS485网关:</span>
          <span class="info-value">{{ gatewayInfo }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import type { AirCondition, Task, Priority } from '../../types/device';
import {
  AC_COMMANDS,
  AC_SWITCH_MAP,
  AC_MODE_MAP,
  AC_SPEED_MAP,
  type ACEnhancedForm,
} from '../../types/device';

// ==================== Props 定义 ====================
const props = withDefaults(defineProps<{
  // 设备数据（支持单设备或设备数组）
  device: AirCondition | AirCondition[];
  
  // 任务优先级
  priority?: Priority;
  
  // ========== 模块显示控制 ==========
  showLockWarning?: boolean;
  showQuickActions?: boolean;
  showPowerOn?: boolean;
  showPowerOff?: boolean;
  showQueryStatus?: boolean;
  showEnhancedControl?: boolean;
  showPowerSwitch?: boolean;
  showMode?: boolean;
  showTemperature?: boolean;
  showSpeed?: boolean;
  showApplyButton?: boolean;
  showDeviceInfo?: boolean;
  showInfoId?: boolean;
  showInfoName?: boolean;
  showInfoAddress?: boolean;
  showInfoSelfId?: boolean;
  showInfoGroupId?: boolean;
  showInfoGateway?: boolean;
  showInfoSocketGateway?: boolean;
  
  // ========== 标题配置 ==========
  showSectionTitles?: boolean;
  enhancedControlTitle?: string;
  deviceInfoTitle?: string;
  
  // ========== 文本配置 ==========
  powerOnText?: string;
  powerOffText?: string;
  queryStatusText?: string;
  applyButtonText?: string;
  powerSwitchLabel?: string;
  modeLabel?: string;
  temperatureLabel?: string;
  speedLabel?: string;
  
  // ========== 温度范围配置 ==========
  tempMin?: number;
  tempMax?: number;
  tempStep?: number;
}>(), {
  // 默认优先级
  priority: 'NORMAL',
  
  // 默认全部显示
  showLockWarning: false,
  showQuickActions: true,
  showPowerOn: true,
  showPowerOff: true,
  showQueryStatus: true,
  showEnhancedControl: true,
  showPowerSwitch: true,
  showMode: true,
  showTemperature: true,
  showSpeed: true,
  showApplyButton: true,
  showDeviceInfo: true,
  showInfoId: true,
  showInfoName: true,
  showInfoAddress: true,
  showInfoSelfId: true,
  showInfoGroupId: true,
  showInfoGateway: true,
  showInfoSocketGateway: true,
  showSectionTitles: true,
  enhancedControlTitle: '增强控制',
  deviceInfoTitle: '设备信息',
  powerOnText: '开机',
  powerOffText: '关机',
  queryStatusText: '查询状态',
  applyButtonText: '应用设置',
  powerSwitchLabel: '开关',
  modeLabel: '模式',
  temperatureLabel: '温度',
  speedLabel: '风速',
  tempMin: 16,
  tempMax: 30,
  tempStep: 1,
});

const emit = defineEmits<{
  /**
   * 执行控制指令
   * @param tasks 任务列表（支持批量控制）
   * @param callback 执行结果回调
   */
  execute: [tasks: Task[], callback?: (success: boolean, message?: string) => void];
}>();

const loading = ref(false);
const activeCommand = ref<string>('');

const enhancedForm = reactive<ACEnhancedForm>({
  switch: 1,
  mode: 2,
  temperature: 24,
  speed: 0,
});

// ==================== 计算属性 ====================

// 判断是否为批量模式
const isBatchMode = computed(() => {
  return Array.isArray(props.device);
});

// 获取设备列表
const deviceList = computed((): AirCondition[] => {
  if (Array.isArray(props.device)) {
    return props.device;
  }
  return [props.device];
});

// 设备数量
const deviceCount = computed(() => deviceList.value.length);

// 计算温度范围
const tempRange = computed(() => {
  const range: number[] = [];
  for (let i = props.tempMin; i <= props.tempMax; i += props.tempStep) {
    range.push(i);
  }
  return range;
});

// 计算地址范围
const addressRange = computed(() => {
  if (deviceList.value.length === 0) return '-';
  const addresses = deviceList.value.map(d => d.address).filter(Boolean);
  if (addresses.length === 0) return '-';
  const min = Math.min(...addresses);
  const max = Math.max(...addresses);
  return min === max ? `${min}` : `${min}-${max}`;
});

// 网关信息
const gatewayInfo = computed(() => {
  const gateways = [...new Set(deviceList.value.map(d => d.rs485GatewayId).filter(Boolean))];
  if (gateways.length === 0) return '-';
  if (gateways.length === 1) return `${gateways[0]}`;
  return `${gateways[0]} 等 ${gateways.length} 个`;
});

// ==================== 方法 ====================

// 生成基础 Task 对象
const createBaseTask = (device: AirCondition): Omit<Task, 'commandLine' | 'args'> => ({
  priority: props.priority,
  deviceType: 'AirCondition',
  deviceId: device.id,
});

// ========== 快速控制 ==========

// 开机
const handlePowerOn = () => {
  const tasks: Task[] = deviceList.value.map(device => ({
    ...createBaseTask(device),
    commandLine: AC_COMMANDS.OPEN,
    args: [device.address, device.selfId],
  }));
  
  emitExecute(tasks, 'powerOn');
};

// 关机
const handlePowerOff = () => {
  const tasks: Task[] = deviceList.value.map(device => ({
    ...createBaseTask(device),
    commandLine: AC_COMMANDS.CLOSE,
    args: [device.address, device.selfId],
  }));
  
  emitExecute(tasks, 'powerOff');
};

// 查询状态
const handleQueryStatus = () => {
  const tasks: Task[] = deviceList.value.map(device => ({
    ...createBaseTask(device),
    commandLine: AC_COMMANDS.REQUEST_DATA,
    args: [device.address, device.selfId],
  }));
  
  emitExecute(tasks, 'queryStatus');
};

// 增强控制
const handleEnhancedControl = () => {
  const tasks: Task[] = deviceList.value.map(device => ({
    ...createBaseTask(device),
    commandLine: AC_COMMANDS.ENHANCE_CONTROL,
    args: [
      device.address,
      device.selfId,
      enhancedForm.switch,
      enhancedForm.mode,
      enhancedForm.temperature,
      enhancedForm.speed,
    ],
  }));
  
  emitExecute(tasks, 'enhanced');
};

// 通用执行函数
const emitExecute = (tasks: Task[], commandKey: string) => {
  loading.value = true;
  activeCommand.value = commandKey;
  
  emit('execute', tasks, () => {
    loading.value = false;
    activeCommand.value = '';
  });
};

// 暴露方法
defineExpose({
  // 刷新状态
  refreshStatus: () => {
    const tasks: Task[] = deviceList.value.map(device => ({
      ...createBaseTask(device),
      commandLine: AC_COMMANDS.REQUEST_DATA,
      args: [device.address, device.selfId],
    }));
    emitExecute(tasks, 'queryStatus');
  },
  // 获取当前表单数据
  getFormData: () => ({ ...enhancedForm }),
  // 设置表单数据
  setFormData: (data: Partial<ACEnhancedForm>) => {
    Object.assign(enhancedForm, data);
  },
  // 生成控制 Task（供外部调用）
  generateTasks: (command: 'powerOn' | 'powerOff' | 'queryStatus' | 'enhanced'): Task[] => {
    switch (command) {
      case 'powerOn':
        return deviceList.value.map(device => ({
          ...createBaseTask(device),
          commandLine: AC_COMMANDS.OPEN,
          args: [device.address, device.selfId],
        }));
      case 'powerOff':
        return deviceList.value.map(device => ({
          ...createBaseTask(device),
          commandLine: AC_COMMANDS.CLOSE,
          args: [device.address, device.selfId],
        }));
      case 'queryStatus':
        return deviceList.value.map(device => ({
          ...createBaseTask(device),
          commandLine: AC_COMMANDS.REQUEST_DATA,
          args: [device.address, device.selfId],
        }));
      case 'enhanced':
        return deviceList.value.map(device => ({
          ...createBaseTask(device),
          commandLine: AC_COMMANDS.ENHANCE_CONTROL,
          args: [
            device.address,
            device.selfId,
            enhancedForm.switch,
            enhancedForm.mode,
            enhancedForm.temperature,
            enhancedForm.speed,
          ],
        }));
      default:
        return [];
    }
  },
  // 获取设备列表
  getDevices: () => deviceList.value,
  // 判断是否为批量模式
  isBatch: () => isBatchMode.value,
});
</script>

<style scoped>
.ac-control {
  padding: 16px;
}

.control-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}

.quick-actions {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 12px;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 2rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #ff7875;
}

.btn-info {
  background: #52c41a;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #73d13d;
}

.btn-full {
  width: 100%;
  margin-top: 16px;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-row {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.temp-display {
  float: right;
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
}

.radio-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.radio-label {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  background: white;
}

.radio-label:hover:not(.active):not(:has(input:disabled)) {
  border-color: #1890ff;
  color: #1890ff;
}

.radio-label.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.radio-label input {
  display: none;
}

.radio-label:has(input:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f5f5;
}

.slider-container {
  padding: 8px 0;
}

.slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e8e8e8;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1890ff;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider:disabled {
  opacity: 0.6;
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  padding: 0 6px;
}

.mark {
  font-size: 11px;
  color: #999;
  position: relative;
}

.mark.active {
  color: #1890ff;
  font-weight: 600;
}

.device-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.device-info-summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.info-label {
  font-size: 12px;
  color: #666;
}

.info-value {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}
</style>
