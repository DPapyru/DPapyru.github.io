# Introductory
Before you continue this guide, you should read our [basic netcode](basic-netcode) guide first.

# Practical advice
In general, you'll want to make your packets small so they can be sent across clients quickly and do not cause any problems in the network. Big packets or many packets sent will cause the network to clog up, and can cause lag or problems while playing the game. If a mod performs bad during multiplayer, this can be why. If a mod is actually buggy during multiplayer, it is often because they do not send packets at all and clients aren't synchronized.

To help aid making packets small and minimizing the amount you need to send, you should try to make code deterministic whenever you can. Determinism means that code on clients align, and do not need further interaction between them to be in the same state. This means no networking between them needs to be done to ensure everyone gets the same result on their client.

Ensuring determinism isn't always easy, but can easily be checked against when answering the following question:
> "Will multiple clients be in the same state (or have the same result) when this code is ran for them individually, without any interaction between them?"

If the answer is yes, that means your code is deterministic enough. If all clients can reach this point at the same time, no more networking is needed to ensure the same result.

# Packet flows
There are a couple of flows that can happen for network packets:

**Flow 1**: Client -> Server -> Client <br>
This flow is very common. A client sends a packet to the server, after which the server forwards this packet to all other connected clients (or specified ones).

**Flow 2**: Client -> Server <br>
This flow is also very common and is used when a client needs to instruct the server of a change.
An example could be running a (chat) command that alters server behavior, so something that the server controls.

**Flow 3**: Server -> Client <br>
This flow is less common than the other 2 flows and is used to have the server instruct the client about something.
It is common for this flow to occur in games when a client is out of sync and the server sends it information to come back in sync.

# ModPacket
### Making and sending a packet
If you want to send packets in your mod, you will use the ModPacket class. This class is designed to send data in any of the designated flows described above. A very simple packet could look like this:
```cs
ModPacket myPacket = myMod.GetPacket();
//The above line could also be written as "ModPacket myPacket = ModContent.GetInstance<yourMod>().GetPacket();"
myPacket.Write("Hello world!");
```
Now you have written a packet with the string data "Hello World!". In order to send the packet to the server, call the `Send` function on ModPacket:
```cs
myPacket.Send();
```

You may already have realized we are now in flow 2: we are sending a packet to the server. It is now up to the server to do something with this packet.

### Receiving packets
For receiving and reading packets, you'll have to override the `HandlePackets` method in your Mod class:
```cs
public override void HandlePacket(BinaryReader reader, int whoAmI) {
    string msg = reader.ReadString(); // "Hello world!"
}
```
`HandlePacket` is called whenever a packet is received from a client (if this is a server) or the server (if this is a client). whoAmI is the ID of whomever sent the packet (equivalent to the Main.myPlayer of the sender), and reader is used to read the binary data of the packet. **So in order to handle packets sent by a client on the server you must make sure your mod is also running on the server.**

You'll obviously want to write this method more elegantly so you can handle different kinds of packets. It's very common to write an identifier for your packet so you can recognize what the packet is about. You can then read this type and execute the corresponding reading logic:
```cs
ModPacket myPacket = myMod.GetPacket();
myPacket.Write((byte)0); // id
myPacket.Write("Hello world!"); // message
myPacket.Send();
```
```cs
public override void HandlePacket(BinaryReader reader, int whoAmI) {
	byte msgType = reader.ReadByte();
	switch (msgType) {
		case 0:
			string msg = reader.ReadString(); // "Hello world!"
			break;
		case 1:
			... // another message type goes here
			break;
		default:
			Logger.WarnFormat("MyMod: Unknown Message type: {0}", msgType);
			break;
	}
}
```

### Reading a packet
Reading is just as writing, you'll have to call any of the appropriate read functions from the BinaryReader object. Very common are: `ReadString()`, `ReadInt32()`, `ReadByte()` and `ReadSingle()` (reading a float).

