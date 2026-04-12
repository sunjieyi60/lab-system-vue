<template>
  <div class="app-header">
    <el-menu
      mode="horizontal"
      router
      :default-active="currentRoute"
      background-color="#f5f7fa"
      text-color="#333"
      active-text-color="#0960bd"
    >
      <!-- 当前主菜单下的二级菜单 -->
      <el-menu-item
        v-for="item in subMenu"
        :key="item.index"
        :index="item.index"
      >
        {{ item.title }}
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { computed } from "vue";

const route = useRoute();

/* -------------- 静态映射 -------------- */
const menuMap = {
  "/dashboard": [{ title: "概览", index: "/dashboard" }],
  "/base": [{ title: "基础管理", index: "/base" }],
  "/edu": [
    { title: "学期设置", index: "/edu/term" },
    { title: "实验室排课", index: "/edu/schedule" },
    { title: "实验室课表", index: "/edu/timetable" },
  ],
  "/control": [
    { title: "中央空调监控", index: "/control/hvac" },
    { title: "门禁管理", index: "/control/access" },
    { title: "电气监控", index: "/control/electric" },
    { title: "电灯开关监控", index: "/control/light" },
    { title: "环境监控", index: "/control/env" },
    { title: "智能控制", index: "/control/intelligent" },
    { title: "设备管理", index: "/control/*" }
  ],
  "/data": [
    { title: "教务数据", index: "/data/edu" },
    { title: "能耗数据", index: "/data/energy" },
    { title: "中央空调数据", index: "/data/aircondition" },
  ],
  "/user": [{ title: "账号管理", index: "/user/profile" }],
};

/* 计算当前主菜单 key */
const mainKey = computed(() => {
  const paths = Object.keys(menuMap);
  // 命中最长前缀即可
  return (
    paths
      .filter((k) => route.path.startsWith(k))
      .sort((a, b) => b.length - a)[0] || ""
  );
});

/* 对应的二级菜单 */
const subMenu = computed(() => menuMap[mainKey.value] || []);

/* 高亮用 */
const currentRoute = computed(() => route.path);
</script>

<style scoped>
.app-header {
  height: 50px;
  border-radius: 12px 12px 0 0 !important;
  /* 确保没有其他样式覆盖背景色（可选） */
  background-color: #ffffff;
  padding: 10px 0 0 16px;
}
:deep(.el-menu--horizontal) {
  border-bottom: none !important;
  display: flex;
  gap: 2rem;
}

/* 1. 每个选项加矩形框 + 统一字体样式 */
:deep(.el-menu-item) {
  /* 矩形框样式 */
  border: 1px solid #ffffff; /* 边框颜色，可根据需求调整 */
  border-radius: 20px; /* 可选：加轻微圆角更美观 */
  height: 40px !important; /*让矩形框随 padding 自适应 */
  /* 指定字体样式 */
  font-family: "Alibaba PuHuiTi 2.0";
  font-style: normal;
  font-weight: 700;
  font-size: 17px;
  color: #3e5262 !important; /* 文字颜色，覆盖默认text-color */
}

/* 2. 取消悬停样式变化（保持矩形框效果一致） */
:deep(.el-menu-item:hover) {
  background-color: transparent !important;
  border-color: #ffffff !important; /* 悬停时边框颜色不变 */
  color: #226ee0 !important; /* 悬停时文字颜色不变 */
}

/* 3. 选中状态样式（可选：区分选中与未选中） */
:deep(.el-menu-item.is-active) {
  border-color: #226ee0 !important; /* 选中时边框变主题色 */
  background-color: rgba(34, 110, 224, 0.05) !important; /* 选中时轻微背景色 */
  color: #226ee0 !important;
}
</style>
