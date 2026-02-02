using System;

namespace ModDocProject {
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public sealed class TitleAttribute : Attribute {
        public TitleAttribute(string value) {
            Value = value;
        }
        public string Value { get; }
    }

    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public sealed class TooltipAttribute : Attribute {
        public TooltipAttribute(string value) {
            Value = value;
        }
        public string Value { get; }
    }

    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public sealed class AuthorAttribute : Attribute {
        public AuthorAttribute(string value) {
            Value = value;
        }
        public string Value { get; }
    }

    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public sealed class CategoryAttribute : Attribute {
        public CategoryAttribute(string value) {
            Value = value;
        }
        public string Value { get; }
    }

    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public sealed class TopicAttribute : Attribute {
        public TopicAttribute(string value) {
            Value = value;
        }
        public string Value { get; }
    }

    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public sealed class DifficultyAttribute : Attribute {
        public DifficultyAttribute(string value) {
            Value = value;
        }
        public string Value { get; }
    }

    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public sealed class TimeAttribute : Attribute {
        public TimeAttribute(string value) {
            Value = value;
        }
        public string Value { get; }
    }

    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public sealed class OrderAttribute : Attribute {
        public OrderAttribute(int value) {
            Value = value;
        }
        public int Value { get; }
    }

    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public sealed class TagsAttribute : Attribute {
        public TagsAttribute(string value) {
            Value = value;
        }
        public string Value { get; }
    }

    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public sealed class PrevChapterAttribute : Attribute {
        public PrevChapterAttribute(string value) {
            Value = value;
        }
        public PrevChapterAttribute(Type type) {
            Value = type?.Name ?? string.Empty;
        }
        public string Value { get; }
    }

    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public sealed class NextChapterAttribute : Attribute {
        public NextChapterAttribute(string value) {
            Value = value;
        }
        public NextChapterAttribute(Type type) {
            Value = type?.Name ?? string.Empty;
        }
        public string Value { get; }
    }

    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public sealed class HideAttribute : Attribute {
        public HideAttribute(bool value) {
            Value = value;
        }
        public bool Value { get; }
    }
}
