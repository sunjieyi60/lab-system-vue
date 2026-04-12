<template>
  <div class="door-control-page">
    <div class="main-content">
      <!-- 第一行 -->
      <div class="filter-row first-row">
        <span class="select-label">所在楼栋：</span>
        <el-select v-model="building" style="width: 120px; margin-right: 20px">
          <el-option label="全部" value="all" />
          <el-option
            v-for="item in buildingList"
            :key="item.id"
            :label="item.buildingName"
            :value="item.id"
          />
        </el-select>

        <span class="select-label">所属单位：</span>
        <el-select v-model="unit" style="width: 160px; margin-right: 20px">
          <el-option label="全部" value="all" />
          <el-option
            v-for="item in deptList"
            :key="item.id"
            :label="item.deptName"
            :value="item.id"
          />
        </el-select>

        <span class="select-label">实验室编号：</span>
        <el-select
          v-model="labNo"
          style="width: 120px; margin-right: 20px"
          @change="handleLabChange"
        >
          <el-option label="全部" value="all" />
          <el-option
            v-for="item in filteredLaboratoryList"
            :key="item.id"
            :label="item.laboratoryName"
            :value="item.id"
          />
        </el-select>

        <div class="stat">
          <span>{{ tableData.length }}台内机</span>
        </div>
      </div>

      <!-- 第二行部分 -->
      <div class="filter-row second-row">
        <div class="button-group left-buttons">
          <el-button
            :loading="isLoading"
            style="margin-right: 10px"
            @click="handleRefresh"
            >手动刷新</el-button
          >
          <el-button
            :loading="isLoading"
            style="margin-right: 10px"
            @click="handleRemoteControl"
            >远程控制</el-button
          >
          <el-button
            :loading="isLoading"
            style="margin-right: 10px"
            @click="handleLockSetting"
            >锁定设置</el-button
          >

        </div>

 <div class="button-group right-buttons">
          <el-input
            v-model="searchKey"
            placeholder="请输入关键字"
            style="width: 180px; margin-right: 10px; flex-shrink: 1"
            @keyup.enter="handleSearch"
          >
            <template #suffix>
              <img
                src="/images/搜索.png"
                style="width: 16px; height: 16px; cursor: pointer"
                @click="handleSearch"
              />
            </template>
          </el-input>
          <el-dropdown
            split-button
            type="primary"
            @click="handleAddDefault"
            @command="handleAddCommand"
            style="margin-right: 10px"
          >
            添加
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="lab">实验室</el-dropdown-item>
                <el-dropdown-item command="node">节点</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-button style="width: 90px; margin-right: 10px" @click="handleEdit"
            >修改</el-button
          >
          <el-button
            style="width: 90px; margin-right: 10px"
            @click="handleDelete"
            >删除</el-button
          >
        </div>
      </div>

      <!-- 表格盒子 -->
      <div>
        <el-table
          ref="tableRef"
          :data="tableData"
          stripe
          :row-style="{ height: '56px' }"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column
            prop="labName"
            label="实验室"
            width="130px"
            align="center"
          >
            <template #default="{ row }">
              {{ getLabName(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column prop="airCond" label="空调内机" align="center" />
          <el-table-column prop="switch" label="开关" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.switch === '开' ? 'success' : 'info'"
                size="small"
              >
                {{ row.switch }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="mode" label="模式" align="center" />
          <el-table-column prop="temp" label="温度" align="center" />
          <el-table-column prop="windSpeed" label="风速" align="center" />
          <el-table-column prop="roomTemp" label="室温" align="center" />
          <el-table-column prop="fault" label="故障" align="center">
            <template #default="{ row }">
              <span
                :style="{ color: row.fault !== '无' ? '#f56c6c' : '#67c23a' }"
              >
                {{ row.fault }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="alarm" label="报警" align="center" />
          <el-table-column prop="unit" label="机组" align="center" />
          <el-table-column prop="online" label="在线" align="center">
            <template #default="{ row }">
              <el-tag :type="row.online ? 'success' : 'info'" size="small">
                {{ row.online ? "在线" : "离线" }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>

  <!-- 弹窗组件 -->
  <LabDialog v-model="showLabDialog" />
  <AddNode
    v-model="showAddNode"
    device-type="AirCondition"
    :laboratory-list="laboratoryList"
    @success="handleRefresh"
  />
  <RemoteControl
    v-model="showRemote"
    :selected-rows="currentSelectedRows"
    :laboratory-list="laboratoryList"
    @success="handleRefresh"
    @closed="currentSelectedRows = []"
  />
  <LockSetting
    v-model="showLock"
    :selected-rows="currentSelectedRows"
    @success="handleRefresh"
    @closed="currentSelectedRows = []"
  />
  <IntelligentControl
    v-model="showIntelligent"
    :selected-rows="currentSelectedRows"
    @closed="currentSelectedRows = []"
  />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";
import LabDialog from "@/components/LabDialog.vue";
import AddNode from "@/components/AboutControl/AddNodeHvac.vue";
import RemoteControl from "@/components/AboutControl/RemoteControl.vue";
import LockSetting from "@/components/AboutControl/LockSetting.vue";
import IntelligentControl from "@/components/AboutControl/IntelligentControl.vue";
import { useUserStore } from "@/stores/user.js";
import { useDeviceStore, DeviceType, DeviceTypeName } from "@/stores/device.js";
import { ElMessage, ElMessageBox } from "element-plus";

const userStore = useUserStore();
const deviceStore = useDeviceStore();

const unit = ref("all");
const building = ref("all");
const labNo = ref("all");
const searchKey = ref("");
const tableRef = ref();
const isLoading = ref(false);
const showLabDialog = ref(false);
const showAddNode = ref(false);
const showLock = ref(false);
const showRemote = ref(false);
const showIntelligent = ref(false);

// 保存选中的行数据（用于传给弹窗）
const currentSelectedRows = ref([]);

// 计算属性：表格数据（根据选择的实验室筛选）
const tableData = computed(() => {
  // 先获取所有空调数据
  let data = deviceStore.getAirConditionTableData;

  // 如果选择了楼栋，按楼栋筛选
  if (building.value && building.value !== 'all') {
    // 获取该楼栋下的所有实验室ID
    const labIdsInBuilding = laboratoryList.value
      .filter(lab => String(lab.belongToBuilding) === String(building.value))
      .map(lab => String(lab.id));
    data = data.filter((item) => labIdsInBuilding.includes(String(item.labId)));
  }

  // 如果选择了单位，按单位筛选
  if (unit.value && unit.value !== 'all') {
    // 获取该单位下的所有实验室ID
    const labIdsInUnit = laboratoryList.value
      .filter(lab => {
        const depts = lab.belongToDepts || [];
        return depts.map(String).includes(String(unit.value));
      })
      .map(lab => String(lab.id));
    data = data.filter((item) => labIdsInUnit.includes(String(item.labId)));
  }

  // 如果选择了具体实验室，按实验室ID筛选
  if (labNo.value !== "all") {
    data = data.filter((item) => String(item.labId) === String(labNo.value));
  }

  // 如果有搜索关键字，再按关键字筛选
  if (searchKey.value.trim()) {
    const k = searchKey.value.trim().toLowerCase();
    data = data.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(k)),
    );
  }

  return data;
});
// 获取选中的完整行数据（传给远程控制弹窗）
const selectedRows = computed(() => {
  // 如果有手动保存的选中行，优先使用（用于弹窗打开时固定数据）
  if (currentSelectedRows.value.length > 0) {
    return currentSelectedRows.value;
  }

  // 1. 获取表格选中的行（筛选后的数据）
  const tableSelection = tableRef.value?.getSelectionRows?.() || [];
  // 2. 获取 store 原始完整数据
  const rawData = deviceStore.getAirConditionTableData;

  // 3. 通过唯一标识（比如 id）匹配完整数据
  const fullSelectedRows = tableSelection.map((selectRow) => {
    // 这里假设每行数据的唯一标识是 id，你可以换成实际的字段（如 deviceId/labId 等）
    return rawData.find((rawRow) => rawRow.id === selectRow.id) || selectRow;
  });
  return fullSelectedRows;
});
// 获取实验室名称
const getLabName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  return lab?.laboratoryName || lab?.laboratoryId || labId || "-";
};

const handleAddDefault = () => {
  showAddNode.value = true;
};

const buildingList = computed(() => userStore.getBuildingList);
const rawDeptData = computed(() => userStore.userInfo.depts || []);
const deptList = computed(() => rawDeptData.value.map((item) => item.dept));
const laboratoryList = computed(() => userStore.getLaboratoryList);

// 过滤后的实验室列表
const filteredLaboratoryList = computed(() => {
  let result = laboratoryList.value;
  
  // 按楼栋过滤
  if (building.value && building.value !== 'all') {
    result = result.filter((room) => String(room.belongToBuilding) === String(building.value));
  }
  
  // 按单位过滤 - belongToDepts是数组
  if (unit.value && unit.value !== 'all') {
    result = result.filter((room) => {
      const depts = room.belongToDepts || [];
      return depts.map(String).includes(String(unit.value));
    });
  }
  
  return result;
});

// 实验室下拉框变化处理
const handleLabChange = (val) => {
  console.log("【实验室选择变化】选中值:", val);
  console.log("【实验室选择变化】当前表格数据:", tableData.value);
};

// 加载所有设备数据（获取所有实验室的ID传给接口）
const loadAllDeviceData = async () => {
  isLoading.value = true;
  try {
    const allLabIds = laboratoryList.value
      .map((item) => item.id)
      .filter((id) => id);

    if (!allLabIds.length) {
      console.warn("实验室ID为空，取消刷新");
      return;
    }

    await deviceStore.fetchDevicesByType(DeviceType.AIR_CONDITION, allLabIds);
  } finally {
    isLoading.value = false;
  }
};

const handleRemoteControl = () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (selection.length === 0) {
    ElMessage.warning("请至少选择一台设备进行远程控制");
    return;
  }

  // 保存当前选中的行数据
  const rawData = deviceStore.getAirConditionTableData;
  currentSelectedRows.value = selection.map((selectRow) => {
    return rawData.find((rawRow) => rawRow.id === selectRow.id) || selectRow;
  });

  showRemote.value = true;
};
const handleLockSetting = () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (selection.length === 0) {
    ElMessage.warning("请至少选择一台设备进行锁定设置");
    return;
  }

  showLock.value = true;
};

// 手动刷新
const handleRefresh = async () => {
  await loadAllDeviceData();
  ElMessage.success("刷新成功");
};

const handleEdit = () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (selection.length !== 1) {
    ElMessage.warning("请选择一条要修改的记录");
    return;
  }
  console.log("编辑记录：", selection[0]);
};

