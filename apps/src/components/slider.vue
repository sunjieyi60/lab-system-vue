<template>
  <el-menu
    class="slider-menu"
    mode="vertical"
    router
    :default-active="$route.path"
    text-color="#333"
    active-text-color="#0960bd"
  >
    <!-- 概览 -->
    <el-menu-item index="/dashboard">
      <img src="/images/概览.png" alt="概览" class="menu-icon" />
      <span>概览</span>
    </el-menu-item>

    <!-- 基础管理 -->
    <el-menu-item index="/base">
      <img src="/images/基础管理.png" alt="基础管理" class="menu-icon" />
      <span>基础管理</span>
    </el-menu-item>

    <!-- 教务管理 -->
    <el-menu-item index="/edu/term">
      <img src="/images/教务管理.png" alt="教务管理" class="menu-icon" />
      <span>教务管理</span>
    </el-menu-item>

    <!-- 控制中心 -->
    <el-menu-item index="/control/hvac">
      <img src="/images/控制中心.png" alt="控制中心" class="menu-icon" />
      <span>控制中心</span>
    </el-menu-item>

    <!-- 预约管理 -->
    <el-menu-item index="/book">
      <img src="/images/预约中心.png" alt="预约管理" class="menu-icon" />
      <span>预约管理</span>
    </el-menu-item>

    <!-- 资产管理 -->
    <el-menu-item index="/asset">
      <img src="/images/资产管理.png" alt="资产管理" class="menu-icon" />
      <span>资产管理</span>
    </el-menu-item>

    <!-- 数据分析 -->
    <el-menu-item index="/data/edu">
      <img src="/images/数据分析.png" alt="数据分析" class="menu-icon" />
      <span>数据分析</span>
    </el-menu-item>

    <!-- 日志查询 -->
    <el-menu-item index="/log/operation">
      <img src="/images/日志查询.png" alt="日志查询" class="menu-icon" />
      <span>日志查询</span>
    </el-menu-item>

    <!-- 账号中心 -->
    <el-menu-item index="/user/profile">
      <img src="/images/账号管理.png" alt="账号中心" class="menu-icon" />
      <span>账号中心</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup></script>

<style scoped>
/* 调整图标大小和间距 */
.menu-icon {
  width: 20px;
  height: 20px;
  margin-right: 10px; /* 增大与文字的间隙（原8px） */
  margin-left: 8px;
  vertical-align: middle; /* 确保与文字垂直居中对齐 */
  object-fit: contain; /* 防止图片拉伸变形 */
}

/* 侧边栏容器 */
.slider-menu {
  width: 200px;
  height: 80vh;
  /* 去掉背景色 */
  background: transparent;
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
