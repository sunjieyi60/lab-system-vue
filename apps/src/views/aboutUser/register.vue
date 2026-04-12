<template>
  <div
    style="
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f3f3;
    "
  >
    <el-card style="width: 480px">
      <template #header>注册用户</template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        @keyup.enter="submitForm"
      >
        <!-- 必填 -->
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="admin" clearable />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="password123"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="form.real_name" placeholder="管理员" clearable />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="admin@example.com"
            clearable
          />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="13800138000" clearable />
        </el-form-item>

        <!-- 可选 -->
        <el-form-item label="单位" prop="workplace_id">
          <el-select
            v-model="form.workplace_id"
            placeholder="请选择单位"
            style="width: 100%"
            clearable
          >
            <!-- 后期用 v-for 渲染后端字典 -->
            <el-option label="单位A" :value="1" />
            <el-option label="单位B" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            :loading="loading"
            @click="submitForm"
          >
            提交
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { apiRegister } from "@/api/user";
import { ElMessage } from "element-plus";

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
