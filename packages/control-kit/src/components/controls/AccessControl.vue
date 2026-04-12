<template>
  <div class="access-control">
    <!-- 单次控制 -->
    <div v-if="showSingleControl" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">
        {{ singleControlTitle }}{{ isBatchMode ? `（${deviceCount}台设备）` : '' }}
      </h4>
      <div class="single-control">
        <button 
          v-if="showOpenButton"
          class="btn btn-success"
          :class="{ 'btn-large': largeButtons }"
          :disabled="loading"
          @click="handleOpen"
        >
          <span v-if="loading && activeCommand === 'open'" class="spinner"></span>
          <span v-else>{{ openIcon }}</span>
          {{ openButtonText }}
        </button>
        <button 
          v-if="showCloseButton"
          class="btn btn-danger"
          :class="{ 'btn-large': largeButtons }"
          :disabled="loading"
          @click="handleClose"
        >
          <span v-if="loading && activeCommand === 'close'" class="spinner"></span>
          <span v-else>{{ closeIcon }}</span>
          {{ closeButtonText }}
        </button>
      </div>
    </div>

    <!-- 持续状态设置（合并栏目） -->
    <div v-if="showPersistControl && (showStateSelector || showLockSelector)" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">
        {{ persistControlTitle }}{{ isBatchMode ? `（${deviceCount}台设备）` : '' }}
      </h4>
      <div class="persist-control">
        <!-- 状态选择 -->
        <div v-if="showStateSelector" class="form-row">
          <label class="form-label">{{ stateLabel }}</label>
          <div class="radio-group">
            <label 
              v-for="option in stateOptions" 
              :key="option.value"
              class="radio-label"
              :class="{ active: stateValue === option.value }"
            >
              <input 
                v-model="stateValue" 
                type="radio" 
                :value="option.value"
              >
              {{ option.label }}
            </label>
          </div>
        </div>

        <!-- 锁定选择 -->
        <div v-if="showLockSelector" class="form-row">
          <label class="form-label">{{ lockLabel }}</label>
          <div class="radio-group">
            <label 
              v-for="option in lockOptions" 
              :key="option.value"
              class="radio-label"
              :class="{ active: lockValue === option.value }"
            >
              <input 
                v-model="lockValue" 
                type="radio" 
                :value="option.value"
              >
              {{ option.label }}
            </label>
          </div>
        </div>

        <!-- 合并的应用按钮 -->
        <button 
          v-if="showApplyButton"
          class="btn btn-primary btn-full"
          :disabled="loading"
          @click="handlePersistControl"
        >
          <span v-if="loading && activeCommand === 'persist'" class="spinner"></span>
          {{ persistApplyButtonText }}{{ isBatchMode ? `（${deviceCount}台设备）` : '' }}
        </button>
      </div>
    </div>

    <!-- 延时设置 -->
    <div v-if="showDelayControl" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">
        {{ delayControlTitle }}{{ isBatchMode ? `（${deviceCount}台设备）` : '' }}
      </h4>
      <div class="delay-control">
        <div class="slider-container">
          <div class="delay-display">
            <span class="delay-value">{{ delayTime }}</span>
            <span class="delay-unit">{{ delayUnit }}</span>
          </div>
          <input 
            :value="delayTime"
            type="range"
            :min="delayMin"
            :max="delayMax"
            :step="delayStep"
            class="slider"
            @input="delayTime = Number(($event.target as HTMLInputElement).value)"
          >
          <div class="slider-labels">
            <span>{{ delayMin }}{{ delayUnit }}</span>
            <span>{{ Math.round((delayMax - delayMin) / 2) }}{{ delayUnit }}</span>
            <span>{{ delayMax }}{{ delayUnit }}</span>
          </div>
        </div>

        <button 
          v-if="showApplyButton"
          class="btn btn-primary btn-full"
          :disabled="loading"
          @click="handleDelaySet"
        >
          <span v-if="loading && activeCommand === 'delay'" class="spinner"></span>
          {{ setDelayButtonText }}{{ isBatchMode ? `（${deviceCount}台设备）` : '' }}
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
        <div v-if="showInfoGateway" class="info-item">
          <span class="info-label">RS485网关:</span>
          <span class="info-value">{{ deviceList[0]?.rs485GatewayId }}</span>
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
import { ref, computed } from 'vue';
import type { Access, Task, Priority } from '../../types/device';
import {
  ACCESS_COMMANDS,
} from '../../types/device';

