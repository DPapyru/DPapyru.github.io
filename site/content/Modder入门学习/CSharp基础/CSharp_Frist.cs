using System;

namespace ExMod.CSharpLearn
{
    public class CSharp_Frist
    {
        /// <summary>
        /// C# 的主方法，程序入口点
        /// </summary>
        public static void Main(string[] args)
        {
            // 1) 先声明变量
            string playerName = "Guide";
            int level = 1;
            bool isOnline = true;

            // 2) 表达式
            int nextLevel = level + 1;

            // 3) 作用域演示
            {
                string localMessage = "这段文本只在当前作用域可见";
                Console.WriteLine(localMessage);
            }

            // localMessage 在这里不可见

            Console.WriteLine("玩家: " + playerName);
            Console.WriteLine("当前等级: " + level);
            Console.WriteLine("下一等级: " + nextLevel);
            Console.WriteLine("在线状态: " + isOnline);
        }
    }
}
