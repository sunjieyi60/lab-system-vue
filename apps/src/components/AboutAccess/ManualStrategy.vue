<template>
  <el-dialog
    v-model="showManual"
    top="30vh"
    :close-on-click-modal="false"
    @close="handleChildClose"
    destroy-on-close
    class="manual-alarm-dialog"
    style="
      --el-dialog-header-text-align: center;
      width: 800px;
      left: calc(50% - 800px / 2);
    "
  >
    <template #header>
      <div style="width: 100%; text-align: center; font-size: 18px">
        手动添加/修改
      </div>
    </template>

    <!-- 左右分栏：设备树 + 报警设置表单 -->
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

      <!-- 右侧报警设置表单 -->
      <div
        style="
          flex: 1;
          height: 100%;
          overflow-y: auto;
          padding-right: 10px;
          box-sizing: border-box;
        "
      >
        <el-form :model="form" label-width="100px" style="margin: 0">
          <!-- 策略名称 -->
          <el-form-item label="策略名称">
            <el-input
              v-model="form.strategyName"
              placeholder="定时报警"
              style="width: 90%"
            />
          </el-form-item>

          <!-- 时间条件（必填） -->
          <el-form-item label="时间条件" required>
            <el-input
              v-model="form.timeCondition"
              placeholder="1-16周, 星期一、8: 00-8: 45, 5分钟"
              style="width: 90%"
            />
          </el-form-item>

          <!-- 温度条件区域 -->
          <el-form-item>
            <template #label>
              <div
                style="
                  display: flex;
                  align-items: center;
                  justify-content: flex-end;
                  transform: translateX(10px);
                  width: 100%;
                  box-sizing: border-box;
                "
              >
                <el-checkbox
                  v-model="form.tempConditionEnable"
                  size="small"
                  style="margin-right: 5px; padding-top: 2px"
                />
                <span style="font-size: 14px">温度条件：</span>
              </div>
            </template>
            <div style="margin-left: 0">
              <el-form-item
                label="温度源"
                style="margin-bottom: 8px"
                label-width="85px"
              >
                <el-select
                  v-model="form.tempSource"
                  placeholder="内部(默认)"
                  style="width: 200px"
                  :disabled="!form.tempConditionEnable"
                >
                  <el-option label="内部(默认)" value="internal" />
                  <el-option label="外部1" value="external1" />
                  <el-option label="外部2" value="external2" />
                </el-select>
              </el-form-item>
              <el-form-item
                label="条件"
                style="margin-bottom: 8px"
                label-width="85px"
              >
                <el-select
                  v-model="form.tempRule"
                  placeholder="大于(默认)"
                  style="width: 200px"
                  :disabled="!form.tempConditionEnable"
                >
                  <el-option label="大于(默认)" value="gt" />
                  <el-option label="等于" value="eq" />
                  <el-option label="小于" value="lt" />
                </el-select>
              </el-form-item>
              <el-form-item
                label="阈值"
                style="margin-bottom: 8px"
                label-width="85px"
              >
                <el-select
                  v-model="form.tempThreshold"
                  placeholder="-30℃-60℃"
                  style="width: 200px"
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
          </el-form-item>

          <!-- 空调条件区域（统一为温度条件样式） -->
          <el-form-item>
            <template #label>
              <div
                style="
                  display: flex;
                  align-items: center;
                  justify-content: flex-end;
                  transform: translateX(10px);
                  width: 100%;
                  box-sizing: border-box;
                "
              >
                <el-checkbox
                  v-model="form.airConditionEnable"
                  size="small"
                  style="margin-right: 5px; padding-top: 2px"
                />
                <span>空调条件：</span>
              </div>
            </template>
            <div style="margin-left: 0">
              <el-form-item
                label="开关"
                style="margin-bottom: 8px"
                label-width="85px"
              >
                <el-select
                  v-model="form.airPower"
                  placeholder="无(默认)"
                  clearable
                  style="width: 200px"
                  :disabled="!form.airConditionEnable"
                >
                  <el-option label="无(默认)" value="" />
                  <el-option label="开" value="on" />
                  <el-option label="关" value="off" />
                </el-select>
              </el-form-item>
              <el-form-item
                label="模式"
                style="margin-bottom: 8px"
                label-width="85px"
              >
                <el-select
                  v-model="form.airMode"
                  placeholder="无(默认)"
                  clearable
                  style="width: 200px"
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
                style="margin-bottom: 8px"
                label-width="85px"
              >
                <el-select
                  v-model="form.airFanSpeed"
                  placeholder="无(默认)"
                  clearable
                  style="width: 200px"
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
                style="margin-bottom: 8px"
                label-width="85px"
              >
                <el-select
                  v-model="form.airTemp"
                  placeholder="无(默认)"
                  clearable
                  style="width: 200px"
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
          </el-form-item>

          <!-- 自动报警方式（彻底脱离表单label影响，保证点击有效） -->
          <el-form-item>
            <!-- 保留原有label插槽样式 -->
            <template #label>
              <div
                style="
                  display: flex;
                  align-items: center;
                  justify-content: flex-end;
                  transform: translateX(10px);
                  width: 100%;
                  box-sizing: border-box;
                "
              >
                <el-checkbox
                  v-model="form.alarmEnable"
                  size="small"
                  style="margin-right: 5px; padding-top: 2px"
                />
                <span>自动报警：</span>
              </div>
            </template>

            <!-- 核心修改：用div包裹 + 强制层级 + 取消表单关联 -->
            <div
              style="
                margin-left: 41px;
                position: relative;
                z-index: 10; /* 强制置顶，避免被遮挡 */
                pointer-events: auto !important; /* 强制启用点击 */
              "
            >
              <!-- 移除el-checkbox-group的disabled绑定，改用手动控制 -->
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
          </el-form-item>

          <!-- 自动控制区域（统一为温度条件样式） -->
          <el-form-item>
            <template #label>
              <div
                style="
                  display: flex;
                  align-items: center;
                  justify-content: flex-end;
                  transform: translateX(10px);
                  width: 100%;
                  box-sizing: border-box;
                "
              >
                <el-checkbox
                  v-model="form.autoControlEnable"
                  size="small"
                  style="margin-right: 5px; padding-top: 2px"
                />
                <span>自动控制：</span>
              </div>
            </template>
            <div style="margin-left: 0">
              <el-form-item
                label="开关"
                style="margin-bottom: 8px"
                label-width="85px"
              >
                <el-select
                  v-model="form.ctrlPower"
                  placeholder="无(默认)"
                  clearable
                  style="width: 200px"
                  :disabled="!form.autoControlEnable"
                >
                  <el-option label="无(默认)" value="" />
                  <el-option label="开" value="on" />
                  <el-option label="关" value="off" />
                </el-select>
              </el-form-item>
              <el-form-item
                label="模式"
                style="margin-bottom: 8px"
                label-width="85px"
              >
                <el-select
                  v-model="form.ctrlMode"
                  placeholder="无(默认)"
                  clearable
                  style="width: 200px"
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
                style="margin-bottom: 8px"
                label-width="85px"
              >
                <el-select
                  v-model="form.ctrlFanSpeed"
                  placeholder="无(默认)"
                  clearable
                  style="width: 200px"
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
                style="margin-bottom: 8px"
                label-width="85px"
              >
                <el-select
                  v-model="form.ctrlTemp"
                  placeholder="无(默认)"
                  clearable
                  style="width: 200px"
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

