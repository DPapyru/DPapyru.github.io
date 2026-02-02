using Terraria.ModLoader;
using ModDocProject;

namespace ModDocProject.Items
{
    /// <summary>一个最小的示例物品类。</summary>
    /// <remarks>
    /// ## 写法示例
    /// 这里是正文 Markdown，构建时会被提取为文章内容。
    /// </remarks>
    [Title("第一个物品")]
    [Tooltip("这是介绍")]
    [Category("入门")]
    [Topic("mod-basics")]
    [Hide(true)]
    public class TestItem : ModItem
    {
#if DOCS
        /// <remarks>
        /// ## DOCS 追加段落
        /// 这个段落来自预处理器区域，只用于文档，不影响编译。
        /// </remarks>
#endif
    }
}
