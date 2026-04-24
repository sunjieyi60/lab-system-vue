<template>
  <div class="cron-picker" ref="pickerRef">
    <!-- 触发区域 -->
    <div class="cron-trigger" @click="togglePanel">
      <el-input
        :model-value="modelValue"
        placeholder="例如: 0 0 * * * ?"
        readonly
        class="cron-input"
      >
        <template #suffix>
          <el-icon class="cron-icon" :class="{ 'is-open': panelVisible }"><Clock /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 下拉面板 -->
    <transition name="el-zoom-in-top">
      <div
        v-show="panelVisible"
        class="cron-dropdown-panel"
      >
        <div class="cron-panel">
          <!-- 快捷选择 -->
          <div class="cron-section">
            <div class="section-title">快捷选择</div>
            <div class="quick-options">
              <el-tag
                v-for="opt in quickOptions"
                :key="opt.value"
                :type="modelValue === opt.value ? 'primary' : 'info'"
                class="quick-tag"
                effect="light"
                @click="selectQuick(opt.value)"
              >
                {{ opt.label }}
              </el-tag>
            </div>
          </div>

          <el-divider />

          <!-- 自定义选择 -->
          <div class="cron-section">
            <div class="section-title">自定义</div>
            <el-tabs v-model="activeTab" type="border-card">
              <!-- 秒 -->
              <el-tab-pane label="秒" name="second">
                <div class="tab-content">
                  <el-radio-group v-model="secondType" size="small">
                    <el-radio-button label="every">每秒</el-radio-button>
                    <el-radio-button label="range">范围</el-radio-button>
                    <el-radio-button label="interval">间隔</el-radio-button>
                    <el-radio-button label="specific">指定</el-radio-button>
                  </el-radio-group>
                  <div class="tab-config">
                    <template v-if="secondType === 'every'">
                      <span class="config-desc">每秒执行</span>
                    </template>
                    <template v-if="secondType === 'range'">
                      <el-input-number v-model="secondRangeStart" :min="0" :max="59" size="small" />
                      <span class="config-sep">-</span>
                      <el-input-number v-model="secondRangeEnd" :min="0" :max="59" size="small" />
                      <span class="config-desc">秒</span>
                    </template>
                    <template v-if="secondType === 'interval'">
                      <span class="config-desc">从</span>
                      <el-input-number v-model="secondIntervalStart" :min="0" :max="59" size="small" />
                      <span class="config-desc">秒开始，每</span>
                      <el-input-number v-model="secondIntervalStep" :min="1" :max="59" size="small" />
                      <span class="config-desc">秒执行</span>
                    </template>
                    <template v-if="secondType === 'specific'">
                      <el-select-v2
                        v-model="secondSpecific"
                        :options="secondOptions"
                        placeholder="选择秒"
                        multiple
                        collapse-tags
                        style="width: 100%"
                      />
                    </template>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 分钟 -->
              <el-tab-pane label="分" name="minute">
                <div class="tab-content">
                  <el-radio-group v-model="minuteType" size="small">
                    <el-radio-button label="every">每分</el-radio-button>
                    <el-radio-button label="range">范围</el-radio-button>
                    <el-radio-button label="interval">间隔</el-radio-button>
                    <el-radio-button label="specific">指定</el-radio-button>
                  </el-radio-group>
                  <div class="tab-config">
                    <template v-if="minuteType === 'every'">
                      <span class="config-desc">每分钟执行</span>
                    </template>
                    <template v-if="minuteType === 'range'">
                      <el-input-number v-model="minuteRangeStart" :min="0" :max="59" size="small" />
                      <span class="config-sep">-</span>
                      <el-input-number v-model="minuteRangeEnd" :min="0" :max="59" size="small" />
                      <span class="config-desc">分</span>
                    </template>
                    <template v-if="minuteType === 'interval'">
                      <span class="config-desc">从</span>
                      <el-input-number v-model="minuteIntervalStart" :min="0" :max="59" size="small" />
                      <span class="config-desc">分开始，每</span>
                      <el-input-number v-model="minuteIntervalStep" :min="1" :max="59" size="small" />
                      <span class="config-desc">分执行</span>
                    </template>
                    <template v-if="minuteType === 'specific'">
                      <el-select-v2
                        v-model="minuteSpecific"
                        :options="minuteOptions"
                        placeholder="选择分钟"
                        multiple
                        collapse-tags
                        style="width: 100%"
                      />
                    </template>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 小时 -->
              <el-tab-pane label="时" name="hour">
                <div class="tab-content">
                  <el-radio-group v-model="hourType" size="small">
                    <el-radio-button label="every">每小时</el-radio-button>
                    <el-radio-button label="range">范围</el-radio-button>
                    <el-radio-button label="interval">间隔</el-radio-button>
                    <el-radio-button label="specific">指定</el-radio-button>
                  </el-radio-group>
                  <div class="tab-config">
                    <template v-if="hourType === 'every'">
                      <span class="config-desc">每小时执行</span>
                    </template>
                    <template v-if="hourType === 'range'">
                      <el-input-number v-model="hourRangeStart" :min="0" :max="23" size="small" />
                      <span class="config-sep">-</span>
                      <el-input-number v-model="hourRangeEnd" :min="0" :max="23" size="small" />
                      <span class="config-desc">时</span>
                    </template>
                    <template v-if="hourType === 'interval'">
                      <span class="config-desc">从</span>
                      <el-input-number v-model="hourIntervalStart" :min="0" :max="23" size="small" />
                      <span class="config-desc">时开始，每</span>
                      <el-input-number v-model="hourIntervalStep" :min="1" :max="23" size="small" />
                      <span class="config-desc">小时执行</span>
                    </template>
                    <template v-if="hourType === 'specific'">
                      <el-select-v2
                        v-model="hourSpecific"
                        :options="hourOptions"
                        placeholder="选择小时"
                        multiple
                        collapse-tags
                        style="width: 100%"
                      />
                    </template>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 日 -->
              <el-tab-pane label="日" name="day">
                <div class="tab-content">
                  <el-radio-group v-model="dayType" size="small">
                    <el-radio-button label="every">每日</el-radio-button>
                    <el-radio-button label="range">范围</el-radio-button>
                    <el-radio-button label="interval">间隔</el-radio-button>
                    <el-radio-button label="specific">指定</el-radio-button>
                    <el-radio-button label="last">最后一日</el-radio-button>
                  </el-radio-group>
                  <div class="tab-config">
                    <template v-if="dayType === 'every'">
                      <span class="config-desc">每日执行</span>
                    </template>
                    <template v-if="dayType === 'range'">
                      <el-input-number v-model="dayRangeStart" :min="1" :max="31" size="small" />
                      <span class="config-sep">-</span>
                      <el-input-number v-model="dayRangeEnd" :min="1" :max="31" size="small" />
                      <span class="config-desc">日</span>
                    </template>
                    <template v-if="dayType === 'interval'">
                      <span class="config-desc">从</span>
                      <el-input-number v-model="dayIntervalStart" :min="1" :max="31" size="small" />
                      <span class="config-desc">日开始，每</span>
                      <el-input-number v-model="dayIntervalStep" :min="1" :max="31" size="small" />
                      <span class="config-desc">天执行</span>
                    </template>
                    <template v-if="dayType === 'specific'">
                      <el-select-v2
                        v-model="daySpecific"
                        :options="dayOptions"
                        placeholder="选择日期"
                        multiple
                        collapse-tags
                        style="width: 100%"
                      />
                    </template>
                    <template v-if="dayType === 'last'">
                      <span class="config-desc">每月最后一日执行</span>
                    </template>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 月 -->
              <el-tab-pane label="月" name="month">
                <div class="tab-content">
                  <el-radio-group v-model="monthType" size="small">
                    <el-radio-button label="every">每月</el-radio-button>
                    <el-radio-button label="range">范围</el-radio-button>
                    <el-radio-button label="interval">间隔</el-radio-button>
                    <el-radio-button label="specific">指定</el-radio-button>
                  </el-radio-group>
                  <div class="tab-config">
                    <template v-if="monthType === 'every'">
                      <span class="config-desc">每月执行</span>
                    </template>
                    <template v-if="monthType === 'range'">
                      <el-input-number v-model="monthRangeStart" :min="1" :max="12" size="small" />
                      <span class="config-sep">-</span>
                      <el-input-number v-model="monthRangeEnd" :min="1" :max="12" size="small" />
                      <span class="config-desc">月</span>
                    </template>
                    <template v-if="monthType === 'interval'">
                      <span class="config-desc">从</span>
                      <el-input-number v-model="monthIntervalStart" :min="1" :max="12" size="small" />
                      <span class="config-desc">月开始，每</span>
                      <el-input-number v-model="monthIntervalStep" :min="1" :max="12" size="small" />
                      <span class="config-desc">月执行</span>
                    </template>
                    <template v-if="monthType === 'specific'">
                      <el-select-v2
                        v-model="monthSpecific"
                        :options="monthOptions"
                        placeholder="选择月份"
                        multiple
                        collapse-tags
                        style="width: 100%"
                      />
                    </template>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 周 -->
              <el-tab-pane label="周" name="week">
                <div class="tab-content">
                  <el-radio-group v-model="weekType" size="small">
                    <el-radio-button label="every">每周</el-radio-button>
                    <el-radio-button label="specific">指定</el-radio-button>
                    <el-radio-button label="last">最后一周</el-radio-button>
                  </el-radio-group>
                  <div class="tab-config">
                    <template v-if="weekType === 'every'">
                      <span class="config-desc">每周执行</span>
                    </template>
                    <template v-if="weekType === 'specific'">
                      <el-select-v2
                        v-model="weekSpecific"
                        :options="weekOptions"
                        placeholder="选择星期"
                        multiple
                        collapse-tags
                        style="width: 100%"
                      />
                    </template>
                    <template v-if="weekType === 'last'">
                      <span class="config-desc">每月最后一周执行</span>
                    </template>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>

          <!-- 底部显示 -->
          <el-divider />
          <div class="cron-footer">
            <div class="cron-preview">
              <span class="preview-label">Cron表达式:</span>
              <el-tag type="primary" size="large" effect="dark">{{ generatedCron }}</el-tag>
            </div>
            <div class="cron-desc">{{ cronDescription }}</div>
            <div class="cron-actions">
              <el-button @click="panelVisible = false">取消</el-button>
              <el-button type="primary" @click="confirm">确定</el-button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Clock } from '@element-plus/icons-vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// DOM 引用
