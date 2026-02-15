---
name: agents-tell-down-collab
description: Coordinate project-specific parallel development with `Agents_Tell.md`, `Agents_Down.md`, and git worktrees. Use when work must be tracked through append-only task claims, overlap checks, progress logs, completion records, and verification linkage to `ERRORS.md`.
---

# Agents Tell/Down Collaboration

## Execute The Protocol

1. Read `AGENTS.md` for baseline repository workflow, then apply this skill as the collaboration protocol.
2. Open `Agents_Tell.md` and `Agents_Down.md` before making changes.
3. Create or switch to the task-specific git worktree if the task writes repository files.
4. Keep one worktree focused on one task goal.

## Claim The Task In `Agents_Tell.md`

1. Append a new task record at file end; never rewrite prior entries.
2. Fill all required fields: `task_id`, `original_request`, `owner`, `worktree`, `branch`, `status`, `started_at`, `depends_on`, `scope`, `overlap_check`, `own_scope`, and first `progress_log`.
3. Start with `status: claimed`, then move to `in_progress` when implementation starts.
4. Keep updating `progress_log` with timestamped entries.

Use `references/record-templates.md` for copy-ready blocks.

## Coordinate Conflicts And Takeover

1. Mark the newer task as `blocked` when `scope` overlaps.
2. Record conflict task IDs and coordination result in `progress_log`.
3. Avoid edits in overlapping files until coordination completes.
4. For takeover, append a new claim referencing `depends_on: <old_task_id>` and include takeover reason in `progress_log`.

## Close The Task In `Agents_Down.md`

1. Append a completion record at file end; never rewrite prior entries.
2. Include `changed_files` and command-level `verification` results.
3. Set `merge_ready` explicitly to `yes` or `no`.
4. Document residual risks in `note`.

## Enforce Merge Gate

1. Confirm `Agents_Tell.md` has `status: done` with complete `progress_log`.
2. Confirm `Agents_Down.md` has matching `task_id` completion record.
3. Confirm `changed_files` matches actual diff scope.
4. Confirm verification records match `ERRORS.md` for build/check commands when applicable.

## Use The Reference

- Open `references/record-templates.md` when creating or updating task records.
