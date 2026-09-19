// ============================================================
//  ПОЛКОВНИК — game.js — ЧАСТЬ 1/4
// ============================================================

const SAVE_KEY = 'polkovnik_save_v5';
const SAVE_VERSION = 5;
const HEAL_PER_DAY = 15;
const HEAL_COST = 10000;
const MAX_REPRIMANDS = 3;
const OP_STEP_MS = 60000;
const EVENT_INTERVAL_MS = 300000;    // 5 минут
const CANDIDATE_INTERVAL_MS = 300000; // 10 минут (2 кандидата за раз)
const ADMIN_PASSWORD = '1212';

const State = {
  org: null, myRank: 'Полковник', myExp: 0, money: 100000, reputation: 50,
  day: 1, staff: [], groups: [], events: [], wanted: [], log: [],
  candidates: [], currentCandId: null, selectedStaff: [], selectedTeam: [],
  archive: [],
  nextStaffId: 1, nextGroupId: 1, nextEventId: 1, nextWantedId: 1,
  _eventTimer: null, _candTimer: null
};

const FIRST_NAMES_M = ['Александр','Дмитрий','Сергей','Андрей','Иван','Максим','Николай','Владимир','Егор','Артём','Кирилл','Роман','Павел','Денис','Антон','Виктор','Олег','Игорь','Юрий','Константин','Григорий','Тимур','Руслан','Валерий','Станислав','Борис','Геннадий','Аркадий','Леонид','Пётр','Василий','Степан','Фёдор','Матвей','Никита','Арсений'];
const FIRST_NAMES_F = ['Анна','Мария','Ольга','Екатерина','Татьяна','Светлана','Ирина','Наталья','Юлия','Виктория','Елена','Дарья','Алиса','Полина','Ксения'];
const LAST_NAMES = ['Иванов','Петров','Смирнов','Кузнецов','Соколов','Попов','Лебедев','Козлов','Новиков','Морозов','Волков','Соловьёв','Васильев','Зайцев','Павлов','Семёнов','Голубев','Виноградов','Богданов','Воробьёв','Фёдоров','Михайлов','Беляев','Тарасов','Белов','Комаров','Орлов','Киселёв','Макаров','Андреев','Ковалёв','Ильин','Гусев','Титов','Кузьмин'];
const CITIES = ['Москва','Санкт-Петербург','Казань','Новосибирск','Екатеринбург','Самара','Омск','Ростов-на-Дону','Уфа','Красноярск','Воронеж','Пермь','Волгоград','Краснодар','Саратов','Тюмень'];

const MISSIONS_FSB = ['Терроризм','Захват заложников','Шпионаж','Экстремистская ячейка','Госизмена','Кибератака','Контрабанда','Похищение дипломата','Взрыв','Захват автобуса'];
const MISSIONS_MVD = ['Угон','Кража','Разбойное нападение','Убийство','Наркоторговля','Мошенничество','Хулиганство','Массовая драка','Похищение','Поджог','Вооружённое ограбление','Стрельба'];

// Работа до поступления
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
          if (State.currentCandId === undefined) State.currentCandId = null;
          State._eventTimer = null;
          State._candTimer = null;

          document.getElementById('screen-org').classList.remove('active');
          document.getElementById('screen-org').style.display = 'none';
          document.getElementById('screen-office').classList.add('active');
          document.getElementById('screen-office').style.display = 'block';
          document.getElementById('org-name').textContent =
            State.org === 'FSB' ? '🔵 ФСБ России' : '🟢 МВД России';
          document.getElementById('my-rank').textContent = State.myRank;

          this.renderAll();
          this.startTimers();
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

    const orgScreen = document.getElementById('screen-org');
    const officeScreen = document.getElementById('screen-office');
    orgScreen.classList.remove('active');
    orgScreen.style.display = 'none';
    officeScreen.classList.add('active');
    officeScreen.style.display = 'block';
    window.scrollTo(0, 0);

    document.getElementById('org-name').textContent =
      org === 'FSB' ? '🔵 ФСБ России' : '🟢 МВД России';
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

    setTimeout(() => this.generateEvent(), 30000);
    setTimeout(() => { this.generateCandidate(); this.generateCandidate(); }, 15000);

    State._eventTimer = setInterval(() => this.generateEvent(), EVENT_INTERVAL_MS);
    State._candTimer = setInterval(() => {
      if (State.candidates.length < 6) {
        this.generateCandidate();
        this.generateCandidate();
      }
    }, CANDIDATE_INTERVAL_MS);
  },

  bindTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
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
    const served = chance(0.95); // почти все служили

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
      wounded: false, healDays: 0,
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
        <div class="doc-title">🎖️ Военбилет</div>
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
//  ПОЛКОВНИК — game.js — ЧАСТЬ 2/4
// ============================================================

