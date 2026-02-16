namespace DPapyru.Core.SkillsSystem;

/// <summary>
/// 技能的上下文
/// </summary>
public record struct SkillActionContext
{
    public SkillAction PreSkillAction;
    public Skill CurrentSkill;
}