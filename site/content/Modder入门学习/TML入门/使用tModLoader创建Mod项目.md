---
title: 使用tModLoader创建Mod项目
author: OpenCode
topic: tml-create-mod-project
order: 5
difficulty: beginner
time: 20分钟
description: 学习如何从零开始创建 tModLoader Mod 项目，包括环境准备、项目创建和首次运行
date: 2026-01-31
last_updated: 2026-01-31
tags:
  - 入门
  - 环境搭建
  - 项目创建
next_chapter: ./制作你的第一把武器.md
---

# 使用tModLoader创建Mod项目

本章目标：完成 tModLoader Mod 开发环境的搭建，成功创建并运行第一个 Mod 项目。

开始 Mod 开发前，你需要准备开发环境并了解项目创建流程。本章将带你完成从安装到运行的完整过程。

## 准备工作

前置条件：
- 已购买泰拉瑞亚（Steam 版本）
- 电脑配置满足 Visual Studio 或 VS Code 运行要求
- 掌握基础 C# 语法知识

## 步骤 1：安装 tModLoader

### 从 Steam 安装

1. 打开 Steam 库
2. 搜索并安装 **tModLoader**（免费 DLC）
3. 启动 tModLoader 至少一次，确保正常运行

> **提示**：tModLoader 会自动管理泰拉瑞亚版本，无需手动切换。

## 步骤 2：安装开发工具

### 选项 A：Visual Studio（推荐）

**安装 Visual Studio Community**（免费）：

1. 下载地址：https://visualstudio.microsoft.com/zh-hans/vs/community/
2. 安装时选择 **".NET 桌面开发"** 工作负载
3. 等待安装完成（约 10-20 分钟）

**必需组件**：
- .NET SDK 6.0 或更高版本
- C# 语言支持
- 类设计器（可选）

### 选项 B：VS Code

**安装 VS Code + C# Dev Kit**：

1. 下载并安装 VS Code：https://code.visualstudio.com/
2. 安装扩展：C# Dev Kit、C# Extension
3. 安装 .NET 6.0 SDK

## 步骤 3：创建 Mod 项目

### 方法 1：使用 Mod 模板（推荐）

**在游戏中创建**：

1. 启动 tModLoader
2. 在主菜单点击 **"Mod Sources"**（Mod 源码）
3. 点击 **"Create Mod"**（创建 Mod）

4. 在弹出的对话框中填写 Mod 信息：
   - **Mod Name**：你的 Mod 名称（如 MyFirstMod）
   - **Display Name**：显示名称（游戏内显示的名字）
   - **Author**：作者名
   - **Version**：版本号（默认 0.1）
   - **Template**：选择 **Standard**（标准模板）

5. 选择模板类型：
   - **Standard**：标准模板（推荐）
   - **Library**：类库模板
6. 点击 **"Create"**，等待项目生成

### 方法 2：手动创建

如果模板无法使用，可手动创建：

```bash
# 创建项目文件夹
mkdir MyFirstMod
cd MyFirstMod

# 创建解决方案文件
dotnet new sln -n MyFirstMod

# 创建类库项目
dotnet new classlib -n MyFirstMod -f net6.0
dotnet sln add MyFirstMod/MyFirstMod.csproj
```

## 步骤 4：配置项目文件

### 必备文件结构

```
MyFirstMod/
├── MyFirstMod.csproj      # 项目文件
├── build.txt              # Mod 元数据
├── description.txt        # Mod 描述
├── icon.png               # Mod 图标（可选）
└── MyFirstMod.cs          # 主类文件
```

### build.txt 配置

```
displayName = My First Mod
author = YourName
version = 0.1
homepage = https://github.com/yourname/MyFirstMod
```

### description.txt 内容

```
这是我的第一个 tModLoader Mod！

添加了一些基础内容用于学习。
```

### .csproj 文件配置

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net6.0</TargetFramework>
    <LangVersion>latest</LangVersion>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="tModLoader.CodeAssist" Version="0.1.*" />
  </ItemGroup>

</Project>
```

## 步骤 5：编写第一个 Mod 类

创建 `MyFirstMod.cs`：

```csharp
using Terraria.ModLoader;

namespace MyFirstMod
{
    public class MyFirstMod : Mod
    {
        public override void Load()
        {
            // Mod 加载时执行的代码
            Logger.Info("MyFirstMod 已加载！");
        }

