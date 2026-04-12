<template>
  <el-dialog
    v-model="visible"
    :title="isAdd ? '添加用户' : '修改'"
    class="add-user-dialog"
    :close-on-click-modal="false"
    @closed="reset"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="user-form"
    >
      <el-row :gutter="20">
        <!-- 第一行：账号 + 姓名 -->
        <el-col :span="12">
          <el-form-item label="账号：" prop="username" required>
            <el-input v-model="form.username" placeholder="请输入账号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="姓名：" prop="realName" required>
            <el-input v-model="form.realName" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>

        <!-- 第二行：单位 + 手机号码 -->
        <el-col :span="12">
          <el-form-item label="单位：" prop="deptIds">
            <el-select
              v-model="form.deptIds"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择单位"
              style="width: 100%"
            >
              <el-option
                v-for="dept in deptList"
                :key="dept.dept.id"
                :label="dept.dept.deptName"
                :value="dept.dept.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号码：" prop="phone" required>
            <el-input v-model="form.phone" placeholder="请输入手机号码" />
          </el-form-item>
        </el-col>

        <!-- 第三行：邮箱 + 密码 -->
        <el-col :span="12">
          <el-form-item label="邮箱：" prop="email" required>
            <el-input v-model="form.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="密码：" prop="password" required>
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 系统权限 -->
      <div class="permission-section">
        <div class="permission-title">系统权限：</div>
        <el-row :gutter="20">
          <!-- 所在楼栋 -->
          <el-col :span="12">
            <el-form-item label="所在楼栋：" prop="buildingIds">
              <el-select
                v-model="form.buildingIds"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option
                  v-for="building in buildingList"
                  :key="building.id"
                  :label="building.buildingName"
                  :value="building.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 所属单位 -->
          <el-col :span="12">
            <el-form-item label="所属单位：" prop="deptIdsForLab">
              <el-select
                v-model="form.deptIdsForLab"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option
                  v-for="dept in deptList"
                  :key="dept.dept.id"
                  :label="dept.dept.deptName"
                  :value="dept.dept.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 实验室编号 -->
          <el-col :span="12">
            <el-form-item label="实验室编号：" prop="laboratoryIds">
              <el-select
                v-model="form.laboratoryIds"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option
                  v-for="lab in laboratoryList"
                  :key="lab.id"
                  :label="lab.laboratoryName"
                  :value="lab.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 控制中心权限 -->
          <el-col :span="12">
            <el-form-item label="控制中心：" prop="controlPermission">
              <el-select
                v-model="controlPermission"
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option label="无" value="none" />
                <el-option label="查看" value="view" />
                <el-option label="控制" value="control" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 教务管理权限 -->
          <el-col :span="12">
            <el-form-item label="教务管理：" prop="eduPermission">
              <el-select
                v-model="eduPermission"
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option label="无" value="none" />
                <el-option label="查看" value="view" />
                <el-option label="编辑" value="edit" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 基础管理权限 -->
          <el-col :span="12">
            <el-form-item label="基础管理：" prop="basePermission">
              <el-select
                v-model="basePermission"
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option label="无" value="none" />
                <el-option label="查看" value="view" />
                <el-option label="编辑" value="edit" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 数据分析权限 -->
          <el-col :span="12">
            <el-form-item label="数据分析：" prop="dataPermission">
              <el-select
                v-model="dataPermission"
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option label="无" value="none" />
                <el-option label="查看" value="view" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 日志查询权限 -->
          <el-col :span="12">
            <el-form-item label="日志查询：" prop="logPermission">
              <el-select
                v-model="logPermission"
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option label="无" value="none" />
                <el-option label="查看" value="view" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <template #footer>
      <el-button type="primary" :loading="loading" @click="submit">
        确定
      </el-button>
      <el-button @click="visible = false">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/user";
import { apiCreateUser } from "@/api/user";

const props = defineProps({
  isAdd: Boolean,
  row: Object,
});

const emit = defineEmits(["success"]);
const visible = defineModel();

const userStore = useUserStore();

const loading = ref(false);
const formRef = ref();

// 权限选择（临时变量，最终转换为 permissions 数组）
const controlPermission = ref("none");
const eduPermission = ref("none");
const basePermission = ref("none");
const dataPermission = ref("none");
const logPermission = ref("none");

const form = reactive({
  username: "",
  password: "",
  realName: "",
  email: "",
  phone: "",
  deptIds: [], // 部门ID数组
  laboratoryIds: [], // 实验室ID数组
  buildingIds: [], // 楼栋ID数组（额外字段，用于界面展示）
  deptIdsForLab: [], // 用于实验室权限的单位选择
});

// 验证规则
const rules = {
  username: [
    { required: true, message: "请输入账号", trigger: "blur" },
    { min: 3, max: 50, message: "长度在 3 到 50 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 50, message: "长度在 6 到 50 个字符", trigger: "blur" },
  ],
  realName: [
    { required: true, message: "请输入姓名", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "邮箱格式不正确", trigger: "blur" },
  ],
  phone: [
    { required: true, message: "请输入手机号码", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "手机号码格式不正确",
      trigger: "blur",
    },
  ],
};

// 从 store 获取数据
const deptList = computed(() => userStore.userInfo.depts || []);
const buildingList = computed(() => userStore.userInfo.buildings || []);
const laboratoryList = computed(() => userStore.userInfo.laboratories || []);

// 构建权限数组
const buildPermissions = () => {
  const permissions = [];

  if (controlPermission.value === "control") {
    permissions.push("DEVICE_CONTROL");
  }
  if (eduPermission.value === "edit") {
    permissions.push("EDU_EDIT");
  }
  if (basePermission.value === "edit") {
    permissions.push("USER_EDIT");
  }

  return permissions;
};

// 重置表单
function reset() {
  formRef.value?.resetFields();
  Object.assign(form, {
    username: "",
    password: "",
    realName: "",
    email: "",
    phone: "",
    deptIds: [],
    laboratoryIds: [],
    buildingIds: [],
    deptIdsForLab: [],
  });
  controlPermission.value = "none";
  eduPermission.value = "none";
  basePermission.value = "none";
  dataPermission.value = "none";
  logPermission.value = "none";
}

// 提交
async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    // 合并 deptIds 和 deptIdsForLab
    const allDeptIds = [...new Set([...form.deptIds, ...form.deptIdsForLab])];

    const payload = {
      username: form.username,
      password: form.password,
      realName: form.realName,
      email: form.email,
      phone: form.phone,
      createBy: userStore.userInfo.id,
      permissions: buildPermissions(),
      deptIds: allDeptIds,
      laboratoryIds: form.laboratoryIds,
    };

    await apiCreateUser(payload);

    ElMessage.success("添加成功");
    visible.value = false;
    emit("success");
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error(error.response?.data?.msg || "操作失败");
  } finally {
    loading.value = false;
  }
}

// 监听对话框打开
watch(
  () => visible.value,
  async (val) => {
    if (!val) return;
    await nextTick();
    reset();

    // 如果是编辑模式，填充数据
    if (!props.isAdd && props.row) {
      Object.assign(form, {
        username: props.row.username || "",
        realName: props.row.realName || "",
        email: props.row.email || "",
        phone: props.row.phone || "",
      });
      // 编辑时不显示密码
      form.password = "";
    }
  },
);
</script>

<style scoped>
.user-form {
  padding: 10px 10px 0;
}

.permission-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #dcdfe6;
}

.permission-title {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 15px;
  margin-left: 20px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  font-weight: normal;
}
</style>
