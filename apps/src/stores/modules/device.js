// src/stores/device.js
import { defineStore } from "pinia";
import { getDeviceList, getRS485GatewayList, getDeviceListByLab, getDeviceListByLabs } from "@/api/device";
import { ElMessage } from "element-plus";

// 设备类型常量
export const DeviceType = {
  AIR_CONDITION: "AirCondition",
  CIRCUIT_BREAK: "CircuitBreak",
  LIGHT: "Light",
  SENSOR: "Sensor",
  ACCESS: "Access",
};

// 设备类型中文映射
export const DeviceTypeName = {
  [DeviceType.AIR_CONDITION]: "空调",
  [DeviceType.CIRCUIT_BREAK]: "断路器",
  [DeviceType.LIGHT]: "照明",
  [DeviceType.SENSOR]: "传感器",
  [DeviceType.ACCESS]: "门禁",
};

export const useDeviceStore = defineStore("device", {
  state: () => ({
    // 统一存储所有设备，key: deviceId, value: 设备详情数组
    deviceMap: {},
    // 当前筛选的设备类型，空字符串表示全部
    currentDeviceType: "",
    // 搜索关键字
    keyword: "",
    // 加载状态
    loading: false,
    // RS485网关列表，key: laboratoryId, value: 网关数组
    rs485GatewayMap: {},
    // RS485网关加载状态
    rs485GatewayLoading: false,
  }),

  getters: {
    // 获取所有设备列表（扁平化，不分类型）
    getAllDevices: (s) => {
      const list = [];
      Object.values(s.deviceMap).forEach((arr) => {
        list.push(...arr);
      });
      return list;
    },

    // 根据类型获取设备
    getDevicesByType: (s) => (type) => {
      const list = [];
      Object.values(s.deviceMap).forEach((arr) => {
        arr.forEach((item) => {
          if (!type || item.device?.deviceType === type) {
            list.push(item);
          }
        });
      });
      return list;
    },

    // 获取当前类型的设备（用于表格展示）
    getCurrentDevices: (s) => {
      const list = [];
      Object.values(s.deviceMap).forEach((arr) => {
        arr.forEach((item) => {
          if (
            !s.currentDeviceType ||
            item.device?.deviceType === s.currentDeviceType
          ) {
            list.push(item);
          }
        });
      });
      return list;
    },

    // 获取空调表格数据
    getAirConditionTableData: (s) => {
      const list = [];
      Object.values(s.deviceMap).forEach((arr) => {
        arr.forEach((item) => {
          if (item.device?.deviceType !== DeviceType.AIR_CONDITION) return;

          const device = item.device || {};
          const record = item.deviceRecord.data || {};

          list.push({
            id: device.id,
            deviceId: item.deviceId,
            deviceType: device.deviceType,
            labId: device.belongToLaboratoryId,
            airCond: device.deviceName,
            airCondSelfId: device.selfId,
            isOpen: record.isOpen,
            mode: record.mode || "-",
            temp: record.temperature ?? "-",
            windSpeed: record.speed !== undefined ? record.speed : "-",
            roomTemp: record.roomTemperature ?? "-",
            fault: record.errorCode ? `故障码:${record.errorCode}` : "无",
            intelligent: device.pollingEnabled ? "启用" : "禁用",
            alarm: "无",
            unit: device.groupId || "-",
            online: record.origin === "Redis",
            isLock: device.isLock,
            rawDevice: device,
            rawRecord: record,
            //控制用的参数
            address: record.address,
            selfId: record.selfId,
          });
        });
      });
      return list;
    },
    // 根据实验室ID筛选空调数据
    getAirConditionByLabId: (s) => (labId) => {
      const allData = s.getAirConditionTableData;
      if (!labId || labId === "all") return allData;
      return allData.filter((item) => item.labId === labId);
    },
    // 获取断路器表格数据
    getCircuitBreakTableData: (s) => {
      const list = [];
      Object.values(s.deviceMap).forEach((arr) => {
        arr.forEach((item) => {
          if (item.device?.deviceType !== DeviceType.CIRCUIT_BREAK) return;

          const device = item.device || {};
          const record = item.deviceRecord?.data || {};

          list.push({
            id: device.id,
            deviceId: item.deviceId,
            deviceType: device.deviceType,
            labId: device.belongToLaboratoryId,
            lab: device.belongToLaboratoryId,
            deviceName: device.deviceName,
            address: device.address,
            isOpen: record.isOpen,
            isFix: record.isFix,
            isLock: record.isLock,
            voltage: record.voltage ?? "-",
            current: record.current ?? "-",
            power: record.power ?? "-",
            energy: record.energy ?? "-",
            leakage: record.leakage ?? "-",
            temperature: record.temperature ?? "-",
            online: record.origin === "Redis",
            rawDevice: device,
            rawRecord: record,
            //控制需要的
            address: record.address,
          });
        });
      });
      return list;
    },

    // 获取照明表格数据
    getLightTableData: (s) => {
      const list = [];
      Object.values(s.deviceMap).forEach((arr) => {
        arr.forEach((item) => {
          if (item.device?.deviceType !== DeviceType.LIGHT) return;

          const device = item.device || {};
          const record = item.deviceRecord?.data || {};

          list.push({
            id: device.id,
            deviceId: item.deviceId,
            deviceType: device.deviceType,
            labId: device.belongToLaboratoryId,
            lab: device.belongToLaboratoryId,
            deviceName: device.deviceName,
            selfId: device.selfId,
            isOpen: record.isOpen,
            isLock: record.isLock,
            online: record.origin === "Redis",
            rawDevice: device,
            rawRecord: record,
            //用于控制的
            address: record.address,
            selfId: record.selfId,
          });
        });
      });
      return list;
    },

    // 获取传感器表格数据
    getSensorTableData: (s) => {
      const list = [];
      Object.values(s.deviceMap).forEach((arr) => {
        arr.forEach((item) => {
          if (item.device?.deviceType !== DeviceType.SENSOR) return;

          const device = item.device || {};
          const record = item.deviceRecord?.data || {};

          list.push({
            id: device.id,
            deviceId: item.deviceId,
            deviceType: device.deviceType,
            labId: device.belongToLaboratoryId,
            lab: device.belongToLaboratoryId,
            deviceName: device.deviceName,
            selfId: device.selfId,
            temperature: record.temperature ?? "-",
            humidity: record.humidity ?? "-",
            light: record.light ?? "-",
            smoke: record.smoke ?? "-",
            online: record.origin === "Redis",
            rawDevice: device,
            rawRecord: record,
          });
        });
      });
      return list;
    },

    // 获取门禁表格数据
    getAccessTableData: (s) => {
      const list = [];
      Object.values(s.deviceMap).forEach((arr) => {
        arr.forEach((item) => {
          if (item.device?.deviceType !== DeviceType.ACCESS) return;

          const device = item.device || {};
          const record = item.deviceRecord?.data || {};

          // 门锁状态：3长关 2短开 1长开
          const lockStatusMap = { 1: "长开", 2: "短开", 3: "长关" };

          list.push({
            id: device.id,
            deviceId: item.deviceId,
            deviceType: device.deviceType,
            labId: device.belongToLaboratoryId,
            lab: device.belongToLaboratoryId,
            deviceName: device.deviceName,
            selfId: device.selfId,
            isOpen: record.isOpen,
            lockStatus: record.lockStatus,
            isLock: record.isLock,
            delayTime: record.delayTime,
            online: record.origin === "Redis",
            rawDevice: device,
            rawRecord: record,
            //控制用的参数
            address: record.address,
            selfId: record.selfId,
          });
        });
      });
      return list;
    },

    // 根据当前类型获取对应的表格数据
    getTableDataByCurrentType: (s) => {
      switch (s.currentDeviceType) {
        case DeviceType.AIR_CONDITION:
          return s.getAirConditionTableData;
        case DeviceType.CIRCUIT_BREAK:
          return s.getCircuitBreakTableData;
        case DeviceType.LIGHT:
          return s.getLightTableData;
        case DeviceType.SENSOR:
          return s.getSensorTableData;
        case DeviceType.ACCESS:
          return s.getAccessTableData;
        default:
          // 如果未指定类型，返回所有设备的通用信息
          return s.getAllDevices.map((item) => ({
            id: item.device?.id,
            deviceId: item.deviceId,
            deviceType: item.device?.deviceType,
            deviceTypeName: DeviceTypeName[item.device?.deviceType] || "未知",
            deviceName: item.device?.deviceName,
            labId: item.device?.belongToLaboratoryId,
            online: item.deviceRecord?.data?.origin === "Redis",
          }));
      }
    },

    // 搜索过滤后的数据
    getFilteredTableData: (s) => {
      const data = s.getTableDataByCurrentType;
      const k = s.keyword.trim().toLowerCase();
      if (!k) return data;

      return data.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(k),
        ),
      );
    },

    // 统计各类型设备数量
    getDeviceTypeCount: (s) => {
      const count = {};
      Object.values(DeviceType).forEach((type) => {
        count[type] = 0;
      });

      Object.values(s.deviceMap).forEach((arr) => {
        arr.forEach((item) => {
          const type = item.device?.deviceType;
          if (type && count[type] !== undefined) {
            count[type]++;
          }
        });
      });

      return count;
    },

    // 获取所有RS485网关列表（扁平化）
    getAllRS485Gateways: (s) => {
      const list = [];
      Object.values(s.rs485GatewayMap).forEach((arr) => {
        list.push(...arr);
      });
      return list;
    },

    // 根据实验室ID获取RS485网关列表
    getRS485GatewaysByLabId: (s) => (labId) => {
      if (!labId) return [];
      return s.rs485GatewayMap[labId] || [];
    },

    // 获取RS485网关下拉选项（用于表单选择）
    // 返回格式: [{ label: 'RS485-1 (ID: 300)', value: 300, labId: 200 }, ...]
    getRS485GatewayOptions: (s) => {
      const options = [];
      Object.values(s.rs485GatewayMap).forEach((arr) => {
        arr.forEach((gateway) => {
          options.push({
            label: `${gateway.gatewayName} (ID: ${gateway.gatewayId})`,
            value: gateway.gatewayId,
            labId: gateway.laboratoryId,
            gatewayName: gateway.gatewayName,
            acceptTopic: gateway.acceptTopic,
            sendTopic: gateway.sendTopic,
          });
        });
      });
      return options;
    },

    // 根据实验室ID获取RS485网关下拉选项
    getRS485GatewayOptionsByLabId: (s) => (labId) => {
      if (!labId) return [];
      const gateways = s.rs485GatewayMap[labId] || [];
      return gateways.map((gateway) => ({
        label: `${gateway.gatewayName} (ID: ${gateway.gatewayId})`,
        value: gateway.gatewayId,
        labId: gateway.laboratoryId,
        gatewayName: gateway.gatewayName,
        acceptTopic: gateway.acceptTopic,
        sendTopic: gateway.sendTopic,
      }));
    },
  },

  actions: {
    /* ---- 统一获取设备列表 ---- */
    async fetchDevices(params = {}) {
      this.loading = true;
      try {
        const res = await getDeviceList(params);
        // 合并数据而不是覆盖，支持分批加载不同类型
        const newData = res.data.data || {};
        this.deviceMap = { ...this.deviceMap, ...newData };
        return newData;
      } catch (error) {
        ElMessage.error("获取设备列表失败");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /* ---- 获取特定类型设备 ---- */
    async fetchDevicesByType(deviceType, laboratoryIds = []) {
      return await this.fetchDevices({
        deviceType,
        laboratoryIds,
      });
    },

    /* ---- 获取所有类型设备 ---- */
    async fetchAllDeviceTypes(laboratoryIds = []) {
      const types = Object.values(DeviceType);
      const results = {};

      for (const type of types) {
        results[type] = await this.fetchDevicesByType(type, laboratoryIds);
      }

      return results;
    },

    /* ---- 设置当前设备类型 ---- */
    setDeviceType(type) {
      this.currentDeviceType = type;
    },

    /* ---- 搜索 ---- */
    search(keyword) {
      this.keyword = keyword;
    },

    /* ---- 根据ID获取设备详情 ---- */
    getDeviceById(deviceId) {
      return this.deviceMap[deviceId] || [];
    },

    /* ---- 清空数据 ---- */
    clear() {
      this.deviceMap = {};
      this.currentDeviceType = "";
      this.keyword = "";
    },

    /* ---- 清空特定类型 ---- */
    clearByType(deviceType) {
      Object.keys(this.deviceMap).forEach((key) => {
        const arr = this.deviceMap[key];
        if (arr.some((item) => item.device?.deviceType === deviceType)) {
          delete this.deviceMap[key];
        }
      });
    },

    /* ---- 获取RS485网关列表 ---- */
    async fetchRS485Gateways() {
      this.rs485GatewayLoading = true;
      try {
        const res = await getRS485GatewayList();
        this.rs485GatewayMap = res.data.data || {};
        return this.rs485GatewayMap;
      } catch (error) {
        ElMessage.error("获取RS485网关列表失败");
        throw error;
      } finally {
        this.rs485GatewayLoading = false;
      }
    },

    /* ---- 清空RS485网关数据 ---- */
    clearRS485Gateways() {
      this.rs485GatewayMap = {};
    },

    /* ---- 获取实验室下的所有设备（新接口 /device/list/all）---- */
    async fetchDevicesByLabId(laboratoryId) {
      this.loading = true;
      try {
        const res = await getDeviceListByLab(laboratoryId);
        const deviceList = res.data.data || [];
        return deviceList.map(item => ({
          id: item.id,
          name: item.deviceName,
          type: item.deviceType,
          address: item.address,
          selfId: item.selfId,
          labId: item.belongToLaboratoryId,
          rs485GatewayId: item.rs485GatewayId,
          isLock: item.isLock,
        }));
      } catch (error) {
        ElMessage.error("获取实验室设备列表失败");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /* ---- 批量获取多个实验室下的所有设备（新接口 /device/list/all/batch）---- */
    async fetchDevicesByLabIds(laboratoryIds) {
      this.loading = true;
      try {
        const res = await getDeviceListByLabs(laboratoryIds);
        const deviceList = res.data.data || [];
        
        // 转换为 deviceMap 格式，按实验室ID分组
        const newDeviceMap = {};
        deviceList.forEach(item => {
          const labId = item.belongToLaboratoryId;
          if (!newDeviceMap[labId]) {
            newDeviceMap[labId] = [];
          }
          newDeviceMap[labId].push({
            device: item,
            deviceRecord: { data: {}, deviceType: item.deviceType },
            deviceId: item.id,
          });
        });
        
        // 合并到现有数据
        this.deviceMap = { ...this.deviceMap, ...newDeviceMap };
        return deviceList;
      } catch (error) {
        ElMessage.error("获取设备列表失败");
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
