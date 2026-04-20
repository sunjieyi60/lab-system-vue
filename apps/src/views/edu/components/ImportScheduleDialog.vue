<template>
  <el-dialog
    v-model="visible"
    title="导入课表"
    class="custom-import-container"
    width="600px"
    :close-on-click-modal="false"
    @closed="reset"
  >
    <div class="import-container">
      <!-- 步骤提示 -->
      <el-steps :active="currentStep" finish-status="success" simple>
        <el-step title="上传文件" />
        <el-step title="导入结果" />
      </el-steps>

      <!-- 步骤1: 上传文件 -->
      <div v-if="currentStep === 0" class="step-content">
        <el-upload
          ref="uploadRef"
          class="upload-area"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :limit="1"
          accept=".xlsx,.xls"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">
              请上传 Excel 格式的课表文件（.xlsx 或 .xls）
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 步骤2: 导入结果 -->
      <div v-if="currentStep === 1" class="step-content">
        <!-- 总览卡片 -->
        <div class="result-overview">
          <el-card shadow="never" class="result-card success-card">
            <div class="result-number">{{ importResult.ok }}</div>
            <div class="result-label">✅ 成功导入</div>
          </el-card>
          <el-card shadow="never" class="result-card fail-card">
            <div class="result-number">{{ importResult.fail }}</div>
            <div class="result-label">❌ 失败</div>
          </el-card>
        </div>

        <!-- 全部成功提示 -->
        <el-alert
          v-if="importResult.fail === 0"
          title="全部导入成功"
          type="success"
          :closable="false"
          show-icon
          style="margin-top: 16px"
        />

        <!-- 错误列表（仅 fail > 0 时展示） -->
        <div v-if="importResult.fail > 0" class="error-section">
          <el-divider>错误明细</el-divider>
          <el-table
            :data="importResult.errors"
            height="260"
            border
            stripe
            size="small"
          >
            <el-table-column label="Excel 位置" width="120">
              <template #default="{ row }">
                第 {{ row.rowIndex + 1 }} 行，第 {{ row.columnIndex + 1 }} 列
              </template>
            </el-table-column>
            <el-table-column prop="rawContent" label="原始内容" width="200" show-overflow-tooltip />
            <el-table-column prop="reason" label="错误原因" min-width="180" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button v-if="currentStep === 0" @click="visible = false">取消</el-button>
      <el-button
        v-if="currentStep === 0"
        type="primary"
        :loading="importing"
        :disabled="!rawFile"
        @click="handleImport"
      >
        确认导入
      </el-button>
      <el-button v-if="currentStep === 1" type="primary" @click="handleClose">
        {{ importResult.fail > 0 ? '完成（已导入部分数据）' : '完成' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import { importCourseSchedule } from "@/api/edu.js";

const props = defineProps({
  modelValue: Boolean,
  semesterId: {
    type: [Number, String],
    default: null,
  },
  laboratoryId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "success"]);

const visible = ref(false);
const currentStep = ref(0);
const importing = ref(false);
const rawFile = ref(null);
const uploadRef = ref(null);

// 导入结果
const importResult = ref({
  ok: 0,
  fail: 0,
  errors: [],
});

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
  },
);

watch(visible, (val) => {
  emit("update:modelValue", val);
});

// 处理文件选择
function handleFileChange(file) {
  rawFile.value = file.raw;
}

// 处理文件移除
function handleFileRemove() {
  rawFile.value = null;
}

// 执行导入
async function handleImport() {
  if (!rawFile.value) {
    ElMessage.warning("请先上传 Excel 文件");
    return;
  }
  if (!props.semesterId) {
    ElMessage.warning("未选择学期，请先选择学期");
    return;
  }
  if (!props.laboratoryId) {
    ElMessage.warning("未选择实验室，请先选择实验室");
    return;
  }

  importing.value = true;

  try {
    const formData = new FormData();
    formData.append("excel", rawFile.value);
    formData.append("semesterId", props.semesterId);
    formData.append("laboratoryId", props.laboratoryId);

    const res = await importCourseSchedule(formData);

    if (res.data?.code === 200 || res.data?.ok) {
      const data = res.data.data || {};
      importResult.value = {
        ok: data.ok || 0,
        fail: data.fail || 0,
        errors: data.errors || [],
      };
      currentStep.value = 1;

      if (data.fail === 0) {
        ElMessage.success(`成功导入 ${data.ok} 条课程记录`);
      } else {
        ElMessage.warning(`导入完成：成功 ${data.ok} 条，失败 ${data.fail} 条`);
      }
    } else {
      ElMessage.error(res.data?.msg || res.data?.message || "导入失败");
    }
  } catch (error) {
    console.error("导入失败:", error);
    ElMessage.error(error.response?.data?.msg || error.message || "导入过程发生错误");
  } finally {
    importing.value = false;
  }
}

// 重置状态
function reset() {
  currentStep.value = 0;
  rawFile.value = null;
  importResult.value = {
    ok: 0,
    fail: 0,
    errors: [],
  };
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
}

// 关闭弹窗
function handleClose() {
  visible.value = false;
  const hasSuccess = importResult.value.ok > 0;
  reset();
  if (hasSuccess) {
    emit("success");
  }
}
</script>

<style scoped>
.import-container {
  padding: 20px 0;
}

.step-content {
  margin-top: 30px;
}

.upload-area {
  width: 100%;
}

.result-overview {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.result-card {
  flex: 1;
  text-align: center;
  padding: 16px 0;
}

.result-card :deep(.el-card__body) {
  padding: 16px;
}

.result-number {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.result-label {
  font-size: 14px;
  color: #606266;
}

.success-card .result-number {
  color: #67c23a;
}

.fail-card .result-number {
  color: #f56c6c;
}

.error-section {
  margin-top: 16px;
}
</style>