        public override void Unload()
        {
            // Mod 卸载时执行的代码
            Logger.Info("MyFirstMod 已卸载！");
        }
    }
}
```

### 代码说明

- **继承 Mod 类**：所有 tModLoader Mod 的主类必须继承 `Mod`
- **Load() 方法**：Mod 加载时自动调用，用于初始化
- **Unload() 方法**：Mod 卸载时调用，用于清理资源
- **Logger**：用于输出日志信息，可在游戏中查看

## 步骤 6：编译和运行

### 在 Visual Studio 中编译

1. 打开生成的 `.sln` 文件
2. 按 `F6` 或 `Build` → `Build Solution` 编译
3. 确认输出显示 **"Build succeeded"**

### 在 tModLoader 中运行

1. 启动 tModLoader
2. 进入 **"Workshop"** → **"Manage Mods"**（工坊 → 管理模组）
3. 在 **Local Mods**（本地模组）分类中找到你的 Mod
4. 点击 **"Enable"**（启用）切换开关
5. 点击 **"Reload Mods"**（重载模组）按钮
6. 等待重载完成，进入游戏测试
7. 在聊天框输入 `/modlist` 查看已加载的 Mod 列表

### 查看日志

如果 Mod 加载成功，你会在日志中看到：

```
[MyFirstMod] MyFirstMod 已加载！
```

打开日志查看器：
- 游戏中按 `F10`
- 或查看 `%UserProfile%/Documents/My Games/Terraria/ModLoader/Logs/`

## 本章要点（可引用）

- **tModLoader 安装**：通过 Steam 免费下载，自动管理游戏版本
- **开发工具**：Visual Studio Community（推荐）或 VS Code + C# Dev Kit
- **项目创建**：使用游戏内 "Mod Sources" → "Create Mod" 最便捷
- **必备文件**：`.csproj`、 `build.txt`、 `description.txt`、 主类 `.cs`
- **Mod 类结构**：继承 `Mod` 类，重写 `Load()` 和 `Unload()` 方法
- **编译运行**：VS 中 Build → tModLoader 中 Enable → Reload → 测试

## 常见坑（可引用）

### 坑 1：.NET SDK 版本不匹配

```
错误：The framework 'Microsoft.NETCore.App', version '6.0.x' was not found.
```

**解决**：安装 .NET 6.0 SDK（即使你有更高版本也需要 6.0）

### 坑 2：Mod 名称包含特殊字符

```
// 错误：Mod 名称不能有空格和特殊字符
namespace My First Mod { }

// 正确
namespace MyFirstMod { }
```

### 坑 3：忘记启用 Mod

创建项目后需要在游戏中手动启用：

1. Workshop → Manage Mods
2. 找到你的 Mod（默认在 Local Mods 分类）
3. 点击 Enable
4. 必须点击 Reload Mods 才能生效

### 坑 4：编译后未重新加载

修改代码后需要：

1. **重新编译**（Ctrl+Shift+B）
2. **重新加载**（tModLoader 中 Reload Mods）

仅编译不重新加载，游戏内不会更新！

### 坑 5：日志找不到

如果按 F10 打不开日志，手动查看文件：

```
%UserProfile%\Documents\My Games\Terraria\ModLoader\Logs\client.log
```

## 下一步（可引用）

继续学习：

1. **制作你的第一把武器** - 创建实际的 Mod 内容（武器物品）
2. **Mod 项目结构** - 深入了解 Items、Projectiles、NPCs 等文件夹组织
3. **调试技巧** - 学习如何在 VS 中调试 Mod 代码

实践建议：
- 在 `Load()` 方法中尝试修改游戏属性（如 `Main.dayTime`）
- 查看 tModLoader 官方示例 Mod 学习更多 API
- 加入社区 Discord 遇到问题及时求助

## 参考资源

- **tModLoader Wiki**：https://github.com/tModLoader/tModLoader/wiki
- **官方 Discord**：https://discord.gg/tmodloader
- **示例 Mod**：https://github.com/tModLoader/tModLoader/tree/1.4/ExampleMod
- **VS 下载**：https://visualstudio.microsoft.com/

---

**恭喜！** 你已经成功创建并运行了第一个 tModLoader Mod。接下来开始添加实际内容吧。
