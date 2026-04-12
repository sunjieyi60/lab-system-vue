<template>
  <div class="sensor-control">
    <!-- 说明提示 -->
    <div v-if="showInfoAlert" class="info-alert">
      <span class="info-icon">{{ infoIcon }}</span>
      <div class="info-content">
        <div v-if="infoTitle" class="info-title">{{ infoTitle }}</div>
        <div v-if="infoDesc" class="info-desc">{{ infoDesc }}</div>
      </div>
    </div>

    <!-- 数据查询 -->
    <div v-if="showQuerySection" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">{{ querySectionTitle }}</h4>
      <div class="query-section">
        <button 
          class="btn btn-primary"
          :class="{ 'btn-large': largeButton }"
          :disabled="loading"
          @click="handleQuery"
        >
          <span v-if="loading" class="spinner"></span>
          <span v-else>{{ queryButtonIcon }}</span>
          {{ queryButtonText }}
        </button>
      </div>
    </div>

    <!-- 传感器数据显示 -->
    <div v-if="showDataDisplay && sensorData" class="control-section">
      <h4 v-if="showSectionTitles" class="section-title">{{ dataDisplayTitle }}</h4>
      <div class="data-display">
        <div class="data-card">
          <div v-if="showTemperature && sensorData.temperature !== undefined" class="data-item">
            <span class="data-label">{{ temperatureLabel }}</span>
            <span class="data-value">{{ sensorData.temperature }}{{ temperatureUnit }}</span>
          </div>
          <div v-if="showHumidity && sensorData.humidity !== undefined" class="data-item">
            <span class="data-label">{{ humidityLabel }}</span>
            <span class="data-value">{{ sensorData.humidity }}{{ humidityUnit }}</span>
          </div>
          <div v-if="showPm25 && sensorData.pm25 !== undefined" class="data-item">
            <span class="data-label">{{ pm25Label }}</span>
            <span class="data-value">{{ sensorData.pm25 }} {{ pm25Unit }}</span>
          </div>
          <div v-if="showCo2 && sensorData.co2 !== undefined" class="data-item">
            <span class="data-label">{{ co2Label }}</span>
            <span class="data-value">{{ sensorData.co2 }} {{ co2Unit }}</span>
          </div>
        </div>
        <div v-if="showUpdateTime && sensorData.updateTime" class="update-time">
          {{ updateTimeLabel }}: {{ sensorData.updateTime }}
        </div>
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
        <div v-if="showInfoPolling" class="info-item">
          <span class="info-label">轮询状态:</span>
          <span class="info-value" :class="{ enabled: device.pollingEnabled }">
            {{ device.pollingEnabled ? pollingEnabledText : pollingDisabledText }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Sensor, Task, Priority } from '../../types/device';
import { SENSOR_COMMANDS } from '../../types/device';

