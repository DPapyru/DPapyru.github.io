sampler2D uImage0 : register(s0);
sampler2D uImage1 : register(s1);

float4 MainPS(float2 texCoord : TEXCOORD0) : COLOR0
{
    float2 uv = texCoord;
    float4 color = tex2D(uImage0, uv);
    
    if (color.a < 0.01)
        discard;
    float noise = tex2D(uImage1, uv).r;
    float threshold = 0.7;
    float dist = noise - threshold;
    
    if (dist < 0.15 && dist >= 0.)
    {
        float3 fogSum = float3(0., 0., 0.);
        float fogWeight = 0.;
        
        for (float i = 0.; i < 6.; i++)
        {
            float angle = i * 1.047;
            float radius = (dist / 0.15) * 0.02;
            float2 offset = float2(cos(angle), sin(angle)) * radius;
            
            float4 samp = tex2D(uImage0, uv + offset);
            if (samp.a > 0.01)
            {
                float weight = 1.0 - dist / 0.15;
                fogSum += samp.rgb * weight;
                fogWeight += weight;
            }
        }
        
        if (fogWeight > 0.)
        {
            float3 fogColor = fogSum / fogWeight;
            float fogFactor = 1.0 - smoothstep(0., 0.15, dist);
            color.rgb = lerp(fogColor, color.rgb,0.);
        }
    }
    return color;
}

technique MainTechnique
{
    pass P0
    {
        PixelShader = compile ps_2_0 MainPS();
    }
}
