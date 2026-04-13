import service from "@/utils/request";

/* 操作日志分页查询 */
export function apiGetOperationLogs(params) {
  return service.get("/log/operation/page", { params });
}

/* 报警日志分页查询 */
export function apiGetAlarmLogs(params) {
  return service.get("/log/alarm/page", { params });
}
