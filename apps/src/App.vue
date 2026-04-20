<template>
  <div class="app-container">
    <!-- 只在非登录/注册页面显示顶部导航栏 -->
    <GlobalHeader v-if="showHeader" />
    <div class="app-content" :class="{ 'has-header': showHeader }">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, provide } from "vue";
import { useRoute } from "vue-router";
import GlobalHeader from "@/components/common/GlobalHeader.vue";

const route = useRoute();

// 不显示顶部导航栏的页面路径
const noHeaderRoutes = ["/login", "/register"];

// 是否显示顶部导航栏
const showHeader = computed(() => {
  return !noHeaderRoutes.includes(route.path);
});

/* ---------- 移动端抽屉菜单状态（全局共享） ---------- */
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

provide("mobileMenu", {
  isMobileMenuOpen,
  toggleMobileMenu,
  closeMobileMenu,
});
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #f5f7fa;
  overflow: hidden; /* 禁止 body 滚动 */
}

#app {
  height: 100vh;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow: hidden;
}

.app-content.has-header {
  /* 当有 header 时，内容区域自动填充剩余空间 */
  height: calc(100vh - 64px);
}

/* ==================== 移动端适配 ==================== */
@media (max-width: 768px) {
  body {
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  #app {
    height: auto;
    min-height: 100dvh;
  }

  .app-container {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
  }

  .app-content {
    overflow: visible;
  }

  .app-content.has-header {
    height: auto;
  }
}
</style>
