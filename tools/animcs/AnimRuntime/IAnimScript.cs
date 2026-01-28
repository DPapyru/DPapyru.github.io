namespace AnimRuntime;

public interface IAnimScript
{
    void OnInit(AnimContext ctx);
    void OnUpdate(float dt);
    void OnRender(ICanvas2D g);
    void OnDispose();
}
