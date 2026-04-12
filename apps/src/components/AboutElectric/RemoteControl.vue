<template>
  <el-dialog
    v-model="showRemote"
    width="480px"
    top="35vh"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="handleClosed"
  >
    <template #header>
      <div style="width: 100%; text-align: center; font-size: 18px">
        远程控制
      </div>
    </template>

    <el-form :model="form" label-width="100px">
      <!-- 当前选中设备 -->
      <el-form-item label="当前选中">
        <el-select
          v-model="form.selectedDeviceIds"
          placeholder="请选择设备"
          multiple
          collapse-tags
          collapse-tags-tooltip
          style="width: 100%"
          @change="handleDeviceChange"
        >
          <el-option
            v-for="item in deviceOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <!-- 空开状态 -->
      <el-form-item label="通电状态">
        <el-select v-model="form.switchStatus" style="width: 100%">
          <el-option label="通电" value="通电" />
          <el-option label="断电" value="断电" />
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <template #footer>
      <div style="display: flex; justify-content: center; gap: 20px">
        <el-button @click="showRemote = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { controlDevice } from "@/api/device";

const showRemote = defineModel({ default: false });

const props = defineProps({
  selectedRows: {
    type: Array,
    default: () => [],
  },
  laboratoryList: {
    type: Array,
    default: () => [],
  },
});

const loading = ref(false);

// 获取实验室名称
const getLabName = (labId) => {
  const lab = props.laboratoryList.find((item) => item.id === labId);
  return lab?.laboratoryName || lab?.laboratoryId || labId || "-";
};

const form = reactive({
  selectedDeviceIds: [],
  switchStatus: "断电",
});

// 值映射：表单值 -> 协议数值
const valueMaps = {
  switchStatus: {
    通电: 1,
    断电: 0,
  },
};

// 反向映射：协议数值 -> 表单值（用于回显）
const reverseMaps = {
  switchStatus: { 1: "通电", 0: "断电" },
};

// 同步设备状态到表单
const syncFormFromDevice = (deviceId) => {
  const device = props.selectedRows.find((row) => row.id === deviceId);
  if (device) {
    form.switchStatus = parseDeviceStatus(device);
  }
};

watch(
  () => props.selectedRows,
  (newRows) => {
    if (newRows?.length > 0) {
      form.selectedDeviceIds = newRows.map((row) => row.id);
      syncFormFromDevice(form.selectedDeviceIds[0]);
    }
  },
  { immediate: true, deep: true },
);

const handleDeviceChange = (selectedIds) => {
  if (selectedIds?.length > 0) {
    syncFormFromDevice(selectedIds[0]);
  }
};

const deviceOptions = computed(() => {
  return props.selectedRows.map((row) => ({
    value: row.id,
    label: `${row.deviceName} (${getLabName(row.labId)})`,
    rawData: row,
  }));
});

// 将设备状态转换为表单值
const parseDeviceStatus = (device) => {
  const status = device.switchStatus;
  // 处理字符串或数字状态
  if (status === "通电" || status === 1 || status === "1") {
    return "通电";
  }
  return "断电";
};

// 根据操作类型构建控制指令
const buildCommand = (device, operation) => {
  const commandLine =
    operation === "close" ? "CLOSE_CIRCUITBREAK" : "OPEN_CIRCUITBREAK";

  return {
    priority: "0",
    deviceType: "CircuitBreak",
    deviceId: device.id,
    commandLine: commandLine,
    args: [
      device.address, // args[0]: address
    ],
  };
};

// 确定提交
const handleConfirm = async () => {
  if (form.selectedDeviceIds.length === 0) {
    ElMessage.warning("请选择至少一台设备");
    return;
  }

  loading.value = true;

  try {
    // 为每个选中的设备发送指令
    const promises = form.selectedDeviceIds.map((deviceId) => {
      const device = props.selectedRows.find((row) => row.id === deviceId);
      if (!device) throw new Error(`未找到设备: ${deviceId}`);

      const operation = form.switchStatus === "通电" ? "open" : "close";
      const command = buildCommand(device, operation);
      return controlDevice(command);
    });

    await Promise.all(promises);

    ElMessage.success(`成功控制 ${form.selectedDeviceIds.length} 台设备`);
    showRemote.value = false;
    emit("success");
  } catch (error) {
    console.error("控制失败:", error);
    ElMessage.error(error.message || "控制指令发送失败");
  } finally {
    loading.value = false;
  }
};

const handleClosed = () => {
  form.selectedDeviceIds = [];
  form.switchStatus = "断电";
};

const emit = defineEmits(["success"]);
</script>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 25px;
}
</style>
