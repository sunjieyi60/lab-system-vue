<template>
  <el-card class="form-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-icon><Filter /></el-icon>
        <span>条件配置</span>
        <el-tag type="info" effect="plain" size="small" style="margin-left: 8px">
          可视化条件编辑器
        </el-tag>
        <el-button
          v-if="!readonly"
          type="primary"
          :icon="Plus"
          size="small"
          style="margin-left: auto"
          @click="emit('addGroup')"
        >
          添加条件组
        </el-button>
      </div>
    </template>

    <el-empty v-if="conditionGroups.length === 0" description="暂无条件组，任务将无条件执行" />

    <div
      v-for="(group, groupIndex) in conditionGroups"
      :key="group.id"
      class="condition-group"
    >
      <div class="group-header">
        <div class="group-title">
          <span>条件组 {{ groupIndex + 1 }}</span>
          <el-radio-group v-model="group.type" size="small">
            <el-radio-button label="ALL">全部满足</el-radio-button>
            <el-radio-button label="ANY">任一满足</el-radio-button>
          </el-radio-group>
        </div>
        <el-button
          v-if="!readonly"
          type="danger"
          :icon="Delete"
          size="small"
          circle
          @click="emit('removeGroup', groupIndex)"
        />
      </div>

      <div
        v-for="(condition, condIndex) in group.conditions"
        :key="condition.id"
        class="condition-item"
      >
        <ConditionEditor
          v-model="condition.expr"
          :data-sources="dataSources"
          :devices="devices"
          @change="(rule) => onConditionChange(condition, rule)"
        >
          <template #actions>
            <el-button
              v-if="!readonly"
              type="danger"
              :icon="Delete"
              size="small"
              circle
              @click="emit('removeCondition', groupIndex, condIndex)"
            />
          </template>
        </ConditionEditor>
        
        <!-- 条件描述输入 -->
        <div class="condition-desc">
          <el-input
            v-model="condition.desc"
            placeholder="条件描述（可选，用于说明此条件的作用）"
            size="small"
          >
            <template #prefix>
              <el-icon><InfoFilled /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <el-button
        v-if="!readonly"
        type="primary"
        link
        :icon="Plus"
        @click="emit('addCondition', groupIndex)"
      >
        添加条件
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Filter, Plus, Delete, InfoFilled } from '@element-plus/icons-vue'
import type { ConditionGroup, Condition, DataSource, Device } from '../../types/quartz'
import ConditionEditor from '../ConditionEditor.vue'
import type { ConditionRule } from '../../types/deviceProperties'

defineProps<{
  conditionGroups: ConditionGroup[]
  dataSources: DataSource[]
  devices: Device[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  addGroup: []
  removeGroup: [index: number]
  addCondition: [groupIndex: number]
  removeCondition: [groupIndex: number, conditionIndex: number]
}>()

function onConditionChange(condition: Condition, rule: ConditionRule) {
  // 可以在这里添加额外的逻辑，如自动填充描述
  if (!condition.desc && rule.property) {
    const deviceType = getDeviceTypeFromDataSource(rule.dataSourceId)
    if (deviceType) {
      condition.desc = generateAutoDesc(rule, deviceType)
    }
  }
}

function getDeviceTypeFromDataSource(dataSourceId: string): string | undefined {
  // 这个方法在 ConditionEditor 内部已经处理了，这里简化处理
  return undefined
}

function generateAutoDesc(rule: ConditionRule, deviceType: string): string {
  const operatorMap: Record<string, string> = {
    '==': '等于',
    '!=': '不等于',
    '>': '大于',
    '>=': '大于等于',
    '<': '小于',
    '<=': '小于等于',
  }
  
  return `${deviceType} ${rule.property} ${operatorMap[rule.operator] || rule.operator} ${rule.value}`
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

.condition-group {
  margin-bottom: 16px;
  padding: 16px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.condition-item {
  margin-bottom: 16px;
  padding: 16px;
  background-color: var(--el-bg-color);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.condition-desc {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
</style>
