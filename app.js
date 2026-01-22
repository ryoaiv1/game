/***********************
 * 1) Firebase CONFIG
 ***********************/
// 1) اعمل Firebase Project
// 2) Realtime Database -> Create Database
// 3) Project settings -> Web app -> انسخ firebaseConfig هنا
const firebaseConfig = {
  apiKey: "AIzaSyByh_eOoCaPdi8iXBytirN53NT_4XMMv6E",
  authDomain: "imposter-58b2a.firebaseapp.com",
  databaseURL: "https://imposter-58b2a-default-rtdb.firebaseio.com",
  projectId: "imposter-58b2a",
  storageBucket: "imposter-58b2a.firebasestorage.app",
  messagingSenderId: "286876514859",
  appId: "1:286876514859:web:69909aecde5b73e9b3886e",
};

// Firebase init is optional for opening the UI.
// The game (Create/Join) needs Realtime Database to be configured correctly.
let db = null;
let firebaseReady = false;
let firebaseInitError = "";

function isPlaceholderConfig(cfg){
  const s = JSON.stringify(cfg || {});
  return s.includes("PUT_YOUR_") || s.includes("PUT_");
}
function initFirebase(){
  try{
    if(!window.firebase){
      firebaseInitError = "Firebase SDK مش متحمل.";
      return;
    }
    if(isPlaceholderConfig(firebaseConfig)){
      firebaseInitError = "Firebase config لسه متحطّش. حط بيانات مشروعك في firebaseConfig.";
      return;
    }
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    firebaseReady = true;
  } catch (e){
    firebaseInitError = (e && e.message) ? e.message : String(e);
    firebaseReady = false;
    db = null;
  }
}
function ensureFirebase(msgEl){
  if(firebaseReady) return true;
  const msg = "Firebase مش جاهز: " + (firebaseInitError || "راجع الإعدادات.");
  if(msgEl) msgEl.textContent = msg;
  else alert(msg);
  return false;
}

// Try init now, but even if it fails the UI should still work.
initFirebase();
/***********************
 * 2) Utils
 ***********************/
const $ = (id) => document.getElementById(id);

const screens = {
  home: $("homeScreen"),
  create: $("createScreen"),
  join: $("joinScreen"),
  lobby: $("lobbyScreen"),
  game: $("gameScreen"),
};

function showScreen(key){
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[key].classList.remove("hidden");
}

