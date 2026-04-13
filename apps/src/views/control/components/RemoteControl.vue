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

    <el-form :model="form" label-width="80px">
      <!-- 当前选中设备 -->
      <el-form-item label="当前选中">
        <div class="selected-device">
          {{ selectedDeviceNames }}
        </div>
      </el-form-item>

      <!-- 开关 -->
      <el-form-item label="开关">
        <el-select v-model="form.power" style="width: 100%">
          <el-option label="开" value="开" />
          <el-option label="关" value="关" />
        </el-select>
      </el-form-item>

      <!-- 模式 -->
      <el-form-item label="模式">
        <el-select v-model="form.mode" style="width: 100%">
          <el-option label="制热" value="制热" />
          <el-option label="制冷" value="制冷" />
          <el-option label="送风" value="送风" />
          <el-option label="除湿" value="除湿" />
        </el-select>
      </el-form-item>

      <!-- 温度 -->
      <el-form-item label="温度">
        <el-select v-model="form.temperature" style="width: 100%">
          <el-option
            v-for="temp in temperatureOptions"
            :key="temp"
            :label="temp + '℃'"
            :value="temp"
          />
        </el-select>
      </el-form-item>

      <!-- 风速 -->
      <el-form-item label="风速">
        <el-select v-model="form.fanSpeed" style="width: 100%">
          <el-option label="自动" value="自动" />
          <el-option label="低速" value="低速" />
          <el-option label="中速" value="中速" />
          <el-option label="高速" value="高速" />
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

const emit = defineEmits(["success"]);

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
const getLabName = (labId) => {
  const lab = props.laboratoryList.find((item) => item.id === labId);
  return lab?.laboratoryId || lab?.laboratoryName || labId || "-";
};
const form = reactive({
  power: "关",
  mode: "制冷",
  fanSpeed: "自动",
  temperature: 24,
});

// 值映射：表单值 -> 协议数值
const valueMaps = {
  power: {
    开: 1,
    关: 0,
  },
  mode: {
    制热: 1,
    制冷: 2,
    送风: 4,
    除湿: 8,
  },
  fanSpeed: {
    自动: 0,
    低速: 1,
    中速: 2,
    高速: 3,
  },
};

// 反向映射：协议数值 -> 表单值（用于回显）
const reverseMaps = {
  power: { 1: "开", 0: "关" },
  mode: { 1: "制热", 2: "制冷", 4: "送风", 8: "除湿" },
  fanSpeed: { 0: "自动", 1: "低速", 2: "中速", 3: "高速" },
};

const temperatureOptions = ref(Array.from({ length: 15 }, (_, i) => i + 16));

// 同步设备状态到表单
const syncFormFromDevice = (deviceId) => {
  const device = props.selectedRows.find((row) => row.id === deviceId);
  if (device) {
    const status = parseDeviceStatus(device);
    form.power = status.power;
    form.mode = status.mode;
    form.fanSpeed = status.fanSpeed;
    form.temperature = status.temperature;
  }
};

watch(
  () => props.selectedRows,
  (newRows) => {
    if (newRows?.length > 0) {
      console.log("【RemoteControl】选中行数据:", newRows);
      syncFormFromDevice(newRows[0].id);
    } else {
      // 没有选中行时重置表单
      form.power = "关";
      form.mode = "制冷";
      form.fanSpeed = "自动";
      form.temperature = 24;
    }
  },
  { immediate: true, deep: true },
);



// 当前选中设备名称展示
const selectedDeviceNames = computed(() => {
  if (!props.selectedRows?.length) return "-";
  return props.selectedRows.map(row => `${row.airCond} (${getLabName(row.labId)})`).join("、");
});

// 将设备状态转换为表单值
const parseDeviceStatus = (device) => {
  const power = device.switch; // "开" 或 "关"
  const mode = device.mode; // 如 "制冷"、"制热" 等
  const fanSpeed = device.windSpeed; // 如 "自动"、"低速" 等
  const temp = device.temp; // 温度数值

  // 处理开关：如果是字符串直接用，如果是数字则转换
  let powerValue;
  if (power === "开" || power === 1 || power === "1") {
    powerValue = "开";
  } else if (power === "关" || power === 0 || power === "0") {
    powerValue = "关";
  } else {
    powerValue = "关"; // 默认
  }

  // 处理模式：如果是有效字符串直接用，否则尝试反向映射
  const validModes = ["制热", "制冷", "送风", "除湿"];
  let modeValue = validModes.includes(mode) ? mode : reverseMaps.mode[mode];
  if (!modeValue) modeValue = "制冷"; // 默认

  // 处理风速：如果是有效字符串直接用，否则尝试反向映射
  const validSpeeds = ["自动", "低速", "中速", "高速"];
  let fanSpeedValue = validSpeeds.includes(fanSpeed)
    ? fanSpeed
    : reverseMaps.fanSpeed[fanSpeed];
  if (!fanSpeedValue) fanSpeedValue = "自动"; // 默认

  return {
    power: powerValue,
    mode: modeValue,
    fanSpeed: fanSpeedValue,
    temperature: parseInt(temp) || 24,
  };
};

// 构建单条控制指令
const buildCommand = (device) => {
  // 从 device 中获取 address 和 selfId（支持多种字段名）
  const address =
    device.address || device.rawRecord?.address || device.rawDevice?.address;
  const selfId =
    device.selfId || device.rawRecord?.selfId || device.rawDevice?.selfId;

  if (!address || selfId === undefined) {
    throw new Error(
      `设备 ${device.airCond || device.id} 缺少 address 或 selfId`,
    );
  }

  return {
    priority: "0",
    deviceType: "AirCondition",
    deviceId: device.id,
    commandLine: "ENHANCE_CONTROL_AIR_CONDITION",
    args: [
      parseInt(address), // args[0]: address
      parseInt(selfId), // args[1]: selfId
      parseInt(valueMaps.power[form.power]), // args[2]: 开关 (0=关, 1=开)
      parseInt(valueMaps.mode[form.mode]), // args[3]: 模式 (1=制热, 2=制冷, 4=送风, 8=除湿)
      parseInt(form.temperature), // args[4]: 温度
      parseInt(valueMaps.fanSpeed[form.fanSpeed]), // args[5]: 风速 (0=自动, 1=低速, 2=中速, 3=高速)
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
    // 为每个选中的设备发送指令
    const promises = props.selectedRows.map((device) => {
      const command = buildCommand(device);
      return controlDevice(command);
    });

    await Promise.all(promises);

    ElMessage.success(`成功控制 ${props.selectedRows.length} 台设备`);
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
  form.power = "关";
  form.mode = "制冷";
  form.fanSpeed = "自动";
  form.temperature = 24;
  // 通知父组件弹窗已关闭
  emit("closed");
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
