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
    { title: "中央空调", index: "/control/hvac" },
    { title: "门禁管理", index: "/control/access" },
    { title: "电气监控", index: "/control/electric" },
    { title: "电灯开关监控", index: "/control/light" },
    { title: "环境监控", index: "/control/env" },
    { title: "网关管理", index: "/control/gateway" },
    { title: "智控设备", index: "/control/intelligent" },
  ],
  "/data": [
    { title: "教务数据", index: "/data/edu" },
    { title: "能耗数据", index: "/data/energy" },
    { title: "中央空调数据", index: "/data/aircondition" },
  ],
  "/user": [{ title: "账号管理", index: "/user/profile" }],
  "/log": [
    { title: "操作日志", index: "/log/operation" },
    { title: "报警日志", index: "/log/alarm" },
  ],
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
  height: 60px;
  border-radius: 12px 12px 0 0 !important;
  background-color: #ffffff;
  padding: 0 0 0 16px;
  box-sizing: border-box;
}
:deep(.el-menu--horizontal) {
  border-bottom: none !important;
}

/* 1. 每个选项加矩形框 + 统一字体样式 */
:deep(.el-menu-item) {
  /* 矩形框样式 */
  border: 1px solid #ffffff;
  border-radius: 20px;
  height: 40px !important;
  line-height: 40px !important;
  margin-top: 10px !important;
  /* 指定字体样式 */
  font-family: "Alibaba PuHuiTi 2.0";
  font-style: normal;
  font-weight: 700;
  font-size: 17px;
  color: #3e5262 !important;
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

/* 4. 折叠菜单按钮样式 */
:deep(.el-sub-menu__title) {
  padding: 0 12px !important;
}
</style>