function safeKey(s){
  // Realtime DB keys: avoid . # $ [ ] /
  return String(s).trim().replace(/[.#$[\]\/]/g, "_");
}
function nowMs(){ return Date.now(); }
function randInt(n){ return Math.floor(Math.random()*n); }
function pick(arr){ return arr[randInt(arr.length)]; }

function normalizeWord(w){
  return String(w || "").trim().toLowerCase();
}

function formatPhase(phase){
  const map = {
    lobby: "Lobby",
    reveal: "توزيع الأدوار",
    discussion: "نقاش",
    voting: "تصويت",
    guess: "تخمين",
    result: "نتيجة",
    ended: "انتهت",
  };
  return map[phase] || phase || "—";
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

/***********************
 * 3) Word Bank (5 Categories ~ 260 words)
 ***********************/
const WORDS = {
  "اكل/مشروبات": [
    "بيتزا","برجر","شاورما","كشري","ملوخية","محشي","فول","طعمية","كبسة","منسف",
    "مكرونة","لازانيا","سوشي","شوربة","سلطة","بطاطس","فطير","كبدة","سجق","سمك",
    "جمبري","رز","عيش","جبنة","زبادي","عسل","تمر","موز","تفاح","برتقال",
    "عنب","فراولة","مانجو","بطيخ","خوخ","اناناس","ليمون","قهوة","شاي","كاكاو",
    "حليب","عصير","مياه","بيبسي","سفن","كنافة","بسبوسة","بقلاوة","دونات","آيس كريم",
    "شوكولاتة","مكسرات"
  ],
  "حيوانات": [
    "قطة","كلب","أسد","نمر","فهد","ذئب","ثعلب","دب","غزال","زرافة",
    "فيل","حصان","حمار","جمل","بقرة","جاموس","خروف","ماعز","أرنب","قرد",
    "باندا","كنغر","تمساح","ضفدع","سلحفاة","ثعبان","عقرب","نحلة","فراشة","نملة",
    "بعوضة","دولفين","حوت","قرش","سمكة","أخطبوط","بطريق","نسر","صقر","حمامة",
    "عصفور","بطة","ديك","دجاجة","طاووس","بومة","غراب","فأر","جرذ","قنفذ",
    "حرباء","سنجاب"
  ],
  "اماكن/سفر": [
    "مدرسة","جامعة","مستشفى","صيدلية","سوبرماركت","مول","سوق","سينما","مسرح","مكتبة",
    "مطعم","كافيه","شاطئ","بحر","نهر","بحيرة","جبل","صحراء","حديقة","متحف",
    "مطار","محطة","ميناء","فندق","شقة","بيت","قصر","مسجد","كنيسة","معبد",
    "ملعب","نادي","جيم","مكتب","مصنع","ورشة","زقاق","كوبري","نفق","موقف",
    "سفارة","قنصلية","مدينة","قرية","جزيرة","واحة","غابة","مزرعة","حديقة حيوان","منتجع",
    "مخيم","قطار"
  ],
  "اشياء/أدوات": [
    "موبايل","لابتوب","كمبيوتر","كيبورد","ماوس","سماعة","ميكروفون","كاميرا","شاحن","باوربانك",
    "ساعة","نظارة","شنطة","محفظة","مفاتيح","قلم","دفتر","كتاب","كرسي","ترابيزة",
    "لمبة","مروحة","تكييف","تلفزيون","ريموت","ثلاجة","غسالة","ميكروويف","خلاط","مكواة",
    "مقص","مفك","شاكوش","منشار","متر","مسطرة","لاصق","حبل","بطانية","وسادة",
    "سرير","مراية","برفان","فرشاة","معجون","صابون","شامبو","منشفة","كوب","طبق",
    "زجاجة","ولاعة"
  ],
  "مهن/هوايات": [
    "دكتور","مهندس","مدرس","محاسب","محامي","طيار","سائق","نجار","حداد","سباك",
    "كهربائي","شيف","مصور","مصمم","مبرمج","صحفي","شرطي","جندي","صيدلي","ممرض",
    "موسيقي","مغني","رسام","لاعب كرة","لاعب سلة","لاعب تنس","سبّاح","ممثل","مخرج","كاتب",
    "شاعر","مترجم","يوتيوبَر","ستريمر","صانع محتوى","لاعب شطرنج","لاعب بلايستيشن","قراءة","كتابة","رسم",
    "طبخ","تصوير","جري","ركوب عجلة","تسلق","صيد","تخييم","سفر","تعلم لغة","برمجة",
    "خياطة","زراعة"
  ],
  "لاعبين كرة": ["Pelé", "Diego Maradona", "Lionel Messi", "Cristiano Ronaldo", "Johan Cruyff", "Zinedine Zidane", "Ronaldo Nazário", "Ronaldinho", "Franz Beckenbauer", "Alfredo Di Stéfano", "Ferenc Puskás", "Michel Platini", "Garrincha", "George Best", "Eusébio", "Paolo Maldini", "Franco Baresi", "Lev Yashin", "Gerd Müller", "Marco van Basten", "Roberto Baggio", "Lothar Matthäus", "Xavi", "Andrés Iniesta", "Thierry Henry", "Dennis Bergkamp", "Ruud Gullit", "Frank Rijkaard", "Fabio Cannavaro", "Sergio Ramos", "Iker Casillas", "Gianluigi Buffon", "Manuel Neuer", "Kylian Mbappé", "Erling Haaland", "Neymar", "Mohamed Salah", "Sadio Mané", "Karim Benzema", "Luka Modrić", "Toni Kroos", "Sergio Busquets", "Gerard Piqué", "Carles Puyol", "David Beckham", "Paul Scholes", "Steven Gerrard", "Frank Lampard", "Ryan Giggs", "Wayne Rooney", "Alan Shearer", "Michael Owen", "Zlatan Ibrahimović", "Samuel Eto'o", "Didier Drogba", "Yaya Touré", "Patrick Vieira", "Claude Makélélé", "N'Golo Kanté", "Virgil van Dijk", "Kevin De Bruyne", "Eden Hazard", "Robert Lewandowski", "Harry Kane", "Son Heung-min", "Luis Suárez", "Edinson Cavani", "Diego Forlán", "Ángel Di María", "Paulo Dybala", "Gonzalo Higuaín", "Carlos Tevez", "Javier Zanetti", "Walter Samuel", "Gabriel Batistuta", "Hernán Crespo", "Juan Román Riquelme", "Pablo Aimar", "Ariel Ortega", "Claudio Caniggia", "Carlos Valderrama", "Radamel Falcao", "James Rodríguez", "Iván Zamorano", "Marcelo Salas", "Alexis Sánchez", "Arturo Vidal", "Hugo Sánchez", "Rafa Márquez", "Javier Hernández (Chicharito)", "Cuauhtémoc Blanco", "Luis Hernández", "Andrés Guardado", "Keylor Navas", "Bryan Ruiz", "Paolo Guerrero", "Claudio Pizarro", "Jefferson Farfán", "Roque Santa Cruz", "Diego Godín", "Luis Alberto Suárez (Uruguay)", "Federico Valverde", "Darwin Núñez", "Enzo Francescoli", "Obdulio Varela", "Rivaldo", "Kaká", "Romário", "Cafu", "Roberto Carlos", "Dani Alves", "Rivaldo (Brazil)", "Sócrates", "Zico", "Jairzinho", "Rivelino", "Falcão (Brazil)", "Dunga", "Juninho Pernambucano", "Rui Costa", "Luís Figo", "Cristiano Ronaldo (Portugal)", "Eusébio (Portugal)", "Ricardo Carvalho", "Pepe", "Deco", "Bernardo Silva", "Bruno Fernandes", "João Félix", "Rúben Dias", "Raphaël Varane", "Antoine Griezmann", "Paul Pogba", "N'Golo Kanté (France)", "Karim Benzema (France)", "Franck Ribéry", "Zinédine Zidane (France)", "Laurent Blanc", "Lilian Thuram", "Patrick Kluivert", "Arjen Robben", "Robin van Persie", "Wesley Sneijder", "Clarence Seedorf", "Edgar Davids", "Dirk Kuyt", "Memphis Depay", "Matthijs de Ligt", "Virgil van Dijk (Netherlands)", "Christian Eriksen", "Michael Laudrup", "Peter Schmeichel", "Kasper Schmeichel", "Zlatan Ibrahimović (Sweden)", "Henrik Larsson", "Andriy Shevchenko", "Oleg Blokhin", "Serhiy Rebrov", "Hristo Stoichkov", "Dimitar Berbatov", "Georgi Hagi", "Gheorghe Popescu", "Robert Prosinečki", "Davor Šuker", "Dejan Savićević", "Dragan Stojković", "Nemanja Vidić", "Dejan Stanković", "Luka Modrić (Croatia)", "Ivan Rakitić", "Mario Mandžukić", "Robert Lewandowski (Poland)", "Jakub Błaszczykowski", "Wojciech Szczęsny", "Petr Čech", "Pavel Nedvěd", "Tomáš Rosický", "Milan Baroš", "Jan Koller", "Gianfranco Zola", "Francesco Totti", "Alessandro Del Piero", "Andrea Pirlo", "Gennaro Gattuso", "Filippo Inzaghi", "Christian Vieri", "Roberto Mancini", "Gianluigi Donnarumma", "Giorgio Chiellini", "Leonardo Bonucci", "Francesco Baresi", "Giuseppe Meazza", "Gaetano Scirea", "Sandro Nesta", "Ciro Immobile", "Paulo Dybala (Argentina)", "Jorginho", "Raúl", "Fernando Torres", "David Villa"]
};

const CATEGORIES = Object.keys(WORDS);

/***********************
 * 4) UI elements
 ***********************/
const nameModal = $("nameModal");
const nameInput = $("nameInput");
const saveNameBtn = $("saveNameBtn");
const meBadge = $("meBadge");
const leaveBtn = $("leaveBtn");

// ➕ تغيير الاسم
const changeNameBtn = $("changeNameBtn");
const changeNameModal = $("changeNameModal");
const newNameInput = $("newNameInput");
const confirmChangeNameBtn = $("confirmChangeNameBtn");

const goCreate = $("goCreate");
const goJoin = $("goJoin");

const createRoomName = $("createRoomName");
const createMaxPlayers = $("createMaxPlayers");
const createRounds = $("createRounds");
const createCategory = $("createCategory");
const createVoteSeconds = $("createVoteSeconds");
const createBtn = $("createBtn");
const createErr = $("createErr");

const joinRoomName = $("joinRoomName");
const joinBtn = $("joinBtn");
const joinErr = $("joinErr");

const roomTitle = $("roomTitle");
const playersCount = $("playersCount");
const playersMax = $("playersMax");
const playersList = $("playersList");

const hostPanel = $("hostPanel");
const startGameBtn = $("startGameBtn");
const nextRoundBtn = $("nextRoundBtn");

const roomCategory = $("roomCategory");
const roomRounds = $("roomRounds");
const roomMaxPlayers = $("roomMaxPlayers");
const roomVoteSeconds = $("roomVoteSeconds");
const saveRoomSettingsBtn = $("saveRoomSettingsBtn");

const roundNow = $("roundNow");
const roundTotal = $("roundTotal");
const catNow = $("catNow");
const phasePill = $("phasePill");

const meBox = $("meBox");
const guessBox = $("guessBox");
const guessInput = $("guessInput");
const submitGuessBtn = $("submitGuessBtn");
const guessMsg = $("guessMsg");

const voteArea = $("voteArea");
const voteTimer = $("voteTimer");
const voteList = $("voteList");
const castVoteBtn = $("castVoteBtn");
const voteMsg = $("voteMsg");

const scoreList = $("scoreList");
const hostGameBtns = $("hostGameBtns");
const openVotingBtn = $("openVotingBtn");
const forceEndVoteBtn = $("forceEndVoteBtn");

const gameInfo = $("gameInfo");
//
changeNameBtn.onclick = ()=>{
  newNameInput.value = myName || "";
  changeNameModal.classList.remove("hidden");
  newNameInput.focus();
};

confirmChangeNameBtn.onclick = async ()=>{
  const n = String(newNameInput.value || "").trim();
  if(n.length < 2) return;

  myName = n.slice(0,18);
  localStorage.setItem("who_name", myName);
  meBadge.textContent = `أنا: ${myName}`;
  changeNameModal.classList.add("hidden");

  if(currentRoom && ensureFirebase()){
    await db
      .ref(`${playersPath(currentRoom)}/${myId}/name`)
      .set(myName);
  }
};
/***********************
 * 5) State
 ***********************/
let myName = localStorage.getItem("who_name") || "";

let myId = localStorage.getItem("who_uid") || ("u_" + Math.random().toString(16).slice(2) + "_" + Date.now());
localStorage.setItem("who_uid", myId);

let currentRoom = null;          // roomKey
let roomRef = null;
let unsub = [];
let roomData = null;
let playersData = {};
let myPlayer = null;

let selectedVoteTarget = null;
let voteCountdownInterval = null;
let lastGuessRound = 0;
let guessLocked = false;

/***********************
 * 6) Init category selects
 ***********************/
function fillCategories(selectEl){
  selectEl.innerHTML = "";
  CATEGORIES.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    selectEl.appendChild(opt);
  });
}
fillCategories(createCategory);
fillCategories(roomCategory);

/***********************
 * 7) Navigation
 ***********************/
document.querySelectorAll("[data-back]").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    createErr.textContent = "";
    joinErr.textContent = "";
    showScreen("home");
  });
});

