using System;

namespace Tutorial.CSharpIntro
{
    public static class CSharpIntroExamples
    {
        public static void HelloWorld()
        {
            Console.WriteLine("Hello, world!");
        }

        public static void CommonTypes()
        {
            int hp = 100;
            float speed = 3.5f;
            double rate = 0.25;
            bool isBoss = false;
            string name = "Slime";

            Console.WriteLine($"hp={hp}, speed={speed}, rate={rate}, isBoss={isBoss}, name={name}");
        }

        public static void VarInference()
        {
            var damage = 12;          // int
            var text = "hello";       // string
            var ratio = 0.5;          // double

            Console.WriteLine($"damage={damage}, text={text}, ratio={ratio}");
        }

        public static void BasicOps()
        {
            int a = 10;
            int b = 3;

            int sum = a + b;          // 13
            int diff = a - b;         // 7
            int mul = a * b;          // 30
            int div = a / b;          // 3  (整数除法)
            int mod = a % b;          // 1

            double div2 = a / (double)b; // 3.333...

            Console.WriteLine($"sum={sum}, diff={diff}, mul={mul}, div={div}, mod={mod}, div2={div2}");
        }

        public static void IfElse()
        {
            int hp = 20;

            if (hp <= 0)
            {
                // 这里会在 hp 小于等于 0 时执行
                Console.WriteLine("dead");
            }
            else if (hp < 50)
            {
                // hp 在 1~49
                Console.WriteLine("low");
            }
            else
            {
                // hp >= 50
                Console.WriteLine("ok");
            }
        }

        public static void ForLoop()
        {
            for (int i = 0; i < 5; i++)
            {
                // i: 0,1,2,3,4
                Console.WriteLine(i);
            }
        }

        public static void ForeachLoop()
        {
            int[] values = { 1, 2, 3 };

            foreach (int v in values)
            {
                // v: 1,2,3
                Console.WriteLine(v);
            }
        }

        public static int Add(int x, int y)
        {
            return x + y;
        }

        public static void CallAdd()
        {
            int result = Add(2, 3); // 5
            Console.WriteLine(result);
        }

        public static void PrintName(string name)
        {
            Console.WriteLine(name);
        }

        public static void UsePlayerData()
        {
            var p = new PlayerData(1, "Alice");
            int lv = p.Level;

            Console.WriteLine($"lv={lv}");
        }

        public static void NullPitfall()
        {
            string text = null;
            int len = text.Length; // 会抛异常

            Console.WriteLine(len);
        }

        public static void NullCheck()
        {
            string text = null;
            if (text != null)
            {
                int len = text.Length;
                Console.WriteLine(len);
            }
        }

        public static void Interpolation()
        {
            int damage = 12;
            string s = $"Damage: {damage}";
            Console.WriteLine(s);
        }
    }

    public sealed class PlayerData
    {
        public int Level;
        public string Nickname;

        public PlayerData(int level, string nickname)
        {
            Level = level;
            Nickname = nickname;
        }
    }
}
