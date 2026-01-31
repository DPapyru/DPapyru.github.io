using ModDocProject;

namespace ModDocProject.Modder入门学习.CSharp基础 {
    [Title("C# 基础数据类型")]
    [Tooltip("深入了解 C# 中的各种数据类型，包括值类型和引用类型")]
    [Author("OpenCode")]
    [UpdateTime("2026-01-30")]
    [Topic("csharp-datatypes")]
    [Order(20)]
    [Difficulty("beginner")]
    [Time("25分钟")]
    [PrevChapter(typeof(CSharp语法基础))]
    [NextChapter(typeof(CSharp变量与表达式))]
    public class CSharp基础数据类型 {
#if DOCS
        #region 简介
        public const string DocMarkdown_1 = """
        本章目标：掌握 C# 中各种数据类型的特性和使用场景，能够正确选择合适的数据类型来存储 Mod 数据。

        在编写 tModLoader Mod 时，你需要处理各种数据：物品伤害、生命值、坐标位置等。选择正确的数据类型可以让你的代码更高效、更安全。
        """;
        #endregion

        #region 值类型与引用类型
        public const string DocMarkdown_2 = """
        值类型直接存储数据，引用类型存储数据的引用（地址）。

        ### 值类型

        - 存储在栈上
        - 包含实际数据
        - 赋值时复制整个值

        ```csharp
        int a = 10;
        int b = a;  // b 得到的是 a 的副本
        b = 20;     // 不影响 a
        // a 仍然是 10
        ```

        ### 引用类型

        - 存储在堆上
        - 变量保存的是引用
        - 赋值时复制引用

        ```csharp
        string s1 = "hello";
        string s2 = s1;  // s2 指向同一块内存
        // 修改 s2 会影响 s1（字符串是不可变的，但这适用于其他引用类型）
        ```

        ### 简单对比表

        | 特性 | 值类型 | 引用类型 |
        |------|--------|----------|
        | 存储位置 | 栈 | 堆 |
        | 赋值行为 | 复制值 | 复制引用 |
        | 常见类型 | int, float, bool | string, class, array |
        """;
        #endregion

        #region 数值类型
        public const string DocMarkdown_3 = """
        C# 提供了多种数值类型，适用于不同的数据范围和精度需求。

        ### 整数类型

        | 类型 | 范围 | 大小 | tModLoader 用途 |
        |------|------|------|-----------------|
        | `byte` | 0 ~ 255 | 1字节 | 小型计数 |
        | `short` | -32,768 ~ 32,767 | 2字节 | 稀有度 |
        | `int` | 约 ±21亿 | 4字节 | 伤害、生命值 |
        | `long` | 极大范围 | 8字节 | 大数值 |

        ```csharp
        // Mod 中的常见用法
        int damage = 50;           // 武器伤害
        byte stackSize = 99;       // 物品堆叠数量
        short rarity = 3;          // 稀有度等级
        ```

        ### 浮点类型

        | 类型 | 精度 | 用途 |
        |------|------|------|
        | `float` | 单精度 | 游戏坐标、速度 |
        | `double` | 双精度 | 精确计算 |
        | `decimal` | 高精度 | 货币计算 |

        ```csharp
        // 在 Mod 中
        float knockback = 6.5f;    // 击退力
        double preciseValue = 3.14159265359;
        
        // ⚠️ 注意：float 需要 f 后缀
        float speed = 5.0f;  // 正确
        // float speed = 5.0;  // 错误！
        ```
        """;
        #endregion

        #region 布尔与字符类型
        public const string DocMarkdown_4 = """
        ### bool 类型

        表示真或假，只有两个值：`true` 或 `false`。

        ```csharp
        bool isActive = true;
        bool canEquip = false;

        // 在条件判断中使用
        if (isActive)
        {
            // 执行某些操作
        }
        ```

        ### char 类型

        表示单个 Unicode 字符，用单引号包裹。

        ```csharp
        char grade = 'A';
        char symbol = '+';
        char chinese = '中';  // 支持中文
        ```

        ### string 类型

        表示字符串（字符序列），用双引号包裹。

        ```csharp
        string itemName = "铜短剑";
        string description = "一把基础的近战武器";
        
        // 字符串拼接
        string fullName = itemName + " - " + description;
        
        // 字符串插值（推荐）
        string info = $"伤害：{damage}，速度：{speed}";
        ```
        """;
        #endregion

