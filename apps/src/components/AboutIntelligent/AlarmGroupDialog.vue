<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑报警组' : '添加报警组'"
    width="550px"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="报警名称">
        <el-input v-model="form.name" placeholder="请输入报警名称" />
      </el-form-item>

      <el-form-item label="报警方式">
        <el-checkbox-group v-model="form.alarmTypes">
          <el-checkbox label="system">系统消息</el-checkbox>
          <el-checkbox label="email">邮件</el-checkbox>
          <el-checkbox label="sms">短信</el-checkbox>
          <el-checkbox label="phone">电话</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="触发条件">
        <el-select v-model="form.triggerCondition" placeholder="选择触发条件" style="width: 100%">
          <el-option label="策略执行失败" value="EXECUTION_FAILED" />
          <el-option label="策略执行成功" value="EXECUTION_SUCCESS" />
          <el-option label="设备无响应" value="DEVICE_NO_RESPONSE" />
          <el-option label="条件满足" value="CONDITION_MET" />
          <el-option label="条件不满足" value="CONDITION_NOT_MET" />
        </el-select>
      </el-form-item>

      <el-form-item label="报警内容">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="4"
          placeholder="输入报警内容模板，可使用变量如：${strategyName}, ${labName}, ${time}"
        />
      </el-form-item>

      <el-form-item label="启用状态">
        <el-switch v-model="form.enabled" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.data);

const form = reactive({
  id: "",
  name: "",
  alarmTypes: ["system"],
  triggerCondition: "",
  content: "",
  enabled: true,
});

// 重置表单（必须在watch之前定义）
const resetForm = () => {
  form.id = "";
  form.name = "";
  form.alarmTypes = ["system"];
  form.triggerCondition = "";
  form.content = "";
  form.enabled = true;
};

// 监听数据变化
watch(() => props.data, (newVal) => {
  if (newVal) {
    Object.assign(form, {
      id: newVal.id || "",
      name: newVal.name || "",
      alarmTypes: newVal.alarmTypes || ["system"],
      triggerCondition: newVal.triggerCondition || "",
      content: newVal.content || "",
      enabled: newVal.enabled !== undefined ? newVal.enabled : true,
    });
  } else {
    resetForm();
  }
}, { immediate: true });

const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};

const handleSave = () => {
  if (!form.name) {
    ElMessage.warning("请输入报警名称");
    return;
  }
  if (form.alarmTypes.length === 0) {
    ElMessage.warning("请至少选择一种报警方式");
    return;
  }

  emit("save", { ...form });
  dialogVisible.value = false;
  resetForm();
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
