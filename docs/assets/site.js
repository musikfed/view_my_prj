(() => {
  "use strict";
  const BASE = "/view_my_prj/";
  // The homepage is already newest-first in static HTML; controls never need remote APIs.
  const gallery = document.querySelector(".project-gallery");
  const sort = document.getElementById("catalog-sort");
  const year = document.getElementById("catalog-year");
  const count = document.getElementById("catalog-count");
  const browserPageLanguage = document.documentElement.lang === "zh-Hans" ? "zh" : document.documentElement.lang;
  const countNames = {"ru":"проектов","en":"projects","zh":"个项目","de":"Projekte","hi":"परियोजनाएँ","fr":"projets","fi":"projektia","ko":"개 프로젝트","ja":"プロジェクト","it":"progetti","be":"праектаў"};
  if (gallery && sort && year) {
    const cards = Array.from(gallery.querySelectorAll(":scope > .tile"));
    try {
      const savedSort = sessionStorage.getItem("view-my-prj-sort");
      const savedYear = sessionStorage.getItem("view-my-prj-year");
      if (["newest","oldest","name"].includes(savedSort)) sort.value=savedSort;
      if (["all","2026","2023","2022"].includes(savedYear)) year.value=savedYear;
    } catch (_) { /* Storage may be disabled. */ }
    const renderCatalog = () => {
      const sorted = cards.slice().sort((a,b)=>{
        if(sort.value==="name") return a.querySelector("h3").textContent.localeCompare(b.querySelector("h3").textContent,undefined,{sensitivity:"base"});
        return sort.value==="oldest" ? a.dataset.created.localeCompare(b.dataset.created) : b.dataset.created.localeCompare(a.dataset.created);
      });
      let visible=0;
      for (const card of sorted) {
        const ok = year.value==="all" || card.dataset.created.slice(0,4)===year.value;
        card.hidden=!ok;
        if(ok) visible++;
        gallery.appendChild(card);
      }
      count.textContent=visible+" / "+cards.length+" "+(countNames[browserPageLanguage]||countNames.ru);
      try{sessionStorage.setItem("view-my-prj-sort",sort.value);sessionStorage.setItem("view-my-prj-year",year.value)}catch(_){}
    };
    sort.addEventListener("change",renderCatalog);
    year.addEventListener("change",renderCatalog);
    renderCatalog();
  }
  const supported = ["ru","en","zh","de","hi","fr","fi","ko","ja","it","be"];
  const params = new URLSearchParams(location.search);
  const pathLocale = location.pathname.match(/^\/view_my_prj\/(ru|en|zh|de|hi|fr|fi|ko|ja|it|be)\/?$/)?.[1];
  const selected = params.get("lang");
  const isProject = document.body.dataset.page === "project";
  const isLanding = !isProject && !pathLocale;
  const lang = pathLocale || (supported.includes(selected) ? selected : "ru");
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;

  // Old query-based catalog URLs are retained but lead to one stable indexable URL.
  if (isLanding && supported.includes(selected)) {
    location.replace(BASE + selected + "/" + location.hash);
    return;
  }
  document.querySelectorAll("a[data-personal-site]").forEach(a => {
    a.href = "https://musikfed.github.io/my_self/" + lang + "/";
  });

  function updateLink(a) {
    const raw = a.getAttribute("href");
    if (!raw || !raw.startsWith(BASE)) return;
    if (raw.startsWith(BASE + "projects/") || raw.startsWith(BASE + "pitools/")) {
      // Technical detail pages still use their original canonical URL and
      // client-side translation until source paragraphs are reviewed for SEO.
      if (isProject || lang === "ru") return;
      const u = new URL(raw, location.origin);
      u.searchParams.set("lang",lang);
      a.setAttribute("href",u.pathname+u.search+u.hash);
      return;
    }
    if (raw === BASE) a.setAttribute("href", BASE + lang + "/");
  }
  document.querySelectorAll("a[href]").forEach(updateLink);

  const picker = document.getElementById("language");
  if (picker) {
    picker.value = lang;
    if (!picker.hasAttribute("aria-label")) picker.setAttribute("aria-label", "Choose language");
    picker.addEventListener("change", () => {
      if (!supported.includes(picker.value)) return;
      if (isProject) {
        const url = new URL(location.href);
        if (picker.value === "ru") url.searchParams.delete("lang");
        else url.searchParams.set("lang", picker.value);
        location.assign(url.pathname + url.search + url.hash);
      } else location.assign(BASE + picker.value + "/" + location.hash);
    });
  }
  if (isLanding && !selected) {
    // Approximate browser LANGUAGE rather than IP country; keep this optional
    // to avoid redirecting search bots and hiding any translated pages.
    const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language||"ru"];
    const preferred = browserLanguages.map(x => x.toLowerCase().split("-")[0]).find(x => supported.includes(x));
    if (preferred && preferred !== "ru") {
      const note = document.createElement("div");
      note.className = "locale-suggestion";
      note.style.cssText = "margin:12px auto 0;max-width:1150px;padding:10px 16px;border:1px solid #41515f;border-radius:8px;color:#e4edf5";
      const link = document.createElement("a");
      link.href = BASE + preferred + "/";
      link.textContent = "🌐 " + (picker?.querySelector('option[value="'+preferred+'"]')?.textContent || preferred) + " — Choose language";
      note.appendChild(link);
      document.querySelector("header.site-head")?.insertAdjacentElement("afterend",note);
    }
  }

  fetch(BASE + "data/i18n.json", {cache:"force-cache"})
    .then(r => {if(!r.ok) throw new Error("Translation dictionary unavailable"); return r.json()})
    .then(data => {
      const dictionary = data.ui?.[lang] || data.ui?.ru;
      if (!dictionary) return;
      document.querySelectorAll("[data-t]").forEach(el => {
        const n = Number(el.getAttribute("data-t"));
        if (dictionary[n] && Number.isInteger(n)) el.textContent = dictionary[n];
      });
      document.querySelectorAll("[data-project]").forEach(el => {
        const id = el.getAttribute("data-project");
        const value = data.projects?.[id]?.[lang];
        if (typeof value === "string" && value) el.textContent = value;
      });
    })
    .catch(() => {
      /* Russian static HTML remains readable when JS or translated catalog is unavailable. */
    });
})();
