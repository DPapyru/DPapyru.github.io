---
title: C#面向对象基础
author: 小天使
date: 2026-01-26
last_updated: 2026-01-26
difficulty: beginner
time: 15分钟
description: 介绍C#的面向对象基础概念
prev_chapter: CSharp数组与集合.md
next_chapter: null
topic: know-csharp
---

本章介绍 C# 面向对象编程的基础概念，这是 tModLoader Mod 开发中常用的组织方式。

# 代码部分

```csharp
// 先给一个简单的 tModLoader 相关示例
public class MagicalSword : ModItem
{
    private int baseDamage = 15;           // 基础伤害
    private float manaCost = 5f;            // 魔法消耗
    private string swordName = "魔法之剑";     // 剑的名称
    
    public override void SetDefaults()
    {
        item.damage = baseDamage;          // 设置伤害
        item.mana = (int)manaCost;          // 设置魔法消耗
        item.UseSound = SoundID.Item1;       // 设置使用音效
    }
    
    public override void UseItem(Player player)
    {
        // 重写使用物品的效果
        player.statMana -= (int)manaCost;   // 消耗魔法
        Main.NewText($"使用了{swordName}，消耗了{manaCost}点魔法");
    }
    
    public override void AddTooltipLines(ItemSlotDiceContext ctx, List<TooltipLine> lines)
    {
        lines.Add(new TooltipLine(Mod, "ModItem", $"伤害: {baseDamage}"));
        lines.Add(new TooltipLine(Mod, "ModItem", $"魔法消耗: {manaCost}"));
        lines.Add(new TooltipLine(Mod, "ModItem", $"类型: {swordName}"));
    }
}
```

# 类与对象

## 基本概念

在C#中，面向对象编程是最核心的设计思路。我们C#的一等公民就是类和对象：

```csharp
// 类的定义 - 蓝图
public class PlayerClass
{
    // 字段 - 对象的属性
    private string playerName;
    private int health;
    private float mana;
    private int level;
    
    // 属性 - 字段的访问器
    public string PlayerName { get; set; }
    public int Health { get; set; }
    public int Level { get; set; }
    
    // 构造函数 - 初始化对象
    public PlayerClass(string name)
    {
        PlayerName = name;
        Health = 100;
        mana = 50f;
        Level = 1;
        
        Main.NewText($"创建了玩家: {name}");
    }
    
    // 方法 - 对象的行为
    public void Attack(int damage)
    {
        Main.NewText($"{PlayerName} 进行了攻击，造成 {damage} 点伤害");
    }
    
    public void TakeDamage(int damage)
    {
        Health -= damage;
        if (Health <= 0)
        {
            Health = 0;
            Main.NewText($"{PlayerName} 被击败了！");
        }
    }
    
    public void LevelUp()
    {
        Level++;
        Health += 20;
        Main.NewText($"{PlayerName} 升级到了 {Level} 级！");
    }
}

// 在tModLoader中的使用
public class PlayerClassExample : ModPlayer
{
    public override void ResetEffects()
    {
        // 创建玩家对象
        PlayerClass player = new PlayerClass("冒险者");
        player.Attack(25);
        player.TakeDamage(10);
        player.LevelUp();
    }
}
```

类可以理解为蓝图，对象是具体实例。以 Mod 开发为例，`ModItem` 是一个类，每把具体的武器是该类的实例。类定义属性（伤害、魔法消耗等），对象提供具体数值与状态。

### tModLoader中的类与对象

```csharp
public class ItemClassExample : ModItem
{
    // 对象的私有字段
    private string internalName = "MagicalStaff";
    private int baseDamage = 20;
    private float projectileSpeed = 12f;
    private bool hasSpecialEffect = false;
    
    // 公共属性
    public string ItemDescription { get; private set; }
    public int TotalDamage { get; private set; }
    public Rarity RarityLevel { get; set; }
    
    // 静态字段 - 类级别
    private static int totalItemsCreated = 0;
    private static readonly string ModName = "魔法武器模组";
    
    public override void SetDefaults()
    {
        // 设置基础属性
        item.damage = baseDamage;
        item.mana = 15;
        item.noMelee = true;
        item.channel = true;
        item.shoot = ProjectileID.MagicMissile;
        item.shootSpeed = projectileSpeed;
        item.rare = ItemRarityID.Purple;
        
        // 初始化属性
        ItemDescription = "一把施法距离很远的魔法杖";
        TotalDamage = baseDamage;
        
        // 静态字段的使用
        totalItemsCreated++;
        Main.NewText($"已创建 {totalItemsCreated} 个魔法物品");
        
        Main.NewText($"模组名称: {ModName}");
    }
    
    public override void UseItem(Player player)
    {
        // 对象方法的使用
        player.statMana -= item.mana;
        
        if (hasSpecialEffect)
        {
            Main.NewText("触发了特殊效果！");
        }
    }
    
    // 静态方法
    public static void ShowModInfo()
    {
        Main.NewText($"模组: {ModName}");
        Main.NewText($"已创建物品数: {totalItemsCreated}");
    }
    
    public override void AddRecipes()
    {
        Recipe recipe = Recipe.Create(item.type);
        recipe.AddIngredient(ItemID.Wood, 10);
        recipe.AddIngredient(ItemID.ManaCrystal, 5);
        recipe.AddTile(TileID.WorkBenches);
        recipe.Register();
    }
}
```

