<template>
  <el-dialog
    v-model="visible"
    title="延时设置"
    width="420px"
    top="40vh"
    @closed="reset"
  >
    <el-form ref="formRef" :model="form" label-width="100px" :rules="rules">
      <!-- 当前选中（只读展示） -->
      <el-form-item label="当前选中:">
        <div class="selected-device">
          {{ form.device }}
        </div>
      </el-form-item>

      <!-- 延时时间设置 -->
      <el-form-item label="延时时间设置:" prop="delayTime">
        <el-select v-model="form.delayTime" placeholder="请选择延时时间">
          <el-option
            v-for="item in delayTimeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div style="text-align: center">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submit">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch, nextTick } from "vue";
import { ElMessage } from "element-plus";
// 请根据你的项目实际路径修改store导入
// import { useDeviceStore } from "@/stores";

// const deviceStore = useDeviceStore();

const props = defineProps({
  modelValue: Boolean,
  row: Object, // 用于编辑时传入当前选中的设备数据
});

const emit = defineEmits(["update:modelValue", "success"]);

/* 控制显隐 */
const visible = ref(false);
watch(
  () => props.modelValue,
  (v) => (visible.value = v),
);
watch(visible, (v) => emit("update:modelValue", v));

/* 表单数据 */
const formRef = ref();
const form = reactive({
  device: "", // 当前选中的设备，如 "16-208-前门"
  delayTime: "", // 延时时间设置，如 "1-10秒"
});

/* 下拉选项 */
const delayTimeOptions = ref([
  { label: "1-10秒", value: "1-10秒" },
  { label: "11-20秒", value: "11-20秒" },
  { label: "21-30秒", value: "21-30秒" },
  // 可根据实际业务添加更多选项
]);

/* 表单校验规则 */
const rules = {
  delayTime: [{ required: true, message: "请选择延时时间", trigger: "change" }],
};

const loading = ref(false);

/* 打开时初始化 */
watch(visible, async (v) => {
  if (!v) return;
  await nextTick();
  reset();

  if (props.row) {
    // 编辑模式：回填数据
    Object.assign(form, props.row);
  }
});

/* 重置表单 */
function reset() {
  formRef.value?.resetFields();
  Object.assign(form, {
    device: "",
    delayTime: "",
  });
}

/* 提交确定 */
async function submit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    // 这里替换为你的实际API调用逻辑
    // const success = await deviceStore.setDelayTime(form);
    const success = true; // 模拟成功

    if (success) {
      ElMessage.success("操作成功");
      visible.value = false;
      emit("success");
    } else {
      // ElMessage.error(deviceStore.error || "操作失败");
    }
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("操作失败");
  } finally {
    loading.value = false;
  }
}

/* 删除操作 */
async function handleDelete() {
  if (!form.device) {
    ElMessage.warning("请先选择设备");
    return;
  }

  try {
    // 这里替换为你的实际删除逻辑
    // await deviceStore.deleteDelaySetting(form.device);
    ElMessage.success("删除成功");
    visible.value = false;
    emit("success");
  } catch (error) {
    console.error("删除失败:", error);
    ElMessage.error("删除失败");
  }
}
</script>

<style scoped>
.selected-device {
  padding: 8px 12px;
  width: 198px;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}
</style>
