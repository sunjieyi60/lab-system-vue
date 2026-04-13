<template>
  <el-dialog
    v-model="visible"
    :title="isAdd ? '添加实验室' : '修改实验室'"
    width="560px"
    top="20vh"
    :close-on-click-modal="false"
    @closed="reset"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="实验室编号" prop="laboratoryId">
        <el-input v-model="form.laboratoryId" />
      </el-form-item>

      <el-form-item label="实验室名称" prop="laboratoryName">
        <el-input v-model="form.laboratoryName" />
      </el-form-item>

      <el-form-item
        label="单位"
        prop="belongToWorkplace"
        class="workplace-item"
      >
        <el-select
          v-model="form.belongToWorkplace"
          multiple
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="2"
          clearable
          style="width: 100%"
          popper-class="workplace-select-dropdown"
          @change="handleWorkplaceChange"
        >
          <el-option
            v-for="wp in userWorkplaceList"
            :key="wp.dept.id"
            :label="wp.dept.deptName"
            :value="wp.dept.id"
          >
            <div class="option-with-action">
              <span class="option-label">{{ wp.dept.deptName }}</span>
              <el-button
                link
                type="danger"
                size="small"
                class="delete-btn"
                @click.stop="handleDeleteWorkplace(wp.dept.id)"
              >
                删除
              </el-button>
            </div>
          </el-option>
          <el-option value="__add_workplace__" class="add-option">
            <el-icon><Plus /></el-icon>
            <span style="color: var(--el-color-primary); margin-left: 4px"
              >新增单位</span
            >
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="楼栋" prop="belongToBuilding">
        <el-select
          v-model="form.belongToBuilding"
          clearable
          filterable
          placeholder="请选择楼栋"
          style="width: 100%"
          popper-class="building-select-dropdown"
        >
          <el-option
            v-for="b in userBuildingList"
            :key="b.id"
            :label="b.buildingName"
            :value="b.id"
          >
            <div class="option-with-action">
              <span class="option-label">{{ b.buildingName }}</span>
              <el-button
                link
                type="danger"
                size="small"
                class="delete-btn"
                @click.stop="handleDeleteBuilding(b.id)"
              >
                删除
              </el-button>
            </div>
          </el-option>
          <el-option value="__add_building__" class="add-option">
            <el-icon><Plus /></el-icon>
            <span style="color: var(--el-color-primary); margin-left: 4px"
              >新增楼栋</span
            >
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="负责人" prop="managerName">
        <el-input
          v-model="form.managerName"
          placeholder="请输入负责人姓名"
          clearable
        />
      </el-form-item>

      <el-form-item label="联系电话" prop="managerPhone">
        <el-input
          v-model="form.managerPhone"
          placeholder="请输入联系电话"
          clearable
        />
      </el-form-item>

      <el-form-item label="安全等级" prop="securityLevel">
        <el-input v-model="form.securityLevel" />
      </el-form-item>

      <el-form-item label="容量(人)" prop="classCapacity">
        <el-input-number
          v-model="form.classCapacity"
          :min="0"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="面积(m²)" prop="area">
        <el-input-number v-model="form.area" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="实验室简介" prop="intro">
        <el-input v-model="form.intro" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">
        确定
      </el-button>
    </template>
  </el-dialog>

  <!-- 新增单位对话框 -->
  <el-dialog
    v-model="workplaceDialogVisible"
    title="新增单位"
    width="400px"
    top="45vh"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form
      ref="workplaceFormRef"
      :model="workplaceForm"
      :rules="workplaceRules"
      label-width="80px"
    >
      <el-form-item label="单位名称" prop="deptName">
        <el-input
          v-model="workplaceForm.deptName"
          placeholder="请输入单位名称"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="workplaceDialogVisible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="workplaceLoading"
        @click="submitWorkplace"
      >
        确定
      </el-button>
    </template>
  </el-dialog>

  <!-- 新增楼栋对话框 -->
  <el-dialog
    v-model="buildingDialogVisible"
    title="新增楼栋"
    width="400px"
    top="40vh"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form
      ref="buildingFormRef"
      :model="buildingForm"
      :rules="buildingRules"
      label-width="80px"
    >
      <el-form-item label="单位">
        <div class="selected-workplaces-display">
          <el-tag
            v-for="name in currentWorkplaceNames"
            :key="name"
            size="small"
            type="info"
          >
            {{ name }}
          </el-tag>
        </div>
      </el-form-item>
      <el-form-item label="楼栋名称" prop="buildingName">
        <el-input
          v-model="buildingForm.buildingName"
          placeholder="请输入楼栋名称"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="buildingDialogVisible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="buildingLoading"
        @click="submitBuilding"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores";
