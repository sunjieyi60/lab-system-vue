# 实验室综合管理系统 (Lab Management System)

## 项目概述

本项目是一个基于 Vue 3 的实验室综合管理系统前端应用，用于管理实验室的日常运营，包括教务管理、设备控制、数据分析等功能模块。

项目中文名：实验室综合管理系统  
项目英文名：Lab Management System Web

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite 7.x
- **状态管理**: Pinia 3.x
- **UI 组件库**: Element Plus 2.x
- **路由**: Vue Router 4.x
- **HTTP 客户端**: Axios
- **CSS 预处理器**: Sass (SCSS)
- **日历组件**: FullCalendar 6.x
- **图表库**: ECharts 6.x
- **表格处理**: xlsx

## 项目结构

```
├── public/                     # 静态资源目录
│   ├── images/                 # 图片资源（菜单图标、Logo等）
│   └── vite.svg               # Vite 图标
├── src/
│   ├── api/                    # API 接口封装
│   │   ├── auth.js            # Token 存取
│   │   ├── request.js         # Axios 实例配置
│   │   ├── base.js            # 基础管理相关接口
│   │   ├── user.js            # 用户相关接口
│   │   ├── device.js          # 设备相关接口
│   │   ├── edu.js             # 教务管理相关接口
│   │   ├── analysis.js        # 数据分析相关接口
│   │   └── smartControl.js    # 智能控制相关接口
│   ├── components/             # 公共组件
│   │   ├── Layout.vue         # 页面布局组件
│   │   ├── slider.vue         # 左侧导航菜单
│   │   ├── AppHeader.vue      # 顶部应用标题栏
│   │   ├── Charts.vue         # 图表组件
│   │   ├── StatCard.vue       # 统计卡片
│   │   ├── CourseCalendar.vue # 课程日历
│   │   ├── LabDialog.vue      # 实验室对话框
│   │   ├── UserDialog.vue     # 用户对话框
│   │   ├── TermDialog.vue     # 学期对话框
│   │   ├── ImportScheduleDialog.vue # 导入课表对话框
│   │   ├── ManualScheduling.vue     # 手动排课组件
│   │   ├── AboutAccess/       # 门禁控制相关组件
│   │   ├── AboutControl/      # 设备控制相关组件
│   │   ├── AboutElectric/     # 电气监控相关组件
│   │   ├── AboutIntelligent/  # 智能控制相关组件
│   │   └── AboutLight/        # 灯光控制相关组件
│   ├── router/
│   │   └── index.js           # 路由配置
│   ├── stores/                 # Pinia 状态管理
│   │   ├── index.js           # Pinia 实例
│   │   ├── user.js            # 用户状态
│   │   ├── base.js            # 基础数据状态
│   │   ├── device.js          # 设备状态
│   │   ├── edu.js             # 教务状态
│   │   └── smartControl.js    # 智能控制状态
│   ├── views/                  # 页面视图
│   │   ├── dashboard.vue      # 概览/仪表盘
│   │   ├── base.vue           # 基础管理
│   │   ├── control-hvac.vue   # 中央空调监控
│   │   ├── data-edu.vue       # 教务数据
│   │   ├── edu-term.vue       # 学期设置
│   │   ├── aboutControl/      # 控制中心页面
│   │   ├── aboutData/         # 数据分析页面
│   │   ├── aboutEdu/          # 教务管理页面
│   │   └── aboutUser/         # 用户相关页面
│   ├── maps/
│   │   └── baseMap.js         # 基础数据映射
│   ├── main.js                 # 应用入口
│   ├── App.vue                 # 根组件
│   ├── style.css              # 全局样式
│   └── counter.js             # 示例文件
├── index.html                  # HTML 入口
├── vite.config.js             # Vite 配置
├── package.json               # 项目依赖
└── .gitignore                 # Git 忽略配置
```

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 路由结构

