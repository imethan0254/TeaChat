# Co-Edit Workflow

Team 內多人 PR-based 共編,規範 + tooling。

## Branch + PR flow

```
# 1. Pull latest main
git checkout main && git pull

# 2. Branch
git checkout -b feat/<your-feature-name>

# 3. Edit + commit + push
git add . && git commit -m "feat(<scope>): <description>"
git push -u origin feat/<your-feature-name>

# 4. Open PR via GitHub UI(或 gh CLI:gh-pr-create)
```

## CI 自動跑(每 PR / push)

- `audit.yml`:tsc + lint:imports + build all apps
- `deploy.yml`:per-app Netlify preview deploy(若 secrets 配好)
- `sync-design-system.yml`:`repository_dispatch`(DS publish 後 auto dispatch `design-system-published` / `ds-ssot-changed`)+ `workflow_dispatch`(fork user 主動觸發)。**2026-05-27 拿掉 daily cron** per user verbatim「只要確保主動更新時能同步到最新就好」。Fallback:Dependabot daily auto-PR(若 DS dispatch 失敗)

## Code review(CODEOWNERS)

`.github/CODEOWNERS`:
```
* @ajenchen   # ← fork user 第 1 件事:改成自己 GitHub username(或 team handle)
```

**Fork user 必跑**:
```bash
sed -i '' 's/@ajenchen/@<your-github-username>/g' .github/CODEOWNERS
```

加 team member 後改 per-app owner:
```
/apps/order-dashboard/ @wendy @teammate2
```

## Conflict resolution

```
# 同步 main(上 PR 前必跑)
git checkout main && git pull
git checkout feat/<your-branch>
git rebase main  # 或 git merge main

# 解 conflict(編輯 file → git add → git rebase --continue)
git push --force-with-lease
```

## 禁忌

- **禁** 改 `node_modules/@qijenchen/design-system/`(直接改 node_modules 是 antipattern)
- **禁** import DS internal paths(`/src/...` / `/dist/...`)— hook 攔
- **禁** force-push main(branch protection 應該攔)

## Next

→ `docs/04-ds-upgrade.md` DS 升級 + codemod