goCreate.onclick = ()=> showScreen("create");
goJoin.onclick = ()=> showScreen("join");

/***********************
 * 8) Name modal
 ***********************/
function requireName(){
  myName = localStorage.getItem("who_name") || "";
  if(!myName){
    nameModal.classList.remove("hidden");
    nameInput.value = "";
    nameInput.focus();
  } else {
    nameModal.classList.add("hidden");
    meBadge.textContent = `أنا: ${myName}`;
  }
}
saveNameBtn.onclick = ()=>{
  const n = String(nameInput.value || "").trim();
  if(n.length < 2) return;
  myName = n.slice(0,18);
  localStorage.setItem("who_name", myName);
  nameModal.classList.add("hidden");
  meBadge.textContent = `أنا: ${myName}`;
  changeNameBtn.classList.remove("hidden");
};

requireName();
// فتح مودال تغيير الاسم
changeNameBtn.onclick = ()=>{
  newNameInput.value = myName || "";
  changeNameModal.classList.remove("hidden");
  newNameInput.focus();
};
changeNameBtn.classList.add("hidden");
// حفظ الاسم الجديد
confirmChangeNameBtn.onclick = async ()=>{
  const n = String(newNameInput.value || "").trim();
  if(n.length < 2) return;

  myName = n.slice(0,18);
  localStorage.setItem("who_name", myName);
  meBadge.textContent = `أنا: ${myName}`;
  changeNameModal.classList.add("hidden");

  // لو داخل غرفة: حدّث الاسم في Firebase
  if(currentRoom && ensureFirebase()){
    await db.ref(`${playersPath(currentRoom)}/${myId}/name`).set(myName);
  }
};
/***********************
 * 9) Firebase helpers
 ***********************/
