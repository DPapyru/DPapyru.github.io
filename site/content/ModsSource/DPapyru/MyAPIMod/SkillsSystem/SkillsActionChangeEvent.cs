using System;
using System.Collections.Generic;
using System.Linq;

namespace ModDocProject.ModsSource.DPapyru.MyAPIMod.SkillsSystem
{
    /// <summary>
    /// 技能动作切换事件
    /// </summary>
    public class SkillsActionChangeEvent
    {
        /// <summary>
        /// 事件列表
        /// </summary>
        private readonly List<Func<bool>> _checkChangeAction = [];

        /// <summary>
        /// 事件本身,可以通过这些内容挂钩在这些事件上
        /// </summary>
        public event Func<bool> CheckChangeAction
        {
            add => _checkChangeAction.Add(value);
            remove => _checkChangeAction.Remove(value);
        }

        public bool CheckCanUse() => _checkChangeAction.All(checkChangeAction => checkChangeAction());

        /// <summary>
        /// 私有化保证外部不能随便调用
        /// </summary>
        private SkillsActionChangeEvent()
        {
        }

        /// <summary>
        /// 创建一个技能动作切换事件
        /// </summary>
        /// <returns></returns>
        public static SkillsActionChangeEvent Create() => new();

        /// <summary>
        /// 添加激活条件
        /// </summary>
        /// <param name="checkChangeAction">切换条件</param>
        /// <returns></returns>
        public SkillsActionChangeEvent Add(Func<bool> checkChangeAction)
        {
            // 添加事件
            CheckChangeAction += checkChangeAction;

            return this;
        }
    }
}