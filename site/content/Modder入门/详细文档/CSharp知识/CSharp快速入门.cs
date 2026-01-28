using ModDocProject;
using Terraria.ModLoader;

namespace ModDocProject.Modder入门.详细文档.CSharp知识 {
    #region 元数据
    /// <summary>快速建立 C# 语法概念，便于阅读后续教程</summary>
    [Title("C#快速入门")]
    [Tooltip("快速建立 C# 语法概念，便于阅读后续教程")]
    [UpdateTime("2026-01-28")]
    [Author("小天使")]
    [Category("Modder入门")]
    [Topic("know-csharp")]
    [Date("2026-01-23")]
    [Difficulty("beginner")]
    [Time("15分钟")]
    [NextChapter("CSharp基本语法")]
    #endregion
    public class CSharp快速入门 {
#if DOCS
        #region 目标与阅读方式
        public const string DocMarkdown_1 = """
        本章给你一个“能读懂后续教程代码”的最小 C# 概念集。

        阅读方式：
        - 先看正文里穿插出现的几个“示例代码”小节。
        - 再回到文字说明，把关键字和写法对上号。

        学完后你应该能做到：
        - 看懂 `namespace` / `class` / 方法的层级结构
        - 看懂最常见的访问修饰符（`public/private/protected/internal`）
        - 知道为什么很多教程会让你“类名和文件名一致”

        本章刻意不讲太多“语法细节”，只解决一个问题：
        - 你打开一份 Mod 源码时，不会不知道“从哪读起”。
        """;
        #endregion

        #region 概念：类型与命名空间
        public const string DocMarkdown_2 = """
        `class` 用来定义类型（你写的大部分逻辑最终都会落在某个类型里）。

        `namespace` 用来组织代码，类似“分组/目录”。磁盘目录和命名空间不要求一致，但建议保持一致，便于检索与阅读。

        下面先看一段“最小类 + 最小方法”的结构示例。

        你可以用这条“读代码路线”快速定位：
        - `namespace ...`：这段代码属于哪个分组
        - `class ...`：这里定义了一个类型
        - `{ ... }`：大括号里是这个类型的成员（字段/属性/方法/嵌套类型）
        - `void Run()`：一个方法（能被调用执行）

        你会在 tModLoader 工程里看到大量类似命名空间：
        - `Terraria`
        - `Terraria.ID`
        - `Terraria.ModLoader`

        它们通常通过 `using` 引入（下一节会解释）。
        """;
        #endregion
#endif

        #region 示例代码：类与方法
        public static class HelloWorldExample {
            public static void Run() {
                // 这里只展示类/方法结构；tModLoader Mod 一般不会使用 Console 输出。
                int answer = 42;
                _ = answer;
            }
        }
        #endregion

#if DOCS
        #region 概念：方法签名（返回值/参数）
        public const string DocMarkdown_2_1 = """
        看到一个方法时，优先读它的“签名”：
        - 返回值：`void` 表示不返回任何东西；`int` 表示返回一个整数
        - 方法名：例如 `Add`
        - 参数列表：括号里的 `int a, int b` 等

        你会在后续教程里大量看到这种写法：先声明几个变量，再把结果 `return` 回去。

        初学者最常见的误解：
        - 看到 `return` 就以为“程序结束了”——它只结束当前方法
        - 看到参数就以为必须传复杂对象——参数通常是最简单的数据（数字/字符串/引用）
        """;
        #endregion
#endif

        #region 示例代码：方法签名与返回值
        public static class MethodSignatureExample {
            public static int Add(int a, int b) {
                return a + b;
            }

            public static bool IsPositive(int value) {
                return value > 0;
            }
        }
        #endregion

#if DOCS
        #region 关键字：public / private / protected / internal
        public const string DocMarkdown_3 = """
        访问修饰符决定“谁能用它”：

        - `public`：任何地方都能访问
        - `private`：只允许在当前类内部访问（最常见的默认选择）
        - `protected`：当前类及其子类可访问（继承时常用）
        - `internal`：同一程序集内可访问（同一个 Mod 工程内）

        初学阶段的经验法则：能 `private` 就别 `public`，先把暴露面做小。

        下面给一个“字段 + 属性 + 方法”的示例，用来对照这些修饰符的含义。

        常见误区：
        - 把所有东西都写成 `public`：短期看起来“能用”，长期会让代码难维护
        - 不理解 `internal`：它限制的是“程序集”（同一个工程/同一个 Mod）范围

        什么时候用哪个（新手版决策）：
        - 你只在当前类里用：`private`
        - 你希望外部读取但不希望外部乱改：`public` 属性 + `private set`
        - 你在设计“可被继承扩展”的基类：`protected`
        """;
        #endregion
#endif

        #region 示例代码：访问修饰符与成员
        private int _privateField = 1;

        public int PublicProperty { get; private set; } = 2;

        protected void ProtectedMethod() { }
        internal void InternalMethod() { }

        public int ReadPrivateField() {
            return _privateField;
        }
        #endregion

#if DOCS
        #region using：为什么不用写全名
        public const string DocMarkdown_3_05 = """
        你可能会看到两种写法：

        1）写全名：
        - `Terraria.ModLoader.ModItem`

        2）写短名：
        - `ModItem`

        之所以能写短名，是因为文件顶部有 `using`：

        ```csharp
        using Terraria.ModLoader;
        ```

        经验法则：
        - 报错“找不到类型/命名空间”时，先检查是否缺少 `using`
        - 仍然找不到，再检查你引用的包/工程是否正确（tModLoader targets 是否生效）
        """;
        #endregion

        #region 小练习：你应该能回答的问题
        public const string DocMarkdown_3_1 = """
        读到这里，你可以自测一下：
        1. 看到 `public static int Add(int a, int b)`，你能说出返回值和参数分别是什么吗？
        2. 看到一个 `private` 字段，你知道为什么教程更推荐它从 `private` 开始吗？
        3. 看到 `namespace X.Y.Z`，你能在项目里快速定位它大概放在哪个目录吗？
        """;
        #endregion

        #region 下一步
        public const string DocMarkdown_4 = """
        下一章会把“变量/表达式/语句”的基本形式补齐，并解释你在教程里经常看到的写法。
        """;
        #endregion
#endif
    }
}
