---
title: 制作一个类似MC的工作台
author: MoKou
topic: article-contribution
description: 制作一个类似MC的工作台
order: 100
difficulty: intermediate
time: 35分钟
---

# 制作一个类似MC的工作台

学会制作一个类似MC的工作台

## 开始学习吧！(底下的中文方法名以及中文类名啥的都是为了便于阅读的 别抄这个)

### 在遇到一个需求的时候 我们要学会拆分需求 把他变成多个小需求 一步步完成
1. 配方表(由于泰拉的许多配方材料数量都过多了 我们就把这些奇怪的小东西写给自己的模组吧)
> 这个没什么好说的 一个存储结构存储东西就行
> 同时 一个物品可能存在这多个材料 为了方便我们进行材料对比 我们使用字典来存储物品对应的材料
2. 制作一个工作台的UI
> 需要包含数个ItemSlot (输入栏 输出栏)
3. 随便弄一个工作台的物块()
> 存储UI实例或者存储跟UI绑定的Item的实例

{color:primary}{第一步 完成一个完整的配方表类}

字段定义
```csharp
public class 配方表名
{
    public List<Item> 材料表//用于存储材料的列表;
    public Item 成果//UI那边的ItemSlot里面存储材料对比成功后的返回值;
    public static List<配方表名> 大配方表//用于存储所有物品配方的大配方表;
}
```
以上是一个简单的配方表的字段 如果你想要给制作这个成果加条件的话 我们可以加一个
```csharp
    public List<bool> 条件//需要满足的条件
```
再就是注册配方和添加配方材料 条件 以及配方本身的方法了 我快速完成
```csharp
    public static 配方表名 方法名(int ItemType,int stack)//给对应的ItemType 生成一个配方表 并且写出返回的数量
    {
        配方表名 配方表实例 = new();
        实例.成功 = new(ItemType){stack = stack};
        return 实例
    }
    public 配方表名 添加材料方法(int ItemType)//给配方表的材料表添加材料
    {
        实例.材料表.Add(new Item(ItemType));
        return this
    }
    //添加条件同理 这里就不给代码了
    public void 把该配方添加至大配方表() => 大配方表.Add(this); //讲配方添加至大配方表里面
```
以上 就完成了配方的代码 是不是很简单 然后我们需要思考 如何用UI里面的材料表 在这个大配方表里面搜索 然后返回对应的成果了

列表是有序的 也就导致物品的材料必须和材料表里面的顺序一样 我们可以用无序存储结构 来转换材料表和你传入的材料表 也就是字典 让材料可以无视顺序 下面给出代码
(为什么字典是无序的？ 因为字典的构成是 Key对Value 一种伪无序 别的下面会说 慢慢看)
```csharp
    public static bool 根据传入的材料表返回成果(List<Item> 材料表,out Item 返回成果)
    {
        //这是一个把列表转换为字典的方法 其中以Item的type为Key Item的出现数量为Value 什么是出现数量？ 打个比方 如果在材料表 中出现了3个 ItemA 你不能再一个栏位里面放数量为3的Item 而是在3个ItemSlot里面放入ItemA
        var Dir1=材料表.GroupBy(x=>x.type).ToDictionary(g=>g.Key,g=>g.Count());
        foreach(var 配方 in 大配方表)
        {
            var Dir2 = 配方.材料表.GroupBy(x=>x.type).ToDictionary(g=>g.Key,g=>g.Count());
            //All()是Dir1 中每一个键值对，只有当所有元素都满足条件时才返回true
            if(Dir1.Count==Dir2.Count&&Dir1.All(kv=>Dir2.TryGetValue(kv.Key,out int count)&&count==kv.Value))
            {
                返回成果 = 配方.成果;
                return true;
            }
        }
        返回成果 = new Item();//问我为什么写这个？
        return false;
    }
```
以上就完成了一个完整的配方表类的代码 包含{成果添加 材料添加 添加至大配方表 搜索配方对应成果}
课后作业:完善配方表 设置配方需要的数量 比如 ItemA 出现三次 分别要求数量为1 2 3

