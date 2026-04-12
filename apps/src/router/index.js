import { createRouter, createWebHistory } from "vue-router";
import Layout from "@/components/Layout.vue";

const routes = [
  { path: "/login", component: () => import("@/views/aboutUser/login.vue") },
  {
    path: "/register",
    component: () => import("@/views/aboutUser/register.vue"),
  },

  {
    path: "/",
    component: Layout,
    redirect: "/dashboard",
    name: "Root",
    children: [
      { path: "dashboard", component: () => import("@/views/dashboard.vue") },
      { path: "base", component: () => import("@/views/base.vue") },
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
        component: () => import("@/views/edu-term.vue"),
        meta: { title: "学期设置" },
      },
      {
        path: "schedule",
        name: "EduSchedule",
        component: () => import("@/views/aboutEdu/edu-schedule.vue"),
        meta: { title: "实验室排课" },
      },
      {
        path: "timetable",
        name: "EduTimetable",
        component: () => import("@/views/aboutEdu/edu-timetable.vue"),
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
        component: () => import("@/views/control-hvac.vue"),
        meta: { title: "中央空调监控" },
      },
      {
        path: "access",
        name: "Access",
        component: () => import("@/views/aboutControl/access.vue"),
        meta: { title: "门禁管理" },
      },
      {
        path: "electric",
        name: "Electric",
        component: () => import("@/views/aboutControl/electric.vue"),
        meta: { title: "电气监控" },
      },
      {
        path: "light",
        name: "Light",
        component: () => import("@/views/aboutControl/light.vue"),
        meta: { title: "电灯开关监控" },
      },
      {
        path: "env",
        name: "Env",
        component: () => import("@/views/aboutControl/env.vue"),
        meta: { title: "环境监控" },
      },
      {
        path: "intelligent",
        name: "Intelligent",
        component: () => import("@/views/aboutControl/intelligent.vue"),
        meta: { title: "智能控制" },
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
        component: () => import("@/views/data-edu.vue"),
        meta: { title: "教务数据" },
      },
      {
        path: "energy",
        name: "DataEnergy",
        component: () => import("@/views/aboutData/energy.vue"),
        meta: { title: "能耗数据" },
      },
      {
        path: "aircondition",
        name: "DataAircondition",
        component: () => import("@/views/aboutData/aircondition.vue"),
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
        component: () => import("@/views/aboutUser/profile.vue"),
        meta: { title: "账号管理" },
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
