# 新院电料（hardware-store）

一个面向五金 / 水电材料门店的**本地数据管理 App**（Expo + React Native）。用于管理商品信息、快速结账生成订单，并按日期统计当日营收与订单明细。所有数据均存储在设备本地 SQLite 数据库中，无需联网。

## ✨ 功能特性

- **商品管理**：添加商品（名称、价格、存放位置）、浏览全部商品、按名称或位置关键词搜索、删除商品。
- **购物车结算**：在商品列表一键加购，购物车中调整数量、清空，确认后生成订单并自动更新当日统计。
- **销售统计**：查看指定日期（默认今天）的**总收入**与**订单数**；订单按上午 / 下午 / 晚上分时段展示，可展开查看商品明细；支持前后翻页切换日期，或直接输入 `YYYY-MM-DD` 跳转；长按订单可删除。
- **数据导入 / 导出**：
  - 导入：从 **URL**、**剪贴板**、**本地 JSON 文件**三种方式批量导入商品（按名称自动去重，空名称自动跳过）。
  - 导出：导出为 **data URL**（可复制 / 分享）或**文件**（调用系统分享面板保存）。
  - 支持 `data:` 前缀、base64 编码、UTF-8 BOM 等多种格式容错。
- **数据安全**：支持一键清空全部商品与订单（需二次确认），内置文件读写权限自测工具。

## 🛠 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | [Expo](https://expo.dev) SDK 54 · React Native 0.81.5 · React 19.1.0 |
| 语言 | TypeScript ~5.9 |
| 本地数据库 | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)（同步 / 异步 API） |
| 状态管理 | [Zustand](https://github.com/pmndrs/zustand) |
| 导航 | [React Navigation](https://reactnavigation.org)（Bottom Tabs） |
| UI | React Native Paper · 自定义组件 |
| 文件能力 | expo-file-system · expo-sharing · expo-clipboard · expo-document-picker |
| 提示 | react-native-toast-message |
| 持续集成 | EAS Build + GitHub Actions（自动构建 Android APK） |

## 🚀 快速开始

环境要求：Node.js 18+、npm，以及 [Expo CLI](https://docs.expo.dev/get-started/installation/)。

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务（配合 Expo Go 扫码运行，或按 a 打开 Android 模拟器）
npm start

# 或直接运行到平台
npm run android
npm run ios
npm run web
```

> 项目使用国内 npm 镜像（`registry.npmmirror.com`）安装依赖，见 `package-lock.json`。

## 📁 项目结构

```
├── App.tsx                      # 应用入口：主题 + 导航 + Toast
├── index.ts                     # Expo 注册入口
├── app.json                     # Expo 应用配置（名称、图标、插件、EAS projectId）
├── eas.json                     # EAS Build 构建配置
├── setup-github.bat             # 一键初始化 Git 仓库并推送到 GitHub 的脚本
└── src/
    ├── components/              # 通用组件
    │   ├── EmptyState.tsx       #   空状态占位
    │   ├── Loading.tsx          #   加载指示器
    │   ├── ProductCard.tsx      #   商品卡片（加购 / 删除）
    │   └── PermissionTest.tsx   #   文件权限自测（独立工具组件）
    ├── database/                # 本地 SQLite 数据层
    │   ├── init.ts              #   数据库初始化与建表
    │   └── queries.ts           #   所有 SQL 查询（商品 / 订单 / 统计）
    ├── navigation/
    │   └── AppNavigator.tsx     # 底部 Tab 导航（商品 / 添加 / 统计 / 设置 / 购物车）
    ├── screens/                 # 页面
    │   ├── ProductScreen.tsx    #   商品列表 + 搜索 + 删除
    │   ├── AddProductScreen.tsx #   添加商品表单
    │   ├── CartScreen.tsx       #   购物车 + 结算生成订单
    │   ├── StatsScreen.tsx      #   按日统计 + 订单明细 + 删除订单
    │   └── SettingsScreen.tsx   #   数据管理（导入 / 导出 / 清空）
    ├── store/                   # Zustand 状态
    │   ├── cartStore.ts         #   购物车（加购 / 数量 / 清空 / 合计）
    │   └── productStore.ts      #   商品（加载 / 搜索 / 增删）
    ├── types/
    │   └── index.ts             # Product / CartItem 类型定义
    └── utils/
        ├── eventBus.ts          # 轻量事件总线（页面间刷新通知）
        └── toast.ts             # Toast 封装
```

## 🗄 数据模型

SQLite 数据库文件：`hardware.db`（应用沙盒内），包含两张表：

**products（商品）**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INTEGER | 主键，自增 |
| name | TEXT | 商品名称 |
| price | REAL | 单价（元） |
| location | TEXT | 存放位置 |
| createdAt | TEXT | 创建时间（本地时间 ISO 字符串） |

**orders（订单）**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INTEGER | 主键，自增 |
| items | TEXT | 商品明细的 JSON 字符串数组 |
| totalAmount | REAL | 订单总金额（元） |
| createdAt | TEXT | 下单时间（本地时间 ISO 字符串） |

> 说明：`createdAt` 统一保存为**本地时区**的 ISO 字符串（通过 `new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString()` 生成），避免时区偏移导致的日期统计错乱。

## 🔄 页面间通信

项目通过自研的轻量事件总线 `src/utils/eventBus.ts` 实现跨页面刷新：

- 添加 / 删除商品 → `emit('productsUpdated')` → 商品页重新加载
- 结算下单 / 删除订单 / 数据导入 → `emit('ordersUpdated')` → 统计页刷新

## 📦 构建与部署

项目已配置 **EAS Build** 与 **GitHub Actions** 自动构建：

- `eas.json` 定义了三个构建档位：`development`（开发客户端）、`preview`（Android APK）、`production`（Android AAB）。
- `.github/workflows/eas-build.yml`：推送到 `main` 分支或手动触发时，自动执行 `eas build -p android --profile preview`，构建完成后从 EAS 下载 APK，并自动创建 GitHub Release 附带 APK（tag 格式为 `v<版本号>-build.<构建编号>`，如 `v1.10.0-build.35`），同时上传构建产物（Artifact 保留 7 天）。

手动构建：

```bash
# 需要登录 expo 账号（npx eas login），并配置 EXPO_TOKEN
npx eas build -p android --profile preview
```

一键上传 GitHub：

```bash
# 双击运行或执行，自动 git init / commit / push，并提示配置 EAS
setup-github.bat
```

## ⚙️ 应用配置

- 应用名称：**新院东电料**（`app.json`）
- 主题色：`#007AFF`（主色）、`#4CAF50`（成功 / 加购）
- Android 包名：`com.anonymous.hardwarestore`
- 支持竖屏、浅色模式、New Architecture

## 📄 许可证

私有项目（`private: true`），未开源。
