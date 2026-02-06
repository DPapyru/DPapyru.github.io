using System.Buffers;
using System.Collections.Generic;
using System.Linq.Expressions;
using Microsoft.Xna.Framework;

namespace ModDocProject.ModsSource.DPapyru.MyAPIMod.SkillsSystem
{
    /// <summary>
    /// 技能动作基类
    /// </summary>
    public abstract class SkillsAction
    {
        /// <summary>
        /// 通过技能事件切换的技能动作
        /// </summary>
        public Dictionary<SkillsActionChangeEvent, SkillsAction> SkillsChangeAction { get; } = new();

        /// <summary>
        /// 技能允许被切换的事件
        /// </summary>
        public SkillsActionChangeEvent SkillsActionChangeEvent { get; set; }

        #region 必要内容

        public abstract void Update();
        public abstract void Draw();
        public abstract bool CheckHit(Rectangle targetRect);

        #endregion
    }
}