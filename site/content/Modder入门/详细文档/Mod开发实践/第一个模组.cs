using ModDocProject;
using Terraria.ModLoader;

namespace ModDocProject.Modder入门.详细文档.Mod开发实践 {
    #region 元数据
    /// <summary>创建一个空的 Mod 工程，并确认能加载/构建</summary>
    [Title("第一个模组 - 创建空模组项目")]
    [Tooltip("创建一个空的 Mod 工程，并确认能加载/构建")]
    [UpdateTime("2026-01-30")]
    [Author("Papyru")]
    [Category("Modder入门")]
    [Topic("mod-dev")]
    [PrevChapter("环境搭建")]
    [NextChapter("第一个物品")]
    #endregion
    public class 第一个模组 : ModSystem {
#if DOCS
        #region 版本说明
        public const string DocMarkdown_0 = """
        > WARNING: 版本说明：本教程适用于 **tModLoader 1.4.4+**
        
        > 如果你使用的是旧版本，API 名称可能略有差异。
        """;
        #endregion

        #region 本章目标
        public const string DocMarkdown_1 = """
        本章做两件事：
        1. 创建一个空的 Mod 工程（结构正确）
        2. 验证它能构建、能被 tModLoader 识别并加载
        
        只要这两件事成功，后面写物品/弹幕/配方才有意义。
        """;
        #endregion

        #region 工程放哪：ModSources
        public const string DocMarkdown_2 = """
        tModLoader 默认会从 ModSources 目录读取你的源代码工程（Windows 常见路径类似）：
        - `F:\\文档\\My Games\\Terraria\\tModLoader\\ModSources`

        你可以把每个 Mod 当作一个独立工程/目录，便于管理与发布。
        """;
        #endregion

        #region 最小结构与验证思路
        public const string DocMarkdown_3 = """
        最小结构的思路很简单：
        - 有一个继承 `Mod` 的类：说明"这是一个 Mod"
        - 有一个继承 `ModSystem` 的类：方便你放一些全局钩子/初始化逻辑
        
        ### 文件结构
        
        ```
        MyFirstMod/
          MyFirstMod.cs        // Mod 类
          MyFirstSystem.cs     // ModSystem 类
          MyFirstMod.csproj     // 项目文件
          build.txt             // 构建配置（tModLoader 需要）
        ```
        
        ### 验证清单
        
        **阶段1：代码结构验证**
        - 创建了 `MyFirstMod` 类（继承 `Mod`）
        - 创建了 `MyFirstSystem` 类（继承 `ModSystem`）
        - 项目文件（.csproj）正确引用了 tMLMod.targets
        - IDE 中没有红色波浪线（编译错误）
        
        **阶段2：构建验证**
        - 在 Visual Studio 中构建项目（生成 -> 生成解决方案）
        - 输出窗口显示"生成成功"
        - 生成了 `.tmod` 文件（在 ModSources 对应目录下）
        
        **阶段3：游戏加载验证**
        - 启动 Terraria（会自动加载 tModLoader）
        - 在主菜单点击"设置" -> "模组设置"
        - 能在模组列表中看到 "MyFirstMod"
        - 勾选启用模组
        - 重新进入游戏（点击"播放"）
        
        ### 常见问题
        
        **问题1：模组没有出现在列表中**
        - 原因：`build.txt` 缺失或内容错误
        - 检查：确保 `build.txt` 中包含 `modName` 和 `modVersion`
        
        **问题2：构建成功但游戏崩溃**
        - 原因：Mod 类或 ModSystem 类有语法错误
        - 检查：查看 `Logs/Logs.txt` 错误信息
        
        **问题3：.tmod 文件生成位置不对**
        - 原因：项目路径不在 ModSources 下
        - 检查：确保项目文件夹在 ModSources 目录内
        
        下面给两个最小示例：一个 `Mod` 类、一个 `ModSystem` 类。
        """;
        #endregion
#endif

        #region 示例代码：最小 Mod 类
        public class MyFirstMod : Mod {
            // 初学阶段：先让工程“能跑起来”，不要急着写复杂逻辑。
        }
        #endregion

        #region 示例代码：最小 ModSystem
        public class MyFirstSystem : ModSystem {
            public override void Load() {
                // 这里是一个非常常见的“钩子入口”。
            }
        }
        #endregion

#if DOCS
        #region 下一步
        public const string DocMarkdown_4 = """
        下一章开始写第一个物品：从最基础的 `ModItem` 入手。
        """;
        #endregion
#endif
    }
}
