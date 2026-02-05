namespace ExMod.CSharpLearn
{
    public class CSharp_Frist
    {
        /// <summary>
        /// 这里是C#的主方法，程序的入口点
        /// <para>程序的运行从这里开始</para>
        /// </summary>
        public static void Main(string[] args)
        {
            // 此写法为定义变量
            int a = 0;
            int b = 1;

            // 下面展示花括号决定作用域
            {
                int c = 0;
            }
            // 花括号决定作用域
            // c = 2;

            // 这里是表达式
            int sum = a + b;
        }
    }
}
