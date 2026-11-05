// "We'll Be Right Back" prototype behaviour.
//   The monitor plays a video (click it); the scene is a small click-and-find: rain + lightning, a droopy plant, a rack boot-order puzzle,
//   Danial and Jesse who duck when you reach for them, a #1 sysadmin mug, a drawer of knick-knacks, and Stewart's eye following the mouse.
const $ = (id) => document.getElementById(id);
const scene = $('scene'), layer = $('layer'), caption = $('caption');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);
const store = {
  get(k, d) { try { return JSON.parse(sessionStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ── place things by the picture's own coordinates (1920x1080) ──
const px = (x) => (x / 1920) * 100 + '%', py = (y) => (y / 1080) * 100 + '%';
function place(el, [x, y, w, h]) { Object.assign(el.style, { left: px(x), top: py(y), width: px(w), height: py(h) }); }
document.querySelectorAll('[data-box]').forEach((el) => place(el, el.dataset.box.split(',').map(Number)));
document.querySelectorAll('.bu-clip').forEach((el) => place(el, getComputedStyle(el).getPropertyValue('--box').split(',').map(Number)));

// ── narrator caption ──
let capTimer = 0, timedUntil = 0;
function say(text) { caption.textContent = text; caption.classList.add('show'); }
function hideCap() { caption.classList.remove('show'); }
function sayTimed(text, ms = 3200) { timedUntil = Date.now() + ms; say(text); clearTimeout(capTimer); capTimer = setTimeout(hideCap, ms); }
function hover(el, text) {
  const t = typeof text === 'function' ? text : () => text;
  const on = () => { if (Date.now() > timedUntil) say(t()); };
  const off = () => { if (Date.now() > timedUntil) hideCap(); };
  el.addEventListener('pointerenter', on); el.addEventListener('focus', on);
  el.addEventListener('pointerleave', off); el.addEventListener('blur', off);
}

// ── clues ──
const KEYS = ['danial', 'jesse', 'rack', 'drawer', 'mug', 'poster', 'duck', 'usb', 'trash', 'books', 'konami', 'phone'];
const NAMES = { danial: 'Danial', jesse: 'Jesse', rack: 'the rack', drawer: 'the drawer', mug: 'the mug', trash: 'the trash can', books: 'the books', konami: 'the code', phone: 'the phone' };
const found = new Set(store.get('bu-secrets', []));
const pips = $('trayPips');
KEYS.forEach(() => pips.appendChild(document.createElement('i')));
function renderTray() {
  [...pips.children].forEach((p, i) => p.classList.toggle('on', found.has(KEYS[i])));
  $('trayLabel').textContent = `Clues ${found.size}/${KEYS.length}`;
  $('tray').classList.toggle('done', found.size === KEYS.length);
}
function pulse() { const p = $('pulse'); p.classList.remove('go'); void p.getBoundingClientRect(); p.classList.add('go'); }
function discover(key) {
  if (found.has(key)) return false;
  found.add(key); store.set('bu-secrets', [...found]); renderTray(); pulse();
  return true;
}
// all the clues found: it was Jesse
function celebrateIfDone() {
  if (found.size !== KEYS.length || store.get('bu-revealed', false)) return;
  store.set('bu-revealed', true);
  setTimeout(() => {
    const dlg = $('reveal');
    if (dlg.open) return;
    document.querySelectorAll('dialog[open]').forEach((d) => d.close());
    dlg.showModal();
    const sub = $('scrSub'); if (sub) { sub.textContent = 'root cause: jesse'; }
  }, 1400);
}
renderTray();

// ── rain + lightning ──
const rain = $('rain');
for (let i = 0; i < 22; i++) {
  const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  const x = rand(250, 600);
  l.setAttribute('x1', x); l.setAttribute('y1', 181); l.setAttribute('x2', x - 4); l.setAttribute('y2', 207);
  l.setAttribute('class', 'bu-drop');
  l.style.animationDuration = rand(0.9, 1.5) + 's'; l.style.animationDelay = -rand(0, 1.5) + 's';
  rain.appendChild(l);
}
let audioCtx = null;
function thunder() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx, len = ctx.sampleRate * 2.4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2 * Math.pow(1 - i / len, 1.6); } // brown noise, fading out
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    const g = ctx.createGain(); g.gain.value = 0.55;
    src.connect(lp); lp.connect(g); g.connect(ctx.destination); src.start();
  } catch {}
}
let stormTimer = 0;
function lightning() {
  for (const id of ['flashSky', 'flashRoom']) { const e = $(id); e.classList.remove('go'); void e.getBoundingClientRect(); e.classList.add('go'); }
  layer.classList.add('bu-storm'); clearTimeout(stormTimer); stormTimer = setTimeout(() => layer.classList.remove('bu-storm'), 3200);
  setTimeout(thunder, 380);
}
const hsWindow = $('hsWindow');
hover(hsWindow, 'The window. It is raining. Naturally.');
hsWindow.addEventListener('click', () => { lightning(); sayTimed('KRAKOOM.', 1800); });

// ── plant ──
let drooped = false;
const leafA = $('leafA'), leafB = $('leafB');
hover($('hsPlant'), () => (drooped ? 'The plant. It has given up. Click to cheer it up.' : 'The plant. Doing its best.'));
$('hsPlant').addEventListener('click', () => {
  drooped = !drooped;
  for (const l of [leafA, leafB]) { l.classList.toggle('is-drooped', drooped); l.classList.toggle('perk', !drooped); }
  sayTimed(drooped ? 'The plant gives up. Relatable.' : '...and it is back. Resilient.', 2600);
});

// ── mug ──
let mugTimer = 0;
// ── the shelf: three books on it; clicking opens the close-up ──
const BOOKS = [
  ['hsBook1', 'MCSE for Dummies', 'It looks dusty.'],
  ['hsBook2', 'Network+', 'Looks handy.'],
  ['hsBook3', 'PowerShell in a Month of Lunches', 'Perfect for scripting.'],
];
// ── the VoIP phone: the message light is blinking ──
const VOICEMAIL = [
  { src: 'assets/vm/incoming-voicemail-save-the-company.mp3', ms: 5100, text: "Hey, it's Aharon. I was just calling to see when you're going to save the company." },
  { src: 'assets/vm/aharon-waazup-voicemail.mp3', ms: 4400, text: "Hey, it's Aharon, wazzup?" },
  { src: 'assets/vm/aharon-where-are-you.mp3', ms: 7500, text: "Hey, it's Aharon. It's about 10 o'clock. Yeah, just wondering where you are." },
  { src: 'assets/vm/aharon-come-in-tomorrow.mp3', ms: 5600, text: "Hey, it's Aharon. I am gonna need you to go ahead and come in tomorrow." },
];
let vmIdx = 0, vmAudio = null;
hover($('hsPhone'), 'A VoIP desk phone. The message light is blinking.');
$('hsPhone').addEventListener('click', () => {
  const vm = VOICEMAIL[vmIdx];
  if (vmAudio) { vmAudio.pause(); vmAudio = null; }
  const au = new Audio(vm.src); vmAudio = au;
  au.play().catch(() => {});
  sayTimed(`Voicemail ${vmIdx + 1} of ${VOICEMAIL.length}: "${vm.text}"`, vm.ms + 1600);
  vmIdx = (vmIdx + 1) % VOICEMAIL.length;
  if (vmIdx === 0) $('phoneLed').classList.add('read');
  if (discover('phone')) celebrateIfDone();
});
hover($('hsStapler'), 'A red stapler. It is not yours.');
$('hsStapler').addEventListener('click', () => sayTimed('Somebody has been looking for this since 1999. Please do not tell them.', 4200));
hover($('hsMug'), 'A coffee mug.');
$('hsMug').addEventListener('click', () => {
  const c = $('mugCard'); c.classList.add('show'); clearTimeout(mugTimer); mugTimer = setTimeout(() => c.classList.remove('show'), 3600);
  sayTimed('It reads: "#1 sysadmin". Somebody believes in them.', 3600);
  if (discover('mug')) celebrateIfDone();
});

// ── Stewart: positive, and his eye follows you (only the pupil moves) ──
hover($('hsStewart'), 'Stewart. Keeping his chin up.');
const pupil = $('pupil');
const EYE = { x: 640.5, y: 576.5 }, REST = { x: 10, y: 3 }, MAX = { x: 19, y: 14 };
let target = { ...REST }, cur = { ...REST }, lastMove = 0, eyeOverride = 0;
addEventListener('pointermove', (e) => {
  const r = layer.getBoundingClientRect(), k = r.width / 1920;
  const dx = e.clientX - (r.left + EYE.x * k), dy = e.clientY - (r.top + EYE.y * k), dist = Math.hypot(dx, dy) || 1;
  const m = Math.min(1, dist / 220);
  target = { x: (dx / dist) * m * MAX.x, y: (dy / dist) * m * MAX.y };
  lastMove = performance.now();
}, { passive: true });
(function eye(now) {
  if (now - lastMove > 5000) target = { ...REST };   // gazes back at the screen when you stop
  if (now < eyeOverride) target = { x: MAX.x * 0.95, y: -1 };   // something just happened at the rack
  cur.x += (target.x - cur.x) * (reduceMotion ? 1 : 0.16); cur.y += (target.y - cur.y) * (reduceMotion ? 1 : 0.16);
  pupil.setAttribute('cx', EYE.x + cur.x); pupil.setAttribute('cy', EYE.y + cur.y);
  requestAnimationFrame(eye);
})(0);

// ── the rack: bring it up in the right order and it all goes green ──
// the units are racked in a scrambled order; the OSI poster hints the boot order, bottom (1) to top (7)
const UNIT_NAMES = ['Power distribution', 'Storage', 'Network', 'Database', 'Cache', 'App server', 'Load balancer'];
const ORDER = [0, 2, 1, 3, 4, 5, 6];                      // power, network, storage, database, cache, app server, load balancer (poster layers 1-7 hint each, in order)
const LED = { x: 1501, y0: 392.2, dy: 54.9, off: '#005655', bad: '#F15B5B', ok: '#00BBB4' };
const leds = $('leds'), unitsEl = $('units'), plateSolved = $('plateSolved');
const ledEls = UNIT_NAMES.map((_, i) => {
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', LED.x); c.setAttribute('cy', LED.y0 + LED.dy * i); c.setAttribute('r', 5.8); c.setAttribute('class', 'bu-led');
  leds.appendChild(c); return c;
});
const idleColor = (i) => (i === 4 ? LED.bad : LED.off);
const setLed = (i, color, r = 5.8) => { ledEls[i].setAttribute('fill', color); ledEls[i].setAttribute('r', r); };
let progress = 0, fails = 0, solved = !!store.get('bu-rack', false);
function resetLeds(cascade = true) {
  ledEls.forEach((_, i) => { ledEls[i].classList.remove('wave'); cascade ? setTimeout(() => setLed(i, idleColor(i)), i * 55) : setLed(i, idleColor(i)); });
}
function applySolved(silent) {
  solved = true; store.set('bu-rack', true);
  ledEls.forEach((_, i) => { setTimeout(() => { setLed(i, LED.ok, 6.6); ledEls[i].classList.add('wave'); ledEls[i].style.animationDelay = i * 0.12 + 's'; }, silent ? 0 : i * 90); });
  plateSolved.classList.add('is-on');
  if (!silent) {
    const sub = $('scrSub'); const prev = sub.textContent; sub.textContent = 'rack: all green';
    setTimeout(() => { sub.textContent = prev; }, 4800);
    sayTimed('All green. Service: still down. Classic.', 4600);
    if (discover('rack')) celebrateIfDone();
  }
}
resetLeds(false);
if (solved) applySolved(true);
function pressUnit(i) {
  const name = UNIT_NAMES[i];
  if (solved) return sayTimed('Already green. Do not touch it.', 2200);
  if (i === ORDER[progress]) {
    setLed(i, LED.ok, 6.6); progress++;
    if (progress === ORDER.length) return applySolved(false);
    sayTimed(`${name}: online.`, 1500);
  } else {
    fails++; setLed(i, LED.bad, 7);
    setTimeout(() => { progress = 0; resetLeds(true); }, 280);
    sayTimed(fails === 1 ? 'Wrong order. Everything powers back down. Hint: what is everything else standing on?'
      : fails === 2 ? 'Hint: start at the very bottom of the stack and work up. (There is a poster about this.)'
      : 'Boot order: ' + ORDER.map((u) => UNIT_NAMES[u]).join(', ') + '.', fails === 1 ? 5200 : fails === 2 ? 5200 : 7500);
  }
}
UNIT_NAMES.forEach((name, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'bu-unit'; b.setAttribute('aria-label', `Server unit ${i + 1}: ${name}`);
  place(b, [1479, LED.y0 + LED.dy * i - 19, 165, 38]);
  hover(b, () => `Unit ${i + 1}: ${name}.`);
  b.addEventListener('click', () => pressUnit(i));
  unitsEl.appendChild(b);
});

// ── phones: the rack, zoomed in, with big tap targets (the little units are hidden on narrow screens) ──
const rackDlg = $('rackZoom'), rackList = $('rackList'), rackCap = $('rackCaption'), RCAP = 'Tap a unit to power it on.';
const rackRows = UNIT_NAMES.map((name, i) => {
  const r = document.createElement('button');
  r.type = 'button'; r.className = 'bu-rackrow'; r.innerHTML = '<i></i><span></span>';
  r.children[1].textContent = `${i + 1} \u00b7 ${name}`;
  r.addEventListener('click', () => { pressUnit(i); if (solved) setTimeout(() => { if (rackDlg.open) rackDlg.close(); }, 2600); });
  rackList.appendChild(r); return r;
});
const syncRack = () => rackRows.forEach((r, i) => { r.firstChild.style.background = ledEls[i].getAttribute('fill'); });
new MutationObserver(syncRack).observe(leds, { subtree: true, attributes: true, attributeFilter: ['fill'] });
new MutationObserver(() => { if (rackDlg.open) rackCap.textContent = caption.textContent; }).observe(caption, { childList: true, characterData: true, subtree: true });
hover($('hsRack'), 'The server rack. Tap it to zoom in.');
$('revealClose').addEventListener('click', () => $('reveal').close());
$('reveal').addEventListener('click', (e) => { if (e.target === $('reveal')) $('reveal').close(); });
$('hsRack').addEventListener('click', () => { rackDlg.showModal(); rackCap.textContent = RCAP; syncRack(); });
$('rackClose').addEventListener('click', () => rackDlg.close());
rackDlg.addEventListener('click', (e) => { if (e.target === rackDlg) rackDlg.close(); });

// ── peekers: they duck when you reach for them, and give in on the fourth try ──
function peeker({ key, el, clip, spots, ducked, caught }) {
  const [cx0, , cw] = clip, W = 84;
  let dodges = 0, done = false, spot = -1, stay = 0, step = 0, back = 0;
  const ease = (ms, curve) => { el.style.setProperty('--dur', ms + 'ms'); el.style.setProperty('--ease', curve); };
  const SMOOTH = 'cubic-bezier(.3, .1, .3, 1)';
  const moveTo = (i) => { el.style.left = ((spots[i] - W / 2 - cx0) / cw) * 100 + '%'; spot = i; };
  const hide = (quick) => { ease(quick ? 190 : 1000, quick ? 'cubic-bezier(.6, 0, 1, .5)' : 'ease-in-out'); el.classList.remove('up', 'creep'); };
  const clearAll = () => { clearTimeout(stay); clearTimeout(step); clearTimeout(back); };
  const present = () => el.classList.contains('creep') || el.classList.contains('up');
  const creepIn = () => {
    if (done) return;
    let i; do { i = Math.floor(Math.random() * spots.length); } while (i === spot && spots.length > 1);
    moveTo(i);
    ease(1100, SMOOTH); el.classList.add('creep');                       // the eyes first
    step = setTimeout(() => { if (done || !el.classList.contains('creep')) return; ease(1500, SMOOTH); el.classList.add('up'); }, 1900);   // then the face
    stay = setTimeout(() => { hide(false); back = setTimeout(creepIn, rand(1800, 4200)); }, rand(7500, 11000));
  };
  const reach = () => {
    if (!present()) return;
    if (!done && dodges < 3) { dodges++; clearAll(); hide(true); sayTimed(ducked(dodges), 1900); back = setTimeout(creepIn, rand(1600, 2800)); return; }
    if (!done) { done = true; clearAll(); ease(500, 'ease-out'); el.classList.add('creep', 'up', 'caught'); sayTimed(caught, 4200); if (discover(key)) celebrateIfDone(); }
  };
  el.addEventListener('pointerenter', reach); el.addEventListener('pointerdown', reach); el.addEventListener('focus', reach);
  el.addEventListener('click', () => { if (done) sayTimed(caught, 3200); });
  back = setTimeout(creepIn, rand(2200, 4500));
}
peeker({ key: 'danial', el: $('danial'), clip: [1440, 200, 250, 152], spots: [1500, 1562, 1624],
  ducked: (n) => ['Someone just ducked behind the rack.', 'There he goes again.', 'He is definitely behind there.'][n - 1],
  caught: 'Danial: "It wasn\'t me." (It was, a little.)' });
peeker({ key: 'jesse', el: $('jesse'), clip: [264, 181, 307, 277], spots: [338, 500],
  ducked: (n) => ['Somebody was in the window. Gone.', 'A face. Outside. Ducked again.', 'He is out there, in the rain.'][n - 1],
  caught: 'Jesse, out in the rain. He seems fine.' });

// ── the drawer, zoomed in ──
const drawer = $('drawer'), dcap = $('drawerCaption'), DCAP = 'Click things. There is no wrong answer.';
const ITEMS = {
  itPi: 'A Raspberry Pi. It is running something. Nobody knows what.',
  itCable: "A rollover cable? You haven't used this in years, but what if?",
  itKeys: 'A keyring with too many keys. Nobody remembers what any of them open.',
  itCard: 'The server room access card. There is exactly one.',
  itUsb: 'You found this in the parking lot. You should probably plug it into the server.',
  itFloppy: 'A floppy disk: v2_FINAL_actual_no_really. Nobody owns a drive for it.',
  itBall: 'A stress ball. It has seen things.',
  itPizza: 'Emergency pizza, break glass if you skip lunch.',
  itLicense: 'An old license key, what if you need it?',
};
const plugBtn = $('plugBtn');
hover($('hsDrawer'), 'A drawer. Something rattles inside.');
$('hsDrawer').addEventListener('click', () => {
  drawer.showModal(); dcap.textContent = DCAP; plugBtn.hidden = true;
  if (discover('drawer')) celebrateIfDone();
});
// each item: hover/focus shows its caption, click wiggles it
const wireItems = (items, capEl, dflt) => Object.entries(items).forEach(([id, text]) => {
  const g = $(id);
  const show = () => { capEl.textContent = text; };
  const act = () => { show(); g.classList.remove('wiggle'); void g.getBoundingClientRect(); g.classList.add('wiggle'); };
  g.addEventListener('pointerenter', show); g.addEventListener('focus', show);
  g.addEventListener('pointerleave', () => { capEl.textContent = dflt; });
  g.addEventListener('blur', () => { capEl.textContent = dflt; });
  g.addEventListener('click', act);
  g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
});
wireItems(ITEMS, dcap, DCAP);
const usbG = $('itUsb');
usbG.addEventListener('click', () => { plugBtn.hidden = false; });
usbG.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') plugBtn.hidden = false; });
$('drawerClose').addEventListener('click', () => drawer.close());

// plug the stick into the server: it crashes (and if you had already fixed it, it is broken again)
const smoke = $('smoke');
let subTimer = 0;
plugBtn.addEventListener('click', () => {
  const wasFixed = solved;
  drawer.close();
  setTimeout(() => {
    solved = false; progress = 0; fails = 0; store.set('bu-rack', false);
    plateSolved.classList.remove('is-on');
    ledEls.forEach((l, i) => { l.classList.remove('wave'); l.style.animationDelay = ''; setLed(i, LED.bad, 7); l.classList.add('crash'); });
    smoke.classList.remove('go'); void smoke.getBoundingClientRect(); smoke.classList.add('go');
    const sub = $('scrSub'); clearTimeout(subTimer);
    sub.textContent = '!! unknown device';
    subTimer = setTimeout(() => { sub.textContent = '!! kernel panic'; subTimer = setTimeout(() => { sub.textContent = '503 · reconnecting'; }, 3400); }, 1300);
    eyeOverride = performance.now() + 2600;
    sayTimed(wasFixed ? 'It was fixed. It WAS fixed. Why would you plug that in?' : 'Somehow, it got worse.', 4800);
    setTimeout(() => { ledEls.forEach((l) => l.classList.remove('crash')); resetLeds(true); }, 2400);
    if (discover('usb')) celebrateIfDone();
  }, 450);
});
drawer.addEventListener('click', (e) => { if (e.target === drawer) drawer.close(); });

// ── the trash can: more rummaging ──
const trash = $('trash'), tcap = $('trashCaption'), TCAP = 'Rummage. Nobody is watching.';
wireItems({
  itDraft: 'A crumpled postmortem, draft 14. The root cause is blank. Optimistic.',
  itCan: 'An empty energy drink. VOLT: now with 40% more regret.',
  itCrust: 'A pizza crust. Even the emergency pizza has standards.',
  itDoNot: 'A "Do not press" note. Too late, Danial.',
  itMouse: 'A dead mouse. The computer kind. Rest well, little guy.',
  itSock: 'One sock. The other one is in the server room. Nobody asked how.',
}, tcap, TCAP);
hover($('hsTrash'), 'A trash can. Someone threw away something important, probably.');
$('hsTrash').addEventListener('click', () => {
  trash.showModal(); tcap.textContent = TCAP;
  if (discover('trash')) celebrateIfDone();
});
$('trashClose').addEventListener('click', () => trash.close());
trash.addEventListener('click', (e) => { if (e.target === trash) trash.close(); });

// ── the shelf, up close ──
const shelf = $('shelf'), scap = $('shelfCaption'), SCAP = 'Read the spines.';
const SHELF = {
  itBook1: '"MCSE for Dummies". It looks dusty.',
  itBook2: '"Network+". Looks handy.',
  itBook3: '"PowerShell in a Month of Lunches". Perfect for scripting.',
  itBook4: 'A black book with no title. The spine says: do not open.',
};
wireItems(SHELF, scap, SCAP);
const booksOpened = new Set();
Object.keys(SHELF).forEach((id) => {
  const g = $(id);
  const act = () => {
    if (id === 'itBook4') scap.textContent = 'You opened it. It is a coupon for a pizza place that closed in 2016.';
    booksOpened.add(id);
    if (booksOpened.size === Object.keys(SHELF).length && discover('books')) celebrateIfDone();
  };
  g.addEventListener('click', act);
  g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') act(); });
});
BOOKS.forEach(([id, title, desc]) => {
  hover($(id), `"${title}". ${desc}`);
  $(id).addEventListener('click', () => { shelf.showModal(); scap.textContent = SCAP; });
});
$('shelfClose').addEventListener('click', () => shelf.close());
shelf.addEventListener('click', (e) => { if (e.target === shelf) shelf.close(); });

// ── the OSI poster: numbered layers; the rack's units each live at one of them ──
const LAYERS = [
  [7, 'Application', 'HTTP, APIs, the app itself', 'Where users live, and complain. Last up: the load balancer, the front door.', '#A5DFDF', '#141121'],
  [6, 'Presentation', 'Encryption, encoding, TLS', 'Formats and secrets. By now it is the app server\'s turn.', '#78CFCF', '#141121'],
  [5, 'Session', 'Logins and conversations', 'Who is talking to whom, and for how long. Remembering that is the cache\'s whole job.', '#00BBB4', '#141121'],
  [4, 'Transport', 'TCP, UDP, load balancing', 'Reliable, or fast. Pick one. Either way, something has to keep the records: the database.', '#005655', '#fff'],
  [3, 'Network', 'IP addresses, routing', 'Getting from here to there. Then somewhere for it all to live: storage.', '#504384', '#fff'],
  [2, 'Data Link', 'Switches, MAC addresses', 'The local neighborhood. Once the power is on, the network comes up.', '#282242', '#fff'],
  [1, 'Physical', 'Cables, power, signals', 'Is it plugged in? Power distribution comes up first.', '#0f0d1c', '#fff'],
];
const poster = $('poster'), plist = $('posterList'), pfoot = $('posterFoot'), PFOOT = 'Click a layer.';
const addLayer = (n, name, desc, quip, bg, fg, extra = '') => {
  const li = document.createElement('li'), b = document.createElement('button');
  b.type = 'button'; if (extra) b.className = extra;
  b.innerHTML = '<span class="bu-osi-n"></span><b></b><span></span>';
  const [num, title, detail] = b.children;
  num.textContent = n; num.style.background = bg; num.style.color = fg; title.textContent = name; detail.textContent = desc;
  b.addEventListener('click', () => { pfoot.textContent = quip; });
  li.appendChild(b); plist.appendChild(li);
};
LAYERS.forEach(([n, name, desc, quip, bg, fg]) => addLayer(n, name, desc, quip, bg, fg));
addLayer('8', 'The user', 'Not on the poster, but you know.', 'Layer 8. Responsible for most incidents, including this one.', 'transparent', '#968EB5', 'bu-osi-user');
hover($('hsPoster'), 'An OSI model poster. Seven layers, stacked.');
$('hsPoster').addEventListener('click', () => {
  poster.showModal(); pfoot.textContent = PFOOT;
  if (discover('poster')) celebrateIfDone();
});
$('posterClose').addEventListener('click', () => poster.close());
poster.addEventListener('click', (e) => { if (e.target === poster) poster.close(); });

// ── the rubber duck: vaguely useful advice that fits any problem ──
const DUCK = [
  'Quack.', "It's always DNS.", 'Walk me through it from the very beginning.', 'What changed recently?',
  'I think you already know what is wrong.',
  'Have you checked the logs?', 'Is it plugged in? Metaphorically?', 'Read the error message out loud. Slowly.', 'Has it ever worked?',
  'Which environment is this, exactly?', 'Could it be permissions?',
  'Have you tried turning it off and on again?', 'It is probably a caching thing. It is usually a caching thing.',
  'Take a break. It will still be broken, but you will be calmer.',
];
let duckAsked = 0, duckTimer = 0;
const nextDuck = () => DUCK[duckAsked < DUCK.length ? duckAsked : 2 + ((duckAsked - DUCK.length) % (DUCK.length - 2))];   // in order, then round again (skipping the two openers)
const bubble = $('duckBubble'), duckArt = $('duckSvg');
hover($('hsDuck'), 'A rubber duck. Ask it anything.');
$('hsDuck').addEventListener('click', () => {
  bubble.textContent = nextDuck(); duckAsked++; bubble.classList.add('show');
  duckArt.classList.remove('hop'); void duckArt.getBoundingClientRect(); duckArt.classList.add('hop');
  clearTimeout(duckTimer); duckTimer = setTimeout(() => bubble.classList.remove('show'), 5200);
  if (discover('duck')) celebrateIfDone();
});

// ── the monitor: plays the video; the expand button enlarges it ──
const screenBtn = $('screen'), video = $('video'), theater = $('theater'), stage = $('theaterStage');
const VIDEO_SRC = 'assets/the-service-is-down.mp4';
hover(screenBtn, 'The monitor. Something is off about it.');
function setOn(on) { screenBtn.classList.toggle('is-on', on); scene.classList.toggle('is-playing', on); screenBtn.setAttribute('aria-pressed', String(on)); }
function loadVideo() { if (video.src) return; screenBtn.classList.add('is-loading'); video.src = VIDEO_SRC; video.load(); } // lazy: only fetched on the first click
async function playVideo() { loadVideo(); try { await video.play(); setOn(true); } catch { screenBtn.classList.remove('is-loading'); } }
screenBtn.addEventListener('click', () => { video.paused ? playVideo() : video.pause(); });
video.addEventListener('playing', () => { screenBtn.classList.remove('is-loading'); setOn(true); });
video.addEventListener('ended', () => { video.currentTime = 0; if (!theater.open) setOn(false); });
video.addEventListener('error', () => { screenBtn.classList.remove('is-loading'); setOn(false); });
function openTheater() { loadVideo(); stage.appendChild(video); video.controls = true; theater.showModal(); playVideo(); }
theater.addEventListener('close', () => {
  const wasPlaying = !video.paused; video.controls = false;
  screenBtn.insertBefore(video, screenBtn.querySelector('.bu-screen-hint'));
  setOn(wasPlaying || video.currentTime > 0); if (wasPlaying) video.play().catch(() => {});
});
$('expand').addEventListener('click', openTheater);
$('theaterClose').addEventListener('click', () => theater.close());
theater.addEventListener('click', (e) => { if (e.target === theater) theater.close(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !theater.open && !drawer.open && !trash.open && !shelf.open && !rackDlg.open && !poster.open && !video.paused) { video.pause(); video.currentTime = 0; setOn(false); } });

// ── Try Again (demo) ──
const sub = $('scrSub');
$('retry').addEventListener('click', () => {
  sub.textContent = '503 · checking…';
  setTimeout(() => { sub.textContent = '503 · still down'; setTimeout(() => { sub.textContent = '503 · reconnecting'; }, 1800); }, 1100);
});

// ── idle: if nobody touches anything for a while, Danial sneaks out ──
// (?idle=1500 in the address shortens the wait, for testing)
const IDLE_MS = +new URLSearchParams(location.search).get('idle') || 28000;
const walker = $('walker'), danialClip = $('danialClip');
let lastActive = Date.now(), lastWalk = 0, walking = false;
['pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'].forEach((ev) => addEventListener(ev, () => { lastActive = Date.now(); }, { passive: true }));
hover(walker, 'Danial: "I am not here."');
walker.addEventListener('click', () => {
  if (discover('danial')) celebrateIfDone();
  sayTimed('Danial: "Okay, fine. Five minutes."', 3000);
});
function sneak() {
  walking = true; lastWalk = Date.now();
  danialClip.style.visibility = 'hidden';
  walker.hidden = false;
  const K = (x, r, offset, extra = {}) => ({ transform: `translateX(${x}%) rotate(${r}deg)`, offset, easing: 'ease-in-out', ...extra });
  const anim = walker.animate([
    K(0, 0, 0, { opacity: 0 }), K(0, 0, 0.05, { opacity: 1 }), K(120, -4, 0.2), K(120, -9, 0.27), K(310, 3, 0.48), K(310, -10, 0.56),
    K(500, 3, 0.76), K(500, -6, 0.83), K(700, 8, 1),
  ], { duration: 12000, fill: 'forwards' });
  const t1 = setTimeout(() => sayTimed('Danial is sneaking out. Do not look.', 3000), 2600);
  const pauseOnPointer = () => { anim.pause(); setTimeout(() => anim.play(), 2200); };
  walker.addEventListener('click', pauseOnPointer);
  anim.onfinish = () => {
    walker.removeEventListener('click', pauseOnPointer); clearTimeout(t1);
    walker.hidden = true; anim.cancel(); danialClip.style.visibility = '';
    walking = false; lastActive = Date.now();
    sayTimed('Danial has left the building. Nobody saw anything.', 3200);
  };
}
setInterval(() => {
  const now = Date.now();
  if (walking || reduceMotion || document.hidden || !video.paused || document.querySelector('dialog[open]')) return;
  if (now - lastActive > IDLE_MS && now - lastWalk > IDLE_MS * 1.6) sneak();
}, 500);

// ── the code: up up down down left right left right B A (or tap Stewart seven times, for phones) ──
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
let kIdx = 0, tapN = 0, tapTimer = 0;
function konami() {
  scene.classList.remove('roll'); void scene.getBoundingClientRect();
  if (!reduceMotion) { scene.classList.add('roll'); setTimeout(() => scene.classList.remove('roll'), 1600); }
  sayTimed('+30 lives. Stewart is thrilled. (He is also dizzy.)', 4200);
  if (video.paused) setTimeout(playVideo, reduceMotion ? 300 : 1500);
  if (discover('konami')) celebrateIfDone();
}
document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  kIdx = k === KONAMI[kIdx] ? kIdx + 1 : (k === KONAMI[0] ? 1 : 0);
  if (kIdx === KONAMI.length) { kIdx = 0; konami(); }
});
$('hsStewart').addEventListener('click', () => {
  clearTimeout(tapTimer); tapTimer = setTimeout(() => { tapN = 0; }, 3500);
  if (++tapN >= 7) { tapN = 0; konami(); }
});

// ── a nudge, once ──
if (!store.get('bu-hinted', false)) setTimeout(() => { if (Date.now() > timedUntil && !caption.classList.contains('show')) { store.set('bu-hinted', true); sayTimed('Psst. Try clicking things.', 4200); } }, 7000);
