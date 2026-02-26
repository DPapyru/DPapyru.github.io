float uPulse;
float2 uCenter;
float4 uTint;

float4 MainVS(float3 position : POSITION0, float2 texCoord : TEXCOORD0, float4 color : COLOR0) : SV_Position
{
    float wave = sin(uTime * 2.5 + texCoord.x * 6.28318) * (10.0 + uPulse * 12.0);
    return float4(position.x, position.y + wave, position.z, 1.0);
}

float4 MainPS(float2 texCoord : TEXCOORD0, float4 vertexColor : COLOR0) : COLOR0
{
    float pulse = 0.55 + 0.45 * sin(uTime * 3.0 + texCoord.y * 10.0);
    float3 tint = uTint.rgb * pulse;
    return float4(tint, uTint.a) * vertexColor;
}
