<!-- 智能控制 -->
<template>
  <div class="intelligent-control-page">
    <div class="main-content">
      <!-- 添加策略弹窗 -->
      <AddStrategyDialog
        v-model="showAddDialog"
        @confirm="handleAddConfirm"
        @cancel="handleAddCancel"
      />
      <!-- 第一行：筛选条件 -->
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
          <span>{{ tableData.length }}条策略，{{ enabledCount }}条启用</span>
        </div>
      </div>

      <!-- 第二行：操作按钮 -->
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
            @click="handleBatchEnable"
            type="success"
            >批量启用</el-button
          >
          <el-button
            :loading="isLoading"
            style="margin-right: 10px"
            @click="handleBatchDisable"
            type="warning"
            >批量禁用</el-button
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
            @command="handleAddCommand"
            style="margin-right: 10px"
          >
            添加
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="time">定时策略</el-dropdown-item>
                <el-dropdown-item command="linkage">联动策略</el-dropdown-item>
                <el-dropdown-item command="scene">场景策略</el-dropdown-item>
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
          v-loading="smartControlStore.loading"
          :data="tableData"
          stripe
          style="width: 100%"
          :header-cell-style="{
            background: '#226EE04D',
            color: '#333',
            height: '48px',
          }"
          :row-style="{ height: '56px' }"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column
            prop="strategyName"
            label="策略名称"
            align="center"
          />
          <el-table-column prop="strategyType" label="策略类型" align="center">
            <template #default="{ row }">
              <el-tag
                :type="getStrategyTypeType(row.strategyType)"
                size="small"
              >
                {{ row.strategyType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="labName" label="适用实验室" align="center">
            <template #default="{ row }">
              {{ getLabName(row.labId) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="targetDevice"
            label="目标设备"
            align="center"
          />
          <el-table-column
            prop="triggerCondition"
            label="触发条件"
            align="center"
            show-overflow-tooltip
          />
          <el-table-column
            prop="executeAction"
            label="执行动作"
            align="center"
            show-overflow-tooltip
          />
          <el-table-column prop="status" label="状态" align="center" width="80">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                :active-value="'启用'"
                :inactive-value="'禁用'"
                @change="(val) => handleStatusChange(row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column
            prop="priority"
            label="优先级"
            align="center"
            width="80"
          />
          <el-table-column
            prop="updateTime"
            label="更新时间"
            align="center"
            width="160"
          />
          <el-table-column
            label="操作"
            align="center"
            width="120"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                size="small"
                @click="handleEditRow(row)"
                >编辑</el-button
              >
              <el-button
                link
                type="danger"
                size="small"
                @click="handleDeleteRow(row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-box">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "@/stores/user.js";
import { useSmartControlStore } from "@/stores/smartControl";
import { createQuartz, deleteQuartz, enableQuartz, cancelQuartz } from "@/api/smartControl.js";
import AddStrategyDialog from "@/components/AboutIntelligent/AddStrategyDialog.vue";

const userStore = useUserStore();
const smartControlStore = useSmartControlStore();

// 查询条件
const unit = ref("all");
const building = ref("all");
const labNo = ref("all");
const searchKey = ref("");

// 表格相关
const tableRef = ref();
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const selectedRows = ref([]);

// 添加策略弹窗显示状态
const showAddDialog = ref(false);

// 策略数据从 store 获取
const strategyList = computed(() => smartControlStore.getStrategyList);

// 分页信息
const pagination = computed(() => smartControlStore.getStrategyPagination);

// 计算属性：楼栋列表
const buildingList = computed(() => userStore.getBuildingList);

// 计算属性：部门列表
const rawDeptData = computed(() => userStore.userInfo?.depts || []);
const deptList = computed(() => rawDeptData.value.map((item) => item.dept));

// 计算属性：实验室列表
const laboratoryList = computed(() => userStore.getLaboratoryList);

// 过滤后的实验室列表
const filteredLaboratoryList = computed(() => {
  let result = laboratoryList.value;

  // 按楼栋过滤
  if (building.value && building.value !== "all") {
    result = result.filter(
      (room) => String(room.belongToBuilding) === String(building.value),
    );
  }

  // 按单位过滤
  if (unit.value && unit.value !== "all") {
    result = result.filter((room) => {
      const depts = room.belongToDepts || [];
      return depts.map(String).includes(String(unit.value));
    });
  }

  return result;
});

// 计算属性：将策略数据映射为表格数据
const mappedTableData = computed(() => {
  console.log("【智能控制】strategyList原始数据:", strategyList.value);
  if (!strategyList.value || strategyList.value.length === 0) {
    console.log("【智能控制】strategyList为空");
    return [];
  }
  return strategyList.value.map((item) => {
    const task = item.task || {};
    const actionGroups = item.actionGroups || [];
    const conditionGroups = item.conditionGroups || [];
    const timeRule = item.timeRule || {};

    // 提取目标设备名称
    const targetDevices = [];
    const dataGroup = item.dataGroup || [];
    
    actionGroups.forEach((group) => {
      (group.actions || []).forEach((action) => {
        // 优先使用 deviceName，没有则从 dataGroup 查找
        let deviceName = action.deviceName;
        if (!deviceName && action.deviceId) {
          const dataItem = dataGroup.find(d => d.deviceId === action.deviceId);
          if (dataItem) {
            const deviceTypeMap = {
              AirCondition: "空调",
              CircuitBreak: "断路器",
              Light: "照明",
              Sensor: "传感器",
              Access: "门禁",
            };
            deviceName = deviceTypeMap[dataItem.deviceType] || dataItem.deviceType;
          }
        }
        if (deviceName) {
          targetDevices.push(deviceName);
        } else if (action.deviceType) {
          const deviceTypeMap = {
            AirCondition: "空调",
            CircuitBreak: "断路器",
            Light: "照明",
            Sensor: "传感器",
            Access: "门禁",
          };
          targetDevices.push(deviceTypeMap[action.deviceType] || action.deviceType);
        }
      });
    });

    // 提取触发条件描述
    const triggerConditions = [];
    conditionGroups.forEach((group) => {
      (group.conditions || []).forEach((condition) => {
        if (condition.desc) {
          triggerConditions.push(condition.desc);
        } else if (condition.expr) {
          triggerConditions.push(condition.expr);
        }
      });
    });

    // 提取执行动作描述（根据 args 翻译）
    const executeActions = [];
    actionGroups.forEach((group) => {
      (group.actions || []).forEach((action) => {
        const args = action.args || [];
        const deviceType = action.deviceType;
        const commandLine = action.commandLine;
        
        let actionDesc = "";
        
        if (deviceType === "AirCondition" && commandLine === "ENHANCE_CONTROL_AIR_CONDITION") {
          // 空调增强控制: [address, selfId, power, mode, temperature, fanSpeed]
          const power = args[2];
          const mode = args[3];
          const temperature = args[4];
          const fanSpeed = args[5];
          
          const modeMap = { 1: "制热", 2: "制冷", 4: "送风", 8: "除湿" };
          const speedMap = { 0: "自动", 1: "低速", 2: "中速", 3: "高速" };
          
          const modeText = modeMap[mode] || "";
          const speedText = speedMap[fanSpeed] || "";
          const powerText = power === 1 ? "开启" : "关闭";
          
          actionDesc = `空调${powerText} ${modeText} ${temperature}℃ ${speedText}`;
        } else if (deviceType === "CircuitBreak") {
          // 断路器: [address]
          if (commandLine === "OPEN_CIRCUITBREAK") {
            actionDesc = "断路器通电";
          } else if (commandLine === "CLOSE_CIRCUITBREAK") {
            actionDesc = "断路器断电";
          }
        } else if (deviceType === "Light") {
          // 照明: [address]
          if (commandLine === "OPEN_LIGHT") {
            actionDesc = "打开照明";
          } else if (commandLine === "CLOSE_LIGHT") {
            actionDesc = "关闭照明";
          }
        } else if (deviceType === "Access") {
          // 门禁: [address, selfId]
          if (commandLine === "OPEN_ACCESS_ONCE") {
            actionDesc = "开启门禁";
          } else if (commandLine === "CLOSE_ACCESS_ONCE") {
            actionDesc = "关闭门禁";
          }
        }
        
        if (actionDesc) {
          executeActions.push(actionDesc);
        }
      });
    });

    // 判断策略类型
    let strategyType = "定时策略";
    if (conditionGroups.length > 0) {
      strategyType = "联动策略";
    } else if (actionGroups.length > 1) {
      strategyType = "场景策略";
    }

    // 构建时间规则描述
    let timeDesc = "";
    if (timeRule.weekdays && timeRule.weekdays.length > 0) {
      const weekdayMap = {
        1: "一",
        2: "二",
        3: "三",
        4: "四",
        5: "五",
        6: "六",
        7: "日",
      };
      const weekdays = timeRule.weekdays.map((d) => weekdayMap[d]).join("、");
      timeDesc = `每周${weekdays} ${timeRule.startTime || ""}-${timeRule.endTime || ""}`;
    }

    // Cron 表达式转时间描述
    const getCronDesc = (cron) => {
      if (!cron) return "";
      const cronMap = {
        "*/5 * * * * ?": "每5秒",
        "*/10 * * * * ?": "每10秒",
        "*/30 * * * * ?": "每30秒",
        "0 * * * * ?": "每分钟",
        "0 */5 * * * ?": "每5分钟",
        "0 */10 * * * ?": "每10分钟",
        "0 */30 * * * ?": "每30分钟",
        "0 0 * * * ?": "每小时",
        "0 0 0 * * ?": "每天",
      };
      return cronMap[cron] || cron;
    };
    const cronDesc = getCronDesc(task.cron);

    // 合并触发条件和执行频率
    let triggerConditionText = triggerConditions.join("; ");
    if (triggerConditionText && cronDesc) {
      triggerConditionText += `（${cronDesc}检查）`;
    } else if (!triggerConditionText && cronDesc) {
      triggerConditionText = cronDesc;
    }

    return {
      id: task.id,
      taskId: task.id,
      strategyName: task.taskName || "-",
      strategyType: strategyType,
      labId: task.laboratoryId,
      targetDevice: [...new Set(targetDevices)].join(", ") || "-",
      triggerCondition: triggerConditionText || timeDesc || "-",
      executeAction: [...new Set(executeActions)].join("; ") || "-",
      status: task.enable ? "启用" : "禁用",
      priority: "1",
      updateTime: task.startDate || "-",
      rawData: item, // 保留原始数据
    };
  });
});

// 计算属性：表格数据（带筛选和分页）
const tableData = computed(() => {
  console.log("【智能控制】mappedTableData:", mappedTableData.value);
  let data = [...mappedTableData.value];
  console.log("【智能控制】筛选前数据条数:", data.length);

  // 按楼栋筛选
  if (building.value && building.value !== "all") {
    const labIdsInBuilding = laboratoryList.value
      .filter((lab) => String(lab.belongToBuilding) === String(building.value))
      .map((lab) => String(lab.id));
    data = data.filter((item) => labIdsInBuilding.includes(String(item.labId)));
  }

  // 按单位筛选
  if (unit.value && unit.value !== "all") {
    const labIdsInUnit = laboratoryList.value
      .filter((lab) => {
        const depts = lab.belongToDepts || [];
        return depts.map(String).includes(String(unit.value));
      })
      .map((lab) => String(lab.id));
    data = data.filter((item) => labIdsInUnit.includes(String(item.labId)));
  }

  // 按实验室筛选
  if (labNo.value !== "all") {
    data = data.filter((item) => String(item.labId) === String(labNo.value));
  }

  // 搜索关键字筛选
  if (searchKey.value.trim()) {
    const k = searchKey.value.trim().toLowerCase();
    data = data.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(k)),
    );
  }

  // 使用后端分页
  total.value = pagination.value.total || data.length;
  console.log("【智能控制】最终表格数据:", data, "总条数:", total.value);
  return data;
});

// 启用的策略数量
const enabledCount = computed(() => {
  return mappedTableData.value.filter((item) => item.status === "启用").length;
});

// 获取实验室名称
const getLabName = (labId) => {
  const lab = laboratoryList.value.find((item) => item.id === labId);
  return lab?.laboratoryName || lab?.laboratoryId || labId || "-";
};

// 获取策略类型标签样式
const getStrategyTypeType = (type) => {
  const typeMap = {
    定时策略: "primary",
    联动策略: "success",
    场景策略: "warning",
  };
  return typeMap[type] || "info";
};

// 获取设备类型名称
const getDeviceTypeName = (deviceType) => {
  const typeMap = {
    AirCondition: "空调",
    CircuitBreak: "断路器",
    Light: "照明",
    Sensor: "传感器",
    Access: "门禁",
  };
  return typeMap[deviceType] || deviceType;
};

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
};

// 实验室下拉框变化
const handleLabChange = (val) => {
  console.log("【实验室选择变化】选中值:", val);
};

// 手动刷新
const handleRefresh = async () => {
  isLoading.value = true;
  try {
    await loadStrategyData();
    ElMessage.success("刷新成功");
  } finally {
    isLoading.value = false;
  }
};

// 加载策略数据
const loadStrategyData = async () => {
  const params = {
    current: currentPage.value,
    size: pageSize.value,
  };
  // 如果选择了实验室，则传入实验室ID，否则不传（后端返回所有或默认数据）
  if (labNo.value && labNo.value !== "all") {
    params.laboratoryId = labNo.value;
  } else if (laboratoryList.value.length > 0) {
    // 如果没有选择实验室，默认使用第一个实验室的ID
    params.laboratoryId = laboratoryList.value[0].id;
  }
  console.log("【智能控制】请求参数:", params);
  console.log("【智能控制】实验室列表:", laboratoryList.value);
  await smartControlStore.fetchStrategyListByLab(params);
  console.log("【智能控制】Store策略列表:", smartControlStore.getStrategyList);
  console.log(
    "【智能控制】Store分页信息:",
    smartControlStore.getStrategyPagination,
  );
};

// 批量启用
const handleBatchEnable = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请至少选择一条记录");
    return;
  }
  try {
    const enablePromises = selectedRows.value.map((row) => enableQuartz(row.taskId));
    await Promise.all(enablePromises);
    ElMessage.success(`已启用 ${selectedRows.value.length} 条策略`);
    // 刷新列表
    loadStrategyData();
  } catch (error) {
    console.error("批量启用失败:", error);
    ElMessage.error(error.message || "启用失败");
  }
};

