<template>
  <div class="app">
    <header class="app-header">
      <h1>🕐 Quartz Kit - 定时任务表单组件</h1>
      <p class="subtitle">类 VForm 风格的实验室定时任务配置系统</p>
      
      <div class="mode-switch">
        <el-radio-group v-model="currentMode" size="large" fill="#409eff">
          <el-radio-button label="create">
            <el-icon><Plus /></el-icon> 新建模式
          </el-radio-button>
          <el-radio-button label="edit">
            <el-icon><Edit /></el-icon> 编辑模式
          </el-radio-button>
          <el-radio-button label="view">
            <el-icon><View /></el-icon> 查看模式
          </el-radio-button>
        </el-radio-group>
      </div>
    </header>

    <main class="app-main">
      <!-- 模式说明 -->
      <el-alert
        :title="modeTitle"
        :description="modeDescription"
        :type="modeAlertType"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      />

      <!-- 编辑/查看模式下的任务选择 -->
      <el-card v-if="currentMode !== 'create'" class="task-selector" shadow="never">
        <template #header>
          <span>选择要{{ currentMode === 'edit' ? '编辑' : '查看' }}的任务</span>
        </template>
        <el-select
          v-model="selectedTaskId"
          placeholder="选择任务"
          style="width: 400px"
          @change="onTaskSelect"
        >
          <el-option
            v-for="task in mockTasks"
            :key="task.task.id"
            :label="task.task.taskName"
            :value="task.task.id"
          />
        </el-select>
        <el-button
          v-if="currentMode === 'edit' && selectedTaskId"
          type="danger"
          :icon="Delete"
          style="margin-left: 12px"
          @click="deleteCurrentTask"
        >
          删除
        </el-button>
      </el-card>

      <!-- 主表单组件 -->
      <QuartzTaskForm
        ref="formRef"
        :mode="currentMode"
        :laboratory-id="1"
        :initial-value="currentInitialValue"
        :devices="mockDevices"
        :users="mockUsers"
        :semesters="mockSemesters"
        :loading="submitting"
        @submit="handleSubmit"
        @cancel="handleCancel"
        @change="handleChange"
      />

      <!-- 实时预览面板（仅在新建/编辑模式下显示） -->
      <el-card v-if="currentMode !== 'view'" class="payload-preview" shadow="never">
        <template #header>
          <div class="preview-header">
            <span>
              <el-icon><Document /></el-icon>
              Payload 实时预览
            </span>
            <el-button
              type="primary"
              link
              :icon="currentPayloadExpanded ? ArrowUp : ArrowDown"
              @click="currentPayloadExpanded = !currentPayloadExpanded"
            >
              {{ currentPayloadExpanded ? '收起' : '展开' }}
            </el-button>
          </div>
        </template>
        <el-collapse-transition>
          <div v-show="currentPayloadExpanded">
            <el-tabs v-model="previewTab">
              <el-tab-pane label="完整 JSON" name="json">
                <pre class="code-block">{{ formattedPayload }}</pre>
              </el-tab-pane>
              <el-tab-pane label="任务主体" name="task">
                <pre class="code-block">{{ formatSection('task') }}</pre>
              </el-tab-pane>
              <el-tab-pane label="时间规则" name="timeRule">
                <pre class="code-block">{{ formatSection('timeRule') }}</pre>
              </el-tab-pane>
              <el-tab-pane label="数据源" name="dataGroup">
                <pre class="code-block">{{ formatSection('dataGroup') }}</pre>
              </el-tab-pane>
              <el-tab-pane label="条件组" name="conditionGroups">
                <pre class="code-block">{{ formatSection('conditionGroups') }}</pre>
              </el-tab-pane>
              <el-tab-pane label="动作组" name="actionGroups">
                <pre class="code-block">{{ formatSection('actionGroups') }}</pre>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-collapse-transition>
      </el-card>

      <!-- 模拟服务器响应面板 -->
      <el-card v-if="serverResponse" class="response-panel" shadow="never">
        <template #header>
          <div class="response-header">
            <span>
              <el-icon><Check /></el-icon>
              模拟服务器响应
            </span>
            <el-tag :type="serverResponse.success ? 'success' : 'danger'">
              {{ serverResponse.success ? '成功' : '失败' }}
            </el-tag>
          </div>
        </template>
        <pre class="code-block">{{ JSON.stringify(serverResponse, null, 2) }}</pre>
      </el-card>
    </main>

    <!-- 页脚说明 -->
    <footer class="app-footer">
      <el-divider />
      <div class="footer-content">
        <h4>📦 组件架构说明</h4>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <el-icon><Collection /></el-icon>
                Composables
              </template>
              <ul>
                <li><code>useQuartzForm</code> - 表单状态管理</li>
                <li>响应式数据、操作方法</li>
                <li>ID同步、验证逻辑</li>
              </ul>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <el-icon><Grid /></el-icon>
                卡片组件
              </template>
              <ul>
                <li>TaskBasicCard - 任务主体</li>
                <li>TimeRuleCard - 时间规则</li>
                <li>DataSourceCard - 数据源</li>
                <li>ConditionCard - 条件配置</li>
                <li>ActionCard - 动作配置</li>
                <li>AlarmCard - 报警配置</li>
                <li>WatchDogCard - 看门狗</li>
              </ul>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <el-icon><Box /></el-icon>
                功能特性
              </template>
              <ul>
                <li>✅ 新建/编辑/查看三模式</li>
                <li>✅ 雪花ID自动生成</li>
                <li>✅ <strong>可视化条件编辑器</strong></li>
                <li>✅ 自动推断属性类型</li>
                <li>✅ 智能值输入组件</li>
                <li>✅ SpEL表达式自动生成</li>
                <li>✅ 设备参数智能配置</li>
                <li>✅ 表单验证</li>
              </ul>
            </el-card>
          </el-col>
        </el-row>

        <h4 style="margin-top: 30px">📝 使用示例</h4>
        <el-card shadow="never" class="code-example">
          <pre>&lt;QuartzTaskForm
  :mode="'create' | 'edit' | 'view'"
  :laboratory-id="1"
  :initial-value="existingTask"  &lt;!-- 编辑/查看模式 --&gt;
  :devices="deviceList"
  :users="userList"
  :semesters="semesterList"
  @submit="handleSubmit"          &lt;!-- { isCreate, data } --&gt;
  @cancel="handleCancel"
  @change="handleChange"