function roomPath(roomKey){ return `rooms/${roomKey}`; }
function playersPath(roomKey){ return `rooms/${roomKey}/players`; }

function clearSubs(){
  unsub.forEach(fn=>{ try{fn();}catch{} });
  unsub = [];
}

function onValue(ref, cb){
  const handler = ref.on("value", snap => cb(snap.val()));
  return ()=> ref.off("value", handler);
}

function onChildAdded(ref, cb){
  const handler = ref.on("child_added", snap => cb(snap.key, snap.val()));
  return ()=> ref.off("child_added", handler);
}

function onChildChanged(ref, cb){
  const handler = ref.on("child_changed", snap => cb(snap.key, snap.val()));
  return ()=> ref.off("child_changed", handler);
}

function onChildRemoved(ref, cb){
  const handler = ref.on("child_removed", snap => cb(snap.key));
  return ()=> ref.off("child_removed", handler);
}

/***********************
 * 10) Create room
 ***********************/
createBtn.onclick = async ()=>{
  createErr.textContent = "";
  if(!myName){ requireName(); return; }
  if(!ensureFirebase(createErr)) return;

  const rawName = createRoomName.value.trim();
  if(rawName.length < 8){
    createErr.textContent = "اسم الغرفة لازم يبقا 8 حروف أو أكتر.";
    return;
  }

  const roomKey = safeKey(rawName);
  const maxP = Math.max(3, Math.min(12, parseInt(createMaxPlayers.value || "6", 10)));
  const rounds = Math.max(1, Math.min(20, parseInt(createRounds.value || "5", 10)));
  const cat = createCategory.value;
  const voteSec = Math.max(20, Math.min(180, parseInt(createVoteSeconds.value || "60", 10)));

  const ref = db.ref(roomPath(roomKey));
  const snap = await ref.get();
  if(snap.exists()){
    createErr.textContent = "الغرفة دي موجودة بالفعل. اختار اسم تاني.";
    return;
  }

  const roomObj = {
    createdAt: nowMs(),
    hostId: myId,
    settings: {
      maxPlayers: maxP,
      roundsTotal: rounds,
      category: cat,
      voteSeconds: voteSec,
    },
    game: {
      phase: "lobby",
      round: 0,
      word: "",
      imposterId: "",
      vote: {
        open: false,
        endsAt: 0,
        result: {
          loserId: "",
          decided: false,
          guessed: false,
          guessText: "",
          guessCorrect: false,
        }
      }
    }
  };

  await ref.set(roomObj);
  await joinRoom(roomKey);
};

/***********************
 * 11) Join room
 ***********************/
joinBtn.onclick = async ()=>{
  joinErr.textContent = "";
  if(!myName){ requireName(); return; }
  if(!ensureFirebase(joinErr)) return;

  const rawName = joinRoomName.value.trim();
  if(rawName.length < 1){
    joinErr.textContent = "اكتب اسم الغرفة.";
    return;
  }

  const roomKey = safeKey(rawName);
  const ref = db.ref(roomPath(roomKey));
  const snap = await ref.get();
  if(!snap.exists()){
    joinErr.textContent = "الغرفة دي مش موجودة.";
    return;
  }
  await joinRoom(roomKey);
};

async function joinRoom(roomKey){
  if(!ensureFirebase()) return;
  clearSubs();
  currentRoom = roomKey;
  roomRef = db.ref(roomPath(roomKey));

  // read room first
  const roomSnap = await roomRef.get();
  const room = roomSnap.val();
  if(!room) throw new Error("Room not found");

  const maxPlayers = room.settings?.maxPlayers ?? 6;

  // check capacity
  const playersRef = db.ref(playersPath(roomKey));
  const playersSnap = await playersRef.get();
  const players = playersSnap.val() || {};
  const aliveCount = Object.keys(players).length;
  if(aliveCount >= maxPlayers && !players[myId]){
    throw new Error("Room full");
  }

  // add/update me
  const meRef = db.ref(`${playersPath(roomKey)}/${myId}`);
  await meRef.set({
    id: myId,
    name: myName,
    joinedAt: nowMs(),
    score: players[myId]?.score ?? 0,
    role: "",      // "imposter" | "civil"
    myWord: "",    // word for civil
    isHost: room.hostId === myId,
    lastSeenAt: nowMs(),
  });

  // remove on disconnect
  try { meRef.onDisconnect().remove(); } catch {}

  // UI
  leaveBtn.classList.remove("hidden");
  roomTitle.textContent = roomKey;

  // subscribe room + players
  unsub.push(onValue(roomRef, (v)=>{
    roomData = v || null;
    renderAll();
  }));

  const pr = db.ref(playersPath(roomKey));
  unsub.push(onValue(pr, (v)=>{
    playersData = v || {};
    myPlayer = playersData[myId] || null;
    renderAll();
  }));

  showScreen("lobby");
}

