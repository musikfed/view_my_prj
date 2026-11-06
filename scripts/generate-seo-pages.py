#!/usr/bin/env python3
"""Generate 11 crawlable, translated static gallery URLs from the real project catalog.

No invented project screens. Each localized HTML contains the translated
headline, introductory text and 20 descriptions directly in source HTML.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "docs"
BASE = "https://musikfed.github.io/view_my_prj/"
LANGS = ("ru", "en", "zh", "de", "hi", "fr", "fi", "ko", "ja", "it", "be")
SITE_LANG = {"zh": "zh-Hans"}
CHOOSE = {
    "ru":"Выбрать язык","en":"Choose language","zh":"选择语言",
    "de":"Sprache wählen","hi":"भाषा चुनें","fr":"Choisir la langue",
    "fi":"Valitse kieli","ko":"언어 선택","ja":"言語を選択",
    "it":"Scegli la lingua","be":"Выбраць мову",
}
# The original project names and visual materials remain untouched. Only text
# not currently present in i18n.json needs to be supplied here.
EXTRA = {
 "ru":("Настоящие экраны проектов показываем как изображения или изолированный HTML/CSS. Остальные работы оставляем в разделе исходников. Каждый проект открывается на своей странице.","Порядок","Сначала новые","Сначала старые","По названию","Год создания","Все годы","проектов","Сотрудничество, консультации и разработка. Все контакты опубликованы с разрешения автора.","Публичные материалы. Закрытые исходники и серверы не публикуются."),
 "en":("Real project screens appear as images or isolated HTML/CSS. Other work remains in source-code sections. Every project has its own page.","Sort","Newest first","Oldest first","By name","Year created","All years","projects","Collaboration, consulting and development. Author-approved contacts.","Only public materials. Private code and servers are not published."),
 "zh":("真实项目页面以截图或隔离的 HTML/CSS 展示。其他作品保留源代码说明，每个项目都有独立页面。","排序","最新优先","最早优先","按名称","创建年份","所有年份","个项目","欢迎合作、咨询及开发。联系方式经作者同意公开。","仅展示公开材料，不发布私有代码或服务器信息。"),
 "de":("Echte Projektansichten werden als Bilder oder isoliertes HTML/CSS gezeigt. Weitere Arbeiten bleiben in den Quellcodebereichen. Jedes Projekt hat eine eigene Seite.","Sortieren","Neueste zuerst","Älteste zuerst","Nach Namen","Erstellungsjahr","Alle Jahre","Projekte","Zusammenarbeit, Beratung und Entwicklung. Kontakte mit Zustimmung des Autors.","Nur öffentliche Materialien. Private Quellen und Server bleiben geschützt."),
 "hi":("वास्तविक परियोजना स्क्रीन चित्र या पृथक HTML/CSS के रूप में दिखाए गए हैं। बाकी काम स्रोत कोड में है। हर परियोजना का अलग पृष्ठ है।","क्रम","नवीनतम पहले","पुराने पहले","नाम के अनुसार","निर्माण वर्ष","सभी वर्ष","परियोजनाएँ","सहयोग, परामर्श और विकास के लिए संपर्क करें।","केवल सार्वजनिक सामग्री; निजी कोड और सर्वर प्रकाशित नहीं हैं।"),
 "fr":("Des interfaces réelles sont présentées en images ou en HTML/CSS isolé. Les autres travaux restent documentés dans le code source. Chaque projet a sa page.","Trier","Plus récents","Plus anciens","Par nom","Année de création","Toutes les années","projets","Collaboration, conseil et développement. Contacts publiés avec accord de l'auteur.","Documents publics uniquement : ni code privé ni serveurs internes."),
 "fi":("Oikeat projektinäkymät esitetään kuvina tai eristettynä HTML/CSS:nä. Muut työt dokumentoidaan lähdekoodissa. Jokaisella projektilla on oma sivunsa.","Järjestys","Uusimmat ensin","Vanhimmat ensin","Nimen mukaan","Luontivuosi","Kaikki vuodet","projektia","Yhteistyö, konsultointi ja kehitys. Yhteystiedot tekijän luvalla.","Vain julkista sisältöä. Yksityistä koodia ja palvelimia ei julkaista."),
 "ko":("실제 프로젝트 화면은 이미지 또는 격리된 HTML/CSS로 표시합니다. 다른 작업은 소스 코드에 보관되며 각 프로젝트는 독립된 페이지가 있습니다.","정렬","최신순","오래된 순","이름순","생성 연도","전체 연도","개 프로젝트","협업, 컨설팅 및 개발 문의. 작성자가 공개에 동의한 연락처입니다.","공개 자료만 제공하며 비공개 코드와 서버는 공개하지 않습니다."),
 "ja":("実際の画面を画像または隔離された HTML/CSS で紹介。その他の作業はソースコードに記録し、各プロジェクトに独立ページがあります。","並び替え","新しい順","古い順","名前順","作成年","すべての年","プロジェクト","共同開発・コンサルティングのご相談。連絡先は本人の許可を得て公開。","公開資料のみ。非公開コードやサーバー情報は掲載しません。"),
 "it":("Le schermate autentiche sono mostrate tramite immagini o HTML/CSS isolato. Gli altri lavori sono documentati nel codice sorgente. Ogni progetto ha una pagina propria.","Ordine","Più recenti","Più vecchi","Per nome","Anno di creazione","Tutti gli anni","progetti","Collaborazioni, consulenze e sviluppo. Contatti pubblicati con il consenso dell'autore.","Solo materiali pubblici: codice privato e server non vengono pubblicati."),
 "be":("Сапраўдныя экраны праектаў паказаны выявамі або ізаляваным HTML/CSS. Астатнія працы апісаны ў зыходніках. Кожны праект мае сваю старонку.","Парадак","Спачатку новыя","Спачатку старыя","Па назве","Год стварэння","Усе гады","праектаў","Супрацоўніцтва, кансультацыі і распрацоўка. Кантакты з дазволу аўтара.","Толькі публічныя матэрыялы. Прыватныя зыходнікі і серверы не публікуюцца."),
}

TILE_LABELS = {"ru":["Посмотреть исходный проект ↗","Открыть самостоятельную страницу ↗","Открыть отдельную страницу ↗","Исследовать процесс передачи и проверки ↗","Создан: ","Заготовка, без готового движка","Разработка, активная интеграционная ветка","Лаборатория, не production-ready","Основан на коде другого автора"],"en":["View original project ↗","Open standalone project ↗","Open project page ↗","Explore the transfer and verification process ↗","Created: ","Early-stage project, no finished engine","Development, active integration branch","Research lab, not production-ready","Based on another author's code"],"zh":["查看原始项目 ↗","打开独立项目 ↗","打开项目页面 ↗","探索传输和校验流程 ↗","创建于：","早期项目，尚无完整引擎","开发中，活跃的集成分支","研究实验室，尚不可用于生产","基于其他作者的代码"],"de":["Originalprojekt ansehen ↗","Eigenständiges Projekt öffnen ↗","Projektseite öffnen ↗","Transfer und Verifikation erkunden ↗","Erstellt: ","Frühe Projektphase, noch keine fertige Engine","Entwicklung, aktiver Integrationszweig","Forschungslabor, nicht produktionsreif","Basiert auf Code eines anderen Autors"],"hi":["मूल परियोजना देखें ↗","अलग परियोजना खोलें ↗","परियोजना पृष्ठ खोलें ↗","स्थानांतरण और सत्यापन प्रक्रिया देखें ↗","बनाया गया: ","प्रारंभिक परियोजना, इंजन अभी तैयार नहीं","विकासाधीन, सक्रिय एकीकरण शाखा","अनुसंधान प्रयोगशाला, उत्पादन के लिए तैयार नहीं","अन्य लेखक के कोड पर आधारित"],"fr":["Voir le projet source ↗","Ouvrir le projet indépendant ↗","Ouvrir la page du projet ↗","Explorer le transfert et la vérification ↗","Créé le : ","Projet initial, moteur non finalisé","Développement, branche d'intégration active","Laboratoire, non prêt pour la production","Basé sur le code d'un autre auteur"],"fi":["Näytä alkuperäinen projekti ↗","Avaa itsenäinen projekti ↗","Avaa projektisivu ↗","Tutustu siirtoon ja tarkistukseen ↗","Luotu: ","Alkuvaiheen projekti, ei valmista moottoria","Kehityksessä, aktiivinen integrointihaara","Tutkimuslaboratorio, ei tuotantovalmis","Perustuu toisen tekijän koodiin"],"ko":["원본 프로젝트 보기 ↗","독립 프로젝트 열기 ↗","프로젝트 페이지 열기 ↗","전송 및 검증 과정 보기 ↗","생성일: ","초기 단계 프로젝트, 완성된 엔진 없음","개발 중, 활성 통합 브랜치","연구 실험실, 운영 환경용 아님","다른 작성자의 코드를 기반으로 함"],"ja":["元のプロジェクトを見る ↗","独立プロジェクトを開く ↗","プロジェクトページを開く ↗","転送・検証プロセスを見る ↗","作成日: ","初期段階、完成したエンジンなし","開発中、統合ブランチ稼働中","研究用ラボ、本番運用向けではない","他の作者のコードを基に構築"],"it":["Vedi progetto originale ↗","Apri progetto indipendente ↗","Apri pagina del progetto ↗","Esplora il trasferimento e la verifica ↗","Creato: ","Progetto iniziale, motore non completato","In sviluppo, ramo di integrazione attivo","Laboratorio, non pronto per la produzione","Basato sul codice di un altro autore"],"be":["Глядзець зыходны праект ↗","Адкрыць самастойны праект ↗","Адкрыць старонку праекта ↗","Даследаваць перадачу і праверку ↗","Створана: ","Пачатковы праект, гатовага рухавіка няма","У распрацоўцы, актыўная інтэграцыйная галіна","Лабараторыя, не гатовая да production","Заснавана на кодзе іншага аўтара"]}


def write(path: Path, content: str, check: bool) -> None:
    if check:
        if not path.is_file() or path.read_text(encoding="utf-8") != content:
            raise SystemExit("Missing or stale localized HTML: " + str(path))
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


def build(check: bool) -> None:
    source = (ROOT / "index.html").read_text(encoding="utf-8")
    data = json.loads((ROOT / "data/i18n.json").read_text(encoding="utf-8"))
    projects = json.loads((ROOT / "data/projects.json").read_text(encoding="utf-8"))["projects"]
    if set(data["ui"]) != set(LANGS) or len(projects) != 20:
        raise SystemExit("Unexpected language count or project catalog size")
    paths = re.findall(r'data-project="([^"]+)"', source)
    if set(paths) != {p["id"] for p in projects}:
        raise SystemExit("Translations cannot be matched to all 20 displayed project cards")
    replacements = (( "Настоящие экраны проектов показываем как изображения или изолированный HTML/CSS. Остальные работы оставляем в разделе исходников. Каждый проект открывается на своей странице.", 0),
                    ("Порядок", 1), ("Сначала новые", 2), ("Сначала старые", 3),
                    ("По названию", 4), ("Год создания", 5), ("Все годы", 6),
                    ("Сотрудничество, консультации и разработка. Все контакты опубликованы с разрешения автора.", 8),
                    ("Публичные материалы. Закрытые исходники и серверы не публикуются.", 9))
    for lang in LANGS:
        ui = data["ui"][lang]
        if len(ui) < 14:
            raise SystemExit("Short translation dictionary: " + lang)
        page = source
        # SSR instead of JS-only translation: search bots see the actual language.
        def translate_tag(match: re.Match[str]) -> str:
            value = ui[int(match.group(2))]
            return match.group(1) + html.escape(value) + match.group(4)
        page = re.sub(r'(<[a-z][^>]*\bdata-t="(\d+)"[^>]*>)([^<>]*)(</[a-z0-9]+>)',
                      translate_tag, page)
        def translate_project(match: re.Match[str]) -> str:
            pid = match.group(2)
            if pid not in data["projects"] or lang not in data["projects"][pid]:
                raise SystemExit("Missing project localization: " + pid + "/" + lang)
            return match.group(1) + html.escape(data["projects"][pid][lang]) + match.group(4)
        page = re.sub(r'(<[a-z][^>]*\bdata-project="([^"]+)"[^>]*>)([^<>]*)(</[a-z0-9]+>)',
                      translate_project, page)
        # Change the other visible Russian-only strings (with controlled exact matches).
        for phrase,index in replacements:
            page = page.replace(phrase, html.escape(EXTRA[lang][index]))
        page = page.replace('<label>Порядок<select', '<label>' + html.escape(EXTRA[lang][1]) + '<select')
        page = page.replace('aria-label="Порядок проектов"', 'aria-label="' + html.escape(EXTRA[lang][1]) + '"')
        page = page.replace('aria-label="Фильтр года создания"', 'aria-label="' + html.escape(EXTRA[lang][5]) + '"')
        page = page.replace('<label>Год создания<select', '<label>' + html.escape(EXTRA[lang][5]) + '<select')
        page = page.replace('20 проектов</output>', '20 ' + html.escape(EXTRA[lang][7]) + '</output>')
        page = page.replace('class="language" aria-label="Выбрать язык"', 'class="language" aria-label="' + html.escape(CHOOSE[lang]) + '"')
        page = page.replace('class="locale-caption" for="language">Выбрать язык', 'class="locale-caption" for="language">' + html.escape(CHOOSE[lang]))
        # Replace every visible catalog status/CTA/date prefix in the source HTML.
        source_phrases = TILE_LABELS["ru"]
        for old_text, new_text in zip(source_phrases, TILE_LABELS[lang]):
            page = page.replace(old_text, html.escape(new_text))
        # Earlier localized short label can produce mixed-language aria text.
        page = re.sub(r'aria-label="[^"]* проектов"', 'aria-label="' + html.escape(CHOOSE[lang]) + '"', page)
        # The browser can choose any locale; no country/IP redirect is needed.
        page = page.replace('<html lang="ru">', '<html lang="' + SITE_LANG.get(lang, lang) + '">', 1)
        title = ui[0] + " | PEGINELAB · Project portfolio"
        description = ui[1] + " · PEGINELAB — 20 source-backed projects."
        page = re.sub(r'<title>[^<]*</title>', '<title>' + html.escape(title) + '</title>', page, count=1)
        page = re.sub(r'<meta name="description" content="[^"]*">',
                      '<meta name="description" content="' + html.escape(description, quote=True) + '">', page, count=1)
        page = re.sub(r'<meta property="og:title" content="[^"]*">',
                      '<meta property="og:title" content="' + html.escape(title, quote=True) + '">', page, count=1)
        page = re.sub(r'<meta property="og:description" content="[^"]*">',
                      '<meta property="og:description" content="' + html.escape(description, quote=True) + '">', page, count=1)
        page = re.sub(r'<meta property="og:url" content="[^"]*">',
                      '<meta property="og:url" content="' + BASE + lang + '/">', page, count=1)
        page = re.sub(r'<link rel="canonical" href="[^"]+">',
                      '<link rel="canonical" href="' + BASE + lang + '/">', page, count=1)
        # Remove the original root cluster before adding one reciprocal cluster.
        page = re.sub(r'\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">', "", page)
        links = "\n".join('<link rel="alternate" hreflang="' + code + '" href="' + BASE + code + '/">' for code in LANGS)
        links += '\n<link rel="alternate" hreflang="x-default" href="' + BASE + '">'
        page = page.replace('</head>', links + '\n</head>', 1)
        page = page.replace('href="https://musikfed.github.io/my_self/#ru"',
                            'href="https://musikfed.github.io/my_self/' + lang + '/"')
        # Home navigation must preserve the current locale, not append ?lang=en.
        page = page.replace('href="/view_my_prj/"', 'href="/view_my_prj/' + lang + '/"')
        # The original project-specific pages remain the authentic technical showcases.
        # Until individual translations are reviewed, link to those unchanged pages.
        if html.escape(ui[0]) not in page or html.escape(data["projects"]["achewiw"][lang]) not in page:
            raise SystemExit("Expected SSR translations missing: " + lang)
        if page.count('rel="alternate" hreflang=') != 12:
            raise SystemExit("hreflang cluster invalid: " + lang)
        write(ROOT / lang / "index.html", page, check)
        print(lang, len(page), "SSR HTML characters")

    # Keep the original twenty project-detail URLs in the sitemap; add 11
    # localized catalog entry points, not duplicate pages with untranslated text.
    sitemap = ROOT / "sitemap.xml"
    raw = sitemap.read_text(encoding="utf-8")
    orig = re.findall(r"<loc>([^<]+)</loc>", raw)
    preserve = [url for url in orig if url.startswith(BASE) and url != BASE and
                not any(url == BASE + lang + '/' for lang in LANGS)]
    locs = [BASE + lang + '/' for lang in LANGS] + preserve
    result = ('<?xml version="1.0" encoding="UTF-8"?>\n'
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
              "".join('  <url><loc>' + html.escape(url) + '</loc></url>\n' for url in locs) +
              '</urlset>\n')
    write(sitemap, result, check)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    build(check=parser.parse_args().check)
