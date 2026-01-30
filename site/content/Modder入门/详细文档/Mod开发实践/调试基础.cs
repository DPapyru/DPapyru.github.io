using ModDocProject;
using Terraria.ModLoader;

namespace ModDocProject.Modder入门.详细文档.Mod开发实践 {
    #region 元数据
    /// <summary>学会读取日志、定位问题、使用调试工具</summary>
    [Title("调试基础 - 日志与问题定位")]
    [Tooltip("学会读取日志、定位问题、使用调试工具")]
    [UpdateTime("2026-01-30")]
    [Author("Papyru")]
    [Category("Modder入门")]
    [Topic("mod-dev")]
    [PrevChapter("第一个物品")]
    [NextChapter("调试实战")]
    #endregion
    public class 调试基础 : ModSystem {
#if DOCS
        #region 版本说明
        public const string DocMarkdown_0 = """
        > WARNING: 版本说明：本教程适用于 **tModLoader 1.4.4+**
        
        > 日志文件路径在不同版本可能略有变化，本教程基于 1.4.4 版本编写。

        兼容性说明：
        - 1.4.4+: 日志文件格式和位置与本文一致
        - 1.4.3 及更早: 某些日志字段可能不存在，建议更新到最新版
        """;
        #endregion

        #region 本章目标
        public const string DocMarkdown_1 = """
        调试不是"遇到问题才做的事"，而是开发过程中**持续进行的工作**。

        本章目标：
        - 找到并理解日志文件的位置和内容
        - 学会读取常见错误信息
        - 掌握基本的调试工具使用方法
        - 了解性能分析的基础知识

        最短排查流程：
        1. 打开 `client.log`（或 `latest.txt`）
        2. 搜索 `ERROR` / `Exception` / 你的 Mod 名称
        3. 找到第一段堆栈，定位到你的 `.cs` 文件与行号
        4. 回到 IDE，在对应位置加日志或断点验证

        预计用时：30-45 分钟（包括动手实践）
        """;
        #endregion

        #region 日志文件位置与读取
        public const string DocMarkdown_2 = """
        ### 什么是日志文件

        日志文件（Log File）是游戏运行时自动生成的文本文件，记录了所有操作、错误、警告等信息。

        当你的 Mod 出现问题时，日志文件是**最重要的诊断工具**。

        ### 不同操作系统下的日志路径

        #### Windows
        ```
        C:\Users\[你的用户名]\Documents\My Games\Terraria\tModLoader\Logs
        ```
        
        常见日志文件名：
        - `client.log` - 客户端日志（玩家端）
        - `server.log` - 服务器日志（多人游戏服务端）
        - `latest.txt` - 最新的运行日志（简化版）

        [这里应该有截图：Windows 文件资源管理器显示 Logs 目录]

        #### macOS
        ```
        ~/Library/Application Support/Terraria/Logs
        ```

        [这里应该有截图：macOS Finder 显示 Logs 目录]

        #### Linux
        ```
        ~/.local/share/Terraria/Logs
        ```

        ### 如何快速打开日志目录

        **方法1：通过游戏内菜单**
        1. 启动 tModLoader
        2. 在主菜单点击"设置"或"Options"
        3. 找到"打开日志文件夹"或"Open Logs Folder"选项
        4. 点击后系统会自动打开日志目录

        **方法2：通过 tModLoader 启动器**
        1. 右键点击 tModLoader（在 Steam 或快捷方式）
        2. 选择"打开文件位置"或类似选项
        3. 导航到 Mod 开发目录
        4. 进入 Logs 文件夹

        ### 日志文件的基本结构

        一个典型的日志文件包含以下内容：

        ```
        [2026-01-30 14:30:00.123] [INFO] tModLoader v1.4.4.9 开始初始化...
        [2026-01-30 14:30:01.456] [INFO] 正在加载 Mod: MyFirstMod
        [2026-01-30 14:30:02.789] [WARN] 检测到过期的 API 使用...
        [2026-01-30 14:30:03.012] [ERROR] 加载 MyItem 时发生错误: NullReferenceException
        ```
        
        日志格式说明：
        - `[时间戳]` - 精确到毫秒
        - `[级别]` - INFO（信息）、WARN（警告）、ERROR（错误）
        - 内容 - 具体的描述信息或错误堆栈
        """;
        #endregion

