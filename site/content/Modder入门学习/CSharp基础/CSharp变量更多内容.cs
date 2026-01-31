using ModDocProject;

namespace ModDocProject.Modder入门学习.CSharp基础 {
    [Title("C# 变量更多内容")]
    [Tooltip("深入了解 C# 变量的高级特性：常量、静态变量、作用域和更多")]
    [Author("OpenCode")]
    [UpdateTime("2026-01-30")]
    [Topic("csharp-advanced-vars")]
    [Order(50)]
    [Difficulty("intermediate")]
    [Time("25分钟")]
    [PrevChapter(typeof(CSharp控制流))]
    [NextChapter(typeof(CSharp方法))]
    public class CSharp变量更多内容 {
#if DOCS
        #region 简介
        public const string DocMarkdown_1 = """
        本章目标：深入理解 C# 变量的高级特性，掌握 const、static、作用域等概念，编写更专业的 Mod 代码。

        在前面的章节中，你学习了变量的基础用法。本章将带你探索更多高级特性，这些特性在 tModLoader Mod 开发中非常重要。
        """;
        #endregion

        #region 常量 const
        public const string DocMarkdown_2 = """
        const 声明编译时常量，值在编译时确定且不可更改。

        ### 基本用法

        ```csharp
        public class MyWeapon : ModItem
        {
            // 定义常量
            public const int BaseDamage = 50;
            public const float MaxSpeed = 15.0f;
            public const string ItemName = "神剑";
            
            public override void SetDefaults()
            {
                // 使用常量
                Item.damage = BaseDamage;
                Item.shootSpeed = MaxSpeed;
            }
        }
        ```

        ### const 的限制

        ```csharp
        // 只能用于基本类型和字符串
        const int MaxLevel = 100;           // ✓
        const string Version = "1.0";       // ✓
        const float Pi = 3.14f;             // ✓
        
        // 以下不行
        // const Item DefaultItem = new Item();  // ✗ 不能是对象
        // const int[] Values = { 1, 2, 3 };     // ✗ 不能是数组
        ```

        ### 使用场景

        ```csharp
        public class Constants
        {
            // 游戏平衡数值
            public const int MaxHealth = 500;
            public const float CriticalMultiplier = 2.0f;
            
            // ID 和标识
            public const int ModVersion = 1;
            public const string ModName = "MyAwesomeMod";
            
            // 数学常量
            public const float Deg2Rad = 0.0174533f;
            public const float Rad2Deg = 57.2958f;
        }
        ```
        """;
        #endregion

        #region readonly 字段
        public const string DocMarkdown_3 = """
        readonly 声明运行时常量，只能在声明时或构造函数中赋值。

        ### readonly vs const

        | 特性 | const | readonly |
        |------|-------|----------|
        | 赋值时机 | 编译时 | 运行时（声明或构造函数）|
        | 类型限制 | 基本类型、string | 任意类型 |
        | 静态性 | 隐式 static | 可以是实例字段 |

        ```csharp
        public class WeaponConfig
        {
            // const：编译时常量
            public const int MaxUpgrade = 10;
            
            // readonly：运行时常量
            public readonly int BaseDamage;
            public readonly string WeaponName;
            
            public WeaponConfig(int damage, string name)
            {
                BaseDamage = damage;    // 构造函数中赋值
                WeaponName = name;
            }
        }
        ```

        ### 实际应用

        ```csharp
        public class CustomNPC : ModNPC
        {
            public readonly int SpawnHealth;
            
            public CustomNPC()
            {
                // 根据难度设置生命值
                SpawnHealth = Main.expertMode ? 1000 : 500;
            }
        }
        ```
        """;
        #endregion

        #region 静态变量 static
        public const string DocMarkdown_4 = """
        static 声明属于类而不是实例的变量，所有实例共享同一个值。

        ### 基本概念

        ```csharp
        public class GlobalStats
        {
            // 静态变量：所有实例共享
            public static int TotalKills = 0;
            public static float GlobalDamageMultiplier = 1.0f;
            
            // 实例变量：每个实例独立
            public int InstanceId;
        }
        
        // 使用
        GlobalStats.TotalKills++;  // 直接通过类名访问
        ```

### 在 Mod 中的应用

        ```csharp
        public class MyGlobalItem : GlobalItem
        {
            // 统计所有玩家总击杀数
            public static int GlobalKillCount = 0;
            
            // 记录 Mod 是否已初始化
            public static bool IsInitialized = false;
            
            public override void OnHitNPC(Item item, Player player, NPC target, int damage, float knockback, bool crit)
            {
                if (target.life <= 0)
                {
                    GlobalKillCount++;
                }
            }
        }
        ```

        ### 静态构造函数

        ```csharp
        public class ConfigManager
        {
            public static Dictionary<string, int> Settings;
            
            // 静态构造函数：类首次使用时自动调用
            static ConfigManager()
            {
                Settings = new Dictionary<string, int>();
                LoadDefaultSettings();
            }
        }
        ```
        """;
        #endregion

