<!-- 环境监控 -->
<template>
  <div class="env-monitor-page">
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
          <span>{{ tableData.length }}个传感器</span>
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
            @click="handleAdd"
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
      <div class="table-box">
        <el-table
          ref="tableRef"
          :data="tableData"
          stripe
          style="width: 100%"
          :header-cell-style="{
            background: '#226EE04D',
            color: '#333',
            height: '48px',
          }"
          :row-style="{ height: '56px' }"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="labName" label="实验室" align="center">
            <template #default="{ row }">
              {{ getLabName(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column prop="deviceName" label="传感器" align="center" />
          <el-table-column prop="temperature" label="温度(℃)" align="center" />
          <el-table-column prop="humidity" label="湿度(%)" align="center" />
          <el-table-column prop="light" label="亮度(Lux)" align="center" />
          <el-table-column prop="smoke" label="烟雾" align="center" />
          <el-table-column prop="online" label="在线" align="center">
            <template #default="{ row }">
              <el-tag :type="row.online ? 'success' : 'info'" size="small">
                {{ row.online ? "在线" : "掉线" }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
  <AddNode
    v-model="showAddNode"
    device-type="Sensor"
    :laboratory-list="laboratoryList"
    @success="handleRefresh"
  />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "@/stores/user.js";
import { useDeviceStore, DeviceType } from "@/stores/device.js";
import AddNode from "@/components/AboutControl/AddNodeHvac.vue";

const userStore = useUserStore();
const deviceStore = useDeviceStore();

const unit = ref("all");
const building = ref("all");
const labNo = ref("all");
const searchKey = ref("");
const tableRef = ref();
const isLoading = ref(false);
const showAddNode = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 计算属性：表格数据（根据选择的实验室筛选）
const tableData = computed(() => {
  // 先获取所有传感器数据
  let data = deviceStore.getSensorTableData;

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

// 获取实验室名称
const getLabName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  return lab?.laboratoryName || lab?.laboratoryId || labId || "-";
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
    // 从 laboratoryList 获取所有实验室ID
    const allLabIds = laboratoryList.value
      .map((item) => item.id)
      .filter((id) => id);

    console.log("【加载所有设备】实验室ID列表:", allLabIds);

    // 把所有实验室ID传给接口
    await deviceStore.fetchDevicesByType(DeviceType.SENSOR, allLabIds);

    console.log("【加载所有设备完成】");
    console.log("【检查】deviceStore.deviceMap:", deviceStore.deviceMap);
    console.log("【检查】所有传感器数据:", deviceStore.getSensorTableData);
  } catch (error) {
    console.error("【加载设备失败】", error);
    ElMessage.error("加载设备数据失败");
  } finally {
    isLoading.value = false;
  }
};

// 手动刷新
const handleRefresh = async () => {
  await loadAllDeviceData();
  ElMessage.success("刷新成功");
};

const handleAdd = () => {
  showAddNode.value = true;
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

  // 设置当前设备类型为传感器
  deviceStore.setDeviceType(DeviceType.SENSOR);

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
  console.log("【检查】deviceStore.deviceMap:", deviceStore.deviceMap);
  console.log("【检查】所有传感器数据:", deviceStore.getSensorTableData);
  console.log("【检查】当前表格数据:", tableData.value);
  console.log("【检查】表格数据条数:", tableData.value.length);
  console.log("========================================");
});
</script>

<style scoped>
.env-monitor-page {
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

.table-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex: 1;
}

:deep(.el-table--striped .el-table__row--striped td.el-table__cell) {
  background-color: #226ee00d !important;
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

.pagination-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.filter-panel :deep(.el-button) {
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  color: #777;
  background: #fafafa;
  border: 1px solid #b5d4e6;
}

.filter-panel :deep(.el-button:hover) {
  background: #669ffc;
  border-color: #4b87e6;
  color: #fff;
}

.filter-panel :deep(.el-button:active) {
  background: #1a5bb8;
  border-color: #1a5bb8;
}

.filter-panel :deep(.el-button:focus) {
  outline: none;
  box-shadow: none;
}
</style>
