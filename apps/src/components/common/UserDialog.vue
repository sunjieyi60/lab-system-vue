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

        <!-- 第二行：手机号码 -->
        <el-col :span="12">
          <el-form-item label="手机号码：" prop="phone" required>
            <el-input v-model="form.phone" placeholder="请输入手机号码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱：" prop="email" required>
            <el-input v-model="form.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <!-- 第三行：邮箱 + 密码 -->

        <el-col :span="12" v-if="isAdd">
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

      <!-- 数据权限 -->
      <div class="permission-section">
        <div class="permission-title">数据权限：</div>
        <el-row :gutter="20">
          <!-- 楼栋 -->
          <el-col :span="12">
            <el-form-item label="楼栋：" prop="buildingIds">
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

          <!-- 单位 -->
          <el-col :span="12">
            <el-form-item label="单位：" prop="deptIdsForLab">
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
            <el-form-item label="实验室：" prop="laboratoryIds">
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
        </el-row>
      </div>

      <!-- 功能权限 -->
      <div class="permission-section">
        <div class="permission-title">
          功能权限：
          <el-checkbox
            v-model="selectAllPermissions"
            :indeterminate="isIndeterminate"
            @change="handleSelectAllChange"
            style="margin-left: 10px; font-weight: normal"
          >
            全选
          </el-checkbox>
        </div>

        <!-- 按模块分组显示权限 -->
        <div
          v-for="module in availablePermissionModules"
          :key="module.id"
          class="permission-module"
        >
          <div class="module-title">{{ module.description }}：</div>
          <el-checkbox-group v-model="form.permissionIds">
            <el-checkbox
              v-for="perm in module.children"
              :key="perm.id"
              :label="perm.id"
            >
              {{ perm.description }}
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- 无权限提示 -->
        <div
          v-if="availablePermissionModules.length === 0"
          class="no-permission-tip"
        >
          暂无可用权限
        </div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores";
import { apiCreateUser, apiEditUser, apiGetPermissionTree } from "@/api/user";

// 权限 ID 到枚举名称的映射表（根据后端 Permissions 枚举）
const PERMISSION_ID_TO_NAME = {
  0: "ROOT",
  1: "USER",
  2: "USER_ADD",
  3: "USER_EDIT",
  4: "USER_DELETE",
  6: "ACADEMIC_AFFAIRS_MANAGEMENT",
  7: "SCHEDULE_CLASSES",
  8: "SCHEDULE_CLASSES_VIEW",
  9: "SEMESTER_SETTINGS",
  10: "CONTROL_CENTER",
  11: "DEVICE_ADD",
  12: "DEVICE_CONTROL",
  13: "DEVICE_SMART_CONTROL",
  14: "DEVICE_ALARM_SETTINGS",
  15: "DATA_ANALYSIS",
  16: "ACADEMIC_AFFAIRS_ANALYSIS",
  17: "LABORATORY_POWER_CONSUMPTION",
  18: "LABORATORY_CENTRAL_AIRCONDITION",
  19: "BASE_SETTINGS",
  20: "BASE_CUD",
  21: "BASE_VIEW",
};

// 权限枚举名称到 ID 的反向映射（用于编辑时转换）
const PERMISSION_NAME_TO_ID = Object.fromEntries(
  Object.entries(PERMISSION_ID_TO_NAME).map(([id, name]) => [
    name,
    parseInt(id),
  ]),
);

const props = defineProps({
  isAdd: Boolean,
  row: Object,
});

const emit = defineEmits(["success"]);
const visible = defineModel();

const userStore = useUserStore();

const loading = ref(false);
const formRef = ref();

// 权限树数据
const permissionTree = ref(null);
const permissionLoading = ref(false);

const form = reactive({
  username: "",
  password: "",
  realName: "",
  email: "",
  phone: "",
  deptIds: [], // 部门ID数组
  laboratoryIds: [], // 实验室ID数组
  buildingIds: [], // 楼栋ID数组
  deptIdsForLab: [], // 用于实验室权限的单位选择
  permissionIds: [], // 选中的权限ID数组
});