        #region 变量作用域
        public const string DocMarkdown_5 = """
        作用域决定了变量在哪里可以被访问。

        ### 作用域类型

        ```csharp
        public class ScopeExample
        {
            // 字段作用域：整个类
            private int classLevelVariable = 0;
            
            public void Method1()
            {
                // 局部作用域：只在方法内
                int localVariable = 10;
                
                if (localVariable > 5)
                {
                    // 块级作用域：只在 if 块内
                    int blockVariable = 20;
                }
                // 这里不能访问 blockVariable
            }
            
            public void Method2()
            {
                // 可以访问 classLevelVariable
                classLevelVariable++;
                
                // 不能访问 localVariable（属于 Method1）
            }
        }
        ```

        ### 作用域遮蔽

        ```csharp
        public class ShadowingExample
        {
            private int value = 10;  // 字段
            
            public void Test()
            {
                int value = 20;  // 局部变量遮蔽字段
                
                Console.WriteLine(value);       // 20（局部变量）
                Console.WriteLine(this.value);  // 10（字段）
            }
        }
        ```

        ### 最佳实践

        ```csharp
        // 尽量缩小变量作用域
        public void GoodExample()
        {
            // 在需要时才声明
            if (condition)
            {
                int temp = Calculate();
                Use(temp);
            }
            // temp 在这里不可用，避免误用
        }
        
        // 避免过长的作用域
        public void BadExample()
        {
            int temp = 0;  // 过早声明
            // ... 很多代码 ...
            temp = Calculate();  // 最后才使用
            Use(temp);
        }
        ```
        """;
        #endregion

        #region 访问修饰符
        public const string DocMarkdown_6 = """
        访问修饰符控制变量的可见性。

### 五种访问级别

        | 修饰符 | 访问范围 | 常用场景 |
        |--------|----------|----------|
        | `public` | 任何地方 | 公共 API、配置项 |
        | `private` | 仅在类内 | 内部实现细节 |
        | `protected` | 类内和子类 | 继承相关的数据 |
        | `internal` | 同一程序集 | 模块内部共享 |
        | `protected internal` | 子类或同一程序集 | 较少使用 |

        ```csharp
        public class AccessExample : ModItem
        {
            // 公共：外部可以访问
            public int PublicDamage = 50;
            
            // 私有：仅类内使用
            private int _privateCounter = 0;
            
            // 受保护：子类可以访问
            protected float ProtectedMultiplier = 1.5f;
            
            public void Attack()
            {
                // 可以访问所有变量
                _privateCounter++;
                int damage = PublicDamage * (int)ProtectedMultiplier;
            }
        }
        
        public class DerivedExample : AccessExample
        {
            public void Test()
            {
                // 可以访问 PublicDamage 和 ProtectedMultiplier
                // 不能访问 _privateCounter
            }
        }
        ```

        ### 属性（Getter/Setter）

        ```csharp
        public class PlayerStats
        {
            // 自动属性
            public int Health { get; set; }
            
            // 只读属性
            public int MaxHealth { get; private set; }
            
            // 计算属性
            public float HealthPercent => (float)Health / MaxHealth;
            
            // 带验证的属性
            private int _mana;
            public int Mana
            {
                get => _mana;
                set => _mana = Math.Clamp(value, 0, MaxMana);
            }
        }
        ```
        """;
        #endregion

        #region 数组基础
        public const string DocMarkdown_7 = """
        数组用于存储相同类型的多个元素。

        ### 声明和初始化

        ```csharp
        // 声明数组
        int[] numbers = new int[5];  // 5 个元素，默认值为 0
        
        // 声明并初始化
        int[] scores = new int[] { 100, 90, 85, 95 };
        int[] levels = { 1, 5, 10, 15, 20 };  // 简写
        
        // 多维数组
        int[,] grid = new int[3, 3];  // 3x3 网格
        int[,] map = { { 1, 2, 3 }, { 4, 5, 6 } };
        ```

        ### 访问和修改

        ```csharp
        int[] items = { 10, 20, 30, 40, 50 };

        // 访问（从 0 开始索引）
        int first = items[0];   // 10
        int third = items[2];   // 30
        
        // 修改
        items[1] = 25;  // 数组变为 { 10, 25, 30, 40, 50 }
        
        // 长度
        int count = items.Length;  // 5
        
        // 遍历
        for (int i = 0; i < items.Length; i++)
        {
            Console.WriteLine(items[i]);
        }
        ```

        ### 常用方法

        ```csharp
        int[] arr = { 3, 1, 4, 1, 5 };

        // 排序
        Array.Sort(arr);  // { 1, 1, 3, 4, 5 }

        // 查找
        int index = Array.IndexOf(arr, 4);  // 返回 3

        // 反转
        Array.Reverse(arr);  // { 5, 4, 3, 1, 1 }

        // 清空
        Array.Clear(arr, 0, arr.Length);  // 全部设为 0
        ```
        """;
        #endregion