// 批量禁用
const handleBatchDisable = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请至少选择一条记录");
    return;
  }
  try {
    const cancelPromises = selectedRows.value.map((row) => cancelQuartz(row.taskId));
    await Promise.all(cancelPromises);
    ElMessage.success(`已禁用 ${selectedRows.value.length} 条策略`);
    // 刷新列表
    loadStrategyData();
  } catch (error) {
    console.error("批量禁用失败:", error);
    ElMessage.error(error.message || "禁用失败");
  }
};

// 状态切换
const handleStatusChange = async (row, val) => {
  console.log("【状态切换】", row, val);
  try {
    if (val === "启用") {
      await enableQuartz(row.taskId);
    } else {
      await cancelQuartz(row.taskId);
    }
    ElMessage.success(`策略"${row.strategyName}"已${val === "启用" ? "启用" : "禁用"}`);
    // 刷新列表
    loadStrategyData();
  } catch (error) {
    console.error("状态切换失败:", error);
    ElMessage.error(error.message || "操作失败");
    // 恢复原状态
    row.status = val === "启用" ? "禁用" : "启用";
  }
};

// 添加
const handleAdd = () => {
  console.log("添加策略");
  showAddDialog.value = true;
};

// 添加命令处理
const handleAddCommand = (command) => {
  const typeMap = {
    time: "定时策略",
    linkage: "联动策略",
    scene: "场景策略",
  };
  console.log("添加" + typeMap[command]);
  // 打开添加策略弹窗
  showAddDialog.value = true;
};

