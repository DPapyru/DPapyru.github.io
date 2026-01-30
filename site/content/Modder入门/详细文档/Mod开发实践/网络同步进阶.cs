using ModDocProject;
using Terraria.ModLoader;

namespace ModDocProject.Modder入门.详细文档.Mod开发实践 {
    #region 元数据
    [Title("网络同步进阶 - 处理多人游戏同步")]
    [Tooltip("深入了解网络同步机制和处理方法")]
    [UpdateTime("2026-01-30")]
    [Author("Papyru")]
    [Category("Modder入门")]
    [Topic("mod-dev")]
    #endregion
    public class 网络同步进阶 : ModSystem {
#if DOCS
        public const string DocMarkdown_0 = """
> WARNING: 版本说明：本教程适用于 **tModLoader 1.4.4+**

## 网络同步概述

tModLoader 使用客户端-服务器架构。

### 服务器负责：
- 计算游戏逻辑
- 维护权威数据
- 广播状态变化

### 客户端负责：
- 显示游戏画面
- 处理玩家输入
- 发送操作请求

## ModPacket 同步

### 发送数据包

```csharp
public void SendCustomData(int value) {
    if (Main.netMode == NetmodeID.Server) {
        ModPacket packet = Mod.GetPacket();
        packet.Write((byte)MessageType.MyCustomData);
        packet.Write(value);
        packet.Send();
    }
}
```

### 接收数据包

```csharp
public override void HandlePacket(BinaryReader reader, int whoAmI) {
    byte type = reader.ReadByte();
    
    switch (type) {
        case (byte)MessageType.MyCustomData:
            int value = reader.ReadInt32();
            // 处理数据
            break;
    }
}
```

## NPC 同步

### NPC ExtraAI 同步

```csharp
public override void SendExtraAI(BinaryWriter writer) {
    writer.Write(NPC.ai[0]);
}

public override void ReceiveExtraAI(BinaryReader reader) {
    NPC.ai[0] = reader.ReadSingle();
}
```

## 玩家数据同步

### ModPlayer 同步

```csharp
public class MyModPlayer : ModPlayer {
    public int myValue;
    
    public override void SyncPlayer(int toWho, int fromWho, bool newPlayer) {
        ModPacket packet = Mod.GetPacket();
        packet.Write((byte)MessageType.SyncPlayerValue);
        packet.Write(Player.whoAmI);
        packet.Write(myValue);
        packet.Send(toWho, fromWho);
    }
}
```

## 最佳实践

1. **只在服务器计算**：所有逻辑在服务器执行，客户端只显示
2. **减少同步频率**：不要每帧都发送数据
3. **使用条件同步**：只在数据变化时发送
4. **处理网络延迟**：客户端预测和服务器校验
""";
#endif
    }
}