const pickerRef = ref<HTMLElement>()

// 面板显示状态
const panelVisible = ref(false)

// 当前激活的标签页
const activeTab = ref('second')

// 快捷选项
const quickOptions = [
  { label: '每秒', value: '* * * * * ?' },
  { label: '每5秒', value: '*/5 * * * * ?' },
  { label: '每10秒', value: '*/10 * * * * ?' },
  { label: '每30秒', value: '*/30 * * * * ?' },
  { label: '每分钟', value: '0 * * * * ?' },
  { label: '每5分钟', value: '0 */5 * * * ?' },
  { label: '每10分钟', value: '0 */10 * * * ?' },
  { label: '每30分钟', value: '0 */30 * * * ?' },
  { label: '每小时', value: '0 0 * * * ?' },
  { label: '每天0点', value: '0 0 0 * * ?' },
  { label: '每天8点', value: '0 0 8 * * ?' },
  { label: '每天12点', value: '0 0 12 * * ?' },
  { label: '每天18点', value: '0 0 18 * * ?' },
  { label: '每周一', value: '0 0 0 * * 1' },
  { label: '每月1号', value: '0 0 0 1 * ?' },
  { label: '每月15号', value: '0 0 0 15 * ?' },
]

// 生成选项数组
const generateOptions = (start: number, end: number) => {
  return Array.from({ length: end - start + 1 }, (_, i) => ({
    value: i + start,
    label: String(i + start).padStart(2, '0'),
  }))
}

