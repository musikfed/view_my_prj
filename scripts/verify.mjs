import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../docs/', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const d = JSON.parse(read('data/projects.json'));
const tr = JSON.parse(read('data/i18n.json'));
const publicRepoIds = d.projects.map(p => p.id);
const forbidden = ['ChessRust', 'monopost', 'ghost32-project', 'java-to-ai-and-language'];
const supported = ['ru','en','zh','de','hi','fr','fi','ko','ja','it','be'];

function assert(check, message){ if(!check) throw new Error(message); }
assert(new Set(publicRepoIds).size === 20, 'Expect 20 unique public repositories');
assert(Object.keys(tr.ui).join('|') === supported.join('|'), 'Eleven locales required');
assert(fs.existsSync(new URL('index.html',root)), 'Missing gallery homepage');
const home = read('index.html');
const phonePattern = /(?:\+7|8)[ \t()\-]*\d{3}[ \t()\-]*\d{3}[ \t()\-]*\d{2}[ \t()\-]*\d{2}/;
function checkPhoneFree(page, name) {
  assert(!page.includes('href="tel:') && !phonePattern.test(page), 'Personal phone leaked into '+name);
}
checkPhoneFree(home, 'main catalog');
const repoReadme = fs.readFileSync(new URL('../README.md',root),'utf8');
checkPhoneFree(repoReadme, 'README');
assert(home.includes('REAL SOURCE REFERENCES') || home.includes('LIVE SOURCE REFERENCES'), 'Main site should describe authentic source visuals');
assert(home.includes('data-personal-site') && home.includes('https://musikfed.github.io/my_self/ru/'), 'Author site link missing');
for (const language of supported) assert(typeof tr.ui[language][13] === 'string' && tr.ui[language][13], 'Missing author-link translation '+language);
for(const id of forbidden) assert(!home.includes(id), 'Private project leaked to homepage: ' + id);
for(const project of d.projects) {
  const page = read('projects/' + project.id + '/index.html');
  assert(page.includes('<title>') && page.includes('canonical'), 'Missing SEO metadata ' + project.id);
  assert(page.includes('github.com/musikfed/' + project.id), 'Missing source link '+project.id);
  assert(page.includes('feudor.lab@yandex.ru'), 'Missing author contacts '+project.id);
  if(project.preview) {
    const f = 'previews/' + project.preview + '/index.html';
    assert(fs.existsSync(new URL(f,root)), 'Missing original read-only UI '+project.id);
    const source = read(f);
    assert(!source.includes('<script'), 'UI snapshot must not execute backend JS '+project.id);
    assert(page.includes('sandbox=""'), 'UI should be sandboxed '+project.id);
  } else if (project.image) {
    assert(page.includes('raw.githubusercontent.com/'), 'Expected actual source screenshot '+project.id);
    assert(project.image.includes('musikfed/' + project.id + '/'), 'Image must originate in corresponding public repo '+project.id);
  } else if(project.id === 'pitools') {
    assert(page.includes('location.replace') && page.includes('/view_my_prj/pitools/'),
      'CLI-only PITOOLS must link to its truthful source-derived simulator instead of a fabricated UI');
  } else assert(page.includes('Исходные файлы') || page.includes('SOURCE FILES') || page.includes('Реальный исходный материал'), 'Projects without screenshot cannot invent UI '+project.id);
  assert(tr.projects[project.id], 'Missing translations '+project.id);
  for (const language of supported) assert(tr.projects[project.id][language], 'Missing '+language+' for '+project.id);
  for(const id of forbidden) assert(!page.includes('github.com/musikfed/' + id), 'Private project leak '+project.id);
}
for (const id of ['registry-change-explorer', 'esp32s3devkitC-1N16R8']) {
  const page = read('projects/' + id + '/index.html');
  assert(home.includes('href="/view_my_prj/projects/' + id + '/"'), 'Showcase card missing: ' + id);
  assert(page.includes('sandbox="allow-scripts"') && page.includes('https://musikfed.github.io/' + id + '/'), 'Standalone embedded presentation missing: ' + id);
}
assert(home.includes('Studio%20esp32_2.jpg') && read('projects/esp32s3devkitC-1N16R8/index.html').includes('Studio%20esp32_2.jpg'), 'Real ESP32 screenshot not shown');
assert(!home.includes('class="featured" aria-label="Selected actual applications"') && !home.includes('class="spotlight-duo"'), 'Favorites must be removed');
assert(home.includes('id="catalog-sort"') && home.includes('id="catalog-year"'), 'Creation date controls are required');
for (const project of d.projects) {
  assert(/^\d{4}-\d{2}-\d{2}T/.test(project.created_at), 'Missing real GitHub creation date for '+project.id);
  assert(home.includes('data-project-id="'+project.id+'"'), 'Missing chronological card for '+project.id);
}
assert(fs.existsSync(new URL('assets/peginelab-mark.svg',root)), 'PL vector brand mark missing');
const hhPage=read('projects/analitikhhru/index.html');
assert(hhPage.includes('sandbox="allow-scripts"') && hhPage.includes('https://musikfed.github.io/analitikhhru/'), 'Original HH demo iframe missing');
assert(home.includes('market-radar-archive.svg') && hhPage.includes('pulse-market-archive.svg'), 'New Market Radar previews missing');
const pitoolsSite=read('pitools/index.html');
const pitoolsDemo=read('pitools/demo.js');
const pitoolsLegacy=read('projects/pitools/index.html');
assert(home.includes('href="/view_my_prj/pitools/"'), 'PITOOLS interactive site is not featured on gallery home');
assert(home.includes('src="/view_my_prj/pitools/flow-cover.svg"'), 'PITOOLS flow art missing on gallery home');
assert(pitoolsSite.includes('rel="canonical" href="https://musikfed.github.io/view_my_prj/pitools/"'),
  'Dedicated PITOOLS canonical route missing');
