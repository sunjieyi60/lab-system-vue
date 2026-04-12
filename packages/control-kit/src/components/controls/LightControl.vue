<template>
  <div class="light-control">
    <!-- 设备锁定提示 -->
    <div v-if="device.isLock && showLockWarning" class="lock-warning">
      <span class="lock-icon">🔒</span>
      <span>设备已锁定，无法操作</span>
    </div>

    <!-- 主开关 -->
    <div v-if="showMainSwitch" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">{{ mainSwitchTitle }}</h4>
      <div class="main-control">
        <div 
          class="light-switch"
          :class="{ 
            on: lightState, 
            off: !lightState,
            locked: device.isLock 
          }"
          @click="handleToggle"
        >
          <div class="light-icon">
            <span v-if="lightState">{{ lightOnIcon }}</span>
            <span v-else>{{ lightOffIcon }}</span>
          </div>
          <div class="light-status">
            <span class="status-text">{{ lightState ? lightOnText : lightOffText }}</span>
            <span v-if="showToggleHint" class="status-hint">
              {{ lightState ? toggleOffHint : toggleOnHint }}
            </span>
          </div>
          <div class="switch-indicator" :class="{ on: lightState }"></div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div v-if="showQuickActions" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">{{ quickActionsTitle }}</h4>
      <div class="quick-actions">
        <button 
          v-if="showOpenButton"
          class="btn btn-success"
          :disabled="loading || device.isLock"
          @click="handleOpen"
        >
          <span v-if="loading && activeCommand === 'open'" class="spinner"></span>
          <span v-else>{{ openIcon }}</span>
          {{ openButtonText }}
        </button>
        <button 
          v-if="showCloseButton"
          class="btn btn-danger"
          :disabled="loading || device.isLock"
          @click="handleClose"
        >
          <span v-if="loading && activeCommand === 'close'" class="spinner"></span>
          <span v-else>{{ closeIcon }}</span>
          {{ closeButtonText }}
        </button>
        <button 
          v-if="showQueryStatus"
          class="btn btn-info"
          :disabled="loading || device.isLock"
          @click="handleQueryStatus"
        >
          <span v-if="loading && activeCommand === 'queryStatus'" class="spinner"></span>
          <span v-else>📊</span>
          {{ queryStatusText }}
        </button>
      </div>
    </div>

    <!-- 设备信息 -->
    <div v-if="showDeviceInfo" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">{{ deviceInfoTitle }}</h4>
      <div class="device-info">
        <div v-if="showInfoId" class="info-item">
          <span class="info-label">设备ID:</span>
          <span class="info-value">{{ device.id }}</span>
        </div>
        <div v-if="showInfoName" class="info-item">
          <span class="info-label">设备名称:</span>
          <span class="info-value">{{ device.deviceName }}</span>
        </div>
        <div v-if="showInfoAddress" class="info-item">
          <span class="info-label">地址:</span>
          <span class="info-value">{{ device.address }}</span>
        </div>
        <div v-if="showInfoSelfId" class="info-item">
          <span class="info-label">子ID:</span>
          <span class="info-value">{{ device.selfId }}</span>
        </div>
        <div v-if="showInfoGateway" class="info-item">
          <span class="info-label">RS485网关:</span>
          <span class="info-value">{{ device.rs485GatewayId }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Light, Task, Priority } from '../../types/device';
import { LIGHT_COMMANDS } from '../../types/device';

