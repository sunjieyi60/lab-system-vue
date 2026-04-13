// src/stores/smartControl.js
import { defineStore } from "pinia";
import {
  getQuartzList,
  getQuartzListByLab,
  getQuartzListByLabBatch,
  createQuartz,
  updateQuartz,
  deleteQuartz,
  enableQuartz,
  cancelQuartz,
  generateFromCourseSchedule,
} from "@/api/smartControl";
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
      return s.strategyList.find((item) => item.task?.id === id);
    },

    // 根据任务ID获取策略详情
    getStrategyByTaskId: (s) => (taskId) => {
      return s.strategyList.find((item) => item.task?.id === taskId);
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
    /* ---- 获取定时任务列表 ---- */
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

    /* ---- 批量按实验室查询任务（支持多实验室ID列表）---- */
    async fetchStrategyListByLabBatch(laboratoryIds = []) {
      if (!laboratoryIds || laboratoryIds.length === 0) {
        console.warn("【SmartControlStore】实验室ID列表为空");
        this.strategyList = [];
        this.strategyPagination = {
          total: 0,
          size: 20,
          current: 1,
          pages: 1,
        };
        return {
          list: [],
          pagination: this.strategyPagination,
        };
      }
      this.loading = true;
      try {
        console.log("【SmartControlStore】批量查询实验室:", laboratoryIds);
        const res = await getQuartzListByLabBatch(laboratoryIds);
        console.log("【SmartControlStore】批量查询API返回:", res);
        const records = res.data?.data || [];
        this.strategyList = records;
        this.strategyPagination = {
          total: records.length,
          size: records.length,
          current: 1,
          pages: 1,
        };
        console.log("【SmartControlStore】批量查询结果:", this.strategyList);
        return {
          list: this.strategyList,
          pagination: this.strategyPagination,
        };
      } catch (error) {
        console.error("【SmartControlStore】批量查询策略列表失败:", error);
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

    /* ---- 创建定时任务 ---- */
    async createStrategy(data) {
      this.loading = true;
      try {
        const res = await createQuartz(data);
        ElMessage.success("创建定时任务成功");
        return res.data?.data;
      } catch (error) {
        console.error("创建定时任务失败:", error);
        ElMessage.error(error.message || "创建定时任务失败");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /* ---- 更新定时任务 ---- */
    async updateStrategy(data) {
      this.loading = true;
      try {
        const res = await updateQuartz(data);
        ElMessage.success("更新定时任务成功");
        return res.data?.data;
      } catch (error) {
        console.error("更新定时任务失败:", error);
        ElMessage.error(error.message || "更新定时任务失败");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /* ---- 删除定时任务 ---- */
    async deleteStrategy(taskId) {
      this.loading = true;
      try {
        await deleteQuartz(taskId);
        ElMessage.success("删除定时任务成功");
        // 从列表中移除
        this.strategyList = this.strategyList.filter(
          (item) => item.task?.id !== taskId
        );
        this.strategyPagination.total = Math.max(
          0,
          this.strategyPagination.total - 1
        );
      } catch (error) {
        console.error("删除定时任务失败:", error);
        ElMessage.error(error.message || "删除定时任务失败");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /* ---- 批量删除定时任务 ---- */
    async batchDeleteStrategy(taskIds) {
      this.loading = true;
      try {
        const promises = taskIds.map((id) => deleteQuartz(id));
        await Promise.all(promises);
        ElMessage.success(`成功删除 ${taskIds.length} 个定时任务`);
        // 从列表中移除
        this.strategyList = this.strategyList.filter(
          (item) => !taskIds.includes(item.task?.id)
        );
        this.strategyPagination.total = Math.max(
          0,
          this.strategyPagination.total - taskIds.length
        );
      } catch (error) {
        console.error("批量删除定时任务失败:", error);
        ElMessage.error(error.message || "批量删除定时任务失败");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /* ---- 启用定时任务 ---- */
    async enableStrategy(taskId) {
      try {
        await enableQuartz(taskId);
        ElMessage.success("启用定时任务成功");
        // 更新本地状态
        const strategy = this.strategyList.find(
          (item) => item.task?.id === taskId
        );
        if (strategy) {
          strategy.task.enable = true;
        }
      } catch (error) {
        console.error("启用定时任务失败:", error);
        ElMessage.error(error.message || "启用定时任务失败");
        throw error;
      }
    },

    /* ---- 禁用定时任务 ---- */
    async disableStrategy(taskId) {
      try {
        await cancelQuartz(taskId);
        ElMessage.success("禁用定时任务成功");
        // 更新本地状态
        const strategy = this.strategyList.find(
          (item) => item.task?.id === taskId
        );
        if (strategy) {
          strategy.task.enable = false;
        }
      } catch (error) {
        console.error("禁用定时任务失败:", error);
        ElMessage.error(error.message || "禁用定时任务失败");
        throw error;
      }
    },

    /* ---- 批量启用定时任务 ---- */
    async batchEnableStrategy(taskIds) {
      try {
        const promises = taskIds.map((id) => enableQuartz(id));
        await Promise.all(promises);
        ElMessage.success(`成功启用 ${taskIds.length} 个定时任务`);
        // 更新本地状态
        this.strategyList.forEach((item) => {
          if (taskIds.includes(item.task?.id)) {
            item.task.enable = true;
          }
        });
      } catch (error) {
        console.error("批量启用定时任务失败:", error);
        ElMessage.error(error.message || "批量启用定时任务失败");
        throw error;
      }
    },

    /* ---- 批量禁用定时任务 ---- */
    async batchDisableStrategy(taskIds) {
      try {
        const promises = taskIds.map((id) => cancelQuartz(id));
        await Promise.all(promises);
        ElMessage.success(`成功禁用 ${taskIds.length} 个定时任务`);
        // 更新本地状态
        this.strategyList.forEach((item) => {
          if (taskIds.includes(item.task?.id)) {
            item.task.enable = false;
          }
        });
      } catch (error) {
        console.error("批量禁用定时任务失败:", error);
        ElMessage.error(error.message || "批量禁用定时任务失败");
        throw error;
      }
    },

    /* ---- 从课表生成定时任务 ---- */
    async generateFromCourseSchedule(data) {
      this.loading = true;
      try {
        const res = await generateFromCourseSchedule(data);
        ElMessage.success("从课表生成定时任务成功");
        return res.data?.data;
      } catch (error) {
        console.error("从课表生成定时任务失败:", error);
        ElMessage.error(error.message || "从课表生成定时任务失败");
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
