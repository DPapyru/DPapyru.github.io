using System.Collections.Generic;

/// <summary>
/// 抽象类,用于技能的动作
/// </summary>
public abstract class SkillAction
{
    /// <summary>
    /// 用于切换下一个技能
    /// </summary>
    public Dictionary<SkillActionContext, SkillAction> NextSkills { get; set; }
}
public record struct SkillActionContext
{

}