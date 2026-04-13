import service from "@/utils/request";

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

// 获取Socket网关列表
export function getSocketGatewayList() {
  return service({
    url: "/device/list/socket",
    method: "get",
  });
}

// 创建RS485网关
export function createRS485Gateway(data) {
  return service({
    url: "/gateway/create/rs485",
    method: "post",
    data,
  });
}

// 更新RS485网关
export function updateRS485Gateway(data) {
  return service({
    url: "/gateway/update/rs485",
    method: "put",
    data,
  });
}

// 创建Socket网关
export function createSocketGateway(data) {
  return service({
    url: "/gateway/create/socket",
    method: "post",
    data,
  });
}

// 删除设备
export function deleteDevice(deviceId) {
  return service({
    url: "/device/delete",
    method: "delete",
    data: { deviceId },
  });
}

// 删除RS485网关
export function deleteRS485Gateway(gatewayId) {
  return service({
    url: "/gateway/delete/rs485",
    method: "delete",
    data: { rs485GatewayId: gatewayId },
  });
}

// 删除Socket网关
export function deleteSocketGateway(gatewayId) {
  return service({
    url: "/gateway/delete/socket",
    method: "delete",
    data: { socketGatewayId: gatewayId },
  });
}

// 更新设备
export function updateDevice(data) {
  return service({
    url: "/device/update",
    method: "put",
    data,
  });
}

// 开启设备轮询
export function startDevicePolling(deviceId) {
  return service({
    url: "/device/polling/start",
    method: "post",
    params: { deviceId },
  });
}

// 获取实验室下的所有设备（单个实验室）
export function getDeviceListByLab(laboratoryId) {
  return service({
    url: "/device/list/all",
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: {
      laboratoryId,
    },
  });
}

// 批量获取多个实验室下的所有设备
export function getDeviceListByLabs(laboratoryIds) {
  return service({
    url: "/device/list/all/batch",
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: {
      laboratoryId: laboratoryIds,
    },
  });
}
