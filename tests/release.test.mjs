import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { IDEAS, PLACES, FEATURED_IDS, CATEGORIES, THEMES } from '../src/catalog.mjs';
import { readSaved, toggleSaved, STORAGE_KEY } from '../src/library.mjs';
import { filterIdeas, parseFilters, filterURL, legacyDestination } from '../src/discovery.mjs';
import { card } from '../src/cards.mjs';
import { storyPage } from '../src/pages.mjs';
import { build, validateCatalog, root } from '../scripts/build.mjs';
import { assetPath } from '../scripts/serve.mjs';

let pages;
before(async()=>{pages=await build();});
const ids=new Set(IDEAS.map(i=>i.id));
function storage(initial){let value=initial;return {getItem:()=>value,setItem:(_key,next)=>{value=next;}};}

test('existing browser saves retain recognized IDs without changing the storage key',()=>{
  const store=storage('["osmo","osmo","coperni","old",null]');
  assert.equal(STORAGE_KEY,'commonwealth-saved');assert.deepEqual([...readSaved(store,ids)],['osmo','coperni']);
});
test('save and removal persist through a fresh read',()=>{
  const store=storage(null);let saved=readSaved(store,ids);saved=toggleSaved(store,saved,'osmo',ids);
  assert.deepEqual([...readSaved(store,ids)],['osmo']);toggleSaved(store,saved,'osmo',ids);assert.equal(readSaved(store,ids).size,0);
});
test('failed storage writes do not mutate the previous saved collection',()=>{
  const saved=new Set(['coperni']);const store={setItem(){throw new Error('Quota exceeded');}};
  assert.throws(()=>toggleSaved(store,saved,'osmo',ids));assert.deepEqual([...saved],['coperni']);
});
test('corrupt storage and unknown save IDs fail instead of overwriting data',()=>{
  assert.throws(()=>readSaved(storage('{bad'),ids));assert.throws(()=>readSaved(storage('{}'),ids));
  assert.throws(()=>toggleSaved(storage('[]'),new Set(),'unknown',ids));
});
test('filters OR values within a category group and AND across category/theme groups',()=>{
  const items=filterIdeas(IDEAS,{categories:['Apps','Technology'],themes:['Memory']});
  assert.ok(items.some(i=>i.id==='remento'));assert.ok(items.some(i=>i.id==='polycam'));
  assert.ok(items.every(i=>i.theme==='Memory'&&['Apps','Technology'].includes(i.category)));
});
test('search finds maker text and ignores surrounding whitespace/case',()=>{
  assert.deepEqual(filterIdeas(IDEAS,{query:'  IOANNIS  '}).map(i=>i.id),['coperni']);
});
test('filter URLs round-trip and reject invalid or duplicated categories',()=>{
  const filters={query:'rooms & memory',categories:['Apps','Technology'],themes:['Memory']};
  assert.deepEqual(parseFilters(new URL(filterURL(filters),'https://curio.example').search,CATEGORIES,THEMES),filters);
  assert.deepEqual(parseFilters('?category=Apps&category=Apps&theme=Fake',CATEGORIES,THEMES),{query:'',categories:['Apps'],themes:[]});
});
test('old navigation links migrate but skip links and place anchors stay intact',()=>{
  assert.equal(legacyDestination('/','#saved'),'/saved/');assert.equal(legacyDestination('/','#about'),'/about/');
  assert.equal(legacyDestination('/','#main'),null);assert.equal(legacyDestination('/','#collection'),null);assert.equal(legacyDestination('/places/','#place-blur'),null);
});
test('the catalog retains 19 stories, 3 places, and the four original features',()=>{
  assert.equal(IDEAS.length,19);assert.equal(PLACES.length,3);assert.deepEqual(FEATURED_IDS,['coperni','corner','remento','osmo']);validateCatalog();
});
test('invalid catalog IDs and executable source URLs block the build',()=>{
  assert.throws(()=>validateCatalog([...IDEAS,IDEAS[0]]));
  assert.throws(()=>validateCatalog([{...IDEAS[0],url:'javascript:alert(1)'},...IDEAS.slice(1)]));
});
test('story text is escaped in headings, descriptions, and cards',()=>{
  const idea={...IDEAS[0],name:'<script>alert("x")</script>',description:'<img src=x onerror=alert(1)>'};
  const html=storyPage(idea);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<img src=x'));
  assert.ok(!card(idea).includes('<script>alert'));
});
test('all stories have HTML content and unique titles before JavaScript runs',async()=>{
  const titles=new Set();
  for(const idea of IDEAS){const html=await readFile(join(root,`dist/stories/${idea.id}/index.html`),'utf8');
    assert.ok(html.includes(`<h1>${idea.name}</h1>`));assert.ok(html.includes('What it is'));assert.ok(html.includes('Visit project'));
    titles.add(html.match(/<title>(.*?)<\/title>/)[1]);
  }assert.equal(titles.size,19);
});
test('each main page preserves the four tabs and exactly one active page',async()=>{
  for(const path of ['index.html','places/index.html','saved/index.html','about/index.html']){
    const html=await readFile(join(root,'dist',path),'utf8');const nav=html.match(/<nav[^>]*>(.*?)<\/nav>/s)[1];
    for(const label of ['Explore ideas','Places','Saved ideas','About'])assert.ok(nav.includes(label));
    assert.equal((nav.match(/aria-current="page"/g)||[]).length,1);
  }
});
test('every generated local link and asset resolves; no blanket SPA fallback hides 404s',async()=>{
  for(const path of pages){const html=await readFile(join(root,'dist',path),'utf8');
    for(const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[^\"]*)"/g)){
      const target=match[1];if(target.startsWith('//'))continue;
      const file=join(root,'dist',target.endsWith('/')?target+'index.html':target);await access(file);
    }
  }
  const config=JSON.parse(await readFile(join(root,'vercel.json'),'utf8'));assert.equal(config.outputDirectory,'dist');assert.equal(config.rewrites,undefined);await access(join(root,'dist/404.html'));
});
test('saved page is noindex and honestly explains browser-only persistence',async()=>{
  const html=await readFile(join(root,'dist/saved/index.html'),'utf8');assert.ok(html.includes('noindex,follow'));assert.ok(html.includes('No account or cloud sync yet.'));
});
test('preview server blocks filesystem traversal',()=>{
  assert.equal(assetPath('/%2e%2e/package.json'),null);assert.equal(assetPath('/..\\package.json'),null);assert.equal(assetPath('/%00'),null);
  assert.equal(assetPath('/stories/osmo/'),join(root,'dist/stories/osmo/index.html'));
});
test('build output is deterministic',async()=>{
  const first=await Promise.all(pages.map(p=>readFile(join(root,'dist',p),'utf8')));await build();
  assert.deepEqual(await Promise.all(pages.map(p=>readFile(join(root,'dist',p),'utf8'))),first);
});
