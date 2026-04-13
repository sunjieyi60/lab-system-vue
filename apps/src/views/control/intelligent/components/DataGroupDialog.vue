<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑数据组' : '添加数据组'"
    width="500px"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
  >
    <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
      <el-form-item label="设备类型" prop="deviceType">
        <el-select v-model="form.deviceType" placeholder="请选择设备类型" style="width: 100%" @change="handleDeviceTypeChange">
          <el-option label="空调" value="AirCondition" />
          <el-option label="断路器" value="CircuitBreak" />
          <el-option label="照明" value="Light" />
          <el-option label="传感器" value="Sensor" />
          <el-option label="门禁" value="Access" />
        </el-select>
      </el-form-item>

      <el-form-item label="设备" prop="deviceId">
        <el-select 
          v-model="form.deviceId" 
          :placeholder="laboratoryId ? '请选择设备' : '请先选择实验室'"
          style="width: 100%" 
          filterable
          :disabled="!form.deviceType || !laboratoryId"
        >
          <el-option
            v-for="device in filteredDevices"
            :key="device.id"
            :label="device.deviceName || device.name || `设备${device.id}`"
            :value="device.id"
          />
        </el-select>
        <div v-if="!laboratoryId" class="hint-text" style="color: #f56c6c;">
          提示：请先返回主表单选择实验室
        </div>
        <div v-else-if="form.deviceType && filteredDevices.length === 0" class="hint-text" style="color: #e6a23c;">
          该实验室下没有找到{{ deviceTypeName }}设备
        </div>
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="可选填备注信息" />
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
import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { useDeviceStore, DeviceType } from "@/stores";

// 设备类型中文映射
const DeviceTypeName = {
  AirCondition: "空调",
  CircuitBreak: "断路器",
  Light: "照明",
  Sensor: "传感器",
  Access: "门禁",
};
import { storeToRefs } from "pinia";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: null,
  },
  // 所属实验室ID，用于筛选设备
  laboratoryId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const deviceStore = useDeviceStore();
const { deviceMap } = storeToRefs(deviceStore);

const formRef = ref(null);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.data);

const form = reactive({
  id: "",
  deviceType: "",
  deviceId: null,
  deviceName: "",
  remark: "",
});

const rules = {
  deviceType: [{ required: true, message: "请选择设备类型", trigger: "change" }],
  deviceId: [{ required: true, message: "请选择设备", trigger: "change" }],
};

// 设备类型中文名
const deviceTypeName = computed(() => DeviceTypeName[form.deviceType] || form.deviceType);

// 根据设备类型筛选设备列表
const filteredDevices = computed(() => {
  if (!form.deviceType) return [];
  
  const list = [];
  
  // 遍历 deviceMap 的所有值
  Object.entries(deviceMap.value).forEach(([key, arr]) => {
    if (!Array.isArray(arr)) return;
    
    arr.forEach((item) => {
      const device = item.device || {};
      const deviceType = device.deviceType;
      const deviceLabId = device.belongToLaboratoryId;
      const deviceId = device.id || item.deviceId;
      
      // 类型匹配
      if (!deviceType || deviceType !== form.deviceType) return;
      
      // 实验室筛选（如果指定了实验室）
      if (props.laboratoryId) {
        const targetLabId = String(props.laboratoryId);
        const currentLabId = String(deviceLabId);
        if (currentLabId !== targetLabId) return;
      }
      
      list.push({
        id: deviceId,
        deviceId: item.deviceId,
        deviceName: device.deviceName || device.name || `设备${deviceId}`,
        deviceType: deviceType,
        labId: deviceLabId,
      });
    });
  });
  return list;
});

// 重置表单（必须在watch之前定义）
const resetForm = () => {
  form.id = "";
  form.deviceType = "";
  form.deviceId = null;
  form.deviceName = "";
  form.remark = "";
};

// 监听弹窗显示状态，处理数据回填
watch(() => dialogVisible.value, (visible) => {
  if (visible) {
    nextTick(() => {
      if (props.data) {
        Object.assign(form, {
          id: props.data.id || "",
          deviceType: props.data.deviceType || "",
          deviceId: props.data.deviceId || null,
          deviceName: props.data.deviceName || "",
          remark: props.data.remark || "",
        });
      } else {
        resetForm();
      }
    });
  }
});

// 设备类型改变时，清空已选设备
const handleDeviceTypeChange = () => {
  form.deviceId = null;
  form.deviceName = "";
};

const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};

const handleSave = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    // 获取设备名称
    const selectedDevice = filteredDevices.value.find(d => d.id === form.deviceId);
    form.deviceName = selectedDevice?.deviceName || selectedDevice?.name || `设备${form.deviceId}`;
    
    emit("save", { ...form });
    dialogVisible.value = false;
    resetForm();
  } catch (error) {
    // 表单校验失败
  }
};

// 加载设备数据（参考门禁管理、电气监控页面的方式）
const loadDevices = async () => {
  if (!props.laboratoryId) return;
  
  try {
    const labIds = [props.laboratoryId];
    
    // 参考成功页面的方式：分别获取每种类型的设备
    await deviceStore.fetchDevicesByType(DeviceType.AIR_CONDITION, labIds);
    await deviceStore.fetchDevicesByType(DeviceType.CIRCUIT_BREAK, labIds);
    await deviceStore.fetchDevicesByType(DeviceType.LIGHT, labIds);
    await deviceStore.fetchDevicesByType(DeviceType.SENSOR, labIds);
    await deviceStore.fetchDevicesByType(DeviceType.ACCESS, labIds);
  } catch (error) {
    console.error("【DataGroupDialog】加载设备失败:", error);
    ElMessage.error("加载设备列表失败");
  }
};

// 监听弹窗显示状态，当弹窗打开时加载设备
watch(() => dialogVisible.value, (visible) => {
  if (visible) loadDevices();
});

// 组件挂载时也尝试加载
onMounted(() => {
  if (dialogVisible.value && props.laboratoryId) loadDevices();
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
