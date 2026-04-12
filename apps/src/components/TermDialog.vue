<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="420px"
    top="40vh"
    @closed="reset"
  >
    <el-form ref="formRef" :model="form" label-width="100px" :rules="rules">
      <!-- 批量模式：显示选中的学期名称（只读） -->
      <el-form-item label="选中学期" v-if="mode === 'batch'">
        <div class="selected-terms">
          {{ selectedNamesText }}
        </div>
      </el-form-item>

      <!-- 普通模式：编辑名称 -->
      <el-form-item label="学年学期" prop="name" v-else>
        <el-input v-model="form.name" placeholder="如：2024-2025学年 第1学期" />
      </el-form-item>

      <el-form-item label="起始时间" prop="startDate">
        <el-date-picker
          v-model="form.startDate"
          type="date"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item label="截止时间" prop="endDate">
        <el-date-picker
          v-model="form.endDate"
          type="date"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div style="text-align: center">
        <el-button type="primary" :loading="loading" @click="submit">
          确定
        </el-button>
        <el-button @click="visible = false">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch, nextTick, computed } from "vue";
import { ElMessage } from "element-plus";
import { useEduStore } from "@/stores/edu";

const eduStore = useEduStore();

const props = defineProps({
  modelValue: Boolean,
  row: Object,
  isBatch: Boolean,
});
const emit = defineEmits(["update:modelValue", "success"]);

/* 控制显隐 */
const visible = ref(false);
watch(
  () => props.modelValue,
  (v) => (visible.value = v),
);
watch(visible, (v) => emit("update:modelValue", v));

/* 模式 */
const mode = ref("add");
const dialogTitle = computed(() => {
  if (mode.value === "batch") return "批量修改学期";
  if (mode.value === "add") return "添加学期";
  return "修改学期";
});

/* 显示选中的学期名称 */
const selectedNamesText = computed(() => {
  if (!props.row?.names?.length) return "";
  // 超过3个显示省略
  const names = props.row.names;
  if (names.length <= 3) return names.join("、");
  return `${names.slice(0, 3).join("、")} 等 ${names.length} 个学期`;
});

/* 表单 */
const formRef = ref();
const form = reactive({
  id: null,
  name: "",
  startDate: "",
  endDate: "",
});

const rules = {
  name: [{ required: true, message: "请输入学年学期", trigger: "blur" }],
  startDate: [{ required: true, message: "请选择起始时间", trigger: "change" }],
  endDate: [{ required: true, message: "请选择截止时间", trigger: "change" }],
};
const loading = ref(false);

/* 打开时初始化 */
watch(visible, async (v) => {
  if (!v) return;
  await nextTick();
  reset();

  if (!props.row) {
    mode.value = "add";
  } else if (props.isBatch || props.row.id === null) {
    mode.value = "batch";
    // 批量模式：从 row 取时间
    form.startDate = props.row.startDate || "";
    form.endDate = props.row.endDate || "";
    // 名称不需要填，显示在只读区域
  } else {
    mode.value = "edit";
    Object.assign(form, props.row);
  }
});

/* 重置 */
function reset() {
  formRef.value?.resetFields();
  Object.assign(form, { id: null, name: "", startDate: "", endDate: "" });
}

/* 提交 */
async function submit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    let success = false;
    const payload = {
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
    };

    if (mode.value === "add") {
      success = await eduStore.addNewTerm(payload);
    } else if (mode.value === "edit") {
      success = await eduStore.modifyTerm(form.id, payload);
    } else if (mode.value === "batch") {
      // 确保用 props.row.ids，不是 undefined
      const ids = props.row?.ids || [];

      await Promise.all(
        ids.map((id) =>
          eduStore.modifyTerm(id, {
            startDate: form.startDate,
            endDate: form.endDate,
          }),
        ),
      );
      success = true;
    }

    if (success) {
      ElMessage.success("操作成功");
      visible.value = false;
      emit("success");
    } else {
      ElMessage.error(eduStore.error || "操作失败");
    }
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("操作失败");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.selected-terms {
  padding: 8px 12px;
  width: 198px;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  max-height: 80px;
  overflow-y: auto;
}
</style>
