// src/stores/base.js
import { defineStore } from "pinia";
import {
  addLaboratory,
  deleteLaboratory,
  addWorkplace,
  addBuilding as apiAddBuilding,
  deleteWorkplace,
  deleteBuilding,
  getLaboratoryInfo,
  editLaboratory,
} from "@/api/base";
import { ElMessage } from "element-plus";

export const useBaseStore = defineStore("base", {
  state: () => ({
    workplaces: [],
    buildings: [],
    laboratories: [], // 全量实验室
    keyword: "", // 前端搜索关键字
  }),

  getters: {
    getWorkplaces: (s) => s.workplaces,
    getBuildings: (s) => s.buildings,
    getLaboratories(s) {
      const k = s.keyword.trim().toLowerCase();
      if (!k) return s.laboratories;
      
      // 模糊查询：在多个字段中匹配关键词
      return s.laboratories.filter((item) => {
        const keyword = k;
        
        // 实验室编号
        if (item.laboratoryId?.toLowerCase().includes(keyword)) return true;
        
        // 实验室名称
        if (item.laboratoryName?.toLowerCase().includes(keyword)) return true;
        
        // 单位（belongToDepts 是部门ID数组，尝试匹配ID）
        if (item.belongToDepts?.some(deptId => String(deptId).includes(keyword))) return true;
        
        // 楼栋（belongToBuilding 是楼栋ID）
        if (String(item.belongToBuilding || "").includes(keyword)) return true;
        
        // 负责人（managers 数组中的 realName）
        if (item.managers?.some(m => m.realName?.toLowerCase().includes(keyword))) return true;
        
        // 安全等级
        if (String(item.securityLevel || "").toLowerCase().includes(keyword)) return true;
        
        return false;
      });
    },
  },

  actions: {
    /* ---- 字典：单位 ---- */
    appendWorkplace(name) {
      if (name && !this.workplaces.includes(name)) this.workplaces.push(name);
    },

    /* ---- 字典：楼栋 ---- */
    appendBuilding(name) {
      if (name && !this.buildings.includes(name)) this.buildings.push(name);
    },

    /* ---- 全量拉实验室 ---- */
    async refreshLaboratories() {
      const res = await getLaboratoryInfo();
      this.laboratories = res.data.data;
    },

    /* ---- 新增实验室（原方法名不变） ---- */
    async addLaboratory(payload) {
      console.log("paylod", payload);
      await addLaboratory(payload);
      ElMessage.success("新增实验室成功");
      await this.refreshLaboratories();
    },

    /* ---- 删除实验室（原方法名不变） ---- */
    async deleteLaboratory(id) {
      console.log("要删除的i是：", id);
      await deleteLaboratory({ id });
      await this.refreshLaboratories();
    },

    /* ---- 新增单位（原方法名不变） ---- */
    async addWorkplace(name) {
      const res = await addWorkplace({ deptName: name });
      ElMessage.success("新增单位成功");
      // 返回新创建的单位数据（包含 id）
      return res.data.data;
    },

    /* ---- 新增楼栋（原方法名不变） ---- */
    async addBuilding({ buildingName, deptIds }) {
      const res = await apiAddBuilding({ buildingName, deptIds });
      console.log("【调试】baseStore.addBuilding 后端返回:", res);
      ElMessage.success("新增楼栋成功");
      // 返回新创建的楼栋数据（包含 id）
      // 兼容不同响应格式：res.data 或 res.data.data
      const buildingData = res.data?.data || res.data;
      console.log("【调试】提取的楼栋数据:", buildingData);
      return buildingData;
    },

    /* ---- 删除单位 ---- */
    async removeWorkplace(deptId) {
      await deleteWorkplace({ deptId });
      ElMessage.success("删除单位成功");
    },

    /* ---- 删除楼栋 ---- */
    async removeBuilding(buildingId) {
      await deleteBuilding({ buildingId });
      ElMessage.success("删除楼栋成功");
    },
    // 修改实验室
    async editLaboratory(payload) {
      console.log(payload);
      await editLaboratory(payload);
      await this.refreshLaboratories();
    },
    /* ---- 搜索（仅前端过滤） ---- */
    searchLab(keyword) {
      this.keyword = keyword;
    },
  },
});
