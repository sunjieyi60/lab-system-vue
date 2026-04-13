<template>
  <el-dialog
    :title="mode === 'create' ? '新增设备' : '编辑设备'"
    v-model="visible"
    width="600px"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="handleClosed"
  >
  <div class="device-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      label-position="right"
    >
      <!-- 步骤1: 选择设备类型（仅创建模式） -->
      <template v-if="mode === 'create'">
        <el-form-item label="设备类型" prop="deviceType">
          <el-select
            v-model="formData.deviceType"
            placeholder="请选择设备类型"
            style="width: 100%"
            @change="handleTypeChange"
          >
            <el-option
              v-for="(label, type) in DeviceTypeName"
              :key="type"
              :label="label"
              :value="type"
            >
              <div class="device-type-option">
                <el-icon :size="18">
                  <component :is="getDeviceIcon(type as DeviceType)" />
                </el-icon>
                <span>{{ label }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </template>

      <!-- 编辑模式显示设备类型（只读） -->
      <template v-else>
        <el-form-item label="设备类型">
          <el-tag :type="getDeviceTypeTag(formData.deviceType as DeviceType)" size="large">
            {{ DeviceTypeName[formData.deviceType as DeviceType] }}
          </el-tag>
          <span class="form-tip">设备类型不可修改</span>
        </el-form-item>
      </template>

      <!-- 步骤2: 基础信息 -->
      <el-form-item label="设备名称" prop="deviceName">
        <el-input
          v-model="formData.deviceName"
          placeholder="请输入设备名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="所属实验室" prop="belongToLaboratoryId">
        <el-select
          v-model="formData.belongToLaboratoryId"
          placeholder="请选择实验室"
          style="width: 100%"
          @change="handleLabChange"
        >
          <el-option
            v-for="lab in laboratories"
            :key="lab.id"
            :label="lab.laboratoryName || lab.laboratoryId"
            :value="lab.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="机组ID" prop="groupId">
        <el-input
          v-model="formData.groupId"
          placeholder="请输入机组ID（选填）"
        />
        <span class="form-tip">用于多联机控制，如：group-01</span>
      </el-form-item>

      <!-- 步骤3: 通信配置（根据类型动态显示） -->
      <template v-if="formData.deviceType">
        <el-divider>通信配置</el-divider>

        <!-- 地址 -->
        <el-form-item label="设备地址" prop="address">
          <el-input-number
            v-model="formData.address"
            :min="getAddressRange(formData.deviceType)[0]"
            :max="getAddressRange(formData.deviceType)[1]"
            style="width: 100%"
            controls-position="right"
          />
          <span class="form-tip">
            有效范围：{{ getAddressRange(formData.deviceType).join(' - ') }}
          </span>
        </el-form-item>

        <!-- 编号（除断路器外都有） -->
        <el-form-item
          v-if="hasSelfId(formData.deviceType)"
          label="设备编号"
          prop="selfId"
        >
          <el-input-number
            v-model="formData.selfId"
            :min="0"
            :max="255"
            style="width: 100%"
            controls-position="right"
          />
          <span class="form-tip">同一地址下的设备编号</span>
        </el-form-item>

        <!-- RS485 网关 -->
        <el-form-item
          v-if="hasRs485Gateway(formData.deviceType)"
          label="RS485网关"
          prop="rs485GatewayId"
          :rules="[
            { required: !formData.socketGatewayId, message: '请选择RS485网关或Socket网关', trigger: 'change' }
          ]"
        >
          <el-select
            v-model="formData.rs485GatewayId"
            placeholder="请选择RS485网关"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="gateway in filteredRs485Gateways"
              :key="gateway.gatewayId"
              :label="gateway.gatewayName"
              :value="gateway.gatewayId"
            >
              <div class="gateway-option">
                <span>{{ gateway.gatewayName }}</span>
                <el-tag size="small" type="info">{{ gateway.acceptTopic }}</el-tag>
              </div>
            </el-option>
          </el-select>
          <span v-if="formData.deviceType === 'AirCondition'" class="form-tip">
            RS485网关和Socket网关至少选择一个
          </span>
        </el-form-item>

        <!-- Socket 网关（仅空调） -->
        <el-form-item
          v-if="hasSocketGateway(formData.deviceType)"
          label="Socket网关"
          prop="socketGatewayId"
        >
          <el-select
            v-model="formData.socketGatewayId"
            placeholder="请选择Socket网关（可选）"
            style="width: 100%"
            clearable
            disabled
          >
            <el-option
              v-for="gateway in filteredSocketGateways"
              :key="gateway.gatewayId"
              :label="gateway.gatewayName"
              :value="gateway.gatewayId"
            />
          </el-select>
          <span class="form-tip warning">⚠️ Socket网关功能尚未实现</span>
        </el-form-item>
      </template>

      <!-- 步骤4: 轮询配置 -->
      <el-divider>高级配置</el-divider>

      <el-form-item label="轮询检测">
        <el-switch
          v-model="formData.pollingEnabled"
          active-text="启用"
          inactive-text="禁用"
        />
        <span class="form-tip">启用后系统将自动轮询设备状态</span>
      </el-form-item>
    </el-form>

    <!-- 底部按钮 -->
    <div class="form-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ mode === 'create' ? '创建' : '保存' }}
      </el-button>
    </div>
  </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
