<template>
  <div class="demo-page">
    <header class="demo-header">
      <h1>🎛️ Control Kit - 设备控制组件库</h1>
      <p>基于 Lab System 设备控制 Skill 规范的 Vue3 组件库演示</p>
    </header>

    <main class="demo-content">
      <!-- 左侧：组件演示 -->
      <section class="demo-section">
        <div class="section-header">
          <h2>完整控制面板</h2>
          <span class="section-tag">DeviceControlPanel</span>
        </div>
        
        <DeviceControlPanel
          title="实验室设备控制"
          subtitle="选择设备并发送控制指令"
          :devices="mockDevices"
          :loading="loading"
          :priority="priority"
          :ac-config="acConfig"
          :access-config="accessConfig"
          :light-config="lightConfig"
          :circuit-config="circuitConfig"
          :sensor-config="sensorConfig"
          show-log
          @execute="handleExecute"
        />
      </section>

      <!-- 右侧：配置面板 -->
      <aside class="demo-aside">
        <!-- 全局配置 -->
        <div class="demo-card">
          <div class="card-header">
            <h3>⚙️ 全局配置</h3>
          </div>
          <div class="config-section">
            <label class="config-label">任务优先级 (priority):</label>
            <div class="config-options">
              <label class="config-radio">
                <input v-model="priority" type="radio" value="NORMAL">
                <span>NORMAL (用户操作)</span>
              </label>
              <label class="config-radio">
                <input v-model="priority" type="radio" value="AUTOMATIC">
                <span>AUTOMATIC (自动任务)</span>
              </label>
              <label class="config-radio">
                <input v-model="priority" type="radio" value="POLLING">
                <span>POLLING (轮询)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 配置选择器 -->
        <div class="demo-card">
          <div class="card-header">
            <h3>🎨 显示配置</h3>
          </div>
          <div class="config-section">
            <label class="config-label">选择演示配置:</label>
            <div class="config-options">
              <label class="config-radio">
                <input v-model="demoConfig" type="radio" value="full">
                <span>完整显示</span>
              </label>
              <label class="config-radio">
                <input v-model="demoConfig" type="radio" value="simple">
                <span>简化模式</span>
              </label>
              <label class="config-radio">
                <input v-model="demoConfig" type="radio" value="custom">
                <span>自定义配置</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 空调配置示例 -->
        <div v-if="demoConfig === 'custom'" class="demo-card">
          <div class="card-header">
            <h3>❄️ 空调配置示例</h3>
          </div>
          <div class="config-list">
            <label class="config-item">
              <input v-model="acConfig.showQuickActions" type="checkbox">
              <span>显示快速操作</span>
            </label>
            <label class="config-item">
              <input v-model="acConfig.showEnhancedControl" type="checkbox">
              <span>显示增强控制</span>
            </label>
            <label class="config-item">
              <input v-model="acConfig.showDeviceInfo" type="checkbox">
              <span>显示设备信息</span>
            </label>
          </div>
        </div>

        <!-- 门禁配置示例 -->
        <div v-if="demoConfig === 'custom'" class="demo-card">
          <div class="card-header">
            <h3>🚪 门禁配置示例</h3>
          </div>
          <div class="config-list">
            <label class="config-item">
              <input v-model="accessConfig.showSingleControl" type="checkbox">
              <span>显示单次控制</span>
            </label>
            <label class="config-item">
              <input v-model="accessConfig.showPersistControl" type="checkbox">
              <span>显示持续状态设置</span>
            </label>
            <label class="config-item" style="padding-left: 20px;">
              <input v-model="accessConfig.showStateSelector" type="checkbox">
              <span>显示状态选择</span>
            </label>
            <label class="config-item" style="padding-left: 20px;">
              <input v-model="accessConfig.showLockSelector" type="checkbox">
              <span>显示锁定选择</span>
            </label>
            <label class="config-item">
              <input v-model="accessConfig.showDelayControl" type="checkbox">
              <span>显示延时设置</span>
            </label>
            <label class="config-item">
              <input v-model="accessConfig.showDeviceInfo" type="checkbox">
              <span>显示设备信息</span>
            </label>
          </div>
        </div>

        <!-- 指令日志 -->
        <div class="demo-card log-card">
          <div class="card-header">
            <h3>📋 指令日志</h3>
            <button class="clear-btn" @click="clearLogs">清空</button>
          </div>
          <div class="log-container">
            <div v-if="logs.length === 0" class="empty-logs">暂无指令记录</div>
            <div v-for="(log, index) in logs" :key="index" class="log-entry" :class="log.level">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-msg">{{ log.message }}</span>
            </div>
          </div>
        </div>

        <!-- API 说明 -->
        <div class="demo-card api-card">
          <div class="card-header">
            <h3>📚 使用示例</h3>
          </div>
          <div class="code-block">
            <pre><code>// 父组件接收 Task[] 数组
const handleExecute = (
  tasks: Task[],
  device: DeviceUnion,
  callback: Function
) => {
  // 批量发送指令（Promise.all）
  Promise.all(
    tasks.map(task => 
      fetch('/api/device/control', {
        method: 'POST',
        body: JSON.stringify(task)
      })
    )
  )
  .then(() => callback(true))
  .catch(() => callback(false))
}</code></pre>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import DeviceControlPanel from './DeviceControlPanel.vue';
import type { DeviceUnion, Task, Priority } from '../types/device';

const loading = ref(false);
const logs = ref<{ time: string; message: string; level: string }[]>([]);

// 全局优先级
const priority = ref<Priority>('NORMAL');

// 演示配置
const demoConfig = ref<'full' | 'simple' | 'custom'>('full');

