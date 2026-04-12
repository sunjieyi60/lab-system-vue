// src/stores/base.js
import { defineStore } from "pinia";
import {
  addLaboratory,
  deleteLaboratory,
  addWorkplace,
  addBuilding,
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
      return s.laboratories.filter(
        (i) =>
          i.laboratoryId?.toLowerCase().includes(k) ||
          i.laboratoryName?.toLowerCase().includes(k),
      );
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
      await addWorkplace({ deptName: name });
      ElMessage.success("新增单位成功");
      this.appendWorkplace(name);
    },

    /* ---- 新增楼栋（原方法名不变） ---- */
    async addBuilding({ buildingName, deptIds }) {
      await addBuilding({ buildingName, deptIds });
      ElMessage.success("新增楼栋成功");
      this.appendBuilding(buildingName);
    },
    // 修改实验室
    async editLaboratory(payload) {
      console.log(payload);
      await editLaboratory({ payload });
      await this.refreshLaboratories();
    },
    /* ---- 搜索（仅前端过滤） ---- */
    searchLab(keyword) {
      this.keyword = keyword;
    },
  },
});
