// stores/user.js
import { defineStore } from "pinia";
import { getToken, removeToken } from "@/api/auth.js";
import { apiGetUserInfo, apiGetVisibleTree, apiGetPermissionTree } from "@/api/user";
export const useUserStore = defineStore("user", {
  state: () => ({
    userInfo: {
      id: null,
      realName: "管理员",
      phone: "",
      email: "",
      permissions: [], // [{ permission: {description,id,parentId}, path: [] }]
      depts: [], // 单位
      laboratories: [], // 实验室
      buildings: [], // 楼栋
    },
    isLogin: false,
    // 可见用户树数据
    visibleTree: [],
    // 权限树数据（所有权限）
    permissionTree: null,
  }),

  getters: {
    getToken() {
      const token = getToken();
      console.log(
        "[UserStore][getToken] token:",
        token ? "***" + token.slice(-6) : "无",
      );
      return token;
    },
    getId(state) {
      return state.userInfo.id;
    },
    // 只返回权限描述字符串数组
    getPermissionList(state) {
      return (state.userInfo.permissions || []).map(
        (p) => p.permission?.description,
      );
    },

    getDeptList(state) {
      return state.userInfo.depts || [];
    },

    getLaboratoryList(state) {
      return state.userInfo.laboratories || [];
    },
    getBuildingList(state) {
      return state.userInfo.buildings || [];
    },
  },

  actions: {
    /**
     * 存储用户信息（来自 /user/getCurrentUserDetail）
     */
    setLoginInfo(detail) {
      this.userInfo = {
        id: detail.id,
        realName: detail.realName,
        phone: detail.phone,
        email: detail.email,
        permissions: detail.permissions || [],
        depts: detail.depts || [],
        laboratories: detail.laboratories || [],
        buildings: detail.buildings || [],
      };

      this.isLogin = true;
      console.log(this.userInfo);
      // 持久化用户信息（不含 token）
      localStorage.setItem("userBasicInfo", JSON.stringify(this.userInfo));
      console.log("[UserStore][setLoginInfo] 用户信息已更新");
    },

    /**
     * 清除登录状态
     */
    clearLoginInfo() {
      console.log("[UserStore][clearLoginInfo] 清理用户信息...");

      this.userInfo = {
        id: null,
        realName: "",
        phone: "",
        email: "",
        permissions: [],
        depts: [],
        laboratories: [],
        buildings: [],
      };

      // 清除 token
      removeToken();

      this.isLogin = false;

      // 清除本地缓存
      localStorage.removeItem("userBasicInfo");

      console.log("[UserStore][clearLoginInfo] 已清除所有本地信息");
    },

    /**
     * 页面刷新后恢复用户登录状态
     */
    initUserInfo() {
      console.log("[UserStore][initUserInfo] 初始化用户信息...");

      const token = getToken();

      if (!token) {
        console.log("[UserStore][initUserInfo] 无 token，用户未登录");
        this.isLogin = false;
        return;
      }

      const stored = localStorage.getItem("userBasicInfo");

      if (stored) {
        this.userInfo = JSON.parse(stored);
        this.isLogin = true;

        console.log(
          "[UserStore][initUserInfo] 已从 localStorage 恢复用户信息:",
          this.userInfo,
        );
      } else {
        console.warn(
          "[UserStore][initUserInfo] 有 token 但没有 userBasicInfo，需重新请求接口",
        );
        this.isLogin = true;
      }
    },
    /**
     * 重新请求 /user/getCurrentUserDetail 并刷新本地缓存
     */
    async refreshUserInfo() {
      console.log("[UserStore][refreshUserInfo] 刷新用户信息...");

      try {
        const res = await apiGetUserInfo();
        const detail = res.data.data; // 拆解
        this.setLoginInfo(detail);
        console.log("[UserStore][refreshUserInfo] 用户信息已刷新", detail);
        return detail; // 2. 返回结果
      } catch (err) {
        console.error("[UserStore][refreshUserInfo] 刷新失败", err);
        throw err; // 3. async 函数直接 throw 即可
      }
    },

    /**
     * 获取可见用户树并存储
     */
    async fetchVisibleTree() {
      console.log("[UserStore][fetchVisibleTree] 获取可见用户树...");

      try {
        const res = await apiGetVisibleTree();
        const treeData = res.data.data || [];
        this.visibleTree = treeData;
        console.log("[UserStore][fetchVisibleTree] 可见用户树已更新", treeData);
        return treeData;
      } catch (err) {
        console.error("[UserStore][fetchVisibleTree] 获取失败", err);
        throw err;
      }
    },

    /**
     * 清除可见用户树数据
     */
    clearVisibleTree() {
      this.visibleTree = [];
      console.log("[UserStore][clearVisibleTree] 可见用户树已清除");
    },

    /**
     * 获取权限树并存储
     */
    async fetchPermissionTree() {
      console.log("[UserStore][fetchPermissionTree] 获取权限树...");

      try {
        const res = await apiGetPermissionTree();
        const treeData = res.data.data || null;
        this.permissionTree = treeData;
        console.log("[UserStore][fetchPermissionTree] 权限树已更新", treeData);
        return treeData;
      } catch (err) {
        console.error("[UserStore][fetchPermissionTree] 获取失败", err);
        throw err;
      }
    },

    /**
     * 清除权限树数据
     */
    clearPermissionTree() {
      this.permissionTree = null;
      console.log("[UserStore][clearPermissionTree] 权限树已清除");
    },
  },
});
