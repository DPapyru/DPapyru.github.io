float4 mainImage(float2 fragCoord)
{
    float2 uv = fragCoord / iResolution.xy;
    float pulse = 0.55 + 0.45 * sin(iTime * 1.2);
    return float4(uv.x, uv.y * pulse, 0.82, 1.0);
}
