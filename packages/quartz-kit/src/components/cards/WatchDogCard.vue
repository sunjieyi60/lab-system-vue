<template>
  <el-card class="form-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-icon><View /></el-icon>
        <span>看门狗配置</span>
      </div>
    </template>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="启用看门狗">
          <el-switch v-model="watchDog.watchEnabled" />
        </el-form-item>
      </el-col>
    </el-row>

    <template v-if="watchDog.watchEnabled">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="检查间隔(秒)">
            <el-input-number
              v-model="watchDog.watchIntervalSec"
              :min="5"
              :max="3600"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="超时时间(秒)">
            <el-input-number
              v-model="watchDog.watchTimeoutSec"
              :min="10"
              :max="7200"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="首次成功即停止">
            <el-switch v-model="watchDog.stopOnFirstSuccess" />
          </el-form-item>
        </el-col>
      </el-row>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { View } from '@element-plus/icons-vue'
import type { WatchDog } from '../../types/quartz'

defineProps<{
  watchDog: WatchDog
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
</style>
