ï»¿using Terraria.ModLoader;

// å½åç©ºé´,é»è®¤æåµä¸,è´´å¾å­æ¾è·¯å¾éè¦åå½åç©ºé´å¯¹åº
namespace ModDocProject.ModsSource.Modderå¥é¨
{
    // ç±»å,é»è®¤æåµä¸,è´´å¾åå­éè¦åç±»åå¯¹åº
    public class FirstClass_MakeFirstWeapon : ModItem
    {
        public override void SetDefaults()
        {
            Item.width = Item.height = 32; // ç©åå¨ä¸ççå®½åº¦ï¼ä¸å½±åææ
            Item.damage = 30; // ç©åçä¼¤å®³
            Item.knockBack = 1f; // ç©åçå»éå
            Item.crit = 5; // ç©åçæ´å»çï¼é»è®¤æ´å»ç+4%ï¼æä»¥è¿éå¶å®æ¯9%çæ´å»ç
            Item.useAnimation = Item.useTime = 30; // ä½¿ç¨ç©åçå¨ç»éåº¦/ä½¿ç¨ç©åçä½¿ç¨éåº¦
            // ä¸é¢çåå®¹åååé¢ä¼è®²
        }

        public override void AddRecipes()
        {
            
        }
    }
}