// ==================== Props 定义 ====================
const props = withDefaults(defineProps<{
  // 设备数据（支持单设备或设备数组）
  device: Access | Access[];
  
  // 任务优先级
  priority?: Priority;
  
  // ========== 模块显示控制 ==========
  showLockWarning?: boolean;
  
  // 单次控制
  showSingleControl?: boolean;
  showOpenButton?: boolean;
  showCloseButton?: boolean;
  showQueryStatus?: boolean;
  
  // 持续状态控制（合并栏目）
  showPersistControl?: boolean;
  showStateSelector?: boolean;
  showLockSelector?: boolean;
  
  // 延时控制
  showDelayControl?: boolean;
  delayMin?: number;
  delayMax?: number;
  delayStep?: number;
  delayUnit?: string;
  
  // 设备信息
  showDeviceInfo?: boolean;
  showInfoId?: boolean;
  showInfoName?: boolean;
  showInfoAddress?: boolean;
  showInfoGateway?: boolean;
  
  // ========== 标题配置 ==========
  showSectionTitles?: boolean;
  singleControlTitle?: string;
  persistControlTitle?: string;
  delayControlTitle?: string;
  deviceInfoTitle?: string;
  
  // ========== 按钮样式 ==========
  largeButtons?: boolean;
  showApplyButton?: boolean;
  
  // ========== 文本配置 ==========
  openButtonText?: string;
  closeButtonText?: string;
  queryStatusText?: string;
  persistApplyButtonText?: string;
  setDelayButtonText?: string;
  openIcon?: string;
  closeIcon?: string;
  stateLabel?: string;
  lockLabel?: string;
}>(), {
  // 默认优先级
  priority: 'NORMAL',
  
  // 默认显示
  showLockWarning: true,
  showSingleControl: true,
  showOpenButton: true,
  showCloseButton: true,
  showQueryStatus: true,
  showPersistControl: true,
  showStateSelector: true,
  showLockSelector: true,
  showDelayControl: true,
  delayMin: 0,
  delayMax: 60,
  delayStep: 1,
  delayUnit: 's',
  showDeviceInfo: true,
  showInfoId: true,
  showInfoName: true,
  showInfoAddress: true,
  showInfoGateway: true,
  showSectionTitles: true,
  singleControlTitle: '单次控制',
  persistControlTitle: '持续状态设置',
  delayControlTitle: '延时设置',
  deviceInfoTitle: '设备信息',
  largeButtons: true,
  showApplyButton: true,
  openButtonText: '开门',
  closeButtonText: '关门',
  queryStatusText: '查询状态',
  persistApplyButtonText: '应用设置',
  setDelayButtonText: '设置延时',
  openIcon: '🚪',
  closeIcon: '🔒',
  stateLabel: '门状态',
  lockLabel: '锁定状态',
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

// 独立的状态值
const stateValue = ref<'open' | 'close' | 'keep'>('open');
const lockValue = ref<'lock' | 'unlock' | 'keep'>('unlock');
const delayTime = ref(5);

const stateOptions = [
  { label: '常开', value: 'open' as const },
  { label: '常关', value: 'close' as const },
  { label: '保持', value: 'keep' as const },
];

const lockOptions = [
  { label: '锁定', value: 'lock' as const },
  { label: '解锁', value: 'unlock' as const },
  { label: '保持', value: 'keep' as const },
];

// ==================== 计算属性 ====================

// 判断是否为批量模式
const isBatchMode = computed(() => {
  return Array.isArray(props.device);
});

// 获取设备列表
const deviceList = computed((): Access[] => {
  if (Array.isArray(props.device)) {
    return props.device;
  }
  return [props.device];
});

// 设备数量
const deviceCount = computed(() => deviceList.value.length);

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
const createBaseTask = (device: Access): Omit<Task, 'commandLine' | 'args'> => ({
  priority: props.priority,
  deviceType: 'Access',
  deviceId: device.id,
});

// ========== 单次控制 ==========

// 开门
const handleOpen = () => {
  const tasks: Task[] = deviceList.value.map(device => ({
    ...createBaseTask(device),
    commandLine: ACCESS_COMMANDS.OPEN_ONCE,
    args: [device.address],
  }));
  
  emitExecute(tasks, 'open');
};

// 关门
const handleClose = () => {
  const tasks: Task[] = deviceList.value.map(device => ({
    ...createBaseTask(device),
    commandLine: ACCESS_COMMANDS.CLOSE_ONCE,
    args: [device.address],
  }));
  
  emitExecute(tasks, 'close');
};

// ========== 持续状态控制（合并发送）==========

// 门状态与锁定状态组合映射到指令
// 格式: `${state}-${lock}` -> CommandLine
const PERSIST_COMMAND_MAP: Record<string, string> = {
  'open-lock': ACCESS_COMMANDS.OPEN_PERSIST_LOCK,
  'open-unlock': ACCESS_COMMANDS.OPEN_PERSIST_UNLOCK,
  'open-keep': ACCESS_COMMANDS.OPEN_PERSIST_KEEP,
  'close-lock': ACCESS_COMMANDS.CLOSE_PERSIST_LOCK,
  'close-unlock': ACCESS_COMMANDS.CLOSE_PERSIST_UNLOCK,
  'close-keep': ACCESS_COMMANDS.CLOSE_PERSIST_KEEP,
  'keep-lock': ACCESS_COMMANDS.KEEP_STATUS_LOCK,
  'keep-unlock': ACCESS_COMMANDS.KEEP_STATUS_UNLOCK,
};

// 根据门状态和锁定状态组合选择对应的指令
const handlePersistControl = () => {
  const key = `${stateValue.value}-${lockValue.value}`;
  const commandLine = PERSIST_COMMAND_MAP[key];
  
  if (!commandLine) return;
  
  const tasks: Task[] = deviceList.value.map(device => ({
    ...createBaseTask(device),
    commandLine,
    args: [device.address],
  }));
  
  emitExecute(tasks, 'persist');
};

// ========== 延时设置 ==========

const handleDelaySet = () => {
  const tasks: Task[] = deviceList.value.map(device => ({
    ...createBaseTask(device),
    commandLine: ACCESS_COMMANDS.SET_DELAY,
    args: [device.address, delayTime.value],
  }));
  
  emitExecute(tasks, 'delay');
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
      commandLine: ACCESS_COMMANDS.REQUEST_DATA,
      args: [device.address],
    }));
    emit('execute', tasks);
  },
  // 获取/设置表单值
  getStateValue: () => stateValue.value,
  setStateValue: (value: 'open' | 'close' | 'keep') => {
    stateValue.value = value;
  },
  getLockValue: () => lockValue.value,
  setLockValue: (value: 'lock' | 'unlock' | 'keep') => {
    lockValue.value = value;
  },
  getDelayTime: () => delayTime.value,
  setDelayTime: (value: number) => {
    delayTime.value = value;
  },
  // 生成控制 Task
  generateTasks: (command: 'open' | 'close' | 'queryStatus' | 'persist' | 'delay'): Task[] => {
    switch (command) {
      case 'open':
        return deviceList.value.map(device => ({
          ...createBaseTask(device),
          commandLine: ACCESS_COMMANDS.OPEN_ONCE,
          args: [device.address],
        }));
      case 'close':
        return deviceList.value.map(device => ({
          ...createBaseTask(device),
          commandLine: ACCESS_COMMANDS.CLOSE_ONCE,
          args: [device.address],
        }));
      case 'queryStatus':
        return deviceList.value.map(device => ({
          ...createBaseTask(device),
          commandLine: ACCESS_COMMANDS.REQUEST_DATA,
          args: [device.address],
        }));
      case 'persist': {
        const key = `${stateValue.value}-${lockValue.value}`;
        const commandLine = PERSIST_COMMAND_MAP[key];
        if (!commandLine) return [];
        return deviceList.value.map(device => ({
          ...createBaseTask(device),
          commandLine,
          args: [device.address],
        }));
      }
      case 'delay':
        return deviceList.value.map(device => ({
          ...createBaseTask(device),
          commandLine: ACCESS_COMMANDS.SET_DELAY,
          args: [device.address, delayTime.value],
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


div label h1 h2 h3 h4 h5 h6 {
  caret-color: transparent;
}

.access-control {
  padding: 16px;
}

.lock-warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #856404;
}

.lock-icon {
  font-size: 18px;
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

.single-control {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
  padding: 0 3rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-large {
  padding: 16px 32px;
  font-size: 16px;
}

.btn-success {
  background: #52c41a;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #73d13d;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #ff7875;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
}

.btn-info {
  background: #13c2c2;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #36cfc9;
}

.btn-full {
  width: 100%;
  margin-top: 12px;
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

.persist-control,
.delay-control {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
}

.form-row {
  margin-bottom: 20px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.radio-group {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 12px;
  justify-content: center;
}

.radio-label {
  display: inline-flex;
  align-items: center;
  padding: 8px 2rem;
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

.delay-display {
  text-align: center;
  margin-bottom: 12px;
}

.delay-value {
  font-size: 32px;
  font-weight: 600;
  color: #1890ff;
}

.delay-unit {
  font-size: 14px;
  color: #666;
  margin-left: 4px;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e8e8e8;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #1890ff;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.slider:disabled {
  opacity: 0.6;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
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
