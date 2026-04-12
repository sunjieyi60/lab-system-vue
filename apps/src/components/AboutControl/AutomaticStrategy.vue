<template>
  <el-dialog
    v-model="showAuto"
    top="30vh"
    :close-on-click-modal="false"
    @close="handleChildClose"
    destroy-on-close
    class="auto-strategy-dialog"
    style="
      --el-dialog-header-text-align: center;
      width: 800px;
      left: calc(50% - 800px / 2);
    "
  >
    <template #header>
      <div style="width: 100%; text-align: center; font-size: 18px">
        自动添加/修改
      </div>
    </template>

    <!-- 左右分栏：设备树 + 策略设置表单 -->
    <div
      style="
        display: flex;
        gap: 20px;
        width: 100%;
        height: 480px;
        box-sizing: border-box;
        padding: 10px 0;
      "
    >
      <!-- 左侧设备树 -->
      <div style="width: 220px; flex-shrink: 0; height: 100%; overflow-y: auto">
        <el-tree
          ref="deviceTreeRef"
          :data="deviceTreeData"
          :props="treeProps"
          node-key="id"
          default-expand-all
          highlight-current
          @node-click="handleDeviceNodeClick"
          style="height: 100%"
        />
      </div>

      <!-- 右侧策略设置表单 -->
      <div
        style="
          flex: 1;
          height: 100%;
          overflow-y: auto;
          padding-right: 10px;
          box-sizing: border-box;
        "
      >
        <el-form :model="form" label-width="120px" style="margin: 0">
          <!-- 策略名称 -->
          <el-form-item label="策略名称">
            <el-input
              v-model="form.strategyName"
              placeholder="自动添加策略"
              style="width: 90%"
            />
          </el-form-item>

          <!-- 起始时间提前 -->
          <el-form-item label-width="0">
            <div style="display: flex; align-items: center">
              <el-checkbox
                v-model="form.startTimeEnable"
                size="small"
                style="margin-right: 6px"
              />
              <span style="font-size: 14px; white-space: nowrap">
                起始时间提前：
              </span>

              <el-input-number
                v-model="form.startTimeMinutes"
                :min="0"
                :max="120"
                :disabled="!form.startTimeEnable"
                style="margin-left: 25px; width: 120px"
              />
              <span style="margin-left: 8px; color: #606266">分钟</span>
            </div>
          </el-form-item>

          <!-- 截止时间延后 -->
          <el-form-item label-width="0">
            <div style="display: flex; align-items: center">
              <el-checkbox
                v-model="form.endTimeEnable"
                size="small"
                style="margin-right: 6px; margin-top: 1px"
              />
              <span style="font-size: 14px; white-space: nowrap">
                截止时间延后：
              </span>

              <el-input-number
                v-model="form.endTimeMinutes"
                :min="0"
                :max="120"
                :disabled="!form.endTimeEnable"
                style="margin-left: 25px; width: 120px"
              />
              <span style="margin-left: 8px; color: #606266">分钟</span>
            </div>
          </el-form-item>

          <!-- 检测时间间隔 -->
          <el-form-item label-width="0">
            <div style="display: flex; align-items: center">
              <el-checkbox
                v-model="form.intervalEnable"
                size="small"
                style="margin-right: 6px"
              />
              <span style="font-size: 14px; white-space: nowrap">
                检测时间间隔：
              </span>

              <el-input-number
                v-model="form.intervalMinutes"
                :min="1"
                :max="60"
                :disabled="!form.intervalEnable"
                style="margin-left: 25px; width: 120px"
              />
              <span style="margin-left: 8px; color: #606266">分钟</span>
            </div>
          </el-form-item>

          <!-- 温度条件区域 -->
          <el-form-item label-width="0">
            <div style="display: flex; align-items: flex-start">
              <el-checkbox
                v-model="form.tempConditionEnable"
                size="small"
                style="margin-right: 6px; margin-top: 5px"
              />
              <span style="font-size: 15px; white-space: nowrap">
                温度条件：
              </span>

              <div style="margin-left: 16px; padding-top: 3px">
                <el-form-item
                  label="温度源"
                  label-width="85px"
                  style="margin-bottom: 8px"
                >
                  <el-select
                    v-model="form.tempSource"
                    placeholder="内部(默认)"
                    style="width: 170px"
                    :disabled="!form.tempConditionEnable"
                  >
                    <el-option label="内部(默认)" value="internal" />
                    <el-option label="外部1" value="external1" />
                    <el-option label="外部2" value="external2" />
                  </el-select>
                </el-form-item>
                <el-form-item
                  label="条件"
                  label-width="85px"
                  style="margin-bottom: 8px"
                >
                  <el-select
                    v-model="form.tempRule"
                    placeholder="大于(默认)"
                    style="width: 170px"
                    :disabled="!form.tempConditionEnable"
                  >
                    <el-option label="大于(默认)" value="gt" />
                    <el-option label="等于" value="eq" />
                    <el-option label="小于" value="lt" />
                  </el-select>
                </el-form-item>
                <el-form-item
                  label="阈值"
                  label-width="85px"
                  style="margin-bottom: 8px"
                >
                  <el-select
                    v-model="form.tempThreshold"
                    placeholder="-30℃-60℃"
                    style="width: 170px"
                    :disabled="!form.tempConditionEnable"
                  >
                    <el-option
                      v-for="temp in tempThresholdOptions"
                      :key="temp"
                      :label="`${temp}℃`"
                      :value="temp"
                    />
                  </el-select>
                </el-form-item>
              </div>
            </div>
          </el-form-item>

          <!-- 空调条件区域 -->
          <el-form-item label-width="0">
            <div style="display: flex; align-items: flex-start">
              <el-checkbox
                v-model="form.airConditionEnable"
                size="small"
                style="margin-right: 6px; margin-top: 5px"
              />
              <span style="font-size: 15px; white-space: nowrap">
                空调条件：
              </span>

              <div style="margin-left: 16px; padding-top: 3px">
                <el-form-item
                  label="开关"
                  label-width="85px"
                  style="margin-bottom: 8px"
                >
                  <el-select
                    v-model="form.airPower"
                    placeholder="无(默认)"
                    clearable
                    style="width: 170px"
                    :disabled="!form.airConditionEnable"
                  >
                    <el-option label="无(默认)" value="" />
                    <el-option label="开" value="on" />
                    <el-option label="关" value="off" />
                  </el-select>
                </el-form-item>
                <el-form-item
                  label="模式"
                  label-width="85px"
                  style="margin-bottom: 8px"
                >
                  <el-select
                    v-model="form.airMode"
                    placeholder="无(默认)"
                    clearable
                    style="width: 170px"
                    :disabled="!form.airConditionEnable"
                  >
                    <el-option label="无(默认)" value="" />
                    <el-option label="制冷" value="cool" />
                    <el-option label="制热" value="heat" />
                    <el-option label="通风" value="fan" />
                  </el-select>
                </el-form-item>
                <el-form-item
                  label="风速"
                  label-width="85px"
                  style="margin-bottom: 8px"
                >
                  <el-select
                    v-model="form.airFanSpeed"
                    placeholder="无(默认)"
                    clearable
                    style="width: 170px"
                    :disabled="!form.airConditionEnable"
                  >
                    <el-option label="无(默认)" value="" />
                    <el-option label="自动" value="auto" />
                    <el-option label="低速" value="low" />
                    <el-option label="中速" value="medium" />
                  </el-select>
                </el-form-item>
                <el-form-item
                  label="温度"
                  label-width="85px"
                  style="margin-bottom: 8px"
                >
                  <el-select
                    v-model="form.airTemp"
                    placeholder="无(默认)"
                    clearable
                    style="width: 170px"
                    :disabled="!form.airConditionEnable"
                  >
                    <el-option label="无(默认)" value="" />
                    <el-option
                      v-for="temp in airTempOptions"
                      :key="temp"
                      :label="temp"
                      :value="temp"
                    />
                  </el-select>
                </el-form-item>
              </div>
            </div>
          </el-form-item>

          <!-- 自动报警方式 -->
          <el-form-item label-width="0">
            <div style="display: flex; align-items: flex-start">
              <el-checkbox
                v-model="form.alarmEnable"
                size="small"
                style="margin-right: 6px; margin-top: 5px"
              />
              <span
                style="
                  font-size: 15px;
                  white-space: nowrap;
                  padding-right: 12px;
                "
              >
                自动报警：
              </span>

              <div
                style="
                  margin-left: 16px;
                  position: relative;
                  z-index: 10;
                  pointer-events: auto !important;
                "
              >
                <div
                  :style="{
                    opacity: form.alarmEnable ? 1 : 0.5,
                    cursor: form.alarmEnable ? 'pointer' : 'not-allowed',
                  }"
                >
                  <el-checkbox
                    label="系统"
                    value="system"
                    style="margin-right: 15px"
                    v-model="form.alarmModes"
                    :disabled="!form.alarmEnable"
                  />
                  <el-checkbox
                    label="邮箱"
                    value="email"
                    style="margin-right: 15px"
                    v-model="form.alarmModes"
                    :disabled="!form.alarmEnable"
                  />
                  <el-checkbox
                    label="短信"
                    value="sms"
                    style="margin-right: 15px"
                    v-model="form.alarmModes"
                    :disabled="!form.alarmEnable"
                  />
                  <el-checkbox
                    label="电话"
                    value="phone"
                    style="margin-right: 15px"
                    v-model="form.alarmModes"
                    :disabled="!form.alarmEnable"
                  />
                </div>
              </div>
            </div>
          </el-form-item>

          <!-- 自动控制区域 -->
          <el-form-item label-width="0">
            <div style="display: flex; align-items: flex-start">
              <el-checkbox
                v-model="form.autoControlEnable"
                size="small"
                style="margin-right: 6px; margin-top: 5px"
              />
              <span style="font-size: 15px; white-space: nowrap">
                自动控制：
              </span>

              <div style="margin-left: 16px; margin-top: 5px">
                <el-form-item
                  label="开关"
                  label-width="85px"
                  style="margin-bottom: 8px"
                >
                  <el-select
                    v-model="form.ctrlPower"
                    placeholder="无(默认)"
                    clearable
                    style="width: 170px"
                    :disabled="!form.autoControlEnable"
                  >
                    <el-option label="无(默认)" value="" />
                    <el-option label="开" value="on" />
                    <el-option label="关" value="off" />
                  </el-select>
                </el-form-item>
                <el-form-item
                  label="模式"
                  label-width="85px"
                  style="margin-bottom: 8px"
                >
                  <el-select
                    v-model="form.ctrlMode"
                    placeholder="无(默认)"
                    clearable
                    style="width: 170px"
                    :disabled="!form.autoControlEnable"
                  >
                    <el-option label="无(默认)" value="" />
                    <el-option label="制冷" value="cool" />
                    <el-option label="制热" value="heat" />
                    <el-option label="通风" value="fan" />
                  </el-select>
                </el-form-item>
                <el-form-item
                  label="风速"
                  label-width="85px"
                  style="margin-bottom: 8px"
                >
                  <el-select
                    v-model="form.ctrlFanSpeed"
                    placeholder="无(默认)"
                    clearable
                    style="width: 170px"
                    :disabled="!form.autoControlEnable"
                  >
                    <el-option label="无(默认)" value="" />
                    <el-option label="自动" value="auto" />
                    <el-option label="低速" value="low" />
                    <el-option label="中速" value="medium" />
                  </el-select>
                </el-form-item>
                <el-form-item
                  label="温度"
                  label-width="85px"
                  style="margin-bottom: 8px"
                >
                  <el-select
                    v-model="form.ctrlTemp"
                    placeholder="无(默认)"
                    clearable
                    style="width: 170px"
                    :disabled="!form.autoControlEnable"
                  >
                    <el-option label="无(默认)" value="" />
                    <el-option
                      v-for="temp in airTempOptions"
                      :key="temp"
                      :label="temp"
                      :value="temp"
                    />
                  </el-select>
                </el-form-item>
              </div>
            </div>
          </el-form-item>

          <!-- 操作按钮 -->
          <div
            style="
              width: 100%;
              display: flex;
              justify-content: center;
              gap: 16px;
              padding: 12px 0;
              margin-top: 20px;
            "
          >
            <el-button type="primary" @click="handleConfirm">确定</el-button>
            <el-button type="danger" text @click="handleDelete">删除</el-button>
          </div>
        </el-form>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, defineModel } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

