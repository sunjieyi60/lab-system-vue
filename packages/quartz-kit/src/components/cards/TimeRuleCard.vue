<template>
  <el-card class="form-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-icon><Calendar /></el-icon>
        <span>时间规则</span>
      </div>
    </template>
    
    <!-- 第一行：学期 + 周次范围 -->
    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="学期（可选）">
          <el-select
            v-model="timeRule.semesterId"
            placeholder="选择学期以启用周次"
            clearable
            style="width: 100%"
            @change="handleSemesterChange"
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
        <el-form-item label="开始周">
          <el-input-number
            v-model="timeRule.startWeek"
            :min="1"
            :max="25"
            :disabled="!hasSemester"
            placeholder="选择学期后可用"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="结束周">
          <el-input-number
            v-model="timeRule.endWeek"
            :min="timeRule.startWeek"
            :max="25"
            :disabled="!hasSemester"
            placeholder="选择学期后可用"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 第二行：单双周 + 生效星期 -->
    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="单双周">
          <el-select 
            v-model="timeRule.weekType" 
            style="width: 100%"
            :disabled="!hasSemester"
          >
            <el-option label="全部" value="Both" />
            <el-option label="单周" value="Single" />
            <el-option label="双周" value="Double" />
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

    <!-- 第三行：日内时段 -->
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
import { computed, watch } from 'vue'
import { Calendar } from '@element-plus/icons-vue'
import type { TimeRule, Semester } from '../../types/quartz'

const props = defineProps<{
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

// 是否已选择学期（仅控制周次相关字段）
const hasSemester = computed(() => {
  return !!props.timeRule.semesterId && props.timeRule.semesterId > 0
})

// 学期切换处理
function handleSemesterChange(semesterId: number | '') {
  if (semesterId) {
    // 选择学期后，设置周次默认值
    props.timeRule.semesterId = semesterId
    props.timeRule.startWeek = 1
    props.timeRule.endWeek = 16
    props.timeRule.weekType = 'Both'
  } else {
    // 清除学期时，仅重置周次相关字段
    props.timeRule.semesterId = undefined
    props.timeRule.startWeek = 1
    props.timeRule.endWeek = 16
    props.timeRule.weekType = 'Both'
    // 注意：weekdays 和 timeRange 不受影响！
  }
}

// 确保 weekdays 有默认值
watch(() => props.timeRule.weekdays, (val) => {
  if (!val || val.length === 0) {
    props.timeRule.weekdays = [1, 2, 3, 4, 5]
  }
}, { immediate: true })
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