这个例子展示了 tModLoader 中面向对象的基本使用方式。Mod 开发中通常会创建很多类，每个类代表一个物品、一个 NPC、一个任务等。每个类包含字段、属性和方法，这些是面向对象编程的核心概念。

## 继承

### 基本继承

继承是面向对象的核心特性之一，让类可以继承另一个类的功能：

```csharp
// 基类 - 父类
public class BaseItem
{
    protected int baseDamage = 10;
    protected float baseSpeed = 5f;
    protected string baseName = "基础物品";
    
    public virtual void SetDefaults()
    {
        Main.NewText($"基础物品设置完成: {baseName}");
    }
    
    public virtual void Attack(int damage)
    {
        Main.NewText($"{baseName} 进行了攻击，造成 {damage} 点伤害");
    }
}

// 派生类 - 子类
public class SwordItem : BaseItem
    {
        private string swordType;
        private float extraDamage = 5f;
        
        // 构造函数
        public SwordItem(string type)
        {
            swordType = type;
            baseName = $"{swordType}之剑";
        }
        
        // 重写父类方法
        public override void SetDefaults()
        {
            base.SetDefaults();  // 调用父类的方法
            baseDamage += (int)extraDamage;  // 添加额外的伤害
            
            Main.NewText($"剑型武器设置完成: {baseName}, 伤害: {baseDamage}");
        }
        
        public override void Attack(int damage)
        {
            base.Attack(damage + baseDamage);  // 增加额外的伤害
            Main.NewText($"{baseName} 发挥了剑的优势！");
        }
        
        // 派生类特有的方法
        public void Parry()
        {
            Main.NewText($"{baseName} 进行了格挡，减少了伤害");
        }
    }
    
    // 多层继承
    public class MagicSword : SwordItem
    {
        private string magicElement = "火焰";
        
        public MagicSword() : base("魔法")  // 调用父类的构造函数
        {
            baseName = $"{magicElement}{baseName}";
        }
        
        // 进一步重写方法
        public override void Attack(int damage)
        {
            base.Attack(damage);
            Main.NewText($"{baseName} 附加了 {magicElement} 伤害！");
        }
        
        // 派生类特有的魔法方法
        public void CastMagicSpell()
        {
            Main.NewText($"{baseName} 施放了 {magicElement} 魔法！");
        }
    }
    
    // 在tModLoader中的使用
    public class InheritanceExample : ModItem
    {
        public override void SetDefaults()
        {
            // 创建不同类型的武器对象
            SwordItem sword = new SwordItem("铁");
            SwordItem magicSword = new MagicSword();
            
            sword.SetDefaults();
            magicSword.SetDefaults();
            
            sword.Attack(15);
            magicSword.Attack(20);
            
            magicSword.CastMagicSpell();  // 调用魔法剑特有的方法
            magicSword.Parry();          // 调用剑共有的方法
        }
    }
```

继承在 tModLoader 中使用非常普遍。例如 `ModItem` 是物品的基类，你创建的物品类会继承 `ModItem`。继承可以复用通用逻辑：在基类中定义一次，子类即可使用；同时也可以通过重写 `SetDefaults()`、`AddTooltipLines()` 等方法实现差异化行为。

### 继承的最佳实践