leaveBtn.onclick = async ()=>{
  if(!currentRoom) return;
  try{
    await db.ref(`${playersPath(currentRoom)}/${myId}`).remove();
  }catch{}
  clearSubs();
  currentRoom = null;
  roomRef = null;
  roomData = null;
  playersData = {};
  myPlayer = null;

  leaveBtn.classList.add("hidden");
  hostPanel.classList.add("hidden");
  showScreen("home");
};

/***********************
 * 12) Host settings save
 ***********************/
saveRoomSettingsBtn.onclick = async ()=>{
  if(!isHost()) return;
  const maxP = Math.max(3, Math.min(12, parseInt(roomMaxPlayers.value || "6", 10)));
  const rounds = Math.max(1, Math.min(20, parseInt(roomRounds.value || "5", 10)));
  const cat = roomCategory.value;
  const voteSec = Math.max(20, Math.min(180, parseInt(roomVoteSeconds.value || "60", 10)));

  await db.ref(`${roomPath(currentRoom)}/settings`).update({
    maxPlayers: maxP,
    roundsTotal: rounds,
    category: cat,
    voteSeconds: voteSec,
  });
};

/***********************
 * 13) Start game / next round
 ***********************/
startGameBtn.onclick = async ()=>{
  if(!isHost()) return;
  const players = Object.values(playersData);
  const maxP = roomData?.settings?.maxPlayers ?? 6;

  if(players.length < 3){
    alert("لازم 3 لاعبين على الأقل.");
    return;
  }
  if(players.length > maxP){
    alert("عدد اللاعبين أكبر من الحد.");
    return;
  }
  await startNewRound();
};

nextRoundBtn.onclick = async ()=>{
  if(!isHost()) return;
  await startNewRound();
};

async function startNewRound(){
  if(!currentRoom) return;
  const roundsTotal = roomData?.settings?.roundsTotal ?? 5;
  const currentRound = roomData?.game?.round ?? 0;

  if(currentRound >= roundsTotal){
    await db.ref(`${roomPath(currentRoom)}/game/phase`).set("ended");
    return;
  }

  const playerIds = Object.keys(playersData);
  if(playerIds.length < 3){
    alert("لازم 3 لاعبين على الأقل.");
    return;
  }

  // choose imposter + word
  const imposterId = pick(playerIds);
  const cat = roomData?.settings?.category ?? CATEGORIES[0];
  const word = pick(WORDS[cat] || WORDS[CATEGORIES[0]]);

  // reset vote block
  const gameUpdate = {
    phase: "reveal",
    round: currentRound + 1,
    word,
    imposterId,
    vote: {
      open: false,
      endsAt: 0,
      result: { loserId:"", decided:false, guessed:false, guessText:"", guessCorrect:false }
    }
  };

  // update players roles/words
  const updates = {};
  for(const pid of playerIds){
    const isImp = pid === imposterId;
    updates[`${playersPath(currentRoom)}/${pid}/role`] = isImp ? "imposter" : "civil";
    updates[`${playersPath(currentRoom)}/${pid}/myWord`] = isImp ? "" : word;
  }

  // clear any old votes
  updates[`${roomPath(currentRoom)}/game`] = gameUpdate;
  updates[`${roomPath(currentRoom)}/votes`] = null;

  await db.ref().update(updates);

  // auto move to discussion shortly
  setTimeout(async ()=>{
    try{
      const phase = (await db.ref(`${roomPath(currentRoom)}/game/phase`).get()).val();
      if(phase === "reveal"){
        await db.ref(`${roomPath(currentRoom)}/game/phase`).set("discussion");
      }
    }catch{}
  }, 2500);
}

/***********************
 * 14) Voting
 ***********************/
openVotingBtn.onclick = async ()=>{
  if(!isHost()) return;
  const voteSec = roomData?.settings?.voteSeconds ?? 60;
  const endsAt = nowMs() + voteSec*1000;

  await db.ref(`${roomPath(currentRoom)}/game`).update({
    phase: "voting",
    vote: {
      open: true,
      endsAt,
      result: { loserId:"", decided:false, guessed:false, guessText:"", guessCorrect:false }
    }
  });

  // host can also auto-decide when time ends (best effort)
  setTimeout(()=> { decideVoteIfNeeded().catch(()=>{}); }, voteSec*1000 + 200);
};

forceEndVoteBtn.onclick = async ()=>{
  if(!isHost()) return;
  await decideVoteIfNeeded(true);
};

castVoteBtn.onclick = async ()=>{
  voteMsg.textContent = "";
  if(!currentRoom) return;
  if(!selectedVoteTarget){
    voteMsg.textContent = "اختار لاعب الأول.";
    return;
  }

  // Each player can vote once; overwrite allowed for simplicity.
  await db.ref(`${roomPath(currentRoom)}/votes/${myId}`).set({
    from: myId,
    to: selectedVoteTarget,
    at: nowMs(),
  });
  voteMsg.textContent = "تم تسجيل التصويت.";
};