Object.assign(Game, {

  findStaff(id) { return State.staff.find(s => s.id === id); },

  // Проверка: находится ли сотрудник в группе
  isInGroup(staffId) {
    return State.groups.some(g => g.members.includes(staffId));
  },

  // Получить ранг сотрудника по имени
  getRankIndex(rankName) {
    return RANKS[State.org].findIndex(r => r.name === rankName);
  },

  // Мой ранг (индекс)
  getMyRankIndex() {
    return this.getRankIndex(State.myRank);
  },

  renderStaff() {
    const list = document.getElementById('staff-list');
    if (!list) return;
    const active = State.staff.filter(s => !s.wounded);
    const counter = document.getElementById('staff-count');
    if (counter) counter.textContent = active.length;

    if (active.length === 0) {
      list.innerHTML = '<p class="placeholder">Активных сотрудников нет</p>';
      this.updateStats();
      this.renderHospital();
      return;
    }

    list.innerHTML = active.map(s => {
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
          <div class="staff-name">🏥 ${s.gender === 'М' ? '👨' : '👩'} ${s.name}</div>
          <div class="staff-rank">${s.rank}</div>
        </div>
        <div class="health-bar"><div style="width:${s.health}%"></div></div>
        <div class="staff-stats">
          <span>❤️ ${s.health}/100</span>
          <span>⏳ ${s.healDays} дн.</span>
        </div>
        <button class="btn-delo" onclick="Game.openDossier(${s.id})">📁 Личное дело</button>
      </div>`).join('');
  },

  openDossier(id) {
    const s = this.findStaff(id);
    if (!s) return;
    const rep = s.reprimands || 0;

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

  // ПОВЫШЕНИЕ С ОГРАНИЧЕНИЕМ "не выше меня"
  promote(id) {
    const s = this.findStaff(id);
    if (!s) return;
    const list = RANKS[State.org];
    const idx = list.findIndex(r => r.name === s.rank);
    if (idx < 0) return;

    const myIdx = this.getMyRankIndex();

    // Нельзя повысить до своего ранга или выше
    if (idx + 1 >= myIdx) {
      return this.toast(`Нельзя выше ${list[myIdx - 1].name} (ваше звание: ${State.myRank})`, 'danger');
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
    this.toast(`Выговор снят`, 'success');
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
    s.health = 100; s.healDays = 0; s.wounded = false;
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
    wounded.forEach(s => { s.health = 100; s.healDays = 0; s.wounded = false; });
    this.log(`💊 Вылечено ${wounded.length} чел.`, 'success');
    this.toast('Все вылечены', 'success');
    this.renderStaff();
    this.autoSave();
  },

  nextDay() {
    State.day++;
    State.staff.forEach(s => {
      if (s.wounded) {
        s.health = clamp(s.health + HEAL_PER_DAY, 0, 100);
        s.healDays = Math.max(0, s.healDays - 1);
        if (s.healDays === 0 || s.health >= 100) {
          s.health = 100; s.wounded = false; s.healDays = 0;
          this.log(`✅ ${s.name} вернулся с больничного`, 'success');
        }
      }
      s.fatigue = Math.max(0, s.fatigue - 20);
    });
    const totalSalary = State.staff.reduce((sum, s) => sum + s.salary, 0);
    State.money -= totalSalary;
    this.log(`📅 День ${State.day}. Зарплаты: -${formatMoney(totalSalary)}`, 'info');
    this.toast(`День ${State.day}`, 'info');
    this.renderStaff();
    this.autoSave();
  },

  // ПИКЕР — только СВОБОДНЫЕ сотрудники
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
        <label class="picker-item">
          <input type="checkbox" ${checked ? 'checked' : ''}
            onchange="Game.toggleStaffPick(${s.id}, this.checked)">
          <div class="pi-info">
            <div class="pi-name">${s.gender === 'М' ? '👨' : '👩'} ${s.name}</div>
            <div class="pi-rank">${s.rank} · свободен</div>
          </div>
        </label>`;
    }).join('');
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
    const available = State.staff.filter(s =>
      !s.wounded && !g.members.includes(s.id) && !this.isInGroup(s.id)
    );
    if (available.length === 0) return this.toast('Нет свободных сотрудников', 'warn');

    const overlay = document.createElement('div');
    overlay.className = 'dossier-overlay';
    overlay.id = 'add-group-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) Game.closeAddGroup(); };

    overlay.innerHTML = `
      <div class="dossier">
        <h2>➕ ДОБАВИТЬ В «${g.name}»</h2>
        <div style="max-height: 300px; overflow-y: auto;">
          ${available.map(s => `
            <label class="picker-item" style="margin-bottom:5px">
              <input type="checkbox" id="add-${s.id}">
              <div class="pi-info">
                <div class="pi-name">${s.gender === 'М' ? '👨' : '👩'} ${s.name}</div>
                <div class="pi-rank">${s.rank}</div>
              </div>
            </label>
          `).join('')}
        </div>
        <button class="d-close" onclick="Game.confirmAddToGroup(${g.id})">ДОБАВИТЬ</button>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  closeAddGroup() {
    const o = document.getElementById('add-group-overlay');
    if (o) o.remove();
  },

  confirmAddToGroup(groupId) {
    const g = State.groups.find(x => x.id === groupId);
    if (!g) return;
    const available = State.staff.filter(s =>
      !s.wounded && !g.members.includes(s.id) && !this.isInGroup(s.id)
    );
    let added = 0;
    available.forEach(s => {
      const cb = document.getElementById('add-' + s.id);
      if (cb && cb.checked) {
        g.members.push(s.id);
        added++;
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
//  ПОЛКОВНИК — game.js — ЧАСТЬ 3/4
// ============================================================

Object.assign(Game, {

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
      <div class="oi-row"><span>🎯 Режим:</span><b>${mode === 'self' ? 'Лично' : 'Группа'}</b></div>
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
              <div class="gp-item" onclick="Game.sendGroup(${e.id}, ${g.id})">
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
      btn.textContent = '🚗 Выехать';
      btn.onclick = () => this.goSelf(e.id);
      document.getElementById('op-log').appendChild(btn);
    }
    document.getElementById('operation-detail').scrollIntoView({ behavior: 'smooth' });
  },

  closeOperation() {
    document.getElementById('operation-detail').style.display = 'none';
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

  async sendGroup(eventId, groupId) {
    const e = State.events.find(x => x.id === eventId);
    const g = State.groups.find(x => x.id === groupId);
    if (!e || !g) return;

    const opLog = document.getElementById('op-log');
    opLog.innerHTML = '';

    const fighters = g.members.map(id => this.findStaff(id)).filter(s => s && !s.wounded);
    if (fighters.length === 0) return this.toast('Группа небоеспособна', 'danger');

    this.logOp(`🚔 Группа «${g.name}» выехала на задание`, 'system');
    await this.sleep(OP_STEP_MS);
    this.logOp(`📻 Связь: «Прибыли на место. Занимаем позиции»`, 'info');
    await this.sleep(OP_STEP_MS);
    this.logOp(`👁 Наблюдаем движение. Преступников: ${e.criminals}`, 'warn');
    await this.sleep(OP_STEP_MS);
    this.logOp(`🚧 Оцепление выставлено. Готовимся к штурму`, 'info');
    await this.sleep(OP_STEP_MS);
    this.logOp(`💥 Штурм начался!`, 'system');
    await this.sleep(OP_STEP_MS);
    this.logOp(`🔫 Перестрелка!`, 'bad');
    await this.sleep(2000);

    const avgBravery = fighters.reduce((a, s) => a + s.skills.bravery, 0) / fighters.length;
    const avgIntellect = fighters.reduce((a, s) => a + s.skills.intellect, 0) / fighters.length;
    const successChance = 0.5 + (avgBravery / 100) * 0.25 + (avgIntellect / 100) * 0.15;
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

    const shuffled = [...fighters].sort(() => Math.random() - 0.5);
    for (let i = 0; i < ourWounded && i < shuffled.length; i++) {
      const s = shuffled[i];
      s.health = rndInt(10, 45);
      s.wounded = true;
      s.healDays = rndInt(2, 5);
      s.fatigue += 25;
      this.logOp(`🏥 ${s.name} ранен, эвакуирован (${s.healDays} дн.)`, 'warn');
    }
    for (let i = 0; i < ourKilled && i + ourWounded < shuffled.length; i++) {
      const s = shuffled[ourWounded + i];
      this.logOp(`💀 ${s.name} погиб при исполнении`, 'bad');
      State.groups.forEach(gr => { gr.members = gr.members.filter(mid => mid !== s.id); });
      State.staff = State.staff.filter(x => x.id !== s.id);
    }

    this.logOp(`🛡 Зачистка завершена`, 'info');
    this.logOp(`📊 Потери противника: убито ${enemyKilled}, ранено ${enemyWounded}`, 'info');
    this.logOp(`📊 Наши потери: убито ${ourKilled}, ранено ${ourWounded}`,
      ourKilled > 0 ? 'bad' : 'info');

    if (success) {
      e.status = 'archived';
      State.money += 20000;
      State.reputation += 3;
      State.myExp += 50;
      fighters.forEach(s => { if (!s.wounded) { s.exp += 30; s.fatigue += 15; } });
      this.logOp(`✅ Операция завершена успешно → в архив`, 'good');
      this.logOp(`💰 +20 000₽ · ⭐ +3 репутации`, 'good');
      this.log(`✅ «${g.name}» — ${e.title}. Потери: ${ourKilled}/${ourWounded}`, 'success');
      this.toast('Успех! +20000₽', 'success');

      State.archive.push({
        title: e.title, addr: e.addr, day: State.day,
        group: g.name, success: true,
        ourKilled, ourWounded, enemyKilled, enemyWounded
      });
    } else {
      e.status = 'pending';
      State.reputation -= 5;
      State.myExp += 10;
      this.logOp(`❌ Операция провалена. Вызов остаётся!`, 'bad');
      this.logOp(`📉 -5 репутации. Можно отправить другую группу`, 'warn');
      this.log(`❌ Провал: ${e.title}. Потери: ${ourKilled}/${ourWounded}`, 'danger');
      this.toast('Провал! Событие осталось', 'danger');
    }

    this.showOpResult(e, { success, ourKilled, ourWounded, enemyKilled, enemyWounded });
    this.renderEvents();
    this.renderStaff();
    this.renderGroups();
    this.renderArchive();
    this.updateStats();
    this.autoSave();
  },

  async goSelf(eventId) {
    const e = State.events.find(x => x.id === eventId);
    if (!e) return;
    const opLog = document.getElementById('op-log');
    opLog.innerHTML = '';

    this.logOp(`🚗 Полковник выехал лично`, 'system');
    await this.sleep(OP_STEP_MS);
    this.logOp(`📻 «Прибыл на место. Оцениваю обстановку»`, 'info');
    await this.sleep(OP_STEP_MS);
    this.logOp(`👁 Преступников: ${e.criminals}`, 'warn');
    await this.sleep(OP_STEP_MS);
    this.logOp(`🔫 Вступаю в контакт!`, 'bad');
    await this.sleep(OP_STEP_MS);
    this.logOp(`💥 Бой!`, 'bad');
    await this.sleep(OP_STEP_MS);

    const success = chance(0.65);
    let ourKilled = 0, ourWounded = 0, enemyKilled = 0, enemyWounded = 0;

    if (success) {
      enemyKilled = rndInt(1, e.criminals);
      enemyWounded = e.criminals - enemyKilled;
      ourWounded = chance(0.3) ? 1 : 0;
      this.logOp(`✅ Преступники нейтрализованы`, 'good');
      this.logOp(`📊 Убито: ${enemyKilled}, ранено: ${enemyWounded}`, 'info');
      if (ourWounded) this.logOp(`🏥 Полковник ранен`, 'warn');

      e.status = 'archived';
      State.money += 15000;
      State.reputation += 5;
      State.myExp += 80;
      this.logOp(`💰 +15 000₽ · ⭐ +5 репутации → в архив`, 'good');
      this.log(`✅ Лично: ${e.title}`, 'success');
      this.toast('Личный успех! +15000₽', 'success');

      State.archive.push({
        title: e.title, addr: e.addr, day: State.day,
        group: 'Лично', success: true,
        ourKilled, ourWounded, enemyKilled, enemyWounded
      });
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
    }

    this.showOpResult(e, { success, ourKilled, ourWounded, enemyKilled, enemyWounded });
    this.renderEvents();
    this.renderStaff();
    this.renderGroups();
    this.renderArchive();
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
//  ПОЛКОВНИК — game.js — ЧАСТЬ 4/4
// ============================================================

Object.assign(Game, {

  // АДМИН-ПАНЕЛЬ
  openAdmin() {
    const overlay = document.createElement('div');
    overlay.className = 'admin-overlay';
    overlay.id = 'admin-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) Game.closeAdmin(); };

    overlay.innerHTML = `
      <div class="admin-panel">
        <h2>🟥 АДМИН ПАНЕЛЬ</h2>
        <p class="a-hint">Введите пароль для доступа:</p>
        <input type="password" id="admin-pass" placeholder="Пароль" maxlength="10">
        <div id="admin-content" style="display:none">
          <div class="a-row"><span>Режим:</span><b>Полный доступ</b></div>
          <p class="a-hint" style="margin-top:12px">Выдать сотрудника:</p>
          <input type="text" id="admin-name" placeholder="ФИО (оставь пустым = случайное)">
          <select id="admin-rank"></select>
          <button class="a-btn" onclick="Game.adminAddStaff()">➕ ВЫДАТЬ СОТРУДНИКА</button>
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
    // заполнить ранг-селект
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
      experience: { years: rndInt(3, 15), lastJob: rnd(PRIOR_JOBS), fired: false },
      skills: { loyalty: 90, corruption: 0, bravery: 80, intellect: 80, stamina: 80 },
      rank: rank,
      exp: 0, health: 100, fatigue: 0,
      salary: rndInt(30000, 60000),
      wounded: false, healDays: 0,
      reprimands: 0,
      hireDay: State.day
    };
    State.staff.push(s);
    this.log(`🟥 [АДМИН] Выдан сотрудник: ${s.name} (${s.rank})`, 'success');
    this.toast(`${s.name} выдан`, 'success');
    this.closeAdmin();
    this.renderStaff();
    this.autoSave();
  },

  closeAdmin() {
    const o = document.getElementById('admin-overlay');
    if (o) o.remove();
  },

  // РОЗЫСК
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
        <button class="btn small primary" onclick="Game.openWanted(${w.id})">🚔 Отправить на задержание</button>
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
    picker.innerHTML = available.map(s => {
      const checked = State.selectedTeam.includes(s.id);
      return `
        <label class="picker-item">
          <input type="checkbox" ${checked ? 'checked' : ''}
            onchange="Game.toggleTeamPick(${s.id}, this.checked)">
          <div class="pi-info">
            <div class="pi-name">${s.gender === 'М' ? '👨' : '👩'} ${s.name}</div>
            <div class="pi-rank">${s.rank} · ❤️ ${s.health}</div>
          </div>
        </label>`;
    }).join('');
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
      <div class="oi-row"><span>🎯 Состав:</span><b>${fighters.map(s => s.name.split(' ')[0]).join(', ')}</b></div>
    `;
    document.getElementById('op-log').innerHTML = '';
    document.getElementById('op-result').style.display = 'none';

    this.logOp(`🚔 Отправлено ${fighters.length} чел. на задержание ${w.name}`, 'system');
    await this.sleep(OP_STEP_MS);
    this.logOp(`📻 «Прибыли по адресу. Ищем объект»`, 'info');
    await this.sleep(OP_STEP_MS);
    this.logOp(`👁 Объект обнаружен, начинаем преследование`, 'warn');
    await this.sleep(OP_STEP_MS);
    this.logOp(`🏃 Погоня!`, 'bad');
    await this.sleep(OP_STEP_MS);
    this.logOp(`🤝 Задерживаем!`, 'bad');
    await this.sleep(OP_STEP_MS);

    const avgBravery = fighters.reduce((a, s) => a + s.skills.bravery, 0) / fighters.length;
    const successChance = 0.55 + avgBravery / 400;
    const success = chance(successChance);

    let ourWounded = 0;

    if (success) {
      this.logOp(`✅ Объект задержан!`, 'good');
      ourWounded = chance(0.25) ? 1 : 0;
      if (ourWounded) {
        const s = fighters[rndInt(0, fighters.length - 1)];
        s.health = rndInt(30, 60);
        s.wounded = true;
        s.healDays = rndInt(1, 3);
        this.logOp(`🏥 ${s.name} получил травму (${s.healDays} дн.)`, 'warn');
      }
      this.logOp(`📊 Задержан: ${w.name}`, 'info');
      this.logOp(`💰 +30 000₽ · ⭐ +4 репутации`, 'good');

      State.wanted = State.wanted.filter(x => x.id !== w.id);
      State.money += 30000;
      State.reputation += 4;
      State.myExp += 40;
      this.log(`🚔 Задержан: ${w.name}`, 'success');
      this.toast(`${w.name} задержан`, 'success');

      State.archive.push({
        title: `Задержание: ${w.name}`, addr: w.crime, day: State.day,
        group: 'Группа ' + fighters.length + ' чел.', success: true,
        ourKilled: 0, ourWounded, enemyKilled: 0, enemyWounded: 1
      });

      this.showOpResult(tempEvent, {
        success: true, ourKilled: 0, ourWounded,
        enemyKilled: 0, enemyWounded: 1
      });
    } else {
      this.logOp(`❌ Объект скрылся!`, 'bad');
      this.log(`❌ ${w.name} скрылся`, 'danger');
      this.toast('Не удалось задержать', 'danger');

      this.showOpResult(tempEvent, {
        success: false, ourKilled: 0, ourWounded: 0,
        enemyKilled: 0, enemyWounded: 0
      });
    }

    State.selectedTeam = [];
    this.renderWanted();
    this.renderStaff();
    this.renderGroups();
    this.renderArchive();
    this.updateStats();
    this.autoSave();
  },

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
      const data = { version: SAVE_VERSION, state: {
        ...State,
        _eventTimer: null, _candTimer: null
      }, savedAt: new Date().toISOString() };
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
    this.renderWanted();
    this.renderArchive();
    this.renderLog();
    this.updateStats();
  }
});

window.addEventListener('DOMContentLoaded', () => Game.init());