/&gt;</pre>
        </el-card>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Edit,
  View,
  Delete,
  Check,
  ArrowUp,
  ArrowDown,
  Document,
  Collection,
  Grid,
  Box,
} from '@element-plus/icons-vue'
import QuartzTaskForm from './components/QuartzTaskForm.vue'
import type {
  ScheduleConfigRoot,
  Device,
  User,
  Semester,
  FormMode,
} from './types/quartz'
import { DeviceType, CommandLine, ConditionGroupType, AlarmType, WeekType } from './types/quartz'
import { generateSnowflakeId } from './utils/snowflake'

// ============================================
// 模拟数据
// ============================================

const mockDevices: Device[] = [
  { id: 1, name: '空调-101', type: DeviceType.AirCondition, address: 1, selfId: 1 },
  { id: 2, name: '空调-102', type: DeviceType.AirCondition, address: 2, selfId: 1 },
  { id: 3, name: '空调-103', type: DeviceType.AirCondition, address: 3, selfId: 1 },
  { id: 4, name: '总闸-1', type: DeviceType.CircuitBreak, address: 10, selfId: 1 },
  { id: 5, name: '照明-前', type: DeviceType.Light, address: 20, selfId: 1 },
  { id: 6, name: '照明-后', type: DeviceType.Light, address: 21, selfId: 1 },
  { id: 7, name: '温湿度传感器-1', type: DeviceType.Sensor, address: 30, selfId: 1 },
  { id: 8, name: '温湿度传感器-2', type: DeviceType.Sensor, address: 31, selfId: 1 },
]

const mockUsers: User[] = [
  { id: 1, name: '张管理员', phone: '13800138000', email: 'admin@lab.com' },
  { id: 2, name: '李实验员', phone: '13800138001', email: 'tech@lab.com' },
  { id: 3, name: '王老师', phone: '13800138002', email: 'teacher@lab.com' },
]

const mockSemesters: Semester[] = [
  { id: 1, name: '2024-2025学年第一学期' },
  { id: 2, name: '2024-2025学年第二学期' },
  { id: 3, name: '2025-2026学年第一学期' },
]

