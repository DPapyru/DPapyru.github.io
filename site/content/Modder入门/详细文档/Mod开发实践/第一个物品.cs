using ModDocProject;
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace ModDocProject.Modder入门.详细文档.Mod开发实践 {
    #region 元数据
    /// <summary>创建基础武器物品并在游戏中验证</summary>
    [Title("第一个物品 - 创建基础武器")]
    [Tooltip("创建基础武器物品并在游戏中验证")]
    [UpdateTime("2026-01-28")]
    [Author("Papyru")]
    [Category("Modder入门")]
    [Topic("mod-dev")]
    [PrevChapter("第一个模组")]
    #endregion
    public class 第一个物品 : ModItem {
#if DOCS
        #region 本章目标
        public const string DocMarkdown_1 = """
        本章目标：写出一个最基础的 `ModItem`，并在游戏里能拿到它、能挥动它、能合成它。

        你会在后续几乎所有内容里复用这一套结构：`SetDefaults` +（可选）`AddRecipes`。
        """;
        #endregion

        #region 第一步：创建物品类
        public const string DocMarkdown_2 = """
        创建一个继承 `ModItem` 的类。

        关键点：
        - 类名建议和文件名一致（便于教程索引与跳转）
        - 先把 `SetDefaults` 写出来并能编译，再逐步加属性
        """;
        #endregion

        #region 第二步：设置属性（SetDefaults）
        public const string DocMarkdown_3 = """
        `SetDefaults` 里最常改的几类属性：
        - 尺寸/价值/稀有度：`width/height/value/rare`
        - 伤害与类型：`damage` + `DamageType`
        - 使用手感：`useTime/useAnimation/useStyle/UseSound/autoReuse`

        初学建议：一次只改一组属性，然后进游戏验证效果，别“写一大坨最后一起试”。
        """;
        #endregion

        #region 第三步：加一个合成配方（AddRecipes）
        public const string DocMarkdown_4 = """
        `AddRecipes` 用来注册配方。现在最推荐的写法是链式调用：
        - `CreateRecipe()`
        - `AddIngredient(...)`
        - `AddTile(...)`
        - `Register()`

        先用最简单的材料与工作台验证流程，再慢慢改成你想要的配方。

        下面就是一个“基础近战武器 + 配方”的完整示例代码，你可以先照抄，确保流程跑通。
        """;
        #endregion
#endif

        #region 示例代码：基础武器物品
        public override void SetDefaults() {
            // 基础属性
            Item.width = 20;
            Item.height = 20;
            Item.maxStack = 1;
            Item.value = Item.buyPrice(silver: 1);
            Item.rare = ItemRarityID.Blue;

            // 作为武器的核心属性
            Item.damage = 10;
            Item.DamageType = DamageClass.Melee;
            Item.knockBack = 2f;

            // 使用手感
            Item.useTime = 20;
            Item.useAnimation = 20;
            Item.useStyle = ItemUseStyleID.Swing;
            Item.UseSound = SoundID.Item1;
            Item.autoReuse = true;
        }

        public override void AddRecipes() {
            CreateRecipe()
                .AddIngredient(ItemID.DirtBlock, 10)
                .AddTile(TileID.WorkBenches)
                .Register();
        }
        #endregion

#if DOCS
        #region 验证与常见问题
        public const string DocMarkdown_5 = """
        验证清单：
        - build 通过
        - 进游戏能加载你的 Mod
        - 物品能合成（或通过调试/测试方式拿到）
        - 挥动/音效/伤害符合预期

        常见问题：
        - 贴图/语言没配置导致显示异常（先不处理也能验证逻辑）
        - `useTime/useAnimation` 写得太小/太大导致手感奇怪（先用 20 作为基准）
        """;
        #endregion
#endif
    }
}
