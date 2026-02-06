using System.Collections.Generic;

namespace ModDocProject.ModsSource.DPapyru.MyAPIMod.SkillsSystem
{
    /// <summary>
    /// 技能基类
    /// </summary>
    public abstract class Skill
    {
        public abstract IEnumerable<(SkillsAction, SkillsActionChangeEvent)> InitSkills();
    }
}