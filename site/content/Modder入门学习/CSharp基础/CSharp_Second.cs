using System;

namespace ExMod.CSharpLearn
{
    public class CSharp_Second
    {
        public static void Main(string[] args)
        {
            int level = 5;
            float attackSpeed = 1.25f;
            double criticalRate = 0.153;
            decimal price = 19.99m;
            bool isOnline = true;
            char rank = 'A';
            string playerName = "Guide";

            var score = 1200;
            var title = "Rookie";

            Console.WriteLine("玩家: " + playerName);
            Console.WriteLine("等级: " + level);
            Console.WriteLine("攻速: " + attackSpeed);
            Console.WriteLine("暴击率: " + criticalRate);
            Console.WriteLine("价格: " + price);
            Console.WriteLine("在线: " + isOnline);
            Console.WriteLine("评级: " + rank);
            Console.WriteLine("分数: " + score);
            Console.WriteLine("称号: " + title);
        }
    }
}
