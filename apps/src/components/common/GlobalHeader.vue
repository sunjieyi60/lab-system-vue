<template>
  <div class="global-header">
    <!-- 左侧系统名称与Logo -->
    <div class="header-left">
      <img src="/images/学校.png" alt="学校 logo" class="logo" />
      <span class="system-title">实验室综合管理系统</span>
    </div>
    <!-- 右侧用户信息与窗口控制 -->
    <div class="header-right">
      <span class="welcome-text">{{ userStore.userInfo?.realName || '访客' }}，欢迎您！</span>
      <el-dropdown v-if="userStore.userInfo?.realName" @command="handleCommand">
        <el-avatar :size="32" :icon="UserFilled" class="user-avatar" />
        <template #dropdown>
          <el-dropdown-menu>
            <!-- <el-dropdown-item command="profile">个人中心</el-dropdown-item> -->
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from "@/stores";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { UserFilled } from "@element-plus/icons-vue";

const userStore = useUserStore();
const router = useRouter();

const handleCommand = (command) => {
  switch (command) {
    case "profile":
      router.push("/user/profile");
      break;
    case "logout":
      ElMessageBox.confirm("确定要退出登录吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          userStore.clearLoginInfo();
          router.push("/login");
          ElMessage.success("已退出登录");
        })
        .catch(() => {});
      break;
  }
};
</script>

<style scoped>
.global-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  height: 40px;
  width: auto;
}

.system-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-text {
  font-size: 14px;
  color: #4b5563;
}

.user-avatar {
  cursor: pointer;
  background-color: #3b82f6;
  transition: transform 0.2s;
}

.user-avatar:hover {
  transform: scale(1.05);
}

/* 去掉下拉菜单分隔线的上边框 */
:deep(.el-dropdown-menu__item--divided) {
  border-top: none;
  margin: 6px 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .global-header {
    height: 56px;
    padding: 0 16px;
  }
  
  .system-title {
    font-size: 16px;
  }
  
  .welcome-text {
    display: none;
  }
}
</style>