import { useBaseStore } from "@/stores";
import { apiCreateUser } from "@/api/user";

const props = defineProps({
  isAdd: Boolean,
  row: Object,
});

const emit = defineEmits(["success"]);
const visible = defineModel();

const userStore = useUserStore();
const baseStore = useBaseStore();

const userWorkplaceList = computed(() => userStore.getDeptList || []);
const visibleUserList = computed(() => userStore.visibleTree || []);
const userBuildingList = computed(() => {
  const list = userStore.getBuildingList || [];
  console.log("【调试】userBuildingList 计算属性重新计算，数量:", list.length, "数据:", list);
  return list;
});

const loading = ref(false);
const formRef = ref();

const form = reactive({
  laboratoryId: "",
  laboratoryName: "",
  belongToWorkplace: [],
  belongToBuilding: null,
  managerName: "",
  managerPhone: "",
  securityLevel: "",
  classCapacity: 100,
  area: 200,
  intro: "",
});

// 验证规则 - 已删除 phone
const rules = {
  laboratoryId: [
    { required: true, message: "请输入实验室编号", trigger: "blur" },
    {
      pattern: /^\d+-\d+$/,
      message: "编号格式错误，示例：101-01",
      trigger: "blur",
    },
  ],
  laboratoryName: [
    { message: "请输入实验室名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
  belongToWorkplace: [
    {
      required: true,
      message: "请选择单位",
      trigger: "change",
      type: "array",
      min: 1,
    },
  ],
  belongToBuilding: [
    { required: true, message: "请选择楼栋", trigger: "change" },
  ],
  managerName: [
    { required: true, message: "请输入负责人姓名", trigger: "blur" },
  ],
  managerPhone: [
    { required: true, message: "请输入联系电话", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "手机号格式不正确",
      trigger: "blur",
    },
  ],
  // 已删除 phone 验证规则
  securityLevel: [{ message: "请输入安全等级", trigger: "blur" }],
  classCapacity: [
    {
      validator: (rule, value, callback) => {
        console.log("[验证 classCapacity] 值:", value, "类型:", typeof value);
        if (value === null || value === undefined || value === "") {
          console.log("[验证 classCapacity] 通过：值为空");
          callback();
        } else if (typeof value === "number" && value >= 0) {
          console.log("[验证 classCapacity] 通过：是数字且>=0");
          callback();
        } else {
          console.log("[验证 classCapacity] 失败：", typeof value, value);
          callback(new Error("课容量必须为非负数"));
        }
      },
      trigger: ["blur", "change"],
    },
  ],
  area: [
    {
      validator: (rule, value, callback) => {
        console.log("[验证 area] 值:", value, "类型:", typeof value);
        if (value === null || value === undefined || value === "") {
          console.log("[验证 area] 通过：值为空");
          callback();
        } else if (typeof value === "number" && value >= 0) {
          console.log("[验证 area] 通过：是数字且>=0");
          callback();
        } else {
          console.log("[验证 area] 失败：", typeof value, value);
          callback(new Error("面积必须为非负数"));
        }
      },
      trigger: ["blur", "change"],
    },
  ],
  intro: [{ max: 500, message: "简介最多 500 个字符", trigger: "blur" }],
};

const workplaceDialogVisible = ref(false);
const workplaceFormRef = ref();
const workplaceLoading = ref(false);
const workplaceForm = reactive({
  deptName: "",
});
const workplaceRules = {
  deptName: [
    { required: true, message: "请输入单位名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
};

const buildingDialogVisible = ref(false);
const buildingFormRef = ref();
const buildingLoading = ref(false);
const buildingForm = reactive({
  buildingName: "",
  deptIds: [],
});
const buildingRules = {
  buildingName: [
    { required: true, message: "请输入楼栋名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
};

const selectedWorkplaceNames = computed(() => {
  if (!form.belongToWorkplace?.length) return [];
  return form.belongToWorkplace
    .map((id) => {
      const wp = userWorkplaceList.value.find((w) => w.dept.id === id);
      return wp?.dept?.deptName;
    })
    .filter(Boolean);
});

const currentWorkplaceNames = computed(() => {
  if (!form.belongToWorkplace?.length) return [];
  return form.belongToWorkplace
    .map((id) => {
      const wp = userWorkplaceList.value.find((w) => w.dept.id === id);
      return wp?.dept?.deptName;
    })
    .filter(Boolean);
});
const currentId = ref(null);

const removeWorkplace = (name) => {
  const wp = userWorkplaceList.value.find((w) => w.dept.deptName === name);
  if (wp) {
    form.belongToWorkplace = form.belongToWorkplace.filter(
      (id) => id !== wp.dept.id,
    );
    form.belongToBuilding = null;
  }
};

const handleWorkplaceChange = (val) => {
  if (val?.includes("__add_workplace__")) {
    form.belongToWorkplace = val.filter((v) => v !== "__add_workplace__");
    workplaceDialogVisible.value = true;
    return;
  }
  form.belongToBuilding = null;
};

const handleDeleteWorkplace = async (deptId) => {
  try {
    await ElMessageBox.confirm(
      "该操作会删除该单位下的所有实验室，是否继续？",
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );
    await baseStore.removeWorkplace(deptId);
    // 如果当前选中了被删除的单位，移除它
    if (form.belongToWorkplace?.includes(deptId)) {
      form.belongToWorkplace = form.belongToWorkplace.filter(
        (id) => id !== deptId,
      );
      form.belongToBuilding = null;
    }
    await userStore.refreshUserInfo();
  } catch (error) {
    if (error === "cancel") return;
    console.error("删除单位失败:", error);
    ElMessage.error(error.message || "删除单位失败");
  }
};

const handleDeleteBuilding = async (buildingId) => {
  try {
    await ElMessageBox.confirm(
      "该操作会删除该楼栋下的所有实验室，是否继续？",
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );
    await baseStore.removeBuilding(buildingId);
    // 如果当前选中了被删除的楼栋，清空它
    if (form.belongToBuilding === buildingId) {
      form.belongToBuilding = null;
    }
    await userStore.refreshUserInfo();
  } catch (error) {
    if (error === "cancel") return;
    console.error("删除楼栋失败:", error);
    ElMessage.error(error.message || "删除楼栋失败");
  }
};

watch(
  () => form.belongToBuilding,
  (val) => {
    if (val === "__add_building__") {
      form.belongToBuilding = null;
      buildingForm.deptIds = [...(form.belongToWorkplace || [])];
      buildingDialogVisible.value = true;
    }
  },
);

async function submitWorkplace() {
  const valid = await workplaceFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  workplaceLoading.value = true;
  try {
    await baseStore.addWorkplace(workplaceForm.deptName);
    workplaceDialogVisible.value = false;
    workplaceForm.deptName = "";
    await userStore.refreshUserInfo();
    ElMessage.success("单位添加成功");
  } catch (error) {
    console.error("添加单位失败:", error);
    ElMessage.error(error.message || "添加单位失败");
  } finally {
    workplaceLoading.value = false;
  }
}

async function submitBuilding() {
  const valid = await buildingFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  buildingLoading.value = true;
  try {
    console.log("【调试】开始创建楼栋，名称:", buildingForm.buildingName, "单位:", buildingForm.deptIds);
    
    // 创建楼栋并获取返回的楼栋数据（包含 id）
    const newBuilding = await baseStore.addBuilding({
      buildingName: buildingForm.buildingName,
      deptIds: buildingForm.deptIds,
    });
    
    console.log("【调试】store 返回的新楼栋数据:", newBuilding);

    // 将新楼栋添加到 userStore 的 buildings 列表中，使其立即可选
    if (newBuilding && newBuilding.id) {
      console.log("【调试】添加前 userStore.userInfo.buildings:", userStore.userInfo.buildings);
      userStore.userInfo.buildings.push(newBuilding);
      console.log("【调试】添加后 userStore.userInfo.buildings:", userStore.userInfo.buildings);
      
      // 自动选中新创建的楼栋
      form.belongToBuilding = newBuilding.id;
      console.log("【调试】已选中新楼栋 ID:", newBuilding.id);
    } else {
      console.warn("【调试】后端返回数据异常，没有 id:", newBuilding);
    }

    buildingDialogVisible.value = false;
    buildingForm.buildingName = "";
    buildingForm.deptIds = [];
    ElMessage.success("楼栋添加成功");
  } catch (error) {
    console.error("【调试】添加楼栋失败:", error);
    ElMessage.error(error.message || "添加楼栋失败");
  } finally {
    buildingLoading.value = false;
  }
}

watch(
  () => visible.value,
  async (val) => {
    if (!val) return;
    await nextTick();
    reset();

    // 加载可见用户树（如果还没加载过）
    if (!userStore.visibleTree?.length) {
      await userStore.fetchVisibleTree().catch(() => {});
    }

    if (!props.isAdd && props.row) {
      const row = props.row;
      console.log(row);
      currentId.value = row.id; //保存 id
      
      // 从 managers 数组回填负责人姓名和电话
      const firstManager = row.managers?.[0];
      
      Object.assign(form, {
        laboratoryId: row.laboratoryId,
        laboratoryName: row.laboratoryName,
        belongToWorkplace: Array.isArray(row.belongToDepts)
          ? row.belongToDepts
          : row.belongToDepts
            ? [row.belongToDepts]
            : [],
        belongToBuilding: row.belongToBuilding || null,
        managerName: firstManager?.realName || "",
        managerPhone: firstManager?.phone || "",
        securityLevel: row.securityLevel || "",
        classCapacity: row.classCapacity ?? 100,
        area: row.area ?? 200,
        intro: row.intro || "",
      });
    }
  },
);

function reset() {
  formRef.value?.resetFields();
  Object.assign(form, {
    laboratoryId: "",
    laboratoryName: "",
    belongToWorkplace: [],
    belongToBuilding: null,
    managerName: "",
    managerPhone: "",
    securityLevel: "",
    classCapacity: 100,
    area: 200,
    intro: "",
  });
}

async function submit() {
  console.log("[submit] 开始提交，表单数据:", JSON.parse(JSON.stringify(form)));
  console.log(
    "[submit] classCapacity 类型:",
    typeof form.classCapacity,
    "值:",
    form.classCapacity,
  );
  console.log("[submit] area 类型:", typeof form.area, "值:", form.area);

  const valid = await formRef.value?.validate().catch((err) => {
    console.log("[submit] 验证失败:", err);
    return false;
  });
  console.log("[submit] 验证结果:", valid);
  if (!valid) return;

  loading.value = true;
  try {
    // 根据负责人姓名查找用户
    let managerUserId = null;
    const existingUser = visibleUserList.value.find(
      (u) => u.realName === form.managerName.trim(),
    );

    if (existingUser) {
      // 用户已存在，使用现有用户ID
      managerUserId = existingUser.id;
      console.log("[submit] 找到现有用户:", existingUser);
    } else {
      // 用户不存在，创建新用户
      console.log("[submit] 用户不存在，创建新用户");
      const randomStr = Math.random().toString(36).substring(2, 8);
      const userData = {
        username: `user_${randomStr}`,
        password: `Pass${Math.random().toString(36).substring(2, 10)}`,
        realName: form.managerName.trim(),
        email: `user_${randomStr}@lab.local`,
        phone: form.managerPhone.trim(),
        createBy: userStore.userInfo.id,
        permissions: [],
        deptIds: form.belongToWorkplace || [],
        laboratoryIds: [],
      };

      const createRes = await apiCreateUser(userData);
      console.log("[submit] 创建用户返回:", createRes);
      
      // 从返回数据中提取新用户ID
      const newUserData = createRes.data?.data || createRes.data;
      managerUserId = newUserData?.id;
      
      if (!managerUserId) {
        throw new Error("创建用户失败，未返回用户ID");
      }
      
      // 刷新用户列表
      await userStore.fetchVisibleTree().catch(() => {});
      ElMessage.success("已自动创建新用户");
    }

    const payload = {
      laboratoryId: form.laboratoryId,
      laboratoryName: form.laboratoryName,
      belongToBuilding: form.belongToBuilding,
      area: form.area,
      classCapacity: form.classCapacity,
      securityLevel: form.securityLevel,
      belongToDeptIds: form.belongToWorkplace || [],
      intro: form.intro || "",
      userIds: [managerUserId],
      phone: form.managerPhone.trim(),
    };

    if (props.isAdd) {
      await baseStore.addLaboratory(payload);
    } else {
      await baseStore.editLaboratory({ id: currentId.value, ...payload });
    }

    ElMessage.success(props.isAdd ? "添加成功" : "修改成功");
    visible.value = false;
    emit("success");
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error(error.message || "操作失败");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.workplace-item :deep(.el-select) {
  width: 100%;
}

.workplace-item :deep(.el-select__tags) {
  max-width: calc(100% - 30px) !important;
  flex-wrap: wrap;
  height: auto;
  max-height: 60px;
  overflow-y: auto;
}

.selected-tags-item :deep(.el-form-item__content) {
  line-height: normal;
}

.selected-tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0;
}

.selected-tags-wrapper .el-tag {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-workplaces-display {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 0;
}

.add-option {
  border-top: 1px dashed var(--el-border-color);
  margin-top: 4px;
  padding-top: 4px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

.option-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.option-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  margin-left: 8px;
  padding: 0 4px;
  height: 22px;
  font-size: 12px;
}
</style>

<style>
.workplace-select-dropdown .el-select-dropdown__item {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-select-dropdown .el-select-dropdown__item {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
