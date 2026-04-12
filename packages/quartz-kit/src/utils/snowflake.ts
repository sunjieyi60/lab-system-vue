/**
 * 雪花ID生成器
 * 生成19位数字字符串格式的唯一ID
 * 
 * 结构：
 * - 1位符号位（始终为0）
 * - 41位时间戳（毫秒级）
 * - 10位机器ID
 * - 12位序列号
 */

let lastTimestamp = -1;
let sequence = 0;
const machineId = Math.floor(Math.random() * 1023); // 随机机器ID 0-1023
const sequenceMask = 4095; // 12位序列号掩码

/**
 * 获取当前时间戳（毫秒）
 */
function getTimestamp(): number {
  return Date.now();
}

/**
 * 等待下一毫秒
 */
function waitNextMillis(lastTs: number): number {
  let timestamp = getTimestamp();
  while (timestamp <= lastTs) {
    timestamp = getTimestamp();
  }
  return timestamp;
}

/**
 * 生成雪花ID
 * @returns 19位数字字符串
 */
export function generateSnowflakeId(): string {
  let timestamp = getTimestamp();

  if (timestamp < lastTimestamp) {
    throw new Error('Clock moved backwards. Refusing to generate id.');
  }

  if (timestamp === lastTimestamp) {
    // 同一毫秒内，序列号递增
    sequence = (sequence + 1) & sequenceMask;
    if (sequence === 0) {
      // 序列号溢出，等待下一毫秒
      timestamp = waitNextMillis(lastTimestamp);
    }
  } else {
    // 不同毫秒，序列号重置
    sequence = 0;
  }

  lastTimestamp = timestamp;

  // 组合ID各部分
  // 时间戳左移22位（10位机器ID + 12位序列号）
  // 机器ID左移12位
  const id = ((BigInt(timestamp) << BigInt(22)) |
    (BigInt(machineId) << BigInt(12)) |
    BigInt(sequence)).toString();

  return id;
}

/**
 * 批量生成雪花ID
 * @param count 数量
 * @returns ID数组
 */
export function generateSnowflakeIds(count: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(generateSnowflakeId());
  }
  return ids;
}

/**
 * 验证是否为有效的雪花ID
 * @param id 待验证的ID
 */
export function isValidSnowflakeId(id: string): boolean {
  return /^\d{19}$/.test(id);
}

/**
 * 从雪花ID中提取时间戳
 * @param snowflakeId 雪花ID
 */
export function extractTimestampFromId(snowflakeId: string): number {
  if (!isValidSnowflakeId(snowflakeId)) {
    throw new Error('Invalid snowflake ID');
  }
  const id = BigInt(snowflakeId);
  // 右移22位获取时间戳
  return Number(id >> BigInt(22));
}

/**
 * 生成一个新的任务配置根对象（新建模式使用）
 * @param laboratoryId 实验室ID
 */
export function createEmptyScheduleConfig(laboratoryId: number): import('../types/quartz').ScheduleConfigRoot {
  const taskId = generateSnowflakeId();
  const timeRuleId = generateSnowflakeId();
  
  const now = new Date();
  const endDate = new Date();
  endDate.setFullYear(now.getFullYear() + 1);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return {
    task: {
      id: taskId,
      taskName: '',
      cron: '0 0 * * * ?',
      enable: true,
      startDate: formatDate(now),
      endDate: formatDate(endDate),
      laboratoryId,
    },
    timeRule: {
      id: timeRuleId,
      scheduleTaskId: taskId,
      semesterId: 0,
      weekdays: [1, 2, 3, 4, 5],
      startWeek: 1,
      endWeek: 16,
      weekType: 'ALL' as import('../types/quartz').WeekType,
      startTime: '08:00:00',
      endTime: '18:00:00',
    },
    dataGroup: [],
    conditionGroups: [],
    actionGroups: [],
    alarmGroup: [],
    watchDog: {
      watchEnabled: false,
      watchIntervalSec: 30,
      watchTimeoutSec: 300,
      stopOnFirstSuccess: true,
    },
  };
}
