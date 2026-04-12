# Quartz Kit - 定时任务表单组件

类 VForm 风格的实验室定时任务配置表单组件，支持新建、编辑、查看三种模式。

## 功能特性

- ✅ **三模式支持** - 新建(create) / 编辑(edit) / 查看(view)
- ✅ **雪花ID管理** - 自动生成和同步19位数字ID
- ✅ **SpEL表达式** - 条件配置支持 SpEL 语法
- ✅ **模块化设计** - 表单拆分为多个独立的卡片组件
- ✅ **类型安全** - 完整的 TypeScript 类型支持
- ✅ **表单验证** - 内置验证逻辑
- ✅ **实时预览** - Payload 实时生成和预览

## 快速开始

```vue
<template>
  <QuartzTaskForm
    mode="create"
    :laboratory-id="1"
    :devices="devices"
    :users="users"
    :semesters="semesters"
    @submit="handleSubmit"
    @cancel="handleCancel"
  />
</template>

<script setup lang="ts">
import { QuartzTaskForm } from './components'
import type { ScheduleConfigRoot, Device, User, Semester } from './types'

const devices: Device[] = [
  { id: 1, name: '空调-101', type: 'AirCondition', address: 1, selfId: 1 },
]

const users: User[] = [
  { id: 1, name: '管理员', phone: '13800138000' },
]

const semesters: Semester[] = [
  { id: 1, name: '2024-2025学年第一学期' },
]

function handleSubmit({ isCreate, data }: { isCreate: boolean; data: ScheduleConfigRoot }) {
  if (isCreate) {
    // POST /quartz/create
    console.log('创建任务:', data)
  } else {
    // PUT /quartz/update
    console.log('更新任务:', data)
  }
}

function handleCancel() {
  // 返回或关闭
}
</script>
```

## Props

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mode | 'create' \| 'edit' \| 'view' | 否 | 表单模式，默认 'create' |
| laboratoryId | number | 是 | 实验室ID |
| initialValue | ScheduleConfigRoot | 否 | 编辑/查看模式的初始数据 |
| devices | Device[] | 是 | 可用设备列表 |
| users | User[] | 是 | 可用用户列表 |
| semesters | Semester[] | 是 | 可用学期列表 |
| loading | boolean | 否 | 提交加载状态 |

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| submit | `{ isCreate, data }` | 表单提交时触发 |
| cancel | - | 取消时触发 |
| change | `data` | 表单数据变化时触发 |

## 组件架构

```
quartz-kit/
├── src/
│   ├── components/
│   │   ├── QuartzTaskForm.vue       # 主表单组件
│   │   ├── AirConditionArgsDialog.vue  # 空调参数对话框
│   │   └── cards/                   # 卡片子组件
│   │       ├── TaskBasicCard.vue    # 任务主体
│   │       ├── TimeRuleCard.vue     # 时间规则
│   │       ├── DataSourceCard.vue   # 数据源
│   │       ├── ConditionCard.vue    # 条件配置
│   │       ├── ActionCard.vue       # 动作配置
│   │       ├── AlarmCard.vue        # 报警配置
│   │       └── WatchDogCard.vue     # 看门狗配置
│   ├── composables/
│   │   └── useQuartzForm.ts         # 表单状态管理
│   ├── types/
│   │   └── quartz.ts                # 类型定义
│   └── utils/
│       └── snowflake.ts             # 雪花ID生成
```

## 核心类型

```typescript
interface ScheduleConfigRoot {
  task: ScheduleTask           // 任务主体
  timeRule: TimeRule           // 时间规则
  dataGroup: DataSource[]      // 数据源
  conditionGroups: ConditionGroup[]  // 条件组
  actionGroups: ActionGroup[]  // 动作组
  alarmGroup: Alarm[]          // 报警配置
  watchDog: WatchDog           // 看门狗
}
```

## SpEL 表达式

条件配置支持 SpEL 表达式，格式为：`#{dataSourceId}.property operator value`

示例：
- `#{1789569705678901234}.roomTemperature > 25` - 房间温度大于25度
- `#{1789569705678901234}.isOpen == false` - 空调处于关闭状态

## ID 同步策略

所有子实体通过 `scheduleTaskId` 关联到任务主体：

```
task.id
├── timeRule.scheduleTaskId = task.id
├── dataGroup[].scheduleTaskId = task.id
├── conditionGroups[].scheduleTaskId = task.id
│   └── conditions[].conditionGroupId = conditionGroups[].id
├── actionGroups[].scheduleTaskId = task.id
│   └── actions[].actionGroupId = actionGroups[].id
└── alarmGroup[].scheduleTaskId = task.id
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build
```

## 演示

运行 `npm run dev` 后访问 `http://localhost:5176/`，可以体验：

1. **新建模式** - 创建新的定时任务
2. **编辑模式** - 编辑已有任务（保留原ID）
3. **查看模式** - 只读查看任务详情
4. **Payload预览** - 实时查看生成的JSON数据
