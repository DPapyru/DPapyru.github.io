using AnimRuntime.Math;

namespace AnimRuntime;

public interface ICanvas2D
{
    void Clear(Color color);
    void Line(Vec2 from, Vec2 to, Color color, float width = 1f);
    void Circle(Vec2 center, float radius, Color color, float width = 1f);
    void FillCircle(Vec2 center, float radius, Color color);
}
