## One clone per repo — no worktrees, no parallel checkouts

- Work on a branch inside the existing clone at `~/Projects/<repo>`. Never run `git worktree add`, never `git clone` a repo that already exists on this machine, never create a checkout under `~/Documents`, `~/Claude`, `/tmp`, or a `<repo>-<topic>` sibling folder.
- If you need isolation for a second task, finish or stash-to-branch the first: `git checkout -b wip/<topic>`, commit, push. Then switch.
- Before you stop: every branch you created is pushed; no dirty files; no stashes. Delete your branch locally and on origin once it is merged.
- If you find a worktree or duplicate clone, report it; do not create another to work around it.
- The only place a repo lives is `~/Projects/<repo>`. Non-git assets go in `~/Projects/_clients/` or `~/Projects/_assets/`.
