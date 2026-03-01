using System;

namespace ModDocProject.ModsSource.如何贡献
{
    public class MarkdownSyntaxDemo
    {
        public const int BaseDamage = 24;

        public string DisplayName { get; set; } = "ProtocolEmbed";

        public int TickCounter;

        public enum DemoState
        {
            Idle,
            Running,
            Completed
        }

        public int ComputeDamage(int level, string weaponTag)
        {
            if (string.IsNullOrWhiteSpace(weaponTag))
            {
                return BaseDamage;
            }

            return BaseDamage + Math.Max(0, level);
        }
    }
}
