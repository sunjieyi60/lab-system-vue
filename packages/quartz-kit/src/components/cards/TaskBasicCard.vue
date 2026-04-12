<template>
  <el-card class="form-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-icon><Timer /></el-icon>
        <span>任务主体</span>
      </div>
    </template>
    
    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="任务名称" required>
          <el-input
            v-model="task.taskName"
            placeholder="请输入任务名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="所属实验室" required>
          <el-select
            v-model="task.laboratoryId"
            placeholder="选择实验室"
            style="width: 100%"
            :disabled="readonly"
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
      </el-col>
      <el-col :span="8">
        <el-form-item label="Cron表达式" required>
          <CronPicker v-model="task.cron" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-form-item label="生效日期范围" required>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="状态">
          <el-switch
            v-model="task.enable"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Timer } from '@element-plus/icons-vue'
import type { ScheduleTask } from '../../types/quartz'
import CronPicker from '../CronPicker.vue'

interface Laboratory {
  id: number
  laboratoryName?: string
  laboratoryId?: string
}

const props = defineProps<{
  task: ScheduleTask
  modelValue: [string, string]
  laboratories: Laboratory[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: [string, string]]
  'labChange': [labId: number]
}>()

const dateRange = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

function handleLabChange(labId: number) {
  emit('labChange', labId)
}
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
</style>
