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
        <div class="selected-device">
          {{ selectedDeviceNames }}
        </div>
      </el-form-item>

      <!-- 开关状态 -->
      <el-form-item label="开关状态">
        <el-select v-model="form.switchStatus" style="width: 100%">
          <el-option label="开启" value="开启" />
          <el-option label="关闭" value="关闭" />
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

const emit = defineEmits(["success"]);

const loading = ref(false);

// 获取实验室名称
const getLabName = (labId) => {
  const lab = props.laboratoryList.find((item) => item.id === labId);
  return lab?.laboratoryId || lab?.laboratoryName || labId || "-";
};

const form = reactive({
  switchStatus: "关闭",
});

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
      syncFormFromDevice(newRows[0].id);
    }
  },
  { immediate: true, deep: true },
);



// 当前选中设备名称展示
const selectedDeviceNames = computed(() => {
  if (!props.selectedRows?.length) return "-";
  return props.selectedRows.map(row => `${row.deviceName} (${getLabName(row.labId)})`).join("、");
});

// 将设备状态转换为表单值
const parseDeviceStatus = (device) => {
  const status = device.isOpen || device.switchStatus || device.switch;
  // 处理字符串或数字状态
  if (
    status === "开启" ||
    status === 1 ||
    status === "1" ||
    status === true ||
    status === "开"
  ) {
    return "开启";
  }
  return "关闭";
};

// 根据操作类型构建控制指令
const buildCommand = (device, operation) => {
  // operation: 'open' 开启, 'close' 关闭
  const commandLine = operation === "open" ? "OPEN_LIGHT" : "CLOSE_LIGHT";

  return {
    priority: "0",
    deviceType: "Light",
    deviceId: device.id,
    commandLine: commandLine,
    args: [
      parseInt(device.address), // args[0]: address
      parseInt(device.selfId),
    ],
  };
};

// 确定提交
const handleConfirm = async () => {
  if (props.selectedRows.length === 0) {
    ElMessage.warning("未选择设备");
    return;
  }

  loading.value = true;

  try {
    // 确定操作类型
    const operation = form.switchStatus === "开启" ? "open" : "close";

    // 为每个选中的设备发送指令
    const promises = props.selectedRows.map((device) => {
      const command = buildCommand(device, operation);
      console.log("【发送指令】", command);
      return controlDevice(command);
    });

    await Promise.all(promises);

    const actionText = operation === "open" ? "开启" : "关闭";
    ElMessage.success(
      `成功控制 ${props.selectedRows.length} 台设备${actionText}`,
    );
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
  form.switchStatus = "关闭";
};
</script>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 25px;
}

.selected-device {
  padding: 8px 12px;
  width: 100%;
  box-sizing: border-box;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
  max-height: 100px;
  overflow-y: auto;
}
</style>