const props = defineProps({
  onCloseChild: {
    type: Function,
    default: () => {},
  },
});

const showAuto = defineModel({ default: false });
const deviceTreeRef = ref(null);
const currentSelectDevice = ref(null);

const form = reactive({
  strategyName: "自动添加策略",
  // 起始时间提前
  startTimeEnable: false,
  startTimeMinutes: 15,
  // 截止时间延后
  endTimeEnable: false,
  endTimeMinutes: 5,
  // 检测时间间隔
  intervalEnable: false,
  intervalMinutes: 5,
  // 温度条件
  tempConditionEnable: false,
  tempSource: "internal",
  tempRule: "gt",
  tempThreshold: "",
  // 空调状态条件
  airConditionEnable: false,
  airPower: "",
  airMode: "",
  airFanSpeed: "",
  airTemp: "",
  // 自动报警
  alarmEnable: false,
  alarmModes: [],
  // 自动控制
  autoControlEnable: false,
  ctrlPower: "",
  ctrlMode: "",
  ctrlFanSpeed: "",
  ctrlTemp: "",
});

const tempThresholdOptions = ref(
  Array.from({ length: 91 }, (_, i) => String(i - 30)),
);
const airTempOptions = ref(Array.from({ length: 15 }, (_, i) => i + 16));

