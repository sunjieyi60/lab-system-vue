import { defineStore } from "pinia";
// 引入学期相关的 API 方法
import { getTerm, addTerm, deleteTerm, updataTerm } from "@/api/edu";

export const useEduStore = defineStore("edu", {
  state: () => ({
    termList: [], // 学期列表数据
    currentTerm: null, // 当前选中的学期
    loading: false, // 加载状态标记
    error: null, // 错误信息存储
  }),

  getters: {
    // 获取所有学期列表
    getAllTerms(state) {
      console.log("[EduStore][getAllTerms] 当前学期列表:", state.termList);
      return state.termList;
    },
    // 获取当前选中的学期
    getCurrentTerm(state) {
      console.log(
        "[EduStore][getCurrentTerm] 当前选中学期:",
        state.currentTerm,
      );
      return state.currentTerm;
    },
    // 检查是否正在加载数据
    isLoading(state) {
      return state.loading;
    },
    // 获取错误信息
    getError(state) {
      return state.error;
    },
  },

  actions: {
    // 初始化学期数据
    async initTermData() {
      console.log("[EduStore][initTermData] 开始初始化学期数据...");
      try {
        this.loading = true;
        this.error = null;
        const response = await getTerm();
        console.log(
          "[EduStore][initTermData] 获取学期列表成功:",
          response.data.data,
        );
        this.termList = response.data.data || [];
        // 若有数据，默认选中第一个学期
        if (this.termList.length > 0) {
          this.currentTerm = this.termList[0];
          console.log(
            "[EduStore][initTermData] 默认选中第一个学期:",
            this.currentTerm,
          );
        }
      } catch (err) {
        this.error = err.message || "获取学期列表失败";
        console.error("[EduStore][initTermData] 获取学期列表失败:", this.error);
      } finally {
        this.loading = false;
        console.log("[EduStore][initTermData] 初始化学期数据完成");
      }
    },

    // 添加新学期
    async addNewTerm(termData) {
      console.log("[EduStore][addNewTerm] 开始添加新学期:", termData);
      try {
        this.loading = true;
        this.error = null;
        const response = await addTerm(termData);
        console.log("[EduStore][addNewTerm] 添加学期成功:", response.data);
        // 添加成功后更新列表
        this.termList.push(response.data);
        this.currentTerm = response.data;
        console.log("[EduStore][addNewTerm] 列表已更新");
        return true;
      } catch (err) {
        this.error = err.message || "添加学期失败";
        console.error("[EduStore][addNewTerm] 添加学期失败:", this.error);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // 删除学期
    async removeTerm(termId) {
      console.log("[EduStore][removeTerm] 开始删除学期，ID:", termId);
      try {
        this.loading = true;
        this.error = null;
        await deleteTerm(termId);
        console.log("[EduStore][removeTerm] 删除学期成功");
        // 删除后更新列表
        this.termList = this.termList.filter((term) => term.id !== termId);
        // 如果删除的是当前选中的学期，重置当前选中
        if (this.currentTerm && this.currentTerm.id === termId) {
          this.currentTerm = this.termList.length > 0 ? this.termList[0] : null;
        }
        return true;
      } catch (err) {
        this.error = err.message || "删除学期失败";
        console.error("[EduStore][removeTerm] 删除学期失败:", this.error);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // 更新学期信息
    async modifyTerm(id, termData) {
      console.log(
        "[EduStore][modifyTerm] 开始更新学期，ID:",
        id,
        "数据:",
        termData,
      );
      try {
        this.loading = true;
        this.error = null;
        const response = await updataTerm(id, termData);
        console.log("[EduStore][modifyTerm] 更新学期成功:", response.data);
        // 更新列表中对应的数据
        const index = this.termList.findIndex((term) => term.id === id);
        if (index !== -1) {
          this.termList[index] = response.data;
        }
        // 如果更新的是当前选中的学期，同步更新
        if (this.currentTerm && this.currentTerm.id === id) {
          this.currentTerm = response.data;
        }
        return true;
      } catch (err) {
        this.error = err.message || "更新学期失败";
        console.error("[EduStore][modifyTerm] 更新学期失败:", this.error);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // 设置当前选中的学期
    setCurrentTerm(term) {
      console.log("[EduStore][setCurrentTerm] 设置当前选中学期:", term);
      this.currentTerm = term;
    },

    // 清除错误信息
    clearError() {
      this.error = null;
    },
  },
});
