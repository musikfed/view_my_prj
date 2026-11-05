(() => {
"use strict";
const locale = ["ru","en","zh","de","hi","fr","fi","ko","ja","it","be"];
const ui = {
ru:["Начать демонстрацию","Пауза","Сначала","Образец: 1 сервер","Пример: 3 сервера","Шаг","Эмуляция • SSH-соединений нет","Сценарий .prj","Узлы назначения","Передано (модель)","Только первый проверяется","Ошибка пути проверки","Показать процесс","Параллельное развёртывание","Что происходит внутри","Ни одно сетевое соединение не выполняется"],
en:["Run visualization","Pause","Reset","Sample: 1 server","Example: 3 servers","Step","Simulation • no SSH connections","PRJ manifest","Target hosts","Simulated transfer","Only first checked","Verification path mismatch","Explore the flow","Parallel deployment","Inside the code","No network connections are made"],
zh:["运行演示","暂停","重置","示例：1 台服务器","示意：3 台服务器","步骤","模拟演示 • 不连接 SSH","PRJ 清单","目标主机","模拟传输","仅检查第一台","校验路径不匹配","演示流程","并行部署","代码执行过程","不会建立网络连接"],
de:["Ablauf starten","Pause","Zurücksetzen","Beispiel: 1 Server","Demo: 3 Server","Schritt","Simulation • keine SSH-Verbindung","PRJ-Manifest","Zielserver","Simulierte Übertragung","Nur erster geprüft","Prüfpfad stimmt nicht","Prozess ansehen","Paralleles Deployment","Ablauf im Code","Es werden keine Netzwerkverbindungen aufgebaut"],
hi:["डेमो चलाएँ","रोकें","रीसेट","उदाहरण: 1 सर्वर","डेमो: 3 सर्वर","चरण","सिमुलेशन • SSH कनेक्शन नहीं","PRJ मैनिफ़ेस्ट","लक्ष्य सर्वर","अनुकरणित ट्रांसफ़र","केवल पहला जाँचा जाता है","सत्यापन पथ में अंतर","प्रक्रिया देखें","समानांतर डिप्लॉय","कोड कैसे काम करता है","कोई नेटवर्क कनेक्शन नहीं बनाया जाता"],
fr:["Lancer la démo","Pause","Réinitialiser","Exemple : 1 serveur","Simulation : 3 serveurs","Étape","Simulation • sans connexion SSH","Manifeste PRJ","Serveurs cibles","Transfert simulé","Seul le premier vérifié","Chemin de vérification incohérent","Voir le processus","Déploiement parallèle","Fonctionnement du code","Aucune connexion réseau n’est établie"],
fi:["Käynnistä demo","Tauko","Alusta","Esimerkki: 1 palvelin","Demo: 3 palvelinta","Vaihe","Simulaatio • ei SSH-yhteyksiä","PRJ-tiedosto","Kohdepalvelimet","Simuloitu siirto","Vain ensimmäinen tarkistetaan","Tarkistuspolku poikkeaa","Katso prosessi","Rinnakkainen julkaisu","Koodin toiminta","Verkkoyhteyksiä ei avata"],
ko:["데모 시작","일시정지","초기화","예시: 서버 1대","시연: 서버 3대","단계","시뮬레이션 • SSH 연결 없음","PRJ 명세","대상 서버","모의 전송","첫 서버만 검사","검증 경로 불일치","과정 보기","병렬 배포","코드 동작 방식","네트워크 연결이 발생하지 않습니다"],
ja:["デモ開始","一時停止","リセット","サンプル: 1 台","例: 3 台","ステップ","シミュレーション • SSH 接続なし","PRJ 定義","対象ホスト","模擬転送","最初のホストのみ検証","検証パスが不一致","処理を表示","並列デプロイ","コードの流れ","ネットワーク接続は行いません"],
it:["Avvia demo","Pausa","Azzera","Esempio: 1 server","Demo: 3 server","Fase","Simulazione • nessun SSH","Manifest PRJ","Server di destinazione","Trasferimento simulato","Verificato solo il primo","Percorso di verifica diverso","Mostra il flusso","Distribuzione parallela","Funzionamento del codice","Non vengono aperte connessioni di rete"],
be:["Запусціць дэма","Паўза","Спачатку","Узор: 1 сервер","Прыклад: 3 серверы","Крок","Імітацыя • без SSH-злучэнняў","Маніфест PRJ","Мэтавыя серверы","Імітацыя перадачы","Правяраецца толькі першы","Шлях праверкі не супадае","Паказаць працэс","Паралельнае разгортванне","Праца зыходнага кода","Сеткавыя злучэнні не ствараюцца"]
};
const stages = {
ru:["Загрузка .prj","Разбор MLT / PRJ / FL","Задачи asyncio.gather","Подключение SSH","SFTP и создание директорий","Передача и права 0644","Контроль SHA-256","Сводка и замечания"],
en:["Read .prj","Parse MLT / PRJ / FL","asyncio.gather tasks","SSH connection","SFTP and directories","Upload and chmod 0644","SHA-256 check","Summary and limitations"],
zh:["读取 .prj","解析 MLT / PRJ / FL","asyncio.gather 任务","连接 SSH","SFTP 与目录创建","上传并设置 0644 权限","SHA-256 校验","总结与限制"],
de:[".prj laden","MLT / PRJ / FL parsen","asyncio.gather-Aufgaben","SSH-Verbindung","SFTP und Verzeichnisse","Upload und chmod 0644","SHA-256-Prüfung","Ergebnis und Grenzen"],
hi:[".prj पढ़ें","MLT / PRJ / FL पार्स","asyncio.gather कार्य","SSH कनेक्शन","SFTP और डायरेक्टरी","अपलोड और chmod 0644","SHA-256 जाँच","सारांश और सीमाएँ"],
fr:["Lire le .prj","Analyser MLT / PRJ / FL","Tâches asyncio.gather","Connexion SSH","SFTP et dossiers","Envoi et chmod 0644","Vérification SHA-256","Bilan et limites"],
fi:["Lue .prj","Jäsennä MLT / PRJ / FL","asyncio.gather-tehtävät","SSH-yhteys","SFTP ja kansiot","Siirto ja chmod 0644","SHA-256-tarkistus","Yhteenveto ja rajoitukset"],
ko:[".prj 읽기","MLT / PRJ / FL 파싱","asyncio.gather 작업","SSH 접속","SFTP 및 디렉터리","업로드와 chmod 0644","SHA-256 검사","요약 및 제한 사항"],
ja:[".prj 読み込み","MLT / PRJ / FL 解析","asyncio.gather タスク","SSH 接続","SFTP とディレクトリ","送信と chmod 0644","SHA-256 検証","結果と制約"],
it:["Leggi .prj","Analizza MLT / PRJ / FL","Task asyncio.gather","Connessione SSH","SFTP e cartelle","Upload e chmod 0644","Verifica SHA-256","Riepilogo e limiti"],
be:["Чытанне .prj","Разбор MLT / PRJ / FL","Задачы asyncio.gather","SSH-злучэнне","SFTP і каталогі","Перадача і chmod 0644","SHA-256 праверка","Вынікі і абмежаванні"]
};
const detailsRU=[
"Читаем файл-манифест рядом с pitools.py. В приложенном образце один хост, один целевой путь и один файл.",
"parse_prj() по shlex.split формирует блок: hosts[], prj_path и files[]. Это конфигурация, а не передача данных.",
"Для каждого FL создаются задачи fl_deploy() по числу хостов. asyncio.gather() ожидает их параллельное завершение.",
"Каждая задача создаёт SSHClient, доверяет ключу хоста по AutoAddPolicy и подключается с указанным SSH-ключом. Это отображение кода, не реальное подключение.",
"Сначала открывается SFTP. Скрипт берёт Path(PRJ).parent; для /tmp/test это /tmp. Недостающие каталоги создаются рекурсивно.",
"Файл передаётся с именем host_prefix + '_' + Path(PRJ).name: для test.server.ru это /tmp/test_test. Устанавливаются права 0644. Успех передачи не равен проверенной целостности.",
"verify_deployed_files() вызывается лишь для первого хоста. Проверяется имя test_test.txt относительно удалённого рабочего каталога, тогда как запись шла в /tmp/test_test. Доказательства совпадения SHA-256 в этой версии нет.",
"Деплой и сверка — отдельные исходы. Самопроверка pitools.py определена, но её вызов закомментирован. Подтверждать целостность всех копий без исправления и испытания кода нельзя."
];
const detailsEN=[
"Read the provided .prj manifest. The actual sample names one server, one path and one file.",
"parse_prj() uses shlex.split to produce hosts[], prj_path and files[]; no file transfer yet.",
"One fl_deploy task is created per host and run concurrently through asyncio.gather() for each FL entry.",
"Each task connects with Paramiko using the given SSH key; the current source accepts unknown host keys through AutoAddPolicy. This site does not connect.",
"An SFTP session is opened and missing directories are created. The directory is Path(PRJ).parent, i.e. /tmp for the supplied sample.",
"Upload path is host prefix + '_' + PRJ basename, giving /tmp/test_test, then chmod 0644. Upload success does not establish integrity.",
"Only the first host is checked. The verifier attempts sha256sum 'test_test.txt' in a remote working directory; that differs from uploaded /tmp/test_test.",
"Deployment and integrity are separate outcomes. Source self-check is defined but commented out. All-target integrity is not confirmed by this version."
];
const state = {lang:"ru",mode:"sample",step:0,timer:0,playing:false};
const qs=id=>document.getElementById(id);
const hostsFor=()=>state.mode==="sample"?["test.server.ru"]:["node-a.example","node-b.example","node-c.example"];
function getLang(){
 const url=new URL(location.href),l=url.searchParams.get("lang");
 return locale.includes(l)?l:"ru";
}
function translate(){
 state.lang=getLang(); const lang=state.lang;document.documentElement.lang=lang==="zh"?"zh-Hans":lang;
 const words=ui[lang],ids=["startLabel","pauseLabel","resetLabel","modeSampleLabel","modeFanoutLabel","stepLabel","noNetworkLabel","manifestLabel","targetsLabel","transferredLabel","firstOnlyLabel","pathIssueLabel","exploreLabel","parallelLabel","underCodeLabel","networkNoticeLabel"];
 ids.forEach((id,i)=>{const e=qs(id);if(e)e.textContent=words[i]});
 const gallery=qs("galleryBack");if(gallery)gallery.href="/view_my_prj/"+(lang==="ru"?"":"?lang="+encodeURIComponent(lang));
 const original=qs("originalProject");if(original)original.href="/view_my_prj/projects/pitools/"+(lang==="ru"?"":"?lang="+encodeURIComponent(lang));
}
function statusFor(i){
 if(state.step>=6)return i===0?"warning":"sent";
 if(state.step>=5)return "sent";
 if(state.step>=3)return "busy";
 return "idle";
}
function hostStatusLabel(i){
 const states={
  ru:["В очереди","SSH / SFTP (демо)","Передача смоделирована","Контроль первого узла: не доказан"],
  en:["Queued","SSH / SFTP (demo)","Transfer simulated","First host: integrity unproven"]
 };
 const names=states[state.lang]||states.en;
 if(state.step===0)return names[0];
 if(state.step<=4)return names[state.step>=3?1:0];
 if(state.step===5)return names[2];
 return i===0?names[3]:names[2]+" · "+(state.lang==="ru"?"без SHA":"not verified");
}
function pathFor(host){return "/tmp/"+host.split(".")[0]+"_test";}
function makeLog(){
 const hs=hostsFor(),name=hs[0].split(".")[0];const lines=[
"$ python3 pitools.py pitools.prj --key ~/.ssh/id_rsa",
"> MLT: "+hs.join(","),
"> PRJ: /tmp/test | FL: test.txt",
"> asyncio.gather("+hs.length+" SSH/SFTP "+(hs.length===1?"task":"tasks")+")",
"> SSHClient.connect(key_filename=...)  [SIMULATION]",
"> SFTP mkdir(Path('/tmp/test').parent) → /tmp",
"> sftp.put(test.txt, /tmp/"+name+"_test)  [SIMULATION]",
"> chmod 0644; upload result ≠ checksum proof",
"> sha256sum '"+name+"_test.txt' [first host only; mismatch]",
"> SELF-CHECK: verify_integrity() commented out"
 ];
 return lines.slice(0,Math.min(lines.length,state.step+3)).join("\n");
}
function render(){
 translate();
 const words=ui[state.lang],hosts=hostsFor();qs("demoManifest").textContent="MLT: "+hosts.join(",")+"\nPRJ: /tmp/test\nFL: test.txt";
 qs("scenarioType").textContent=state.mode==="sample"?(state.lang==="ru"?"Загруженный образец":"Uploaded sample"):(state.lang==="ru"?"Иллюстративное расширение: 3 хоста":"Illustrative fan-out: 3 hosts");
 qs("stageTitle").textContent=(stages[state.lang]||stages.ru)[Math.max(0,state.step)];
 qs("stageNo").textContent=String(state.step+1).padStart(2,"0")+" / 08";
 qs("stageDescription").textContent=(state.lang==="ru"?detailsRU:detailsEN)[state.step];
 qs("progressFill").style.width=((state.step+1)/8*100)+"%";
 const hostArea=qs("hostGrid");hostArea.replaceChildren();
 hosts.forEach((host,i)=>{
  const box=document.createElement("div");box.className="host is-target "+statusFor(i);
  const h=document.createElement("div");h.className="host-title";
  const lamp=document.createElement("span");lamp.className="lamp";
  const name=document.createElement("span");name.textContent=host;
  h.append(lamp,name);const line=document.createElement("small");line.textContent=hostStatusLabel(i);
  const bar=document.createElement("div");bar.className="tiny-bar";const fill=document.createElement("i");
  const pct=state.step<=2?0:state.step<=4?55:100;fill.style.width=pct+"%";bar.append(fill);
  box.append(h,line,bar);hostArea.append(box);
 });
 qs("branchCount").textContent=hosts.length+" × SSH";
 qs("hostCount").textContent=String(hosts.length);
 qs("terminalLog").textContent=makeLog();
 const stageStep=state.step;
 qs("nodeParser").className="flow-box "+(stageStep>=1?"done":"active");
 qs("nodeFanout").className="flow-box "+(stageStep>=2?"done":stageStep===1?"active":"");
 qs("nodeRemote").className="flow-box "+(stageStep>=5?"done":stageStep>=3?"active":"");
 qs("demoSelect").value=state.mode;
 qs("startLabel").textContent=state.playing?(state.lang==="ru"?"Выполняется…":"Playing…"):words[0];
 qs("startBtn").disabled=state.playing || state.step>=7;
 qs("pauseBtn").disabled=!state.playing;
}
function stop(){if(state.timer)clearInterval(state.timer);state.timer=0;state.playing=false;}
function tick(){
 if(state.step<7){state.step++;render();}
 if(state.step>=7){stop();render();}
}
function start(){if(state.playing||state.step>=7)return;state.playing=true;render();state.timer=setInterval(tick,1150);}
qs("startBtn")?.addEventListener("click",start);
qs("pauseBtn")?.addEventListener("click",()=>{stop();render()});
qs("resetBtn")?.addEventListener("click",()=>{stop();state.step=0;render()});
qs("demoSelect")?.addEventListener("change",ev=>{stop();state.mode=ev.target.value==="fanout"?"fanout":"sample";state.step=0;render()});
qs("language")?.addEventListener("change",ev=>{const url=new URL(location.href),l=ev.target.value; if(l==="ru")url.searchParams.delete("lang");else url.searchParams.set("lang",l);history.replaceState(null,"",url.pathname+url.search+url.hash);render();});
state.lang=getLang();const picker=qs("language");if(picker)picker.value=state.lang;render();
})();