// 验证规则
const rules = {
  username: [
    { required: true, message: "请输入账号", trigger: "blur" },
    {
      pattern: /^[a-zA-Z0-9_]{4,16}$/,
      message: "用户名必须是4到16位，允许字母数字下划线",
      trigger: "blur",
    },
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

// 当前用户的权限ID列表
const myPermissionIds = computed(() => {
  return (userStore.userInfo.permissions || []).map((p) => p.permission?.id);
});

// 当前用户的权限描述列表
const myPermissionDescriptions = computed(() => userStore.getPermissionList);

// 获取可用的权限模块（根据权限树和当前用户权限过滤）
const availablePermissionModules = computed(() => {
  console.log("计算可用权限模块...");
  console.log("permissionTree.value:", permissionTree.value);

  if (!permissionTree.value?.children) {
    console.log("权限树数据不完整，返回空数组");
    return [];
  }

  console.log("权限树children:", permissionTree.value.children);

  const result = permissionTree.value.children
    .map((module) => {
      console.log(
        "处理模块:",
        module.parent?.description,
        "children:",
        module.children,
      );

      // 过滤出当前用户拥有的子权限（注意：子权限数据在 child.parent 中）
      const availableChildren = module.children
        .map((child) => child.parent) // 提取 parent 对象
        .filter((perm) => {
          const hasPermission = myPermissionIds.value.includes(perm.id);
          console.log(
            `  权限 ${perm.description}(id:${perm.id}) - 是否拥有:`,
            hasPermission,
          );
          return hasPermission;
        });

      if (availableChildren.length === 0) {
        console.log(`  模块 ${module.parent?.description} 无可用权限，跳过`);
        return null;
      }

      return {
        ...module.parent,
        children: availableChildren,
      };
    })
    .filter(Boolean);

  console.log("最终可用权限模块:", result);
  return result;
});

// 所有可选的权限ID（用于全选）
const allAvailablePermissionIds = computed(() => {
  return availablePermissionModules.value.flatMap((m) =>
    m.children.map((c) => c.id),
  );
});

// 全选状态
const selectAllPermissions = computed({
  get() {
    if (allAvailablePermissionIds.value.length === 0) return false;
    return allAvailablePermissionIds.value.every((id) =>
      form.permissionIds.includes(id),
    );
  },
  set(val) {
    form.permissionIds = val ? [...allAvailablePermissionIds.value] : [];
  },
});

// 半选状态
const isIndeterminate = computed(() => {
  const selectedCount = form.permissionIds.length;
  const totalCount = allAvailablePermissionIds.value.length;
  return selectedCount > 0 && selectedCount < totalCount;
});

// 全选切换
const handleSelectAllChange = (val) => {
  form.permissionIds = val ? [...allAvailablePermissionIds.value] : [];
};

// 获取权限树
const fetchPermissionTree = async () => {
  try {
    const res = await apiGetPermissionTree();
    permissionTree.value = res.data.data || null;

    // 调试日志
    console.log("=== 权限调试信息 ===");
    console.log("1. 权限树数据:", permissionTree.value);
    console.log("2. 当前用户权限ID列表:", myPermissionIds.value);
    console.log("3. 当前用户权限描述列表:", myPermissionDescriptions.value);
    console.log("4. 可用权限模块:", availablePermissionModules.value);
    console.log("5. 所有可选权限ID:", allAvailablePermissionIds.value);
    console.log("===================");
  } catch (err) {
    console.error("获取权限树失败:", err);
    ElMessage.error("获取权限数据失败");
  }
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
    permissionIds: [],
  });
}

// 提交
async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    // 使用数据权限下的单位作为 deptIds 传给后端
    const deptIds = form.deptIdsForLab;

    // 将权限 ID 转换为枚举名称数组
    const permissionNames = form.permissionIds
      .map((id) => PERMISSION_ID_TO_NAME[id])
      .filter(Boolean); // 过滤掉未定义的

    if (props.isAdd) {
      // 添加用户
      const payload = {
        username: form.username,
        password: form.password,
        realName: form.realName,
        email: form.email,
        phone: form.phone,
        createBy: userStore.userInfo.id, // 当前用户 ID
        permissions: permissionNames, // 传递枚举名称数组，如 ["USER_EDIT", "DEVICE_CONTROL"]
        deptIds: deptIds,
        laboratoryIds: form.laboratoryIds,
      };
      await apiCreateUser(payload);
      ElMessage.success("添加成功");
    } else {
      // 编辑用户
      const payload = {
        userId: props.row?.id,
        realName: form.realName,
        email: form.email,
        phone: form.phone,
        permissions: permissionNames,
        deptIds: deptIds,
        laboratoryIds: form.laboratoryIds,
      };
      await apiEditUser(payload);
      ElMessage.success("修改成功");
    }

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

    // 检查当前用户权限是否已加载，如果没有则刷新
    if (
      !userStore.userInfo.permissions ||
      userStore.userInfo.permissions.length === 0
    ) {
      console.log("用户权限为空，正在刷新用户信息...");
      await userStore.refreshUserInfo();
    }

    await nextTick();
    reset();

    // 获取权限树
    await fetchPermissionTree();

    // 如果是编辑模式，填充数据
    if (!props.isAdd && props.row) {
      // 将权限枚举名称数组转换为 ID 数组
      const permissionIds = (props.row.permissions || [])
        .map((name) => PERMISSION_NAME_TO_ID[name])
        .filter((id) => id !== undefined);

      Object.assign(form, {
        username: props.row.username || "",
        realName: props.row.realName || "",
        email: props.row.email || "",
        phone: props.row.phone || "",
        deptIdsForLab: props.row.deptIds || [], // 编辑时把 deptIds 回填到数据权限的单位
        laboratoryIds: props.row.laboratoryIds || [],
        buildingIds: props.row.buildingIds || [],
        permissionIds: permissionIds,
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

.permission-module {
  margin-bottom: 15px;
  margin-left: 20px;
}

.module-title {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  font-weight: normal;
}

.no-permission-tip {
  margin-left: 20px;
  color: #909399;
  font-size: 13px;
  padding: 10px 0;
}
</style>
