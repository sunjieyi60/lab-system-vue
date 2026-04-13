import service from "@/utils/request";

// 获取概览设备统计
export function get_overview_device_statistics() {
  return service({
    url: "/overview/devices/statistics",
    method: "get",
  });
}