// ElMessage not used
import type { FormInstance, FormRules } from 'element-plus'
import {
  Cpu,
  Lightning,
  Sunny,
  DataLine,
  Lock,
  Monitor,
} from '@element-plus/icons-vue'
import type { Component } from 'vue'
import type {
  DeviceType,
  Device,
  Laboratory,
  Rs485GatewayVo,
  SocketGatewayVo,
  FormMode,
  CreateDeviceDTO,
  UpdateDeviceDTO,
} from '../types/device'
import { DeviceTypeName, DeviceTypeConfig } from '../types/device'

// ============================================
// Props & Emits
// ============================================
const props = defineProps<{
  visible: boolean
  mode: FormMode
  initialData?: Device | null
  laboratories: Laboratory[]
  rs485Gateways: Rs485GatewayVo[]
  socketGateways: SocketGatewayVo[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: CreateDeviceDTO | UpdateDeviceDTO]
  cancel: []
}>()

// 对话框可见性
const visible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
})

// ============================================
// 状态
// ============================================
const formRef = ref<FormInstance>()
// Submit loading state
const submitting = ref(false)

// Default address for device type

// 表单数据
const formData = reactive({
  deviceId: 1 as number | undefined,
  deviceType: '' as DeviceType | '',
  deviceName: '',
  belongToLaboratoryId: undefined as number | undefined,
  groupId: '',
  address: undefined as number | undefined,
  selfId: 1,
  rs485GatewayId: undefined as number | undefined,
  socketGatewayId: undefined as number | undefined,
  pollingEnabled: true,
})

// ============================================
// 计算属性
// ============================================
const filteredRs485Gateways = computed(() => {
  if (!formData.belongToLaboratoryId) return []
  return props.rs485Gateways.filter(
    (g) => g.laboratoryId === formData.belongToLaboratoryId
  )
})

const filteredSocketGateways = computed(() => {
  if (!formData.belongToLaboratoryId) return []
  return props.socketGateways.filter(
    (g) => g.laboratoryId === formData.belongToLaboratoryId
  )
})

// 表单验证规则
const formRules: FormRules = {
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  deviceName: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  belongToLaboratoryId: [
    { required: true, message: '请选择所属实验室', trigger: 'change' },
  ],
  address: [{ required: true, message: '请输入设备地址', trigger: 'blur' }],
  selfId: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  rs485GatewayId: [
    { required: true, message: '请选择RS485网关', trigger: 'change' },
  ],
}