```csharp
// 基类：基础武器
public abstract class BaseWeapon : ModItem
{
    protected WeaponType weaponType;
    protected int baseDamage;
    protected float baseSpeed;
    
    public override void SetDefaults()
    {
        // 设置所有武器共有的属性
        item.damage = baseDamage;
        item.useTime = (int)(baseSpeed * 20);
        item.useAnimation = (int)(baseSpeed * 20);
        item.useStyle = ItemUseStyleID.HoldingOut;
    }
    
    public abstract WeaponType GetWeaponType();  // 抽象方法，子类必须实现
}

// 剑类武器
public class SwordWeapon : BaseWeapon
{
    public SwordWeapon()
    {
        weaponType = WeaponType.Sword;
        baseDamage = 15;
        baseSpeed = 5f;
    }
    
    public override WeaponType GetWeaponType()
    {
        return weaponType;
    }
    
    public override void SetDefaults()
    {
        base.SetDefaults();
        item.melee = true;  // 剑是近战武器
        item.noMelee = false;
        Main.NewText($"剑型武器设置完成，伤害: {baseDamage}");
    }
}

// 法杖类武器
public class StaffWeapon : BaseWeapon
{
    public StaffWeapon()
    {
        weaponType = WeaponType.Staff;
        baseDamage = 20;
        baseSpeed = 7f;
    }
    
    public override WeaponType GetWeaponType()
    {
        return weaponType;
    }
    
    public override void SetDefaults()
    {
        base.SetDefaults();
        item.magic = true;   // 法杖是魔法武器
        item.mana = 10;
        item.noMelee = true;
        Main.NewText($"法杖武器设置完成，伤害: {baseDamage}");
    }
}

// 使用示例
public class InheritanceBestPractice : ModPlayer
{
    public override void ResetEffects()
    {
        // 创建不同类型的武器
        BaseWeapon sword = new SwordWeapon();
        BaseWeapon staff = new StaffWeapon();
        
        sword.SetDefaults();
        staff.SetDefaults();
        
        // 多态性
        BaseWeapon[] weapons = { sword, staff };
        foreach (BaseWeapon weapon in weapons)
        {
            Main.NewText($"武器类型: {weapon.GetWeaponType()}");
        }
    }
}

public enum WeaponType
{
    Sword,
    Staff,
    Bow,
    Gun
}
```

继承可以让代码结构更清晰。Mod 开发中，你可以通过继承创建不同类型的物品：例如剑类偏近战、法杖类偏魔法，它们可以共享基类逻辑，同时保留各自实现。

## 接口

### 接口的基本概念

接口定义了一组方法的规范，但不提供实现：

```csharp
// 定义接口 - 规范
public interface IDamagable
{
    void TakeDamage(int damage);
    int GetCurrentHealth();
    bool IsAlive();
}

// 定义接口 - 可交互的物品
public interface IUsableItem
{
    void Use(Player player);
    bool CanUse(Player player);
    string GetDescription();
}

// 实现接口的类
public class Player : IDamagable
{
    private int health = 100;
    private string playerName;
    
    public Player(string name)
    {
        playerName = name;
        Main.NewText($"创建了玩家: {name}");
    }
    
    public void TakeDamage(int damage)
    {
        health -= damage;
        Main.NewText($"{playerName} 受到 {damage} 点伤害，剩余生命: {health}");
    }
    
    public int GetCurrentHealth()
    {
        return health;
    }
    
    public bool IsAlive()
    {
        return health > 0;
    }
}

// 可使用的物品
public class HealingPotion : ModItem, IUsableItem
{
    private int healAmount = 50;
    private string description = "回复50点生命值";
    
    public void Use(Player player)
    {
        player.statLife += healAmount;
        if (player.statLife > player.statLifeMax)
        {
            player.statLife = player.statLifeMax;
        }
        Main.NewText($"使用了治疗药水，回复了 {healAmount} 点生命值");
    }
    
    public bool CanUse(Player player)
    {
        return player.statLife < player.statLifeMax;
    }
    
    public string GetDescription()
    {
        return description;
    }
    
    public override void SetDefaults()
    {
        item.width = 20;
        item.height = 30;
        item.maxStack = 30;
        item.value = Item.buyPrice(0, 1);
        item.rare = ItemRarityID.Green;
    }
    
    public override bool CanUseItem(Player player)
    {
        return CanUse(player);  // 调用接口方法
    }
    
    public override void UseItem(Player player)
    {
        Use(player);  // 调用接口方法
    }
    
    public override void AddTooltipLines(ItemSlotDiceContext ctx, List<TooltipLine> lines)
    {
        lines.Add(new TooltipLine(Mod, "Description", GetDescription()));
    }
}

// 使用多个接口
public interface ISellable
{
    int GetPrice();
    string GetShopDescription();
}

public class EquipmentItem : ModItem, IUsableItem, ISellable
{
    public void Use(Player player)
    {
        Main.NewText("装备了物品");
    }
    
    public bool CanUse(Player player)
    {
        return true;  // 装备物品总是可以使用的
    }
    
    public string GetDescription()
    {
        return "一件强力装备";
    }
    
    public int GetPrice()
    {
        return Item.buyPrice(0, 10);  // 10金币
    }
    
    public string GetShopDescription()
    {
        return $"价格: {GetPrice()}";
    }
    
    public override void AddTooltipLines(ItemSlotDiceContext ctx, List<TooltipLine> lines)
    {
        lines.Add(new TooltipLine(Mod, "Description", GetDescription()));
        lines.Add(new TooltipLine(Mod, "Price", GetShopDescription()));
    }
}
```

