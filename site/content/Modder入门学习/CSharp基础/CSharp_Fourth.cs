using System;

namespace ExMod.CSharpLearn
{
    public class CSharp_Fourth
    {
        public static void Main(string[] args)
        {
            int level = 12;

            if (level < 10)
            {
                Console.WriteLine("新手阶段");
            }
            else if (level < 20)
            {
                Console.WriteLine("进阶阶段");
            }
            else
            {
                Console.WriteLine("高阶阶段");
            }

            int difficulty = 2;
            switch (difficulty)
            {
                case 1:
                    Console.WriteLine("普通难度");
                    break;
                case 2:
                    Console.WriteLine("专家难度");
                    break;
                default:
                    Console.WriteLine("大师难度");
                    break;
            }

            for (int i = 0; i < 5; i++)
            {
                if (i == 3)
                {
                    continue;
                }

                Console.WriteLine("for循环计数: " + i);
            }

            int count = 3;
            while (count > 0)
            {
                Console.WriteLine("while剩余: " + count);
                count--;
            }
        }
    }
}
