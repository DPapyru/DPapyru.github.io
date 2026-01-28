using System.Collections.Generic;
using ModDocProject;
using Terraria;
using Terraria.ModLoader;

namespace ModDocProject.Modder入门.详细文档.CSharp知识 {
    #region 元数据
    /// <summary>理解数组、List、Dictionary，学会“存一堆东西并遍历”</summary>
    [Title("C#数组与集合")]
    [Tooltip("理解数组、List、Dictionary，学会“存一堆东西并遍历”")]
    [UpdateTime("2026-01-28")]
    [Author("小天使")]
    [Category("Modder入门")]
    [Topic("know-csharp")]
    [Date("2026-01-25")]
    [Difficulty("beginner")]
    [Time("15分钟")]
    [PrevChapter(typeof(CSharp控制流))]
    [NextChapter("CSharp面向对象基础")]
    #endregion
    public class CSharp数组与集合 {
#if DOCS
        #region 什么时候用数组
        public const string DocMarkdown_1 = """
        数组适合“长度固定、索引访问”的数据：
        - 你知道最大数量（或必须固定）
        - 你经常用下标访问（`arr[i]`）

        注意：数组一旦创建，长度就不能变。

        下面给一个最小数组示例（创建、赋值、返回）。

        常见坑：
        - 数组下标从 0 开始：最后一个元素是 `arr.Length - 1`
        - 访问越界会抛异常：`IndexOutOfRangeException`
        """;
        #endregion
#endif

        #region 示例代码：数组（固定长度）
        public static int[] CreateFixedArray() {
            int[] values = new int[3];
            values[0] = 10;
            values[1] = 20;
            values[2] = 30;
            return values;
        }
        #endregion

#if DOCS
        #region 什么时候用 List
        public const string DocMarkdown_2 = """
        `List<T>` 适合“数量不固定”的一组数据：
        - 需要不断 `Add/Remove`
        - 需要按顺序遍历

        对初学者来说：把 List 当作“可变长度数组”来用就够了。

        下面给一个最小 `List<string>` 示例（Add 两次）。

        常见坑：
        - 不要在遍历 `List` 的同时 `Remove`（可以倒序 for，或先记录待删除项）
        - `List<T>` 的 `Count` 是元素数量，不是容量（capacity）
        """;
        #endregion
#endif

        #region 示例代码：List（可变长度）
        public static List<string> CreateNameList() {
            var names = new List<string>();
            names.Add("A");
            names.Add("B");
            return names;
        }
        #endregion

#if DOCS
        #region 什么时候用 Dictionary
        public const string DocMarkdown_3 = """
        `Dictionary<TKey, TValue>` 适合“按键查值”的场景：
        - 你有一个唯一键（比如 ID / Name）
        - 想快速找到对应的数据

        初学最常见的错误：不检查 key 是否存在就直接取值。

        下面给一个最小 `Dictionary<int, string>` 示例（用索引器写入两项）。

        推荐写法：
        - 读取：`TryGetValue`（避免 KeyNotFoundException）
        - 写入：`dict[key] = value`（覆盖/新增都可以）
        """;
        #endregion
#endif

        #region 示例代码：Dictionary（键值映射）
        public static Dictionary<int, string> CreateIdMap() {
            var map = new Dictionary<int, string>();
            map[1] = "One";
            map[2] = "Two";
            return map;
        }
        #endregion

#if DOCS
        #region 查找：TryGetValue（安全读取）
        public const string DocMarkdown_3_1 = """
        当你不确定某个 key 是否存在时，用 `TryGetValue`：
        - 存在：返回 true，并把 value 放到 out 变量里
        - 不存在：返回 false，value 是默认值

        这比直接 `dict[key]` 更安全。

        经验法则：
        - “是否存在”本身就是一个分支条件，所以 TryGetValue 很适合配合 if 使用
        """;
        #endregion
#endif

        #region 示例代码：TryGetValue
        public static bool TryGetName(Dictionary<int, string> map, int id, out string name) {
            return map.TryGetValue(id, out name);
        }
        #endregion

#if DOCS
        #region 遍历 Dictionary：你拿到的是 KeyValuePair
        public const string DocMarkdown_3_2 = """
        遍历 Dictionary 时，元素类型是 `KeyValuePair<TKey, TValue>`：
        - `pair.Key`
        - `pair.Value`

        这在你想“把所有映射打印出来/调试”时很有用。
        """;
        #endregion
#endif

        #region 示例代码：遍历 Dictionary
        public static int SumKeys(Dictionary<int, string> map) {
            int sum = 0;
            foreach (var pair in map) {
                sum += pair.Key;
            }
            return sum;
        }
        #endregion

#if DOCS
        #region 遍历：foreach 是最常见的姿势
        public const string DocMarkdown_4 = """
        绝大多数时候你会用 `foreach` 遍历集合：
        - 逻辑更直观
        - 少写下标与边界条件

        下面用 `Main.player` 做一个“统计活跃玩家数量”的示例。

        常见坑：
        - 遍历时要考虑 null / inactive（尤其是游戏对象数组）
        - 遍历时修改集合结构通常不安全
        """;
        #endregion
#endif

        #region 示例代码：遍历 Main.player
        public static int CountActivePlayers() {
            int count = 0;
            foreach (Player player in Main.player) {
                if (player == null || !player.active) continue;
                count++;
            }
            return count;
        }
        #endregion

#if DOCS
        #region 下一步
        public const string DocMarkdown_5 = """
        下一章进入面向对象：类、字段、方法、继承，理解 tModLoader API 的基本形态。
        """;
        #endregion
#endif
    }
}
