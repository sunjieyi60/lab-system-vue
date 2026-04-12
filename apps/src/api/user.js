import service from "./request";
/* 注册 */
export function apiRegister(data) {
  return service.post("/user/register", {
    username: "",
    password: "",
    workplace_id: 0,
    phone: "",
    email: "",
    create_by: 0,
    ...data, //函数内用展开运算符 ...data 覆盖默认值
  });
}

/* 登录 */
export function apiLogin({ username, password }) {
  return service.post("/user/login", { username, password });
}

/* 获取当前用户信息（带 token） */
export function apiGetUserInfo() {
  return service.get("/user/getCurrentUserDetail");
}

/* 获取可见用户树 */
export function apiGetVisibleTree() {
  return service.get("/user/getVisibleTree");
}

/* 创建用户 */
export function apiCreateUser(data) {
  return service.post("/user/create", data);
}

/* 删除用户 */
export function apiDeleteUser(userId) {
  return service.delete("/user/delete", { data: { userId } });
}