async function decideVoteIfNeeded(force=false){
  if(!currentRoom) return;
  const gref = db.ref(`${roomPath(currentRoom)}/game`);
  const gameSnap = await gref.get();
  const game = gameSnap.val();
  if(!game) return;
  if(game.vote?.result?.decided && !force) return;

  const endsAt = game.vote?.endsAt || 0;
  if(!force && nowMs() < endsAt) return;

  // count votes
  const vsnap = await db.ref(`${roomPath(currentRoom)}/votes`).get();
  const votes = vsnap.val() || {};
  const counts = {};
  Object.values(votes).forEach(v=>{
    if(!v?.to) return;
    counts[v.to] = (counts[v.to] || 0) + 1;
  });

  // find max (tie -> random among max)
  let max = -1;
  let top = [];
  for(const pid of Object.keys(playersData)){
    const c = counts[pid] || 0;
    if(c > max){ max = c; top = [pid]; }
    else if(c === max){ top.push(pid); }
  }
  const loserId = top.length ? pick(top) : pick(Object.keys(playersData));

  await gref.update({
    phase: "guess",
    vote: {
      open: false,
      endsAt: endsAt,
      result: { loserId, decided:true, guessed:false, guessText:"", guessCorrect:false }
    }
  });
}

/***********************
 * 15) Guess submit (only loser sees box)
 ***********************/
submitGuessBtn.onclick = async ()=>{
  guessMsg.textContent = "";
  if(!currentRoom) return;

  const loserId = roomData?.game?.vote?.result?.loserId;
  if(loserId !== myId){
    guessMsg.textContent = "مش دورك.";
    return;
  }

  const g = normalizeWord(guessInput.value);
  if(g.length < 1){
    guessMsg.textContent = "اكتب التخمين.";
    return;
  }

  const real = normalizeWord(roomData?.game?.word || "");
  const correct = g === real;

  
await db.ref(`${roomPath(currentRoom)}/game/vote/result`).update({
  guessed: true,
  guessText: g,
  guessCorrect: correct,
});

// lock UI locally so it doesn't feel like "nothing happened"
guessLocked = true;
guessInput.disabled = true;
submitGuessBtn.disabled = true;
guessMsg.textContent = "تم إرسال التخمين… استنى النتيجة.";

// scoring (host does it once to avoid conflicts)
  // best-effort: if you're not host, still can submit guess; host listener will score
};

/***********************
 * 16) Scoring logic (host)
 *
 * Rules (تظبيط مني للحاجات اللي ماقلتهاش):
 * - لو الامبوستر ما اتقفش (loser مش imposter): كل المدنيين +1 و الامبوستر +2
 * - لو الامبوستر اتقفش (loser هو imposter):
 *    - لو الامبوستر خمن الكلمة صح: الامبوستر +2
 *    - لو خمن غلط: المدنيين +2
 ***********************/
async function hostMaybeScore(){
  if(!isHost()) return;
  if(!roomData) return;

  const game = roomData.game || {};
  if(game.phase !== "guess") return;

  const res = game.vote?.result;
  if(!res?.decided) return;

  // wait until guess submitted OR small timeout handled by host button end vote - but we do: if guessed==false, no score yet
  if(!res.guessed) return;

  // prevent double scoring: we mark game.phase = "result" after scoring
  const phaseSnap = await db.ref(`${roomPath(currentRoom)}/game/phase`).get();
  if(phaseSnap.val() !== "guess") return; // someone already moved

  const loserId = res.loserId;
  const imposterId = game.imposterId;
  const imposterCaught = loserId === imposterId;

  const updates = {};
  const playerIds = Object.keys(playersData);

  if(imposterCaught){
    if(res.guessCorrect){
      // imposter guessed right
      updates[`${playersPath(currentRoom)}/${imposterId}/score`] = (playersData[imposterId]?.score || 0) + 2;
    } else {
      // civilians win
      for(const pid of playerIds){
        if(pid !== imposterId){
          updates[`${playersPath(currentRoom)}/${pid}/score`] = (playersData[pid]?.score || 0) + 2;
        }
      }
    }
  } else {
    // wrong person got voted out: civilians +1, imposter +2
    for(const pid of playerIds){
      if(pid === imposterId){
        updates[`${playersPath(currentRoom)}/${pid}/score`] = (playersData[pid]?.score || 0) + 2;
      } else {
        updates[`${playersPath(currentRoom)}/${pid}/score`] = (playersData[pid]?.score || 0) + 1;
      }
    }
  }

  updates[`${roomPath(currentRoom)}/game/phase`] = "result";

  await db.ref().update(updates);

  // after 3s, enable next round button in lobby for host
  setTimeout(async ()=>{
    try{
      const roundsTotal = roomData?.settings?.roundsTotal ?? 5;
      const r = (await db.ref(`${roomPath(currentRoom)}/game/round`).get()).val() || 0;
      if(r >= roundsTotal){
        await db.ref(`${roomPath(currentRoom)}/game/phase`).set("ended");
      } else {
        // back to lobby style controls but keep in game screen
        // host uses "الجولة التالية"
      }
    }catch{}
  }, 300);
}

/***********************
 * 17) Render
 ***********************/
function isHost(){
  return roomData?.hostId === myId;
}

