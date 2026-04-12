<!-- src/App.vue -->
<template>
  <div class="global-header">
    <!-- 左侧系统名称与Logo -->
    <div class="global-header">
      <img src="/images/学校.png" alt="学校 logo" class="logo" />
      <span>实验室综合管理系统</span>
    </div>
    <!-- 右侧用户信息与窗口控制 -->
    <div class="global-header">
      <span>{{ userStore.userInfo.realName }}，欢迎您！</span>
    </div>
  </div>
  <router-view />
</template>

<script setup>
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";

const userStore = useUserStore();
const router = useRouter();
</script>

<style scoped>
.global-header {
  /* 1. 黑色字 */
  color: #000;

  /* 2. 高度：手机 48px → 桌面 64px，一行搞定 */
  height: clamp(48px, 6vw, 64px);

  /* 3. 垂直居中：flex 就够了 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px; /* 想再省代码，padding 都可以不要 */
}

.logo {
  height: 80%; /* 随高度等比缩放，无需计算 */
  max-height: 36px; /* 防过大 */
  margin-right: 12px; /* 图片右侧与文字的间距，可根据需要调整数值 */
}
</style>
