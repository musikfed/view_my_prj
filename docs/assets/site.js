(() => {
  "use strict";
  const BASE = "/view_my_prj/";
  // The homepage is already newest-first in static HTML; controls never need remote APIs.
  const gallery = document.querySelector(".project-gallery");
  const sort = document.getElementById("catalog-sort");
  const year = document.getElementById("catalog-year");
  const count = document.getElementById("catalog-count");
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
      count.textContent=visible+" / "+cards.length+" проектов";
      try{sessionStorage.setItem("view-my-prj-sort",sort.value);sessionStorage.setItem("view-my-prj-year",year.value)}catch(_){}
    };
    sort.addEventListener("change",renderCatalog);
    year.addEventListener("change",renderCatalog);
    renderCatalog();
  }
  const supported = ["ru","en","zh","de","hi","fr","fi","ko","ja","it","be"];
  const params = new URLSearchParams(location.search);
  const selected = params.get("lang");
  const lang = supported.includes(selected) ? selected : "ru";
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
  // Personal CV uses hash-based locales rather than ?lang= like this gallery.
  document.querySelectorAll("a[data-personal-site]").forEach(a => {
    a.href = "https://musikfed.github.io/my_self/#" + lang;
  });

  function updateLink(a) {
    const raw = a.getAttribute("href");
    if (!raw || !raw.startsWith(BASE)) return;
    const u = new URL(raw, location.origin);
    if (lang === "ru") u.searchParams.delete("lang");
    else u.searchParams.set("lang", lang);
    a.setAttribute("href", u.pathname + u.search + u.hash);
  }
  document.querySelectorAll("a[href]").forEach(updateLink);
  const picker = document.getElementById("language");
  if (picker) {
    picker.value = lang;
    picker.addEventListener("change", () => {
      const next = new URL(location.href);
      if (picker.value === "ru") next.searchParams.delete("lang");
      else next.searchParams.set("lang", picker.value);
      location.assign(next.pathname + next.search + next.hash);
    });
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