for(const text of ['2026610793','15.01.2026','/tmp/test_test','test_test.txt','asyncio.gather','SHA-256','AutoAddPolicy','feudor.lab@yandex.ru']) {
  assert(pitoolsSite.includes(text),'PITOOLS source or registration detail missing: '+text);
}
for(const asset of ['pitools/demo.css','pitools/demo.js','pitools/flow-cover.svg']) {
  assert(fs.existsSync(new URL(asset,root)), 'PITOOLS asset missing: '+asset);
}
assert(!(/\b(?:fetch|WebSocket|XMLHttpRequest|EventSource)\s*\(/.test(pitoolsDemo)),
  'PITOOLS simulation may not make network or API requests');
assert(pitoolsDemo.includes('test.server.ru') && pitoolsDemo.includes('node-a.example'),
  'Both uploaded and illustrative PITOOLS scenarios must exist');
assert(pitoolsDemo.includes('state.step>=6'), 'Simulated first-host checksum warning must be visible');
assert(pitoolsLegacy.includes('location.replace') && pitoolsLegacy.includes('/view_my_prj/pitools/'),
  'Old PITOOLS project card must preserve navigable redirect to standalone site');
assert(read('sitemap.xml').includes('https://musikfed.github.io/view_my_prj/pitools/'),
  'Sitemap must index new PITOOLS canonical page');
assert(read('sitemap.xml').includes('https://musikfed.github.io/view_my_prj/'), 'Missing sitemap');
assert(fs.existsSync(new URL('previews/yadrokreator/app.css',root)), 'Factory preview original CSS missing');
// Every internal link and image must resolve inside the generated GitHub Pages tree.
// Run this on every push, rather than discovering broken project links after publishing.
const docsDir = path.resolve(fileURLToPath(root));
const publishedFiles = [];
function collectHtml(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
    const target = path.join(directory,entry.name);
    if(entry.isDirectory()) collectHtml(target);
    else if(entry.isFile() && entry.name.endsWith('.html')) publishedFiles.push(target);
  }
}
collectHtml(docsDir);
const siteBase = 'https://musikfed.github.io/view_my_prj/';
let checkedLocalLinks = 0;
for (const htmlFile of publishedFiles) {
  const source = fs.readFileSync(htmlFile,'utf8');
  const relativeHtml = path.relative(docsDir,htmlFile).split(path.sep).join('/');
  const siteUrl = new URL(relativeHtml,siteBase);
  for (const match of source.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const ref = match[1];
    if (!ref || ref.startsWith('#')) continue;
    const url = new URL(ref,siteUrl);
    if (url.origin !== siteUrl.origin) continue;
    // Other independent GitHub Pages projects share this domain, not this /docs tree.
    if (['/achewiw/', '/registry-change-explorer/', '/esp32s3devkitC-1N16R8/', '/analitikhhru/', '/my_self/'].some(prefix => url.pathname.startsWith(prefix))) continue;
    assert(url.pathname.startsWith('/view_my_prj/'), 'Public gallery link leaves its Pages base: '+relativeHtml+' -> '+ref);
    const urlPath = decodeURIComponent(url.pathname.slice('/view_my_prj/'.length));
    let target = path.resolve(docsDir,urlPath);
    if (url.pathname.endsWith('/')) target=path.join(target,'index.html');
    assert(target.startsWith(docsDir+path.sep), 'Invalid project link path: '+ref);
    assert(fs.existsSync(target) && fs.statSync(target).isFile(),
      'Broken project link: '+relativeHtml+' -> '+ref+' (expected '+target+')');
    checkedLocalLinks++;
  }
}
assert(publishedFiles.length>=26, 'All project and read-only preview HTML pages must exist');
assert(read('sitemap.xml').match(/<url>/g)?.length===31,
  'Search sitemap must include eleven localized catalog pages and twenty original projects');
const previews = d.projects.filter(p=>p.preview).length;
const realVisuals = d.projects.filter(p=>p.preview || p.image).length;
console.log('Verified '+d.projects.length+' independent project pages, '+previews+
  ' native safe HTML previews, '+realVisuals+' real visual presentations + PITOOLS SSH source simulation, 11 languages, '+
  checkedLocalLinks+' local links, sitemap and private repository isolation.');


// SSR multilingual entry points: real content, not JS-only translations.
for (const lang of supported) {
  const page = read(lang + '/index.html');
  checkPhoneFree(page, lang+' catalog');
  assert(page.includes('rel="canonical" href="https://musikfed.github.io/view_my_prj/' + lang + '/"'), 'Missing canonical for '+lang);
  assert((page.match(/hreflang=/g)||[]).length===12, 'Missing 11-way hreflang plus x-default for '+lang);
  assert(page.includes('lang="'+(lang==='zh'?'zh-Hans':lang)+'"'), 'Bad HTML lang for '+lang);
  assert(page.includes('data-project="achewiw"'), 'Translated project content absent for '+lang);
}