// 修复1：定义正确的props（接收父组件的onCloseChild回调，解决命名冲突）
const props = defineProps({
  onCloseChild: {
    type: Function,
    default: () => {}, // 默认空函数，避免父组件未传时报错
  },
});

// 弹窗显隐（双向绑定）
const showManual = defineModel({ default: false });
// 设备树实例
const deviceTreeRef = ref(null);
// 当前选中设备
const currentSelectDevice = ref(null);

// 核心表单数据
const form = reactive({
  strategyName: "定时报警",
  timeCondition: "",
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

// 温度阈值选项（-30℃ 到 60℃）
const tempThresholdOptions = ref(
  Array.from({ length: 91 }, (_, i) => String(i - 30)),
);
// 空调温度选项（16-30度）
const airTempOptions = ref(Array.from({ length: 15 }, (_, i) => i + 16));

// 设备树数据
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

// 设备树配置
const treeProps = ref({
  label: "label",
  children: "children",
  isLeaf: (node) => !node.children || node.children.length === 0,
});

// 设备树节点点击
const handleDeviceNodeClick = (data) => {
  if (treeProps.value.isLeaf(data)) {
    currentSelectDevice.value = { id: data.id, label: data.label };
    ElMessage.info(`已选中设备：${data.label}`);
  } else {
    ElMessage.warning("请选择具体的房间设备进行操作");
  }
};

// 确定按钮逻辑
const handleConfirm = () => {
  if (!currentSelectDevice.value?.id) {
    ElMessage.warning("请先从左侧选择具体的房间设备");
    return;
  }
  if (!form.timeCondition.trim()) {
    ElMessage.warning("请填写时间条件");
    return;
  }

  const submitData = {
    device: currentSelectDevice.value,
    alarmSetting: { ...form },
  };
  console.log("提交定时报警设置：", submitData);
  ElMessage.success(`【${currentSelectDevice.value.label}】报警策略设置成功`);
  showManual.value = false;
  resetForm();
  // 确认后也通知父组件（可选，根据业务需求）
  props.onCloseChild();
};

// 弹窗关闭触发的方法（@close绑定）
const handleChildClose = () => {
  console.log("子弹窗关闭时执行的方法");
  // 修复2：调用父组件传递的onCloseChild回调（props已显式接收，无定义错误）
  props.onCloseChild();
  // 关闭时重置表单（可选，根据业务需求，保持与原有逻辑一致）
  resetForm();
};

// 删除按钮逻辑
const handleDelete = () => {
  ElMessageBox.confirm("确定要删除当前报警策略吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    resetForm();
    ElMessage.success("报警策略已删除");
    showManual.value = false;
    // 删除后通知父组件
    props.onCloseChild();
  });
};

// 重置表单
const resetForm = () => {
  form.strategyName = "定时报警";
  form.timeCondition = "";
  // 温度条件
  form.tempConditionEnable = false;
  form.tempSource = "internal";
  form.tempRule = "gt";
  form.tempThreshold = "";
  // 空调状态条件
  form.airConditionEnable = false;
  form.airPower = "";
  form.airMode = "";
  form.airFanSpeed = "";
  form.airTemp = "";
  // 自动报警
  form.alarmEnable = false;
  form.alarmModes = [];
  // 自动控制
  form.autoControlEnable = false;
  form.ctrlPower = "";
  form.ctrlMode = "";
  form.ctrlFanSpeed = "";
  form.ctrlTemp = "";
  // 清空选中设备
  currentSelectDevice.value = null;
};
</script>

<style scoped>
/* 统一表单样式 */
.manual-alarm-dialog :deep(.el-form-item) {
  margin-bottom: 18px;
}
.manual-alarm-dialog :deep(.el-form-item__label) {
  font-size: 14px;
  color: #333;
}
.manual-alarm-dialog :deep(.el-tree) {
  --el-tree-node-content-hover-bg-color: #f5f7fa;
}
.manual-alarm-dialog :deep(.el-dialog__body) {
  overflow: hidden;
}
.manual-alarm-dialog :deep(.el-select) {
  font-size: 14px;
}
.manual-alarm-dialog :deep(.el-form-item .el-form-item) {
  margin-bottom: 8px !important;
}
</style>
