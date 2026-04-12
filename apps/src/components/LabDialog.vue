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
      <!-- 修改时也可编辑 -->
      <el-form-item label="实验室编号" prop="laboratoryId">
        <el-input v-model="form.laboratoryId" />
      </el-form-item>

      <el-form-item label="实验室名称" prop="laboratoryName">
        <el-input v-model="form.laboratoryName" />
      </el-form-item>

      <el-form-item
        label="所属单位"
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
          />
          <el-option value="__add_workplace__" class="add-option">
            <el-icon><Plus /></el-icon>
            <span style="color: var(--el-color-primary); margin-left: 4px"
              >新增单位</span
            >
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item
        v-if="selectedWorkplaceNames.length > 0"
        class="selected-tags-item"
      >
        <template #label>
          <span style="color: var(--el-text-color-secondary)">已选单位</span>
        </template>
        <div class="selected-tags-wrapper">
          <el-tag
            v-for="name in selectedWorkplaceNames"
            :key="name"
            type="primary"
            effect="light"
            closable
            @close="removeWorkplace(name)"
          >
            {{ name }}
          </el-tag>
        </div>
      </el-form-item>

      <el-form-item label="所在楼栋" prop="belongToBuilding">
        <el-select
          v-model="form.belongToBuilding"
          clearable
          style="width: 100%"
          :disabled="!form.belongToWorkplace?.length"
          popper-class="building-select-dropdown"
        >
          <el-option
            v-for="b in userBuildings"
            :key="b.id"
            :label="b.buildingName"
            :value="b.id"
          />
          <el-option
            value="__add_building__"
            v-if="form.belongToWorkplace?.length"
            class="add-option"
          >
            <el-icon><Plus /></el-icon>
            <span style="color: var(--el-color-primary); margin-left: 4px"
              >新增楼栋</span
            >
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="负责人" prop="username">
        <el-input v-model="form.username" placeholder="请输入负责人姓名" />
      </el-form-item>

      <!-- 已删除：联系电话 -->

      <el-form-item label="安全等级" prop="securityLevel">
        <el-input v-model="form.securityLevel" />
      </el-form-item>

      <el-form-item label="课容量" prop="classCapacity">
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
      <el-button type="primary" :loading="loading" @click="submit">
        确定
      </el-button>
      <el-button @click="visible = false">取消</el-button>
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
      <el-button
        type="primary"
        :loading="workplaceLoading"
        @click="submitWorkplace"
      >
        确定
      </el-button>
      <el-button @click="workplaceDialogVisible = false">取消</el-button>
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
      <el-form-item label="所属单位">
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
      <el-button
        type="primary"
        :loading="buildingLoading"
        @click="submitBuilding"
      >
        确定
      </el-button>
      <el-button @click="buildingDialogVisible = false">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick, computed } from "vue";
import { ElMessage } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/user";
import { useBaseStore } from "@/stores/base";

const props = defineProps({
  isAdd: Boolean,
  row: Object,
});

const emit = defineEmits(["success"]);
const visible = defineModel();

const userStore = useUserStore();
const baseStore = useBaseStore();

const userWorkplaceList = computed(() => userStore.getDeptList || []);

const loading = ref(false);
const formRef = ref();

const form = reactive({
  laboratoryId: "",
  laboratoryName: "",
  belongToWorkplace: [],
  belongToBuilding: null,
  username: "",
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
    { required: true, message: "请输入实验室名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
  belongToWorkplace: [
    {
      required: true,
      message: "请选择所属单位",
      trigger: "change",
      type: "array",
      min: 1,
    },
  ],
  belongToBuilding: [
    { required: true, message: "请选择所在楼栋", trigger: "change" },
  ],
  username: [
    { required: true, message: "请输入负责人姓名", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  // 已删除 phone 验证规则
  securityLevel: [
    { required: true, message: "请输入安全等级", trigger: "blur" },
  ],
  classCapacity: [
    { required: true, message: "请输入课容量", trigger: "blur" },
    {
      type: "integer",
      min: 0,
      message: "课容量必须为非负整数",
      trigger: "blur",
    },
  ],
  area: [
    { required: true, message: "请输入面积", trigger: "blur" },
    { type: "integer", min: 0, message: "面积必须为非负整数", trigger: "blur" },
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
const userBuildings = computed(() => {
  if (!form.belongToWorkplace?.length) return [];

  const buildingMap = new Map();

  form.belongToWorkplace.forEach((deptId) => {
    const dept = userWorkplaceList.value.find((w) => w.dept.id === deptId);
    if (dept?.buildings?.length) {
      dept.buildings.forEach((b) => {
        if (!buildingMap.has(b.id)) {
          buildingMap.set(b.id, b);
        }
      });
    }
  });

  return Array.from(buildingMap.values());
});

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
    await baseStore.addBuilding({
      buildingName: buildingForm.buildingName,
      deptIds: buildingForm.deptIds,
    });

    buildingDialogVisible.value = false;
    buildingForm.buildingName = "";
    buildingForm.deptIds = [];
    await userStore.refreshUserInfo();
    ElMessage.success("楼栋添加成功");
  } catch (error) {
    console.error("添加楼栋失败:", error);
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

    if (!props.isAdd && props.row) {
      const row = props.row;
      console.log(row);
      currentId.value = row.id; //保存 id
      const managerName = row.managers?.[0]?.realName || "";
      Object.assign(form, {
        laboratoryId: row.laboratoryId,
        laboratoryName: row.laboratoryName,
        belongToWorkplace: Array.isArray(row.belongToDepts)
          ? row.belongToDepts
          : row.belongToDepts
            ? [row.belongToDepts]
            : [],
        belongToBuilding: row.belongToBuilding || null,
        username: managerName,
        // 已删除 phone 赋值
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
    username: "",
    securityLevel: "",
    classCapacity: 100,
    area: 200,
    intro: "",
  });
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const payload = {
      id: currentId.value,
      laboratoryId: form.laboratoryId,
      laboratoryName: form.laboratoryName,
      belongToBuilding: form.belongToBuilding,
      area: form.area,
      classCapacity: form.classCapacity,
      securityLevel: form.securityLevel,
      belongToDeptIds: form.belongToWorkplace || [],
      intro: form.intro || "",
      username: form.username,
      // 已删除 phone
    };

    if (props.isAdd) {
      await baseStore.addLaboratory(payload);
    } else {
      await baseStore.editLaboratory(payload);
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
