import service from "@/api/request";

/**
 * 获取空调运行时长分析数据
 * @param {Object} data - 请求参数
 * @param {string} data.startTime - 开始时间，格式：YYYY-MM-DD HH:mm
 * @param {string} data.endTime - 结束时间，格式：YYYY-MM-DD HH:mm
 * @param {number|null} data.buildingId - 楼栋ID，可选
 * @param {number|null} data.deptId - 部门ID，可选
 * @param {number[]} data.laboratoryIds - 实验室ID数组
 * @param {number[]} data.deviceIds - 设备ID数组，可选
 */
export function getAirConditionRunning(data) {
  return service({
    url: "/analysis/air-condition/running",
    method: "post",
    data: {
      startTime: "",
      endTime: "",
      buildingId: null,
      deptId: null,
      laboratoryIds: [],
      deviceIds: [],
      ...data,
    },
  });
}
