# Control Kit - 设备控制组件库

基于 Lab System 设备控制 Skill 规范实现的 Vue3 组件库，支持空调、门禁、照明、断路器、传感器等设备的控制。

## 📦 安装

```bash
# 在 apps 项目中安装
npm install control-kit

# 或作为本地依赖
npm install file:../packages/control-kit
```

## 🚀 快速开始

### 全局注册

```typescript
import { createApp } from 'vue';
import ControlKit from 'control-kit';
import 'control-kit/dist/style.css';

const app = createApp(App);
app.use(ControlKit);
```

### 按需导入

```vue
<template>
  <DeviceControlPanel
    :devices="devices"
    :priority="'NORMAL'"
    @execute="handleExecute"
  />
</template>

<script setup lang="ts">
import { DeviceControlPanel } from 'control-kit';
import type { Task, DeviceUnion } from 'control-kit';
import 'control-kit/dist/style.css';

const devices = [
  {
    id: 1,
    deviceName: '空调-01',
    deviceType: 'AirCondition',
    address: 1,
    selfId: 1,
    rs485GatewayId: 1,
    groupId: 'AC-01',
    isLock: false,
    belongToLaboratoryId: 1,
    pollingEnabled: true,
  }
];

/**
 * 处理执行指令 - 接收 Task[] 数组
 * @param tasks 任务列表（支持批量控制）
 * @param device 当前控制的设备
 * @param callback 执行结果回调
 */
const handleExecute = (
  tasks: Task[],
  device: DeviceUnion,
  callback: (success: boolean, message?: string) => void
) => {
  console.log('生成的 Task 列表:', tasks);
  
  // 批量发送指令（Promise.all）
  Promise.all(
    tasks.map(task => 
      fetch('/api/device/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      })
    )
  )
  .then(() => callback(true, '指令发送成功'))
  .catch(() => callback(false, '指令发送失败'));
};
</script>
```

## 📖 组件说明

### DeviceControlPanel

统一设备控制面板，集成所有设备类型的控制组件。

#### Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| title | string | '设备控制面板' | 面板标题 |
| subtitle | string | - | 副标题 |
| **priority** | Priority | 'NORMAL' | 全局任务优先级 |
| showHeader | boolean | true | 是否显示头部 |
| devices | DeviceUnion[] | [] | 设备列表 |
| loading | boolean | false | 加载状态 |
| showLog | boolean | true | 是否显示操作日志 |
| acConfig | object | {} | 空调组件配置 |
| accessConfig | object | {} | 门禁组件配置 |
| lightConfig | object | {} | 照明组件配置 |
| circuitConfig | object | {} | 断路器组件配置 |
| sensorConfig | object | {} | 传感器组件配置 |

#### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| **execute** | (tasks: Task[], device: DeviceUnion, callback) | 执行指令事件 |
| typeChange | (type) | 设备类型变化 |
| deviceChange | (device) | 设备选择变化 |

#### Task 对象结构

```typescript
interface Task {
  priority: 'NORMAL' | 'AUTOMATIC' | 'POLLING';  // 优先级
  deviceType: DeviceType;                          // 设备类型
  deviceId: number;                                // 设备ID
  commandLine: string;                             // 指令名称
  args: number[];                                  // 指令参数
}
```

### 优先级说明

- **NORMAL**: 用户操作，最高优先级
- **AUTOMATIC**: 自动任务
- **POLLING**: 轮询任务，最低优先级

## ⚙️ 配置说明

### 全局优先级配置

通过 `priority` prop 设置所有生成 Task 的优先级：

```vue
<DeviceControlPanel
  :devices="devices"
  priority="AUTOMATIC"
  @execute="handleExecute"
/>
```

### 空调控制组件 (AirConditionControl) 配置

```typescript
const acConfig = {
  // === 模块显示控制 ===
  showLockWarning: true,
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
  
  // ... 更多配置
};
```

### 门禁控制组件 (AccessControl) 配置

```typescript
const accessConfig = {
  showSingleControl: true,
  showPersistControl: true,
  showDelayControl: true,
  // ... 更多配置
};
```

### 照明控制组件 (LightControl) 配置

```typescript
const lightConfig = {
  showMainSwitch: true,
  showQuickActions: true,
  // ... 更多配置
};
```

### 断路器控制组件 (CircuitBreakControl) 配置

```typescript
const circuitConfig = {
  showWarning: true,
  showStatus: true,
  showConfirmDialog: true,
  // ... 更多配置
};
```

### 传感器控制组件 (SensorControl) 配置

```typescript
const sensorConfig = {
  showInfoAlert: true,
  showQuerySection: true,
  showDataDisplay: true,
  // ... 更多配置
};
```

## 📝 使用示例

### 设置任务优先级

```vue
<DeviceControlPanel
  :devices="devices"
  priority="NORMAL"
  :ac-config="{
    showQuickActions: true,
    showEnhancedControl: false,
  }"
  @execute="handleExecute"
/>
```

### 批量发送指令

```typescript
const handleExecute = async (tasks: Task[], device: DeviceUnion, callback: Function) => {
  try {
    // 批量发送所有指令
    const results = await Promise.all(
      tasks.map(task => 
        axios.post('/api/device/control', task)
      )
    );
    
    // 检查是否全部成功
    const allSuccess = results.every(r => r.data.code === 200);
    callback(allSuccess, allSuccess ? '全部指令发送成功' : '部分指令失败');
  } catch (error) {
    callback(false, '网络错误');
  }
};
```

### 串行发送指令

```typescript
const handleExecute = async (tasks: Task[], device: DeviceUnion, callback: Function) => {
  try {
    // 串行发送，一个接一个
    for (const task of tasks) {
      await axios.post('/api/device/control', task);
    }
    
    callback(true, '指令序列发送成功');
  } catch (error) {
    callback(false, '指令发送失败');
  }
};
```

### 简化模式 + 高优先级

```vue
<DeviceControlPanel
  :devices="devices"
  priority="NORMAL"
  :ac-config="{
    showQuickActions: true,
    showEnhancedControl: false,
    showDeviceInfo: false,
    powerOnText: '开启',
    powerOffText: '关闭',
  }"
  @execute="handleExecute"
/>
```

## 🔌 独立使用控制组件

也可以单独使用某个设备的控制组件，直接传入 `priority`：

```vue
<template>
  <AirConditionControl
    :device="acDevice"
    priority="AUTOMATIC"
    :show-quick-actions="false"
    :show-enhanced-control="true"
    @execute="handleExecute"
  />
</template>

<script setup>
import { AirConditionControl } from 'control-kit';
import type { Task } from 'control-kit';

const acDevice = {
  id: 1,
  deviceName: '空调-01',
  deviceType: 'AirCondition',
  address: 1,
  selfId: 1,
  rs485GatewayId: 1,
  groupId: 'AC-01',
  isLock: false,
  belongToLaboratoryId: 1,
  pollingEnabled: true,
};

const handleExecute = (tasks: Task[], callback) => {
  console.log('Task 列表:', tasks);
  // tasks[0].priority === 'AUTOMATIC'
  
  // 发送指令...
  callback(true);
};
</script>
```

## 🏗️ 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build
```

## 📄 License

MIT
