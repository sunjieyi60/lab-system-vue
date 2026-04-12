<template>
  <div class="circuit-break-control">
    <!-- 警告提示 -->
    <div v-if="showWarning" class="warning-alert">
      <span class="warning-icon">⚠️</span>
      <div class="warning-content">
        <div v-if="warningTitle" class="warning-title">{{ warningTitle }}</div>
        <div v-if="warningDesc" class="warning-desc">{{ warningDesc }}</div>
      </div>
    </div>

    <!-- 状态显示（仅单设备模式） -->
    <div v-if="showStatus && !isBatchMode" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">{{ statusTitle }}</h4>
      <div class="status-display">
        <div 
          class="status-card"
          :class="{ closed: isClosed, open: !isClosed }"
        >
          <div class="status-icon">
            <span v-if="isClosed">{{ closedIcon }}</span>
            <span v-else>{{ openIcon }}</span>
          </div>
          <div class="status-text">
            {{ isClosed ? closedStatusText : openStatusText }}
          </div>
          <div class="status-indicator" :class="{ on: isClosed }"></div>
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div v-if="showControlButtons" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">
        {{ controlTitle }}{{ isBatchMode ? `（${deviceCount}台设备）` : '' }}
      </h4>
      <div class="control-buttons">
        <button 
          v-if="showOpenButton"
          class="btn btn-success"
          :class="{ 'btn-large': largeButtons }"
          :disabled="loading || (!isBatchMode && isClosed)"
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
          :disabled="loading || (!isBatchMode && !isClosed)"
          @click="handleClose"
        >
          <span v-if="loading && activeCommand === 'close'" class="spinner"></span>
          <span v-else>{{ closeIcon }}</span>
          {{ closeButtonText }}
        </button>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div v-if="showQuickActions" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">{{ quickActionsTitle }}</h4>
      <div class="quick-actions">
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

    <!-- 确认对话框 -->
    <div v-if="showConfirmDialog && showConfirm" class="modal-overlay" @click.self="cancelConfirm">
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-icon">⚠️</span>
          <h3>{{ confirmDialogTitle }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ confirmMessage }}</p>
          <p v-if="confirmHint" class="modal-hint">{{ confirmHint }}</p>
          <p v-if="isBatchMode" class="modal-batch-info">将影响 {{ deviceCount }} 台设备</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="cancelConfirm">{{ cancelButtonText }}</button>
          <button 
            class="btn" 
            :class="confirmAction === 'open' ? 'btn-success' : 'btn-danger'"
            @click="confirmActionHandler"
          >
            {{ confirmButtonText }}
          </button>
        </div>
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
import type { CircuitBreak, Task, Priority } from '../../types/device';
import { CIRCUIT_COMMANDS } from '../../types/device';