// 添加策略确认
const handleAddConfirm = async (data) => {
  console.log("添加策略数据:", data);
  
  try {
    const res = await createQuartz(data);
    console.log("创建策略成功:", res);
    ElMessage.success(`策略"${data.task.taskName}"创建成功`);
    // 刷新列表
    loadStrategyData();
  } catch (error) {
    console.error("创建策略失败:", error);
    ElMessage.error(error.message || "创建策略失败");
  }
};

// 添加策略取消
const handleAddCancel = () => {
  console.log("取消添加策略");
};

// 修改（批量）
const handleEdit = () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (selection.length !== 1) {
    ElMessage.warning("请选择一条要修改的记录");
    return;
  }
  console.log("编辑记录：", selection[0]);
  ElMessage.info("打开编辑弹窗");
};

// 行内编辑
const handleEditRow = (row) => {
  console.log("编辑行：", row);
  ElMessage.info(`编辑策略"${row.strategyName}"`);
};

// 删除（批量）
const handleDelete = async () => {
  const selection = tableRef.value?.getSelectionRows?.() || [];
  if (!selection.length) {
    ElMessage.warning("请至少选择一条要删除的记录");
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selection.length} 条策略吗？`,
      "提示",
      { type: "warning" },
    );
    
    // 批量删除
    const deletePromises = selection.map((row) => deleteQuartz(row.taskId));
    await Promise.all(deletePromises);
    
    ElMessage.success(`成功删除 ${selection.length} 条策略`);
    // 刷新列表
    loadStrategyData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除失败:", error);
      ElMessage.error(error.message || "删除失败");
    }
  }
};

// 行内删除
const handleDeleteRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除策略"${row.strategyName}"吗？`, "提示", {
      type: "warning",
    });
    
    await deleteQuartz(row.taskId);
    ElMessage.success("删除成功");
    // 刷新列表
    loadStrategyData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error(error.message || "删除失败");
    }
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  console.log("【搜索】关键字:", searchKey.value);
};

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  loadStrategyData();
};

// 页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val;
  loadStrategyData();
};

onMounted(async () => {
  // 刷新用户信息
  await userStore.refreshUserInfo();
  console.log("【智能控制】用户信息加载完成");
  console.log("【智能控制】实验室列表:", laboratoryList.value);
  console.log("【智能控制】楼栋列表:", buildingList.value);
  console.log("【智能控制】部门列表:", deptList.value);
  // 加载策略数据
  await loadStrategyData();
  console.log("【智能控制】页面加载完成");
});

// 监听实验室选择变化，自动刷新数据
watch(labNo, async (newVal) => {
  currentPage.value = 1;
  await loadStrategyData();
});
</script>

<style scoped>
.intelligent-control-page {
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

:deep(.el-button:focus) {
  outline: none;
  box-shadow: none;
}
</style>