// ==================== Props 定义 ====================
const props = withDefaults(defineProps<{
  // 设备数据
  device: Light;
  
  // 任务优先级
  priority?: Priority;
  
  // ========== 模块显示控制 ==========
  showLockWarning?: boolean;
  showMainSwitch?: boolean;
  showQuickActions?: boolean;
  showOpenButton?: boolean;
  showCloseButton?: boolean;
  showQueryStatus?: boolean;
  showDeviceInfo?: boolean;
  showInfoId?: boolean;
  showInfoName?: boolean;
  showInfoAddress?: boolean;
  showInfoSelfId?: boolean;
  showInfoGateway?: boolean;
  
  // ========== 标题配置 ==========
  showSectionTitles?: boolean;
  mainSwitchTitle?: string;
  quickActionsTitle?: string;
  deviceInfoTitle?: string;
  
  // ========== 开关配置 ==========
  showToggleHint?: boolean;
  toggleOnHint?: string;
  toggleOffHint?: string;
  
  // ========== 文本配置 ==========
  lightOnText?: string;
  lightOffText?: string;
  openButtonText?: string;
  closeButtonText?: string;
  queryStatusText?: string;
  
  // ========== 图标配置 ==========
  lightOnIcon?: string;
  lightOffIcon?: string;
  openIcon?: string;
  closeIcon?: string;
}>(), {
  // 默认优先级
  priority: 'NORMAL',
  
  // 默认显示
  showLockWarning: true,
  showMainSwitch: true,
  showQuickActions: true,
  showOpenButton: true,
  showCloseButton: true,
  showQueryStatus: true,
  showDeviceInfo: true,
  showInfoId: true,
  showInfoName: true,
  showInfoAddress: true,
  showInfoSelfId: true,
  showInfoGateway: true,
  showSectionTitles: true,
  mainSwitchTitle: '灯光控制',
  quickActionsTitle: '快捷操作',
  deviceInfoTitle: '设备信息',
  showToggleHint: true,
  toggleOnHint: '点击开启',
  toggleOffHint: '点击关闭',
  lightOnText: '已开启',
  lightOffText: '已关闭',
  openButtonText: '开灯',
  closeButtonText: '关灯',
  queryStatusText: '查询状态',
  lightOnIcon: '💡',
  lightOffIcon: '🌑',
  openIcon: '💡',
  closeIcon: '🌑',
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
const lightState = ref(false);

// 监听设备变化
watch(() => props.device, (newDevice) => {
  console.log('设备更新:', newDevice.deviceName);
}, { immediate: true });

// 生成基础 Task 对象
const createBaseTask = (): Omit<Task, 'commandLine' | 'args'> => ({
  priority: props.priority,
  deviceType: 'Light',
  deviceId: props.device.id,
});

// ========== 控制处理 ==========

// 开灯 - 返回单个 Task
const handleOpen = () => {
  if (props.device.isLock) return;
  
  const tasks: Task[] = [{
    ...createBaseTask(),
    commandLine: LIGHT_COMMANDS.OPEN,
    args: [props.device.address, props.device.selfId],
  }];
  
  emitExecute(tasks, 'open', (success) => {
    if (success) lightState.value = true;
  });
};

// 关灯 - 返回单个 Task
const handleClose = () => {
  if (props.device.isLock) return;
  
  const tasks: Task[] = [{
    ...createBaseTask(),
    commandLine: LIGHT_COMMANDS.CLOSE,
    args: [props.device.address, props.device.selfId],
  }];
  
  emitExecute(tasks, 'close', (success) => {
    if (success) lightState.value = false;
  });
};

// 切换开关
const handleToggle = () => {
  if (props.device.isLock || loading.value) return;
  
  if (lightState.value) {
    handleClose();
  } else {
    handleOpen();
  }
};

// 查询状态 - 返回单个 Task
const handleQueryStatus = () => {
  if (props.device.isLock) return;
  
  const tasks: Task[] = [{
    ...createBaseTask(),
    commandLine: LIGHT_COMMANDS.REQUEST_DATA,
    args: [props.device.address, props.device.selfId],
  }];
  
  emitExecute(tasks, 'queryStatus');
};

// 通用执行函数
const emitExecute = (tasks: Task[], commandKey: string, callback?: (success: boolean) => void) => {
  loading.value = true;
  activeCommand.value = commandKey;
  
  emit('execute', tasks, (success) => {
    loading.value = false;
    activeCommand.value = '';
    callback?.(success);
  });
};

// 暴露方法
defineExpose({
  // 刷新状态
  refreshStatus: () => {
    const tasks: Task[] = [{
      ...createBaseTask(),
      commandLine: LIGHT_COMMANDS.REQUEST_DATA,
      args: [props.device.address, props.device.selfId],
    }];
    emit('execute', tasks);
  },
  // 获取/设置灯光状态
  getLightState: () => lightState.value,
  setLightState: (state: boolean) => {
    lightState.value = state;
  },
  // 生成控制 Task
  generateTasks: (command: 'open' | 'close' | 'queryStatus'): Task[] => {
    const base = createBaseTask();
    switch (command) {
      case 'open':
        return [{ ...base, commandLine: LIGHT_COMMANDS.OPEN, args: [props.device.address, props.device.selfId] }];
      case 'close':
        return [{ ...base, commandLine: LIGHT_COMMANDS.CLOSE, args: [props.device.address, props.device.selfId] }];
      case 'queryStatus':
        return [{ ...base, commandLine: LIGHT_COMMANDS.REQUEST_DATA, args: [props.device.address, props.device.selfId] }];
      default:
        return [];
    }
  },
});
</script>

<style scoped>
.light-control {
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

.main-control {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.light-switch {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.light-switch.on {
  background: linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%);
  border: 4px solid #faad14;
  box-shadow: 0 4px 30px rgba(250, 173, 20, 0.4);
}

.light-switch.off {
  background: linear-gradient(135deg, #f5f5f5 0%, #d9d9d9 100%);
  border: 4px solid #bfbfbf;
}

.light-switch.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.light-icon {
  font-size: 64px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.light-switch.on .light-icon {
  filter: drop-shadow(0 0 20px rgba(250, 173, 20, 0.8));
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from { filter: drop-shadow(0 0 10px rgba(250, 173, 20, 0.6)); }
  to { filter: drop-shadow(0 0 30px rgba(250, 173, 20, 1)); }
}

.light-status {
  text-align: center;
}

.status-text {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.status-hint {
  display: block;
  font-size: 12px;
  color: #666;
}

.switch-indicator {
  position: absolute;
  bottom: 20px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #bfbfbf;
  transition: all 0.3s ease;
}

.switch-indicator.on {
  background: #52c41a;
  box-shadow: 0 0 10px #52c41a;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 24px;
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

.btn-info {
  background: #13c2c2;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #36cfc9;
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

.device-info {
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
