import { ref, computed } from "vue";
import { useUserStore } from "@/stores";

/**
 * 实验室单选平行筛选逻辑
 * 无论先选哪个，都联动筛选另外两个选项
 */
export function useLabFilter() {
  const userStore = useUserStore();

  // ============ 原始数据 ============
  const allDepts = computed(() => {
    return (userStore.userInfo.depts || []).map((d) => d.dept);
  });

  const allBuildings = computed(() => userStore.userInfo.buildings || []);

  const allLabs = computed(() => userStore.userInfo.laboratories || []);

  // ============ 选中的值（单选，null 或 id） ============
  const selectedDept = ref(null);
  const selectedBuilding = ref(null);
  const selectedLab = ref(null);

  // ============ 计算：可选的单位列表 ============
  const availableDepts = computed(() => {
    let result = allDepts.value;

    // 如果选了楼栋 → 筛选出有该楼栋的单位
    if (selectedBuilding.value) {
      result = result.filter((dept) => {
        const deptData = userStore.userInfo.depts.find(
          (d) => d.dept.id === dept.id
        );
        const deptBuildingIds = (deptData?.buildings || []).map((b) => b.id);
        return deptBuildingIds.includes(selectedBuilding.value);
      });
    }

    // 如果选了实验室 → 筛选出包含该实验室的单位
    if (selectedLab.value) {
      const lab = allLabs.value.find((l) => l.id === selectedLab.value);
      const labDeptIds = lab?.belongToDepts || [];
      result = result.filter((dept) => labDeptIds.includes(dept.id));
    }

    return result;
  });

  // ============ 计算：可选的楼栋列表 ============
  const availableBuildings = computed(() => {
    let result = allBuildings.value;

    // 如果选了单位 → 筛选出该单位下的楼栋
    if (selectedDept.value) {
      const dept = userStore.userInfo.depts.find(
        (d) => d.dept.id === selectedDept.value
      );
      const buildingIds = (dept?.buildings || []).map((b) => b.id);
      result = result.filter((b) => buildingIds.includes(b.id));
    }

    // 如果选了实验室 → 筛选出该实验室所在的楼栋
    if (selectedLab.value) {
      const lab = allLabs.value.find((l) => l.id === selectedLab.value);
      result = result.filter((b) => b.id === lab?.belongToBuilding);
    }

    return result;
  });

  // ============ 计算：可选的实验室列表 ============
  const availableLabs = computed(() => {
    let result = allLabs.value;

    // 如果选了单位 → 筛选出该单位下的实验室
    if (selectedDept.value) {
      result = result.filter((lab) =>
        lab.belongToDepts?.includes(selectedDept.value)
      );
    }

    // 如果选了楼栋 → 筛选出该楼栋下的实验室
    if (selectedBuilding.value) {
      result = result.filter(
        (lab) => lab.belongToBuilding === selectedBuilding.value
      );
    }

    return result;
  });

  // ============ 事件处理：联动清理 ============
  const handleDeptChange = (val) => {
    selectedDept.value = val;
    // 如果当前楼栋不在可选列表，清空
    if (
      selectedBuilding.value &&
      !availableBuildings.value.some((b) => b.id === selectedBuilding.value)
    ) {
      selectedBuilding.value = null;
    }
    // 如果当前实验室不在可选列表，清空
    if (
      selectedLab.value &&
      !availableLabs.value.some((l) => l.id === selectedLab.value)
    ) {
      selectedLab.value = null;
    }
  };

  const handleBuildingChange = (val) => {
    selectedBuilding.value = val;
    // 如果当前单位不在可选列表，清空
    if (
      selectedDept.value &&
      !availableDepts.value.some((d) => d.id === selectedDept.value)
    ) {
      selectedDept.value = null;
    }
    // 如果当前实验室不在可选列表，清空
    if (
      selectedLab.value &&
      !availableLabs.value.some((l) => l.id === selectedLab.value)
    ) {
      selectedLab.value = null;
    }
  };

  const handleLabChange = (val) => {
    selectedLab.value = val;
    // 如果当前单位不在可选列表，清空
    if (
      selectedDept.value &&
      !availableDepts.value.some((d) => d.id === selectedDept.value)
    ) {
      selectedDept.value = null;
    }
    // 如果当前楼栋不在可选列表，清空
    if (
      selectedBuilding.value &&
      !availableBuildings.value.some((b) => b.id === selectedBuilding.value)
    ) {
      selectedBuilding.value = null;
    }
  };

  // ============ 重置 ============
  const resetFilters = () => {
    selectedDept.value = null;
    selectedBuilding.value = null;
    selectedLab.value = null;
  };

  // ============ 当前筛选结果（用于展示或二次过滤） ============
  const currentFilteredLabs = computed(() => {
    return allLabs.value.filter((lab) => {
      const matchDept =
        !selectedDept.value || lab.belongToDepts?.includes(selectedDept.value);
      const matchBuilding =
        !selectedBuilding.value ||
        lab.belongToBuilding === selectedBuilding.value;
      const matchLab = !selectedLab.value || lab.id === selectedLab.value;
      return matchDept && matchBuilding && matchLab;
    });
  });

  return {
    // 数据
    allDepts,
    allBuildings,
    allLabs,
    // 选中的值
    selectedDept,
    selectedBuilding,
    selectedLab,
    // 可选的列表
    availableDepts,
    availableBuildings,
    availableLabs,
    // 当前筛选结果
    currentFilteredLabs,
    // 事件
    handleDeptChange,
    handleBuildingChange,
    handleLabChange,
    resetFilters,
  };
}
