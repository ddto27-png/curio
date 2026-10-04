import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './build.mjs';

function run(args){const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);}
for(const dir of ['src','public','scripts','tests'])for(const file of readdirSync(join(root,dir)).filter(f=>f.endsWith('.mjs')))run(['--check',`${dir}/${file}`]);
run(['--test',...readdirSync(join(root,'tests')).filter(f=>f.endsWith('.test.mjs')).map(f=>`tests/${f}`)]);
run(['scripts/build.mjs']);