const deviceTreeData = ref([
  {
    id: "building_16",
    label: "16栋教学楼(0/43)",
    children: [
      {
        id: "16_202",
        label: "16_202(0/4)",
        children: [
          { id: "16_202_1", label: "16_202_1" },
          { id: "16_202_2", label: "16_202_2" },
          { id: "16_202_3", label: "16_202_3" },
          { id: "16_202_4", label: "16_202_4" },
        ],
      },
      { id: "16_204_3", label: "16_204_3" },
      { id: "16_206_4", label: "16_206_4" },
      {
        id: "16_203",
        label: "16_203(0/4)",
        children: [
          { id: "16_203_1", label: "16_203_1" },
          { id: "16_203_2", label: "16_203_2" },
          { id: "16_203_3", label: "16_203_3" },
          { id: "16_203_4", label: "16_203_4" },
        ],
      },
    ],
  },
]);

const treeProps = ref({
  label: "label",
  children: "children",
  isLeaf: (node) => !node.children || node.children.length === 0,
});

const handleDeviceNodeClick = (data) => {
  if (treeProps.value.isLeaf(data)) {
    currentSelectDevice.value = { id: data.id, label: data.label };
    ElMessage.info(`已选中设备：${data.label}`);
  } else {
    ElMessage.warning("请选择具体的房间设备进行操作");
  }
};

