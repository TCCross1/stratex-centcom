import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const targets = [];
const walk = (dir) => {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist'].includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (['.js', '.mjs'].includes(path.extname(ent.name).toLowerCase())) targets.push(full);
  }
};
walk(path.join(root, 'src'));
walk(path.join(root, 'scripts'));

let pass = 0;
for (const file of targets) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status === 0) pass++;
  else {
    console.log(`FAIL ${path.relative(root, file)}`);
    if (result.stderr) console.log(result.stderr.trim());
  }
}
console.log(`NODE PARSE: ${pass} / ${targets.length} FILES PASS`);
process.exit(pass === targets.length ? 0 : 1);