// ==================== Props 定义 ====================
const props = withDefaults(defineProps<{
  // 设备数据
  device: Sensor;
  
  // 任务优先级
  priority?: Priority;
  
  // ========== 模块显示控制 ==========
  showInfoAlert?: boolean;
  showQuerySection?: boolean;
  showDataDisplay?: boolean;
  showDeviceInfo?: boolean;
  showTemperature?: boolean;
  showHumidity?: boolean;
  showPm25?: boolean;
  showCo2?: boolean;
  showUpdateTime?: boolean;
  showInfoId?: boolean;
  showInfoName?: boolean;
  showInfoAddress?: boolean;
  showInfoSelfId?: boolean;
  showInfoGateway?: boolean;
  showInfoPolling?: boolean;
  
  // ========== 标题配置 ==========
  showSectionTitles?: boolean;
  querySectionTitle?: string;
  dataDisplayTitle?: string;
  deviceInfoTitle?: string;
  
  // ========== 信息提示配置 ==========
  infoIcon?: string;
  infoTitle?: string;
  infoDesc?: string;
  
  // ========== 按钮配置 ==========
  largeButton?: boolean;
  queryButtonText?: string;
  queryButtonIcon?: string;
  
  // ========== 数据标签配置 ==========
  temperatureLabel?: string;
  temperatureUnit?: string;
  humidityLabel?: string;
  humidityUnit?: string;
  pm25Label?: string;
  pm25Unit?: string;
  co2Label?: string;
  co2Unit?: string;
  updateTimeLabel?: string;
  
  // ========== 轮询状态文本 ==========
  pollingEnabledText?: string;
  pollingDisabledText?: string;
}>(), {
  // 默认优先级
  priority: 'POLLING',
  
  // 默认显示
  showInfoAlert: true,
  showQuerySection: true,
  showDataDisplay: true,
  showDeviceInfo: true,
  showTemperature: true,
  showHumidity: true,
  showPm25: true,
  showCo2: true,
  showUpdateTime: true,
  showInfoId: true,
  showInfoName: true,
  showInfoAddress: true,
  showInfoSelfId: true,
  showInfoGateway: true,
  showInfoPolling: true,
  showSectionTitles: true,
  querySectionTitle: '数据查询',
  dataDisplayTitle: '传感器数据',
  deviceInfoTitle: '设备信息',
  infoIcon: '📡',
  infoTitle: '传感器设备',
  infoDesc: '传感器为只读设备，仅支持数据查询操作',
  largeButton: true,
  queryButtonText: '读取传感器数据',
  queryButtonIcon: '📊',
  temperatureLabel: '温度',
  temperatureUnit: '°C',
  humidityLabel: '湿度',
  humidityUnit: '%',
  pm25Label: 'PM2.5',
  pm25Unit: 'μg/m³',
  co2Label: 'CO2',
  co2Unit: 'ppm',
  updateTimeLabel: '更新时间',
  pollingEnabledText: '已启用',
  pollingDisabledText: '未启用',
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

// 传感器数据
interface SensorData {
  temperature?: number;
  humidity?: number;
  pm25?: number;
  co2?: number;
  updateTime?: string;
}

const sensorData = ref<SensorData | null>(null);

// 生成基础 Task 对象
const createBaseTask = (): Omit<Task, 'commandLine' | 'args'> => ({
  priority: props.priority,
  deviceType: 'Sensor',
  deviceId: props.device.id,
});

// ========== 控制处理 ==========

// 查询数据 - 返回单个 Task
const handleQuery = () => {
  const tasks: Task[] = [{
    ...createBaseTask(),
    commandLine: SENSOR_COMMANDS.REQUEST_DATA,
    args: [props.device.address, props.device.selfId],
  }];
  
  loading.value = true;
  
  emit('execute', tasks, (success) => {
    loading.value = false;
    if (success) {
      console.log('传感器数据查询已发送');
      // Demo 模式下模拟数据
      simulateDataReceived();
    }
  });
};

// 模拟数据接收（实际项目中通过回调或 WebSocket 更新）
const simulateDataReceived = () => {
  setTimeout(() => {
    sensorData.value = {
      temperature: Number((20 + Math.random() * 10).toFixed(1)),
      humidity: Number((40 + Math.random() * 30).toFixed(1)),
      pm25: Math.floor(Math.random() * 100),
      co2: Math.floor(400 + Math.random() * 600),
      updateTime: new Date().toLocaleString(),
    };
  }, 500);
};

// 暴露方法
defineExpose({
  // 刷新状态（查询数据）
  refreshStatus: () => {
    const tasks: Task[] = [{
      ...createBaseTask(),
      commandLine: SENSOR_COMMANDS.REQUEST_DATA,
      args: [props.device.address, props.device.selfId],
    }];
    emit('execute', tasks);
  },
  // 获取/设置数据
  getData: () => sensorData.value,
  setData: (data: SensorData) => {
    sensorData.value = data;
  },
  clearData: () => {
    sensorData.value = null;
  },
  // 生成控制 Task
  generateTasks: (command: 'queryStatus'): Task[] => {
    if (command === 'queryStatus') {
      return [{
        ...createBaseTask(),
        commandLine: SENSOR_COMMANDS.REQUEST_DATA,
        args: [props.device.address, props.device.selfId],
      }];
    }
    return [];
  },
});
</script>

<style scoped>
.sensor-control {
  padding: 16px;
}

.info-alert {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 14px;
  font-weight: 600;
  color: #096dd9;
  margin-bottom: 4px;
}

.info-desc {
  font-size: 13px;
  color: #1890ff;
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

.query-section {
  display: flex;
  justify-content: center;
  padding: 20px 0;
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
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-large {
  padding: 18px 36px;
  font-size: 16px;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
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

.data-display {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.data-card {
  background: linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%);
  border: 1px solid #b7eb8f;
  border-radius: 12px;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.data-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.data-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.data-value {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
}

.update-time {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: #999;
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

.info-value.enabled {
  color: #52c41a;
}
</style>
