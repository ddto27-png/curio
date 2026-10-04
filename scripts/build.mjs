import { mkdir, rm, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { IDEAS, PLACES, FEATURED_IDS } from '../src/catalog.mjs';
import { homePage, storyPage, savedPage, aboutPage, placesPage, notFoundPage } from '../src/pages.mjs';

export const root=fileURLToPath(new URL('../',import.meta.url));
export function validateCatalog(ideas=IDEAS,places=PLACES,featured=FEATURED_IDS){
  const ids=new Set();
  for(const idea of ideas){
    if(!/^[a-z0-9-]+$/.test(idea.id)||ids.has(idea.id))throw new Error(`Invalid or duplicate story ID: ${idea.id}`);
    ids.add(idea.id);
    for(const key of ['name','title','category','theme','description','maker','year','why','prompt','source','url'])if(typeof idea[key]!=='string'||!idea[key].trim())throw new Error(`Missing ${key}: ${idea.id}`);
    if(!['yellow','blue','pink','green'].includes(idea.color))throw new Error(`Unknown color: ${idea.id}`);
    if(new URL(idea.url).protocol!=='https:')throw new Error(`Unsafe source URL: ${idea.id}`);
  }
  if(featured.length!==4||new Set(featured).size!==4||featured.some(id=>!ids.has(id)))throw new Error('Featured stories must be four distinct catalog entries.');
  for(const place of places){
    if(!ids.has(place.id))throw new Error(`Place has no story: ${place.id}`);
    if(!Number.isFinite(place.lat)||Math.abs(place.lat)>90||!Number.isFinite(place.lon)||Math.abs(place.lon)>180)throw new Error(`Invalid coordinates: ${place.id}`);
  }
}
export async function build(){
  validateCatalog();
  const dist=join(root,'dist');
  // Only generated build output is removed; source and saved user data are never touched.
  await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
  const pages=[['index.html',homePage()],['places/index.html',placesPage()],['saved/index.html',savedPage()],['about/index.html',aboutPage()],['404.html',notFoundPage()],...IDEAS.map(i=>[`stories/${i.id}/index.html`,storyPage(i)])];
  for(const [path,html] of pages){await mkdir(resolve(dist,path,'..'),{recursive:true});await writeFile(join(dist,path),html);}
  for(const file of ['app.mjs','styles.css','icon.svg'])await copyFile(join(root,'public',file),join(dist,file));
  for(const file of ['catalog.mjs','art.mjs','cards.mjs','library.mjs','discovery.mjs'])await copyFile(join(root,'src',file),join(dist,file));
  return pages.map(([path])=>path);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const pages=await build();console.log(`Built ${pages.length} HTML pages into dist/.`);}
