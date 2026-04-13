<template>
  <el-dialog
    :title="mode === 'create' ? '新增网关' : '编辑网关'"
    v-model="visible"
    width="500px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="网关名称" prop="gatewayName">
        <el-input v-model="formData.gatewayName" placeholder="请输入网关名称" />
      </el-form-item>

      <el-form-item label="所属实验室" prop="laboratoryId">
        <el-select v-model="formData.laboratoryId" placeholder="请选择实验室" style="width: 100%">
          <el-option
            v-for="lab in laboratories"
            :key="lab.id"
            :label="lab.laboratoryName"
            :value="lab.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="发送主题" prop="sendTopic">
        <el-input v-model="formData.sendTopic" placeholder="请输入MQTT发送主题" />
      </el-form-item>

      <el-form-item label="接收主题" prop="acceptTopic">
        <el-input v-model="formData.acceptTopic" placeholder="请输入MQTT接收主题" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

interface Laboratory {
  id: number
  laboratoryName: string
  laboratoryId: string
}

interface Props {
  visible: boolean
  mode: 'create' | 'edit'
  initialData?: any
  laboratories: Laboratory[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: any]
}>()

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
})

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
const formData = ref({
  gatewayId: undefined as number | undefined,
  gatewayName: '',
  laboratoryId: undefined as number | undefined,
  sendTopic: '',
  acceptTopic: '',
})

// 表单校验规则
const formRules: FormRules = {
  gatewayName: [
    { required: true, message: '请输入网关名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  laboratoryId: [
    { required: true, message: '请选择所属实验室', trigger: 'change' },
  ],
  sendTopic: [
    { required: true, message: '请输入发送主题', trigger: 'blur' },
  ],
  acceptTopic: [
    { required: true, message: '请输入接收主题', trigger: 'blur' },
  ],
}

// 监听初始数据变化
watch(
  () => props.initialData,
  (data) => {
    if (data) {
      formData.value = {
        gatewayId: data.gatewayId,
        gatewayName: data.gatewayName,
        laboratoryId: data.laboratoryId,
        sendTopic: data.sendTopic,
        acceptTopic: data.acceptTopic,
      }
    } else {
      formData.value = {
        gatewayId: undefined,
        gatewayName: '',
        laboratoryId: undefined,
        sendTopic: '',
        acceptTopic: '',
      }
    }
  },
  { immediate: true },
)

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      emit('submit', { ...formData.value })
    } else {
      ElMessage.warning('请检查表单填写是否正确')
    }
  })
}
</script>