function createMockTask(index: number): ScheduleConfigRoot {
  const taskId = generateSnowflakeId()
  const timeRuleId = generateSnowflakeId()
  const dataSourceId1 = generateSnowflakeId()
  const dataSourceId2 = generateSnowflakeId()
  const conditionGroupId = generateSnowflakeId()
  const conditionId = generateSnowflakeId()
  const actionGroupId = generateSnowflakeId()
  const actionId = generateSnowflakeId()
  const alarmId = generateSnowflakeId()

  return {
    task: {
      id: taskId,
      taskName: `定时任务示例-${index + 1}`,
      cron: index % 2 === 0 ? '0 0 8 * * ?' : '0 30 18 * * ?',
      enable: true,
      startDate: '2024-09-01',
      endDate: '2025-01-15',
      laboratoryId: 1,
    },
    timeRule: {
      id: timeRuleId,
      scheduleTaskId: taskId,
      semesterId: 1,
      weekdays: [1, 2, 3, 4, 5],
      startWeek: 1,
      endWeek: 16,
      weekType: WeekType.ALL,
      startTime: '08:00:00',
      endTime: '18:00:00',
    },
    dataGroup: [
      {
        id: dataSourceId1,
        scheduleTaskId: taskId,
        deviceId: 7,
        deviceType: DeviceType.Sensor,
      },
      {
        id: dataSourceId2,
        scheduleTaskId: taskId,
        deviceId: 8,
        deviceType: DeviceType.Sensor,
      },
    ],
    conditionGroups: [
      {
        id: conditionGroupId,
        scheduleTaskId: taskId,
        type: ConditionGroupType.ALL,
        conditions: [
          {
            id: conditionId,
            scheduleTaskId: taskId,
            conditionGroupId: conditionGroupId,
            expr: `#{${dataSourceId1}}.temperature > 30.0`,
            desc: '传感器温度超过30度',
          },
          {
            id: generateSnowflakeId(),
            scheduleTaskId: taskId,
            conditionGroupId: conditionGroupId,
            expr: `#{${dataSourceId1}}.smoke < 100`,
            desc: '烟雾浓度正常',
          },
        ],
      },
    ],
    actionGroups: [
      {
        id: actionGroupId,
        scheduleTaskId: taskId,
        conditionGroupId: conditionGroupId,
        actions: [
          {
            id: actionId,
            scheduleTaskId: taskId,
            actionGroupId: actionGroupId,
            deviceType: DeviceType.AirCondition,
            deviceId: 1,
            commandLine: CommandLine.ENHANCE_CONTROL_AIR_CONDITION,
            args: [1, 1, 1, 0, 24, 2],
          },
        ],
      },
    ],
    alarmGroup: [
      {
        id: alarmId,
        scheduleTaskId: taskId,
        userId: 1,
        type: AlarmType.SMS,
      },
    ],
    watchDog: {
      watchEnabled: true,
      watchIntervalSec: 30,
      watchTimeoutSec: 300,
      stopOnFirstSuccess: true,
    },
  }
}

const mockTasks = ref<ScheduleConfigRoot[]>([
  createMockTask(0),
  createMockTask(1),
  createMockTask(2),
])

// ============================================
// 状态管理
// ============================================
const currentMode = ref<FormMode>('create')
const selectedTaskId = ref<string>('')
const currentInitialValue = ref<ScheduleConfigRoot | undefined>(undefined)
const submitting = ref(false)
const currentPayload = ref<ScheduleConfigRoot | null>(null)
const currentPayloadExpanded = ref(true)
const previewTab = ref('json')
const serverResponse = ref<{ success: boolean; message: string; data?: any } | null>(null)
// formRef is defined on the component instance via template ref

// ============================================
// 计算属性
// ============================================
const modeTitle = computed(() => {
  const titles: Record<FormMode, string> = {
    create: '新建定时任务',
    edit: '编辑定时任务',
    view: '查看定时任务详情',
  }
  return titles[currentMode.value]
})

const modeDescription = computed(() => {
  const descs: Record<FormMode, string> = {
    create: '在此模式下，表单会生成新的雪花ID，提交时将创建新任务。您可以实时预览生成的Payload。',
    edit: '在此模式下，表单会保留原有ID，提交时将更新现有任务。所有关联ID会自动同步。',
    view: '在此模式下，表单为只读状态，仅用于查看任务详情。',
  }
  return descs[currentMode.value]
})

