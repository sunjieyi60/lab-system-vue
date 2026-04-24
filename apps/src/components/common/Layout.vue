<template>
  <div class="layout-container">
    <!-- 移动端遮罩层 -->
    <div v-if="isMobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>

    <!-- 左侧导航栏 -->
    <div class="sidebar" :class="{ 'mobile-open': isMobileMenuOpen }">
      <Slider @menu-click="closeMobileMenu" />
    </div>

    <!-- 右侧主内容 -->
    <div class="right-container">
      <!-- 顶部二级菜单 -->
      <div v-if="!route.meta?.hideSubMenu" class="app-header">
        <AppHeader />
      </div>

      <!-- 主页面内容 -->
      <div class="main-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from "vue";
import { useRoute } from "vue-router";
import Slider from "@/components/common/slider.vue";
import AppHeader from "@/components/common/AppHeader.vue";

const route = useRoute();

/* 注入全局移动端菜单状态 */
const { isMobileMenuOpen, closeMobileMenu } = inject("mobileMenu");
</script>

<style scoped>
/* layout-container 高度由父容器决定 */
.layout-container {
  display: flex;
  width: 100%;
  height: 100%; /* 由父容器 .app-content 控制高度 */
  overflow: hidden;
  position: relative;
}

/* 左侧导航栏固定宽度 */
.sidebar {
  width: 168px;
  flex-shrink: 0;
  background-color: transparent; /* 导航栏颜色 */
  transition: transform 0.3s ease;
}

/* 清除左侧菜单的右侧边框 */
:deep(.el-menu) {
  position: relative;
  z-index: 0;
  border-right: none !important; /* 关键：移除右侧边框 */
}

/* 顶部二级菜单样式 */
:deep(.el-menu.el-menu--horizontal) {
  border-radius: 12px 12px 0 0 !important;
  /* 确保没有其他样式覆盖背景色（可选） */
  background-color: #ffffff !important;
}
/* 右侧区域纵向布局 */
.right-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%; /* 填满父容器高度 */
  overflow: hidden; /* 禁止整体滚动 */
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
}

/* 主体内容区域可滚动 */
.main-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  background-color: #ffffff;
  padding: 0px 16px;
}

/* .is-active::before 的 z-index: -1 正常生效 */
:deep(.slider-menu .el-menu) {
  position: relative;
  z-index: 0;
  border-right: none !important; /* 关键：移除右侧边框 */
}
/* 选中的时候有蓝色矩形 */
:deep(.slider-menu .el-menu-item.is-active)::before {
  content: "";
  position: absolute;
  left: 15px; /* 与设计的 left 一致 */
  top: 50%;
  transform: translateY(-50%); /* 垂直居中 */
  width: 123px;
  height: 45px;
  background: rgba(123, 171, 209, 0.4);
  border-radius: 12px;
  z-index: -1; /* 保证在文字下方 */
}

/* ==================== 移动端适配 ==================== */
@media (max-width: 768px) {
  .layout-container {
    flex-direction: column;
    height: auto;
    min-height: 100dvh;
    overflow: visible;
  }

  /* 侧边栏变为抽屉式 */
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 240px;
    height: 100vh;
    z-index: 9999;
    background: linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 100%);
    transform: translateX(-100%);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  /* 遮罩层 */
  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 9998;
  }

  .right-container {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
  }

  .main-content {
    padding: 0 8px 8px;
    overflow: visible;
  }
}
</style>
