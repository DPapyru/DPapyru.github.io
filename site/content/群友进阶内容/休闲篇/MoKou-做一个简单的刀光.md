---
title: MoKou 做一个简单的刀光
author: MoKou
topic: article-contribution
description: 制作一个简单的刀光
order: 100
difficulty: intermediate
time: 50分钟
---

# 做一个简单的刀光
一篇关于制作一个刀光的教程
{color:primary}{本篇包含刀光以及碰撞全部}()
## 先来拆分需求
1. 运动AI
2. 绘制
3. 碰撞
 以上拆分好的需求也是讲述的顺序

### 运动AI 最简单的一个(简单到不知道讲些啥)❌

让我们想想 手拿剑挥砍 是不是就是一个圆？ 只是旋转的角度不同而已
挥舞一把剑 说白了就是画一个圆 所以AI部分 我们只需要制作一个以玩家为中心画圆的AI就行

下面我们定义圆心和圆上点
```csharp
Vector2 playerCenter = player.Center - Main.screenPos;//圆心
Vector2 projCenter = new Vector2(10,0);//圆上的点
```
接下来就是圆上点旋转了 需要考虑两点
1. 旋转的方向
2. 旋转的速度
我这边只推荐速度快些 方向按照自己喜欢的来 然后我这边推荐使用Lerp(线性插值)函数
根据当前弹幕存在时间来调整挥砍的方向 
比如我们这边要**20帧(1/3秒)挥砍180°** 那代码就是
```csharp
public float timer =0;//计时器
public  override void AI()
{
    float rotaDeg = Mathhelper.Lerp(0,180,timer/20f);
    timer+=1f;
}
```
然后把这个旋转至给入{color:Mad}{projCenter}就可以做出一个很简单的旋转效果
总体代码为：
```csharp
public float timer=0;
public override void AI()
{
    float rotaDeg = Mathhelper.Lerp(0,180,timer/20f);
    Vector2 playerCenter = player.Center - Main.screenPos;//圆心
    Vector2 projCenter = new Vector2(10,0).RotatedBy(Mathhelper.ToRadians(rotaDeg));//圆上点包括当前的角度

    //把位置和旋转角度传入给弹幕
    projectile.Center = projCenter;
    projectile.rotation = Mathhelper.ToRadians(rotaDeg);

    //计数器自增
    timer+=1;
}
```
{color:Mad}{个别函数说明}
> Mathhelper.Toradians 这是一个角度转弧度函数 泰拉里面的旋转基本用的都是弧度(后面我会缩写成Tora)
> RotatedBy 这个是tml官方API给的向量旋转方法

如果你的贴图是一个球 就有很直观的效果 一个围绕玩家旋转的球 把这个球换成一把剑就跟挥舞剑没区别了
那挥舞怎么能没有手旋转？ 接下来我们做手部旋转
```csharp
    SetCompositeArmFront(true,Player.CompositeArmStretchAmount.Quarter,Mathhelper.Tora(rotaDeg));
```
这个是tml官方给的手旋转的函数 可以看到函数里面有三个参数 第一个是启用绘制？(应该是这个 你要做就填true就行) 第二个就是手的长度了 一共有四个参数\{Quarter,Full,None,ThreeQuarters} 第三个就是旋转角度
配合这个方法就可以做出弹幕旋转加上手部跟着转了 建议看完这里停下 如果你不会做一个绕着玩家转的球 就先去做一个试试效果

### 来啦来啦 绘制环节！ 接下来要教绘制一把剑以及绘制刀光

我们一共要绘制两个东西 一个剑 一个刀光
我们绘制这两个东西 需要一个前置知识
如果不会也不要紧 这把简单的说两句

# -顶点绘制-

## 什么是顶点？

想象一张纸 你要在上面画一个矩形：
- 矩形有 **4个角**
- 每个角就是一个 **顶点（Vertex）**

在tml里 顶点包含3个信息：

```csharp
public struct Vertex
{
    public Vector2 Position;    // 屏幕坐标位置
    public Vector3 Color;       // 颜色 (R,G,B) 范围 0-1
    public Vector3 TextureUV;   // 贴图坐标 (U,V,纹理层)
}
```
用两个三角形拼成一个矩形 在这个矩形里面就会绘制你使用的贴图了
那么 我们该如何填写参数？ 下面举例
```csharp
List<Vertex> vertexList = new List<Vertex>
{
    new Vertex(vertices[0], new Vector3(0, 0, 1), Color.White),  // 左上，UV(0,0)
    new Vertex(vertices[1], new Vector3(1, 0, 1), Color.White),  // 右上，UV(1,0)
    new Vertex(vertices[3], new Vector3(1, 1, 1), Color.White),  // 右下，UV(1,1)
    new Vertex(vertices[3], new Vector3(1, 1, 1), Color.White),  // 右下，UV(1,1) 重复
    new Vertex(vertices[2], new Vector3(0, 1, 1), Color.White),  // 左下，UV(0,1)
    new Vertex(vertices[0], new Vector3(0, 0, 1), Color.White),  // 左上，UV(0,0) 重复
};
```
这就是一个矩形所使用的顶点 然后你要是新人或者没接触过着色器就会想什么是UV

