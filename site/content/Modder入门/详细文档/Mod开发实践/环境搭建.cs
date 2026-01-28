using ModDocProject;
using Terraria.ModLoader;

namespace ModDocProject.Modder入门.详细文档.Mod开发实践 {
    #region 元数据
    /// <summary>把“能写代码 + 能补全 + 能编译”这三件事一次配好</summary>
    [Title("环境搭建 - 开发环境准备")]
    [Tooltip("把“能写代码 + 能补全 + 能编译”这三件事一次配好")]
    [UpdateTime("2026-01-28")]
    [Author("Papyru")]
    [Category("Modder入门")]
    [Topic("mod-dev")]
    [PrevChapter("CSharp高级特性")]
    [NextChapter("第一个模组")]
    #endregion
    public class 环境搭建 : ModSystem {
#if DOCS
        #region 目标
        public const string DocMarkdown_1 = """
        本章目标只有一个：让你在 IDE 里写 tModLoader 代码时 **有自动补全**，并且 **能编译通过**。

        你可以选择的 IDE：
        - Visual Studio（Windows）
        - Rider（Windows / macOS / Linux）
        - VS Code（需要额外配置，体验因人而异）
        """;
        #endregion

        #region 必备组件清单
        public const string DocMarkdown_2 = """
        建议按顺序准备：
        1. Steam 安装 Terraria
        2. Steam 安装 tModLoader（与游戏本体同目录）
        3. 安装一个 IDE（VS / Rider / VS Code）
        4. 确认 ModSources 目录可用（用来放你的 Mod 工程）

        只要后面“编译验证”通过，你就可以进入下一章创建空模组。
        """;
        #endregion

        #region 传统 .csproj（tMLMod.targets）与补全
        public const string DocMarkdown_3 = """
        你现在用的是基于 `tMLMod.targets` 的传统 `.csproj` 方式。

        关键点：
        - `.csproj` 里 `Import` 指向本机的 tModLoader 安装路径（例如 `F:\\steam\\steamapps\\common\\tModLoader\\tMLMod.targets`）
        - IDE 会通过这个 targets 引入引用与任务，从而拿到 tModLoader 的 API，提供补全与编译

        缺点：路径是“机器相关”的；换电脑/换盘符需要调整。

        下面有一段“最小 ModSystem”的示例代码，用来验证引用与补全是否正常。
        """;
        #endregion
#endif

        #region 示例代码：最小 ModSystem（确认引用正常）
        public class MinimalSystem : ModSystem {
            public override void Load() {
                // 只要这里能正常补全并编译，说明 tModLoader 引用链基本通了。
            }
        }
        #endregion

#if DOCS
        #region 编译验证（最重要）
        public const string DocMarkdown_4 = """
        先别急着写业务逻辑，先做一次“编译验证”：
        - 打开 `site/ContentProjects.sln`
        - 尝试构建 `ModDocProject`（它会引用 tMLMod.targets）
        - 确认没有红字报错

        如果 IDE 里能对 `ModSystem`、`ModItem` 等类型正常补全，并且 build 通过，环境就算搭好。
        """;
        #endregion
#endif
    }
}
