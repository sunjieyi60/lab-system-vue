<template>
  <div class="gateway-management">
    <!-- RS485 网关列表 -->
    <el-card class="gateway-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon><Connection /></el-icon>
            <span>RS485 网关</span>
            <el-tag type="success" size="small">可用</el-tag>
          </div>
          <el-button type="primary" size="small" :icon="Plus" @click="handleCreateRS485">
            创建网关
          </el-button>
        </div>
      </template>

      <el-table :data="rs485GatewayList" style="width: 100%" :border="true">
        <el-table-column prop="gatewayName" label="网关名称" min-width="150" />
        <el-table-column prop="laboratoryName" label="所属实验室" min-width="120">
          <template #default="{ row }">
            {{ getLabName(row.laboratoryId) }}
          </template>
        </el-table-column>
        <el-table-column prop="sendTopic" label="发送主题" min-width="180">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.sendTopic }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="acceptTopic" label="接收主题" min-width="180">
          <template #default="{ row }">
            <el-tag size="small" type="success">{{ row.acceptTopic }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="handleDeleteRS485(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="rs485GatewayList.length === 0" description="暂无RS485网关" />
    </el-card>

    <!-- Socket 网关列表 -->
    <el-card class="gateway-card" shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon><Link /></el-icon>
            <span>Socket 网关</span>
            <el-tag type="warning" size="small">未实现</el-tag>
          </div>
          <el-button type="primary" size="small" :icon="Plus" disabled @click="handleCreateSocket">
            创建网关
          </el-button>
        </div>
      </template>

      <el-alert
        title="Socket 网关功能尚未实现"
        type="warning"
        :closable="false"
        description="Socket 网关功能正在开发中，请使用 RS485 网关进行设备管理。"
      />

      <el-table
        :data="socketGatewayList"
        style="width: 100%; margin-top: 16px"
        :border="true"
        disabled
      >
        <el-table-column prop="gatewayName" label="网关名称" min-width="150" />
        <el-table-column prop="laboratoryName" label="所属实验室" min-width="120">
          <template #default="{ row }">
            {{ getLabName(row.laboratoryId) }}
          </template>
        </el-table-column>
        <el-table-column prop="mac" label="MAC地址" min-width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ row.mac }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" min-width="120">
          <template #default="{ row }">
            <el-tag size="small" type="success">{{ row.ip }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" disabled @click="handleDeleteSocket(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建 RS485 网关对话框 -->
    <el-dialog
      v-model="showRS485Dialog"
      title="创建 RS485 网关"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="rs485FormRef"
        :model="rs485Form"
        :rules="rs485Rules"
        label-width="100px"
      >
        <el-form-item label="网关名称" prop="gatewayName">
          <el-input v-model="rs485Form.gatewayName" placeholder="如：RS485-1" />
        </el-form-item>

        <el-form-item label="所属实验室" prop="belongToLaboratoryId">
          <el-select
            v-model="rs485Form.belongToLaboratoryId"
            placeholder="请选择实验室"
            style="width: 100%"
          >
            <el-option
              v-for="lab in laboratories"
              :key="lab.id"
              :label="lab.laboratoryName || lab.laboratoryId"
              :value="lab.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="发送主题" prop="sendTopic">
          <el-input v-model="rs485Form.sendTopic" placeholder="如：lab/rs485/send1">
            <template #append>
              <el-tooltip content="用于向设备发送控制指令">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="接收主题" prop="acceptTopic">
          <el-input v-model="rs485Form.acceptTopic" placeholder="如：lab/rs485/accept1">
            <template #append>
              <el-tooltip content="用于接收设备上报数据">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showRS485Dialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleRS485Submit">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Connection, Link, Plus, InfoFilled } from '@element-plus/icons-vue'
import type { Laboratory, Rs485GatewayVo, SocketGatewayVo } from '../types/device'

// ============================================
// Props & Emits
// ============================================
const props = defineProps<{
  laboratories: Laboratory[]
  rs485Gateways: Rs485GatewayVo[]
  socketGateways?: SocketGatewayVo[]
}>()

const emit = defineEmits<{
  refresh: []
  'create-rs485': [data: {
    gatewayName: string
    sendTopic: string
    acceptTopic: string
    belongToLaboratoryId: number
  }]
  'delete-rs485': [gatewayId: number]
}>()

// ============================================
// 状态
// ============================================
const showRS485Dialog = ref(false)
const submitting = ref(false)
const rs485FormRef = ref<FormInstance>()

// RS485 表单数据
const rs485Form = reactive({
  gatewayName: '',
  sendTopic: 'lab/rs485/send',
  acceptTopic: 'lab/rs485/accept',
  belongToLaboratoryId: undefined as number | undefined,
})

// ============================================
// 计算属性
// ============================================
const rs485GatewayList = computed(() => props.rs485Gateways)
const socketGatewayList = computed(() => props.socketGateways || [])

// 表单验证规则
const rs485Rules: FormRules = {
  gatewayName: [
    { required: true, message: '请输入网关名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  belongToLaboratoryId: [
    { required: true, message: '请选择所属实验室', trigger: 'change' },
  ],
  sendTopic: [
    { required: true, message: '请输入发送主题', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_/]+$/, message: '主题只能包含字母、数字、下划线和斜杠', trigger: 'blur' },
  ],
  acceptTopic: [
    { required: true, message: '请输入接收主题', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_/]+$/, message: '主题只能包含字母、数字、下划线和斜杠', trigger: 'blur' },
  ],
}

// ============================================
// 方法
// ============================================
function getLabName(labId: number): string {
  const lab = props.laboratories.find((l) => l.id === labId)
  return lab?.laboratoryName || lab?.laboratoryId || `实验室${labId}`
}

function handleCreateRS485() {
  // 重置表单
  rs485Form.gatewayName = ''
  rs485Form.sendTopic = 'lab/rs485/send'
  rs485Form.acceptTopic = 'lab/rs485/accept'
  rs485Form.belongToLaboratoryId = undefined
  showRS485Dialog.value = true
}

function handleCreateSocket() {
  ElMessage.warning('Socket 网关功能尚未实现')
}

async function handleRS485Submit() {
  if (!rs485FormRef.value) return

  await rs485FormRef.value.validate((valid: boolean) => {
    if (!valid) return

    submitting.value = true
    emit('create-rs485', {
      gatewayName: rs485Form.gatewayName,
      sendTopic: rs485Form.sendTopic,
      acceptTopic: rs485Form.acceptTopic,
      belongToLaboratoryId: rs485Form.belongToLaboratoryId!,
    })
    submitting.value = false
    showRS485Dialog.value = false
  })
}

async function handleDeleteRS485(row: Rs485GatewayVo) {
  try {
    await ElMessageBox.confirm(
      `确定要删除网关 "${row.gatewayName}" 吗？\n删除网关会级联删除关联的设备。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    emit('delete-rs485', row.gatewayId)
  } catch {
    // 用户取消
  }
}

function handleDeleteSocket(_row: SocketGatewayVo) {
  // Socket gateway not implemented
}
</script>

<style scoped>
.gateway-management {
  padding: 0 0 20px;
}

.gateway-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.header-title .el-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}
</style>
