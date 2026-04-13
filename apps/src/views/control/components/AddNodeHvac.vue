<template>
  <el-dialog
    v-model="visible"
    title="新增设备"
    width="480px"
    top="30vh"
    :close-on-click-modal="false"
    :custom-class="'custom-dialog'"
    @closed="reset"
  >
    <el-form ref="formRef" :model="form" label-width="120px" :rules="rules">
      <!-- 设备类型（固定显示，不可修改） -->
      <el-form-item label="设备类型">
        <el-input :value="deviceTypeName" disabled />
      </el-form-item>

      <el-form-item label="设备名称" prop="deviceName" required>
        <el-input v-model="form.deviceName" placeholder="请输入设备名称" />
      </el-form-item>

      <el-form-item label="所属实验室" prop="belongToLaboratoryId" required>
        <el-select
          v-model="form.belongToLaboratoryId"
          placeholder="请选择实验室"
          style="width: 100%"
        >
          <el-option
            v-for="lab in laboratoryList"
            :key="lab.id"
            :label="lab.laboratoryId"
            :value="lab.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="设备地址" prop="address" required>
        <el-input-number
          v-model="form.address"
          :min="addressConfig.min"
          :max="addressConfig.max"
          placeholder="请输入设备地址"
          style="width: 100%"
        />
        <div class="address-hint">
          地址范围：{{ addressConfig.min }} - {{ addressConfig.max }}
        </div>
      </el-form-item>

      <el-form-item label="内机地址" prop="selfId" required>
        <el-input-number
          v-model="form.selfId"
          :min="1"
          placeholder="请输入内机地址"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="RS485网关" prop="rs485GatewayId" required>
        <el-select
          v-model="form.rs485GatewayId"
          placeholder="请选择RS485网关"
          style="width: 100%"
        >
          <el-option
            v-for="gateway in rs485GatewayOptions"
            :key="gateway.value"
            :label="gateway.label"
            :value="gateway.value"
          />
        </el-select>
      </el-form-item>

      <!-- 中央空调特有：机组字段 -->
      <el-form-item v-if="isAirCondition" label="机组">
        <el-input v-model="form.groupId" placeholder="请输入机组编号（可选）" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div style="display: flex; justify-content: center; gap: 20px">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit"
          >确定</el-button
        >
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { createDevice } from "@/api/device";
import { DeviceTypeName, useDeviceStore } from "@/stores";

const props = defineProps({
  modelValue: Boolean,
  // 固定设备类型（根据页面自动传入）
  deviceType: {
    type: String,
    default: "AirCondition", // 中央空调页面默认空调
  },
  // 实验室列表（用于下拉选择）
  laboratoryList: {
    type: Array,
    default: () => [],
  },
  // 是否根据所选实验室筛选RS485网关
  filterGatewayByLab: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "success"]);

const deviceStore = useDeviceStore();

const visible = ref(false);
const formRef = ref();
const loading = ref(false);

// 设备类型显示名称
const deviceTypeName = computed(() => {
  return DeviceTypeName[props.deviceType] || props.deviceType;
});

// 是否是中央空调
const isAirCondition = computed(() => props.deviceType === "AirCondition");

// RS485网关下拉选项
const rs485GatewayOptions = computed(() => {
  if (props.filterGatewayByLab && form.belongToLaboratoryId) {
    return deviceStore.getRS485GatewayOptionsByLabId(form.belongToLaboratoryId);
  }
  return deviceStore.getRS485GatewayOptions;
});

// 根据设备类型获取默认地址和范围
function getAddressConfig(deviceType) {
  switch (deviceType) {
    case "AirCondition": // 空调
      return { min: 31, max: 40, default: 31 };
    case "Light": // 灯光
      return { min: 41, max: 60, default: 41 };
    case "Access": // 门禁
      return { min: 1, max: 10, default: 1 };
    case "Sensor": // 传感器
      return { min: 61, max: 80, default: 61 };
    case "CircuitBreak": // 断路器
      return { min: 11, max: 30, default: 11 };
    default:
      return { min: 1, max: 255, default: 1 };
  }
}

const addressConfig = computed(() => getAddressConfig(props.deviceType));

const form = reactive({
  deviceName: "",
  deviceType: props.deviceType,
  belongToLaboratoryId: null,
  address: 1,
  selfId: 1,
  rs485GatewayId: null,
  groupId: "",
});

const rules = {
  deviceName: [{ required: true, message: "请输入设备名称", trigger: "blur" }],
  belongToLaboratoryId: [
    { required: true, message: "请选择所属实验室", trigger: "change" },
  ],
  address: [{ required: true, message: "请输入设备地址", trigger: "blur" }],
  selfId: [{ required: true, message: "请输入设备标识", trigger: "blur" }],
  rs485GatewayId: [
    { required: true, message: "请选择RS485网关", trigger: "change" },
  ],
};

// 双向绑定
watch(
  () => props.modelValue,
  async (val) => {
    visible.value = val;
    if (val) {
      // 打开弹窗时更新设备类型
      form.deviceType = props.deviceType;
      // 设置默认地址
      form.address = addressConfig.value.default;
      // 加载RS485网关列表
      if (Object.keys(deviceStore.rs485GatewayMap).length === 0) {
        await deviceStore.fetchRS485Gateways();
      }
      // 默认选中第一个RS485网关（如果有）
      const options = rs485GatewayOptions.value;
      if (options.length > 0 && !form.rs485GatewayId) {
        form.rs485GatewayId = options[0].value;
      }
    }
  },
);

// 监听实验室变化，清空已选网关（如果当前网关不属于新实验室）
watch(
  () => form.belongToLaboratoryId,
  (newLabId) => {
    if (props.filterGatewayByLab && newLabId && form.rs485GatewayId) {
      const validGateways = deviceStore.getRS485GatewayOptionsByLabId(newLabId);
      const isValid = validGateways.some(
        (g) => g.value === form.rs485GatewayId,
      );
      if (!isValid) {
        form.rs485GatewayId = null;
      }
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
    const res = await createDevice(form);
    // 检查后端返回的业务状态
    if (res.data.code === 500) {
      ElMessage.error(res.data.msg || "设备创建失败");
      return;
    }
    ElMessage.success("设备创建成功");
    visible.value = false;
    emit("success");
  } catch (error) {
    ElMessage.error(error.message || "设备创建失败");
  } finally {
    loading.value = false;
  }
}

// 关闭时重置
function reset() {
  formRef.value?.resetFields();
  Object.assign(form, {
    deviceName: "",
    deviceType: props.deviceType,
    belongToLaboratoryId: null,
    address: addressConfig.value.default,
    selfId: 1,
    rs485GatewayId: null,
    groupId: "",
  });
}
</script>

<style scoped>
/* 复用 LabDialog 的样式穿透 */
:deep(.el-form-item__label) {
  margin-bottom: 10px;
}
:deep(.el-input__wrapper) {
  margin-bottom: 10px;
}

.address-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

:deep(.el-form-item__label) {
  margin-bottom: 0 !important;
}
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  height: 30px !important;
  line-height: 30px !important;
}
</style>
