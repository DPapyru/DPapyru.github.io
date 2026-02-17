---
title: 护盾与冲击波
author: 和小善
topic: article-contribution
description: 关于原版天界柱护盾Shader的多种用途
order: 100
difficulty: beginner
time: 5分钟
min_c: 0
min_t: 0
colors:
  Pink: "#ffc0cb"
---
# 前言
你是否也想制作一个护盾或者冲击波？
这个Tips或许可以帮到你
# 前置知识
基础绘制知识 & BlendState使用知识
# **正文**
 ## 1.绘制开始
- 要在绘制的开始就写上
```csharp
 // --- 护盾绘制开始 ---
Main.spriteBatch.End();
Main.spriteBatch.Begin(SpriteSortMode.Immediate, BlendState.AlphaBlend, SamplerState.LinearWrap, DepthStencilState.None, Main.Rasterizer, null, Main.GameViewMatrix.TransformationMatrix);
```
 - **Q:为什么需要这么做？
    A:渲染状态隔离（不写会报错喵~）**
 ## 2.设置参数
```csharp
DrawData shieldDrawData = new(
    texture2D,
    position,
    rectangle,
    color,
    rotation,
    origin,
    scale,
    SpriteEffects.None,
    0);
```
 - **Q:为什么数据类型是```DrawData```
A: 我们设置具体参数后，需要传参**
>![屏幕截图 2026-02-14 143642](/site/content/%E5%92%8C%E5%B0%8F%E5%96%84%E7%9A%84MiniTips/%E8%A7%86%E8%A7%89%E6%95%88%E6%9E%9C%E7%AF%87/imgs/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE-2026-02-14-143642-ox8b7.png)
这是```Apply```需要的数据类型

 ### 2.1 参数详解
```texture2D``` 
- 作用: **噪声纹理设置**

```position``` 
- 作用: **绘制位置**
一般来说位于**Projectile**或**NPC**的**Center**

```rectangle``` 
- 作用: **需要绘制被绘制贴图的哪一部**
```csharp 
// 从左上角读取
new Rectangle(0, 0, width, height)

// 如果用完整纹理
new Rectangle(0, 0, texture2D.Width, texture2D.Height)

// 如果从中间读取
new Rectangle(texture2D.Width/2, texture2D.Height/2, npc.width, npc.height)
```
```color```
- 作用: **设置颜色**

```rotation```
- 作用: **护盾旋转**
```origin```
- 作用: **计算护盾的绘制原点**
```scale```
- 作用: **设置大小**
 ## 3.调用原版的Shader (**核心**)
 - 极大的节约了实现护盾和冲击波的成本
```csharp
 // 设置颜色
GameShaders.Misc["ForceField"].UseColor("设置颜色");
GameShaders.Misc["ForceField"].Apply("设置参数");
```
## 4.如何绘制
- **注**:不能直接用 SpriteBatch.Draw
```csharp 
// ❌ 错误:这样会丢失着色器效果
Main.spriteBatch.Draw(texture, position, ...);

// ✅ 正确: 
shieldDrawData.Draw(Main.spriteBatch);
```
- **原因**: 着色器的修改已经应用到 ```shieldDrawData``` 内部，必须通过它来绘制。

## 5.最后
```csharp 
Main.spriteBatch.End();
Main.spriteBatch.Begin(SpriteSortMode.Deferred, BlendState.AlphaBlend, SamplerState.LinearClamp, DepthStencilState.None, Main.Rasterizer, null, Main.GameViewMatrix.TransformationMatrix);
```
- **作用**:将 ```SpriteBatch``` 恢复到默认的渲染状态 ，确保后续绘制不受护盾特殊参数的影响。
# 示例
- 没看懂以上的那些也没关系，这里有一个小小的示例
```csharp 
// 1.护盾的渲染
Main.spriteBatch.End();
Main.spriteBatch.Begin(SpriteSortMode.Immediate, BlendState.AlphaBlend, SamplerState.LinearWrap, DepthStencilState.None, Main.Rasterizer, null, Main.GameViewMatrix.TransformationMatrix);

// 2. 创建 DrawData 对象
DrawData shieldDrawData = new DrawData(
    ModContent.Request<Texture2D>("YourMod/Assets/CrustyNoise").Value,
    npc.Center - Main.screenPosition,
    new Rectangle(0, 0, npc.width, npc.height),
    Color.DeepSkyBlue,
    0f,
    new Vector2(npc.width, npc.height) / 2f,
    1f,
    SpriteEffects.None,
    0
);

// 3. 应用 ForceField 着色器
GameShaders.Misc["ForceField"].UseColor(Color.DeepSkyBlue);
GameShaders.Misc["ForceField"].Apply(shieldDrawData);

// 4. 绘制护盾
shieldDrawData.Draw(Main.spriteBatch);

// 5. 恢复默认渲染状态
Main.spriteBatch.End();
Main.spriteBatch.Begin(SpriteSortMode.Deferred, BlendState.AlphaBlend, SamplerState.LinearClamp, DepthStencilState.None, Main.Rasterizer, null, Main.GameViewMatrix.TransformationMatrix);
```
> - 如果我们稍稍发挥主观能动性，就可以得到:
![屏幕截图 2026-02-15 191911](/site/content/%E5%92%8C%E5%B0%8F%E5%96%84%E7%9A%84MiniTips/%E8%A7%86%E8%A7%89%E6%95%88%E6%9E%9C%E7%AF%87/imgs/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE-2026-02-15-191911-ljyoh.png)

# 番外 (护盾爆改冲击波)
- 冲击波的实现，其实就是一个**逐渐变大**的护盾
> {color:Pink}{诗歌剧:}曼波~ 那么我该怎么做呢?

### 基础数值
- 让我们设置几个基础的数值
```csharp 
private const float InitialScale = 0.1f; // 最小值
private const float MaxScale = 10f; // 最大值
private const float GrowthSpeed = 0.05f; // 增长速度
```
### 计时器
- 我们可以用**原版**的```ai[]```或```localAI[]```
```csharp 
// 冲击波本质是个弹幕
public ref float Time => ref Projectile.ai[0];
```
> PS:我们不必一定用```ai[]```,如果在**生成弹幕**时改变了```ai[]```可能会**出问题**
#### AI()
```csharp 
Time++;
            
float currentScale = InitialScale + Time * GrowthSpeed;
if (currentScale > MaxScale)
    currentScale = MaxScale;
            
// 让弹幕大小和currentScale绑定
Projectile.scale = currentScale;
```
- 这样就能实现变大的效果了
#### 小贴士
- 要在绘制应该填入```Scale```的地方填入```currentScale```以保证正常生效
(或者,直接填入```Projectile.scale```也是一样的)
# 小结
理论比不上实践，快去试试吧~

曼波~