| 路径 | 组件 | 说明 |
|------|------|------|
| `/login` | login.vue | 登录页 |
| `/register` | register.vue | 注册页 |
| `/dashboard` | dashboard.vue | 概览/仪表盘 |
| `/base` | base.vue | 基础管理 |
| `/edu/term` | edu-term.vue | 学期设置 |
| `/edu/schedule` | edu-schedule.vue | 实验室排课 |
| `/edu/timetable` | edu-timetable.vue | 实验室课表 |
| `/control/hvac` | control-hvac.vue | 中央空调监控 |
| `/control/access` | access.vue | 门禁管理 |
| `/control/electric` | electric.vue | 电气监控 |
| `/control/light` | light.vue | 电灯开关监控 |
| `/control/env` | env.vue | 环境监控 |
| `/control/intelligent` | intelligent.vue | 智能控制 |
| `/data/edu` | data-edu.vue | 教务数据 |
| `/data/energy` | energy.vue | 能耗数据 |
| `/data/aircondition` | aircondition.vue | 中央空调数据 |
| `/user/profile` | profile.vue | 账号管理 |

## API 配置

### 基础配置 (`src/api/request.js`)

- 基础 URL: `/api`
- 超时时间: 10000ms
- 携带凭证: `withCredentials: true`

### 代理配置 (`vite.config.js`)

开发环境下，API 请求会代理到后端服务器：

```javascript
proxy: {
  "/api": {
    target: "http://10.230.80.109:8088",  // 校园网环境
    // target: "http://10.6.22.2:8088",    // 内网环境
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ""),
  },
}
```

**注意**: 根据实际网络环境修改代理目标地址。

## 状态管理

使用 Pinia 进行状态管理，主要 Store：

### User Store (`src/stores/user.js`)

- 用户信息管理（realName, phone, email, permissions等）
- 登录状态管理
- 可见用户树数据
- 本地存储同步

### 其他 Store

- `base.js`: 基础数据（单位、楼栋、实验室）
- `device.js`: 设备状态
- `edu.js`: 教务数据
- `smartControl.js`: 智能控制配置

## 开发规范

### 代码风格

- 使用 Composition API (`<script setup>`)
- 组件名使用 PascalCase
- 文件/目录名使用 kebab-case
- 使用 `@/` 别名引用 src 目录下的文件

### API 调用示例

```javascript
import { apiLogin, apiGetUserInfo } from "@/api/user";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

// 登录并获取用户信息
const loginRes = await apiLogin({ username, password });
const userRes = await apiGetUserInfo();
userStore.setLoginInfo(userRes.data.data);
```

### 样式规范

- 全局样式定义在 `src/style.css`
- Element Plus 组件样式覆盖在全局样式中统一处理
- 组件 scoped 样式用于局部样式
- 使用 `!important` 谨慎，仅用于覆盖 Element Plus 默认样式

### 对话框样式标准

全局定义了统一的对话框样式：
- 默认宽度: 480px
- 圆角: 8px
- 渐变背景

特殊对话框通过 CSS 类覆盖：
- `.add-strategy-dialog`: 660px 宽
- `.add-user-dialog`: 700px 宽

### 表格样式标准

全局统一的表格样式：
- 表头背景: `#226EE04D` (半透明蓝)
- 表头高度: 48px
- 行高: 56px
- 斑马纹背景: `#226ee00d`
- Hover 背景: `#f0f7ff`

## 认证机制

- Token 存储在 localStorage，键名为 `token`
- 用户信息存储在 localStorage，键名为 `userBasicInfo`
- 路由守卫已注释，生产环境可启用

## 注意事项

1. **网络环境**: 开发前确认后端服务地址并更新 `vite.config.js` 中的代理配置
2. **Token 管理**: 登录成功后自动获取用户信息并存储
3. **图片资源**: 菜单图标存储在 `public/images/` 目录
4. **路由守卫**: 当前未启用，生产环境建议启用登录验证

## 常见问题

### 登录失败
- 检查后端服务是否启动
- 检查代理配置是否正确
- 查看浏览器控制台网络请求

### 样式不生效
- 检查是否正确引入 Element Plus 样式
- 确认 scoped 样式正确使用 `:deep()` 穿透

## 扩展建议

1. 添加单元测试（Vitest/Jest）
2. 添加 ESLint/Prettier 代码规范
3. 添加 TypeScript 类型支持
4. 添加环境变量配置 (.env)
5. 添加 CI/CD 配置
