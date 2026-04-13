import service from "@/utils/request";

// 获取概览设备统计
export function get_overview_device_statistics() {
  return service({
    url: "/overview/devices/statistics",
    method: "get",
  });
}

// 根据学期获取实验室概览信息
export function get_overview_laboratories(semesterId) {
  return service({
    url: "/overview/laboratories",
    method: "get",
    params: { semesterId },
  });
}

// 根据学期获取即将上课的实验室信息
export function get_overview_laboratories_soon(semesterId) {
  return service({
    url: "/overview/laboratories/soon",
    method: "get",
    params: { semesterId },
  });
}