{color:primary}{第二步 制作一个ItemSlot/或者制作一个大UI}

思考一下 一个工作台的UI 似乎对应着九个材料栏位 一个 成果栏位 嗯~ 我是不是忘记写材料添加上限了！！！ 这个自己添加(
这是教程 怎么简单怎么来 我们只做一堆ItemSlot就行 OK 需求明确 让我们来制作一个ItemSlot吧！(我选择UI只用作显示 所有的数值全部存储在物块里面 便于修改)

{color:Mad}{ItemSlot原版存在 写这个是为了方便你看懂 类名记得改了}

字段设置
```csharp
public class ItemSlot : UIElement//这里我选择继承tml给的API 用来制作一个ItemSlot 如果想自己做一个的话 记住 一个ItemSlot 就是能存储一个Item 然后绘制他的UI而已
{
    private Func<Item> _getItem;
    private Action<Item> _setItem;
    private readonly int _context;
    private readonly float _scale;
    private Func<Item,bool> _canAcceptItem;
    private Player _player;
    public bool press;//用于后面判定玩家是否按下左键
}//你问我 _ 是干什么的？ 只是个命名规范 私人字段前面加个_(
```
然后构造函数
```csharp
    public ItemSlot(int context=ItemSlot.Context.BankItem;float scale = 1f;)
    {
        _context = context;
        _scale = scale;
        _player = Main.locaPlayer;
        Width.Set(TextureAssets.InventoryBack9.Value.Width * scale,0f);
        Height.Set(TextureAssets.InventoryBack9.Value.Height * scale,0f);
    }//构造函数里面的context代表了一个物品栏样式 比如我给的是存钱罐里面的
```
现在设置一些方法 比如传入物品禁令 (上面的那个哪些物品可以放入 哪些不能) 这个东西还是挺好用的
```csharp
    //设置能接受的Item
    public void SetAcceptItem(Func<Item,bool> canAcceptItem)
    {
        _canAcceptItem = canAcceptItem;
    }
    // 设置获取Item和设置Item的方法()
    public void SetItemAccessor(Func<Item> getItem,Action<Item> setItem)
    {
        _getItem = getItem;
        _setItem = setItem;
    }
```
以上完成了设置方法 现在开始制作物品交换和绘制吧！上面的东西全部显示的话有点多
```csharp
protected override void DrawSelf(SpriteBatch spriteBatch)
{
    float oldScale = Main.inventoryScale;        // 保存全局缩放值
    Main.inventoryScale = _scale;                // 临时设置为槽位自定义缩放
    Rectangle rectangle = GetDimensions().ToRectangle();  // 获取槽位的屏幕矩形区域
    Item item = _getItem();// 通过闭包获取槽位中的物品引用
    try
    {
        if (!ContainsPoint(Main.MouseScreen) || PlayerInput.IgnoreMouseInterface)//当鼠标不在Slot上面的时候直接绘制
        {
            ItemSlot.Draw(spriteBatch, ref item, _context, rectangle.TopLeft());
            return;
        }
        _player.mouseInterface=true;//开启该玩家UI交互状态

        Item slotItem = _getItem();      // 重新获取槽位物品
        Item mouseItem = Main.mouseItem;  // 鼠标拖拽的物品

        if(PlayerInput.MouseInfo.LeftButton == ButtonState.Pressed && !press)//判断鼠标按下 按下后记录press为ture 然后在左键松开时转变为false 防止每帧执行
        {
            press=true;//按下记录为true
            if(!mouseItem.IsAir&&!CanAcceptItem(mouseItem))//当玩家手上不空并且手上的东西不为运行的物品时 停止执行(这里返回的时候 不会绘制Slot哦 猜猜为什么？ 自己改哦~)
                return;
            ItemSlot.Handle(ref slotItem,_context);//官方的物品交换函数
            _setItem(slotItem);
        }
        ItemSlot.Draw(spriteBatch,ref item,_context,rectangle.TopLeft());//官方的物品绘制函数
        if(PlayerInput.MouseInfo.LeftButton==ButtonState.Released)
            press=false;
    }
    finally
    {
        Main.inventoryScale=oldScale;
    }
}
```
有没有发现一个东西? ItemSlot 这个类是tml官方给的API里面包含了ItemSlot的很多方法 包括但不限于绘制 交换 里面的其他功能 由你们自己探索啦
```csharp
ItemSlot//官方提供的物品栏类
```
OK以上就完成了一个包含交换和绘制的函数 你问我为什么这个函数名不是中文了？ 因为这是继承的父类的方法 名字需要完全一致
好了好了 话说回来我们既然完成了 ItemSlot 就可以制作一个UI了 依旧迅速完成
```csharp
public class WorkTableUI : UIState
{
    private UITextPanel<string> uITextPanel = newUITextPanel<string>("制作",0.43f);//制作按钮
    public ModItemSlot[] inSlots = new[9];
    public ModItemSlot outSlot = new();
    public bool hide = false;//隐藏UI
    public override void OnInitialize()
    {//如果你要做固定在屏幕上面的UI就这个 如果做绑定物块位置的UI可以不用设置Top和Left
        outSlot.Top.Set(32,0);
        outSlot.Left.Sez(32,0);
        outSlot.Width.Set(32,0);
        outSlot.Height.Set(32,0);
        Append(outSlot);//注册这个Slot
        for(int i=0;i<9;i++)
        {
           //看我干嘛偷懒在 这里面的你自己写去
        }
        //uITextPanel的也自己写！！！
    }
public void BindEntity(物块实例 entity)//用来绑定物块实例 !!!!!如果你是想把UI直接存在物块里面的话 就不需要这个!!!!
{//有些人可能发现了下面使用的是闭包捕获 欸？ 什么是闭包捕获啊 这里一时间其实解释的不明白 建议百度或者AI学习一下
    magicWorkbenchEntity=entity;
    for(int i=0;i<8;i++)
    {
        //有些人想问为什么不在外面定义一个index? 这样不是增加开销吗？
        //因为闭包 如果不每次都重定义的话 最终捕获的东西都一样 但是每次都重定义的话 捕获的其实都不一样
        //只是他们的名字一样 但是内在不一样 相当于九个叫MoKou的人 但是他们其实不是同一个人
        int index=i;
        outSlot[i].SetItemAccessor(()=>magicWorkbenchEntity.Ingredients[index],
        (Y)=>magicWorkbenchEntity.Ingredients[index]=Y);//绑定里面的物品
    }
    gemOutItemSLot.SetItemAccessor(()=>magicWorkbenchEntity.Result,
    (Y)=>magicWorkbenchEntity.Result=Y);//绑定里面的物品
    gemOutItemSLot.SetCanAcceptItem(x=>x.type==ModContent.ItemType<物块实例>());//获取实例位置
    //然后根据自己的喜好做一个位置偏移
}

public override void Update(GameTime gameTime)
{

    if(uITextPanel.ContainsPoint(Main.MouseScreen))
    {
        uITextPanel.BackgroundColor = new Color(120, 120, 120);//当鼠标在上面的是后更改颜色 有些人想为什么我不直接用官方的方法 我也想用 不知道为什么这里用官方的会有问题 而且这样也差不多懒得管了()
        if (PlayerInput.MouseInfo.LeftButton == ButtonState.Pressed && !press)
        {//依旧熟悉的方法判断按下
            SoundEngine.PlaySound(SoundID.MenuTick);
            press = true;
            if (物块实例 != null)
            {
                物块实例.switch = true;
            }
        }
    }
    else
        uITextPanel.BackgroundColor = new Color(72, 72, 72);

    if(PlayerInput.MouseInfo.LeftButton == ButtonState.Released && press)
        press = false;

    for(int i = 0; i < 9; i++)
    {
        Vector2 offset = new Vector2(Distance, Distance).RotatedBy(MathHelper.ToRadians(自己设置角度));
        inSlot[i].Top.Set(ScreenPos.Y + offset.Y, 0);
        inSlot[i][i].Left.Set(ScreenPos.X + offset.X, 0);
        inSlot[i][i].Recalculate();
    }

    if(Main.keyState.IsKeyDown(Keys.E))
    {
        物块实例.CloseUI();//给个关闭UI方法
    }
    base.Update(gameTime);
}
```
每个UI都需要一个他的系统管理 这里有点复杂 不多
卧槽啊！！！！！！！！！！！！！！！！！！！！！！！！！！！！！
依旧附上代码
```csharp
 public class MagicWorkbenchUISys : ModSystem
    {
        private Dictionary<Point16,UserInterface> uiInterfaces;//
        private Dictionary<Point16,WorkTableUI> uiInstances;//对应的UI
        public static Point16? currentTilePos;//物块实例的位置

        public override void Load()
        {
            uiInterfaces = new Dictionary<Point16, UserInterface>();
            uiInstances = new Dictionary<Point16, WorkTableUI>();
            currentTilePos = null;
        }

        public override void Unload()
        {
            uiInstances?.Clear();
            uiInterfaces?.Clear();
            currentTilePos = null;
            base.Unload();
        }
```
以上为简单的注册UI以及加载 这里选择使用字典来存储对应的UI

每次打开的UI时候与记录的位置对比 如果不一样先关掉原先的 再开新的
```csharp
        //这里为了制作同时只能打开一个UI的效果 选择了记载物块的位置并且每次打开时对比 !!如果不是只能打开一个就随意你了 这个!!
        public static void OpenUI(int topLeftX,int topLeftY)
        {
            //记录值有值且不一样的情况下 先关闭
            if(currentTilePos.HasValue&&(currentTilePos.Value.X !=topLeftX || currentTilePos.Value.Y != topLeftY))
                CloseUI();//后面有 别担心 慢慢来
            var sys = ModContent.GetInstance<物块实例>();//如果继续执行的话 这里会获取对应位置的物块实例
            Point16 pos = new Point16(topLeftX,topLeftY);
            //如果这个位置对应的Key没记录Value的话 先记录一份
            if(!sys.uiInstances.ContainsKey(pos))
            {
                WorkTableUI ui = new WorkTableUI();
                UserInterface userInterface = new UserInterface();
                userInterface.SetState(ui);
                sys.uiInstances[pos] = ui;
                sys.uiInterfaces[pos] = userInterface;
            }

            var entity = 物块实例类.GetOrCreate(topLeftX,topLeftY);
            sys.uiInstances[pos].BindEntity(entity);
            sys.uiInstances[pos].hide = false;

            currentTilePos = new Point16(topLeftX,topLeftY);
        }
```
接下来我们写关闭方法
```csharp
        //关闭方法 先把记载值的东西 存储到字典里面去 用于在世界对应位置查询物块存在 如果记录值为null则直接返回函数
        public static void CloseUI()
        {
            if(currentTilePos is null)
                return;

            Point16 key = new Point16(currentTilePos.Value.X, currentTilePos.Value.Y);
            var sys = ModContent.GetInstance<MagicWorkbenchUISys>();
            var entity = 物块实例类.GetOrCreate(key.X,key.Y);//这个类是获取对应位置的物块实例
            if(entity.Ingredients.All(x => x.IsAir) && !entity.成果.IsAir)
                currentTilePos = null;
            else
                sys.uiInstances[key].hide = true;
        }
```
每帧查询对应地点是否存在物块 当物块不存在了直接执行关闭
```csharp
        public override void PostUpdateInput()
        {
            base.PostUpdateInput();
            if(currentTilePos.HasValue)
            {
                int i = currentTilePos.Value.X;
                int j = currentTilePos.Value.Y;

                if(!Main.tile[i,j].HasTile || Main.tile[i,j].TileType != ModContent.TileType<物块实例>())//物块实例消失或者被替换后
                    CloseUI();
            }
        }
```
接下来就是重要的UI绘制更新啦！ 很简单 需要注意的只有隐藏UI的时候不绘制而已
```csharp
        public override void ModifyInterfaceLayers(List<GameInterfaceLayer> layers)
        {
            //获取鼠标文本图层
            int mouseIndex = layers.FindIndex(layer => layer.Name == "Vanilla: Mouse Text");
            //插入
            layers.Insert(mouseIndex, new LegacyGameInterfaceLayer(
                "爱写啥写: WorkTable UI",
                delegate {//匿名委托
                    if (currentTilePos.HasValue)//如果位置值有值 就更新对应位置的UI
                    {
                        var sys = ModContent.GetInstance<本UI系统>();
                        Point16 key = new Point16(currentTilePos.Value.X,currentTilePos.Value.Y);
                        sys.uiInstances[key].Update(Main.gameTimeCache);
                        if(!sys.uiInstances[key].hide)
                            sys.uiInstances[key].Draw(Main.spriteBatch);
                    }
                    return true;
                },
                InterfaceScaleType.Game)
            );
        }
    }
```
以上 管理UI的Sys也写好了

{color:primary}{吼吼！！ 那么接下来终于到了第三步了 制作一个物块并做一个存储Item数据进行转换的物块实例}

这个也需要写两个
1.物块
2.物块实例

先进行物块制作吧

```csharp
public class 物块:ModTile
{
    public override void SetStaticDefaults()
    {
        //里面的看自己需求来
        //也附上我自己的
        Main.tileSolid[Type]=false;// 不实心，可以穿过
        Main.tileBlockLight[Type]=false;// 不挡光
        Main.tileLavaDeath[Type]=false;// 不被岩浆摧毁
        Main.tileWaterDeath[Type]=false;// 不被水摧毁
        Main.tileFrameImportant[Type]=true;
        Main.tileNoAttach[Type]=true;
        TileID.Sets.DrawsWalls[Type]=true;
        TileID.Sets.IgnoresNearbyHalfbricksWhenDrawn[Type]=true;
        TileObjectData.newTile.CopyFrom(TileObjectData.Style2x2);
        TileObjectData.newTile.Origin=newPoint16(1,1);TileObjectData.addTile(Type);
        HitSound=SoundID.Dig;
        DustType=DustID.Stone;
        MineResist=1f;
        MinPick=0;//最低要求镐力
        AddMapEntry(Color.Yellow,this.GetLocalization("地图上的物块名字"));
    }
}
```
让物块不会被锤子敲
```csharp
public override bool Slope(int i,int j)=>false;
```
鼠标覆盖物块时调用的方法(如果想做一些特效也没有问题)
```csharp
public override void MouseOver(int i,int j)
{
    // 鼠标悬停显示光标
    Playerplayer=Main.LocalPlayer;
    player.noThrow=2;
    player.cursorItemIconEnabled=true;
    player.cursorItemIconID=ModContent.ItemType<防止这个物块的Item>();
}
```
给物块生成以及删除实例
```sharp
public override void PlaceInWorld(int i,int j,Item item)
{
    ModContent.GetInstance<物块实例>().Place(i,j);
}
public override void KillMultiTile(int i,int j,int frameX,int frameY)
{
    //安全的获取物块实例 然后删除
    int entityID=ModContent.GetInstance<物块实例>().Find(i,j);
    if(entityID!=-1)
        TileEntity.ByID.Remove(entityID);
    ModContent.GetInstance<物块实例>()?.Kill(i,j);
}
```
再就是添加右键方法了 看了几个方法有没有发现很多方法都给了 "i,j"这两个值？ 这两个值是干什么的？ 这两个值是物块在世界的位置 与弹幕位置不同 他是除了16的 为什么这样呢？ 因为一个标准物块的宽和高都是16 也就是说 他是第i行第j列的物块
让我们来看看代码
```csharp
    public override bool RightClick(int i,int j)
    {
        //因为高宽不为1的物块有多个存储实例的位置 所以我们选取左上角为实例 每次右键都是左上角
        Tile tile=Main.tile[i,j];
        int offsetX=tile.TileFrameX/18;//为什么这里是18？？ 来 这位同学你来说
        int offsetY=tile.TileFrameY/18;//其实是像素大小是16 同时 物块还有1像素的边缘 所以是 16+1+1=18
        int topLeftX=i-offsetX;
        int topLeftY=j-offsetY;
        你的UI管理Sys.OpenUI(topLeftX,topLeftY);
        return true;//只有返回值为true的时候
    }

```
好了 我们再来物块实例环节 先来定义字段吧
```csharp
public class 物块实例 : ModTileEntity
{
    public Item[] 对应物品栏位的数组 = newItem[9];
    public Item 成果=new();
    public List<Item> 材料列表=new();
    public List<Item> 旧材料表=new();
    public bool Switch=false;//制作物块的开关
    private bool _canCreateItem=false;
}
```
欸？？？ 为什么报错了 来按住ctrl 左键ModTileEntity 这是个抽象类 同时 我们会发现他里面还有个抽象方法 抽象方法是一个必须完成的方法 不然整个抽象类就不对 这是他和虚拟方法的区别 来 让我们补上抽象方法以及初始化
```csharp
//验证物块是否仍然有效，判断 Entity 是否应该继续存在
public override bool IsTileValidForEntity(int x,int y)
{
    Tile tile=Main.tile[x,y];
    return tile.HasTile&&tile.TileType==ModContent.TileType<物块>();
}
public MagicWorkbenchEntity()
{
    for(int i=0;i<与UISlot对应的数组.Length;i++)
    {
        那个数组[i]=newItem();
        旧材料表.Add(new Item());
        材料表.Add(new Item());
    }
}
```
接下来是寻找物块实例的方法了
```csharp
///<summary>
///获取或创建指定位置的 Entity 实例
///</summary>
public static 物块实例 GetOrCreate(int x,int y)
{
    Point16pos=newPoint16(x,y);
    // 从 ByPosition 字典中查找
    if(ByPosition.TryGetValue(pos,outvarexistingEntity))
    {
        if(existingEntity is 物块实例类 物块实例)
        {
            return 物块实例;
        }
    }
    int entityID=ModContent.GetInstance<物块实例类>().Find(x,y);
    if(entityID==-1)
    {
        // 找不到 创建新的 Entity
        entityID=ModContent.GetInstance<物块实例类>().Place(x,y);
    }
     // 通过 ID 获取 Entity
    if(entityID>=0&&TileEntity.ByID.TryGetValue(entityID,out var newEntity))
    {
        return newEntity as 物块实例类;
    }
    return null;
}
```
好 最后一步 制作替换环节
```csharp
private bool _change = false;//用于记录材料表是否被改变了
private bool _canCreateItem = false;//可以制作物品
private int _itemStack = 0;//返回的物品数量
public override void Update()
{
    材料表.Clear();
    foreach(var item in 绑定UI的那个数组)
    {
        if(!item.IsAir)
            材料表.Add(item);
    }
    for(int i =0;i<9;i++)
    {
        if(材料表[i].type != 旧材料表[i].type)
            _change = true;
    }
    if(_change)
    {
        旧材料表.Clear();
        foreach(var item in 材料表)
        {
            旧材料表.Add(item.Clone());
        }
        Item 返回成果 = new();
        _canCreateItem = 配方表类.根据传入的材料表返回成果(材料表,out 返回成果);
        if(_canCreateItem&&switch)
        {
            int min = 材料表.Where(x=>!x.IsAir).Min(x=>x.stack);
            返回成果.stack = min;
            foreach(var item in 材料表)
            {
                item.stack-=min;
            }
            _canCreateItem = false;
        }
    }
}
```
好啦 最终也是完成了 还记得我们在UI里面设置的按键吗？ 按下制作就可以制作了 以上 整个类似MC的工作台就完成了 这个教程是一个休闲的教程 以制作一个工作台的角度来思考 同时也说了部分知识点 对于第一次制作教程的话 我认为没问题 还有 以上代码是半年前写的 所以很多地方很大粪 (别打别打)

## 小结
多多阅读 多多思考 这里面讲述的不止制作一个类似MC的工作台 涵盖了部分知识点 可以消化一下 如果发现哪里有问题的话 群里@我哦 我改(认罚认罚)
(看完可能会有点糊 因为第一次写教程 加上写一半才发现这些东西可能对网页来说太长了 致歉)
