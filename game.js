// ============================================================
//  ПОЛКОВНИК — game.js — ЧАСТЬ 1/6
//  Ядро, состояние, кадры
// ============================================================

const SAVE_KEY = 'polkovnik_save_v7';
const SAVE_VERSION = 7;
const HEAL_PER_DAY = 15;
const HEAL_COST = 10000;
const MAX_REPRIMANDS = 3;
const OP_STEP_MS = 60000;
const EVENT_INTERVAL_MS = 300000;
const CANDIDATE_INTERVAL_MS = 300000;
const ADMIN_PASSWORD = '1212';
const AMMO_PER_OP = 30;

const State = {
  org: null, myRank: 'Полковник', myExp: 0, money: 100000, reputation: 50,
  day: 1, staff: [], groups: [], events: [], wanted: [], log: [],
  candidates: [], currentCandId: null, selectedStaff: [], selectedTeam: [],
  archive: [], inventory: {}, myTransport: [],
  smi: [], bribe: null,
  jail: [], currentJailId: null,
  activeOps: [],
  staffSearch: '',
  nextStaffId: 1, nextGroupId: 1, nextEventId: 1, nextWantedId: 1, nextJailId: 1,
  _eventTimer: null, _candTimer: null, _bribeTimer: null
};

const FIRST_NAMES_M = ['Александр','Дмитрий','Сергей','Андрей','Иван','Максим','Николай','Владимир','Егор','Артём','Кирилл','Роман','Павел','Денис','Антон','Виктор','Олег','Игорь','Юрий','Константин','Григорий','Тимур','Руслан','Валерий','Станислав','Борис','Геннадий','Аркадий','Леонид','Пётр','Василий','Степан','Фёдор','Матвей','Никита','Арсений'];
const FIRST_NAMES_F = ['Анна','Мария','Ольга','Екатерина','Татьяна','Светлана','Ирина','Наталья','Юлия','Виктория','Елена','Дарья','Алиса','Полина','Ксения'];
const LAST_NAMES = ['Иванов','Петров','Смирнов','Кузнецов','Соколов','Попов','Лебедев','Козлов','Новиков','Морозов','Волков','Соловьёв','Васильев','Зайцев','Павлов','Семёнов','Голубев','Виноградов','Богданов','Воробьёв','Фёдоров','Михайлов','Беляев','Тарасов','Белов','Комаров','Орлов','Киселёв','Макаров','Андреев','Ковалёв','Ильин','Гусев','Титов','Кузьмин'];
const CITIES = ['Москва','Санкт-Петербург','Казань','Новосибирск','Екатеринбург','Самара','Омск','Ростов-на-Дону','Уфа','Красноярск','Воронеж','Пермь','Волгоград','Краснодар','Саратов','Тюмень'];

const MISSIONS_FSB = ['Терроризм','Захват заложников','Шпионаж','Экстремистская ячейка','Госизмена','Кибератака','Контрабанда','Похищение дипломата','Взрыв','Захват автобуса'];
const MISSIONS_MVD = ['Угон','Кража','Разбойное нападение','Убийство','Наркоторговля','Мошенничество','Хулиганство','Массовая драка','Похищение','Поджог','Вооружённое ограбление','Стрельба'];

const PRIOR_JOBS = ['Армия', 'МВД'];
const HOTSPOT_LABELS = ['Чечня','Дагестан','Сирия','Афганистан','Таджикистан'];
const MED_ISSUES = ['Гипертония','Астма','Сахарный диабет','Проблемы со зрением','Плоскостопие','Сколиоз','Аллергия','Мигрень'];
const STREETS = ['ул. Ленина','пр. Мира','ул. Гагарина','ул. Советская','пр. Победы','ул. Кирова','ул. Пушкина','ул. Чехова','ул. Гоголя','ул. Тверская','ул. Арбат','пр. Ленинградский','ул. Садовая','ул. Лесная'];

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (p) => Math.random() < p;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function fullName(gender) {
  const fn = gender === 'М' ? rnd(FIRST_NAMES_M) : rnd(FIRST_NAMES_F);
  const ln = rnd(LAST_NAMES) + (gender === 'М' ? '' : 'а');
  return `${ln} ${fn}`;
}
function formatMoney(n) { return n.toLocaleString('ru-RU') + '₽'; }
function genPassportNumber() { return `${rndInt(10,99)} ${rndInt(10,99)} ${rndInt(100000,999999)}`; }
function genPhone() { return `+7 (9${rndInt(10,99)}) ${rndInt(100,999)}-${rndInt(10,99)}-${rndInt(10,99)}`; }

const Game = {

  init() {
    this.bindTabs();
    this.bindIconSelect();

    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.state && data.state.org) {
          Object.keys(State).forEach(k => { delete State[k]; });
          Object.assign(State, data.state);
          if (!State.candidates) State.candidates = [];
          if (!State.selectedStaff) State.selectedStaff = [];
          if (!State.selectedTeam) State.selectedTeam = [];
          if (!State.archive) State.archive = [];
          if (!State.inventory) State.inventory = {};
          if (!State.myTransport) State.myTransport = [];
          if (!State.smi) State.smi = [];
          if (!State.jail) State.jail = [];
          if (!State.activeOps) State.activeOps = [];
          if (State.currentCandId === undefined) State.currentCandId = null;
          if (State.currentJailId === undefined) State.currentJailId = null;
          if (!State.staffSearch) State.staffSearch = '';
          State._eventTimer = null;
          State._candTimer = null;
          State._bribeTimer = null;

          document.getElementById('screen-org').classList.remove('active');
          document.getElementById('screen-org').style.display = 'none';
          document.getElementById('screen-office').classList.add('active');
          document.getElementById('screen-office').style.display = 'block';
          document.getElementById('org-name').textContent =
            State.org === 'FSB' ? '🚨 ФСБ России' : '🚨 МВД России';
          document.getElementById('my-rank').textContent = State.myRank;

          this.renderAll();
          this.startTimers();
          this.resumeActiveOps();
          this.toast('💾 Прогресс восстановлен', 'success');
          return;
        }
      } catch (e) { console.warn('Ошибка автозагрузки:', e); }
    }
  },

  chooseOrg(org) {
    State.org = org;
    State.myRank = 'Полковник';
    State.myExp = org === 'FSB' ? 2000 : 6000;
    State.money = org === 'FSB' ? 80000 : 150000;
    State.reputation = org === 'FSB' ? 60 : 50;
    State.candidates = [];
    State.selectedStaff = [];
    State.selectedTeam = [];
    State.archive = [];
    State.inventory = { ammo: 100 };
    State.myTransport = ['uaz'];
    State.smi = [];
    State.jail = [];
    State.activeOps = [];
    State.staffSearch = '';

    const orgScreen = document.getElementById('screen-org');
    const officeScreen = document.getElementById('screen-office');
    orgScreen.classList.remove('active');
    orgScreen.style.display = 'none';
    officeScreen.classList.add('active');
    officeScreen.style.display = 'block';
    window.scrollTo(0, 0);

    document.getElementById('org-name').textContent =
      org === 'FSB' ? '🚨 ФСБ России' : '🚨 МВД России';
    document.getElementById('my-rank').textContent = State.myRank;

    this.log(`Вы возглавили ${org === 'FSB' ? 'ФСБ' : 'МВД'}`, 'success');
    this.renderAll();
    this.startTimers();
    this.toast('Добро пожаловать, Полковник!', 'success');
    this.autoSave();
  },

  startTimers() {
    if (State._eventTimer) clearInterval(State._eventTimer);
    if (State._candTimer) clearInterval(State._candTimer);
    if (State._bribeTimer) clearInterval(State._bribeTimer);

    setTimeout(() => this.generateEvent(), 30000);
    setTimeout(() => { this.generateCandidate(); this.generateCandidate(); }, 15000);

    State._eventTimer = setInterval(() => this.generateEvent(), EVENT_INTERVAL_MS);
    State._candTimer = setInterval(() => {
      if (State.candidates.length < 6) {
        this.generateCandidate();
        this.generateCandidate();
      }
    }, CANDIDATE_INTERVAL_MS);

    State._bribeTimer = setInterval(() => {
      if (chance(0.3) && !State.bribe && State.staff.length > 0) {
        this.generateBribe();
      }
    }, 180000);
  },

  bindTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        if (tab.dataset.tab === 'shop') this.renderShop();
        if (tab.dataset.tab === 'transport') this.renderTransport();
        if (tab.dataset.tab === 'smi') this.renderSMI();
        if (tab.dataset.tab === 'interrogation') this.renderJail();
      });
    });
  },

  bindIconSelect() {
    const sel = document.getElementById('group-icon');
    const urlInput = document.getElementById('group-icon-url');
    if (!sel || !urlInput) return;
    sel.addEventListener('change', () => {
      if (sel.value === '__custom') {
        urlInput.style.display = 'block';
      } else {
        urlInput.style.display = 'none';
        urlInput.value = '';
        const prev = document.getElementById('icon-preview');
        if (prev) prev.innerHTML = '';
      }
    });
  },

  previewIcon(url) {
    const p = document.getElementById('icon-preview');
    if (!p) return;
    if (!url) { p.innerHTML = ''; return; }
    p.innerHTML = `<img src="${url}" alt="icon"
      onerror="this.style.border='1px solid #f85149';this.style.opacity=.4">`;
  },

  generateCandidate() {
    if (!State.org) return;
    const gender = chance(0.9) ? 'М' : 'Ж';
    const age = rndInt(21, 45);
    const hasCriminal = chance(0.15);
    const hasHealth = chance(0.2);

    const cand = {
      id: State.nextStaffId++,
      gender, name: fullName(gender), age,
      phone: genPhone(),
      passport: { number: genPassportNumber(), city: rnd(CITIES), criminal: hasCriminal, debts: chance(0.25) },
      medical: { healthy: !hasHealth, issue: hasHealth ? rnd(MED_ISSUES) : 'Здоров', psych: rndInt(60, 100) },
      military: { served: true, category: rnd(['А','Б','В']), hotSpots: chance(0.3), hotspot: rnd(HOTSPOT_LABELS) },
      experience: { years: rndInt(3, 20), lastJob: rnd(PRIOR_JOBS), fired: chance(0.15) },
      skills: { loyalty: rndInt(40,95), corruption: rndInt(0,40), bravery: rndInt(30,95), intellect: rndInt(40,95), stamina: rndInt(50,95) },
      rank: State.org === 'FSB' ? 'Прапорщик' : 'Рядовой',
      exp: 0, health: 100, fatigue: 0,
      salary: rndInt(30000, 60000),
      wounded: false, healDays: 0, dying: false,
      reprimands: 0,
      hireDay: State.day
    };

    State.candidates.push(cand);
    this.log(`📞 Пришёл кандидат: ${cand.name} (${cand.experience.lastJob})`, 'info');
    this.toast(`Кандидат: ${cand.name}`, 'info');
    this.renderCandidates();
    this.autoSave();
  },

  renderCandidates() {
    const list = document.getElementById('candidates-list');
    const counter = document.getElementById('candidates-count');
    if (!list) return;
    if (counter) counter.textContent = State.candidates.length;

    if (State.candidates.length === 0) {
      list.innerHTML = '<p class="placeholder">Кандидаты приходят сами, ожидайте...</p>';
      return;
    }
    list.innerHTML = State.candidates.map(c => `
      <div class="cand-item" onclick="Game.openCandidate(${c.id})">
        <div class="ci-avatar">${c.gender === 'М' ? '👨' : '👩'}</div>
        <div class="ci-info">
          <div class="ci-name">${c.name}</div>
          <div class="ci-sub">${c.age} лет · ${c.experience.lastJob}</div>
        </div>
        <div class="ci-badge">${c.rank}</div>
      </div>
    `).join('');
  },

  openCandidate(id) {
    const c = State.candidates.find(x => x.id === id);
    if (!c) return;
    State.currentCandId = id;
    document.getElementById('candidates-panel').style.display = 'none';
    document.getElementById('candidate-detail').style.display = 'block';
    document.getElementById('cand-photo').textContent = c.gender === 'М' ? '👨' : '👩';
    document.getElementById('cand-name').textContent = c.name;
    document.getElementById('cand-sub').textContent = `${c.age} лет · ${c.experience.lastJob} · ${c.phone}`;
    document.getElementById('cand-detail-title').textContent = `Кандидат: ${c.name}`;
    document.getElementById('doc-view').innerHTML = '<p class="placeholder">Выберите документ</p>';
  },

  closeCandidate() {
    State.currentCandId = null;
    document.getElementById('candidates-panel').style.display = 'block';
    document.getElementById('candidate-detail').style.display = 'none';
  },

  showDoc(type) {
    const c = State.candidates.find(x => x.id === State.currentCandId);
    if (!c) return;
    const v = document.getElementById('doc-view');
    if (type === 'passport') {
      v.innerHTML = `
        <div class="doc-title">📕 Паспорт РФ</div>
        <div class="doc-row"><span>ФИО:</span><b>${c.name}</b></div>
        <div class="doc-row"><span>Пол:</span><b>${c.gender === 'М' ? 'Мужской' : 'Женский'}</b></div>
        <div class="doc-row"><span>Возраст:</span><b>${c.age}</b></div>
        <div class="doc-row"><span>Серия/номер:</span><b>${c.passport.number}</b></div>
        <div class="doc-row"><span>Город:</span><b>${c.passport.city}</b></div>
        <div class="doc-row"><span>Судимости:</span><b class="${c.passport.criminal ? 'doc-bad' : 'doc-good'}">${c.passport.criminal ? '⚠ ЕСТЬ' : 'Нет'}</b></div>
        <div class="doc-row"><span>Долги:</span><b class="${c.passport.debts ? 'doc-warn' : 'doc-good'}">${c.passport.debts ? '⚠ Есть' : 'Нет'}</b></div>`;
    } else if (type === 'medical') {
      v.innerHTML = `
        <div class="doc-title">🩺 Медкарта</div>
        <div class="doc-row"><span>Состояние:</span><b class="${c.medical.healthy ? 'doc-good' : 'doc-bad'}">${c.medical.healthy ? 'Здоров' : c.medical.issue}</b></div>
        <div class="doc-row"><span>Психика:</span><b class="${c.medical.psych > 80 ? 'doc-good' : c.medical.psych > 60 ? 'doc-warn' : 'doc-bad'}">${c.medical.psych}/100</b></div>
        <div class="doc-row"><span>Допуск:</span><b class="${c.medical.healthy ? 'doc-good' : 'doc-bad'}">${c.medical.healthy ? 'Разрешён' : 'Ограничен'}</b></div>`;
    } else if (type === 'military') {
      v.innerHTML = `
        <div class="doc-title">🎖️ Военный билет</div>
        <div class="doc-row"><span>Служба:</span><b class="doc-good">Проходил</b></div>
        <div class="doc-row"><span>Категория:</span><b>${c.military.category}</b></div>
        <div class="doc-row"><span>Горячие точки:</span><b class="${c.military.hotSpots ? 'doc-warn' : ''}">${c.military.hotSpots ? 'Да (' + c.military.hotspot + ')' : 'Нет'}</b></div>`;
    } else if (type === 'experience') {
      v.innerHTML = `
        <div class="doc-title">📜 Стаж</div>
        <div class="doc-row"><span>Лет:</span><b>${c.experience.years}</b></div>
        <div class="doc-row"><span>Прошлое место:</span><b>${c.experience.lastJob}</b></div>
        <div class="doc-row"><span>Уволен по статье:</span><b class="${c.experience.fired ? 'doc-bad' : 'doc-good'}">${c.experience.fired ? 'Да' : 'Нет'}</b></div>`;
    }
  },

  hireCurrent() {
    const c = State.candidates.find(x => x.id === State.currentCandId);
    if (!c) return;
    if (c.reprimands === undefined) c.reprimands = 0;
    State.staff.push(c);
    State.candidates = State.candidates.filter(x => x.id !== c.id);
    this.log(`✅ Принят: ${c.name} (${c.rank})`, 'success');
    this.toast(`${c.name} зачислен`, 'success');
    this.closeCandidate();
    this.renderCandidates();
    this.renderStaff();
    this.renderStaffPicker();
    this.autoSave();
  },

  rejectCurrent() {
    const c = State.candidates.find(x => x.id === State.currentCandId);
    if (!c) return;
    State.candidates = State.candidates.filter(x => x.id !== c.id);
    this.log(`❌ Отказано: ${c.name}`, 'warn');
    this.toast(`${c.name} — отказано`, 'warn');
    this.closeCandidate();
    this.renderCandidates();
    this.autoSave();
  }
};
// ============================================================
//  ПОЛКОВНИК — game.js — ЧАСТЬ 2/6
//  Сотрудники, личное дело, больничный, группы
// ============================================================

