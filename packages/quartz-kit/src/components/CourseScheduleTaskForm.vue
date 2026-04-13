<template>
  <div class="course-schedule-task-form">
    <el-form
      :model="formData"
      label-position="top"
      class="task-form"
    >
      <!-- 课表任务生成配置 -->
      <CourseScheduleCard
        v-model="formData"
        :laboratories="laboratories"
        :semesters="semesters"
      />

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          生成任务
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import CourseScheduleCard from './cards/CourseScheduleCard.vue'

interface Laboratory {
  id: number
  laboratoryName?: string
  laboratoryId?: string
}

interface Semester {
  id: number
  name: string
  startDate?: string
  endDate?: string
  totalWeeks?: number
}

interface CourseScheduleFormData {
  laboratoryId: number[]
  semesterId: number | undefined
  cron: string
  earlyStart: number
  delayEnd: number
  enable: boolean
}

// ============================================
// Props & Emits
// ============================================
defineProps<{
  laboratories: Laboratory[]
  semesters: Semester[]
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CourseScheduleFormData]
  cancel: []
}>()

// ============================================
// 表单状态
// ============================================

// 默认表单数据
const defaultFormData: CourseScheduleFormData = {
  laboratoryId: [],
  semesterId: undefined,
  cron: '0 0/5 * * * ?',
  earlyStart: 7,
  delayEnd: 7,
  enable: true
}

const formData = reactive<CourseScheduleFormData>({ ...defaultFormData })

// ============================================
// 表单验证
// ============================================
function validate(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!formData.semesterId) {
    errors.push('请选择学期')
  }

  if (!formData.laboratoryId || formData.laboratoryId.length === 0) {
    errors.push('请至少选择一个实验室')
  }

  if (!formData.cron || formData.cron.trim() === '') {
    errors.push('请输入Cron表达式')
  }

  if (formData.earlyStart < 0 || formData.earlyStart > 60) {
    errors.push('提前执行时间必须在0-60分钟之间')
  }

  if (formData.delayEnd < 0 || formData.delayEnd > 60) {
    errors.push('延迟结束时间必须在0-60分钟之间')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================
// 事件处理
// ============================================
function handleSubmit() {
  const { valid, errors } = validate()

  if (!valid) {
    errors.forEach(err => ElMessage.error(err))
    return
  }

  emit('submit', { ...formData })
}

function handleCancel() {
  emit('cancel')
}

function handleReset() {
  Object.assign(formData, defaultFormData)
  ElMessage.success('表单已重置')
}

// ============================================
// 暴露方法
// ============================================
defineExpose({
  getFormData: () => ({ ...formData }),
  validate: () => validate().valid,
  reset: handleReset
})
</script>

<style scoped>
.course-schedule-task-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
}
</style>
