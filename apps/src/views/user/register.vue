<template>
  <div class="register-page">
    <div class="register-box">
      <h2 class="register-title">注册用户</h2>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="register-form"
        @keyup.enter="submitForm"
      >
        <!-- 必填 -->
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

        <el-form-item prop="real_name">
          <el-input
            v-model="form.real_name"
            placeholder="请输入真实姓名"
            class="rounded-input"
            size="large"
          >
            <template #prefix>
              <el-icon><UserFilled /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱"
            class="rounded-input"
            size="large"
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            class="rounded-input"
            size="large"
          >
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 可选 -->
        <el-form-item prop="workplace_id">
          <el-select
            v-model="form.workplace_id"
            placeholder="请选择单位"
            class="rounded-select"
            size="large"
            clearable
          >
            <el-option label="单位A" :value="1" />
            <el-option label="单位B" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="register-btn"
            :loading="loading"
            @click="submitForm"
          >
            注 册
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 底部链接 -->
      <div class="form-footer">
        <span>已有账号？</span>
        <el-link type="primary" @click="goLogin">返回登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { apiRegister } from "@/api/user";
import { ElMessage } from "element-plus";
import { User, Lock, UserFilled, Message, Phone } from "@element-plus/icons-vue";

const router = useRouter();
const formRef = ref();
const loading = ref(false);

/* ---------- 表单数据 ---------- */
const form = reactive({
  username: "",
  password: "",
  real_name: "",
  email: "",
  phone: "",
  workplace_id: null,
});

/* ---------- 校验规则 ---------- */
const rules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  real_name: [{ required: true, message: "请输入真实姓名", trigger: "blur" }],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "邮箱格式不正确", trigger: "blur" },
  ],
  phone: [
    {
      required: true,
      pattern: /^1[3-9]\d{9}$/,
      message: "手机号格式错误",
      trigger: "blur",
    },
  ],
};

/* ---------- 返回登录 ---------- */
function goLogin() {
  router.push("/login");
}

/* ---------- 提交 ---------- */
function submitForm() {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      // 组装后端需要的完整报文
      await apiRegister({
        ...form,
        functions: ["REGISTER"], // 固定值
        laboratory_ids: [], // 空数组
      });
      ElMessage.success("注册成功");
      router.push("/login");
    } catch {
      // 统一拦截器已弹错
    } finally {
      loading.value = false;
    }
  });
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.register-box {
  margin-bottom: 70px;
  width: 420px;
  padding: 40px 35px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.register-title {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 30px;
}

.register-form {
  .el-form-item {
    margin-bottom: 20px;
  }
}

/* 圆角输入框 - 与登录页面风格一致 */
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

/* 圆角下拉框 */
.rounded-select {
  width: 100%;

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
}

/* 注册按钮 */
.register-btn {
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

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.45);
}

.register-btn:active {
  transform: translateY(0);
}

/* 底部链接 */
.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;

  .el-link {
    font-size: 14px;
    margin-left: 5px;
  }
}
</style>
