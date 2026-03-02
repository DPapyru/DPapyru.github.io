using Microsoft.Xna.Framework;

namespace Microsoft.Xna.Framework.Graphics;

public readonly struct VertexPositionColorTexture
{
    public Vector3 Position { get; }
    public Color Color { get; }
    public Vector2 TextureCoordinate { get; }

    public VertexPositionColorTexture(Vector3 position, Color color, Vector2 textureCoordinate)
    {
        Position = position;
        Color = color;
        TextureCoordinate = textureCoordinate;
    }
}