// 空调配置
const acConfig = ref<Record<string, any>>({
  showQuickActions: true,
  showEnhancedControl: true,
  showDeviceInfo: true,
  showPowerSwitch: true,
  showMode: true,
  showTemperature: true,
  showSpeed: true,
});

// 门禁配置
const accessConfig = ref<Record<string, any>>({
  showSingleControl: true,
  showPersistControl: true,
  showStateSelector: true,
  showLockSelector: true,
  showDelayControl: true,
  showDeviceInfo: true,
});

// 照明配置
const lightConfig = ref({});

// 断路器配置
const circuitConfig = ref({});

// 传感器配置
const sensorConfig = ref({});

// 监听配置变化
watch(demoConfig, (val) => {
  if (val === 'full') {
    acConfig.value = {
      showQuickActions: true,
      showEnhancedControl: true,
      showDeviceInfo: true,
      showPowerSwitch: true,
      showMode: true,
      showTemperature: true,
      showSpeed: true,
    };
    accessConfig.value = {
      showSingleControl: true,
      showPersistControl: true,
      showStateSelector: true,
      showLockSelector: true,
      showDelayControl: true,
      showDeviceInfo: true,
    };
  } else if (val === 'simple') {
    acConfig.value = {
      showQuickActions: true,
      showEnhancedControl: false,
      showDeviceInfo: false,
    };
    accessConfig.value = {
      showSingleControl: true,
      showPersistControl: false,
      showStateSelector: false,
      showLockSelector: false,
      showDelayControl: false,
      showDeviceInfo: false,
    };
  }
});

// Mock 设备数据
const mockDevices: DeviceUnion[] = [
  {
    id: 1,
    deviceName: '实验室空调-01',
    deviceType: 'AirCondition',
    belongToLaboratoryId: 1,
    pollingEnabled: true,
    address: 1,
    selfId: 1,
    rs485GatewayId: 1,
    groupId: 'AC-01',
    isLock: false,
  },
  {
    id: 2,
    deviceName: '实验室空调-02(锁定)',
    deviceType: 'AirCondition',
    belongToLaboratoryId: 1,
    pollingEnabled: true,
    address: 1,
    selfId: 2,
    rs485GatewayId: 1,
    groupId: 'AC-01',
    isLock: true,
  },
  {
    id: 3,
    deviceName: '前门门禁',
    deviceType: 'Access',
    belongToLaboratoryId: 1,
    pollingEnabled: true,
    address: 2,
    rs485GatewayId: 1,
    isLock: false,
  },
  {
    id: 4,
    deviceName: '主照明灯',
    deviceType: 'Light',
    belongToLaboratoryId: 1,
    pollingEnabled: true,
    address: 3,
    selfId: 1,
    rs485GatewayId: 1,
    isLock: false,
  },
  {
    id: 5,
    deviceName: '总断路器',
    deviceType: 'CircuitBreak',
    belongToLaboratoryId: 1,
    pollingEnabled: true,
    address: 4,
    rs485GatewayId: 1,
  },
  {
    id: 6,
    deviceName: '环境传感器',
    deviceType: 'Sensor',
    belongToLaboratoryId: 1,
    pollingEnabled: true,
    address: 5,
    selfId: 1,
    rs485GatewayId: 1,
  },
];

/**
 * 处理执行指令
 * @param tasks Task[] 任务列表
 * @param device 当前设备
 * @param callback 执行结果回调
 */
const handleExecute = (
  tasks: Task[],
  device: DeviceUnion,
  callback: (success: boolean, message?: string) => void
) => {
  loading.value = true;
  
  // 打印完整的 payload 到控制台
  console.log('========== 生成的 Task Payload ==========');
  console.log('设备:', device.deviceName, `(ID: ${device.id})`);
  console.log('任务数量:', tasks.length);
  console.log('Tasks:', JSON.parse(JSON.stringify(tasks)));
  console.log('=========================================');
  
  // 模拟批量发送指令
  setTimeout(() => {
    loading.value = false;
    const success = Math.random() > 0.1;
    
    // 记录每个 task
    tasks.forEach(task => {
      logs.value.unshift({
        time: new Date().toLocaleTimeString(),
        message: `[${device.deviceName}] ${task.commandLine} (priority: ${task.priority}) ${success ? '✓' : '✗'}`,
        level: success ? 'success' : 'error',
      });
    });
    
    callback(success, success ? '指令发送成功' : '指令发送失败');
  }, 500);
};

const clearLogs = () => {
  logs.value = [];
};
</script>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: #f0f2f5;
}

.demo-header {
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  color: white;
  padding: 40px;
  text-align: center;
}

.demo-header h1 {
  margin: 0 0 12px;
  font-size: 32px;
}

.demo-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.demo-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.demo-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
}

.section-tag {
  padding: 4px 12px;
  background: #1890ff;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.demo-aside {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.demo-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}

.card-header h3 {
  margin: 0;
  font-size: 15px;
}

.config-section {
  padding: 16px 20px;
}

.config-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.config-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.config-radio:hover {
  border-color: #1890ff;
  background: #f6fffe;
}

.config-radio input {
  margin: 0;
}

.config-list {
  padding: 12px 20px;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
  font-size: 13px;
}

.config-item input {
  margin: 0;
}

.clear-btn {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  cursor: pointer;
}

.clear-btn:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
}

.empty-logs {
  text-align: center;
  color: #999;
  padding: 40px;
}

.log-entry {
  padding: 8px 12px;
  font-size: 12px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}

.log-time {
  color: #999;
  font-family: monospace;
  flex-shrink: 0;
}

.log-entry.success {
  color: #52c41a;
}

.log-entry.error {
  color: #ff4d4f;
}

.code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
}

.code-block code {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

@media (max-width: 1024px) {
  .demo-content {
    grid-template-columns: 1fr;
  }
}
</style>
