namespace ModDocProject.Modder入门学习.CSharp基础
{
    [Title("C#基础教程-第一课-C#语法基础")]
    [Tooltip("C#基础第一课，用于学习C#的基础语法知识")]
    [Author("小天使")]
    [Date("2026-02-02")]
    [UpdateTime("2026-02-02")]
    [Difficulty("Beginner")]
    [Time("30分钟")]
    [Order(1)]
    public class CSharp_Frist
    {
#if DOCS
        private const string DocMarkdownIntro = @"
这里是整个绿群教程的C#教程的开始，这边我希望大家能够好好学习C#基础语法，可以通过此教程网页的功能来查看C#源代码（如果它有的话）
";
#endif

        #region 经典代码段
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

        #endregion
    }
}