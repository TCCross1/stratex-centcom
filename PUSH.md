# Push this to GitHub

The repo is already initialized and committed. Two steps.

## 1. Create the empty repo on GitHub

Go to https://github.com/new

- Owner: **TCCross1**
- Repository name: **stratex-centcom**
- Private (recommended)
- **Do NOT** check "Add a README", "Add .gitignore", or "Choose a license" —
  the repo already has them, and adding them creates a conflict.

Click **Create repository**.

## 2. Push from your Mac

Unzip this folder, then in Terminal:

```bash
cd stratex-centcom
git remote add origin https://github.com/TCCross1/stratex-centcom.git
git branch -M main
git push -u origin main
```

If it asks for a password, GitHub wants a **personal access token**, not your
account password. Make one at:
https://github.com/settings/tokens → Generate new token (classic) → check `repo`
→ copy it and paste it as the password.

### If you use the GitHub CLI instead

```bash
cd stratex-centcom
gh repo create TCCross1/stratex-centcom --private --source=. --push
```

That does both steps in one command.

## After it's up

```bash
npm install
npm test          # 5 suites, ~395 assertions
npm run dev -- --host
```