function renderPlayersList(){
  playersList.innerHTML = "";
  const ids = Object.keys(playersData);
  ids.sort((a,b)=> (playersData[a]?.joinedAt||0) - (playersData[b]?.joinedAt||0));

  for(const pid of ids){
    const p = playersData[pid];
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.className = "kv";
    left.innerHTML = `<strong>${escapeHtml(p.name||"")}</strong>
      ${pid===roomData?.hostId ? `<span class="tag tag-ok">Host</span>` : ``}
      ${pid===myId ? `<span class="tag">أنت</span>` : ``}
    `;
    const right = document.createElement("div");
    right.className = "tag";
    right.textContent = `نقاط: ${p.score || 0}`;
    li.appendChild(left);
    li.appendChild(right);
    playersList.appendChild(li);
  }

  playersCount.textContent = String(ids.length);
}
function renderLobbySettings(){
  if(!roomData) return;

  const s = roomData.settings || {};
  roomMaxPlayers.value = s.maxPlayers ?? 6;
  roomRounds.value = s.roundsTotal ?? 5;
  roomCategory.value = s.category ?? CATEGORIES[0];
  roomVoteSeconds.value = s.voteSeconds ?? 60;

  playersMax.textContent = String(s.maxPlayers ?? 6);

  const is_room_host = isHost();
  hostPanel.classList.toggle("hidden", !is_room_host);

  // Disable settings editing for non-host OR after game started
  const phase = roomData?.game?.phase || "lobby";
  const inLobby = phase === "lobby";
  const canEdit = is_room_host && inLobby;

  roomMaxPlayers.disabled = !canEdit;
  roomRounds.disabled = !canEdit;
  roomCategory.disabled = !canEdit;
  roomVoteSeconds.disabled = !canEdit;
  saveRoomSettingsBtn.disabled = !canEdit;

  startGameBtn.disabled = !(is_room_host && inLobby);

  // Next round appears in game screen; hide it here
}

function renderPhasePills(){
  const g = roomData?.game || {};
  const s = roomData?.settings || {};

  roundNow.textContent = String(g.round ?? 0);
  roundTotal.textContent = String(s.roundsTotal ?? 5);
  catNow.textContent = String(s.category ?? "—");
  phasePill.textContent = formatPhase(g.phase);
}

function renderMeSection(){
  meBox.innerHTML = "";
  guessBox.classList.add("hidden");
  guessMsg.textContent = "";
  voteMsg.textContent = "";

  if(!roomData || !myPlayer) return;

  const g = roomData.game || {};
  const phase = g.phase || "lobby";
  const role = myPlayer.role || "";
  const myWord = myPlayer.myWord || "";

  // In lobby, show waiting message
  if(phase === "lobby"){
    meBox.innerHTML = `<div class="box">
      <div class="title">Me</div>
      <div class="muted">مستنيين صاحب الغرفة يبدأ اللعبة…</div>
    </div>`;
    return;
  }

  // Reveal / Discussion / Voting / Guess / Result
  const isImp = role === "imposter";

  let roleLine = isImp
    ? `<span class="tag tag-bad">أنت الامبوستر</span>`
    : `<span class="tag tag-ok">أنت مش امبوستر</span>`;

  let wordLine = isImp
    ? `<div class="muted">الكلمة مش ظاهرة ليك 👀</div>`
    : `<div class="word">الكلمة: <strong>${escapeHtml(myWord)}</strong></div>`;

  // During reveal we show role+word (civilians only)
  meBox.innerHTML = `<div class="box">
    <div class="title">Me</div>
    <div class="row">${roleLine}</div>
    <div class="row">${wordLine}</div>
  </div>`;

  // Guess UI: only the voted-out person during guess phase
  const loserId = g.vote?.result?.loserId || "";
  const showGuess = (phase === "guess" && loserId === myId);

  
if(showGuess){
  guessBox.classList.remove("hidden");

  // Prevent clearing the input on every render (renderAll runs كثير)
  if(lastGuessRound !== (g.round || 0)){
    lastGuessRound = (g.round || 0);
    guessLocked = false;
    guessInput.value = "";
    guessInput.disabled = false;
    submitGuessBtn.disabled = false;
    guessMsg.textContent = "اتوقعت عليك… خمن الكلمة!";
  }

  // If already submitted, keep it locked
  if(guessLocked){
    guessInput.disabled = true;
    submitGuessBtn.disabled = true;
  }
} else {
  guessBox.classList.add("hidden");
}
}

function stopVoteCountdown(){
  if(voteCountdownInterval){
    clearInterval(voteCountdownInterval);
    voteCountdownInterval = null;
  }
}

function startVoteCountdown(){
  stopVoteCountdown();
  voteCountdownInterval = setInterval(()=>{
    if(!roomData) return;
    const endsAt = roomData?.game?.vote?.endsAt || 0;
    const remainMs = Math.max(0, endsAt - nowMs());
    const sec = Math.ceil(remainMs / 1000);
    voteTimer.textContent = sec > 0 ? `الوقت المتبقي: ${sec}s` : `انتهى الوقت`;
  }, 200);
}

function renderVotingUI(){
  voteArea.classList.add("hidden");
  voteList.innerHTML = "";
  voteTimer.textContent = "";
  selectedVoteTarget = null;

  if(!roomData) return;

  const g = roomData.game || {};
  const phase = g.phase || "lobby";
  const voteOpen = !!g.vote?.open;

  if(!(phase === "voting" && voteOpen)){
    stopVoteCountdown();
    return;
  }

  voteArea.classList.remove("hidden");
  startVoteCountdown();

  // list players to pick
  const ids = Object.keys(playersData);
  ids.sort((a,b)=> (playersData[a]?.joinedAt||0) - (playersData[b]?.joinedAt||0));

  ids.forEach(pid=>{
    const p = playersData[pid];
    const btn = document.createElement("button");
    btn.className = "voteBtn";
    btn.type = "button";
    btn.innerHTML = `${escapeHtml(p.name || "")} ${pid===myId ? `<span class="tag">أنت</span>`:""}`;
    btn.onclick = ()=>{
      selectedVoteTarget = pid;
      // highlight selection
      [...voteList.querySelectorAll(".voteBtn")].forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      voteMsg.textContent = `هتصوت لـ: ${p.name}`;
    };
    voteList.appendChild(btn);
  });
}

