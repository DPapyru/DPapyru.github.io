using System;

namespace ExMod.CSharpLearn
{
    public class CSharp_Third
    {
        public static void Main(string[] args)
        {
            int baseDamage = 20;
            int bonusDamage = 8;
            int damage = baseDamage + bonusDamage;

            int hitCount = 9;
            int remain = hitCount % 2;

            bool isHighDamage = damage >= 25;
            bool isNight = true;
            bool isPlayerReady = true;

            bool canSpawnBoss = isNight && isPlayerReady;
            bool needMoreDamage = !isHighDamage;

            Console.WriteLine("总伤害: " + damage);
            Console.WriteLine("余数: " + remain);
            Console.WriteLine("高伤害: " + isHighDamage);
            Console.WriteLine("可召唤Boss: " + canSpawnBoss);
            Console.WriteLine("需要提升伤害: " + needMoreDamage);
        }
    }
}
