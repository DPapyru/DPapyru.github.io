# Record Templates

Use these templates as append-only entries.

## `Agents_Tell.md` claim template

```md
## [task_id] <任务标题>
- original_request: <原始需求>
- owner: <Agent或负责人>
- worktree: <.worktrees/...>
- branch: <分支名>
- status: claimed
- started_at: <YYYY-MM-DD HH:mm>
- eta: <预计完成时间，可空>
- depends_on: <依赖任务ID，无则写 none>
- scope: <将要修改的文件或目录，多个用逗号分隔>
- overlap_check: <与现有任务是否冲突：none / task_id>
- own_scope: <自己明确负责的子任务>
- progress_log: <首条日志，格式“YYYY-MM-DD HH:mm | claimed | 备注”>
```

Allowed `status` values:

- `claimed`
- `in_progress`
- `blocked`
- `done`
- `merged`

Progress log update example:

```md
- progress_log: 2026-02-15 21:10 | claimed | 已认领任务并完成范围核对；2026-02-15 21:25 | in_progress | 开始实现与验证
```

## `Agents_Down.md` completion template

```md
## [task_id] <任务标题>
- owner: <Agent或负责人>
- worktree: <.worktrees/...>
- branch: <分支名>
- finished_at: <YYYY-MM-DD HH:mm>
- changed_files: <实际修改文件，多个用逗号分隔>
- verification: <执行过的命令与结果；若未执行写明原因>
- merge_ready: <yes/no>
- note: <风险、遗留问题、给 main 合并者的说明>
```

Verification recommendation:

- Log exact commands and pass/fail.
- Mention blocker root cause when a command fails.
- Sync build/check outcomes into `ERRORS.md`.