// ==================== Props 定义 ====================
const props = withDefaults(defineProps<{
  // 设备数据（支持单设备或设备数组）
  device: CircuitBreak | CircuitBreak[];
  
  // 任务优先级
  priority?: Priority;
  
  // ========== 模块显示控制 ==========
  showWarning?: boolean;
  showStatus?: boolean;
  showControlButtons?: boolean;
  showOpenButton?: boolean;
  showCloseButton?: boolean;
  showConfirmDialog?: boolean;
  showQuickActions?: boolean;
  showQueryStatus?: boolean;
  showDeviceInfo?: boolean;
  showInfoId?: boolean;
  showInfoName?: boolean;
  showInfoAddress?: boolean;
  showInfoGateway?: boolean;
  
  // ========== 标题配置 ==========
  showSectionTitles?: boolean;
  statusTitle?: string;
  controlTitle?: string;
  quickActionsTitle?: string;
  deviceInfoTitle?: string;
  
  // ========== 警告配置 ==========
  warningTitle?: string;
  warningDesc?: string;
  
  // ========== 状态配置 ==========
  openStatusText?: string;
  closedStatusText?: string;
  
  // ========== 按钮配置 ==========
  largeButtons?: boolean;
  openButtonText?: string;
  closeButtonText?: string;
  queryStatusText?: string;
  
  // ========== 图标配置 ==========
  openIcon?: string;
  closeIcon?: string;
  closedIcon?: string;
  
  // ========== 确认对话框配置 ==========
  confirmDialogTitle?: string;
  confirmHint?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  openConfirmMessage?: string;
  closeConfirmMessage?: string;
}>(), {
  // 默认优先级
  priority: 'NORMAL',
  
  // 默认显示
  showWarning: true,
  showStatus: true,
  showControlButtons: true,
  showOpenButton: true,
  showCloseButton: true,
  showConfirmDialog: true,
  showQuickActions: true,
  showQueryStatus: true,
  showDeviceInfo: true,
  showInfoId: true,
  showInfoName: true,
  showInfoAddress: true,
  showInfoGateway: true,
  showSectionTitles: true,
  statusTitle: '当前状态',
  controlTitle: '控制操作',
  quickActionsTitle: '快捷操作',
  deviceInfoTitle: '设备信息',
  warningTitle: '断路器操作警告',
  warningDesc: '分闸/合闸操作将影响该区域供电，请谨慎操作',
  openStatusText: '分闸 (断电)',
  closedStatusText: '合闸 (通电中)',
  largeButtons: true,
  openButtonText: '合闸 (通电)',
  closeButtonText: '分闸 (断电)',
  queryStatusText: '查询状态',
  openIcon: '⚡',
  closeIcon: '⏻',
  closedIcon: '⚡',
  confirmDialogTitle: '确认操作',
  confirmHint: '此操作将影响设备供电，请确认是否继续？',
  confirmButtonText: '确认执行',
  cancelButtonText: '取消',
  openConfirmMessage: '确认执行合闸操作？设备将恢复供电。',
  closeConfirmMessage: '确认执行分闸操作？设备将断电。',
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
const isClosed = ref(false);

// 确认对话框
const showConfirm = ref(false);
const confirmMessage = ref('');
const confirmAction = ref<'open' | 'close' | null>(null);

// ==================== 计算属性 ====================

// 判断是否为批量模式
const isBatchMode = computed(() => {
  return Array.isArray(props.device);
});

// 获取设备列表
const deviceList = computed((): CircuitBreak[] => {
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
const createBaseTask = (device: CircuitBreak): Omit<Task, 'commandLine' | 'args'> => ({
  priority: props.priority,
  deviceType: 'CircuitBreak',
  deviceId: device.id,
});

// ========== 控制处理 ==========

// 合闸
const handleOpen = () => {
  if (!isBatchMode.value && isClosed.value) return;
  
  if (!props.showConfirmDialog) {
    executeOpen();
    return;
  }
  
  confirmMessage.value = props.openConfirmMessage;
  confirmAction.value = 'open';
  showConfirm.value = true;
};

const executeOpen = () => {
  const tasks: Task[] = deviceList.value.map(device => ({
    ...createBaseTask(device),
    commandLine: CIRCUIT_COMMANDS.OPEN,
    args: [device.address],
  }));
  
  emitExecute(tasks, 'open', (success) => {
    if (success && !isBatchMode.value) isClosed.value = true;
  });
};

// 分闸
const handleClose = () => {
  if (!isBatchMode.value && !isClosed.value) return;
  
  if (!props.showConfirmDialog) {
    executeClose();
    return;
  }
  
  confirmMessage.value = props.closeConfirmMessage;
  confirmAction.value = 'close';
  showConfirm.value = true;
};

const executeClose = () => {
  const tasks: Task[] = deviceList.value.map(device => ({
    ...createBaseTask(device),
    commandLine: CIRCUIT_COMMANDS.CLOSE,
    args: [device.address],
  }));
  
  emitExecute(tasks, 'close', (success) => {
    if (success && !isBatchMode.value) isClosed.value = false;
  });
};

// 确认执行
const confirmActionHandler = () => {
  showConfirm.value = false;
  if (confirmAction.value === 'open') {
    executeOpen();
  } else if (confirmAction.value === 'close') {
    executeClose();
  }
  confirmAction.value = null;
};

// 取消确认
const cancelConfirm = () => {
  showConfirm.value = false;
  confirmAction.value = null;
};

// 查询状态
const handleQueryStatus = () => {
  const tasks: Task[] = deviceList.value.map(device => ({
    ...createBaseTask(device),
    commandLine: CIRCUIT_COMMANDS.REQUEST_DATA,
    args: [device.address],
  }));
  
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
    const tasks: Task[] = deviceList.value.map(device => ({
      ...createBaseTask(device),
      commandLine: CIRCUIT_COMMANDS.REQUEST_DATA,
      args: [device.address],
    }));
    emit('execute', tasks);
  },
  // 获取/设置状态
  getStatus: () => isClosed.value,
  setStatus: (closed: boolean) => {
    isClosed.value = closed;
  },
  // 生成控制 Task
  generateTasks: (command: 'open' | 'close' | 'queryStatus'): Task[] => {
    switch (command) {
      case 'open':
        return deviceList.value.map(device => ({
          ...createBaseTask(device),
          commandLine: CIRCUIT_COMMANDS.OPEN,
          args: [device.address],
        }));
      case 'close':
        return deviceList.value.map(device => ({
          ...createBaseTask(device),
          commandLine: CIRCUIT_COMMANDS.CLOSE,
          args: [device.address],
        }));
      case 'queryStatus':
        return deviceList.value.map(device => ({
          ...createBaseTask(device),
          commandLine: CIRCUIT_COMMANDS.REQUEST_DATA,
          args: [device.address],
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
.circuit-break-control {
  padding: 16px;
}

.warning-alert {
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.warning-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 14px;
  font-weight: 600;
  color: #ad6800;
  margin-bottom: 4px;
}

.warning-desc {
  font-size: 13px;
  color: #d48806;
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

.status-display {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.status-card {
  width: 240px;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
}

.status-card.closed {
  background: linear-gradient(135deg, #f6ffed 0%, #b7eb8f 100%);
  border: 3px solid #52c41a;
  box-shadow: 0 4px 20px rgba(82, 196, 26, 0.3);
}

.status-card.open {
  background: linear-gradient(135deg, #f5f5f5 0%, #d9d9d9 100%);
  border: 3px solid #bfbfbf;
}

.status-icon {
  font-size: 56px;
  margin-bottom: 12px;
}

.status-card.closed .status-icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.status-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.status-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #bfbfbf;
  transition: all 0.3s ease;
}

.status-indicator.on {
  background: #52c41a;
  box-shadow: 0 0 12px #52c41a;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.control-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-large {
  padding: 18px 36px;
  font-size: 16px;
}

.btn-success {
  background: #52c41a;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #73d13d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #ff7875;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4);
}

.btn-info {
  background: #1890ff;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #40a9ff;
}

.btn-default {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #d9d9d9;
}

.btn-default:hover:not(:disabled) {
  background: #e8e8e8;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.quick-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  font-size: 28px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.modal-body {
  padding: 20px 24px;
}

.modal-body p {
  margin: 0 0 12px;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.modal-hint {
  color: #ff4d4f !important;
  font-size: 13px !important;
}

.modal-batch-info {
  color: #1890ff !important;
  font-weight: 500;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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