const secondOptions = generateOptions(0, 59)
const minuteOptions = generateOptions(0, 59)
const hourOptions = generateOptions(0, 23)
const dayOptions = generateOptions(1, 31)
const monthOptions = generateOptions(1, 12)
const weekOptions = [
  { value: 1, label: '周日' },
  { value: 2, label: '周一' },
  { value: 3, label: '周二' },
  { value: 4, label: '周三' },
  { value: 5, label: '周四' },
  { value: 6, label: '周五' },
  { value: 7, label: '周六' },
]

// 秒配置
const secondType = ref('every')
const secondRangeStart = ref(0)
const secondRangeEnd = ref(59)
const secondIntervalStart = ref(0)
const secondIntervalStep = ref(5)
const secondSpecific = ref<number[]>([0])

// 分配置
const minuteType = ref('every')
const minuteRangeStart = ref(0)
const minuteRangeEnd = ref(59)
const minuteIntervalStart = ref(0)
const minuteIntervalStep = ref(5)
const minuteSpecific = ref<number[]>([0])

// 时配置
const hourType = ref('every')
const hourRangeStart = ref(0)
const hourRangeEnd = ref(23)
const hourIntervalStart = ref(0)
const hourIntervalStep = ref(1)
const hourSpecific = ref<number[]>([0])

