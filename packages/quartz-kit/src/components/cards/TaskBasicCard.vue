<template>
  <el-card class="form-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-icon><Timer /></el-icon>
        <span>任务主体</span>
      </div>
    </template>
    
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="任务名称" required>
          <el-input
            v-model="task.taskName"
            placeholder="请输入任务名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Cron表达式" required>
          <el-input
            v-model="task.cron"
            placeholder="例如: 0 0 * * * ?"
          >
            <template #append>
              <el-dropdown @command="handleCronSelect">
                <el-button type="primary">
                  常用<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item 
                      v-for="opt in cronOptions" 
                      :key="opt.value" 
                      :command="opt.value"
                    >
                      {{ opt.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-input>
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
import { Timer, ArrowDown } from '@element-plus/icons-vue'
import type { ScheduleTask } from '../../types/quartz'

const props = defineProps<{
  task: ScheduleTask
  modelValue: [string, string]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: [string, string]]
}>()

const dateRange = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const cronOptions = [
  { label: '每小时', value: '0 0 * * * ?' },
  { label: '每天', value: '0 0 0 * * ?' },
  { label: '每周一', value: '0 0 0 * * 1' },
  { label: '每月1号', value: '0 0 0 1 * ?' },
]

function handleCronSelect(cron: string) {
  props.task.cron = cron
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
