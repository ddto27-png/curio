import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from './build.mjs';

export function assetPath(pathname){
  const path=decodeURIComponent(pathname);
  if(path.includes('\0')||path.split('/').includes('..')||path.includes('\\'))return null;
  return resolve(root,'dist',`.${path.endsWith('/')?path+'index.html':path}`);
}
export function previewServer(){return createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    if(!extname(url.pathname)&&!url.pathname.endsWith('/')){res.writeHead(308,{Location:url.pathname+'/'+url.search});res.end();return;}
    const path=assetPath(url.pathname);if(!path)throw new Error('Invalid path');
    const body=await readFile(path);const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
    res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(resolve(root,'dist/404.html')));}
});}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT||3000);previewServer().listen(port,'127.0.0.1',()=>console.log(`Curio local preview: http://127.0.0.1:${port}`));}