        #region 常见运行时错误与解决方案
        public const string DocMarkdown_3 = """
        ### 错误类型1：NullReferenceException（空引用异常）

        **错误信息示例**：
        ```
        [ERROR] NullReferenceException: Object reference not set to an instance of an object
        at MyMod.MyModItem.ModifyHitNPC(...) 在第 45 行
        ```

        **原因**：尝试访问一个为 `null` 的对象。

        **常见场景**：
1. 在 `SetDefaults` 里调用 `Main.player[0]`（此时玩家可能不存在）
        2. 直接使用可能为 `null` 的 ModItem 属性
        3. 数组索引越界导致返回 `null`

        **解决方法**：
        ```csharp
        // 错误示例
        public override void ModifyHitNPC(...) {
            var item = Main.LocalPlayer.HeldItem; // 可能为 null
            item.damage += 10; // 可能抛出 NullReferenceException
        }
        
        // 正确示例
        public override void ModifyHitNPC(...) {
            var item = Main.LocalPlayer?.HeldItem; // 使用 ? 操作符
            if (item != null && item.active) {
                item.damage += 10; // 先检查非空
            }
        }
        ```

        ### 错误类型2：IndexOutOfRangeException（索引越界异常）

        **错误信息示例**：
        ```
        [ERROR] IndexOutOfRangeException: Index was outside the bounds of the array
        at MyMod.MyNPC.SetDefaults(...) 在第 23 行
        ```

        **原因**：访问数组或列表时，索引超出有效范围。

        **常见场景**：
        1. 循环时没有正确判断边界
        2. 硬编码的索引值超出了实际数组大小
        3. NPC 或 Item 的数组索引无效

        **解决方法**：
        ```csharp
        // 错误示例
        public override void AI() {
            for (int i = 0; i <= 255; i++) { // 255 是最大有效索引，应该用 <
                if (Main.npc[i].active) {
                    // ...
                }
            }
        }
        
        // 正确示例
        public override void AI() {
            for (int i = 0; i < Main.npc.Length; i++) { // 使用数组长度
                NPC npc = Main.npc[i];
                if (npc != null && npc.active) {
                    // 处理 NPC
                }
            }
        }
        ```

        ### 错误类型3：FileNotFoundException（文件未找到异常）

        **错误信息示例**：
        ```
        [ERROR] FileNotFoundException: Could not find file "Items/MyItem.png"
        at MyMod.MyModItem.Load() 在第 12 行
        ```

        **原因**：代码试图加载不存在的文件。

        **常见场景**：
        1. 贴图文件名与代码中的类名不匹配
        2. 文件路径错误（大小写敏感）
        3. 文件不在正确的目录下

        **解决方法**：
        1. 检查文件名拼写（包括大小写）
        2. 确保文件在正确的目录（如 `Items/`、`NPCs/` 等）
        3. 确认文件格式正确（必须是 PNG）

        ### 错误类型4：MissingMethodException（方法缺失异常）

        **错误信息示例**：
        ```
        [ERROR] MissingMethodException: Method not found: 'MyMod.MyModItem.MyMethod()'
        at MyMod.MyModItem.Update(...) 在第 67 行
        ```

        **原因**：代码调用了一个不存在的方法或过时的 API。

        **常见场景**：
        1. 使用了旧版本的 API，在新版本中已被移除或重命名
        2. 方法名拼写错误
        3. 方法的访问修饰符不正确（如私有方法被外部调用）

        **解决方法**：
        1. 查阅 tModLoader 的最新 API 文档
        2. 使用 IDE 的"转到定义"功能查看方法的签名
        3. 更新到最新的 tModLoader 版本
        """;
        #endregion

        #region 调试工具使用
        public const string DocMarkdown_4 = """
        ### 工具1：日志输出（最基础也最有效）

        使用 `Mod.Logger` 或 `ModContent.GetInstance<MyMod>().Logger` 输出日志：

        ```csharp
        public override void SetDefaults() {
            Item.damage = 10;
            
            // 输出信息日志
            Mod.Logger.Info("正在初始化物品: " + Item.Name);
            
            // 输出调试日志
            Mod.Logger.Debug("物品伤害: " + Item.damage);
        }
        
        public override void OnHitNPC(...) {
            // 输出警告日志
            Mod.Logger.Warn("击中了 NPC: " + target.Name);
        }
        
        public override void Update(...) {
            if (Item.damage < 0) {
                // 输出错误日志
                Mod.Logger.Error("物品伤害为负数！这是异常情况。");
            }
        }
        ```

        **日志级别说明**：
        - `Info` - 一般信息，不影响程序运行
        - `Debug` - 调试信息，用于开发时追踪问题
        - `Warn` - 警告信息，程序可以继续运行但存在问题
        - `Error` - 错误信息，通常会导致异常

        ### 工具2：断点调试（需要 IDE 支持）

        在 Visual Studio 或 Rider 中使用断点：

        **步骤**：
        1. 在代码行号旁边点击，设置断点（红点）
        2. 在 IDE 中启动"调试"模式（按 F5）
        3. 当代码运行到断点时，会自动暂停
        4. 可以查看变量的值、调用堆栈等

        [这里应该有截图：Visual Studio 设置断点的界面]

        **注意事项**：
        - 断点调试主要用于 Mod 加载阶段和单机开发
        - 多人游戏时，断点可能会导致客户端/服务器不同步
        - 避免在频繁调用的方法（如 `AI`、`Update`）中设置断点

        ### 工具3：第三方 Mod

        使用 Hero's Mod 或其他调试 Mod：

        **Hero's Mod 功能**：
        1. 物品生成（快速获取你的 Mod 物品）
        2. 时空冻结（便于观察 AI 行为）
        3. 查看 NPC 和 Projectile 的属性
        4. 执行测试命令

        **安装方法**：
        1. 在 Mod Browser 中搜索 "Hero's Mod"
        2. 点击"启用"（Enable）
        3. 重启游戏

        **使用示例**：
        ```
        /spawnitem MyModName:MyItemName 1
        ```
        
        生成 1 个名为 `MyItemName` 的物品。
        """;
        #endregion

