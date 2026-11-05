(() => {
  "use strict";
  const BASE = "/view_my_prj/";
  const supported = ["ru","en","zh","de","hi","fr","fi","ko","ja","it","be"];
  const params = new URLSearchParams(location.search);
  const selected = params.get("lang");
  const lang = supported.includes(selected) ? selected : "ru";
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;

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
