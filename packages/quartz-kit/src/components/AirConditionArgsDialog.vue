<template>
  <el-dialog
    v-model="visible"
    title="空调控制参数配置"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form label-width="100px">
      <el-form-item label="设备地址">
        <el-input-number v-model="formData.address" :min="0" :max="255" disabled />
      </el-form-item>
      <el-form-item label="子设备ID">
        <el-input-number v-model="formData.selfId" :min="0" :max="255" disabled />
      </el-form-item>
      <el-form-item label="开关">
        <el-radio-group v-model="formData.power">
          <el-radio-button :label="0">关闭</el-radio-button>
          <el-radio-button :label="1">开启</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="模式">
        <el-select v-model="formData.mode">
          <el-option label="制冷" :value="0" />
          <el-option label="制热" :value="1" />
          <el-option label="除湿" :value="2" />
          <el-option label="送风" :value="3" />
          <el-option label="自动" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="温度">
        <el-slider v-model="formData.temperature" :min="16" :max="30" show-stops />
        <span class="temp-display">{{ formData.temperature }}°C</span>
      </el-form-item>
      <el-form-item label="风速">
        <el-radio-group v-model="formData.fanSpeed">
          <el-radio-button :label="0">自动</el-radio-button>
          <el-radio-button :label="1">低</el-radio-button>
          <el-radio-button :label="2">中</el-radio-button>
          <el-radio-button :label="3">高</el-radio-button>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { AirConditionArgs } from '../types/quartz'

const props = defineProps<{
  modelValue: boolean
  initialArgs?: number[]
  defaultAddress?: number
  defaultSelfId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [args: number[]]
}>()

const visible = defineModel<boolean>('modelValue')

const formData = reactive<AirConditionArgs>({
  address: 1,
  selfId: 1,
  power: 1,
  mode: 4,
  temperature: 24,
  fanSpeed: 0,
})

// 监听对话框打开，初始化数据
watch(visible, (isOpen) => {
  if (isOpen) {
    if (props.initialArgs && props.initialArgs.length >= 5) {
      // 解析已有参数
      formData.address = props.initialArgs[0] || props.defaultAddress || 1
      formData.selfId = props.initialArgs[1] || props.defaultSelfId || 1
      formData.power = (props.initialArgs[2] as 0 | 1) || 1
      formData.mode = (props.initialArgs[3] as 0 | 1 | 2 | 3 | 4) || 4
      formData.temperature = props.initialArgs[4] || 24
      formData.fanSpeed = (props.initialArgs[5] as 0 | 1 | 2 | 3) || 0
    } else {
      // 使用默认值
      formData.address = props.defaultAddress || 1
      formData.selfId = props.defaultSelfId || 1
      formData.power = 1
      formData.mode = 4
      formData.temperature = 24
      formData.fanSpeed = 0
    }
  }
})

function handleCancel() {
  visible.value = false
}

function handleConfirm() {
  const args = [
    formData.address,
    formData.selfId,
    formData.power,
    formData.mode,
    formData.temperature,
    formData.fanSpeed,
  ]
  emit('confirm', args)
  visible.value = false
}
</script>

<style scoped>
.temp-display {
  margin-left: 12px;
  color: var(--el-text-color-secondary);
}
</style>
