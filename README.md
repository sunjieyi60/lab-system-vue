# Lab System Vue

一个基于 Vue 3 的实验室综合管理系统前端项目，支持教务管理、设备控制、数据分析、预约管理等功能模块。

## 项目结构

这是一个 monorepo 项目，使用 npm workspaces 管理：

```
lab-system-vue/
├── apps/                   # 主应用 - 实验室管理系统 Web 端
│   ├── src/
│   │   ├── api/           # API 接口封装
│   │   ├── components/    # 公共组件
│   │   ├── router/        # 路由配置
│   │   ├── stores/        # Pinia 状态管理
│   │   └── views/         # 页面视图
│   └── package.json
├── packages/
│   ├── control-kit/       # 设备控制组件库 (Vue3 + TS + Vite)
│   ├── device-kit/        # 设备相关组件库 (Vue3 + TS + Vite)
│   └── quartz-kit/        # 定时任务表单组件库 (Vue3 + TS + Vite)
└── package.json
```

## 技术栈

- **框架**: [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`)
- **构建工具**: [Vite](https://vitejs.dev/)
- **UI 组件库**: [Element Plus](https://element-plus.org/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **路由**: [Vue Router 4](https://router.vuejs.org/)
- **图表**: [ECharts](https://echarts.apache.org/)
- **日历**: [FullCalendar](https://fullcalendar.io/)
- **HTTP 客户端**: [Axios](https://axios-http.com/)
- **表格解析**: [SheetJS (xlsx)](https://sheetjs.com/)

## 功能模块

| 模块 | 功能说明 |
|------|----------|
| **教务管理** | 学期设置、实验室排课、实验室课表查看 |
| **控制中心** | 中央空调、设备管理、门禁管理、电气监控、照明监控、环境监控、智控设备 |
| **数据分析** | 教务数据可视化、能耗数据分析、中央空调运行数据 |
| **预约管理** | 实验室预约审批与管理 |
| **资产管理** | 实验室资产登记与维护 |
| **日志查询** | 操作日志、报警日志查询 |
| **账号中心** | 个人信息与账号管理 |

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

#### 方式一：一键安装（Windows）

双击运行项目根目录下的 `start.bat`，选择菜单项 `[1] npm install` 或 `[4] One-click`。

#### 方式二：手动安装

```bash
# 安装主应用依赖
cd apps
npm install

# 安装各子包依赖
cd ../packages/control-kit && npm install
cd ../device-kit && npm install
cd ../quartz-kit && npm install
```

### 启动开发服务器

```bash
cd apps
npm run dev
```

开发服务器默认启动在 `http://localhost:5173/`，API 代理配置在 `apps/vite.config.js` 中。

### 构建生产环境

```bash
# 构建子包（按需）
cd packages/control-kit && npm run build
cd packages/device-kit && npm run build
cd packages/quartz-kit && npm run build

# 构建主应用
cd apps
npm run build
```

## 子包说明

### control-kit

设备控制组件库，提供统一的设备控制面板，支持空调、门禁、照明、断路器、传感器等设备的控制指令生成与下发。

### quartz-kit

定时任务表单组件库，支持基于 Quartz 的定时任务配置，包含任务主体、时间规则、数据源、条件配置（SpEL 表达式）、动作配置、报警配置等模块。

### device-kit

设备通用组件库，提供设备管理相关的通用 UI 组件。

## 开发规范

- 主应用使用 JavaScript，组件库使用 TypeScript
- 组件库统一使用 Vue 3 `<script setup>` 语法
- 路由采用懒加载方式导入页面组件
- API 接口按模块拆分到 `apps/src/api/` 目录下

## 许可证

[MIT](LICENSE)

Copyright (c) 2026 lab-system-vue
