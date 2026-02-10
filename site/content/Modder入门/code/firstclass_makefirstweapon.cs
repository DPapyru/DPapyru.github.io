using Terraria.ModLoader;

// 命名空间,默认情况下,贴图存放路径需要和命名空间对应
namespace ModDocProject.ModsSource.Modder入门
{
    // 类名,默认情况下,贴图名字需要和类名对应
    public class FirstClass_MakeFirstWeapon : ModItem
    {
        public override void SetDefaults()
        {
            Item.width = Item.height = 32; // 物品在世界的宽度，不影响手持
            Item.damage = 30; // 物品的伤害
            Item.knockBack = 1f; // 物品的击退力
            Item.crit = 5; // 物品的暴击率，默认暴击率+4%，所以这里其实是9%的暴击率
            Item.useAnimation = Item.useTime = 30; // 使用物品的动画速度/使用物品的使用速度
            // 上面的内容划分后面会讲
        }

        public override void AddRecipes()
        {

        }
    }
}
