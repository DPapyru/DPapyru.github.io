using ModDocProject;

namespace ModDocProject.Modder入门学习.CSharp基础 {
    [Title("C# 变量与表达式")]
    [Tooltip("学习 C# 变量的声明、使用和各类表达式的计算")]
    [Author("OpenCode")]
    [UpdateTime("2026-01-30")]
    [Topic("csharp-variables")]
    [Order(30)]
    [Difficulty("beginner")]
    [Time("20分钟")]
    [PrevChapter(typeof(CSharp基础数据类型))]
    [NextChapter(typeof(CSharp控制流))]
    public class CSharp变量与表达式 {
#if DOCS
        #region 简介
        public const string DocMarkdown_1 = """
        本章目标：掌握 C# 变量的声明、赋值和使用方法，理解各种运算符和表达式的计算规则。

        变量是程序中最基本的存储单元，表达式则是计算和操作的组合。本章将带你深入了解如何在 tModLoader Mod 中正确使用它们。
        """;
        #endregion

        #region 变量声明与初始化
        public const string DocMarkdown_2 = """
        变量是用于存储数据的命名内存位置。

        ### 声明变量

        ```csharp
        // 语法：数据类型 变量名;
        int playerHealth;
        float weaponDamage;
        bool isAlive;
        string playerName;
        ```

        ### 初始化变量

        ```csharp
        // 声明时赋值
        int maxHealth = 100;
        float speed = 5.5f;
        
        // 先声明后赋值
        int currentHealth;
        currentHealth = maxHealth;
        ```

        ### 命名规范

        ```csharp
        // 推荐：使用有意义的名称
        int playerLevel;        // 好
        int pl;                 // 差，含义不明
        
        // 推荐：使用驼峰命名法
        int itemCount;          // 好
        int item_count;         // 不推荐（下划线）
        int ItemCount;          // 类/属性使用
        ```

        ### 同时声明多个变量

        ```csharp
        int x, y, z;
        int a = 1, b = 2, c = 3;
        
        // 甚至可以在一行
        int damage = 10, defense = 5, speed = 3;
        ```
        """;
        #endregion

        #region 算术运算符
        public const string DocMarkdown_3 = """
        算术运算符用于执行基本的数学运算。

        ### 基本运算符

        | 运算符 | 说明 | 示例 | 结果 |
        |--------|------|------|------|
        | `+` | 加法 | `5 + 3` | 8 |
        | `-` | 减法 | `5 - 3` | 2 |
        | `*` | 乘法 | `5 * 3` | 15 |
        | `/` | 除法 | `5 / 3` | 1（整数）|
        | `%` | 取模（余数） | `5 % 3` | 2 |

        ```csharp
        int damage = 50;
        int bonus = 10;
        int totalDamage = damage + bonus;  // 60
        
        float originalSpeed = 10f;
        float slowFactor = 0.5f;
        float newSpeed = originalSpeed * slowFactor;  // 5f
        ```

        ### 整数除法的陷阱

        ```csharp
        int a = 5;
        int b = 2;
        int result = a / b;  // 结果是 2，不是 2.5！
        
        // 如果需要小数结果
        float result2 = (float)a / b;  // 2.5f
        ```

        ### 复合赋值运算符

        ```csharp
        int health = 100;
        
        health += 20;   // 等同于 health = health + 20; 结果 120
        health -= 30;   // 结果 90
        health *= 2;    // 结果 180
        health /= 3;    // 结果 60
        health %= 7;    // 结果 4
        ```

        ### 自增自减

        ```csharp
        int count = 5;
        
        count++;  // 后置自增，先使用再增加
        ++count;  // 前置自增，先增加再使用
        
        // 注意区别
        int a = 5;
        int b = a++;  // b = 5, a = 6
        
        int c = 5;
        int d = ++c;  // d = 6, c = 6
        ```
        """;
        #endregion

        #region 比较与逻辑运算符
        public const string DocMarkdown_4 = """
        比较和逻辑运算符用于条件判断。

        ### 比较运算符

        | 运算符 | 说明 | 示例 | 结果 |
        |--------|------|------|------|
        | `==` | 等于 | `5 == 5` | true |
        | `!=` | 不等于 | `5 != 3` | true |
        | `<` | 小于 | `5 < 3` | false |
        | `>` | 大于 | `5 > 3` | true |
        | `<=` | 小于等于 | `5 <= 5` | true |
        | `>=` | 大于等于 | `5 >= 6` | false |

        ```csharp
        int playerHealth = 80;
        int maxHealth = 100;
        
        bool isHealthy = playerHealth > maxHealth * 0.5;  // true
        bool isFullHealth = playerHealth == maxHealth;     // false
        bool needsHealing = playerHealth < maxHealth;      // true
        ```

        ### 逻辑运算符

        | 运算符 | 说明 | 示例 |
        |--------|------|------|
        | `&&` | 逻辑与（AND） | `true && false` → false |
        | `||` | 逻辑或（OR） | `true || false` → true |
        | `!` | 逻辑非（NOT） | `!true` → false |

        ```csharp
        bool hasMana = true;
        bool hasCooldown = false;
        
        bool canCast = hasMana && !hasCooldown;  // true
        
        int health = 30;
        bool isCritical = health < 50 || health > 200;  // true
        ```

        ### 短路求值

        ```csharp
        // && 如果左边为 false，右边不会执行
        if (player != null && player.active)
        {
            // 安全检查，避免 NullReferenceException
        }
        
        // || 如果左边为 true，右边不会执行
        if (isAdmin || hasPermission)
        {
            // 只要有任意一个条件满足即可
        }
        ```
        """;
        #endregion

