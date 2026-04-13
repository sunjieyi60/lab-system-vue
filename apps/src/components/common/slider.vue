<template>
  <el-menu
    class="slider-menu"
    mode="vertical"
    router
    :default-active="activePath"
    text-color="#333"
    active-text-color="#0960bd"
  >
    <el-menu-item
      v-for="item in menuList"
      :key="item.path"
      :index="item.path"
    >
      <img :src="item.icon" :alt="item.title" class="menu-icon" />
      <span>{{ item.title }}</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { menuList } from "@/constants/menu.js";

const route = useRoute();

// 当前激活的菜单路径
// 支持子路由高亮父菜单，如 /edu/schedule 高亮 /edu/term
const activePath = computed(() => {
  // 1. 优先精确匹配
  const exactMatch = menuList.find((item) => item.path === route.path);
  if (exactMatch) return exactMatch.path;

  // 2. 匹配父路由（如 /edu/schedule 匹配 /edu/term）
  // 提取当前路由的根路径（如 /edu/schedule -> /edu）
  const rootPath = "/" + route.path.split("/")[1];
  const parentMatch = menuList.find((item) =>
    item.path.startsWith(rootPath)
  );

  return parentMatch?.path || route.path;
});
</script>

<style scoped>
/* 调整图标大小和间距 */
.menu-icon {
  width: 20px;
  height: 20px;
  margin-right: 10px; /* 增大与文字的间隙 */
  margin-left: 8px;
  vertical-align: middle; /* 确保与文字垂直居中对齐 */
  object-fit: contain; /* 防止图片拉伸变形 */
}

/* 侧边栏容器 */
.slider-menu {
  width: 200px;
  height: 100%; /* 填满父容器高度 */
  padding-top: 8px; /* 概览上方留白 */
  background: linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 100%);

}

/* 菜单文字统一样式 */
:deep(.el-menu-item) {
  font-family: "Alibaba PuHuiTi 2.0", sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 18px;
  line-height: 25px;
  color: #3e5262;
}
/* 取消鼠标悬停时的样式变化 */
:deep(.el-menu-item:hover) {
  /* 覆盖悬停时的背景色（与默认状态一致） */
  background-color: transparent !important;
  /* 覆盖悬停时的文字色（与默认状态一致） */
  color: #3e5262 !important;
  /* 若有其他悬停效果（如阴影），也可在此清除 */
}
</style>