        #region 类型转换
        public const string DocMarkdown_5 = """
        不同数据类型之间需要转换才能互相操作。

        ### 隐式转换（自动）

        小类型 → 大类型，不会丢失数据。

        ```csharp
        int small = 100;
        long big = small;  // 自动转换，安全
        
        byte b = 50;
        int i = b;         // 自动转换
        ```

        ### 显式转换（强制）

        大类型 → 小类型，可能丢失数据，需要显式转换。

        ```csharp
        double d = 3.9;
        int i = (int)d;    // i = 3，小数部分被截断
        
        long big = 1000;
        int small = (int)big;  // 强制转换
        ```

        ### 常用转换方法

        ```csharp
        // 字符串转数字
        string s = "100";
        int num = int.Parse(s);      // 100
        int num2 = Convert.ToInt32(s); // 100
        
        // 数字转字符串
        int value = 50;
        string str = value.ToString();  // "50"
        
        // 安全解析（推荐）
        if (int.TryParse(s, out int result))
        {
            // 解析成功，result 可用
        }
        ```
        """;
        #endregion

        #region 可空类型
        public const string DocMarkdown_6 = """
        值类型默认不能为 null，但有时需要表示"没有值"的状态。

        ### 声明可空类型

        在类型后加 `?` 表示可空。

        ```csharp
        int? health = null;        // 可以为 null
        int? maxHealth = 100;      // 也可以有值
        
        bool? isEnabled = null;    // 三态：true, false, null
        ```

        ### 使用场景

        ```csharp
        // 表示可选配置
        int? customDamage = null;  // 使用默认值
        
        // 检查是否有值
        if (health.HasValue)
        {
            int actualHealth = health.Value;
        }
        
        // 安全获取值（带默认值）
        int actual = health ?? 0;  // 如果 health 为 null，使用 0
        ```

        ### 空合并运算符

        ```csharp
        int? a = null;
        int? b = 10;
        
        int result = a ?? b ?? 0;  // 结果为 10
        // 从左到右，返回第一个非 null 值
        ```
        """;
        #endregion

        #region 本章要点（可引用）
        public const string DocMarkdown_7 = """
        - **值类型**：int, float, bool, char - 存储实际数据，赋值时复制
        - **引用类型**：string, class, array - 存储引用，赋值时共享数据
        - **数值类型选择**：根据范围和精度选择 int/float/double
        - **类型转换**：隐式（安全自动）、显式（强制，可能丢失数据）
        - **可空类型**：用 `int?` 表示可能为 null 的值类型
        - **默认值**：数值类型默认 0，bool 默认 false，引用类型默认 null
        """;
        #endregion

        #region 常见坑（可引用）
        public const string DocMarkdown_8 = """
        ### 坑 1：float 缺少 f 后缀

        ```csharp
        // 错误
        float speed = 5.5;   // 编译错误！
        
        // 正确
        float speed = 5.5f;  // 必须加 f
        ```

        ### 坑 2：类型转换溢出

        ```csharp
        int big = 100000;
        short small = (short)big;  // 溢出！结果不正确
        ```

        ### 坑 3：字符串和字符混淆

        ```csharp
        char c = "A";     // 错误！字符串不能赋给 char
        char c = 'A';     // 正确
        
        string s = 'A';   // 错误！字符不能赋给 string
        string s = "A";   // 正确
        ```

        ### 坑 4：可空类型直接运算

        ```csharp
        int? a = 5;
        int? b = null;
        int? c = a + b;   // 结果是 null，不是 5！
        ```
        """;
        #endregion

        #region 下一步（可引用）
        public const string DocMarkdown_9 = """
        继续学习：

        1. **C# 变量与表达式** - 学习如何使用变量和运算符
        2. **C# 控制流** - 掌握条件判断和循环
        3. **C# 方法** - 学习如何组织和复用代码

        实践建议：尝试定义不同类型的变量，进行类型转换练习，观察不同数据类型的行为差异。
        """;
        #endregion
#endif

        #region 示例代码：数据类型应用
        public class DataTypeExample : Terraria.ModLoader.ModItem
        {
            // 不同类型的字段
            public int baseDamage = 50;
            public float knockback = 6.5f;
            public bool isCraftable = true;
            public string itemTier = "rare";
            
            public override void SetDefaults()
            {
                Item.damage = baseDamage;
                Item.knockBack = knockback;
                Item.rare = GetRarityLevel(itemTier);
            }
            
            private int GetRarityLevel(string tier)
            {
                // 字符串转换为数值
                switch (tier)
                {
                    case "common": return 0;
                    case "rare": return 3;
                    case "epic": return 5;
                    default: return 0;
                }
            }
        }
        #endregion
    }
}