// 日配置
const dayType = ref('every')
const dayRangeStart = ref(1)
const dayRangeEnd = ref(31)
const dayIntervalStart = ref(1)
const dayIntervalStep = ref(1)
const daySpecific = ref<number[]>([1])

// 月配置
const monthType = ref('every')
const monthRangeStart = ref(1)
const monthRangeEnd = ref(12)
const monthIntervalStart = ref(1)
const monthIntervalStep = ref(1)
const monthSpecific = ref<number[]>([1])

// 周配置
const weekType = ref('every')
const weekSpecific = ref<number[]>([1])

// 点击外部关闭面板
const handleClickOutside = (e: MouseEvent) => {
  if (pickerRef.value && !pickerRef.value.contains(e.target as Node)) {
    panelVisible.value = false
  }
}

// 切换面板
const togglePanel = () => {
  panelVisible.value = !panelVisible.value
}

// 生成 cron 表达式各部分
const generatePart = (type: string, every: string, rangeStart: number, rangeEnd: number, intervalStart: number, intervalStep: number, specific: number[]) => {
  switch (type) {
    case 'every':
      return every
    case 'range':
      return `${rangeStart}-${rangeEnd}`
    case 'interval':
      return `${intervalStart}/${intervalStep}`
    case 'specific':
      return specific.join(',')
    case 'last':
      return 'L'
    default:
      return every
  }
}

// 计算生成的 cron 表达式
const generatedCron = computed(() => {
  const second = generatePart(secondType.value, '*', secondRangeStart.value, secondRangeEnd.value, secondIntervalStart.value, secondIntervalStep.value, secondSpecific.value)
  const minute = generatePart(minuteType.value, '*', minuteRangeStart.value, minuteRangeEnd.value, minuteIntervalStart.value, minuteIntervalStep.value, minuteSpecific.value)
  const hour = generatePart(hourType.value, '*', hourRangeStart.value, hourRangeEnd.value, hourIntervalStart.value, hourIntervalStep.value, hourSpecific.value)
  const day = generatePart(dayType.value, '*', dayRangeStart.value, dayRangeEnd.value, dayIntervalStart.value, dayIntervalStep.value, daySpecific.value)
  const month = generatePart(monthType.value, '*', monthRangeStart.value, monthRangeEnd.value, monthIntervalStart.value, monthIntervalStep.value, monthSpecific.value)
  const week = weekType.value === 'every' ? '?' : weekType.value === 'last' ? 'L' : weekSpecific.value.join(',')
  
  return `${second} ${minute} ${hour} ${day} ${month} ${week}`
})

// Cron 描述
const cronDescription = computed(() => {
  const descMap: Record<string, string> = {
    '* * * * * ?': '每秒执行',
    '0 * * * * ?': '每分钟执行',
    '0 0 * * * ?': '每小时执行',
    '0 0 0 * * ?': '每天0点执行',
    '0 0 0 * * 1': '每周一0点执行',
    '0 0 0 1 * ?': '每月1日0点执行',
  }
  return descMap[generatedCron.value] || '自定义执行规则'
})

