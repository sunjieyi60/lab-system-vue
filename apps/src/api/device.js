import service from "@/api/request";

// 获取设备列表
export function getDeviceList(data) {
  return service({
    url: "/device/list/device",
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: {
      laboratoryIds: [], // 实验室ID数组
      deviceType: "", // 设备类型，如 CircuitBreak
      ...data,
    },
  });
}
// 获取空调设备列表
export function getAirConditionList(data) {
  return service({
    url: "/device/list/device",
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: {
      laboratoryIds: [],
      deviceType: "AirCondition",
      ...data,
    },
  });
}

//控制设备
export function controlDevice(data) {
  return service({
    url: "/device/control",
    method: "post",
    data: {
      priority: "0",
      ...data,
    },
  });
}

// 创建设备
export function createDevice(data) {
  return service({
    url: "/device/create",
    method: "post",
    data,
  });
}

// 获取RS485网关列表
export function getRS485GatewayList() {
  return service({
    url: "/device/list/rs485",
    method: "get",
  });
}
