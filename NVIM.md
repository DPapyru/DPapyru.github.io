# Neovim / LazyVim setup

This repository is a Git worktree. Some tools rely on a "project root" marker.

## One-time prerequisites

1. Install language servers
   - `marksman` (Markdown)
   - `omnisharp` (C#)

2. Enable project-local config in Neovim

This repo ships a minimal `.nvim.lua`.

- Enable `exrc` once in your user config:
  - `vim.opt.exrc = true`
- Trust this repository once:
  - `:trust .nvim.lua`

## Fonts (if you see "unknown characters")

LazyVim uses Nerd Font glyphs for many UI icons.

- Recommended: install a Nerd Font and set your terminal font (Windows Terminal / VS Code terminal) to it.
  - Examples: "JetBrainsMono Nerd Font", "CaskaydiaMono Nerd Font"

This repo defaults to `vim.g.have_nerd_font = true` in `.nvim.lua`.
If you don't use a Nerd Font, set it to `false` in your user config.

## Why this is needed

- `marksman` treats a Git worktree as "bogus" unless `.marksman.toml` exists (worktrees have `.git` as a file).
- Custom Markdown syntax highlighting for this site is shipped as Tree-sitter query overrides under `after/queries/...`.
  Neovim only loads query overrides from the runtimepath, so `.nvim.lua` adds the repo root to runtimepath.

## C# (tModLoader) notes

`site/content/ModDocProject.csproj` supports setting `tMLTargetsPath`.

- If your Steam path differs, set `tMLTargetsPath` for your build/LSP environment so OmniSharp can resolve tModLoader references.
  - Windows example (PowerShell): `$env:tMLTargetsPath = 'D:\\Steam\\steamapps\\common\\tModLoader\\tMLMod.targets'`
  - WSL example (bash): `export tMLTargetsPath=/mnt/d/Steam/steamapps/common/tModLoader/tMLMod.targets`
