//maps/baseMap.js
export function getBuildingNameById(buildingId, buildingArr = []) {
  if (!Array.isArray(buildingArr)) return "";
  //   console.log(buildingArr);
  const hit = buildingArr.find((b) => b.id === Number(buildingId));
  return hit?.buildingName ?? `楼栋编号${buildingId}`; // 兜底
}

export function getDeptNamesByIds(idList = [], depts = []) {
  if (!Array.isArray(idList) || !Array.isArray(depts)) return [];
  return idList
    .map((id) => {
      const item = depts.find((d) => d.dept?.id === Number(id));
      return item?.dept?.deptName ?? `部门编号${id}`;
    })
    .filter(Boolean); // 去掉可能的空串
}
