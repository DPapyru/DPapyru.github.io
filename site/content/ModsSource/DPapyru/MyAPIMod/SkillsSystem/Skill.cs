using System;
using System.Collections.Generic;

namespace DPapyru.Core.SkillsSystem;

/// <summary>
/// 技能抽象类，用这个来负责管理技能
/// 技能只干动作链接!
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
/// 技能动作激活条件
/// </summary>
public record struct SkillsActionActiveCondition
{
    
}
/// <summary>
/// 激活条件列表
/// </summary>
public struct ActiveConditionList
{
    /// <summary>
    /// 检查列表
    /// </summary>
    public List<Func<bool>> CheckList;
    /// <summary>
    /// 添加检查委托
    /// </summary>
    /// <param name="func"></param>
    /// <returns></returns>
    public ActiveConditionList AddCondition(Func<bool> func)
    {
        CheckList.Add(func);
        return this;
    }
}

/*
实际应该如此编写:
例如Combo1 
*/