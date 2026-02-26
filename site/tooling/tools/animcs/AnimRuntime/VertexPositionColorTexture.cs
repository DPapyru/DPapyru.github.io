using AnimRuntime.Math;

namespace AnimRuntime;

public readonly struct VertexPositionColorTexture
{
    public Vec3 Position { get; }
    public Color Color { get; }
    public Vec2 TextureCoordinate { get; }

    public VertexPositionColorTexture(Vec3 position, Color color, Vec2 textureCoordinate)
    {
        Position = position;
        Color = color;
        TextureCoordinate = textureCoordinate;
    }
}
