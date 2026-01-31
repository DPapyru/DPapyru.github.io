# 常见错误与解决方案

本文档记录项目开发中遇到的常见错误及其解决方案，供未来参考。

---

## C# 文档错误

### 错误 1：#region 重复标题

**症状**：生成的 `.generated.md` 文件中标题重复出现两次

**示例**：
```markdown
## 变量与数据类型

## 变量与数据类型  ← 重复！

变量是存储数据的容器...
```

**根本原因**：
- `#region Section Name` 会自动生成 `## Section Name` 标题
- 如果在 `DocMarkdown` 内容中再次写入 `## Section Name`，就会导致重复

**解决方案**：
1. 移除 `DocMarkdown` 常量中的重复标题
2. 内容直接从正文开始，不要再写 `## 标题`

**修复前（错误）**：
```csharp
#region 变量与数据类型
public const string DocMarkdown_2 = """
## 变量与数据类型  ← 删除这行！

变量是存储数据的容器...
""";
#endregion
```

**修复后（正确）**：
```csharp
#region 变量与数据类型
public const string DocMarkdown_2 = """
变量是存储数据的容器...  ← 直接开始正文
""";
#endregion
```

**预防措施**：
- 记住：`#region` 名称 = 生成的标题
- 写 C# 文档时，不要在内容中写 `##` 一级标题
- 子标题可以用 `###` 或更低级别

---

## 章节导航错误

### 错误 2：缺少上一章/下一章导航

**症状**：
- 文章在站点导航中孤立，没有前后章节的跳转按钮
- 读者无法按顺序浏览教程系列
- 文章之间没有逻辑连接

**示例**：
```yaml
---
title: "C# 基础数据类型"
order: 20
# 缺少 prev_chapter 和 next_chapter！
---
```

**根本原因**：
- 编写文章时只关注内容，忽略了章节间的导航连接
- 不理解 `prev_chapter` 和 `next_chapter` 的作用
- 系列文章没有统一规划

**解决方案**：

1. **确定文章在系列中的位置**
   - 查看同目录下的其他文章
   - 根据 `order` 值确定顺序

2. **添加章节导航属性**

   **Markdown 模式**：
   ```yaml
   ---
   title: "C# 基础数据类型"
   order: 20
   prev_chapter: ./CSharp语法基础.md
   next_chapter: ./CSharp变量与表达式.md
   ---
   ```

   **C# 模式**：
   ```csharp
   [PrevChapter("./CSharp语法基础.md")]
   [NextChapter("./CSharp变量与表达式.md")]
   public class CSharp基础数据类型 {
       // ...
   }
   ```

3. **验证路径正确性**
   - 使用相对路径 `./文件名.md`
   - 确保指向的文件真实存在
   - 检查路径大小写（Linux 区分大小写）

**修复示例**：

完整的 C# 章节文章应该像这样：
```csharp
using ModDocProject;

namespace ModDocProject.Modder入门学习.CSharp基础 {
    [Title("C# 基础数据类型")]
    [Tooltip("深入了解 C# 中的各种数据类型")]
    [Author("OpenCode")]
    [UpdateTime("2026-01-30")]
    [Topic("csharp-datatypes")]
    [Order(20)]
    [Difficulty("beginner")]
    [Time("25分钟")]
    [PrevChapter("./CSharp语法基础.md")]      // ← 上一章
    [NextChapter("./CSharp变量与表达式.md")]  // ← 下一章
    public class CSharp基础数据类型 {
        // ... 内容 ...
    }
}
```

**预防措施**：
- **规划先行**：创建系列文章前，先列出所有章节和顺序
- **统一 Order**：使用连续的 order 值（10, 20, 30...）预留插入空间
- **双向连接**：确保 A→B 的同时，B 也要指向 A 和 C
- **定期验证**：运行 `npm run generate-structure` 后检查导航是否正常

**检查要点**：
- 系列中的每篇文章都有 `order` 值
- 第一篇文章有 `next_chapter`，不写 `prev_chapter`
- 中间文章同时有 `prev_chapter` 和 `next_chapter`
- 最后一篇文章有 `prev_chapter`，不写 `next_chapter`
- 所有路径指向真实存在的文件

---

## 其他错误模板

### 错误：[错误名称]

**症状**：

**根本原因**：

**解决方案**：

**预防措施**：

---

## 如何添加新错误

当发现新错误时，按以下格式添加到本文档：

```markdown
### 错误 [编号]：[错误名称]

**症状**：简要描述错误的表现

**根本原因**：解释为什么会发生这个错误

**解决方案**：具体的修复步骤

**预防措施**：如何避免再次发生
```

---

*最后更新：2026-01-30*
