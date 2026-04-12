import axios from "axios";
// 带统一基地址、超时、拦截器的axios实例——service
const service = axios.create({
  baseURL: "/api",
  // baseURL: "http:/10.230.80.109:8088/api",
  timeout: 10000,
  withCredentials: true,
});

// service.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
export default service;
