using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Xna.Framework;
using Terraria;

namespace ModDocProject.ModsSource.DPapyru.MyAPIMod.SkillsSystem
{
    /// <summary>
    /// 技能管理类，不能继承
    /// </summary>
    public sealed class SkillSystem
    {
        /// <summary>
        /// 执行的动作
        /// </summary>
        public List<SkillsAction> Actions { get; } = [];

        /// <summary>
        /// 通过动作映射到对应的Skill
        /// </summary>
        public Dictionary<SkillsAction, Skill> Skills { get; } = [];

        /// <summary>
        /// 目前执行的技能,修改无直接作用,通过这个获取当前技能Combo
        /// </summary>
        public Skill CurrentSkill { get; private set; }

        /// <summary>
        /// 目前执行的动作
        /// </summary>
        public SkillsAction CurrentSkillsAction { get; private set; }

        /// <summary>
        /// 用于测试的公共设置方法
        /// </summary>
        internal void SetCurrentAction(SkillsAction action)
        {
            CurrentSkillsAction = action;
            if (Skills.TryGetValue(action, out var skill))
            {
                CurrentSkill = skill;
            }
        }

        public void SkillActionsUpdate()
        {
            if (CurrentSkillsAction == null) return;

            // 更新当前动作
            CurrentSkillsAction.Update();

            // 检查是否满足切换条件
            foreach (SkillsAction nextAction in from kvp in CurrentSkillsAction.SkillsChangeAction
                     let changeEvent = kvp.Key
                     let nextAction = kvp.Value
                     let allConditionsMet = changeEvent.CheckCanUse()
                     where allConditionsMet
                     select nextAction)
            {
                // 切换到下一个动作
                SwitchToAction(nextAction);
                break;
            }
        }

        private void SwitchToAction(SkillsAction newAction)
        {
            // 查找新动作对应的技能
            if (Skills.TryGetValue(newAction, out var newSkill))
            {
                CurrentSkill = newSkill;
            }
        
            CurrentSkillsAction = newAction;
        }

        public class SkillActionT : SkillsAction
        {
            public override bool CheckHit(Rectangle targetRect) => throw new NotImplementedException();

            public override void Draw()
            {
                throw new NotImplementedException();
            }

            public override void Update()
            {
                Console.WriteLine("测试内容");
            }
        }

        public class SkillT : Skill
        {
            public override IEnumerable<(SkillsAction, SkillsActionChangeEvent)> InitSkills()
            {
                yield return (new SkillActionT(), SkillsActionChangeEvent.Create().Add(() => Main.mouseLeft));
                yield return (new SkillActionT(), SkillsActionChangeEvent.Create().Add(() => true));
            }
        }
    }
}