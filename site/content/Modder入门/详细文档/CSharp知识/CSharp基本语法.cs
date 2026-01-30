using ModDocProject;
using Terraria;
using Terraria.ModLoader;

namespace ModDocProject.Modder入门.详细文档.CSharp知识 {
    #region 元数据
    /// <summary>用最少的语法点，解释你在教程里频繁遇到的写法</summary>
    [Title("C#基本语法")]
    [Tooltip("用最少的语法点，解释你在教程里频繁遇到的写法")]
    [UpdateTime("2026-01-30")]
    [Author("小天使")]
    [Category("Modder入门")]
    [Topic("know-csharp")]
    [Date("2026-01-25")]
    [Difficulty("beginner")]
    [Time("10分钟")]
    [PrevChapter("CSharp快速入门")]
    [NextChapter("CSharp变量表达式")]
    #endregion
    public class CSharp基本语法 {
#if DOCS
        #region 跨平台路径说明
        public const string DocMarkdown_0 = """
        ### Mod 开发中的跨平台路径
        
        tModLoader 在不同操作系统下使用不同的路径来读取 Mod 和日志文件。
        
        ### Windows 路径
        
        ModSources 目录：
        ```
        C:\\Users\\[用户名]\\Documents\\My Games\\Terraria\\tModLoader\\ModSources
        ```
        
        日志目录：
        ```
        C:\\Users\\[用户名]\\Documents\\My Games\\Terraria\\tModLoader\\Logs
        ```
        
        路径分隔符：反斜杠 `\\`
        
        ### macOS 路径
        
        ModSources 目录：
        ```
        ~/Library/Application Support/Terraria/ModSources
        ```
        
        日志目录：
        ```
        ~/Library/Application Support/Terraria/ModLoader/Logs
        ```
        
        路径分隔符：正斜杠 `/`，`~` 表示用户主目录
        
        ### Linux 路径
        
        ModSources 目录：
        ```
        ~/.local/share/Terraria/ModSources
        ```
        
        日志目录：
        ```
        ~/.local/share/Terraria/ModLoader/Logs
        ```
        
        路径分隔符：正斜杠 `/`，`~` 表示用户主目录
        
        ### 在代码中处理跨平台路径
        
        C# 的 `Path` 类会自动处理跨平台路径差异：
        
        ```csharp
        // 自动使用正确的路径分隔符
        string modSourcesPath = Path.Combine("MyMods", "MyFirstMod");
        
        // 获取正确的应用程序数据目录
        string appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        
        // 组合路径（自动处理分隔符）
        string fullPath = Path.Combine(appDataPath, "Terraria", "ModSources");
        ```
        
        > NOTE: 提示：使用 `Path.Combine()` 而不是字符串拼接 `+`，可以避免跨平台问题。
        """;
        #endregion
        #region 作用域：你最常见的报错来源
        public const string DocMarkdown_1 = """
        C# 用 `{ }` 表示作用域：变量在声明的作用域之外不可见。

        你会在两类场景频繁碰到它：
        - `if/for/foreach/while` 的代码块
        - 任意一对 `{ }`（比如一个方法体、一个临时代码块）

        经验法则：变量尽量“就近声明”，别把临时变量放到很远的地方。

        下面这段示例代码就是一个最常见的“作用域可见性”演示。

        常见坑（新手高频）：
        - 在 `if (...) { ... }` 里声明的变量，出了 `}` 之后就没了
        - 在 `for (...) { ... }` 里声明的 `i`，循环结束就没了
        - 不小心在外层又声明了同名变量（遮蔽/shadowing），导致你以为改的是同一个

        建议你用“从外到内”读括号与大括号：
        - 先找出某一段代码属于哪个 `{ }`
        - 再判断某个变量的声明位置是否在同一个 `{ }`
        """;
        #endregion
#endif

