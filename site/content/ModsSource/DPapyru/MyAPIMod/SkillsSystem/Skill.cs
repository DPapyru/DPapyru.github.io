using System.Collections.Generic;

namespace DPapyru.Core.SkillsSystem;

/// <summary>
/// 技能抽象类，用这个来负责管理技能
/// </summary>
public abstract class Skill
{
    public abstract List<SkillAction> RegisterSkillAction();
}
/// <summary>
/// 这边会通过依赖注入的形式，将技能系统注入到对应的类里面的SkillsSystem之中
/// </summary>
/// <typeparam name="T"></typeparam>
public abstract class Skill<T> : Skill where T : class
{
    
}
/// <summary>
/// 测试语法
/// </summary>
public class Combo1 : Skill
{
    public override List<SkillAction> RegisterSkillAction()
    {
        throw new System.NotImplementedException();
    }
}


/*
实际应该如此编写:
例如Combo1 
*/