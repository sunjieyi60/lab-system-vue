/**
 * 菜单配置
 * 可根据用户权限动态过滤
 */
export const menuList = [
  {
    path: "/dashboard",
    title: "概览",
    icon: "/images/概览.png",
  },
  {
    path: "/base",
    title: "基础管理",
    icon: "/images/基础管理.png",
  },
  {
    path: "/edu/term",
    title: "教务管理",
    icon: "/images/教务管理.png",
  },
  {
    path: "/control/hvac",
    title: "控制中心",
    icon: "/images/控制中心.png",
  },
  {
    path: "/book",
    title: "预约管理",
    icon: "/images/预约中心.png",
  },
  {
    path: "/asset",
    title: "资产管理",
    icon: "/images/资产管理.png",
  },
  {
    path: "/data/edu",
    title: "数据分析",
    icon: "/images/数据分析.png",
  },
  {
    path: "/log",
    title: "日志查询",
    icon: "/images/日志查询.png",
  },
  {
    path: "/user/profile",
    title: "账号中心",
    icon: "/images/账号管理.png",
  },
];

/**
 * 根据权限过滤菜单
 * @param {string[]} permissions - 用户权限列表
 * @returns {Array} 过滤后的菜单
 */
export function filterMenuByPermission(permissions = []) {
  // 如果没有权限限制，返回全部
  if (!permissions || permissions.length === 0) {
    return menuList;
  }

  // 这里可以根据 path 或自定义 permission 字段过滤
  return menuList.filter((item) => {
    // 示例：检查用户是否有该菜单权限
    // return permissions.includes(item.permission);
    return true; // 暂时全部返回
  });
}

/**
 * 根据路径获取菜单标题
 * @param {string} path - 当前路径
 * @returns {string} 菜单标题
 */
export function getMenuTitleByPath(path) {
  const menu = menuList.find((item) => item.path === path);
  return menu?.title || "";
}