const modeAlertType = computed(() => {
  const types: Record<FormMode, 'info' | 'warning' | 'success'> = {
    create: 'info',
    edit: 'warning',
    view: 'success',
  }
  return types[currentMode.value]
})

const formattedPayload = computed(() => {
  if (!currentPayload.value) return '等待表单数据...'
  return JSON.stringify(currentPayload.value, null, 2)
})

// ============================================
// 方法
// ============================================
function formatSection(section: keyof ScheduleConfigRoot) {
  if (!currentPayload.value) return '无数据'
  const data = currentPayload.value[section]
  return JSON.stringify(data, null, 2)
}

function onTaskSelect(taskId: string) {
  const task = mockTasks.value.find(t => t.task.id === taskId)
  if (task) {
    currentInitialValue.value = JSON.parse(JSON.stringify(task))
    ElMessage.success(`已加载任务: ${task.task.taskName}`)
    serverResponse.value = null
  }
}

async function deleteCurrentTask() {
  if (!selectedTaskId.value) return
  
  try {
    await ElMessageBox.confirm(
      '确定要删除这个任务吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const index = mockTasks.value.findIndex(t => t.task.id === selectedTaskId.value)
    if (index > -1) {
      mockTasks.value.splice(index, 1)
      selectedTaskId.value = ''
      currentInitialValue.value = undefined
      ElMessage.success('任务已删除')
    }
  } catch {
    // 用户取消
  }
}

async function handleSubmit({ isCreate, data }: { isCreate: boolean; data: ScheduleConfigRoot }) {
  submitting.value = true
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  if (isCreate) {
    mockTasks.value.push(JSON.parse(JSON.stringify(data)))
    serverResponse.value = {
      success: true,
      message: '任务创建成功',
      data: {
        taskId: data.task.id,
        createdAt: new Date().toISOString(),
      },
    }
    ElMessage.success('任务创建成功！')
  } else {
    const index = mockTasks.value.findIndex(t => t.task.id === data.task.id)
    if (index > -1) {
      mockTasks.value[index] = JSON.parse(JSON.stringify(data))
    }
    serverResponse.value = {
      success: true,
      message: '任务更新成功',
      data: {
        taskId: data.task.id,
        updatedAt: new Date().toISOString(),
      },
    }
    ElMessage.success('任务更新成功！')
  }
  
  submitting.value = false
}

function handleCancel() {
  ElMessage.info('操作已取消')
  serverResponse.value = null
}

function handleChange(data: ScheduleConfigRoot) {
  currentPayload.value = data
}

// 监听模式切换
watch(currentMode, (newMode) => {
  serverResponse.value = null
  if (newMode === 'create') {
    selectedTaskId.value = ''
    currentInitialValue.value = undefined
  } else {
    if (mockTasks.value.length > 0 && !selectedTaskId.value) {
      selectedTaskId.value = mockTasks.value[0].task.id
      onTaskSelect(selectedTaskId.value)
    }
  }
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.app-header {
  background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
  color: white;
  padding: 40px 20px;
  text-align: center;
}

.app-header h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 600;
}

.subtitle {
  margin: 0 0 24px 0;
  opacity: 0.9;
  font-size: 16px;
}

.mode-switch {
  margin-top: 20px;
}

.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.task-selector {
  margin-bottom: 20px;
}

.payload-preview,
.response-panel {
  margin-top: 20px;
}

.preview-header,
.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.response-header {
  gap: 12px;
}

.code-block {
  background-color: #282c34;
  color: #abb2bf;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}

.app-footer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.footer-content {
  padding: 20px 0;
}

.footer-content h4 {
  margin-bottom: 20px;
  color: #303133;
}

.footer-content ul {
  margin: 0;
  padding-left: 20px;
  color: #606266;
}

.footer-content li {
  margin-bottom: 8px;
}

.code-example {
  background-color: #282c34;
}

.code-example pre {
  margin: 0;
  color: #abb2bf;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

:deep(.el-card__header) {
  font-weight: 600;
}

:deep(.el-icon) {
  vertical-align: middle;
  margin-right: 4px;
}
</style>
