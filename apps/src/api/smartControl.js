import service from "@/utils/request";

// 获取定时任务列表
export function getQuartzList(params = {}) {
  return service({
    url: "/quartz/list",
    method: "get",
    params,
  });
}

// 根据实验室ID获取策略详情列表（分页）
export function getQuartzListByLab(params = {}) {
  return service({
    url: "/quartz/list-by-lab",
    method: "get",
    params,
  });
}

// 创建定时任务策略
export function createQuartz(data) {
  return service({
    url: "/quartz/create",
    method: "post",
    data,
  });
}

// 更新定时任务策略
export function updateQuartz(data) {
  return service({
    url: "/quartz/update",
    method: "put",
    data,
  });
}

// 删除定时任务
export function deleteQuartz(taskId) {
  return service({
    url: "/quartz/delete",
    method: "delete",
    params: { taskId },
  });
}

// 启用定时任务
export function enableQuartz(taskId) {
  return service({
    url: "/quartz/enable",
    method: "post",
    params: { taskId },
  });
}

// 禁用/取消定时任务
export function cancelQuartz(taskId) {
  return service({
    url: "/quartz/cancel",
    method: "post",
    params: { taskId },
  });
}

// 根据课表生成定时任务
export function generateFromCourseSchedule(data) {
  return service({
    url: "/quartz/generate-from-course-schedule",
    method: "post",
    data,
  });
}