Object.assign(Game, {

  findStaff(id) { return State.staff.find(s => s.id === id); },

  isInGroup(staffId) {
    return State.groups.some(g => g.members.includes(staffId));
  },

  getRankIndex(rankName) {
    return RANKS[State.org].findIndex(r => r.name === rankName);
  },

  getMyRankIndex() {
    return this.getRankIndex(State.myRank);
  },

  renderStaff() {
    const list = document.getElementById('staff-list');
    if (!list) return;
    const active = State.staff.filter(s => !s.wounded);
    const counter = document.getElementById('staff-count');
    if (counter) counter.textContent = active.length;

    const searchHTML = `<input type="text" class="staff-search" placeholder="🔍 Поиск по ФИО..."
      value="${State.staffSearch || ''}" oninput="Game.onStaffSearch(this.value)">`;

    if (active.length === 0) {
      list.innerHTML = searchHTML + '<p class="placeholder">Активных сотрудников нет</p>';
      this.updateStats();
      this.renderHospital();
      return;
    }

    const q = (State.staffSearch || '').toLowerCase().trim();
    const filtered = q ? active.filter(s => s.name.toLowerCase().includes(q)) : active;

    if (filtered.length === 0) {
      list.innerHTML = searchHTML + '<p class="placeholder">Никого не найдено</p>';
      this.updateStats();
      this.renderHospital();
      return;
    }

    list.innerHTML = searchHTML + filtered.map(s => {
      const rep = s.reprimands || 0;
      return `
      <div class="staff-card">
        <div class="staff-top">
          <div class="staff-name">${s.gender === 'М' ? '👨' : '👩'} ${s.name}${rep > 0 ? `<span class="reprimand-badge">${rep}/3</span>` : ''}</div>
          <div class="staff-rank">${s.rank}</div>
        </div>
        <div class="health-bar"><div style="width:${s.health}%"></div></div>
        <div class="staff-stats">
          <span>❤️ ${s.health}</span>
          <span>😩 ${s.fatigue}</span>
          <span>💼 ${formatMoney(s.salary)}</span>
        </div>
        <button class="btn-delo" onclick="Game.openDossier(${s.id})">📁 Личное дело</button>
      </div>
      `;
    }).join('');

    this.updateStats();
    this.renderHospital();
    this.renderStaffPicker();
  },

  onStaffSearch(value) {
    State.staffSearch = value;
    const list = document.getElementById('staff-list');
    if (!list) return;
    const active = State.staff.filter(s => !s.wounded);
    const q = (value || '').toLowerCase().trim();
    const filtered = q ? active.filter(s => s.name.toLowerCase().includes(q)) : active;

    const searchHTML = `<input type="text" class="staff-search" placeholder="🔍 Поиск по ФИО..."
      value="${value}" oninput="Game.onStaffSearch(this.value)">`;

    if (filtered.length === 0) {
      list.innerHTML = searchHTML + '<p class="placeholder">Никого не найдено</p>';
      return;
    }

    list.innerHTML = searchHTML + filtered.map(s => {
      const rep = s.reprimands || 0;
      return `
      <div class="staff-card">
        <div class="staff-top">
          <div class="staff-name">${s.gender === 'М' ? '👨' : '👩'} ${s.name}${rep > 0 ? `<span class="reprimand-badge">${rep}/3</span>` : ''}</div>
          <div class="staff-rank">${s.rank}</div>
        </div>
        <div class="health-bar"><div style="width:${s.health}%"></div></div>
        <div class="staff-stats">
          <span>❤️ ${s.health}</span>
          <span>😩 ${s.fatigue}</span>
          <span>💼 ${formatMoney(s.salary)}</span>
        </div>
        <button class="btn-delo" onclick="Game.openDossier(${s.id})">📁 Личное дело</button>
      </div>
      `;
    }).join('');

    const inp = list.querySelector('.staff-search');
    if (inp) {
      inp.focus();
      inp.setSelectionRange(value.length, value.length);
    }
  },

  renderHospital() {
    const wounded = State.staff.filter(s => s.wounded);
    const counter = document.getElementById('hospital-count');
    if (counter) counter.textContent = wounded.length;
    const list = document.getElementById('hospital-list');
    if (!list) return;
    if (wounded.length === 0) {
      list.innerHTML = '<p class="placeholder">Никто не ранен</p>';
      return;
    }
    list.innerHTML = wounded.map(s => `
      <div class="staff-card wounded">
        <div class="staff-top">
          <div class="staff-name">${s.dying ? '💀' : '🏥'} ${s.gender === 'М' ? '👨' : '👩'} ${s.name}</div>
          <div class="staff-rank">${s.rank}</div>
        </div>
        <div class="health-bar"><div style="width:${s.health}%"></div></div>
        <div class="staff-stats">
          <span>❤️ ${s.health}/100</span>
          <span>⏳ ${s.healDays} дн.</span>
          ${s.dying ? '<span style="color:#f85149">⚠ КРИТИЧНО</span>' : ''}
        </div>
        <button class="btn-delo" onclick="Game.openDossier(${s.id})">📁 Личное дело</button>
      </div>`).join('');
  },

  openDossier(id) {
    const s = this.findStaff(id);
    if (!s) return;
    const rep = s.reprimands || 0;
    const inGroup = State.groups.find(g => g.members.includes(s.id));

    const overlay = document.createElement('div');
    overlay.className = 'dossier-overlay';
    overlay.id = 'dossier-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) Game.closeDossier(); };

    overlay.innerHTML = `
      <div class="dossier">
        <h2>📁 ЛИЧНОЕ ДЕЛО</h2>
        <div class="d-row"><span>ФИО:</span><b>${s.name}</b></div>
        <div class="d-row"><span>Звание:</span><b>${s.rank}</b></div>
        <div class="d-row"><span>Возраст:</span><b>${s.age}</b></div>
        <div class="d-row"><span>Телефон:</span><b>${s.phone}</b></div>
        <div class="d-row"><span>Оклад:</span><b>${formatMoney(s.salary)}</b></div>
        <div class="d-row"><span>День найма:</span><b>${s.hireDay || '—'}</b></div>
        <div class="d-row"><span>Здоровье:</span><b>${s.health}/100</b></div>
        <div class="d-row"><span>Усталость:</span><b>${s.fatigue}</b></div>
        <div class="d-row"><span>Выговоры:</span><b>${rep} / 3</b></div>
        <div class="d-row"><span>Группа:</span><b>${inGroup ? inGroup.name : 'Не в группе'}</b></div>

        <div class="d-section">
          <div class="d-section-title">⚙ Действия</div>
          <div class="d-actions">
            <button onclick="Game.promote(${s.id})">⬆ Повысить</button>
            <button onclick="Game.demote(${s.id})">⬇ Понизить</button>
            <button onclick="Game.reprimand(${s.id})">⚠ Выговор</button>
            <button onclick="Game.clearReprimand(${s.id})">✖ Снять выговор</button>
            <button class="danger" onclick="Game.fire(${s.id})" style="grid-column: span 2">🚫 Уволить</button>
          </div>
        </div>

        <button class="d-close" onclick="Game.closeDossier()">ЗАКРЫТЬ</button>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  closeDossier() {
    const o = document.getElementById('dossier-overlay');
    if (o) o.remove();
  },

  promote(id) {
    const s = this.findStaff(id);
    if (!s) return;
    const list = RANKS[State.org];
    const idx = list.findIndex(r => r.name === s.rank);
    if (idx < 0) return;
    const myIdx = this.getMyRankIndex();
    if (idx + 1 >= myIdx) {
      return this.toast(`Нельзя выше ${list[myIdx - 1].name} (ваше: ${State.myRank})`, 'danger');
    }
    const old = s.rank;
    s.rank = list[idx + 1].name;
    this.log(`⬆ ${s.name}: ${old} → ${s.rank}`, 'success');
    this.toast(`${s.name} → ${s.rank}`, 'success');
    this.closeDossier();
    this.renderStaff();
    this.autoSave();
  },

  demote(id) {
    const s = this.findStaff(id);
    if (!s) return;
    const list = RANKS[State.org];
    const idx = list.findIndex(r => r.name === s.rank);
    if (idx <= 0) return this.toast(`${s.name} уже на минимуме`, 'warn');
    s.rank = list[idx - 1].name;
    s.skills.loyalty -= 15;
    this.log(`⬇ ${s.name} понижен до ${s.rank}`, 'warn');
    this.toast(`${s.name} понижен`, 'warn');
    this.closeDossier();
    this.renderStaff();
    this.autoSave();
  },

  reprimand(id) {
    const s = this.findStaff(id);
    if (!s) return;
    if (!s.reprimands) s.reprimands = 0;
    s.reprimands++;
    s.skills.loyalty -= 10;
    this.log(`⚠ ${s.name}: выговор (${s.reprimands}/3)`, 'warn');
    this.toast(`${s.name}: выговор ${s.reprimands}/3`, 'warn');
    this.closeDossier();
    if (s.reprimands >= MAX_REPRIMANDS) {
      this.log(`🚫 ${s.name} уволен за 3 выговора`, 'danger');
      this.toast(`${s.name} уволен (3 выговора)`, 'danger');
      State.groups.forEach(g => { g.members = g.members.filter(mid => mid !== id); });
      State.staff = State.staff.filter(x => x.id !== id);
      State.selectedStaff = State.selectedStaff.filter(sid => sid !== id);
      this.renderStaff();
      this.renderGroups();
      this.renderStaffPicker();
    } else {
      this.renderStaff();
    }
    this.autoSave();
  },

  clearReprimand(id) {
    const s = this.findStaff(id);
    if (!s) return;
    if (!s.reprimands || s.reprimands <= 0) return this.toast('Нет выговоров', 'warn');
    s.reprimands--;
    s.skills.loyalty += 5;
    this.log(`✖ ${s.name}: выговор снят (${s.reprimands}/3)`, 'success');
    this.toast('Выговор снят', 'success');
    this.closeDossier();
    this.renderStaff();
    this.autoSave();
  },

  fire(id) {
    const s = this.findStaff(id);
    if (!s) return;
    if (!confirm(`Уволить ${s.name}?`)) return;
    State.groups.forEach(g => { g.members = g.members.filter(mid => mid !== id); });
    State.staff = State.staff.filter(x => x.id !== id);
    State.selectedStaff = State.selectedStaff.filter(sid => sid !== id);
    this.log(`🚫 Уволен: ${s.name}`, 'danger');
    this.toast(`${s.name} уволен`, 'danger');
    this.closeDossier();
    this.renderStaff();
    this.renderGroups();
    this.autoSave();
  },

  healFast(id) {
    const s = this.findStaff(id);
    if (!s || !s.wounded) return;
    if (State.money < HEAL_COST) return this.toast('Недостаточно средств', 'danger');
    State.money -= HEAL_COST;
    s.health = 100; s.healDays = 0; s.wounded = false; s.dying = false;
    this.log(`💊 ${s.name} вылечен`, 'success');
    this.toast(`${s.name} восстановлен`, 'success');
    this.closeDossier();
    this.renderStaff();
    this.autoSave();
  },

  healAllFast() {
    const wounded = State.staff.filter(s => s.wounded);
    if (wounded.length === 0) return this.toast('Некого лечить', 'warn');
    const cost = wounded.length * HEAL_COST;
    if (State.money < cost) return this.toast(`Нужно ${formatMoney(cost)}`, 'danger');
    State.money -= cost;
    wounded.forEach(s => { s.health = 100; s.healDays = 0; s.wounded = false; s.dying = false; });
    this.log(`💊 Вылечено ${wounded.length} чел.`, 'success');
    this.toast('Все вылечены', 'success');
    this.renderStaff();
    this.autoSave();
  },

  nextDay() {
    State.day++;

    const toRemove = [];
    State.staff.forEach(s => {
      if (s.wounded) {
        s.health = clamp(s.health + HEAL_PER_DAY, 0, 100);
        s.healDays = Math.max(0, s.healDays - 1);

        if (s.health < 30) {
          s.dying = true;
          if (chance(0.25)) {
            toRemove.push(s);
            this.log(`💀 ${s.name} скончался от ран`, 'danger');
            this.toast(`💀 ${s.name} погиб`, 'danger');
            this.addSMI('negative', 'Гибель сотрудника',
              `${s.name} скончался от ран, полученных на задании.`,
              'Репутация -5');
            State.reputation -= 5;
            return;
          }
        } else {
          s.dying = false;
        }

        if (s.healDays === 0 || s.health >= 100) {
          s.health = 100; s.wounded = false; s.healDays = 0; s.dying = false;
          this.log(`✅ ${s.name} вернулся с больничного`, 'success');
        }
      }
      s.fatigue = Math.max(0, s.fatigue - 20);
    });

    toRemove.forEach(s => {
      State.groups.forEach(g => { g.members = g.members.filter(mid => mid !== s.id); });
      State.staff = State.staff.filter(x => x.id !== s.id);
    });

    const totalSalary = State.staff.reduce((sum, s) => sum + s.salary, 0);
    State.money -= totalSalary;
    this.log(`📅 День ${State.day}. Зарплаты: -${formatMoney(totalSalary)}`, 'info');
    this.toast(`День ${State.day}`, 'info');
    this.renderStaff();
    this.renderSMI();
    this.autoSave();
  },

  renderStaffPicker() {
    const picker = document.getElementById('group-staff-picker');
    if (!picker) return;
    const available = State.staff.filter(s => !s.wounded && !this.isInGroup(s.id));
    if (available.length === 0) {
      picker.innerHTML = '<p class="placeholder">Нет свободных сотрудников</p>';
      return;
    }
    picker.innerHTML = available.map(s => {
      const checked = State.selectedStaff.includes(s.id);
      return `
        <label class="picker-item" data-name="${s.name.toLowerCase()}">
          <input type="checkbox" ${checked ? 'checked' : ''}
            onchange="Game.toggleStaffPick(${s.id}, this.checked)">
          <div class="pi-info">
            <div class="pi-name">${s.gender === 'М' ? '👨' : '👩'} ${s.name}</div>
            <div class="pi-rank">${s.rank} · свободен</div>
          </div>
        </label>`;
    }).join('');
  },

  filterGroupPicker(q) {
    const picker = document.getElementById('group-staff-picker');
    if (!picker) return;
    const items = picker.querySelectorAll('.picker-item');
    const query = (q || '').toLowerCase().trim();
    items.forEach(item => {
      const name = item.getAttribute('data-name') || '';
      item.style.display = !query || name.includes(query) ? '' : 'none';
    });
  },

  toggleStaffPick(id, checked) {
    if (checked) {
      if (!State.selectedStaff.includes(id)) State.selectedStaff.push(id);
    } else {
      State.selectedStaff = State.selectedStaff.filter(sid => sid !== id);
    }
  },

  createGroup() {
    const name = document.getElementById('group-name').value.trim();
    const iconSel = document.getElementById('group-icon').value;
    const iconUrl = document.getElementById('group-icon-url').value.trim();
    let icon;
    if (iconSel === '__custom') {
      if (!iconUrl) return this.toast('Введите URL иконки', 'warn');
      icon = iconUrl;
    } else { icon = iconSel; }
    if (!name) return this.toast('Введите название', 'warn');
    if (State.selectedStaff.length < 1) return this.toast('Выберите хотя бы 1 сотрудника', 'warn');

    const g = {
      id: State.nextGroupId++, name, icon,
      members: [...State.selectedStaff],
      custom: iconSel === '__custom'
    };
    State.groups.push(g);
    this.log(`🎯 Создана группа «${name}» (${g.members.length})`, 'success');
    this.toast(`Группа «${name}» создана`, 'success');
    State.selectedStaff = [];
    document.getElementById('group-name').value = '';
    document.getElementById('group-icon-url').value = '';
    const prev = document.getElementById('icon-preview');
    if (prev) prev.innerHTML = '';
    this.renderGroups();
    this.renderStaffPicker();
    this.autoSave();
  },

  updateGroupsCount() {
    const c = document.getElementById('groups-count');
    if (c) c.textContent = State.groups.length;
  },

  renderGroups() {
    const el = document.getElementById('groups-list');
    if (!el) return;
    if (State.groups.length === 0) {
      el.innerHTML = '<p class="placeholder">Групп пока нет</p>';
      this.updateGroupsCount();
      return;
    }
    el.innerHTML = State.groups.map(g => {
      const members = g.members.map(id => this.findStaff(id)).filter(Boolean);
      const alive = members.filter(s => !s.wounded);
      const woundedCount = members.length - alive.length;
      const iconHtml = g.custom
        ? `<img src="${g.icon}" onerror="this.style.opacity=.3">`
        : g.icon;
      return `
        <div class="group-card ${woundedCount > 0 ? 'wounded' : ''}">
          <div class="g-name">${iconHtml} ${g.name}</div>
          <div class="g-info">👥 Готовы: ${alive.length} / ${members.length}</div>
          <div class="g-members">${members.map(s => `${s.wounded ? '🏥' : '•'} ${s.name}`).join('<br>')}</div>
          <div class="g-actions">
            <button class="btn small primary" onclick="Game.addToGroup(${g.id})">➕ Добавить</button>
            <button class="btn small danger" onclick="Game.deleteGroup(${g.id})">Расформировать</button>
          </div>
        </div>`;
    }).join('');
    this.updateGroupsCount();
  },

  addToGroup(groupId) {
    const g = State.groups.find(x => x.id === groupId);
    if (!g) return;
    const available = State.staff.filter(s => !s.wounded && !this.isInGroup(s.id));
    if (available.length === 0) return this.toast('Нет свободных сотрудников', 'warn');

    const overlay = document.createElement('div');
    overlay.className = 'dossier-overlay';
    overlay.id = 'add-group-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) Game.closeAddGroup(); };

    overlay.innerHTML = `
      <div class="dossier">
        <h2>➕ В ГРУППУ «${g.name}»</h2>
        <input type="text" id="add-search" placeholder="🔍 Поиск..."
          style="width:100%;padding:10px;background:#0d1117;border:1px solid #8b7548;border-radius:6px;font-size:13px;margin-bottom:10px;color:#2a1f0d"
          oninput="Game.filterAddList(this.value)">
        <div id="add-list" style="max-height:300px;overflow-y:auto;">
          ${available.map(s => `
            <label class="picker-item" style="margin-bottom:5px" data-name="${s.name.toLowerCase()}">
              <input type="checkbox" id="add-${s.id}">
              <div class="pi-info">
                <div class="pi-name">${s.gender === 'М' ? '👨' : '👩'} ${s.name}</div>
                <div class="pi-rank">${s.rank} · свободен</div>
              </div>
            </label>
          `).join('')}
        </div>
        <button class="d-close" onclick="Game.confirmAddToGroup(${g.id})">ДОБАВИТЬ</button>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  filterAddList(q) {
    const list = document.getElementById('add-list');
    if (!list) return;
    const items = list.querySelectorAll('.picker-item');
    const query = (q || '').toLowerCase().trim();
    items.forEach(item => {
      const name = item.getAttribute('data-name') || '';
      item.style.display = !query || name.includes(query) ? '' : 'none';
    });
  },

  closeAddGroup() {
    const o = document.getElementById('add-group-overlay');
    if (o) o.remove();
  },

  confirmAddToGroup(groupId) {
    const g = State.groups.find(x => x.id === groupId);
    if (!g) return;
    let added = 0;
    State.staff.forEach(s => {
      const cb = document.getElementById('add-' + s.id);
      if (cb && cb.checked && !cb.disabled) {
        if (!g.members.includes(s.id)) {
          g.members.push(s.id);
          added++;
        }
      }
    });
    this.closeAddGroup();
    if (added === 0) return this.toast('Никого не выбрано', 'warn');
    this.log(`➕ В группу «${g.name}» добавлено ${added} чел.`, 'success');
    this.toast(`+${added} в группу`, 'success');
    this.renderGroups();
    this.renderStaffPicker();
    this.autoSave();
  },

  deleteGroup(id) {
    State.groups = State.groups.filter(g => g.id !== id);
    this.renderGroups();
    this.renderStaffPicker();
    this.log('Группа расформирована', 'warn');
    this.autoSave();
  }
});
// ============================================================
//  ПОЛКОВНИК — game.js — ЧАСТЬ 3/6
//  Транспорт, магазин, СМИ, взятки, карточка организации
// ============================================================

const TRANSPORT_ITEMS = [
  { id: 'uaz',   icon: '🚙', name: 'УАЗ-469',      desc: 'Базовый вездеход',            speed: 1,   armor: 0,  price: 0,      passengers: 4 },
  { id: 'tigr',  icon: '🚐', name: 'Тигр',          desc: 'Бронированный внедорожник',   speed: 1.3, armor: 20, price: 250000, passengers: 6 },
  { id: 'kamaz', icon: '🚚', name: 'Камаз',         desc: 'Грузовик для большой группы', speed: 0.9, armor: 10, price: 180000, passengers: 12 },
  { id: 'btr',   icon: '🚜', name: 'БТР-80',        desc: 'Бронетранспортёр',            speed: 1.1, armor: 40, price: 500000, passengers: 8 },
  { id: 'heli',  icon: '🚁', name: 'Вертолёт Ми-8', desc: 'Быстрое прибытие',            speed: 2,   armor: 15, price: 900000, passengers: 6 }
];

const EQUIP_ITEMS = [
  { id: 'ammo',      icon: '📦', name: 'Патроны',     desc: 'Тратится на операцию', required: true,  amount: AMMO_PER_OP },
  { id: 'armor',     icon: '🛡️', name: 'Бронежилет',  desc: '−30% к ранению',        required: false, bonus: 0.15 },
  { id: 'helmet',    icon: '⛑️', name: 'Шлем',        desc: '−20% к ранению',        required: false, bonus: 0.1 },
  { id: 'grenade',   icon: '💣', name: 'Граната',     desc: '+5% к успеху',          required: false, bonus: 0.05 },
  { id: 'smoke',     icon: '💨', name: 'Дымовая',     desc: '+5% к успеху',          required: false, bonus: 0.05 },
  { id: 'flashbang', icon: '⚡', name: 'Светошумовая', desc: '+7% к успеху',          required: false, bonus: 0.07 },
  { id: 'medkit',    icon: '💊', name: 'Аптечка',     desc: 'Автолечение 1 бойца',   required: false, bonus: 0.1 },
  { id: 'drone',     icon: '🛸', name: 'Дрон',        desc: '+10% к успеху',         required: false, bonus: 0.1 }
];

const SHOP_ITEMS = [
  { id: 'pistol',    icon: '🔫', name: 'Пистолет ПМ',      desc: 'Стандартное оружие',     price: 15000 },
  { id: 'ak',        icon: '🔫', name: 'АК-74',            desc: 'Автомат',                price: 60000 },
  { id: 'sniper',    icon: '🎯', name: 'СВД',              desc: 'Снайперка',              price: 120000 },
  { id: 'ammo',      icon: '📦', name: 'Патроны (100 шт)', desc: 'Для операций',           price: 5000 },
  { id: 'grenade',   icon: '💣', name: 'Граната Ф-1',      desc: '+5% к успеху',           price: 8000 },
  { id: 'smoke',     icon: '💨', name: 'Дымовая шашка',    desc: '+5% к успеху',           price: 3000 },
  { id: 'armor',     icon: '🛡️', name: 'Бронежилет',       desc: '−30% к ранению',         price: 35000 },
  { id: 'helmet',    icon: '⛑️', name: 'Шлем «Альфа»',     desc: '−20% к ранению',         price: 25000 },
  { id: 'medkit',    icon: '💊', name: 'Аптечка',          desc: 'Автолечение 1 бойца',    price: 12000 },
  { id: 'drone',     icon: '🛸', name: 'Дрон-разведчик',   desc: '+10% к успеху',          price: 80000 },
  { id: 'flashbang', icon: '⚡', name: 'Светошумовая',      desc: '+7% к успеху',           price: 6000 },
  { id: 'vest',      icon: '🎽', name: 'Разгрузка',        desc: 'Больше боеприпасов',     price: 18000 }
];

Object.assign(Game, {

  // ============ ТРАНСПОРТ ============
  renderTransport() {
    const el = document.getElementById('transport-list');
    const moneyEl = document.getElementById('transport-money');
    if (!el) return;
    if (moneyEl) moneyEl.textContent = formatMoney(State.money);

    el.innerHTML = TRANSPORT_ITEMS.map(t => {
      const owned = State.myTransport.includes(t.id);
      const canBuy = State.money >= t.price;
      return `
        <div class="transport-card ${owned ? 'owned' : ''}">
          <div class="tc-icon">${t.icon}</div>
          <div class="tc-info">
            <div class="tc-name">${t.name}${owned ? ' ✅' : ''}</div>
            <div class="tc-desc">${t.desc}</div>
            <div class="tc-stats">⚡ ×${t.speed} · 🛡 ${t.armor} · 👥 ${t.passengers}</div>
            <div class="tc-price">${t.price === 0 ? 'Стартовый' : '💰 ' + formatMoney(t.price)}</div>
          </div>
          <button class="tc-buy ${owned ? 'owned' : (canBuy ? '' : 'disabled')}"
            onclick="Game.buyTransport('${t.id}')"
            ${owned || !canBuy ? 'disabled' : ''}>
            ${owned ? 'Куплен' : 'Купить'}
          </button>
        </div>
      `;
    }).join('');
    this.renderMyTransport();
  },

  renderMyTransport() {
    const el = document.getElementById('my-transport');
    if (!el) return;
    if (!State.myTransport || State.myTransport.length === 0) {
      el.innerHTML = '<p class="placeholder">Пусто</p>';
      return;
    }
    el.innerHTML = State.myTransport.map(id => {
      const t = TRANSPORT_ITEMS.find(x => x.id === id);
      if (!t) return '';
      return `
        <div class="inventory-item">
          <div class="inv-icon">${t.icon}</div>
          <div class="inv-name">${t.name}</div>
          <div class="inv-count">×1</div>
        </div>
      `;
    }).join('');
  },

  buyTransport(id) {
    const t = TRANSPORT_ITEMS.find(x => x.id === id);
    if (!t) return;
    if (State.myTransport.includes(id)) return this.toast('Уже куплен', 'warn');
    if (State.money < t.price) return this.toast('Недостаточно денег', 'danger');
    State.money -= t.price;
    State.myTransport.push(id);
    this.log(`🚗 Куплен транспорт: ${t.name}`, 'success');
    this.toast(`Куплен: ${t.name}`, 'success');
    this.renderTransport();
    this.updateStats();
    this.autoSave();
  },

  // ============ МАГАЗИН ============
  renderShop() {
    const el = document.getElementById('shop-list');
    const moneyEl = document.getElementById('shop-money');
    if (!el) return;
    if (moneyEl) moneyEl.textContent = formatMoney(State.money);

    el.innerHTML = SHOP_ITEMS.map(item => {
      const canBuy = State.money >= item.price;
      const count = (State.inventory && State.inventory[item.id]) || 0;
      return `
        <div class="shop-card">
          <div class="sc-icon">${item.icon}</div>
          <div class="sc-info">
            <div class="sc-name">${item.name}${count > 0 ? ` <span style="color:#58a6ff;font-size:11px">×${count}</span>` : ''}</div>
            <div class="sc-desc">${item.desc}</div>
            <div class="sc-price">💰 ${formatMoney(item.price)}</div>
          </div>
          <button class="sc-buy ${canBuy ? '' : 'disabled'}"
            onclick="Game.buyItem('${item.id}')" ${canBuy ? '' : 'disabled'}>
            Купить
          </button>
        </div>
      `;
    }).join('');
    this.renderInventory();
  },

  buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    if (State.money < item.price) return this.toast('Недостаточно денег', 'danger');
    State.money -= item.price;
    if (!State.inventory) State.inventory = {};
    State.inventory[itemId] = (State.inventory[itemId] || 0) + 1;
    this.log(`🛒 Куплено: ${item.name}`, 'success');
    this.toast(`Куплено: ${item.name}`, 'success');
    this.renderShop();
    this.updateStats();
    this.autoSave();
  },

  renderInventory() {
    const el = document.getElementById('inventory-list');
    if (!el) return;
    if (!State.inventory || Object.keys(State.inventory).length === 0) {
      el.innerHTML = '<p class="placeholder">Склад пуст</p>';
      return;
    }
    el.innerHTML = Object.entries(State.inventory).map(([id, count]) => {
      const item = SHOP_ITEMS.find(i => i.id === id);
      if (!item) return '';
      return `
        <div class="inventory-item">
          <div class="inv-icon">${item.icon}</div>
          <div class="inv-name">${item.name}</div>
          <div class="inv-count">×${count}</div>
        </div>
      `;
    }).join('');
  },

  // ============ СМИ ============
  addSMI(type, title, text, effect) {
    if (!State.smi) State.smi = [];
    State.smi.unshift({ id: Date.now(), type, title, text, effect, day: State.day });
    if (State.smi.length > 30) State.smi.pop();
  },

  renderSMI() {
    const el = document.getElementById('smi-list');
    if (!el) return;
    if (!State.smi || State.smi.length === 0) {
      el.innerHTML = '<p class="placeholder">Пока тихо... Пресса ещё не заметила вас</p>';
      return;
    }
    el.innerHTML = State.smi.map(s => `
      <div class="smi-card ${s.type}">
        <div class="smi-head">
          <span>📅 День ${s.day}</span>
          <span>${s.type === 'positive' ? '🟢 Позитив' : '🔴 Негатив'}</span>
        </div>
        <div class="smi-title">${s.title}</div>
        <div class="smi-text">${s.text}</div>
        <div class="smi-effect">${s.effect}</div>
      </div>
    `).join('');
  },

  // ============ ВЗЯТКИ ============
  generateBribe() {
    if (!State.org || State.bribe) return;
    const amount = rndInt(50, 200) * 1000;
    const crimes = ['Терроризм','Убийство','Наркоторговля','Похищение','Разбойное нападение','Контрабанда'];
    const crime = rnd(crimes);
    const suspect = fullName(chance(0.9) ? 'М' : 'Ж');

    State.bribe = { amount, crime, suspect };

    const overlay = document.createElement('div');
    overlay.className = 'bribe-overlay';
    overlay.id = 'bribe-overlay';
    overlay.innerHTML = `
      <div class="bribe-panel">
        <h2>💰 ПРЕДЛОЖЕНИЕ</h2>
        <div class="b-text">
          Поступило анонимное предложение.<br><br>
          <b>${suspect}</b> обвиняется по статье «${crime}».<br><br>
          За закрытие дела предлагают <b style="color:#ffdd99">${formatMoney(amount)}</b>.
        </div>
        <div class="b-actions">
          <button class="b-btn reject" onclick="Game.rejectBribe()">❌ Отказать</button>
          <button class="b-btn accept" onclick="Game.acceptBribe()">💰 Взять</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  acceptBribe() {
    if (!State.bribe) return;
    const amount = State.bribe.amount;
    State.money += amount;
    State.reputation -= 10;
    this.log(`💰 Взята взятка: +${formatMoney(amount)}`, 'warn');
    this.toast(`Взято ${formatMoney(amount)}`, 'warn');
    this.addSMI('negative', 'Слухи о коррупции',
      `Поговаривают, что полковник закрывает дела за деньги.`,
      'Репутация -10');

    if (chance(0.25)) {
      const fine = rndInt(100, 300) * 1000;
      State.money -= fine;
      State.reputation -= 15;
      this.log(`🕵️ ОСБ раскрыло взятку! Штраф: ${formatMoney(fine)}`, 'danger');
      this.toast(`ОСБ! Штраф ${formatMoney(fine)}`, 'danger');
      this.addSMI('negative', 'Скандал в ведомстве',
        `ОСБ выявило факт взяточничества. Штраф ${formatMoney(fine)}.`,
        'Репутация -15');
    }

    State.bribe = null;
    const o = document.getElementById('bribe-overlay');
    if (o) o.remove();
    this.updateStats();
    this.renderSMI();
    this.autoSave();
  },

  rejectBribe() {
    State.reputation += 3;
    this.log(`✅ Взятка отклонена. Репутация +3`, 'success');
    this.toast('Отказано', 'success');
    this.addSMI('positive', 'Принципиальный полковник',
      `Полковник отказался от взятки.`,
      'Репутация +3');
    State.bribe = null;
    const o = document.getElementById('bribe-overlay');
    if (o) o.remove();
    this.updateStats();
    this.renderSMI();
    this.autoSave();
  },

  // ============ КАРТОЧКА ОРГАНИЗАЦИИ ============
  showOrgInfo() {
    if (!State.org) return;
    const isFSB = State.org === 'FSB';
    const info = isFSB ? {
      name: '🚨 ФСБ России',
      full: 'Федеральная служба безопасности',
      founded: '3 апреля 1995',
      motto: 'Защита государственной безопасности',
      tasks: ['Контрразведка', 'Антитеррор', 'Борьба со шпионажем', 'Кибербезопасность', 'Защита VIP'],
      weapons: 'АК-74, СВД, ПМ, спецсредства',
      salary: 'Высокие оклады + премии',
      perks: ['Прослушка', 'Дроны', 'Доступ к секретам']
    } : {
      name: '🚨 МВД России',
      full: 'Министерство внутренних дел',
      founded: '8 сентября 1802',
      motto: 'Служим закону и народу',
      tasks: ['Розыск', 'Патрули', 'Борьба с преступностью', 'Облавы', 'Работа с населением'],
      weapons: 'ПМ, АК, СОБР-экипировка',
      salary: 'Средние оклады + надбавки',
      perks: ['Большой бюджет', 'ППС и СОБР', 'Массовые операции']
    };

    const overlay = document.createElement('div');
    overlay.className = 'org-info-overlay';
    overlay.id = 'org-info-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) Game.closeOrgInfo(); };

    overlay.innerHTML = `
      <div class="org-info-panel">
        <h2>${info.name}</h2>
        <div class="oi-row"><span>Полное название:</span><b>${info.full}</b></div>
        <div class="oi-row"><span>Основано:</span><b>${info.founded}</b></div>
        <div class="oi-row"><span>Девиз:</span><b>${info.motto}</b></div>
        <div class="oi-row"><span>Оружие:</span><b>${info.weapons}</b></div>
        <div class="oi-row"><span>Оклад:</span><b>${info.salary}</b></div>
        <div class="oi-row"><span>Ваше звание:</span><b>${State.myRank}</b></div>
        <div class="oi-row"><span>Личный состав:</span><b>${State.staff.length} чел.</b></div>
        <div class="oi-row"><span>Бюджет:</span><b>${formatMoney(State.money)}</b></div>
        <div class="oi-text">
          <b>Основные задачи:</b><br>
          ${info.tasks.map(t => '• ' + t).join('<br>')}
        </div>
        <div class="oi-text">
          <b>Преимущества:</b><br>
          ${info.perks.map(p => '✅ ' + p).join('<br>')}
        </div>
        <button class="oi-close" onclick="Game.closeOrgInfo()">ЗАКРЫТЬ</button>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  closeOrgInfo() {
    const o = document.getElementById('org-info-overlay');
    if (o) o.remove();
  }
});
// ============================================================
//  ПОЛКОВНИК — game.js — ЧАСТЬ 4/6
//  Операции с экипировкой, расход патронов, транспорт
// ============================================================

Object.assign(Game, {

  // ============ СОБЫТИЯ ============
  generateEvent() {
    if (!State.org) return;
    const active = State.events.filter(e => e.status === 'pending');
    if (active.length >= 4) return;

    const missions = State.org === 'FSB' ? MISSIONS_FSB : MISSIONS_MVD;
    const type = rnd(missions);
    const addr = `${rnd(STREETS)}, д. ${rndInt(1, 120)}`;
    const threat = chance(0.3) ? 'high' : chance(0.5) ? 'medium' : 'low';
    const e = {
      id: State.nextEventId++, title: type, addr, threat,
      status: 'pending', createdDay: State.day,
      criminals: rndInt(2, 8)
    };
    State.events.push(e);
    this.log(`🚨 ${type} — ${addr}`, 'danger');
    this.toast(`🚨 ${type}!`, 'danger');
    this.renderEvents();
    this.autoSave();
  },

  renderEvents() {
    const el = document.getElementById('events-list');
    if (!el) return;
    const active = State.events.filter(e => e.status === 'pending');
    if (active.length === 0) {
      el.innerHTML = '<p class="placeholder">Пока тихо...</p>';
      return;
    }
    el.innerHTML = active.map(e => {
      const threatLabel = { high: '🔴 Высокая', medium: '🟡 Средняя', low: '🟢 Низкая' }[e.threat];
      const cls = e.threat === 'high' ? '' : e.threat === 'medium' ? 'medium' : 'low';
      return `
        <div class="event-card ${cls}">
          <div class="e-title">${e.title}</div>
          <div class="e-addr">📍 ${e.addr} · ${threatLabel} · Преступников: ${e.criminals}</div>
          <div class="e-actions">
            <button class="btn small primary" onclick="Game.openOperation(${e.id}, 'group')">🎯 Группа</button>
            <button class="btn small" onclick="Game.openOperation(${e.id}, 'self')">🚗 Лично</button>
          </div>
        </div>`;
    }).join('');
  },

  openOperation(eventId, mode) {
    const e = State.events.find(x => x.id === eventId);
    if (!e || e.status !== 'pending') return;

    document.getElementById('operation-detail').style.display = 'block';
    document.getElementById('op-title').textContent = e.title;
    document.getElementById('op-info').innerHTML = `
      <div class="oi-row"><span>📍 Адрес:</span><b>${e.addr}</b></div>
      <div class="oi-row"><span>⚠️ Угроза:</span><b>${{high:'Высокая',medium:'Средняя',low:'Низкая'}[e.threat]}</b></div>
      <div class="oi-row"><span>🔫 Преступников:</span><b>${e.criminals}</b></div>
      <div class="oi-row"><span>📦 Патронов нужно:</span><b style="color:${((State.inventory&&State.inventory.ammo)||0) >= AMMO_PER_OP ? '#3fb950' : '#f85149'}">${AMMO_PER_OP} (на складе: ${(State.inventory&&State.inventory.ammo)||0})</b></div>
    `;
    document.getElementById('op-log').innerHTML = '';
    document.getElementById('op-result').style.display = 'none';

    if (mode === 'group') {
      const picker = document.createElement('div');
      picker.className = 'groups-picker';
      picker.style.marginTop = '10px';
      const available = State.groups.filter(g =>
        g.members.some(id => {
          const s = this.findStaff(id);
          return s && !s.wounded;
        })
      );
      if (available.length === 0) {
        picker.innerHTML = '<p class="placeholder">Нет боеспособных групп</p>';
      } else {
        picker.innerHTML = `<div style="color:#8b949e;font-size:12px;margin-bottom:6px">Выберите группу:</div>` +
          available.map(g => {
            const alive = g.members.filter(id => {
              const s = this.findStaff(id);
              return s && !s.wounded;
            });
            return `
              <div class="gp-item" onclick="Game.openEquipPicker(${e.id}, ${g.id})">
                <div class="gp-name">${g.custom ? `<img src="${g.icon}">` : g.icon} ${g.name}</div>
                <div class="gp-info">👥 Бойцов: ${alive.length}</div>
              </div>`;
          }).join('');
      }
      document.getElementById('op-log').appendChild(picker);
    } else {
      const btn = document.createElement('button');
      btn.className = 'btn primary';
      btn.style.marginTop = '10px';
      btn.style.width = '100%';
      btn.textContent = '🚗 Выехать лично';
      btn.onclick = () => this.openEquipPicker(e.id, null);
      document.getElementById('op-log').appendChild(btn);
    }
    document.getElementById('operation-detail').scrollIntoView({ behavior: 'smooth' });
  },

  closeOperation() {
    document.getElementById('operation-detail').style.display = 'none';
  },

  // ============ ВЫБОР ЭКИПИРОВКИ ============
  openEquipPicker(eventId, groupId) {
    const e = State.events.find(x => x.id === eventId);
    if (!e) return;
    State._equipOp = { eventId, groupId };

    const overlay = document.createElement('div');
    overlay.className = 'equip-overlay';
    overlay.id = 'equip-overlay';
    overlay.onclick = (ev) => { if (ev.target === overlay) Game.closeEquip(); };

    const haveAmmo = ((State.inventory && State.inventory.ammo) || 0) >= AMMO_PER_OP;

    overlay.innerHTML = `
      <div class="equip-panel">
        <h2>🎒 ЭКИПИРОВКА</h2>
        <div style="color:#8b949e;font-size:12px;margin-bottom:10px">
          Выберите, что взять на операцию. Патроны обязательны (${AMMO_PER_OP} шт).
        </div>

        ${EQUIP_ITEMS.map(item => {
          const count = (State.inventory && State.inventory[item.id]) || 0;
          const disabled = count <= 0;
          const checked = item.required && haveAmmo ? 'checked' : '';
          return `
            <label class="eq-item" style="${disabled ? 'opacity:.4' : ''}">
              <input type="checkbox" id="eq-${item.id}"
                ${checked} ${disabled || item.required ? 'disabled' : ''}
                ${item.required ? '' : 'checked'}>
              <div class="eq-icon">${item.icon}</div>
              <div class="eq-info">
                <div class="eq-name">${item.name}${item.required ? ' <span style="color:#f85149">*</span>' : ''}</div>
                <div class="eq-count">${item.desc} · на складе: ${count}</div>
              </div>
            </label>
          `;
        }).join('')}

        <div style="color:#8b949e;font-size:12px;margin:12px 0 6px 0">🚗 Транспорт:</div>
        <select id="eq-transport" style="width:100%;padding:10px;background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;font-size:14px">
          ${State.myTransport.map(id => {
            const t = TRANSPORT_ITEMS.find(x => x.id === id);
            return t ? `<option value="${t.id}">${t.icon} ${t.name}</option>` : '';
          }).join('')}
        </select>

        <div class="eq-actions">
          <button class="eq-btn cancel" onclick="Game.closeEquip()">Отмена</button>
          <button class="eq-btn go" onclick="Game.confirmEquip()">
            ${haveAmmo ? '🚔 Отправить' : '❌ Нет патронов'}
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  closeEquip() {
    const o = document.getElementById('equip-overlay');
    if (o) o.remove();
    State._equipOp = null;
  },

  confirmEquip() {
    if (!State._equipOp) return;
    const { eventId, groupId } = State._equipOp;

    if (((State.inventory && State.inventory.ammo) || 0) < AMMO_PER_OP) {
      return this.toast('Недостаточно патронов! Купи в магазине', 'danger');
    }

    const usedEquip = {};
    let totalBonus = 0;
    EQUIP_ITEMS.forEach(item => {
      const cb = document.getElementById('eq-' + item.id);
      if (cb && cb.checked) {
        if (((State.inventory && State.inventory[item.id]) || 0) > 0 || item.required) {
          usedEquip[item.id] = true;
          if (item.bonus) totalBonus += item.bonus;
        }
      }
    });

    const transportId = document.getElementById('eq-transport').value;
    const transport = TRANSPORT_ITEMS.find(t => t.id === transportId);

    if (usedEquip.ammo) State.inventory.ammo -= AMMO_PER_OP;
    ['armor','helmet','grenade','smoke','flashbang','medkit','drone'].forEach(id => {
      if (usedEquip[id] && State.inventory[id]) {
        State.inventory[id] -= 1;
      }
    });

    this.closeEquip();

    if (groupId) {
      this.sendGroup(eventId, groupId, totalBonus, transport);
    } else {
      this.goSelf(eventId, totalBonus, transport);
    }
  },

  logOp(text, type = 'info') {
    const log = document.getElementById('op-log');
    if (!log) return;
    const time = new Date().toLocaleTimeString('ru-RU',
      { hour: '2-digit', minute: '2-digit' });
    const line = document.createElement('div');
    line.className = 'op-log-line ' + type;
    line.innerHTML = `<span class="log-time">[${time}]</span>${text}`;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  },

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },

  // ============ ОТПРАВКА ГРУППЫ ============
  async sendGroup(eventId, groupId, equipBonus = 0, transport = null) {
    const e = State.events.find(x => x.id === eventId);
    const g = State.groups.find(x => x.id === groupId);
    if (!e || !g) return;

    const opLog = document.getElementById('op-log');
    opLog.innerHTML = '';

    const fighters = g.members.map(id => this.findStaff(id)).filter(s => s && !s.wounded);
    if (fighters.length === 0) return this.toast('Группа небоеспособна', 'danger');

    const tName = transport ? `${transport.icon} ${transport.name}` : '🚙 УАЗ';
    const speedSteps = transport ? Math.max(1, Math.round(5 / transport.speed)) : 5;

    this.logOp(`🚔 Группа «${g.name}» выехала на ${tName}`, 'system');
    await this.sleep(OP_STEP_MS * (speedSteps / 5));
    this.logOp(`📻 Связь: «Прибыли на место. Занимаем позиции»`, 'info');
    await this.sleep(OP_STEP_MS);
    this.logOp(`👁 Наблюдаем движение. Преступников: ${e.criminals}`, 'warn');
    await this.sleep(OP_STEP_MS);
    if (equipBonus > 0) {
      this.logOp(`🎒 Использована экипировка (бонус +${Math.round(equipBonus * 100)}%)`, 'info');
    }
    this.logOp(`🚧 Оцепление выставлено. Готовимся к штурму`, 'info');
    await this.sleep(OP_STEP_MS);
    this.logOp(`💥 Штурм начался!`, 'system');
    await this.sleep(OP_STEP_MS);
    this.logOp(`🔫 Перестрелка!`, 'bad');
    await this.sleep(2000);

    const avgBravery = fighters.reduce((a, s) => a + s.skills.bravery, 0) / fighters.length;
    const avgIntellect = fighters.reduce((a, s) => a + s.skills.intellect, 0) / fighters.length;
    let successChance = 0.4 + (avgBravery / 100) * 0.2 + (avgIntellect / 100) * 0.15 + equipBonus;
    if (transport && transport.armor > 0) successChance += transport.armor / 200;
    successChance = Math.min(0.95, successChance);
    const success = chance(successChance);

    let ourKilled = 0, ourWounded = 0, enemyKilled = 0, enemyWounded = 0;

    if (success) {
      enemyKilled = rndInt(Math.ceil(e.criminals * 0.5), e.criminals);
      enemyWounded = e.criminals - enemyKilled;
      if (chance(0.4)) {
        ourKilled = chance(0.15) ? 1 : 0;
        ourWounded = rndInt(0, Math.max(0, Math.floor(fighters.length / 2)));
      } else {
        ourWounded = rndInt(0, 1);
      }
    } else {
      enemyKilled = rndInt(0, Math.floor(e.criminals / 2));
      enemyWounded = rndInt(0, e.criminals - enemyKilled);
      ourKilled = rndInt(0, Math.max(0, Math.floor(fighters.length / 3)));
      ourWounded = rndInt(1, Math.max(1, Math.floor(fighters.length / 2)));
    }

    if (transport && transport.armor > 0) {
      ourWounded = Math.max(0, ourWounded - Math.floor(transport.armor / 20));
    }

    const shuffled = [...fighters].sort(() => Math.random() - 0.5);
    for (let i = 0; i < ourWounded && i < shuffled.length; i++) {
      const s = shuffled[i];
      s.health = rndInt(10, 45);
      s.wounded = true;
      s.healDays = rndInt(2, 5);
      s.fatigue += 25;
      if (s.health < 30) s.dying = true;
      this.logOp(`🏥 ${s.name} ранен (${s.healDays} дн.)`, 'warn');
    }
    for (let i = 0; i < ourKilled && i + ourWounded < shuffled.length; i++) {
      const s = shuffled[ourWounded + i];
      this.logOp(`💀 ${s.name} погиб`, 'bad');
      State.groups.forEach(gr => { gr.members = gr.members.filter(mid => mid !== s.id); });
      State.staff = State.staff.filter(x => x.id !== s.id);
    }

    this.logOp(`🛡 Зачистка завершена`, 'info');
    this.logOp(`📊 Враг: убито ${enemyKilled}, ранено ${enemyWounded}`, 'info');
    this.logOp(`📊 Наши: убито ${ourKilled}, ранено ${ourWounded}`, ourKilled > 0 ? 'bad' : 'info');

    if (success) {
      e.status = 'archived';
      State.money += 20000;
      State.reputation += 3;
      State.myExp += 50;
      fighters.forEach(s => { if (!s.wounded) { s.exp += 30; s.fatigue += 15; } });
      this.logOp(`✅ Успех → в архив`, 'good');
      this.logOp(`💰 +20 000₽ · ⭐ +3`, 'good');
      this.log(`✅ «${g.name}» — ${e.title}`, 'success');
      this.toast('Успех! +20000₽', 'success');
      this.addSMI('positive', 'Успешная операция',
        `${g.name} ликвидировала «${e.title}» на ${e.addr}`,
        'Репутация +3');
      State.archive.push({ title: e.title, addr: e.addr, day: State.day, group: g.name, success: true, ourKilled, ourWounded, enemyKilled, enemyWounded });
    } else {
      e.status = 'pending';
      State.reputation -= 5;
      State.myExp += 10;
      this.logOp(`❌ Провал. Вызов остаётся!`, 'bad');
      this.log(`❌ Провал: ${e.title}`, 'danger');
      this.toast('Провал! Событие осталось', 'danger');
      this.addSMI('negative', 'Провал операции',
        `Группа «${g.name}» не справилась с задачей на ${e.addr}`,
        'Репутация -5');
    }

    this.showOpResult(e, { success, ourKilled, ourWounded, enemyKilled, enemyWounded });
    this.renderEvents();
    this.renderStaff();
    this.renderGroups();
    this.renderArchive();
    this.renderSMI();
    this.renderShop();
    this.updateStats();
    this.autoSave();
  },

  // ============ ЛИЧНЫЙ ВЫЕЗД ============
  async goSelf(eventId, equipBonus = 0, transport = null) {
    const e = State.events.find(x => x.id === eventId);
    if (!e) return;
    const opLog = document.getElementById('op-log');
    opLog.innerHTML = '';

    const tName = transport ? `${transport.icon} ${transport.name}` : '🚙 УАЗ';
    this.logOp(`🚗 Полковник выехал на ${tName}`, 'system');
    await this.sleep(OP_STEP_MS);
    this.logOp(`📻 «Прибыл. Оцениваю обстановку»`, 'info');
    await this.sleep(OP_STEP_MS);
    this.logOp(`👁 Преступников: ${e.criminals}`, 'warn');
    await this.sleep(OP_STEP_MS);
    this.logOp(`🔫 Вступаю в контакт!`, 'bad');
    await this.sleep(OP_STEP_MS);
    this.logOp(`💥 Бой!`, 'bad');
    await this.sleep(OP_STEP_MS);

    let successChance = 0.55 + equipBonus;
    if (transport && transport.armor > 0) successChance += transport.armor / 200;
    const success = chance(Math.min(0.95, successChance));
    let ourKilled = 0, ourWounded = 0, enemyKilled = 0, enemyWounded = 0;

    if (success) {
      enemyKilled = rndInt(1, e.criminals);
      enemyWounded = e.criminals - enemyKilled;
      ourWounded = chance(0.3) ? 1 : 0;
      this.logOp(`✅ Преступники нейтрализованы`, 'good');
      this.logOp(`📊 Убито: ${enemyKilled}, ранено: ${enemyWounded}`, 'info');
      e.status = 'archived';
      State.money += 15000;
      State.reputation += 5;
      State.myExp += 80;
      this.logOp(`💰 +15 000₽ · ⭐ +5 → в архив`, 'good');
      this.log(`✅ Лично: ${e.title}`, 'success');
      this.toast('Успех! +15000₽', 'success');
      this.addSMI('positive', 'Полковник лично провёл операцию',
        `Успех на ${e.addr}. Преступники обезврежены.`,
        'Репутация +5');
      State.archive.push({ title: e.title, addr: e.addr, day: State.day, group: 'Лично', success: true, ourKilled, ourWounded, enemyKilled, enemyWounded });
    } else {
      enemyKilled = rndInt(0, Math.floor(e.criminals / 2));
      enemyWounded = rndInt(0, e.criminals);
      ourWounded = 1;
      e.status = 'pending';
      State.reputation -= 8;
      State.myExp += 20;
      this.logOp(`❌ Провал. Вызов остаётся!`, 'bad');
      this.log(`❌ Провал лично: ${e.title}`, 'danger');
      this.toast('Провал! Событие осталось', 'danger');
      this.addSMI('negative', 'Полковник провалил операцию',
        `Неудача на ${e.addr}. Преступники скрылись.`,
        'Репутация -8');
    }

    this.showOpResult(e, { success, ourKilled, ourWounded, enemyKilled, enemyWounded });
    this.renderEvents();
    this.renderStaff();
    this.renderArchive();
    this.renderSMI();
    this.renderShop();
    this.updateStats();
    this.autoSave();
  },

  showOpResult(e, r) {
    const res = document.getElementById('op-result');
    res.style.display = 'block';
    res.className = 'op-result ' + (r.success ? 'win' : 'lose');
    res.innerHTML = `
      <div class="res-title ${r.success ? 'win' : 'lose'}">
        ${r.success ? '✅ Успех → архив' : '❌ Провал — вызов остаётся'}
      </div>
      <div class="res-row"><span>Объект:</span><b>${e.title}</b></div>
      <div class="res-row"><span>💀 Наши убиты:</span><b style="color:${r.ourKilled > 0 ? '#f85149' : '#3fb950'}">${r.ourKilled}</b></div>
      <div class="res-row"><span>🏥 Наши ранены:</span><b style="color:${r.ourWounded > 0 ? '#d29922' : '#3fb950'}">${r.ourWounded}</b></div>
      <div class="res-row"><span>💀 Убито преступников:</span><b>${r.enemyKilled}</b></div>
      <div class="res-row"><span>🏥 Задержано:</span><b>${r.enemyWounded}</b></div>
    `;
  },

  // ============ ВОССТАНОВЛЕНИЕ АКТИВНЫХ ОПЕРАЦИЙ ПОСЛЕ F5 ============
  resumeActiveOps() {
    // Упрощённое: если были активные операции, моментально завершаем
    if (!State.activeOps || State.activeOps.length === 0) return;
    State.activeOps.forEach(op => {
      const e = State.events.find(x => x.id === op.eventId);
      if (e && e.status === 'pending') {
        // 50/50 моментальный исход
        const success = chance(0.6);
        e.status = success ? 'archived' : 'pending';
        if (success) {
          State.money += 20000;
          State.reputation += 3;
          State.myExp += 50;
          this.log(`✅ Операция "${e.title}" завершена (после перезагрузки)`, 'success');
          this.addSMI('positive', 'Операция завершена',
            `Задание «${e.title}» выполнено.`,
            'Репутация +3');
        } else {
          State.reputation -= 5;
          this.log(`❌ Операция "${e.title}" провалена (после перезагрузки)`, 'danger');
        }
      }
    });
    State.activeOps = [];
    this.autoSave();
  },

  renderArchive() {
    const el = document.getElementById('archive-list');
    if (!el) return;
    if (!State.archive || State.archive.length === 0) {
      el.innerHTML = '<p class="placeholder">Пусто</p>';
      return;
    }
    el.innerHTML = [...State.archive].reverse().map(a => `
      <div class="archive-card">
        <div class="a-title">✅ ${a.title}</div>
        <div class="a-info">📍 ${a.addr} · 📅 День ${a.day}</div>
        <div class="a-info">🎯 ${a.group} · 💀 ${a.ourKilled}/${a.ourWounded} · враг ${a.enemyKilled}/${a.enemyWounded}</div>
      </div>
    `).join('');
  }
});
// ============================================================
//  ПОЛКОВНИК — game.js — ЧАСТЬ 5/6
//  Допросная, розыск, админка
// ============================================================

Object.assign(Game, {

  // ============ ДОПРОСНАЯ ============
  renderJail() {
    const el = document.getElementById('jail-list');
    const counter = document.getElementById('jail-count');
    const statJail = document.getElementById('stat-jail');
    if (counter) counter.textContent = (State.jail || []).length;
    if (statJail) statJail.textContent = (State.jail || []).length;
    if (!el) return;

    if (!State.jail || State.jail.length === 0) {
      el.innerHTML = '<p class="placeholder">Пусто. Задержи преступника, чтобы допросить</p>';
      return;
    }

    el.innerHTML = State.jail.map(j => `
      <div class="jail-card">
        <div class="j-name">🚔 ${j.name}</div>
        <div class="j-crime">${j.crime} · ${j.level} розыск</div>
        <div class="j-status">📅 Задержан в день ${j.day} · ❓ Вопросов: ${j.questions || 0}</div>
        <div class="j-actions">
          <button class="btn small primary" onclick="Game.openInterrogation(${j.id})">❓ Допрос</button>
        </div>
      </div>
    `).join('');
  },

  openInterrogation(jailId) {
    const j = State.jail.find(x => x.id === jailId);
    if (!j) return;
    State.currentJailId = jailId;

    document.getElementById('interrogation-detail').style.display = 'block';
    document.getElementById('int-title').textContent = `Допрос: ${j.name}`;
    document.getElementById('int-info').innerHTML = `
      <div class="oi-row"><span>👤 ФИО:</span><b>${j.name}</b></div>
      <div class="oi-row"><span>⚖️ Статья:</span><b>${j.crime}</b></div>
      <div class="oi-row"><span>🎯 Уровень:</span><b>${j.level}</b></div>
      <div class="oi-row"><span>❓ Задано вопросов:</span><b>${j.questions || 0}</b></div>
    `;
    document.getElementById('int-log').innerHTML = '';
    this.logInt(`👮 Полковник начал допрос ${j.name}`, 'system');
    this.renderInterrogationActions(j);
  },

  renderInterrogationActions(j) {
    const el = document.getElementById('int-actions');
    if (!el) return;
    const questions = [
      { id: 'where', text: '📍 Где твои подельники?' },
      { id: 'bomb', text: '💣 Где заложена бомба?' },
      { id: 'boss', text: '👤 Кто твой главарь?' },
      { id: 'plans', text: '📋 Планы группировки?' },
      { id: 'money', text: '💰 Откуда финансирование?' }
    ];

    el.innerHTML = questions.map(q => `
      <button class="btn small" style="margin:3px" onclick="Game.askQuestion('${q.id}')">
        ${q.text}
      </button>
    `).join('') + `
      <button class="btn small danger" style="margin:3px" onclick="Game.releaseJail()">
        🚪 Отпустить
      </button>
    `;
  },

  logInt(text, type = 'info') {
    const log = document.getElementById('int-log');
    if (!log) return;
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const line = document.createElement('div');
    line.className = 'op-log-line ' + type;
    line.innerHTML = `<span class="log-time">[${time}]</span>${text}`;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  },

  askQuestion(type) {
    const j = State.jail.find(x => x.id === State.currentJailId);
    if (!j) return;
    if (!j.questions) j.questions = 0;
    j.questions++;

    const baseChance = 0.7 - j.questions * 0.1;
    const willAnswer = chance(Math.max(0.2, baseChance));

    this.logInt(`❓ Вопрос задан`, 'info');

    if (!willAnswer) {
      this.logInt(`😠 ${j.name}: «Молчать буду. Ничего не скажу»`, 'bad');
      this.updateJailInfo(j);
      return;
    }

    if (type === 'where') {
      const addr = `${rnd(STREETS)}, д. ${rndInt(1, 120)}`;
      this.logInt(`✅ ${j.name}: «Подельники на ${addr}»`, 'good');
      this.logInt(`📍 Создан новый вызов на ${addr}`, 'system');
      State.events.push({
        id: State.nextEventId++,
        title: 'Банда подельников',
        addr: addr,
        threat: 'medium',
        status: 'pending',
        createdDay: State.day,
        criminals: rndInt(2, 5)
      });
      this.toast(`Новый адрес: ${addr}`, 'success');
      this.renderEvents();
    } else if (type === 'bomb') {
      if (chance(0.5)) {
        const addr = `${rnd(STREETS)}, д. ${rndInt(1, 120)}`;
        this.logInt(`💣 ${j.name}: «Бомба заложена на ${addr}»`, 'good');
        State.events.push({
          id: State.nextEventId++,
          title: 'Заложена бомба',
          addr: addr,
          threat: 'high',
          status: 'pending',
          createdDay: State.day,
          criminals: rndInt(1, 3)
        });
        this.toast(`Найдена бомба: ${addr}`, 'warn');
        this.renderEvents();
      } else {
        this.logInt(`🤷 ${j.name}: «Не знаю про бомбу»`, 'warn');
      }
    } else if (type === 'boss') {
      if (chance(0.4)) {
        const boss = fullName(chance(0.9) ? 'М' : 'Ж');
        this.logInt(`👤 ${j.name}: «Главарь — ${boss}»`, 'good');
        this.logInt(`🔍 ${boss} объявлен в розыск`, 'system');
        State.wanted.push({
          id: State.nextWantedId++,
          name: boss,
          crime: 'Организация преступной группы',
          level: 'Федеральный'
        });
        this.renderWanted();
        this.toast(`Главарь: ${boss}`, 'success');
      } else {
        this.logInt(`🤐 ${j.name}: «Про главаря ничего не скажу»`, 'warn');
      }
    } else if (type === 'plans') {
      const plans = [
        'Готовят серию ограблений банков',
        'Планируют взорвать мост',
        'Хотят похитить бизнесмена',
        'Готовят нападение на участок',
        'Организуют поставку оружия'
      ];
      this.logInt(`📋 ${j.name}: «${rnd(plans)}»`, 'info');
    } else if (type === 'money') {
      if (chance(0.6)) {
        const amount = rndInt(100, 500) * 1000;
        this.logInt(`💰 ${j.name}: «Деньги от анонима, ${formatMoney(amount)} в месяц»`, 'info');
      } else {
        this.logInt(`🤐 ${j.name}: «Откуда деньги — не твоё дело»`, 'warn');
      }
    }

    this.updateJailInfo(j);
    this.autoSave();
  },

  updateJailInfo(j) {
    const info = document.getElementById('int-info');
    if (!info) return;
    info.innerHTML = `
      <div class="oi-row"><span>👤 ФИО:</span><b>${j.name}</b></div>
      <div class="oi-row"><span>⚖️ Статья:</span><b>${j.crime}</b></div>
      <div class="oi-row"><span>🎯 Уровень:</span><b>${j.level}</b></div>
      <div class="oi-row"><span>❓ Задано вопросов:</span><b>${j.questions || 0}</b></div>
    `;
  },

  closeInterrogation() {
    document.getElementById('interrogation-detail').style.display = 'none';
    State.currentJailId = null;
  },

  releaseJail() {
    const j = State.jail.find(x => x.id === State.currentJailId);
    if (!j) return;
    if (!confirm(`Отпустить ${j.name}?`)) return;
    State.jail = State.jail.filter(x => x.id !== j.id);
    this.log(`🚪 Отпущен: ${j.name}`, 'warn');
    this.toast(`${j.name} отпущен`, 'warn');
    this.closeInterrogation();
    this.renderJail();
    this.autoSave();
  },

  // ============ РОЗЫСК ============
  addWanted() {
    const name = document.getElementById('wanted-name').value.trim();
    const crime = document.getElementById('wanted-crime').value.trim();
    const level = document.getElementById('wanted-level').value;
    if (!name || !crime) return this.toast('Заполните поля', 'warn');
    State.wanted.push({ id: State.nextWantedId++, name, crime, level });
    this.log(`🔍 В розыск (${level}): ${name}`, 'warn');
    this.toast(`${name} в розыске`, 'warn');
    document.getElementById('wanted-name').value = '';
    document.getElementById('wanted-crime').value = '';
    this.renderWanted();
    this.autoSave();
  },

  renderWanted() {
    const el = document.getElementById('wanted-list');
    if (!el) return;
    if (State.wanted.length === 0) {
      el.innerHTML = '<p class="placeholder">Пусто</p>';
      return;
    }
    el.innerHTML = State.wanted.map(w => `
      <div class="wanted-card">
        <div class="w-name">🔍 ${w.name}</div>
        <div class="w-crime">${w.crime}</div>
        <div class="w-level">${w.level} розыск</div>
        <button class="btn small primary" onclick="Game.openWanted(${w.id})">🚔 Отправить</button>
      </div>`).join('');
  },

  openWanted(id) {
    const w = State.wanted.find(x => x.id === id);
    if (!w) return;
    State._wanted = id;
    State.selectedTeam = [];

    document.getElementById('wanted-detail').style.display = 'block';
    document.getElementById('wanted-detail-title').textContent = `Задержание: ${w.name}`;
    document.getElementById('wanted-info').innerHTML = `
      <div class="oi-row"><span>ФИО:</span><b>${w.name}</b></div>
      <div class="oi-row"><span>Преступление:</span><b>${w.crime}</b></div>
      <div class="oi-row"><span>Уровень:</span><b>${w.level}</b></div>
    `;
    this.renderWantedStaffPicker();
    document.getElementById('wanted-detail').scrollIntoView({ behavior: 'smooth' });
  },

  renderWantedStaffPicker() {
    const picker = document.getElementById('wanted-staff-picker');
    if (!picker) return;
    const available = State.staff.filter(s => !s.wounded);
    if (available.length === 0) {
      picker.innerHTML = '<p class="placeholder">Нет доступных сотрудников</p>';
      return;
    }
    picker.innerHTML = `
      <input type="text" class="staff-search" placeholder="🔍 Поиск по ФИО..."
        oninput="Game.filterWantedStaff(this.value)">
      <div id="wanted-picker-list">
        ${available.map(s => {
          const checked = State.selectedTeam.includes(s.id);
          return `
            <label class="picker-item" data-name="${s.name.toLowerCase()}" style="margin-bottom:5px">
              <input type="checkbox" ${checked ? 'checked' : ''}
                onchange="Game.toggleTeamPick(${s.id}, this.checked)">
              <div class="pi-info">
                <div class="pi-name">${s.gender === 'М' ? '👨' : '👩'} ${s.name}</div>
                <div class="pi-rank">${s.rank} · ❤️ ${s.health}</div>
              </div>
            </label>`;
        }).join('')}
      </div>
    `;
  },

  filterWantedStaff(q) {
    const list = document.getElementById('wanted-picker-list');
    if (!list) return;
    const items = list.querySelectorAll('.picker-item');
    const query = (q || '').toLowerCase().trim();
    items.forEach(item => {
      const name = item.getAttribute('data-name') || '';
      item.style.display = !query || name.includes(query) ? '' : 'none';
    });
  },

  toggleTeamPick(id, checked) {
    if (checked) {
      if (!State.selectedTeam.includes(id)) State.selectedTeam.push(id);
    } else {
      State.selectedTeam = State.selectedTeam.filter(sid => sid !== id);
    }
  },

  closeWanted() {
    document.getElementById('wanted-detail').style.display = 'none';
    State._wanted = null;
    State.selectedTeam = [];
  },

  async sendWantedTeam() {
    const w = State.wanted.find(x => x.id === State._wanted);
    if (!w) return;
    if (State.selectedTeam.length === 0) return this.toast('Выберите хотя бы 1 сотрудника', 'warn');

    const fighters = State.selectedTeam.map(id => this.findStaff(id)).filter(s => s && !s.wounded);
    if (fighters.length === 0) return this.toast('Нет бойцов', 'danger');

    const tempEvent = {
      id: 0, title: `Задержание: ${w.name}`, addr: w.crime,
      threat: 'medium', criminals: 1, status: 'pending'
    };

    document.getElementById('wanted-detail').style.display = 'none';
    document.getElementById('operation-detail').style.display = 'block';
    document.getElementById('op-title').textContent = `Задержание: ${w.name}`;
    document.getElementById('op-info').innerHTML = `
      <div class="oi-row"><span>👤 Объект:</span><b>${w.name}</b></div>
      <div class="oi-row"><span>⚖️ Преступление:</span><b>${w.crime}</b></div>
      <div class="oi-row"><span>👥 Отправлено:</span><b>${fighters.length} чел.</b></div>
    `;
    document.getElementById('op-log').innerHTML = '';
    document.getElementById('op-result').style.display = 'none';

    this.logOp(`🚔 Отправлено ${fighters.length} чел.`, 'system');
    await this.sleep(OP_STEP_MS);
    this.logOp(`📻 «Прибыли по адресу»`, 'info');
    await this.sleep(OP_STEP_MS);
    this.logOp(`👁 Объект обнаружен, преследование`, 'warn');
    await this.sleep(OP_STEP_MS);
    this.logOp(`🏃 Погоня!`, 'bad');
    await this.sleep(OP_STEP_MS);
    this.logOp(`🤝 Задерживаем!`, 'bad');
    await this.sleep(OP_STEP_MS);

    const avgBravery = fighters.reduce((a, s) => a + s.skills.bravery, 0) / fighters.length;
    const success = chance(0.55 + avgBravery / 400);
    let ourWounded = 0;

    if (success) {
      this.logOp(`✅ Объект задержан!`, 'good');
      ourWounded = chance(0.25) ? 1 : 0;
      if (ourWounded) {
        const s = fighters[rndInt(0, fighters.length - 1)];
        s.health = rndInt(30, 60);
        s.wounded = true;
        s.healDays = rndInt(1, 3);
        this.logOp(`🏥 ${s.name} травмирован`, 'warn');
      }
      this.logOp(`💰 +30 000₽ · ⭐ +4`, 'good');

      State.wanted = State.wanted.filter(x => x.id !== w.id);
      State.money += 30000;
      State.reputation += 4;
      State.myExp += 40;
      this.log(`🚔 Задержан: ${w.name}`, 'success');
      this.toast(`${w.name} задержан`, 'success');

      // В допросную
      if (!State.jail) State.jail = [];
      State.jail.push({
        id: State.nextJailId++,
        name: w.name,
        crime: w.crime,
        level: w.level,
        day: State.day,
        questions: 0
      });
      this.log(`🚔 ${w.name} в допросной`, 'info');

      this.addSMI('positive', 'Задержание преступника',
        `${w.name}, обвиняемый по статье «${w.crime}», задержан.`,
        'Репутация +4');

      State.archive.push({
        title: `Задержание: ${w.name}`, addr: w.crime, day: State.day,
        group: 'Группа ' + fighters.length + ' чел.', success: true,
        ourKilled: 0, ourWounded, enemyKilled: 0, enemyWounded: 1
      });

      this.showOpResult(tempEvent, { success: true, ourKilled: 0, ourWounded, enemyKilled: 0, enemyWounded: 1 });
    } else {
      this.logOp(`❌ Объект скрылся!`, 'bad');
      this.log(`❌ ${w.name} скрылся`, 'danger');
      this.toast('Не удалось задержать', 'danger');
      this.addSMI('negative', 'Побег преступника',
        `${w.name} скрылся от задержания.`,
        'Репутация -3');
      State.reputation -= 3;
      this.showOpResult(tempEvent, { success: false, ourKilled: 0, ourWounded: 0, enemyKilled: 0, enemyWounded: 0 });
    }

    State.selectedTeam = [];
    this.renderWanted();
    this.renderJail();
    this.renderStaff();
    this.renderGroups();
    this.renderArchive();
    this.renderSMI();
    this.updateStats();
    this.autoSave();
  },

  // ============ АДМИНКА ============
  openAdmin() {
    const overlay = document.createElement('div');
    overlay.className = 'admin-overlay';
    overlay.id = 'admin-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) Game.closeAdmin(); };

    overlay.innerHTML = `
      <div class="admin-panel">
        <h2>🟥 АДМИН ПАНЕЛЬ</h2>
        <p class="a-hint">Введите пароль:</p>
        <input type="password" id="admin-pass" placeholder="Пароль" maxlength="10">
        <div id="admin-content" style="display:none">
          <div class="a-row"><span>Режим:</span><b>Полный доступ</b></div>
          <p class="a-hint" style="margin-top:12px">Выдать сотрудника:</p>
          <input type="text" id="admin-name" placeholder="ФИО (пусто = случайное)">
          <select id="admin-rank"></select>
          <button class="a-btn" onclick="Game.adminAddStaff()">➕ ВЫДАТЬ СОТРУДНИКА</button>
          <p class="a-hint" style="margin-top:12px">Выдать деньги:</p>
          <input type="number" id="admin-money" placeholder="Сумма" value="100000">
          <button class="a-btn" onclick="Game.adminAddMoney()">💰 ВЫДАТЬ ДЕНЬГИ</button>
        </div>
        <div id="admin-error" class="a-error" style="display:none"></div>
        <button class="a-btn" id="admin-login-btn" onclick="Game.adminLogin()">ВОЙТИ</button>
        <button class="a-close" onclick="Game.closeAdmin()">ЗАКРЫТЬ</button>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  adminLogin() {
    const pass = document.getElementById('admin-pass').value;
    const err = document.getElementById('admin-error');
    if (pass !== ADMIN_PASSWORD) {
      err.style.display = 'block';
      err.textContent = '❌ Неверный пароль';
      return;
    }
    err.style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
    document.getElementById('admin-login-btn').style.display = 'none';
    document.getElementById('admin-pass').style.display = 'none';
    const sel = document.getElementById('admin-rank');
    const myIdx = this.getMyRankIndex();
    sel.innerHTML = RANKS[State.org].slice(0, myIdx).map(r =>
      `<option value="${r.name}">${r.name}</option>`
    ).join('');
  },

  adminAddStaff() {
    const nameInp = document.getElementById('admin-name').value.trim();
    const rank = document.getElementById('admin-rank').value;
    if (!rank) return this.toast('Выберите звание', 'warn');
    const gender = chance(0.9) ? 'М' : 'Ж';
    const name = nameInp || fullName(gender);
    const age = rndInt(21, 45);
    const s = {
      id: State.nextStaffId++,
      gender, name, age,
      phone: genPhone(),
      passport: { number: genPassportNumber(), city: rnd(CITIES), criminal: false, debts: false },
      medical: { healthy: true, issue: 'Здоров', psych: rndInt(70, 100) },
      military: { served: true, category: 'А', hotSpots: false, hotspot: '—' },
      experience: { years: rndInt(3, 15), lastJob: 'Армия', fired: false },
      skills: { loyalty: 90, corruption: 0, bravery: 80, intellect: 80, stamina: 80 },
      rank: rank,
      exp: 0, health: 100, fatigue: 0,
      salary: rndInt(30000, 60000),
      wounded: false, healDays: 0, dying: false,
      reprimands: 0,
      hireDay: State.day
    };
    State.staff.push(s);
    this.log(`🟥 [АДМИН] Выдан: ${s.name} (${s.rank})`, 'success');
    this.toast(`${s.name} выдан`, 'success');
    this.closeAdmin();
    this.renderStaff();
    this.autoSave();
  },

  adminAddMoney() {
    const amount = parseInt(document.getElementById('admin-money').value) || 0;
    if (amount <= 0) return this.toast('Введите сумму', 'warn');
    State.money += amount;
    this.log(`🟥 [АДМИН] Выдано: ${formatMoney(amount)}`, 'success');
    this.toast(`+${formatMoney(amount)}`, 'success');
    this.closeAdmin();
    this.updateStats();
    this.autoSave();
  },

  closeAdmin() {
    const o = document.getElementById('admin-overlay');
    if (o) o.remove();
  }
});
// ============================================================
//  ПОЛКОВНИК — game.js — ЧАСТЬ 6/6
//  Журнал, статистика, сейвы, запуск
// ============================================================

Object.assign(Game, {

  log(text, type = 'info') {
    const time = new Date().toLocaleTimeString('ru-RU');
    State.log.unshift({ time, text, type });
    if (State.log.length > 100) State.log.pop();
    this.renderLog();
  },

  renderLog() {
    const el = document.getElementById('log-list');
    if (!el) return;
    el.innerHTML = State.log.map(l =>
      `<div class="log-item ${l.type}"><span class="log-time">[${l.time}]</span>${l.text}</div>`
    ).join('');
  },

  updateStats() {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('stat-money', formatMoney(State.money));
    set('stat-rep', State.reputation);
    set('stat-staff', State.staff.filter(s => !s.wounded).length);
    set('stat-hospital', State.staff.filter(s => s.wounded).length);
    set('stat-day', State.day);
    set('stat-jail', (State.jail || []).length);

    const r = getRankByExp(State.org, State.myExp);
    if (r && r.name !== State.myRank) {
      State.myRank = r.name;
      set('my-rank', r.name);
      this.log(`🎖️ Звание: ${r.name}`, 'success');
      this.toast(`🎖️ ${r.name}`, 'success');
    }
  },

  autoSave() {
    try {
      const data = {
        version: SAVE_VERSION,
        state: {
          ...State,
          _eventTimer: null,
          _candTimer: null,
          _bribeTimer: null,
          bribe: null
        },
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) { console.warn('Ошибка автосейва:', e); }
  },

  toast(msg, type = 'info') {
    let container = document.getElementById('toast');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast';
      document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  },

  renderAll() {
    this.renderCandidates();
    this.renderStaff();
    this.renderHospital();
    this.renderGroups();
    this.renderStaffPicker();
    this.renderEvents();
    this.renderShop();
    this.renderTransport();
    this.renderSMI();
    this.renderWanted();
    this.renderJail();
    this.renderArchive();
    this.renderLog();
    this.updateStats();
  }
});

window.addEventListener('DOMContentLoaded', () => Game.init());
