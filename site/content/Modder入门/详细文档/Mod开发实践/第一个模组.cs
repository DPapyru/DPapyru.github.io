using ModDocProject;
using Terraria.ModLoader;

namespace ModDocProject.Modder入门.详细文档.Mod开发实践 {
    #region 元数据
    /// <summary>创建一个空的 Mod 工程，并确认能加载/构建</summary>
    [Title("第一个模组 - 创建空模组项目")]
    [Tooltip("创建一个空的 Mod 工程，并确认能加载/构建")]
    [UpdateTime("2026-01-28")]
    [Author("Papyru")]
    [Category("Modder入门")]
    [Topic("mod-dev")]
    [PrevChapter("环境搭建")]
    [NextChapter("第一个物品")]
    #endregion
    public class 第一个模组 : ModSystem {
#if DOCS
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
        - 有一个继承 `Mod` 的类：说明“这是一个 Mod”
        - 有一个继承 `ModSystem` 的类：方便你放一些全局钩子/初始化逻辑

        验证：
        - IDE 里能补全 `Mod` / `ModSystem`
        - build 不报错
        - 进游戏后能看到你的 Mod（即使它什么都没做）

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