        #region 字符串操作
        public const string DocMarkdown_5 = """
        字符串是 Mod 开发中经常使用的类型。

        ### 字符串拼接

        ```csharp
        string itemName = "铜剑";
        int damage = 25;
        
        // 方法 1：使用 + 运算符
        string desc = "武器：" + itemName + "，伤害：" + damage;
        
        // 方法 2：使用 String.Format
        string desc2 = string.Format("武器：{0}，伤害：{1}", itemName, damage);
        
        // 方法 3：字符串插值（推荐）
        string desc3 = $"武器：{itemName}，伤害：{damage}";
        ```

        ### 字符串常用方法

        ```csharp
        string text = "Hello World";
        
        // 长度
        int len = text.Length;  // 11
        
        // 转换大小写
        string upper = text.ToUpper();   // "HELLO WORLD"
        string lower = text.ToLower();   // "hello world"
        
        // 检查包含
        bool hasHello = text.Contains("Hello");  // true
        
        // 替换
        string replaced = text.Replace("World", "Terraria");  // "Hello Terraria"
        
        // 截取
        string sub = text.Substring(0, 5);  // "Hello"
        
        // 分割
        string[] parts = "a,b,c".Split(',');  // ["a", "b", "c"]
        ```

        ### 字符串转数字

        ```csharp
        string input = "100";
        
        // 方法 1：Parse（失败会抛异常）
        int num = int.Parse(input);
        
        // 方法 2：TryParse（推荐，安全）
        if (int.TryParse(input, out int result))
        {
            // 转换成功，result 可用
        }
        
        // 方法 3：Convert
        int num2 = Convert.ToInt32(input);
        ```
        """;
        #endregion

        #region 运算符优先级
        public const string DocMarkdown_6 = """
        运算符有不同的优先级，影响计算顺序。

        ### 优先级表（从高到低）

        1. `()` 括号（最高）
        2. `++`, `--` 自增自减
        3. `*`, `/`, `%` 乘除模
        4. `+`, `-` 加减
        5. `<`, `>`, `<=`, `>=` 比较
        6. `==`, `!=` 等于不等于
        7. `&&` 逻辑与
        8. `||` 逻辑或
        9. `=` 赋值（最低）

        ```csharp
        int result = 5 + 3 * 2;      // 11，不是 16
        int result2 = (5 + 3) * 2;   // 16
        
        bool check = 5 > 3 && 2 < 4;  // true
        // 等同于 (5 > 3) && (2 < 4)
        ```

        ### 使用括号明确意图

        ```csharp
        // 即使知道优先级，也建议用括号增加可读性
        int damage = baseDamage + (strength * 2) + bonus;
        
        bool canAttack = hasWeapon && (mana >= cost) && !isStunned;
        ```
        """;
        #endregion

        #region 本章要点（可引用）
        public const string DocMarkdown_7 = """
        - **变量声明**：`类型 变量名 = 初始值;`，使用有意义的名称
        - **算术运算**：`+ - * / %`，注意整数除法会截断小数
        - **比较运算**：`== != < > <= >=`，结果是 bool
        - **逻辑运算**：`&& || !`，用于组合条件
        - **字符串**：使用 `$"...{变量}..."` 插值，使用 TryParse 安全转换
        - **运算符优先级**：括号 > 乘除 > 加减 > 比较 > 逻辑 > 赋值
        """;
        #endregion

        #region 常见坑（可引用）
        public const string DocMarkdown_8 = """
        ### 坑 1：赋值 vs 比较

        ```csharp
        // 错误：用了赋值而不是比较
        if (health = 0)  // 编译警告！将 0 赋值给 health
        
        // 正确
        if (health == 0)  // 比较 health 是否等于 0
        ```

        ### 坑 2：整数除法丢失精度

        ```csharp
        int result = 5 / 2;        // 结果是 2，不是 2.5！
        float result2 = 5 / 2;     // 结果还是 2！
        float result3 = 5f / 2;    // 正确：2.5f
        float result4 = (float)5 / 2;  // 正确：2.5f
        ```

        ### 坑 3：字符串比较用 ==

        ```csharp
        // 在 C# 中，字符串可以用 == 比较内容
        string a = "hello";
        string b = "hello";
        bool equal = (a == b);  // true（比较内容）
        
        // 但某些情况下要用 Equals
        bool equal2 = a.Equals(b);  // 更明确
        ```

        ### 坑 4：逻辑运算符优先级

        ```csharp
        // 错误理解
        bool result = true || false && false;  // 结果是 true
        // 实际等同于：true || (false && false) = true || false = true
        
        // 应该用括号明确
        bool result2 = (true || false) && false;  // false
        ```
        """;
        #endregion

        #region 下一步（可引用）
        public const string DocMarkdown_9 = """
        继续学习：

        1. **C# 控制流** - 学习 if、switch、循环等控制结构
        2. **C# 变量更多内容** - 深入了解 const、static、作用域等
        3. **C# 方法** - 学习如何封装代码逻辑

        实践建议：编写一个小程序，计算玩家属性（伤害、防御、速度），使用各种运算符组合计算最终数值。
        """;
        #endregion
#endif

        #region 示例代码：伤害计算
        public class DamageCalculator
        {
            public int CalculateDamage(int baseDamage, int strength, int weaponBonus, float critMultiplier)
            {
                // 基础伤害 + 力量加成 + 武器加成
                int total = baseDamage + (strength * 2) + weaponBonus;
                
                // 应用暴击倍率
                float finalDamage = total * critMultiplier;
                
                return (int)finalDamage;
            }
            
            public string GetDamageReport(string weaponName, int damage)
            {
                return $"武器 [{weaponName}] 造成 {damage} 点伤害！";
            }
        }
        #endregion
    }
}