## 什么是UV位置？

UV 坐标告诉 GPU "贴图的哪个部分贴在这个顶点上"：

```
UV(0,0)    → 贴图左上角
UV(1,1)    → 贴图右下角
UV(0.5,0.5) → 贴图中心
```
好 我们再深入想想 如果传入了128个每次旋转1°的顶点值 那是不是绘制的纸从矩形 变成了一个扇形？
那么你想制作的刀光效果又是啥样的呢？
是不是一直取剑出现的位置？ 然后一直修改他所在的UV坐标？ 现在是不是简单多了？
我们再归纳一下
1. 剑的顶点 -四个点就行 计算好位置根据弹幕旋转变化一直变动
2. 刀光顶点 -不断取点记录 不断修改它所在的UV比 
![刀光图](./images/Extra_209.png)
把贴图重新设置UV和坐标 就可以让他变成一个圆 就是你看见的刀光图
![刀光效果](Images/刀光.png)
效果类似这样 是不是是有点感觉了？
来吧 代码启动启动！

先制作剑的顶点 这把选取玩家中心为剑柄位置(贴图左下角) 然后以此为基础做顶点
就是
```csharp
float textrue2DLength = MathF.Sqrt(MathF.Pow(Width,2) + MathF.Pow(Height,2));//把贴图的高宽转化为斜边长
Vector2 drawStart = player.Center - Main.screenPos;//可以理解为左下角
Vector2 drawEnd = new Vector2(texture2DLength,0).RotatedBy(projectile.rotation);//可以理解为右上角
Vector2 halfPos = drawEnd /2f;//中点
Vector2 halfLength = new(-halfPos.Y , halfPos.X);//非常基础的垂直公式
Vector2[] drawPoss = new Vector2
{
    drawStart + halfPos + halfLength,//左上
    drawStart + drawEnd,//右上
    drawStart,//左下
    drawStart + halfPos + halfLength//右下
};
```
这就是这个剑贴图所在的矩形了
顶点代码是
```csharp
List<Vertex> vertices = new List<Vertex>();
for(int i =0;i<6;i++)
    vertices.Add(default);
{
    vertices[0] = vertices[5] = new Vertex(drawPoss[0], new Vector3(0, 0, 1), Color.White); // 左上角
    vertices[1] = new Vertex(drawPoss[1], new Vector3(1, 0, 1), Color.White);               // 右上角  
    vertices[2] = vertices[3] = new Vertex(drawPoss[3], new Vector3(1, 1, 1), Color.White); // 右下角
    vertices[4] = new Vertex(drawPoss[2], new Vector3(0, 1, 1), Color.White);               // 左下角
}
```
是不是肥肠煎蛋？ 到游戏里面如果你的旋转没问题的话 就可以看见你的刀围着你转了
然后就是刀光了 有几种取点法
1. halfPos + drawEnd
2. drawStart + drawEnd
这两种按需求来
然后我们还需要旧Pos和旧Rot 旧位置用于查看是否存在 旧旋转用于计算位置修正
代码大体为
```csharp
List<Vertex> tailing = new List<Vertex>();
float distance = MathF.Sqrt(MathF.Pow(projWidth, 2) + MathF.Pow(projHeight, 2));
for (int a = 0; a < oldPos.Length; a++)
{
    if (oldPos[a] != Vector2.Zero)//要是位置存在 意思就是 有旋转值有效并且弹幕起码到过这一帧
    {
        var tailCenter = drawStart;
        var tailEnd = new Vector2(distance * MathF.Cos(oldRot[a])
            , distance * MathF.Sin(oldRot[a]));//简单的计算了 这把我直接复制的我代码 自己修改哦 小作业
        tailEnd += tailCenter;
        float progress = (float)a / oldPos.Length;
        //这里的UV就非常简单了 计算该次点所在的UV值
        tailing.Add(new Vertex(tailCenter, new Vector3(progress, 0, 1),Color.White));
        tailing.Add(new Vertex(tailEnd, new Vector3(progress, 1, 1),Color.White));
    }
}
```
然后可以发现刀光一个点始终是玩家位置然后另外一边转动即为刀挥过的范围 类似扇形
代码总体不给了自己琢磨 这是作业
### 碰撞
出伤判断 这个还挺重要的 毕竟修改了绘制但是没修改受击碰撞箱那跟没修一样
我这里使用的是AABB碰撞箱（轴对齐包围盒）
就是**不能旋转的矩形碰撞箱** 例如
┌─────────────┐     ┌──────────┐
│   敌人AABB   │     │ 剑AABB   │
│             │     │          │
└─────────────┘     └──────────┘
不相交

