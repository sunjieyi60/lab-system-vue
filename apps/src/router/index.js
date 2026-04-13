import { createRouter, createWebHistory } from "vue-router";
import Layout from "@/components/common/Layout.vue";

const routes = [
  { path: "/login", component: () => import("@/views/user/login.vue") },
  {
    path: "/register",
    component: () => import("@/views/user/register.vue"),
  },

  {
    path: "/",
    component: Layout,
    redirect: "/login",
    name: "Root",
    children: [
      {
        path: "dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        meta: { hideSubMenu: true },
      },
      { path: "base", component: () => import("@/views/base/index.vue") },
    ],
  },

  {
    path: "/edu",
    component: Layout,
    redirect: "/edu/term",
    name: "Edu",
    meta: { title: "教务管理" },
    children: [
      {
        path: "term",
        name: "EduTerm",
        component: () => import("@/views/edu/index.vue"),
        meta: { title: "学期设置" },
      },
      {
        path: "schedule",
        name: "EduSchedule",
        component: () => import("@/views/edu/schedule.vue"),
        meta: { title: "实验室排课" },
      },
      {
        path: "timetable",
        name: "EduTimetable",
        component: () => import("@/views/edu/timetable.vue"),
        meta: { title: "实验室课表" },
      },
    ],
  },

  {
    path: "/control",
    component: Layout,
    redirect: "/control/hvac",
    name: "Control",
    meta: { title: "控制中心" },
    children: [
      {
        path: "hvac",
        name: "Hvac",
        component: () => import("@/views/control/hvac/index.vue"),
        meta: { title: "中央空调" },
      },
      {
        path: "gateway",
        name: "Gateway",
        component: () => import("@/views/control/gateway/index.vue"),
        meta: { title: "网关管理" },
      },
      {
        path: "access",
        name: "Access",
        component: () => import("@/views/control/access/index.vue"),
        meta: { title: "门禁管理" },
      },
      {
        path: "electric",
        name: "Electric",
        component: () => import("@/views/control/electric/index.vue"),
        meta: { title: "电气监控" },
      },
      {
        path: "light",
        name: "Light",
        component: () => import("@/views/control/light/index.vue"),
        meta: { title: "电灯开关监控" },
      },
      {
        path: "env",
        name: "Env",
        component: () => import("@/views/control/env/index.vue"),
        meta: { title: "环境监控" },
      },
      {
        path: "intelligent",
        name: "Intelligent",
        component: () => import("@/views/control/intelligent/index.vue"),
        meta: { title: "智控设备" },
      },
    ],
  },

  {
    path: "/data",
    component: Layout,
    redirect: "/data/edu",
    name: "Data",
    meta: { title: "数据分析" },
    children: [
      {
        path: "edu",
        name: "DataEdu",
        component: () => import("@/views/data/edu.vue"),
        meta: { title: "教务数据" },
      },
      {
        path: "energy",
        name: "DataEnergy",
        component: () => import("@/views/data/energy.vue"),
        meta: { title: "能耗数据" },
      },
      {
        path: "aircondition",
        name: "DataAircondition",
        component: () => import("@/views/data/aircondition.vue"),
        meta: { title: "中央空调数据" },
      },
    ],
  },

  {
    path: "/user",
    component: Layout,
    redirect: "/user/profile",
    name: "User",
    meta: { title: "账号中心" },
    children: [
      {
        path: "profile",
        name: "UserProfile",
        component: () => import("@/views/user/profile.vue"),
        meta: { title: "账号管理" },
      },
    ],
  },

  {
    path: "/log",
    component: Layout,
    redirect: "/log/operation",
    name: "Log",
    meta: { title: "日志查询" },
    children: [
      {
        path: "operation",
        name: "LogOperation",
        component: () => import("@/views/log/operation.vue"),
        meta: { title: "操作日志" },
      },
      {
        path: "alarm",
        name: "LogAlarm",
        component: () => import("@/views/log/alarm.vue"),
        meta: { title: "报警日志" },
      },
    ],
  },

  {
    path: "/book",
    component: Layout,
    redirect: "/book",
    name: "Book",
    meta: { title: "预约管理" },
    children: [
      {
        path: "",
        name: "BookIndex",
        component: () => import("@/views/book/index.vue"),
        meta: { title: "预约管理" },
      },
    ],
  },

  {
    path: "/asset",
    component: Layout,
    redirect: "/asset",
    name: "Asset",
    meta: { title: "资产管理" },
    children: [
      {
        path: "",
        name: "AssetIndex",
        component: () => import("@/views/asset/index.vue"),
        meta: { title: "资产管理" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// /* 路由守卫 生产环境生效 */
// if (import.meta.env.PROD) {
//   router.beforeEach((to, from, next) => {
//     const whiteList = ['/login', '/register']
//     const token = localStorage.getItem('token')
//     if (token || whiteList.includes(to.path)) return next()
//     next('/login')
//   })
// }

export default router;
