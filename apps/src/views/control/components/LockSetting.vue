<template>
  <el-dialog
    v-model="showLock"
    width="480px"
    top="40vh"
    :close-on-click-modal="false"
    destroy-on-close
    style="--el-dialog-header-text-align: center"
    @closed="handleClosed"
  >
    <template #header>
      <div style="width: 100%; text-align: center; font-size: 18px">
        锁定控制
      </div>
    </template>
    <!-- 弹窗内部：左设备树 + 右锁定设置 左右分栏布局 -->
    <div
      style="
        display: flex;
        gap: 20px;
        width: 100%;
        height: 320px;
        box-sizing: border-box;
      "
    >
      <!-- 左侧设备树：固定宽度，高度占满弹窗内容区 -->
      <div style="width: 200px; flex-shrink: 0; height: 100%; overflow-y: auto">
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

      <!-- 右侧锁定设置表单：弹性占满剩余宽度，高度占满 -->
      <div
        style="
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        "
      >
        <el-form :model="form" label-width="80px" style="margin: 0">
          <!-- 开关（匹配图片：无/开/关） -->
          <el-form-item label="开关">
            <el-select
              v-model="form.power"
              placeholder="无(默认)"
              clearable
              style="width: 100%"
            >
              <el-option label="无(默认)" value="" />
              <el-option label="开" value="on" />
              <el-option label="关" value="off" />
            </el-select>
          </el-form-item>

          <!-- 模式（移除除湿，仅制冷/制热/送风，匹配图片） -->
          <el-form-item label="模式">
            <el-select
              v-model="form.mode"
              placeholder="无(默认)"
              clearable
              style="width: 100%"
            >
              <el-option label="无(默认)" value="" />
              <el-option label="制冷" value="cool" />
              <el-option label="制热" value="heat" />
              <el-option label="送风" value="fan" />
            </el-select>
          </el-form-item>

          <!-- 风速（移除高速，仅自动/低速/中速，匹配图片） -->
          <el-form-item label="风速">
            <el-select
              v-model="form.fanSpeed"
              placeholder="无(默认)"
              clearable
              style="width: 100%"
            >
              <el-option label="无(默认)" value="" />
              <el-option label="自动" value="auto" />
              <el-option label="低速" value="low" />
              <el-option label="中速" value="medium" />
            </el-select>
          </el-form-item>

          <!-- 温度（无℃后缀，16-30度，匹配图片） -->
          <el-form-item label="温度">
            <el-select
              v-model="form.temperature"
              placeholder="无(默认)"
              clearable
              style="width: 100%"
            >
              <el-option label="无(默认)" value="" />
              <el-option
                v-for="temp in temperatureOptions"
                :key="temp"
                :label="temp"
                :value="temp"
              />
            </el-select>
          </el-form-item>

          <!-- 表单内操作按钮 -->
          <div
            style="
              width: 100%;
              display: flex;
              justify-content: center;
              gap: 16px;
              padding: 12px 0;
            "
          >
            <el-button @click="showLock = false">取消</el-button>
            <el-button type="primary" @click="handleConfirm">确定</el-button>
          </div>
        </el-form>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, defineModel } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

// 弹窗显隐：使用 defineModel 支持父组件双向绑定，默认隐藏
const showLock = defineModel({ default: false });
// 设备树实例
const deviceTreeRef = ref(null);
// 记录当前选中的设备节点（仅叶子节点：房间）
const currentSelectDevice = ref({ id: "", label: "" });
// 接收父组件传入的实验室名称
const props = defineProps({
  labName: {
    type: String,
    default: "",
  },
  selectedRows: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["closed"]);
// 核心表单数据（无多余字段，与图片完全匹配）
const form = reactive({
  power: "",
  mode: "",
  fanSpeed: "",
  temperature: "",
});

// 温度选项：16-30度（无℃后缀，纯数字，匹配图片）
const temperatureOptions = ref(Array.from({ length: 15 }, (_, i) => i + 16));

// 设备树数据（与图片结构一致：空调集控器+房间子节点）
const deviceTreeData = ref([
  {
    id: "controller1",
    label: "空调集控器1(16)",
    children: [
      { id: "16_201", label: "16_201 (4)" },
      { id: "16_202", label: "16_202 (4)" },
      { id: "16_203", label: "16_203 (3)" },
      { id: "16_204", label: "16_204 (5)" },
    ],
  },
  {
    id: "controller2",
    label: "空调集控器2(8)",
    children: [{ id: "16_206", label: "16_206 (8)" }],
  },
  {
    id: "controller3",
    label: "空调集控器3(13)",
    children: [{ id: "16_210", label: "16_210 (3)" }],
  },
]);

// 设备树配置项：指定标签、子节点字段，自动识别叶子节点
const treeProps = ref({
  label: "label",
  children: "children",
  isLeaf: (node) => !node.children || node.children.length === 0,
});

// 设备树节点点击事件：仅叶子节点（房间）触发选中记录
const handleDeviceNodeClick = (data) => {
  if (treeProps.value.isLeaf(data)) {
    currentSelectDevice.value = { id: data.id, label: data.label };
    ElMessage.info(`已选中设备：${data.label}`);
  } else {
    ElMessage.warning("请选择具体的房间设备进行操作");
  }
};

// 确定按钮：验证选中设备 + 提交设置 + 关闭弹窗
const handleConfirm = () => {
  // 校验：必须选择具体设备才能提交
  if (!currentSelectDevice.value.id) {
    ElMessage.warning("请先从左侧选择具体的房间设备");
    return;
  }
  // 构造提交数据：选中设备 + 锁定设置参数
  const submitData = {
    device: currentSelectDevice.value,
    lockSetting: { ...form },
  };
  console.log("提交锁定设置：", submitData);
  ElMessage.success(`【${currentSelectDevice.value.label}】锁定设置成功`);
  showLock.value = false; // 关闭弹窗
  resetForm(); // 重置表单，避免下次打开残留数据
};

// 删除按钮：二次确认后清空表单所有数据
const handleDelete = () => {
  ElMessageBox.confirm("确定要清空当前所有锁定设置吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    resetForm();
    ElMessage.success("已清空所有锁定设置");
  });
};

// 重置表单方法：复用（确定后/手动重置）
const resetForm = () => {
  form.power = "";
  form.mode = "";
  form.fanSpeed = "";
  form.temperature = "";
  currentSelectDevice.value = { id: "", label: "" }; // 清空选中设备记录
};
</script>

<style scoped>
/* 仅保留原代码必要样式，无任何多余样式定义 */
:deep(.el-form-item) {
  margin-bottom: 30px;
}
/* 适配设备树滚动条样式，优化视觉 */
:deep(.el-tree) {
  --el-tree-node-content-hover-bg-color: #f5f7fa;
}
:deep(.el-form-item__label) {
  font-size: 16px;
}
</style>