        #region 示例代码：作用域（{ }）与变量可见性
        public static void ScopeExample() {
            int x = 1;

            {
                int y = 2;
                Main.NewText(x + y); // OK：x/y 都在可见范围内
            }

            // Main.NewText(y); // 错误：y 已经离开作用域
        }
        #endregion

#if DOCS
        #region 语句与分号：为什么 C# 需要 ;
        public const string DocMarkdown_1_1 = """
        在 C# 里，大多数语句以 `;` 结束，例如：
        - `int x = 1;`
        - `Main.NewText("Hello");`

        `{ }` 是块（block），它本身不需要 `;`，但块里的语句通常需要。

        初学阶段遇到编译错误，先看：
        - 是否漏了 `;`
        - 是否少了一个 `}`
        - 是否多了一个 `)`

        小技巧：
        - IDE 的格式化（Format Document）能帮你快速看出括号/大括号是否成对
        - 报错行号有时在“真正错误的下一行”，尤其是漏了 `;` 的情况
        """;
        #endregion
#endif

        #region 示例代码：语句与分号
        public static void SemicolonExample() {
            int x = 1;
            int y = 2;
            Main.NewText(x + y);
        }
        #endregion

#if DOCS
        #region 字符串：拼接与插值
        public const string DocMarkdown_1_2 = """
        写教程与写 Mod 时，你会经常输出调试信息（或者构造一些文本）：

        - 拼接：`"a" + b`
        - 插值：`$"a {b}"`

        初学建议：优先用插值字符串（更好读、更少出错）。
        """;
        #endregion
#endif

        #region 示例代码：字符串插值
        public static void StringInterpolationExample(int damage) {
            string text = $"Damage = {damage}";
            Main.NewText(text);
        }
        #endregion

#if DOCS
        #region 注释：写给未来的你
        public const string DocMarkdown_2 = """
        注释的优先级（从高到低）：
        1. 解释“为什么需要这段逻辑”
        2. 标注“边界条件/坑/假设”
        3. 给出“验证方式/参考链接”（如果非常关键）

        避免写这种注释：把代码逐字翻译一遍。

        下面的示例代码展示了 `//` 和 `/* ... */` 的基本用法。

        额外建议（写 Mod 时很有用）：
        - 注释里写“验证方法”：比如“进游戏后用什么方式触发这段逻辑”
        - 注释里写“边界条件”：比如“多人模式/服务器端是否会执行”

        什么时候该写注释：
        - 你写了一个“看起来有点怪”的判断：解释为什么必须这样写
        - 你做了性能优化：解释优化前后差异与原因
        - 你绕过了某个已知 bug：给出链接或复现关键字
        """;
        #endregion
#endif

        #region 示例代码：注释（// 与 /* */）
        public static void CommentsExample() {
            // 单行注释：解释“为什么这么写”，而不是复述“代码做了什么”。
            int damage = 10;

            /*
             * 多行注释：适合放短的说明。
             * 大段落更推荐写到 DOCS 正文里（下方 #if DOCS）。
             */
            _ = damage;
        }
        #endregion

#if DOCS
        #region 命名：让你未来能搜得到
        public const string DocMarkdown_2_1 = """
        写教程/写 Mod 时，命名会直接影响可维护性：
        - 类型（class）用名词：`PlayerCounter`
        - 方法用动词：`GetValue` / `CountActivePlayers`
        - 私有字段常见约定：`_value`（前导下划线）

        经验法则：名字要能表达“职责”，而不是表达“实现细节”。

        两个容易忽略的细节：
        - 布尔变量用“是/能/是否”语义：`canAttack` / `isEnabled`
        - 集合变量用复数或明确含义：`players` / `activePlayers`
        """;
        #endregion

        #region 常见编译错误：优先检查顺序
        public const string DocMarkdown_2_2 = """
        你遇到红字报错时，建议按这个顺序排查：
        1. 缺分号 `;`
        2. 大括号 `{}` 不成对（多/少一个）
        3. 小括号 `()` 不成对（多/少一个）
        4. 缺少 `using`（找不到类型/命名空间）
        5. 类型不匹配（例如把 `float` 当 `int` 用）

        小技巧：先把错误列表从上到下解决，后面的错误经常是“连锁反应”。
        """;
        #endregion

        #region 下一步
        public const string DocMarkdown_3 = """
        下一章会进入最核心的部分：变量、表达式、运算符与常见写法。
        """;
        #endregion
#endif
    }
}
