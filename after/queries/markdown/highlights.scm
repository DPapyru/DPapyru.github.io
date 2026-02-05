;; extends

; Repo-specific Markdown extensions (see `site/content/怎么贡献/站点Markdown扩展语法说明.md`).
; These are rendered by the site tooling, so we highlight them in-editor.

; {[path][title]} reference blocks
((paragraph (inline) @markup.link)
  (#match? @markup.link "^\\{\\[[^\\]]+\\]\\[[^\\]]+\\]\\}\\s*$"))

; {if condition} / {else} / {end}
((paragraph (inline) @keyword.conditional)
  (#match? @keyword.conditional "^\\{if\\b.*\\}\\s*$"))

((paragraph (inline) @keyword.conditional)
  (#match? @keyword.conditional "^\\{else\\}\\s*$"))

((paragraph (inline) @keyword.conditional)
  (#match? @keyword.conditional "^\\{end\\}\\s*$"))

; {color:xxx}{text} and {colorChange:xxx}{text}
((paragraph (inline) @string.special)
  (#match? @string.special "^\\{color(Change)?:[^}]+\\}\\{[^}]*\\}\\s*$"))