function renderScores(){
  scoreList.innerHTML = "";
  if(!playersData) return;

  const arr = Object.values(playersData).map(p=>({
    id: p.id,
    name: p.name || "",
    score: p.score || 0,
  }));

  arr.sort((a,b)=> b.score - a.score);

  arr.forEach(p=>{
    const li = document.createElement("li");
    li.innerHTML = `<div class="kv">
      <strong>${escapeHtml(p.name)}</strong>
      ${p.id===roomData?.hostId ? `<span class="tag tag-ok">Host</span>` : ``}
      ${p.id===myId ? `<span class="tag">أنت</span>` : ``}
    </div>
    <div class="tag">نقاط: ${p.score}</div>`;
    scoreList.appendChild(li);
  });
}

function renderGameHostButtons(){
  // Buttons shown in GAME screen for host
  if(!roomData) return;
  const g = roomData.game || {};
  const phase = g.phase || "lobby";

  const host = isHost();
  hostGameBtns.classList.toggle("hidden", !host);

  // Voting open / end vote
  openVotingBtn.disabled = !(host && (phase === "discussion"));
  forceEndVoteBtn.disabled = !(host && (phase === "voting"));

  // Next round available after result or ended
  const roundsTotal = roomData?.settings?.roundsTotal ?? 5;
  const r = g.round ?? 0;
  const canNext = host && (phase === "result") && (r < roundsTotal);
  nextRoundBtn.classList.toggle("hidden", !host);
  nextRoundBtn.disabled = !canNext;

  // If ended: allow host to see final state; nextRound disabled
  if(phase === "ended"){
    nextRoundBtn.disabled = true;
  }
}

function renderGameInfo(){
  if(!roomData) return;
  const g = roomData.game || {};
  const s = roomData.settings || {};
  const phase = g.phase || "lobby";

  let msg = "";
  if(phase === "reveal"){
    msg = "تم توزيع الأدوار.";
  } else if(phase === "discussion"){
    msg = "ناقشوا بعض… وبعدها صاحب الروم يفتح التصويت.";
  } else if(phase === "voting"){
    msg = "التصويت شغال… اختاروا مين الامبوستر.";
  } else if(phase === "guess"){
    const loserId = g.vote?.result?.loserId || "";
    const loserName = playersData[loserId]?.name || "—";
    msg = `أعلى تصويت: ${loserName}. دلوقتي لازم يخمن الكلمة.`;
  } else if(phase === "result"){
    const res = g.vote?.result || {};
    const loserId = res.loserId || "";
    const loserName = playersData[loserId]?.name || "—";
    const imposterId = g.imposterId || "";
    const imposterName = playersData[imposterId]?.name || "—";

    const caught = loserId === imposterId;
    if(caught){
      if(res.guessCorrect){
        msg = `اتمسك الامبوستر (${imposterName})… لكنه خمن الكلمة صح ✅`;
      } else {
        msg = `اتمسك الامبوستر (${imposterName})… وخمن غلط ❌`;
      }
    } else {
      msg = `طلعوا غلط… اللي خرج هو (${loserName}) والامبوستر كان (${imposterName}).`;
    }
  } else if(phase === "ended"){
    msg = `اللعبة انتهت. لعبتوا ${g.round ?? 0} / ${s.roundsTotal ?? 5} جولة.`;
  } else if(phase === "lobby"){
    msg = "في اللوبي…";
  }

  gameInfo.textContent = msg;
}

function renderWhichScreen(){
  if(!roomData) return;

  const phase = roomData?.game?.phase || "lobby";
  if(phase === "lobby"){
    showScreen("lobby");
  } else {
    showScreen("game");
  }
}

function renderAll(){
  if(!roomData){
    // no room loaded
    return;
  }

  renderWhichScreen();
  renderPlayersList();
  renderLobbySettings();
  renderPhasePills();
  renderMeSection();
  renderVotingUI();
  renderScores();
  renderGameHostButtons();
  renderGameInfo();

  // Host scoring watcher
  hostMaybeScore().catch(()=>{});

  // If voting time ended, host auto decide (best effort)
  if(isHost()){
    const g = roomData.game || {};
    if(g.phase === "voting" && g.vote?.open){
      const endsAt = g.vote?.endsAt || 0;
      if(nowMs() >= endsAt){
        decideVoteIfNeeded().catch(()=>{});
      }
    }
  }

  // If phase is guess and loser has guessed: show result button availability
  // Next round handled in renderGameHostButtons()
}

/***********************
 * 18) Extra: keep-alive lastSeen
 ***********************/
setInterval(()=>{
  if(!currentRoom) return;
  db.ref(`${playersPath(currentRoom)}/${myId}/lastSeenAt`).set(nowMs()).catch(()=>{});
}, 10000);

/***********************
 * 19) Auto cleanup countdown on screen change
 ***********************/
window.addEventListener("beforeunload", ()=>{
  stopVoteCountdown();
});
