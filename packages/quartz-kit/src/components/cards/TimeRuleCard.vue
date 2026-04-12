<template>
  <el-card class="form-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-icon><Calendar /></el-icon>
        <span>时间规则</span>
      </div>
    </template>
    
    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="学期" required>
          <el-select
            v-model="timeRule.semesterId"
            placeholder="选择学期"
            style="width: 100%"
          >
            <el-option
              v-for="sem in semesters"
              :key="sem.id"
              :label="sem.name"
              :value="sem.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="开始周" required>
          <el-input-number
            v-model="timeRule.startWeek"
            :min="1"
            :max="25"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="结束周" required>
          <el-input-number
            v-model="timeRule.endWeek"
            :min="timeRule.startWeek"
            :max="25"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="单双周" required>
          <el-select v-model="timeRule.weekType" style="width: 100%">
            <el-option label="全部" value="ALL" />
            <el-option label="单周" value="ODD" />
            <el-option label="双周" value="EVEN" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="16">
        <el-form-item label="生效星期" required>
          <el-checkbox-group v-model="timeRule.weekdays">
            <el-checkbox-button 
              v-for="day in weekdayOptions" 
              :key="day.value" 
              :label="day.value"
            >
              {{ day.label }}
            </el-checkbox-button>
          </el-checkbox-group>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-form-item label="日内时段范围">
          <el-time-picker
            v-model="timeRange"
            is-range
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar } from '@element-plus/icons-vue'
import type { TimeRule, Semester } from '../../types/quartz'

defineProps<{
  timeRule: TimeRule
  semesters: Semester[]
}>()

const timeRange = defineModel<[string | undefined, string | undefined]>('timeRange')

const weekdayOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
]
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
