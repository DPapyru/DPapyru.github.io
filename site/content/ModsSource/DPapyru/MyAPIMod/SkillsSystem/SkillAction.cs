using System.Collections.Generic;
using Microsoft.Xna.Framework;

namespace DPapyru.Core.SkillsSystem;

/// <summary>
/// 抽象类,用于技能的动作
/// </summary>
public abstract class SkillAction
{
    /// <summary>
    /// 用于切换下一个技能
    /// </summary>
    public Dictionary<SkillActionContext, List<SkillAction>> NextSkills { get; set; }
    /// <summary>
    /// 更新技能
    /// </summary>
    public virtual void Update() { }
    /// <summary>
    /// PreDraw用于绘制前，控制绘制使用
    /// </summary>
    /// <returns>返回true允许绘制</returns>
    public virtual bool PreDraw() => true;
    /// <summary>
    /// 使用绘制
    /// </summary>
    public virtual void Draw() { }
    /// <summary>
    /// 检查命中
    /// </summary>
    /// <param name="targetRect"></param>
    /// <returns></returns>
    public virtual bool? CheckHit(Rectangle targetRect) => null;
}
public interface IHitNPC
{
    public void ModifyHit();
    public void OnHit();
}