        #region 性能分析基础
        public const string DocMarkdown_5 = """
        ### 为什么需要性能分析

        当你的 Mod 出现以下问题时，就需要进行性能优化：
        1. 帧率明显下降（FPS 降低）
        2. 游戏卡顿（频繁的延迟）
        3. 加载时间过长
        4. 内存占用过高

        ### 基础性能分析工具

        **方法1：游戏内 FPS 显示**
        1. 按 `F3` 键打开调试显示
        2. 观察左上角的 FPS 数值
        3. 正常情况下应保持在 60 FPS

        [这里应该有截图：游戏内 F3 调试显示界面]

        **方法2：使用 Terraria 的调试模式**
        1. 在启动参数中添加 `-debug`（如果支持）
        2. 观察控制台输出的性能数据
        3. 查找占用 CPU 时间较长的方法

        **方法3：IDE 的性能分析器**
        1. Visual Studio: "调试" -> "性能分析器"
        2. Rider: "Run" -> "Profile"
        3. 记录一段时间后，查看哪些方法耗时最长

        ### 常见性能陷阱与优化

        **陷阱1：在 `AI` 方法中进行大量计算**
        
        ```csharp
        // 错误示例：每次 AI 都计算复杂的数学公式
        public override void AI() {
            for (int i = 0; i < 1000; i++) {
                // 复杂的数学运算
            }
        }
        
        // 优化示例：缓存计算结果
        private float cachedValue = -1;
        
        public override void AI() {
            if (cachedValue < 0) {
                // 只在第一次计算
                for (int i = 0; i < 1000; i++) {
                    // 计算并缓存
                }
            }
            // 使用缓存值
        }
        ```

        **陷阱2：频繁创建和销毁对象**

        ```csharp
        // 错误示例：每次 Update 都创建新对象
        public override void Update(...) {
            List<int> list = new List<int>(); // 每次都创建
            list.Add(123);
            // 使用 list
        }
        
        // 优化示例：重用对象
        private List<int> reusableList = new List<int>();
        
        public override void Update(...) {
            reusableList.Clear(); // 清空而不是新建
            reusableList.Add(123);
            // 使用 reusableList
        }
        ```

        **陷阱3：遍历所有 NPC/Item 进行判断**

        ```csharp
        // 错误示例：遍历所有 NPC
        public override void AI() {
            foreach (NPC npc in Main.npc) {
                // 对每个 NPC 进行复杂计算
            }
        }
        
        // 优化示例：限制搜索范围或缓存目标
        private NPC targetNPC = null;
        private int targetTimer = 0;
        
        public override void AI() {
            targetTimer++;
            if (targetTimer > 60) { // 每秒重新查找一次
                targetTimer = 0;
                float minDist = float.MaxValue;
                foreach (NPC npc in Main.npc) {
                    if (npc.active && npc.life > 0) {
                        float dist = Vector2.Distance(npc.Center, NPC.Center);
                        if (dist < minDist) {
                            minDist = dist;
                            targetNPC = npc;
                        }
                    }
                }
            }
            
            if (targetNPC != null) {
                // 使用缓存的目标 NPC
            }
        }
        ```
        """;
        #endregion

        #region 验证清单
        public const string DocMarkdown_6 = """
        ### 学习验证清单

        **阶段1：理解日志文件**
- 能找到日志文件的位置
- 能区分不同级别的日志（INFO/WARN/ERROR）
- 能根据时间戳定位问题发生的时间
- 能阅读基本的错误堆栈信息

**阶段2：常见错误识别**
- 能识别 `NullReferenceException` 并知道如何修复
- 能识别 `IndexOutOfRangeException` 并知道如何修复
- 能识别 `FileNotFoundException` 并知道如何修复
- 能识别 `MissingMethodException` 并知道如何修复

**阶段3：调试工具使用**
- 能在代码中添加日志输出
- 能在 IDE 中设置断点进行调试
- 会使用 Hero's Mod 获取测试物品
- 能通过日志定位问题发生的位置

**阶段4：性能分析基础**
- 知道如何查看游戏的 FPS
- 能识别常见的性能陷阱
- 了解基本的优化策略（缓存、对象复用、减少遍历）

### 下一步

完成本章学习后，你应该已经掌握了基础的调试技能。

接下来，我们将在《调试实战》中，通过具体的案例来练习调试技能，包括：
- 物品不工作的排查流程
- NPC 行为异常的排查流程
- 配方不工作的排查流程
- 多人游戏同步问题的排查流程

这些实战案例将帮助你将理论知识应用到实际开发中。
        """;
        #endregion
#endif
    }
}