### Writing and reading in the correct order
It is very important that you remember that packets are **FIFO**: First in = First out.
**You must read the data in the order it was sent in**.
For example, let's consider a packet where you send a byte, and integer and then a float. We'll be using some arbitrary numbers alongside an id for the packet. You'll write and send the packet as follows:
```cs
ModPacket packet = mod.GetPacket();
packet.Write((byte)0); // id
packet.Write(100); // progress
packet.Write(1.0f); // difficulty
packet.Send();
```
You must read the packet in the same order on the receiving end, so:
```cs
byte id = reader.ReadByte();
int progress = reader.ReadInt32();
float difficulty = reader.ReadSingle();
```

# Networking optimization
Bad networking code can cause your mod to perform poorly in multiplayer play. Let's go over some concepts to ensure that doesn't happen.

**Under-reading or over-writing** <br>
In general, you must remember to **only send data you will actually use**. If you send more data than you are reading, this is considered under-reading or over-writing. Essentially you are bloating the network with redundant data, data that you aren't using. **Always make sure you are actually using all the data you are sending**.

**Common data you usually don't have to send are calculated values, or instead parameters for a calculation**.
Consider that you have calculated a number on one client, and this number needs to go another client. You could choose to send the non-deterministic parameters which you used to calculate the number, or you could choose to send the calculated number. For example, if we take simple multiplication for integers the latter choice would be best because we're sending just one integer vs two integers. In some cases however, you may end up with multiple results from these two parameters, in this case it may be better to send the parameters instead and calculate the values again on the other client.

**Sending packets at the right moment** <br>
To not overflow the network with ridiculous amounts of packets you need to think about when it is the right time to send a packet. For example consider a packet notifying the death of a boss. You could choose to send a packet every frame with the health of the boss and check this value on the receiving end. However, the game updates at an interval that will cause you to send dozens of packets every second! You can imagine that packets holding a lot of data this way will bloat the networking and cause the game to perform poorly.

**Make sure you send a packet where it is supposed to be sent, in this case on death for the boss.** ModNPC has a hook for this.

**In a lot of cases, you do not need to send packets at all; simply use one of the provided tML hooks.** In the given example we could also just check if the running instance is a server in the death hook for the boss, and then run whatever logic we need. Usually there's a hook already available you can use for your logic. Our [basic netcode guide](basic-netcode) goes more in-depth on this matter.
 
But now you might wonder, **when to send a packet then?** Usually a good time to send a packet is with non-deterministic behavior. Consider the boss again in a multiplayer game. You may have programmed the AI to semi-randomly switch phases of the boss. In a multiplayer scenario this random switch should occur on the server, and at that point the server should send a packet to all clients informing them of the phase change. This way all clients will stay in sync because they are informed by the server. If the clients were to decide for themselves when to switch phases each client would turn out of sync with each other because they would switch at different moments.

# Modelling Send and Receive for ModPacket
In general, it is easy to model how you should write and read data from a packet. **You should read the data, in the same order it was sent**. Consider the following scenario:
```cs
float someVal;
int someInt;

public void Send(int toWho, int fromWho)
{
	ModPacket packet = mod.GetPacket();
	if (Main.netMode == NetmodeID.Server) {
		packet.Write(fromWho);
	}
	packet.Write(someVal);
	packet.Write(someInt);
	packet.Send(toWho, fromWho);
}

public void Receive(BinaryReader reader, int fromWho)
{
	if (Main.netMode == NetmodeID.MultiplayerClient) {
		fromWho = reader.ReadInt32();
	}
	someVal = reader.ReadSingle();
	someInt = reader.ReadInt32();
	if (Main.netMode == NetmodeID.Server) {
		Send(-1, fromWho);
	} else {
		MyModPlayer myModPlayer = Main.player[fromWho].GetModPlayer<MyModPlayer>();
		myModPlayer.someVal = someVal;
		myModPlayer.someInt = someInt;
	}
}
```

In the above example we're showcasing how you can model/design your send and receive methods to handle all involved parties: both connected clients and the server. 

In the Send() method, we're sending a packet that contains a float and int value, to some specific target and ignoring the passed fromWho client. In the Receive() method, we're reading the packet data, and then doing something based on if we're a server or client. You'll see that we read the fromWho data dependent on the Main.netMode. This is because this part of the packet only exists when the packet was sent by the server, so we can only read it if we're a client. You can do this to access the client that originally sent the packet, instead of 256 as fromWho which signifies the server. 

