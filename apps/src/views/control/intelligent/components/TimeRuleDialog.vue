<template>
  <el-dialog
    v-model="dialogVisible"
    title="时间规则设置"
    width="550px"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="学期">
        <el-select v-model="form.semesterId" placeholder="请选择学期" style="width: 100%" filterable>
          <el-option
            v-for="term in termList"
            :key="term.id"
            :label="term.termName || term.name || `学期${term.id}`"
            :value="term.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="适用星期">
        <el-checkbox-group v-model="form.weekdays">
          <el-checkbox :label="1">周一</el-checkbox>
          <el-checkbox :label="2">周二</el-checkbox>
          <el-checkbox :label="3">周三</el-checkbox>
          <el-checkbox :label="4">周四</el-checkbox>
          <el-checkbox :label="5">周五</el-checkbox>
          <el-checkbox :label="6">周六</el-checkbox>
          <el-checkbox :label="7">周日</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="适用周次">
        <el-row :gutter="10">
          <el-col :span="11">
            <el-input-number v-model="form.startWeek" :min="1" :max="25" style="width: 100%" />
          </el-col>
          <el-col :span="2" class="text-center">至</el-col>
          <el-col :span="11">
            <el-input-number v-model="form.endWeek" :min="1" :max="25" style="width: 100%" />
          </el-col>
        </el-row>
      </el-form-item>

      <el-form-item label="周次类型">
        <el-radio-group v-model="form.weekType">
          <el-radio label="Both">全部周次</el-radio>
          <el-radio label="Odd">仅单周</el-radio>
          <el-radio label="Even">仅双周</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="每日时段">
        <el-row :gutter="10">
          <el-col :span="11">
            <el-time-picker
              v-model="form.startTime"
              placeholder="开始时间"
              format="HH:mm:ss"
              value-format="HH:mm:ss"
              style="width: 100%"
            />
          </el-col>
          <el-col :span="2" class="text-center">至</el-col>
          <el-col :span="11">
            <el-time-picker
              v-model="form.endTime"
              placeholder="结束时间"
              format="HH:mm:ss"
              value-format="HH:mm:ss"
              style="width: 100%"
            />
          </el-col>
        </el-row>
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
import { useEduStore } from "@/stores";
import { storeToRefs } from "pinia";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const eduStore = useEduStore();
const { termList } = storeToRefs(eduStore);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const form = reactive({
  weekdays: [1, 2, 3, 4, 5],
  startWeek: 1,
  endWeek: 20,
  weekType: "Both",
  startTime: "08:00:00",
  endTime: "18:00:00",
  semesterId: null,
});

// 重置表单
const resetForm = () => {
  form.weekdays = [1, 2, 3, 4, 5];
  form.startWeek = 1;
  form.endWeek = 20;
  form.weekType = "Both";
  form.startTime = "08:00:00";
  form.endTime = "18:00:00";
  form.semesterId = termList.value[0]?.id || null;
};

// 监听弹窗显示状态，处理数据回填
watch(() => dialogVisible.value, (visible) => {
  if (visible) {
    nextTick(() => {
      if (props.data) {
        Object.assign(form, {
          weekdays: props.data.weekdays || [1, 2, 3, 4, 5],
          startWeek: props.data.startWeek || 1,
          endWeek: props.data.endWeek || 20,
          weekType: props.data.weekType || "Both",
          startTime: props.data.startTime || "08:00:00",
          endTime: props.data.endTime || "18:00:00",
          semesterId: props.data.semesterId || termList.value[0]?.id || null,
        });
      } else {
        resetForm();
      }
    });
  }
});

const handleCancel = () => {
  dialogVisible.value = false;
};

const handleSave = () => {
  if (!form.semesterId) {
    ElMessage.warning("请选择学期");
    return;
  }
  if (form.weekdays.length === 0) {
    ElMessage.warning("请至少选择一天");
    return;
  }
  if (form.endWeek < form.startWeek) {
    ElMessage.warning("结束周次不能小于开始周次");
    return;
  }
  emit("save", { ...form });
  dialogVisible.value = false;
};

// 组件挂载时确保学期数据已加载
onMounted(async () => {
  if (termList.value.length === 0) {
    await eduStore.initTermData();
  }
  if (!form.semesterId && termList.value.length > 0) {
    form.semesterId = termList.value[0].id;
  }
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.text-center {
  text-align: center;
}
</style>
