<template>
  <el-card class="form-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-icon><Bell /></el-icon>
        <span>报警配置</span>
        <el-button
          v-if="!readonly"
          type="primary"
          :icon="Plus"
          size="small"
          style="margin-left: auto"
          @click="emit('add')"
        >
          添加报警
        </el-button>
      </div>
    </template>

    <el-empty v-if="alarmGroup.length === 0" description="暂无报警配置" />

    <div
      v-for="(alarm, index) in alarmGroup"
      :key="alarm.id"
      class="alarm-item"
    >
      <el-row :gutter="20" align="middle">
        <el-col :span="10">
          <el-select
            v-model="alarm.userId"
            placeholder="选择用户"
            style="width: 100%"
          >
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-col>
        <el-col :span="10">
          <el-select
            v-model="alarm.type"
            placeholder="报警方式"
            style="width: 100%"
          >
            <el-option label="短信" value="SMS" />
            <el-option label="邮件" value="SMTP" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button
            v-if="!readonly"
            type="danger"
            :icon="Delete"
            size="small"
            circle
            @click="emit('remove', index)"
          />
        </el-col>
      </el-row>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Bell, Plus, Delete } from '@element-plus/icons-vue'
import type { Alarm, User } from '../../types/quartz'

defineProps<{
  alarmGroup: Alarm[]
  users: User[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
}>()
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

.alarm-item {
  margin-bottom: 12px;
  padding: 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 6px;
}
</style>