接口用于定义“必须实现哪些方法”的规范。Mod 开发中可以用接口抽象共同特性，例如 `IUsableItem` 规定可使用物品必须提供 `Use()`、`CanUse()` 等方法。只要实现接口，就可以用统一方式处理不同实现，从而提升扩展性。

## 多态性

多态性是指不同对象对同一消息的不同响应：

```csharp
// 定义基础接口
public interface ICombatBehavior
{
    void Combat();
    string GetBehaviorName();
}

// 不同的战斗行为
public class AggressiveBehavior : ICombatBehavior
{
    public void Combat()
    {
        Main.NewText("采取了激进的战斗策略，主动攻击！");
    }
    
    public string GetBehaviorName()
    {
        return "激进型";
    }
}

public class DefensiveBehavior : ICombatBehavior
{
    public void Combat()
    {
        Main.NewText("采取了防御的战斗策略，固守阵地！");
    }
    
    public string GetBehaviorName()
    {
        return "防御型";
    }
}

public class TacticalBehavior : ICombatBehavior
{
    public void Combat()
    {
        Main.NewText("采取了战术的战斗策略，寻找机会！");
    }
    
    public string GetBehaviorName()
    {
        return "战术型";
    }
}

// 使用多态的类
public class CombatUnit
{
    private ICombatBehavior behavior;
    private string unitName;
    
    public CombatUnit(string name, ICombatBehavior combatBehavior)
    {
        unitName = name;
        behavior = combatBehavior;
        Main.NewText($"创建了战斗单位: {name}, 战斗风格: {behavior.GetBehaviorName()}");
    }
    
    public void ChangeBehavior(ICombatBehavior newBehavior)
    {
        behavior = newBehavior;
        Main.NewText($"{unitName} 改变了战斗风格为: {behavior.GetBehaviorName()}");
    }
    
    public void ExecuteCombat()
    {
        behavior.Combat();  // 多态调用
    }
}

// 在tModLoader中的应用
public class PolymorphismExample : ModItem
{
    public override void SetDefaults()
    {
        // 创建不同的战斗行为
        ICombatBehavior[] behaviors = 
        {
            new AggressiveBehavior(),
            new DefensiveBehavior(),
            new TacticalBehavior()
        };
        
        // 创建战斗单位
        CombatUnit playerUnit = new CombatUnit("玩家", behaviors[0]);
        CombatUnit enemyUnit = new CombatUnit("敌人", behaviors[1]);
        
        // 执行战斗
        Main.NewText("--- 开始战斗 ---");
        playerUnit.ExecuteCombat();
        enemyUnit.ExecuteCombat();
        
        // 改变战斗风格
        Main.NewText("--- 改变战斗风格 ---");
        playerUnit.ChangeBehavior(new TacticalBehavior());
        enemyUnit.ChangeBehavior(new AggressiveBehavior());
        
        playerUnit.ExecuteCombat();
        enemyUnit.ExecuteCombat();
        
        Main.NewText("--- 战斗结束 ---");
    }
}
```

多态性是指同一个接口或方法在不同对象上表现出不同的行为。上面的例子中，`Combat()` 在激进型、防御型、战术型单位上有不同实现。Mod 开发中，多态常用于组织不同 AI 行为或效果逻辑：实现不同，但调用方式一致。

## 小结

本文涵盖了C#面向对象的核心知识点：

### 类与对象相关
- **类和对象**：类是蓝图，对象是实例。每个对象都有字段、属性和方法
- **tModLoader中的应用**：ModItem、ModPlayer等都是类，每把武器、每个NPC都是对象
- **静态成员**：属于类而不是对象，所有对象共享同一份数据

### 继承相关
- **基本继承**：子类继承父类的所有功能，可以重写父类的方法
- **多层继承**：子类可以再被继承，形成继承层次结构
- **抽象类和接口**：定义规范但不提供实现，让代码更加模块化

### 接口相关
- **接口定义**：规定类必须实现的方法，但不提供具体实现
- **多接口实现**：一个类可以实现多个接口，提供不同的功能
- **接口的优势**：让代码更加灵活，支持多重继承的效果

### 多态性相关
- **多态调用**：同一个方法在不同对象上有不同的行为
- **运行时绑定**：在程序运行时才确定具体调用哪个方法
- **代码灵活性**：通过多态可以实现更加灵活和可扩展的代码

面向对象编程是 C# 的核心概念，也是 tModLoader Mod 开发的基础。类、对象、继承、接口、多态等概念会在实际项目中反复出现。本文到这里，你可以结合后续实践章节继续巩固。
