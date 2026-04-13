import service from "@/utils/request";

/* 教务数据分析 */
export function getEduAnalysisChart(params) {
  return service.post("/analysis/chart", { params });
}

/* 关于学期 */
//获取学期列表
export function getTerm() {
  return service.get("/academic/list/semester");
}

export function addTerm(data) {
  return service.post("/academic/create/semester", data);
}

export function deleteTerm(id) {
  return service.delete("/academic/delete/semester", {
    data: { semesterId: id }, // DELETE 请求体要用 data 包裹
  });
}

export function updataTerm(semesterId, data) {
  return service.put("/academic/edit/semester", {
    semesterId,
    ...data,
  });
}

/**
 * 获取实验室课表
 * @param {number[]} laboratoryIds - 实验室ID数组
 */
export function getCourseSchedule(laboratoryIds) {
  return service.post(
    "/academic/list/courseSchedule",
    {}, // 请求体（Body）为空
    {
      // 查询参数（Query Params）放在第三个参数的 params 里
      params: {
        laboratoryIds,
      },
      // 可选：确保数组参数正确序列化，避免后端解析问题
      paramsSerializer: (params) => {
        return new URLSearchParams(params).toString();
      },
    },
  );
}
/**
 * 获取课程列表
 */
export function getCourseList() {
  return service.get("/academic/list/course");
}

/**
 * 创建课程
 * @param {Object} data - 课程数据
 * @param {string} data.courseName - 课程名称
 * @param {number} data.volume - 课程容量
 * @param {string} data.grade - 年级
 */
export function createCourse(data) {
  return service.post("/academic/create/course", data);
}

/**
 * 获取教师列表
 */
export function getTeacherList() {
  return service.get("/academic/list/teacher");
}

/**
 * 创建教师
 * @param {Object} data - 教师数据
 * @param {string} data.teacherName - 教师姓名
 */
export function createTeacher(data) {
  return service.post("/academic/create/teacher", data);
}

/**
 * 创建课程安排（排课）
 * @param {Object} data - 排课数据
 * @param {number} data.semesterId - 学期id
 * @param {number} data.laboratoryId - 实验室id
 * @param {string} data.weekType - 上课周类型 Single/Double/Both
 * @param {number} data.startWeek - 开始周
 * @param {number} data.endWeek - 结束周
 * @param {string} data.startTime - 开始时间
 * @param {string} data.endTime - 结束时间
 * @param {number[]} data.weekdays - 上课周几 [1,3,5]
 * @param {number} data.courseId - 课程id
 * @param {number} data.teacherId - 教师id
 * @param {number} data.belongToDeptId - 所属部门id
 * @param {number} data.startSection - 起始节数
 * @param {number} data.endSection - 结束节数
 * @param {string} data.mark - 备注信息
 */
export function createCourseSchedule(data) {
  return service.post("/academic/create/courseSchedule", data);
}

/**
 * 编辑课程安排（修改weekdays等）
 * @param {Object} data - 排课数据
 * @param {number} data.courseScheduleId - 排课ID
 * @param {number[]} data.weekdays - 上课周几 [1,3,5]
 */
export function editCourseSchedule(data) {
  return service.put("/academic/edit/courseSchedule", data);
}

/**
 * 删除实验室下所有课程安排
 * @param {number} laboratoryId - 实验室ID
 */
export function deleteCourseScheduleByLaboratory(laboratoryId) {
  return service.delete("/academic/delete/courseScheduleByLaboratory", {
    params: { laboratoryId },
  });
}

/**
 * 删除课程安排
 * @param {number} courseScheduleId - 课程表ID
 */
export function deleteCourseSchedule(courseScheduleId) {
  return service.delete("/academic/delete/courseSchedule", {
    data: { courseScheduleId },
  });
}

/* 关于 */