// ============================================
// 初始化
// ============================================
watch(
  () => props.initialData,
  (data) => {
    if (data && props.mode === 'edit') {
      const device = data as any
      formData.deviceType = device.deviceType as DeviceType
      formData.deviceName = device.deviceName
      formData.belongToLaboratoryId = device.belongToLaboratoryId
      formData.pollingEnabled = device.pollingEnabled
      formData.groupId = device.groupId || ''
      formData.address = device.address
      formData.selfId = device.selfId || 1
      formData.rs485GatewayId = device.rs485GatewayId
      formData.socketGatewayId = device.socketGatewayId
    }
  },
  { immediate: true }
)

// ============================================
// 方法
// ============================================
function getDeviceIcon(type: DeviceType): Component {
  const iconMap: Record<DeviceType, Component> = {
    AirCondition: Cpu,
    CircuitBreak: Lightning,
    Light: Sunny,
    Sensor: DataLine,
    Access: Lock,
  }
  return iconMap[type] || Monitor
}

function getDeviceTypeTag(type: DeviceType): string {
  const tagMap: Record<DeviceType, string> = {
    AirCondition: 'primary',
    CircuitBreak: 'warning',
    Light: 'success',
    Sensor: 'info',
    Access: 'danger',
  }
  return tagMap[type] || ''
}

function getAddressRange(type: DeviceType): [number, number] {
  return DeviceTypeConfig[type]?.addressRange || [0, 255]
}

function hasSelfId(type: DeviceType): boolean {
  return DeviceTypeConfig[type]?.hasSelfId || false
}

function hasRs485Gateway(type: DeviceType): boolean {
  return DeviceTypeConfig[type]?.hasRs485Gateway || false
}

function hasSocketGateway(type: DeviceType): boolean {
  return DeviceTypeConfig[type]?.hasSocketGateway || false
}

function handleTypeChange(type: DeviceType) {
  // 重置地址相关字段
  formData.address = getAddressRange(type)[0]
  if (hasSelfId(type)) {
    formData.selfId = 1
  } else {
    formData.selfId = undefined as any
  }
  // 重置网关
  formData.rs485GatewayId = undefined
  formData.socketGatewayId = undefined
}

function handleLabChange() {
  // 切换实验室时重置网关选择
  formData.rs485GatewayId = undefined
  formData.socketGatewayId = undefined
}

function handleCancel() {
  visible.value = false
  emit('cancel')
}

function handleClosed() {
  // 重置表单
  formRef.value?.resetFields()
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate((valid, fields) => {
    if (!valid) {
      console.log('验证失败:', fields)
      return
    }

    submitting.value = true

    try {
      if (props.mode === 'create') {
        const data: CreateDeviceDTO = {
          deviceType: formData.deviceType as DeviceType,
          deviceName: formData.deviceName,
          belongToLaboratoryId: formData.belongToLaboratoryId!,
          groupId: formData.groupId || undefined,
          address: formData.address!,
          selfId: formData.selfId,
          rs485GatewayId: formData.rs485GatewayId,
        } as CreateDeviceDTO

        // 断路器不需要 selfId
        if (formData.deviceType === 'CircuitBreak') {
          delete (data as any).selfId
        }

        // 空调可选 socketGatewayId
        if (formData.deviceType === 'AirCondition' && formData.socketGatewayId) {
          (data as any).socketGatewayId = formData.socketGatewayId
        }

        emit('submit', data)
      } else {
        // 编辑模式
        const data: UpdateDeviceDTO = {
          deviceId: props.initialData!.id,
          deviceName: formData.deviceName,
          pollingEnabled: formData.pollingEnabled,
        }
        emit('submit', data)
      }
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped>
.device-form {
  padding: 20px 0;
}

.device-type-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gateway-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}

.form-tip.warning {
  color: var(--el-color-warning);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