const handleConfirm = () => {
  if (!currentSelectDevice.value?.id) {
    ElMessage.warning("请先从左侧选择具体的房间设备");
    return;
  }

  const submitData = {
    device: currentSelectDevice.value,
    strategySetting: { ...form },
  };
  console.log("提交自动策略设置：", submitData);
  ElMessage.success(`【${currentSelectDevice.value.label}】自动策略设置成功`);
  showAuto.value = false;
  resetForm();
  props.onCloseChild();
};

const handleChildClose = () => {
  console.log("自动策略子弹窗关闭");
  props.onCloseChild();
  resetForm();
};

const handleDelete = () => {
  ElMessageBox.confirm("确定要删除当前自动策略吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    resetForm();
    ElMessage.success("自动策略已删除");
    showAuto.value = false;
    props.onCloseChild();
  });
};

const resetForm = () => {
  form.strategyName = "自动添加策略";
  form.startTimeEnable = false;
  form.startTimeMinutes = 15;
  form.endTimeEnable = false;
  form.endTimeMinutes = 5;
  form.intervalEnable = false;
  form.intervalMinutes = 5;
  form.tempConditionEnable = false;
  form.tempSource = "internal";
  form.tempRule = "gt";
  form.tempThreshold = "";
  form.airConditionEnable = false;
  form.airPower = "";
  form.airMode = "";
  form.airFanSpeed = "";
  form.airTemp = "";
  form.alarmEnable = false;
  form.alarmModes = [];
  form.autoControlEnable = false;
  form.ctrlPower = "";
  form.ctrlMode = "";
  form.ctrlFanSpeed = "";
  form.ctrlTemp = "";
  currentSelectDevice.value = null;
};
</script>

<style scoped>
.auto-strategy-dialog :deep(.el-form-item) {
  margin-bottom: 18px;
}
.auto-strategy-dialog :deep(.el-form-item__label) {
  font-size: 14px;
  color: #333;
}
.auto-strategy-dialog :deep(.el-tree) {
  --el-tree-node-content-hover-bg-color: #f5f7fa;
}
.auto-strategy-dialog :deep(.el-dialog__body) {
  overflow: hidden;
}
.auto-strategy-dialog :deep(.el-select) {
  font-size: 14px;
}
</style>
