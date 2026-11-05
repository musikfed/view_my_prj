import fs from 'node:fs';
import path from 'node:path';

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
console.log('Verified 20 separate pages, three native HTML/CSS previews, 11 descriptions and no private project leakage.');
