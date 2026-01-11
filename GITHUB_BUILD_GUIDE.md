# GitHub Actions EAS Build 指南

## 概述
通过GitHub Actions在国外服务器上执行EAS构建，避开国内网络限制。

## 设置步骤

### 1. 创建GitHub仓库
1. 在GitHub上创建新仓库
2. 将本地代码推送到GitHub：
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2. 获取Expo Token
1. 登录Expo账户：https://expo.dev/
2. 访问账户设置：https://expo.dev/settings/access-tokens
3. 点击"Create new token"
4. 复制生成的token

### 3. 设置GitHub Secrets
1. 进入GitHub仓库页面
2. 点击"Settings" → "Secrets and variables" → "Actions"
3. 点击"New repository secret"
4. Name: `EXPO_TOKEN`
5. Value: 粘贴刚才复制的Expo token
6. 点击"Add secret"

### 4. 触发构建
#### 方法1：手动触发
1. 进入GitHub仓库的"Actions"标签页
2. 选择"EAS Build"工作流
3. 点击"Run workflow"
4. 选择分支（main）
5. 点击"Run workflow"

#### 方法2：自动触发
推送代码到main分支会自动触发构建：
```bash
git add .
git commit -m "Trigger build"
git push origin main
```

### 5. 下载APK
1. 构建完成后，进入GitHub仓库的"Actions"标签页
2. 点击最新的构建运行
3. 在"Artifacts"部分下载生成的APK文件

## 构建状态查看
- GitHub Actions运行状态：仓库的Actions标签页
- EAS构建详情：https://expo.dev/accounts/[username]/builds

## 注意事项
- GitHub Actions免费额度：2000分钟/月（公共仓库无限制）
- 构建时间：通常5-15分钟
- APK文件会在Artifacts中保存7天

## 故障排除
如果构建失败：
1. 检查GitHub Actions日志
2. 确认EXPO_TOKEN是否正确
3. 检查eas.json配置
4. 查看EAS构建详情页面

## 优势
- ✅ 避开国内网络限制
- ✅ 自动化构建流程
- ✅ 免费使用GitHub Actions
- ✅ 构建历史可追溯
- ✅ 多人协作友好