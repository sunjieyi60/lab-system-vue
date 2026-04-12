<template>
  <div class="layout-container">
    <!-- 左侧导航栏 -->
    <Slider />

    <!-- 右侧主内容 -->
    <div class="right-container">
      <!-- 顶部二级菜单 -->
      <div class="app-header">
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
import Slider from "@/components/Slider.vue";
import AppHeader from "@/components/AppHeader.vue";
</script>

<style scoped>
.layout-container {
  display: flex; /* 横向排列子元素 */
  width: 100%;
  height: 100vh; /* 撑满全屏高度，确保子元素有高度可排 */
}
/* 左侧导航栏固定宽度 */
.layout-container > :first-child {
  width: 168px;
  flex-shrink: 0;
  background-color: transparent; /* 导航栏颜色 */
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
  overflow: auto;
}

/* 主体内容区域可滚动 */
.main-content {
  flex: 1;
  overflow-y: auto;
  background-color: #ffffff;
  padding: 8px 16px 16px 16px;
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
</style>
