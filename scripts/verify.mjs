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
assert(home.includes('REAL SOURCE REFERENCES') || home.includes('LIVE SOURCE REFERENCES'), 'Main site should describe authentic source visuals');
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
  } else assert(page.includes('Исходные файлы') || page.includes('SOURCE FILES') || page.includes('Реальный исходный материал'), 'Projects without screenshot cannot invent UI '+project.id);
  assert(tr.projects[project.id], 'Missing translations '+project.id);
  for (const language of supported) assert(tr.projects[project.id][language], 'Missing '+language+' for '+project.id);
  for(const id of forbidden) assert(!page.includes('github.com/musikfed/' + id), 'Private project leak '+project.id);
}
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
    if (ref.startsWith('https://musikfed.github.io/achewiw/') && url.pathname.startsWith('/achewiw/')) continue;
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
assert(read('sitemap.xml').match(/<url>/g)?.length===21,
  'Search sitemap must include the homepage and all twenty public projects');
const previews = d.projects.filter(p=>p.preview).length;
const realVisuals = d.projects.filter(p=>p.preview || p.image).length;
console.log('Verified '+d.projects.length+' independent project pages, '+previews+
  ' native safe HTML previews, '+realVisuals+' real visual presentations, 11 languages, '+
  checkedLocalLinks+' local links, sitemap and private repository isolation.');

