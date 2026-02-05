local function find_repo_root()
    local cwd = (vim.uv and vim.uv.cwd()) or vim.fn.getcwd()
    local marker = vim.fs.find({ ".marksman.toml", ".git" }, { path = cwd, upward = true })[1]

    if marker then
        return vim.fs.dirname(marker)
    end

    return cwd
end

-- LazyVim uses Nerd Font glyphs for many UI icons.
-- This repo assumes you use a Nerd Font-capable terminal.
if vim.g.have_nerd_font == nil then
    vim.g.have_nerd_font = true
end

local root = find_repo_root()
local rtp = vim.opt.rtp:get()

if not vim.tbl_contains(rtp, root) then
    vim.opt.rtp:append(root)
end