If you compare Send() and Receive() closely, you'll see that the order of reading and writing aligns. At the end of the Receive() method, we call Send() again and pass -1 as toWho which signifies every connected client, except the fromWho client. This makes the server forward the packet to other clients. Conditionally if we're not a server (so we're a connected client), we can set the newly read values in some place where we actually need them.

# Good practice managing many packets
If you work on a big mod, you might find yourself sending many packets which can become a hassle to manage without a proper setup. Recommended is to use a PacketHandler class that can make it easier to handle different packets. Feel free to use this class:
```cs
	internal abstract class PacketHandler
	{
		internal byte HandlerType { get; set; }
		
		public abstract void HandlePacket(BinaryReader reader, int fromWho);

		protected PacketHandler(byte handlerType)
		{
			HandlerType = handlerType;
		}

		protected ModPacket GetPacket(byte packetType, int fromWho)
		{
			var p = MyMod.Instance.GetPacket();
			p.Write(HandlerType);
			p.Write(packetType);
			if (Main.netMode == NetmodeID.Server)
			{
				p.Write((byte)fromWho);
			}
			return p;
		}
	}
```
This class takes care of some stuff for you, including writing the handler type and packet type. This will be useful when receiving packets, knowing where to forward to.

You can inherit this base class, for example when making a handler for "MyBossNPC":
```cs
	internal class MyBossNPCPacketHandler : PacketHandler
	{
		public MyBossNPCPacketHandler(byte handlerType) : base(handlerType)
		{
		}

		public override void HandlePacket(BinaryReader reader, int fromWho)
		{
			throw new NotImplementedException();
		}
	}
```
If we go by the example earlier, you might want to sync the target of this boss. You can modify the class to reflect this. You'll need to make HandlePacket switch by the packet type, and call the appropriate handling method for that packet:
```cs
	internal class MyBossNPCPacketHandler : PacketHandler
	{
		public const byte SyncTarget = 1;

		public MyBossNPCPacketHandler(byte handlerType) : base(handlerType)
		{
		}

		public override void HandlePacket(BinaryReader reader, int fromWho)
		{
			switch (reader.ReadByte())
			{
				case (SyncTarget):
					ReceiveTarget(reader, fromWho);
					break;
			}
		}

		public void SendTarget(int toWho, int fromWho, int npc, int target)
		{
			ModPacket packet = GetPacket(SyncTarget, fromWho);
			packet.Write(npc);
			packet.Write(target);
			packet.Send(toWho, fromWho);
		}

		public void ReceiveTarget(BinaryReader reader, int fromWho)
		{
			int npc = reader.ReadInt32();
			int target = reader.ReadInt32();
			if (Main.netMode == NetmodeID.Server) {
				SendTarget(-1, fromWho, npc, target);
			}
			else {
				NPC theNpc = Main.npc[npc];
				theNpc.oldTarget = theNpc.target;
				theNpc.target = target;
			}
		}
	}
```

The last thing you'll need to do, is actually call the appropriate PacketHandler class when your mod receives the packet. You can make a global class that handles this for you. In your mod class:
```cs
public override void HandlePacket(BinaryReader reader, int whoAmI) 
{
	ModNetHandler.HandlePacket(reader, whoAmI);
}
```

In your new ModNetHandler class:
```cs
internal class ModNetHandler 
{
	// When a lot of handlers are added, it might be wise to automate
	// creation of them
	public const byte MyBossNpcType = 1;
	internal static MyBossNPCPacketHandler myBossNpc = new MyBossNPCPacketHandler (MyBossNpcType);
	public static void HandlePacket(BinaryReader r, int fromWho)
	{
		switch (r.ReadByte())
		{
			case MyBossNpcType:
				myBossNpc.HandlePacket(r, fromWho);
				break;
		}
	}
}
```

With this setup, you can keep creating new PacketHandler classes to handle certain subjects in a more global way.


