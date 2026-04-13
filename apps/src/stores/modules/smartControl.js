// src/stores/smartControl.js
import { defineStore } from "pinia";
import { getQuartzList, getQuartzListByLab } from "@/api/smartControl";
import { ElMessage } from "element-plus";

export const useSmartControlStore = defineStore("smartControl", {
  state: () => ({
    // 定时任务列表（基础列表）
    quartzList: [],
    // 策略详情列表（根据实验室查询的完整策略数据）
    strategyList: [],
    // 策略分页信息
    strategyPagination: {
      total: 0,
      size: 20,
      current: 1,
      pages: 1,
    },
    // 加载状态
    loading: false,
    // 当前选中的实验室ID（用于筛选）
    currentLaboratoryId: null,
  }),

  getters: {
    // 获取所有定时任务列表
    getQuartzList: (s) => s.quartzList,

    // 根据实验室ID筛选定时任务
    getQuartzByLabId: (s) => (labId) => {
      if (!labId) return s.quartzList;
      return s.quartzList.filter((item) => item.laboratoryId === labId);
    },

    // 获取启用的定时任务
    getEnabledQuartzList: (s) => {
      return s.quartzList.filter((item) => item.enable);
    },

    // 获取禁用的定时任务
    getDisabledQuartzList: (s) => {
      return s.quartzList.filter((item) => !item.enable);
    },

    // 获取策略详情列表
    getStrategyList: (s) => s.strategyList,

    // 获取策略分页信息
    getStrategyPagination: (s) => s.strategyPagination,

    // 根据策略ID获取策略详情
    getStrategyById: (s) => (id) => {
      return s.strategyList.find((item) => String(item.task?.id) === String(id));
    },

    // 根据任务ID获取策略详情
    getStrategyByTaskId: (s) => (taskId) => {
      return s.strategyList.find((item) => String(item.task?.id) === String(taskId));
    },

    // 获取启用的策略列表
    getEnabledStrategyList: (s) => {
      return s.strategyList.filter((item) => item.task?.enable);
    },

    // 获取禁用的策略列表
    getDisabledStrategyList: (s) => {
      return s.strategyList.filter((item) => !item.task?.enable);
    },
  },

  actions: {
    /* ---- 获取定时任务列表（简化数据，用于表格显示）---- */
    async fetchQuartzList(params = {}) {
      this.loading = true;
      try {
        const res = await getQuartzList(params);
        this.quartzList = res.data?.data || [];
        return this.quartzList;
      } catch (error) {
        ElMessage.error("获取定时任务列表失败");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /* ---- 同时获取简化列表和完整策略列表 ---- */
    async fetchAllQuartzData(params = {}, labIds = []) {
      this.loading = true;
      try {
        // /quartz/list 不需要实验室ID，直接调用一次获取所有数据
        const simpleRes = await getQuartzList(params);
        this.quartzList = simpleRes.data?.data || [];
        console.log("【SmartControlStore】quartzList 数据:", this.quartzList.length, "条");
        
        // /quartz/list-by-lab 需要实验室ID
        let allStrategyList = [];
        let totalRecords = 0;
        
        if (labIds.length > 0) {
          // 如果有实验室列表，为每个实验室分别调用接口
          const fullPromises = labIds.map(labId => 
            getQuartzListByLab({ ...params, laboratoryId: labId })
          );
          const fullResults = await Promise.all(fullPromises);
          
          fullResults.forEach(res => {
            const data = res.data?.data || {};
            const records = data.records || [];
            allStrategyList.push(...records);
            totalRecords += data.total || records.length;
          });
        } else if (params.laboratoryId) {
          // 如果指定了单个实验室ID
          const fullRes = await getQuartzListByLab(params);
          const fullData = fullRes.data?.data || {};
          allStrategyList = fullData.records || [];
          totalRecords = fullData.total || 0;
        }
        
        this.strategyList = allStrategyList;
        this.strategyPagination = {
          total: totalRecords,
          size: params.size || 20,
          current: params.current || 1,
          pages: Math.ceil(totalRecords / (params.size || 20)) || 1,
        };
        
        console.log("【SmartControlStore】strategyList 数据:", this.strategyList.length, "条");
        
        return {
          quartzList: this.quartzList,
          strategyList: this.strategyList,
          pagination: this.strategyPagination,
        };
      } catch (error) {
        console.error("【SmartControlStore】获取策略数据失败:", error);
        ElMessage.error("获取策略数据失败");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /* ---- 根据实验室ID获取定时任务 ---- */
    async fetchQuartzByLabId(laboratoryId) {
      return await this.fetchQuartzList({ laboratoryId });
    },

    /* ---- 根据实验室ID获取策略详情列表（分页）---- */
    async fetchStrategyListByLab(params = {}) {
      this.loading = true;
      try {
        console.log("【SmartControlStore】请求参数:", params);
        const res = await getQuartzListByLab(params);
        console.log("【SmartControlStore】API返回:", res);
        const data = res.data?.data || {};
        console.log("【SmartControlStore】解析后的data:", data);
        this.strategyList = data.records || [];
        this.strategyPagination = {
          total: data.total || 0,
          size: data.size || 20,
          current: data.current || 1,
          pages: data.pages || 1,
        };
        console.log("【SmartControlStore】strategyList:", this.strategyList);
        return {
          list: this.strategyList,
          pagination: this.strategyPagination,
        };
      } catch (error) {
        console.error("【SmartControlStore】获取策略列表失败:", error);
        ElMessage.error("获取策略列表失败");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /* ---- 设置当前实验室ID ---- */
    setCurrentLaboratoryId(labId) {
      this.currentLaboratoryId = labId;
    },

    /* ---- 根据ID获取定时任务详情 ---- */
    getQuartzById(id) {
      return this.quartzList.find((item) => item.id === id);
    },

    /* ---- 根据策略ID获取策略详情 ---- */
    getStrategyById(id) {
      return this.strategyList.find((item) => item.task?.id === id);
    },

    /* ---- 根据任务ID获取策略详情 ---- */
    getStrategyByTaskId(taskId) {
      return this.strategyList.find((item) => item.task?.id === taskId);
    },

    /* ---- 清空定时任务数据 ---- */
    clearQuartz() {
      this.quartzList = [];
    },

    /* ---- 清空策略数据 ---- */
    clearStrategy() {
      this.strategyList = [];
      this.strategyPagination = {
        total: 0,
        size: 20,
        current: 1,
        pages: 1,
      };
    },

    /* ---- 清空所有数据 ---- */
    clear() {
      this.quartzList = [];
      this.strategyList = [];
      this.strategyPagination = {
        total: 0,
        size: 20,
        current: 1,
        pages: 1,
      };
      this.currentLaboratoryId = null;
    },
  },
});