┌─────────────┐
│   敌人AABB   │
│     ┌───────┼──┐
│     │ 剑AABB │  │
└─────┼───────┘  │
└─────────┘
相交！
(以上为AI提供)
## 核心原理

两个 AABB 相交的条件：
rect1 敌人
rect2 刀
rect1.X < rect2.X + rect2.Width  &&
rect1.X + rect1.Width > rect2.X  &&
rect1.Y < rect2.Y + rect2.Height &&
rect1.Y + rect1.Height > rect2.Y



**翻译成人话**：
- rect1 的左边 在 rect2 的右边 **左边** ←→
- rect1 的右边 在 rect2 的左边 **右边** ←→
- rect1 的上边 在 rect2 的下边 **上边** ↑↓
- rect1 的下边 在 rect2 的上边 **下边** ↑↓
判断x与y是否有相交值就行 很简单 直接给出代码(这边复制的我自己的 然后加上注释)
```csharp
public bool HitBox(Rectangle npcHitBox)
{
    // 1. 计算剑的位置
    // 剑柄位置 = 玩家中心 + 偏移（旋转后）
    Vector2 swordStart = projOwner.Center;

    // 2. 获取剑贴图尺寸(这一步就是找你武器判定的长宽)
    if(weaponTexture is null)
        weaponTexture = TextureAssets.Item[projOwner.HeldItem.type].Value;
    if(projWidth == 0)
        projWidth = weaponTexture.Width;
    if(projHeight == 0)
        projHeight = weaponTexture.Height;

    // 3. 计算剑的终点（剑尖）
    float swordLength = MathF.Sqrt(projWidth * projWidth + projHeight * projHeight) * weaponScale;
    Vector2 swordEnd = swordStart + new Vector2(swordLength, 0).RotatedBy(projectile.rotation) * scale.X;
    
    // 4. 剑的碰撞箱尺寸（在剑的局部坐标系中）
    float halfLength = swordLength / 2f;
    float halfHeight = 2.5f;  // 高度=5，半高=2.5
    
    // 5. 计算剑的角度和中心（用于坐标变换）
    float swordAngle = (swordEnd - swordStart).ToRotation();
    Vector2 swordCenter = (swordStart + swordEnd) / 2f;
    
    // 6. 获取敌人碰撞箱的4个角
    Vector2[] npcCorners = new Vector2[4]
    {
        new Vector2(npcHitBox.X, npcHitBox.Y),              // 左上
        new Vector2(npcHitBox.Right, npcHitBox.Y),          // 右上
        new Vector2(npcHitBox.Right, npcHitBox.Bottom),     // 右下
        new Vector2(npcHitBox.X, npcHitBox.Bottom)          // 左下
    };
    
    // 7. 【核心】坐标变换：把敌人旋转到剑的坐标系
    //    变换后，剑变成水平的AABB，敌人被旋转
    Vector2[] localCorners = new Vector2[4];
    for(int i = 0; i < 4; i++)
    {
        Vector2 offset = npcCorners[i] - swordCenter;
        // 旋转公式：绕中心旋转 -swordAngle
        localCorners[i].X = offset.X * MathF.Cos(-swordAngle) - offset.Y * MathF.Sin(-swordAngle);
        localCorners[i].Y = offset.X * MathF.Sin(-swordAngle) + offset.Y * MathF.Cos(-swordAngle);
    }
    
    // 8. AABB检测：计算旋转后敌人的边界
    float minX = localCorners[0].X, maxX = localCorners[0].X;
    float minY = localCorners[0].Y, maxY = localCorners[0].Y;
    
    for(int i = 1; i < 4; i++)
    {
        minX = MathF.Min(minX, localCorners[i].X);
        maxX = MathF.Max(maxX, localCorners[i].X);
        minY = MathF.Min(minY, localCorners[i].Y);
        maxY = MathF.Max(maxY, localCorners[i].Y);
    }
    
    // 9. 检查是否与剑的AABB相交
    //    剑的中心是(0,0)，范围是 [-halfLength, halfLength] × [-halfHeight, halfHeight]
    return maxX >= -halfLength && minX <= halfLength &&
        maxY >= -halfHeight && minY <= halfHeight;
}
```
到此 就完成了一个简单的刀光 然后带碰撞的教程了 (碰撞不是主要部分 看不懂也没关系(≥^≤)~
> 不会就多写多做多报错( -Mokou
# 该文小结
总体为教有点基础的人如何写一个刀光 如果你只在一刀光效果就直接看绘制 主要是顶点绘制就行 碰撞啥的都是添头 然后如果有问题的话 群里面@我就行 我会接受拷打的 哪里不懂的多读多看多试 大脑中构思一下效果或者群里面问（
然后希望你也能写出自己满意的刀光效果 加油