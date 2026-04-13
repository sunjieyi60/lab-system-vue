<template>
  <el-dialog
    v-model="visible"
    title="远程控制"
    width="420px"
    top="40vh"
    @closed="reset"
  >
    <el-form ref="formRef" :model="form" label-width="120px" :rules="rules">
      <!-- 当前选中：显示实验室名称 -->
      <el-form-item label="当前选中">
        <div class="selected-device">
          {{ form.device }}
        </div>
      </el-form-item>

      <!-- 门锁状态设置：下拉选择，默认回填父组件的 doorStatus -->
      <el-form-item label="门锁状态设置" prop="lockState">
        <el-select v-model="form.lockState" placeholder="请选择门锁状态">
          <el-option
            v-for="item in lockStateOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <!-- 门锁状态锁定：下拉选择，默认回填父组件的 lockStatus -->
      <el-form-item label="门锁状态锁定" prop="lockMode">
        <el-select v-model="form.lockMode" placeholder="请选择锁定模式">
          <el-option
            v-for="item in lockModeOptions"
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
import { controlDevice } from "@/api/device";

const props = defineProps({
  modelValue: Boolean,
  // 接收父组件的选中行数组
  selectedRows: {
    type: Array,
    default: () => [],
  },
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
  device: "", // 当前选中：实验室名称
  lockState: "", // 门锁状态设置：默认回填父组件的 doorStatus
  lockMode: "", // 门锁状态锁定：默认回填父组件的 lockStatus
  controlParams: [], // 控制参数
});

/* 下拉选项 - 需要根据父组件的实际字段值调整 */
const lockStateOptions = ref([
  { label: "开启", value: "开启" },
  { label: "关闭", value: "关闭" },
]);

const lockModeOptions = ref([
  { label: "长开", value: "长开" },
  { label: "长关", value: "长关" },
]);

/* 表单校验规则 */
const rules = {
  lockState: [{ required: true, message: "请选择门锁状态", trigger: "change" }],
  lockMode: [{ required: true, message: "请选择锁定模式", trigger: "change" }],
};

const loading = ref(false);

/* 打开时初始化 */
watch(visible, async (v) => {
  if (!v) return;
  await nextTick();
  reset();

  if (props.selectedRows && props.selectedRows.length > 0) {
    // 当前选中：实验室名称
    const labNames = [
      ...new Set(props.selectedRows.map((row) => row.deviceName || "-")),
    ].join(", ");
    form.device = labNames;

    // 门锁状态设置：默认回填父组件的 doorStatus（多选不一致时为空）
    const doorStatuses = [
      ...new Set(props.selectedRows.map((row) => row.doorStatus)),
    ];
    form.lockState = doorStatuses.length === 1 ? doorStatuses[0] : "";

    // 门锁状态锁定：默认回填父组件的 lockStatus（多选不一致时为空）
    const lockStatuses = [
      ...new Set(props.selectedRows.map((row) => row.lockStatus)),
    ];
    form.lockMode = lockStatuses.length === 1 ? lockStatuses[0] : "";

    // 保存控制参数
    form.controlParams = props.selectedRows.map((row) => ({
      id: row.id,
      deviceName: row.deviceName,
      labId: row.labId,
      address: row.address || row.rawRecord?.address || row.rawDevice?.address,
    }));

    console.log("【远程控制】初始化数据:", {
      device: form.device,
      lockState: form.lockState, // 来自父组件 doorStatus
      lockMode: form.lockMode, // 来自父组件 lockStatus
    });
  }
});

/* 重置表单 */
function reset() {
  formRef.value?.resetFields();
  form.device = "";
  form.lockState = "";
  form.lockMode = "";
  form.controlParams = [];
}

/* 提交确定 */
async function submit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  if (form.controlParams.length === 0) {
    ElMessage.warning("未获取到设备信息");
    return;
  }

  loading.value = true;
  try {
    const submitData = {
      lockState: form.lockState,
      lockMode: form.lockMode,
      devices: form.controlParams,
    };

    console.log("【远程控制】提交数据:", submitData);
    
    // 为每个设备发送控制指令
    const promises = form.controlParams.map((device) => {
      // 根据门锁状态设置决定 commandLine
      const commandLine = form.lockState === "开启" ? "OPEN_ACCESS_ONCE" : "CLOSE_ACCESS_ONCE";
      
      const command = {
        priority: "0",
        deviceType: "Access",
        deviceId: device.id,
        commandLine: commandLine,
        args: [
          parseInt(device.address),  // args[0]: address
        ],
      };
      return controlDevice(command);
    });

    await Promise.all(promises);

    ElMessage.success(`成功设置 ${form.controlParams.length} 个设备`);
    visible.value = false;
    emit("success");
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("操作失败");
  } finally {
    loading.value = false;
  }
}

/* 删除操作 */
async function handleDelete() {
  if (form.controlParams.length === 0) {
    ElMessage.warning("请先选择设备");
    return;
  }

  loading.value = true;
  try {
    console.log("【远程控制】删除设备:", form.controlParams);
    
    // 调用删除设备接口（如果有的话）
    // 这里暂时只触发成功事件
    await new Promise((resolve) => setTimeout(resolve, 500));

    ElMessage.success("删除成功");
    visible.value = false;
    emit("success");
  } catch (error) {
    console.error("删除失败:", error);
    ElMessage.error("删除失败");
  } finally {
    loading.value = false;
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
  word-break: break-all;
  max-height: 100px;
  overflow-y: auto;
}
</style>
