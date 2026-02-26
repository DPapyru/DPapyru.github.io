// tModLoader 风格 .fx 默认模板（完整 HLSL）
// 可用纹理: iChannel0-3（兼容 uImage0-3）
// 后缀请使用 .fx

sampler2D uImage0 : register(s0);

float4 MainPS(float2 texCoord : TEXCOORD0) : COLOR0
{
    float2 uv = texCoord;
    float4 baseColor = tex2D(uImage0, uv);
    return float4(1.,1.,1.,0.);
}

technique MainTechnique
{
    pass P0
    {
        PixelShader = compile ps_2_0 MainPS();
    }
}
