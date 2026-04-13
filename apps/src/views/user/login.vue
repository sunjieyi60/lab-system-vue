<template>
  <div class="login-page">
    <div class="login-box">
      <h2 class="login-title">用户登录</h2>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            class="rounded-input"
            size="large"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            class="rounded-input"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>


    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { User, Lock } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores";
import { apiLogin, apiGetUserInfo } from "@/api/user";

const router = useRouter();
const userStore = useUserStore();

const formRef = ref();
const loading = ref(false);

const form = reactive({
  username: "",
  password: "",
});

const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "长度在 6 到 20 个字符", trigger: "blur" },
  ],
};

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    // 1. 调用登录接口
    const loginRes = await apiLogin({
      username: form.username,
      password: form.password,
    });

    // 3. 获取用户信息并存入 store
    const userRes = await apiGetUserInfo();
    userStore.setLoginInfo(userRes.data.data);

    ElMessage.success("登录成功");

    // 4. 跳转到首页
    router.push("/dashboard");
  } catch (error) {
    console.error("登录失败:", error);
    ElMessage.error(
      error.response?.data?.message || "登录失败，请检查用户名和密码",
    );
  } finally {
    loading.value = false;
  }
};


</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.login-box {
  margin-bottom: 70px;
  width: 420px;
  padding: 40px 35px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 30px;
}

.login-form {
  .el-form-item {
    margin-bottom: 20px;
  }
}

/* 圆角输入框 - 与手动排课风格一致 */
.rounded-input {
  :deep(.el-input__wrapper) {
    border-radius: 20px;
    box-shadow: 0 0 0 1px #e0e0e0 inset;
    padding: 0 15px;
    height: 44px;
    transition: all 0.3s;
  }

  :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px #c0c0c0 inset;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #409eff inset;
  }

  :deep(.el-input__inner) {
    height: 44px;
    line-height: 44px;
    font-size: 14px;
    color: #333;
  }

  :deep(.el-input__inner::placeholder) {
    color: #bbb;
    font-size: 14px;
  }

  /* 前缀图标样式 */
  :deep(.el-input__prefix) {
    color: #909399;
    font-size: 16px;
    margin-right: 8px;
  }
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 500;
  margin-top: 10px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.35);
  transition: all 0.3s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.45);
}

.login-btn:active {
  transform: translateY(0);
}


</style>