        #region var 和 dynamic
        public const string DocMarkdown_8 = """
        var 和 dynamic 提供了更灵活的变量声明方式。

        ### var 关键字

        编译器自动推断类型，仍然是强类型。

        ```csharp
        // 编译器推断为 int
        var damage = 50;  // 等同于 int damage = 50;
        
        // 编译器推断为 string
        var name = "神剑";
        
        // 复杂类型
        var player = Main.player[Main.myPlayer];  // 推断为 Player
        
        // 必须在声明时初始化
        // var value;  // 错误！
        ```

        ### 何时使用 var

        ```csharp
        // 类型很明显时，使用 var 更简洁
        var list = new List<int>();  // 好
        List<int> list2 = new List<int>();  // 重复，较冗长
        
        // 类型不明显时，显式声明更好
        int damage = CalculateDamage();  // 清楚知道返回类型
        // var damage = CalculateDamage();  // 不清楚类型
        ```

        ### dynamic 关键字

        运行时确定类型，绕过编译器检查。

        ```csharp
        dynamic value = 10;
        value = "hello";  // 可以，运行时改变类型
        
        // 危险：编译时不会检查错误
        dynamic obj = GetSomeObject();
        obj.NonExistentMethod();  // 编译通过，运行时才报错
        ```

        ### dynamic 使用场景

        ```csharp
        // 与 COM 交互
        dynamic excel = Activator.CreateInstance(Type.GetTypeFromProgID("Excel.Application"));
        
        // 反射简化（但性能较差）
        dynamic item = GetItemByReflection();
        item.damage = 100;  // 等同于反射设置属性
        ```
        """;
        #endregion

        #region 本章要点（可引用）
        public const string DocMarkdown_9 = """
        - **const**：编译时常量，基本类型和字符串，隐式 static
        - **readonly**：运行时常量，任意类型，可在构造函数赋值
        - **static**：类级别变量，所有实例共享，通过类名访问
        - **作用域**：块级 < 方法级 < 类级，尽量缩小作用域
        - **访问修饰符**：public、private、protected 控制可见性
        - **数组**：存储多个同类型元素，索引从 0 开始
        - **var**：编译器推断类型，简化代码
        - **dynamic**：运行时类型，灵活但危险，慎用
        """;
        #endregion

        #region 常见坑（可引用）
        public const string DocMarkdown_10 = """
        ### 坑 1：static 变量生命周期

        ```csharp
        // static 变量在程序运行期间一直存在
        // 不要在 static 中存储大量数据，可能导致内存泄漏
        public static List<Item> AllItems = new List<Item>();  // 危险！
        ```

        ### 坑 2：const 不能是数组或对象

        ```csharp
        // 错误
        // public const int[] Values = { 1, 2, 3 };
        
        // 正确：使用 static readonly
        public static readonly int[] Values = { 1, 2, 3 };
        ```

        ### 坑 3：数组是引用类型

        ```csharp
        int[] a = { 1, 2, 3 };
        int[] b = a;  // b 引用同一个数组
        b[0] = 100;   // a[0] 也变成 100！
        
        // 如果需要副本
        int[] c = (int[])a.Clone();
        ```

        ### 坑 4：readonly 数组内容可修改

        ```csharp
        public static readonly int[] Config = { 1, 2, 3 };
        
        // 可以修改内容！
        Config[0] = 100;  // 成功了！
        
        // 解决方案：使用只读集合或 IReadOnlyList
        ```
        """;
        #endregion

        #region 下一步（可引用）
        public const string DocMarkdown_11 = """
        继续学习：

        1. **C# 方法** - 学习如何封装和组织代码逻辑
        2. **C# 类与对象** - 面向对象编程的核心概念
        3. **C# 继承与多态** - 代码复用和扩展的基础

        实践建议：重构之前的代码：
        - 将魔法数值改为 const
        - 使用 static 管理全局状态
        - 合理设置访问修饰符
        - 使用属性替代直接字段访问
        """;
        #endregion
#endif

        #region 示例代码：高级变量应用
        public class AdvancedVariableExample : Terraria.ModLoader.ModItem
        {
            // 常量
            public const int MaxLevel = 10;
            public const float BaseDamageMultiplier = 1.0f;
            
            // 静态变量：追踪所有该物品的实例数
            public static int InstanceCount = 0;
            
            // 只读：每个实例的唯一 ID
            public readonly int InstanceId;
            
            // 私有字段
            private int _currentLevel = 1;
            
            // 属性
            public int CurrentLevel
            {
                get => _currentLevel;
                set => _currentLevel = Math.Clamp(value, 1, MaxLevel);
            }
            
            public AdvancedVariableExample()
            {
                InstanceId = ++InstanceCount;
            }
            
            public override void SetDefaults()
            {
                Item.damage = (int)(50 * (1 + _currentLevel * 0.1f));
            }
        }
        #endregion
    }
}
