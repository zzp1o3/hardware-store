@echo off
echo 正在初始化Git仓库...
git init

echo 正在添加所有文件...
git add .

echo 正在提交代码...
git commit -m "Initial commit for EAS build via GitHub Actions"

echo 设置main分支...
git branch -M main

echo.
echo 请按以下步骤操作：
echo 1. 在GitHub上创建新仓库（不要初始化）
echo 2. 复制仓库的HTTPS地址（如：https://github.com/用户名/仓库名.git）
echo 3. 在下面输入仓库地址：

set /p repo_url="请输入GitHub仓库地址: "

echo 正在添加远程仓库...
git remote add origin %repo_url%

echo 正在推送代码...
git push -u origin main

echo.
echo ✅ GitHub仓库设置完成！
echo.
echo 下一步：
echo 1. 访问 https://expo.dev/settings/access-tokens
echo 2. 创建新的Access Token
echo 3. 在GitHub仓库设置中添加EXPO_TOKEN密钥
echo 4. 触发GitHub Actions构建
echo.
pause