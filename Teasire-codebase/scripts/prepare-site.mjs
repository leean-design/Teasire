import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const origin='https://leean-design.github.io/Teasire';
// Titles and descriptions read back from existing pages are already escaped; decode them so each run escapes them exactly once.
const unesc=t=>{let prev;do{prev=t;t=t.replaceAll('&lt;','<').replaceAll('&quot;','"').replaceAll('&amp;','&');}while(t!==prev);return t;};
const source=fs.readFileSync(path.join(dist,'site.js'),'utf8');
const renderSource=source.slice(0,source.indexOf('document.body.innerHTML='));
const makeContext=(page,file,product)=>vm.createContext({document:{body:{dataset:{page,product}},title:''},location:{pathname:'/'+file,search:''},localStorage:{getItem:()=>null},matchMedia:()=>({matches:true}),URLSearchParams});
const inventory=makeContext('home','index.html');vm.runInContext(renderSource,inventory);
const teas=vm.runInContext('teas',inventory);
const productTemplate=fs.readFileSync(path.join(dist,'product.html'),'utf8');
for(const t of teas){const f='tea-'+t.id+'.html';if(!fs.existsSync(path.join(dist,f)))fs.writeFileSync(path.join(dist,f),productTemplate.replace('data-page="product"','data-page="product" data-product="'+t.id+'"'));}
const urls=[];
for(const file of fs.readdirSync(dist).filter(f=>f.endsWith('.html')&&!f.startsWith('__'))){
 const p=path.join(dist,file);let html=fs.readFileSync(p,'utf8');const page=html.match(/data-page="([^"]+)"/)?.[1]||'home';const product=html.match(/data-product="([^"]+)"/)?.[1];
 const ctx=makeContext(page,file,product);vm.runInContext(renderSource,ctx);
 const markup=vm.runInContext(`'<a class="skip-link" href="#main-content">Skip to content</a>'+header()+'<main id="main-content" tabindex="-1">'+(content[page]||home)()+'</main>'+footer()`,ctx);
 const tea=teas.find(t=>t.id===product);const title=tea?tea.name+' — Teasire':unesc(html.match(/<title>(.*?)<\/title>/s)[1]);
 const desc=tea?tea.description+' Individually packed teabags, available in Malaysia.':unesc(html.match(/<meta name="description" content="([^"]*)"/)?.[1]||'')||'Discover Teasire botanical teas and create a personal daily ritual.';
 const esc=t=>t.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
 const image=origin+'/assets/clean/'+(tea?.image||'01_Green_Tea_Jasmine')+'.webp';
 const noindex=['checkout.html','pricing.html','product.html'].includes(file);
 let body=markup.replace('<main id="main-content" tabindex="-1">','<noscript><div class="no-script">Explore our <a href="flower-tea.html">flower teas</a> and <a href="fruit-tea.html">fruit teas</a>. Enable JavaScript for blending and your bag, or <a href="https://wa.me/60126769675">contact Teasire on WhatsApp</a>.</div></noscript><main id="main-content" tabindex="-1">');
 const images=[...body.matchAll(/<img[^>]*src="([^"]+)"[^>]*>/g)];
 for(const [tag,src] of images){if(/width=/.test(tag))continue;const attrs=src.includes('clean/')?' width="1086" height="1448" decoding="async"':'';body=body.replace(tag,tag.replace('>',attrs+'>'));}
 // Meaningful initial HTML is served before the interactive script starts.
 html=`<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="#ffffff"><link rel="canonical" href="${origin}/${file}">${noindex?'<meta name="robots" content="noindex,follow">':''}<meta property="og:type" content="website"><meta property="og:site_name" content="Teasire"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${origin}/${file}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/png" href="assets/teasire-magpie.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="site.css"><link rel="stylesheet" href="enhancements.css"><script src="site.js" defer></script></head><body data-page="${page}"${product?' data-product="'+product+'"':''}>${body}</body></html>\n`;
 fs.writeFileSync(p,html);if(!noindex)urls.push(origin+'/'+file);
}
fs.writeFileSync(path.join(dist,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>'<url><loc>'+u+'</loc></url>').join('')+'</urlset>\n');
fs.writeFileSync(path.join(dist,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n');
console.log(`Prepared ${urls.length+3} pages with initial content, metadata and a sitemap.`);
