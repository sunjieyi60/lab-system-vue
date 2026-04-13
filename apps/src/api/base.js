// base.js
import service from "@/utils/request";

//新增单位
export function addWorkplace(data) {
  return service({
    url: "/dept/create",
    method: "post",
    data: {
      deptName: "", //单位名称
      ...data,
    },
  });
}

//新增楼栋
export function addBuilding(data) {
  return service({
    url: "/building/create",
    method: "post",
    data: {
      buildingName: "", //楼栋名称
      deptIds: [], //楼栋所属部门ID数组
      ...data,
    },
  });
}
//新增实验室
export function addLaboratory(data) {
  return service({
    url: "/laboratory/create",
    method: "post",
    data: {
      laboratoryId: "",
      laboratoryName: "",
      belongToBuilding: null,
      area: null,
      classCapacity: null,
      securityLevel: "",
      belongToDeptIds: [],
      intro: "",
      username: "",
      phone: "",
      ...data,
    },
  });
}

//删除实验室
export function deleteLaboratory(data) {
  return service({
    url: "/laboratory/delete",
    method: "delete",
    data: {
      ...data,
    },
  });
}

//删除单位
export function deleteWorkplace(data) {
  return service({
    url: "/dept/delete",
    method: "delete",
    data: {
      ...data,
    },
  });
}

//删除楼栋
export function deleteBuilding(data) {
  return service({
    url: "/building/delete",
    method: "delete",
    data: {
      ...data,
    },
  });
}

//获取实验室信息列表
export function getLaboratoryInfo() {
  return service({
    url: "/academic/list/laboratories",
    method: "get",
  });
}
export function editLaboratory(data) {
  return service({
    url: "/laboratory/edit",
    method: "put",
    data: {
      ...data,
    },
  });
}
