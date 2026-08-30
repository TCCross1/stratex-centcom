# Push to TCCross1/stratex-centcom

The repo already exists and this folder is already a git repo with your code
committed. You just need to connect them and push.

**One thing to know first:** GitHub created your repo with 1 commit already in
it (the auto-generated README). Your local history and that commit are
unrelated, so a plain `git push` gets rejected. The commands below handle it.

---

## Do this on your Mac

Unzip this folder, then open Terminal and run:

```bash
cd ~/Downloads/stratex-centcom
git remote add origin https://github.com/TCCross1/stratex-centcom.git
git branch -M main
git push -u origin main --force
```

`--force` is safe here. The only thing it replaces is GitHub's placeholder
README. Nothing of yours is at risk — your code has never been pushed yet.

If Terminal asks for a password, GitHub wants a **personal access token**, not
your account password:
https://github.com/settings/tokens → Generate new token (classic) → tick `repo`
→ copy it → paste as the password.

---

## Or, with the GitHub CLI

If you have `gh` installed:

```bash
cd ~/Downloads/stratex-centcom
gh repo set-default TCCross1/stratex-centcom
git remote add origin https://github.com/TCCross1/stratex-centcom.git
git push -u origin main --force
```

---

## After it's up

```bash
npm install
npm test                  # 5 suites, ~395 assertions
npm run dev -- --host
```

`--host` prints a second address like `http://192.168.1.42:5173`. Open that on
your phone, same wifi, to check the mobile layout.

---

## Every future change

```bash
git add -A
git commit -m "what you changed"
git push
```

No `--force` after this first one. You only needed it once.
