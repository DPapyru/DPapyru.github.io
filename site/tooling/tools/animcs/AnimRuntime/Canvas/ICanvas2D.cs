using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;

namespace AnimRuntime;

public interface ICanvas2D
{
    void Clear(Color color);
    void Line(Vector2 from, Vector2 to, Color color, float width = 1f);
    void Circle(Vector2 center, float radius, Color color, float width = 1f);
    void FillCircle(Vector2 center, float radius, Color color);
    void Text(string text, Vector2 position, Color color, float size = 12f);
    void UseEffect(string shaderPath);
    void ClearEffect();
    void SetBlendState(BlendState state);
    void SetTexture(int slot, string texturePath);
    void SetFloat(string name, float value);
    void SetVector2(string name, Vector2 value);
    void SetColor(string name, Color value);
    void DrawUserIndexedPrimitives(
        PrimitiveType primitiveType,
        VertexPositionColorTexture[] vertices,
        int vertexOffset,
        int numVertices,
        int[] indices,
        int indexOffset,
        int primitiveCount
    );
}