// 选择快捷选项
const selectQuick = (value: string) => {
  emit('update:modelValue', value)
  parseCronToConfig(value)
}

// 确定
const confirm = () => {
  emit('update:modelValue', generatedCron.value)
  panelVisible.value = false
}

// 解析单个 cron 字段
const parseCronPart = (
  part: string,
  typeRef: any,
  rangeStartRef: any,
  rangeEndRef: any,
  intervalStartRef: any,
  intervalStepRef: any,
  specificRef: any
) => {
  if (part === '*' || part === '?') {
    typeRef.value = 'every'
  } else if (part.includes('/')) {
    typeRef.value = 'interval'
    const [start, step] = part.split('/')
    intervalStartRef.value = parseInt(start) || 0
    intervalStepRef.value = parseInt(step) || 1
  } else if (part.includes('-')) {
    typeRef.value = 'range'
    const [start, end] = part.split('-')
    rangeStartRef.value = parseInt(start) || 0
    rangeEndRef.value = parseInt(end) || 0
  } else if (part.includes(',')) {
    typeRef.value = 'specific'
    specificRef.value = part.split(',').map((s: string) => parseInt(s))
  } else if (part === 'L') {
    typeRef.value = 'last'
  } else {
    typeRef.value = 'specific'
    specificRef.value = [parseInt(part)]
  }
}

// 解析 cron 表达式到配置
const parseCronToConfig = (cron: string) => {
  const parts = cron.split(' ')
  if (parts.length !== 6) return

  const [second, minute, hour, day, month, week] = parts

  // 解析秒
  parseCronPart(second, secondType, secondRangeStart, secondRangeEnd, secondIntervalStart, secondIntervalStep, secondSpecific)

  // 解析分
  parseCronPart(minute, minuteType, minuteRangeStart, minuteRangeEnd, minuteIntervalStart, minuteIntervalStep, minuteSpecific)

  // 解析时
  parseCronPart(hour, hourType, hourRangeStart, hourRangeEnd, hourIntervalStart, hourIntervalStep, hourSpecific)

  // 解析日
  parseCronPart(day, dayType, dayRangeStart, dayRangeEnd, dayIntervalStart, dayIntervalStep, daySpecific)

  // 解析月
  parseCronPart(month, monthType, monthRangeStart, monthRangeEnd, monthIntervalStart, monthIntervalStep, monthSpecific)

  // 解析周
  if (week === '?' || week === '*') {
    weekType.value = 'every'
  } else if (week === 'L') {
    weekType.value = 'last'
  } else if (week.includes(',')) {
    weekType.value = 'specific'
    weekSpecific.value = week.split(',').map(s => parseInt(s))
  } else {
    weekType.value = 'specific'
    weekSpecific.value = [parseInt(week)]
  }
}

// 监听模型值变化
watch(() => props.modelValue, (val) => {
  parseCronToConfig(val)
}, { immediate: true })

// 添加/移除点击外部监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.cron-picker {
  position: relative;
  width: 100%;
}

.cron-trigger {
  cursor: pointer;
  width: 100%;
}

.cron-input {
  pointer-events: none;
}

.cron-input :deep(.el-input__wrapper) {
  cursor: pointer;
}

.cron-icon {
  transition: transform 0.3s;
  color: #909399;
}

.cron-icon.is-open {
  transform: rotate(180deg);
  color: #409eff;
}

.cron-dropdown-panel {
  position: fixed;
  z-index: 2000;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
  width: auto;
  left: 10%;
  right: 10%;
  top: 3.5rem;
}

.cron-panel {
  padding: 16px;
  max-height: 600px;
  overflow-y: auto;
}

.cron-section {
  margin-bottom: 16px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.quick-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-tag {
  cursor: pointer;
}

.tab-content {
  padding: 16px;
}

.tab-config {
  margin-top: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.config-sep {
  margin: 0 4px;
  color: #909399;
}

.config-desc {
  color: #606266;
  font-size: 14px;
}

.cron-footer {
  padding-top: 10px;
}

.cron-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.preview-label {
  font-weight: 600;
  color: #303133;
}

.cron-desc {
  color: #909399;
  font-size: 13px;
  margin-bottom: 16px;
}

.cron-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
