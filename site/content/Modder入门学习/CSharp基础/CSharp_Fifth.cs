using System;

namespace ExMod.CSharpLearn
{
    public class CSharp_Fifth
    {
        public static void Main(string[] args)
        {
            string playerName = "Guide";
            int level = 16;

            PrintPlayerStatus(playerName, level);

            int damage = CalculateDamage(20, 5);
            Console.WriteLine("总伤害: " + damage);

            bool highDamage = IsHighDamage(damage);
            Console.WriteLine("是否高伤害: " + highDamage);
        }

        public static void PrintPlayerStatus(string playerName, int level)
        {
            Console.WriteLine("玩家: " + playerName);
            Console.WriteLine("等级: " + level);
        }

        public static int CalculateDamage(int baseDamage, int bonusDamage)
        {
            return baseDamage + bonusDamage;
        }

        public static bool IsHighDamage(int damage)
        {
            return damage >= 25;
        }
    }
}
