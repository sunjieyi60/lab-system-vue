<template>
  <el-dialog
    v-model="visible"
    title="新增网关"
    width="480px"
    top="30vh"
    :close-on-click-modal="false"
    :custom-class="'custom-dialog'"
    @closed="reset"
  >
    <el-form ref="formRef" :model="form" label-width="120px" :rules="rules">
      <!-- 网关类型 -->
      <el-form-item label="网关类型" prop="gatewayType" required>
        <el-select v-model="form.gatewayType" placeholder="请选择网关类型" style="width: 100%">
          <el-option label="RS485" value="rs485" />
          <el-option label="Socket" value="socket" />
        </el-select>
      </el-form-item>

      <el-form-item label="网关名称" prop="gatewayName" required>
        <el-input v-model="form.gatewayName" placeholder="请输入网关名称" />
      </el-form-item>

      <el-form-item label="所属实验室" prop="belongToLaboratoryId" required>
        <el-select v-model="form.belongToLaboratoryId" placeholder="请选择实验室" style="width: 100%">
          <el-option
            v-for="lab in laboratoryList"
            :key="lab.id"
            :label="lab.laboratoryId"
            :value="lab.id"
          />
        </el-select>
      </el-form-item>

      <!-- RS485网关特有字段 -->
      <template v-if="form.gatewayType === 'rs485'">
        <el-form-item label="发送主题" prop="sendTopic" required>
          <el-input v-model="form.sendTopic" placeholder="请输入发送主题，如：lab/gateway/1/send" />
        </el-form-item>

        <el-form-item label="接收主题" prop="acceptTopic" required>
          <el-input v-model="form.acceptTopic" placeholder="请输入接收主题，如：lab/gateway/1/accept" />
        </el-form-item>
      </template>

      <!-- Socket网关特有字段 -->
      <template v-if="form.gatewayType === 'socket'">
        <el-form-item label="IP地址" prop="ipAddress" required>
          <el-input v-model="form.ipAddress" placeholder="请输入IP地址" />
        </el-form-item>

        <el-form-item label="端口" prop="port" required>
          <el-input-number v-model="form.port" :min="1" :max="65535" placeholder="请输入端口" style="width: 100%" />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <div style="display: flex; justify-content: center; gap: 20px">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { createRS485Gateway, createSocketGateway } from "@/api/device";

const props = defineProps({
  modelValue: Boolean,
  // 实验室列表（用于下拉选择）
  laboratoryList: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "success"]);

const visible = ref(false);
const formRef = ref();
const loading = ref(false);

const form = reactive({
  gatewayType: "rs485",
  gatewayName: "",
  belongToLaboratoryId: null,
  // RS485特有
  sendTopic: "",
  acceptTopic: "",
  // Socket特有
  ipAddress: "",
  port: 8080,
});

const rules = {
  gatewayType: [{ required: true, message: "请选择网关类型", trigger: "change" }],
  gatewayName: [{ required: true, message: "请输入网关名称", trigger: "blur" }],
  belongToLaboratoryId: [{ required: true, message: "请选择所属实验室", trigger: "change" }],
  sendTopic: [{ required: true, message: "请输入发送主题", trigger: "blur" }],
  acceptTopic: [{ required: true, message: "请输入接收主题", trigger: "blur" }],
  ipAddress: [{ required: true, message: "请输入IP地址", trigger: "blur" }],
  port: [{ required: true, message: "请输入端口", trigger: "blur" }],
};

// 双向绑定
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      // 打开弹窗时初始化默认值
      form.sendTopic = "";
      form.acceptTopic = "";
      form.ipAddress = "";
      form.port = 8080;
    }
  },
);

watch(visible, (val) => {
  emit("update:modelValue", val);
});

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    let res;
    if (form.gatewayType === "rs485") {
      // 提交RS485网关数据
      const data = {
        gatewayName: form.gatewayName,
        sendTopic: form.sendTopic,
        acceptTopic: form.acceptTopic,
        belongToLaboratoryId: form.belongToLaboratoryId,
      };
      res = await createRS485Gateway(data);
    } else {
      // 提交Socket网关数据
      const data = {
        gatewayName: form.gatewayName,
        ipAddress: form.ipAddress,
        port: form.port,
        belongToLaboratoryId: form.belongToLaboratoryId,
      };
      res = await createSocketGateway(data);
    }
    
    ElMessage.success("网关创建成功");
    visible.value = false;
    emit("success");
  } catch (error) {
    ElMessage.error(error.message || "网关创建失败");
  } finally {
    loading.value = false;
  }
}

// 关闭时重置
function reset() {
  formRef.value?.resetFields();
  Object.assign(form, {
    gatewayType: "rs485",
    gatewayName: "",
    belongToLaboratoryId: null,
    sendTopic: "",
    acceptTopic: "",
    ipAddress: "",
    port: 8080,
  });
}
</script>

<style scoped>
:deep(.el-form-item__label) {
  margin-bottom: 0 !important;
}
:deep(.el-input__wrapper) {
  margin-bottom: 10px;
}
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  height: 30px !important;
  line-height: 30px !important;
}
</style>
