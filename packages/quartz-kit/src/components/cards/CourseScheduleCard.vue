<template>
  <el-card class="form-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-icon><Calendar /></el-icon>
        <span>课表任务生成配置</span>
        <el-tag type="info" effect="plain" size="small" style="margin-left: 8px">
          根据课表自动创建定时任务
        </el-tag>
      </div>
    </template>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="选择学期" required>
          <el-select
            v-model="selectedSemester"
            placeholder="请选择学期"
            style="width: 100%"
          >
            <el-option
              v-for="semester in semesters"
              :key="semester.id"
              :label="semester.name"
              :value="semester.id"
            />
          </el-select>
          <div class="semester-hint">
            根据选定学期的课表生成定时任务
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="选择实验室" required>
          <el-select
            v-model="selectedLabs"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择要生成任务的实验室（可多选）"
            style="width: 100%"
          >
            <el-option
              v-for="lab in laboratories"
              :key="lab.id"
              :label="lab.laboratoryName || lab.laboratoryId"
              :value="lab.id"
            />
          </el-select>
          <div class="lab-hint">
            将根据所选实验室关联的课表生成定时任务
          </div>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="检查频率 (Cron)" required>
          <CronPicker v-model="formData.cron" />
          <div class="cron-hint">
            默认每5分钟检查一次课表，根据课表时间自动触发任务
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="任务状态">
          <el-switch
            v-model="formData.enable"
            active-text="启用"
            inactive-text="禁用"
          />
          <div class="enable-hint">
            启用后，生成的任务将按课表自动执行
          </div>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="提前执行时间">
          <el-input-number
            v-model="formData.earlyStart"
            :min="0"
            :max="60"
            :step="1"
            style="width: 100%"
          >
            <template #suffix>分钟</template>
          </el-input-number>
          <div class="time-hint">
            课程开始前提前执行的时间（默认7分钟）
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="延迟结束时间">
          <el-input-number
            v-model="formData.delayEnd"
            :min="0"
            :max="60"
            :step="1"
            style="width: 100%"
          >
            <template #suffix>分钟</template>
          </el-input-number>
          <div class="time-hint">
            课程结束后延迟执行的时间（默认7分钟）
          </div>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-alert
          title="任务生成说明"
          type="info"
          :closable="false"
        >
          <template #default>
            <ul class="info-list">
              <li>任务名称格式：{课程名}-实验室{labId}-第{startWeek}-{endWeek}周-第{startSection}-{endSection}节-{星期}</li>
              <li>每个课程将生成独立的定时任务，支持按周次、星期自动循环</li>
              <li>生成的任务可在任务列表中单独管理和编辑</li>
            </ul>
          </template>
        </el-alert>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar } from '@element-plus/icons-vue'
import CronPicker from '../CronPicker.vue'

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

const props = defineProps<{
  modelValue: CourseScheduleFormData
  laboratories: Laboratory[]
  semesters: Semester[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CourseScheduleFormData]
}>()

// 使用计算属性实现双向绑定
const formData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 实验室选择（多选）
const selectedLabs = computed({
  get: () => formData.value.laboratoryId,
  set: (val) => {
    formData.value.laboratoryId = val
  }
})

// 学期选择
const selectedSemester = computed({
  get: () => formData.value.semesterId,
  set: (val) => {
    formData.value.semesterId = val
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.card-header .el-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.lab-hint,
.cron-hint,
.enable-hint,
.time-hint,
.semester-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.info-list {
  margin: 8px 0;
  padding-left: 20px;
}

.info-list li {
  margin-bottom: 4px;
  line-height: 1.6;
}
</style>