const handleDelete = () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (!selection.length) {
    ElMessage.warning("请至少选择一条要删除的记录");
    return;
  }
  ElMessageBox.confirm(
    `确定要删除选中的 ${selection.length} 条记录吗？`,
    "提示",
    { type: "warning" },
  ).then(() => {
    console.log("删除记录：", selection);
    ElMessage.success("删除成功");
  });
};

const handleSearch = () => {
  console.log("【搜索】关键字:", searchKey.value);
  console.log("【搜索】结果:", tableData.value);
};
onMounted(async () => {
  // 先尝试从 localStorage 恢复用户信息
  await userStore.refreshUserInfo();

  // 等待实验室列表加载完成（如果需要）
  // 确保 laboratoryList 有数据
  if (!laboratoryList.value || laboratoryList.value.length === 0) {
    console.log("【警告】实验室列表为空，尝试重新获取...");
    // 如果有刷新实验室列表的方法，这里调用
    // await userStore.refreshLaboratories();
  }

  // 设置当前设备类型为空调
  deviceStore.setDeviceType(DeviceType.AIR_CONDITION);

  // 加载所有实验室的设备数据
  await loadAllDeviceData();

  // ===== console.log 检查数据 =====
  console.log("========== onMounted 数据检查 ==========");
  console.log("【检查】实验室列表:", laboratoryList.value);
  console.log(
    "【检查】实验室ID列表:",
    laboratoryList.value.map((item) => item.id),
  );
  console.log("【检查】当前选中实验室:", labNo.value);
});
</script>

<style scoped>
.door-control-page {
  padding-top: 6px;
  background: #fafbfc;
  min-height: 85vh;
  box-sizing: border-box;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;
  padding: 0 16px;
}

.filter-row.first-row {
  background: #f4f7fd;
  padding: 12px;
  border-radius: 8px;
  height: 26px;
  font-size: 15px;
}

.filter-row.second-row {
  padding: 0 0 0 8px;
}

.stat {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  line-height: 1.8;
}

.button-group {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
}

.button-group.right-buttons {
  margin-left: auto;
  flex: 0 0 auto;
  justify-content: flex-end;
}

:deep(.el-button:focus) {
  outline: none;
  box-shadow: none;
}
</style>
