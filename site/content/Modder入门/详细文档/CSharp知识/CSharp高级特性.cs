using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ModDocProject;
using Terraria.ModLoader;

namespace ModDocProject.Modder入门.详细文档.CSharp知识 {
    #region 元数据
    /// <summary>把 Mod 开发里常见的高级写法提前“认个脸熟”</summary>
    [Title("CSharp高级特性 - 深入掌握C#")]
    [Tooltip("把 Mod 开发里常见的高级写法提前“认个脸熟”")]
    [UpdateTime("2026-01-28")]
    [Author("小天使")]
    [Category("Modder入门")]
    [Topic("know-csharp")]
    [Date("2026-01-25")]
    [Difficulty("intermediate")]
    [Time("20分钟")]
    [PrevChapter("CSharp面向对象基础")]
    [NextChapter("环境搭建")]
    #endregion
    public class CSharp高级特性 {
#if DOCS
        #region 泛型：先记住“尖括号是占位”
        public const string DocMarkdown_1 = """
        泛型最直观的理解：`List<T>` 里的 `T` 是“占位的类型”。

        你会在 tModLoader 与 C# 标准库里大量见到泛型：
        - `List<T>`、`Dictionary<TKey, TValue>`
        - `IEnumerable<T>`（LINQ 的基础）

        下面给一个最小 `List<int>` 示例：直接用集合初始化器创建三个数。

        常见坑：
        - 看到 `T` 不要慌：把它当成“一个还没确定的类型”
        - 泛型方法也很常见：例如 `TryGetValue<TKey, TValue>`
        """;
        #endregion
#endif

        #region 示例代码：泛型 List<T>
        public static List<int> CreateNumbers() {
            return new List<int> { 1, 2, 3 };
        }
        #endregion

#if DOCS
        #region LINQ：让“过滤/映射/聚合”更直接
        public const string DocMarkdown_2 = """
        LINQ 是一套链式写法，常用在“过滤/排序/映射”：
        - `Where`：筛选
        - `Select`：投影/变换
        - `Any/All`：判断
        - `ToList/ToArray`：落地成集合

        初学建议：先保证可读性，链太长就拆成多行或中间变量。

        下面给一个最小示例：过滤正数并平方。

        常见坑：
        - LINQ 默认是“延迟执行”（deferred execution），直到你枚举它
        - 想立刻得到结果：用 `ToArray()` / `ToList()`
        """;
        #endregion
#endif

        #region 示例代码：LINQ（Where/Select）
        public static int[] FilterAndSquare(int[] values) {
            return values
                .Where(v => v > 0)
                .Select(v => v * v)
                .ToArray();
        }
        #endregion

#if DOCS
        #region 委托/事件：把“回调”写得更安全
        public const string DocMarkdown_3 = """
        委托/事件是“把一段可执行的逻辑当成值传来传去”。

        你在 Mod 开发里会遇到两种典型场景：
        - 自己写工具方法，接受一个 `Action` 作为回调
        - 订阅/触发某些事件（库或框架提供）

        小技巧：`action?.Invoke()` 可以避免 null 引用。

        下面给一个最小示例：把 `Action` 当成参数传入，然后执行两次。

        你会在“UI 按钮回调 / 钩子分发 / 工具函数”里经常遇到委托。
        """;
        #endregion
#endif

        #region 示例代码：委托与事件（Action）
        public static void InvokeTwice(Action action) {
            action?.Invoke();
            action?.Invoke();
        }
        #endregion

#if DOCS
        #region async/await：异步的基本形态（先认脸）
        public const string DocMarkdown_3_1 = """
        你可能会在一些工具/网络/IO 场景里看到 `async/await`。

        初学阶段先记住两点就够了：
        - `async` 方法通常返回 `Task` / `Task<T>`
        - `await` 表示“等待一个 Task 完成”

        Mod 的核心游戏逻辑一般在主线程里跑；涉及异步时要格外小心线程安全。

        初学阶段的建议：
        - 如果你只是做第一个 Mod，大多数时候暂时用不到 async
        - 先把“同步逻辑写清楚”，再考虑异步
        """;
        #endregion
#endif

        #region 示例代码：async/await
        public static async Task<int> DelayAndReturnAsync(int value) {
            await Task.Delay(1);
            return value;
        }
        #endregion

#if DOCS
        #region 语法糖：?. 与 ??（空引用更安全）
        public const string DocMarkdown_3_2 = """
        你会经常看到这两个写法：
        - `obj?.M()`：如果 obj 是 null，就不会调用 M，结果是 null（不会抛 NullReferenceException）
        - `a ?? b`：如果 a 不是 null，就用 a；否则用 b

        它们本质上是在帮你把“null 检查”写得更短、更不容易漏。
        """;
        #endregion
#endif

        #region 示例代码：?. 与 ??
        public static string SafeNameOrDefault(string name) {
            // Trim 只有在非 null 时才会执行；然后再用 ?? 给一个默认值
            return name?.Trim() ?? "unknown";
        }
        #endregion

#if DOCS
        #region 下一步
        public const string DocMarkdown_4 = """
        C# 语法补齐到这里就够“能写 Mod 了”。下一章开始进入工具链：搭建开发环境。
        """;
        #endregion
#endif
    }
}
