// ============================================================
//  ПОЛКОВНИК — game.js — Часть 1/4
//  Ядро, состояние, утилиты, инициализация, кадры
// ============================================================

// ============ КОНСТАНТЫ ============
const SAVE_KEY = 'polkovnik_save_v3';
const SAVE_VERSION = 3;
const HEAL_PER_DAY = 15;
const HEAL_COST = 10000;

// ============ СОСТОЯНИЕ ИГРЫ ============
const State = {
  org: null,
  myRank: 'Полковник',
  myExp: 0,
  money: 100000,
  reputation: 50,
  day: 1,
  staff: [],
  groups: [],
  events: [],
  wanted: [],
  log: [],
  candidates: [],
  currentCandId: null,
  selectedStaff: [],
  nextStaffId: 1,
  nextGroupId: 1,
  nextEventId: 1,
  nextWantedId: 1
};

// ============ ДАННЫЕ ДЛЯ ГЕНЕРАЦИИ ============
const FIRST_NAMES_M = [
  'Александр','Дмитрий','Сергей','Андрей','Иван','Максим','Николай',
  'Владимир','Егор','Артём','Кирилл','Роман','Павел','Денис','Антон',
  'Виктор','Олег','Игорь','Юрий','Константин','Григорий','Тимур',
  'Руслан','Валерий','Станислав','Борис','Геннадий','Аркадий','Леонид',
  'Пётр','Василий','Степан','Фёдор','Матвей','Никита','Арсений'
];

const FIRST_NAMES_F = [
  'Анна','Мария','Ольга','Екатерина','Татьяна','Светлана','Ирина',
  'Наталья','Юлия','Виктория','Елена','Дарья','Алиса','Полина','Ксения'
];

const LAST_NAMES = [
  'Иванов','Петров','Смирнов','Кузнецов','Соколов','Попов','Лебедев',
  'Козлов','Новиков','Морозов','Волков','Соловьёв','Васильев','Зайцев',
  'Павлов','Семёнов','Голубев','Виноградов','Богданов','Воробьёв',
  'Фёдоров','Михайлов','Беляев','Тарасов','Белов','Комаров','Орлов',
  'Киселёв','Макаров','Андреев','Ковалёв','Ильин','Гусев','Титов','Кузьмин'
];

const CITIES = [
  'Москва','Санкт-Петербург','Казань','Новосибирск','Екатеринбург',
  'Самара','Омск','Ростов-на-Дону','Уфа','Красноярск','Воронеж','Пермь',
  'Волгоград','Краснодар','Саратов','Тюмень'
];

const CRIMES = [
  'Терроризм','Захват заложников','Вооружённое ограбление','Убийство',
  'Угон','Наркоторговля','Мошенничество','Контрабанда','Похищение',
  'Разбойное нападение','Поджог','Взрыв','Стрельба в людном месте',
  'Захват автобуса'
];

const STREETS = [
  'ул. Ленина','пр. Мира','ул. Гагарина','ул. Советская','пр. Победы',
  'ул. Кирова','ул. Пушкина','ул. Чехова','ул. Гоголя','ул. Тверская',
  'ул. Арбат','пр. Ленинградский','ул. Садовая','ул. Лесная'
];

const JOBS = [
  'Охрана','МВД','Армия','ЧОП','Без опыта','Служба безопасности',
  'Водитель','Строитель','Студент','Курьер','Продавец','Инженер'
];

const MED_ISSUES = [
  'Гипертония','Астма','Сахарный диабет','Проблемы со зрением',
  'Плоскостопие','Сколиоз','Аллергия','Мигрень'
];

const HOTSPOT_LABELS = [
  'Чечня','Дагестан','Сирия','Афганистан','Таджикистан'
];

// ============ УТИЛИТЫ ============
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (p) => Math.random() < p;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function fullName(gender) {
  const fn = gender === 'М' ? rnd(FIRST_NAMES_M) : rnd(FIRST_NAMES_F);
  const ln = rnd(LAST_NAMES) + (gender === 'М' ? '' : 'а');
  return `${ln} ${fn}`;
}

function formatMoney(n) {
  return n.toLocaleString('ru-RU') + '₽';
}

function genPassportNumber() {
  return `${rndInt(10,99)} ${rndInt(10,99)} ${rndInt(100000,999999)}`;
}

function genPhone() {
  return `+7 (9${rndInt(10,99)}) ${rndInt(100,999)}-${rndInt(10,99)}-${rndInt(10,99)}`;
}

// ============ ГЛАВНЫЙ ОБЪЕКТ ============
const Game = {

  // ----------------------------------------
  //  ИНИЦИАЛИЗАЦИЯ
  // ----------------------------------------
  init() {
    this.bindTabs();
    this.bindIconSelect();
    if (localStorage.getItem(SAVE_KEY)) {
      document.getElementById('load-slot').style.display = 'block';
    }
    console.log('ПОЛКОВНИК: игра инициализирована');
  },

  chooseOrg(org) {
    State.org = org;
    State.myRank = 'Полковник';
    State.myExp = org === 'FSB' ? 2000 : 6000;
    State.money = org === 'FSB' ? 80000 : 150000;
    State.reputation = org === 'FSB' ? 60 : 50;
    State.candidates = [];
    State.selectedStaff = [];

    document.getElementById('screen-org').classList.remove('active');
    document.getElementById('screen-office').classList.add('active');
    document.getElementById('org-name').textContent =
      org === 'FSB' ? '🔵 ФСБ России' : '🟢 МВД России';
    document.getElementById('my-rank').textContent = State.myRank;

    this.log(`Вы возглавили ${org === 'FSB' ? 'ФСБ' : 'МВД'}`, 'success');
    this.renderAll();
    this.toast('Добро пожаловать, Полковник!', 'success');
    this.autoSave();
  },

  // ----------------------------------------
  //  ВКЛАДКИ И UI
  // ----------------------------------------
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

  // ----------------------------------------
  //  ГЕНЕРАЦИЯ КАНДИДАТА (90% М)
  // ----------------------------------------
  generateCandidate() {
    const gender = chance(0.9) ? 'М' : 'Ж';
    const age = rndInt(21, 45);
    const hasCriminal = chance(0.15);
    const hasHealth = chance(0.2);
    const served = chance(0.7);

    const cand = {
      id: State.nextStaffId++,
      gender,
      name: fullName(gender),
      age,
      phone: genPhone(),
      passport: {
        number: genPassportNumber(),
        city: rnd(CITIES),
        criminal: hasCriminal,
        debts: chance(0.25)
      },
      medical: {
        healthy: !hasHealth,
        issue: hasHealth ? rnd(MED_ISSUES) : 'Здоров',
        psych: rndInt(60, 100)
      },
      military: {
        served,
        category: served ? rnd(['А','Б','В']) : '—',
        hotSpots: served && chance(0.2),
        hotspot: served ? rnd(HOTSPOT_LABELS) : '—'
      },
      experience: {
        years: rndInt(0, 15),
        lastJob: rnd(JOBS),
        fired: chance(0.2)
      },
      skills: {
        loyalty: rndInt(40,95),
        corruption: rndInt(0,40),
        bravery: rndInt(30,95),
        intellect: rndInt(40,95),
        stamina: rndInt(50,95)
      },
      rank: State.org === 'FSB' ? 'Прапорщик' : 'Рядовой',
      exp: 0,
      health: 100,
      fatigue: 0,
      salary: rndInt(30000, 60000),
      wounded: false,
      healDays: 0
    };

    State.candidates.push(cand);
    this.log(`📞 Пришёл кандидат: ${cand.name}`, 'info');
    this.toast(`Кандидат: ${cand.name}`, 'info');
    this.renderCandidates();
    this.autoSave();
  },

  // ----------------------------------------
  //  СПИСОК КАНДИДАТОВ
  // ----------------------------------------
  renderCandidates() {
    const list = document.getElementById('candidates-list');
    const counter = document.getElementById('candidates-count');
    if (!list) return;
    if (counter) counter.textContent = State.candidates.length;

    if (State.candidates.length === 0) {
      list.innerHTML = '<p class="placeholder">Нажмите «Вызвать», чтобы пригласить кандидатов</p>';
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

  // ----------------------------------------
  //  КАРТОЧКА КАНДИДАТА
  // ----------------------------------------
  openCandidate(id) {
    const c = State.candidates.find(x => x.id === id);
    if (!c) return;
    State.currentCandId = id;

    document.getElementById('candidates-panel').style.display = 'none';
    document.getElementById('candidate-detail').style.display = 'block';

    document.getElementById('cand-photo').textContent = c.gender === 'М' ? '👨' : '👩';
    document.getElementById('cand-name').textContent = c.name;
    document.getElementById('cand-sub').textContent =
      `${c.age} лет · ${c.experience.lastJob} · ${c.phone}`;
    document.getElementById('cand-detail-title').textContent = `Кандидат: ${c.name}`;

    document.getElementById('doc-view').innerHTML =
      '<p class="placeholder">Выберите документ для просмотра</p>';
  },

  closeCandidate() {
    State.currentCandId = null;
    document.getElementById('candidates-panel').style.display = 'block';
    document.getElementById('candidate-detail').style.display = 'none';
  },

  // ----------------------------------------
  //  ПОКАЗ ДОКУМЕНТОВ
  // ----------------------------------------
  showDoc(type) {
    const c = State.candidates.find(x => x.id === State.currentCandId);
    if (!c) return;
    const view = document.getElementById('doc-view');

    if (type === 'passport') {
      view.innerHTML = `
        <div class="doc-title">📕 Паспорт РФ</div>
        <div class="doc-row"><span>ФИО:</span><b>${c.name}</b></div>
        <div class="doc-row"><span>Пол:</span><b>${c.gender === 'М' ? 'Мужской' : 'Женский'}</b></div>
        <div class="doc-row"><span>Возраст:</span><b>${c.age}</b></div>
        <div class="doc-row"><span>Серия/номер:</span><b>${c.passport.number}</b></div>
        <div class="doc-row"><span>Город:</span><b>${c.passport.city}</b></div>
        <div class="doc-row"><span>Судимости:</span>
          <b class="${c.passport.criminal ? 'doc-bad' : 'doc-good'}">${c.passport.criminal ? '⚠ ЕСТЬ' : 'Нет'}</b></div>
        <div class="doc-row"><span>Долги:</span>
          <b class="${c.passport.debts ? 'doc-warn' : 'doc-good'}">${c.passport.debts ? '⚠ Есть' : 'Нет'}</b></div>
      `;
    } else if (type === 'medical') {
      view.innerHTML = `
        <div class="doc-title">🩺 Медицинская карта</div>
        <div class="doc-row"><span>Общее состояние:</span>
          <b class="${c.medical.healthy ? 'doc-good' : 'doc-bad'}">${c.medical.healthy ? 'Здоров' : c.medical.issue}</b></div>
        <div class="doc-row"><span>Психика:</span>
          <b class="${c.medical.psych > 80 ? 'doc-good' : c.medical.psych > 60 ? 'doc-warn' : 'doc-bad'}">${c.medical.psych}/100</b></div>
        <div class="doc-row"><span>Допуск к службе:</span>
          <b class="${c.medical.healthy ? 'doc-good' : 'doc-bad'}">${c.medical.healthy ? 'Разрешён' : 'Ограничен'}</b></div>
      `;
    } else if (type === 'military') {
      view.innerHTML = `
        <div class="doc-title">🎖️ Военный билет</div>
        <div class="doc-row"><span>Служба:</span>
          <b class="${c.military.served ? 'doc-good' : 'doc-bad'}">${c.military.served ? 'Проходил' : 'Не проходил'}</b></div>
        <div class="doc-row"><span>Категория:</span><b>${c.military.category}</b></div>
        <div class="doc-row"><span>Горячие точки:</span>
          <b class="${c.military.hotSpots ? 'doc-warn' : ''}">${c.military.hotSpots ? 'Да (' + c.military.hotspot + ')' : 'Нет'}</b></div>
      `;
    } else if (type === 'experience') {
      view.innerHTML = `
        <div class="doc-title">📜 Трудовой стаж</div>
        <div class="doc-row"><span>Лет стажа:</span><b>${c.experience.years}</b></div>
        <div class="doc-row"><span>Последнее место:</span><b>${c.experience.lastJob}</b></div>
        <div class="doc-row"><span>Уволен по статье:</span>
          <b class="${c.experience.fired ? 'doc-bad' : 'doc-good'}">${c.experience.fired ? 'Да' : 'Нет'}</b></div>
      `;
    }
  },

  // ----------------------------------------
  //  НАЙМ / ОТКАЗ
  // ----------------------------------------
  hireCurrent() {
    const c = State.candidates.find(x => x.id === State.currentCandId);
    if (!c) return;
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
//  ПОЛКОВНИК — game2.js — Часть 2/4
//  Сотрудники, больничный, группы
// ============================================================

Object.assign(Game, {

  // ----------------------------------------
  //  ПОИСК СОТРУДНИКА
  // ----------------------------------------
  findStaff(id) { return State.staff.find(s => s.id === id); },

  // ----------------------------------------
  //  СПИСОК ЛИЧНОГО СОСТАВА
  // ----------------------------------------
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

    list.innerHTML = active.map(s => `
      <div class="staff-card">
        <div class="staff-top">
          <div class="staff-name">${s.gender === 'М' ? '👨' : '👩'} ${s.name}</div>
          <div class="staff-rank">${s.rank}</div>
        </div>
        <div class="health-bar"><div style="width:${s.health}%"></div></div>
        <div class="staff-stats">
          <span>❤️ ${s.health}</span>
          <span>😩 ${s.fatigue}</span>
          <span>💼 ${formatMoney(s.salary)}</span>
        </div>
        <div class="staff-actions">
          <button class="btn small primary" onclick="Game.promote(${s.id})">⬆ Повысить</button>
          <button class="btn small" onclick="Game.demote(${s.id})">⬇ Понизить</button>
          <button class="btn small warn" onclick="Game.reprimand(${s.id})">⚠ Выговор</button>
          <button class="btn small danger" onclick="Game.fire(${s.id})">🚫 Уволить</button>
        </div>
      </div>`).join('');

    this.updateStats();
    this.renderHospital();
    this.renderStaffPicker();
  },

  // ----------------------------------------
  //  БОЛЬНИЧНЫЙ
  // ----------------------------------------
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
        <div class="staff-actions">
          <button class="btn small primary" onclick="Game.healFast(${s.id})">💊 Лечить (10 000₽)</button>
          <button class="btn small danger" onclick="Game.fire(${s.id})">🚫 Уволить</button>
        </div>
      </div>`).join('');
  },

  // ----------------------------------------
  //  ДЕЙСТВИЯ С СОТРУДНИКОМ
  // ----------------------------------------
  promote(id) {
    const s = this.findStaff(id);
    if (!s) return;
    const list = RANKS[State.org];
    const idx = list.findIndex(r => r.name === s.rank);
    if (idx < 0) return;
    if (idx >= list.length - 1) {
      return this.toast(`${s.name} уже на максимальном звании`, 'warn');
    }
    const old = s.rank;
    s.rank = list[idx + 1].name;
    this.log(`⬆ ${s.name}: ${old} → ${s.rank}`, 'success');
    this.toast(`${s.name} → ${s.rank}`, 'success');
    this.renderStaff();
    this.autoSave();
  },

  demote(id) {
    const s = this.findStaff(id);
    if (!s) return;
    const list = RANKS[State.org];
    const idx = list.findIndex(r => r.name === s.rank);
    if (idx <= 0) return this.toast(`${s.name} уже на минимальном звании`, 'warn');
    s.rank = list[idx - 1].name;
    s.skills.loyalty -= 15;
    this.log(`⬇ ${s.name} понижен до ${s.rank}`, 'warn');
    this.toast(`${s.name} понижен`, 'warn');
    this.renderStaff();
    this.autoSave();
  },

  reprimand(id) {
    const s = this.findStaff(id);
    if (!s) return;
    s.skills.loyalty -= 10;
    this.log(`⚠ ${s.name}: выговор`, 'warn');
    this.toast(`${s.name}: выговор`, 'warn');
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
    this.renderStaff();
    this.renderGroups();
    this.autoSave();
  },

  // ----------------------------------------
  //  ЛЕЧЕНИЕ
  // ----------------------------------------
  healFast(id) {
    const s = this.findStaff(id);
    if (!s || !s.wounded) return;
    if (State.money < HEAL_COST) return this.toast('Недостаточно средств', 'danger');
    State.money -= HEAL_COST;
    s.health = 100;
    s.healDays = 0;
    s.wounded = false;
    this.log(`💊 ${s.name} вылечен`, 'success');
    this.toast(`${s.name} восстановлен`, 'success');
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

  // ----------------------------------------
  //  СЛЕДУЮЩИЙ ДЕНЬ
  // ----------------------------------------
  nextDay() {
    State.day++;
    State.staff.forEach(s => {
      if (s.wounded) {
        s.health = clamp(s.health + HEAL_PER_DAY, 0, 100);
        s.healDays = Math.max(0, s.healDays - 1);
        if (s.healDays === 0 || s.health >= 100) {
          s.health = 100;
          s.wounded = false;
          s.healDays = 0;
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

  // ----------------------------------------
  //  ВЫБОР СОСТАВА ДЛЯ НОВОЙ ГРУППЫ
  // ----------------------------------------
  renderStaffPicker() {
    const picker = document.getElementById('group-staff-picker');
    if (!picker) return;
    const available = State.staff.filter(s => !s.wounded);
    if (available.length === 0) {
      picker.innerHTML = '<p class="placeholder">Нет доступных сотрудников</p>';
      return;
    }
    picker.innerHTML = available.map(s => {
      const checked = State.selectedStaff.includes(s.id);
      const inGroup = State.groups.some(g => g.members.includes(s.id));
      return `
        <label class="picker-item" style="${inGroup ? 'opacity:.5' : ''}">
          <input type="checkbox" ${checked ? 'checked' : ''} ${inGroup ? 'disabled' : ''}
            onchange="Game.toggleStaffPick(${s.id}, this.checked)">
          <div class="pi-info">
            <div class="pi-name">${s.gender === 'М' ? '👨' : '👩'} ${s.name}</div>
            <div class="pi-rank">${s.rank}${inGroup ? ' · уже в группе' : ''}</div>
          </div>
        </label>
      `;
    }).join('');
  },

  toggleStaffPick(id, checked) {
    if (checked) {
      if (!State.selectedStaff.includes(id)) State.selectedStaff.push(id);
    } else {
      State.selectedStaff = State.selectedStaff.filter(sid => sid !== id);
    }
  },

  // ----------------------------------------
  //  СОЗДАНИЕ ГРУППЫ
  // ----------------------------------------
  createGroup() {
    const name = document.getElementById('group-name').value.trim();
    const iconSel = document.getElementById('group-icon').value;
    const iconUrl = document.getElementById('group-icon-url').value.trim();
    let icon;
    if (iconSel === '__custom') {
      if (!iconUrl) return this.toast('Введите URL иконки', 'warn');
      icon = iconUrl;
    } else { icon = iconSel; }
    if (!name) return this.toast('Введите название группы', 'warn');
    if (State.selectedStaff.length < 1) return this.toast('Выберите хотя бы 1 сотрудника', 'warn');

    const g = {
      id: State.nextGroupId++,
      name, icon,
      members: [...State.selectedStaff],
      custom: iconSel === '__custom'
    };
    State.groups.push(g);
    this.log(`🎯 Создана группа «${name}» (${g.members.length} чел.)`, 'success');
    this.toast(`Группа «${name}» создана`, 'success');

    State.selectedStaff = [];
    document.getElementById('group-name').value = '';
    document.getElementById('group-icon-url').value = '';
    const prev = document.getElementById('icon-preview');
    if (prev) prev.innerHTML = '';

    this.renderGroups();
    this.renderStaffPicker();
    this.updateGroupsCount();
    this.autoSave();
  },

  updateGroupsCount() {
    const c = document.getElementById('groups-count');
    if (c) c.textContent = State.groups.length;
  },

  // ----------------------------------------
  //  СПИСОК ГРУПП
  // ----------------------------------------
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
          ${woundedCount > 0 ? `<div class="g-info" style="color:#f85149">🏥 Раненых: ${woundedCount}</div>` : ''}
          <div class="g-members">${members.map(s => `${s.wounded ? '🏥' : '•'} ${s.name}`).join('<br>')}</div>
          <button class="btn small danger" style="margin-top:6px" onclick="Game.deleteGroup(${g.id})">Расформировать</button>
        </div>`;
    }).join('');
    this.updateGroupsCount();
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
//  ПОЛКОВНИК — game3.js — Часть 3/4
//  Операции (пошаговый лог), розыск
// ============================================================

Object.assign(Game, {

  // ----------------------------------------
  //  ГЕНЕРАЦИЯ ВЫЗОВА
  // ----------------------------------------
  generateEvent() {
    const type = rnd(CRIMES);
    const addr = `${rnd(STREETS)}, д. ${rndInt(1, 120)}`;
    const threat = chance(0.3) ? 'high' : chance(0.5) ? 'medium' : 'low';
    const e = {
      id: State.nextEventId++,
      title: type,
      addr,
      threat,
      status: 'pending',
      createdDay: State.day,
      criminals: rndInt(2, 8)
    };
    State.events.push(e);
    this.log(`🚨 ${type} — ${addr}`, 'danger');
    this.toast(`🚨 ${type}!`, 'danger');
    this.renderEvents();
    this.autoSave();
  },

  // ----------------------------------------
  //  СПИСОК СОБЫТИЙ
  // ----------------------------------------
  renderEvents() {
    const el = document.getElementById('events-list');
    if (!el) return;
    if (State.events.length === 0) {
      el.innerHTML = '<p class="placeholder">Пока тихо</p>';
      return;
    }
    el.innerHTML = State.events.map(e => {
      const threatLabel = { high: '🔴 Высокая', medium: '🟡 Средняя', low: '🟢 Низкая' }[e.threat];
      const cls = e.threat === 'high' ? '' : e.threat === 'medium' ? 'medium' : 'low';
      return `
        <div class="event-card ${cls}">
          <div class="e-title">${e.title}</div>
          <div class="e-addr">📍 ${e.addr} · ${threatLabel} · Преступников: ${e.criminals}</div>
          <div class="e-actions">
            ${e.status === 'pending' ? `
              <button class="btn small primary" onclick="Game.openOperation(${e.id}, 'group')">🎯 Отправить группу</button>
              <button class="btn small" onclick="Game.openOperation(${e.id}, 'self')">🚗 Выехать лично</button>
              <button class="btn small danger" onclick="Game.ignore(${e.id})">Игнор</button>
            ` : `<span class="rank-badge">${e.status}</span>`}
          </div>
        </div>`;
    }).join('');
  },

  // ----------------------------------------
  //  ОКНО ОПЕРАЦИИ
  // ----------------------------------------
  openOperation(eventId, mode) {
    const e = State.events.find(x => x.id === eventId);
    if (!e || e.status !== 'pending') return;

    State._op = { eventId, mode };

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
        picker.innerHTML =
          `<div style="color:#8b949e;font-size:12px;margin-bottom:6px">Выберите группу:</div>` +
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
  },

  closeOperation() {
    document.getElementById('operation-detail').style.display = 'none';
    State._op = null;
  },

  // ----------------------------------------
  //  ЛОГ ОПЕРАЦИИ (пошаговый)
  // ----------------------------------------
  logOp(text, type = 'info') {
    const log = document.getElementById('op-log');
    if (!log) return;
    const time = new Date().toLocaleTimeString('ru-RU',
      { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const line = document.createElement('div');
    line.className = 'op-log-line ' + type;
    line.innerHTML = `<span class="log-time">[${time}]</span>${text}`;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  },

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },

  // ----------------------------------------
  //  ОТПРАВКА ГРУППЫ
  // ----------------------------------------
  async sendGroup(eventId, groupId) {
    const e = State.events.find(x => x.id === eventId);
    const g = State.groups.find(x => x.id === groupId);
    if (!e || !g) return;

    const opLog = document.getElementById('op-log');
    opLog.innerHTML = '';

    const fighters = g.members.map(id => this.findStaff(id))
      .filter(s => s && !s.wounded);
    if (fighters.length === 0) return this.toast('Группа небоеспособна', 'danger');

    // ====== ВЫЕЗД ======
    this.logOp(`🚔 Группа «${g.name}» выехала на задание`, 'system');
    await this.sleep(900);
    this.logOp(`📻 Связь: «Прибыли на место. Занимаем позиции»`, 'info');
    await this.sleep(1100);
    this.logOp(`👁 Наблюдаем движение внутри. Преступников: ${e.criminals}`, 'warn');
    await this.sleep(1200);
    this.logOp(`🚧 Оцепление выставлено. Готовимся к штурму`, 'info');
    await this.sleep(1200);

    // ====== ШТУРМ ======
    this.logOp(`💥 Штурм начался!`, 'system');
    await this.sleep(1000);
    this.logOp(`🔫 Перестрелка!`, 'bad');
    await this.sleep(700);

    // рассчитываем исход
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
        ourKilled = 0;
        ourWounded = rndInt(0, 1);
      }
    } else {
      enemyKilled = rndInt(0, Math.floor(e.criminals / 2));
      enemyWounded = rndInt(0, e.criminals - enemyKilled);
      ourKilled = rndInt(0, Math.max(0, Math.floor(fighters.length / 3)));
      ourWounded = rndInt(1, Math.max(1, Math.floor(fighters.length / 2)));
    }

    // ранения наших
    const shuffled = [...fighters].sort(() => Math.random() - 0.5);
    for (let i = 0; i < ourWounded && i < shuffled.length; i++) {
      const s = shuffled[i];
      s.health = rndInt(10, 45);
      s.wounded = true;
      s.healDays = rndInt(2, 5);
      s.fatigue += 25;
      this.logOp(`🏥 ${s.name} ранен, эвакуирован (${s.healDays} дн.)`, 'warn');
      await this.sleep(600);
    }

    // убитые наши
    for (let i = 0; i < ourKilled && i + ourWounded < shuffled.length; i++) {
      const s = shuffled[ourWounded + i];
      this.logOp(`💀 ${s.name} погиб при исполнении`, 'bad');
      State.groups.forEach(gr => {
        gr.members = gr.members.filter(mid => mid !== s.id);
      });
      State.staff = State.staff.filter(x => x.id !== s.id);
      await this.sleep(700);
    }

    // ====== ЗАЧИСТКА ======
    this.logOp(`🛡 Зачистка завершена`, 'info');
    await this.sleep(800);
    this.logOp(`📊 Потери противника: убито ${enemyKilled}, ранено ${enemyWounded}`, 'info');
    await this.sleep(600);
    this.logOp(`📊 Наши потери: убито ${ourKilled}, ранено ${ourWounded}`,
      ourKilled > 0 ? 'bad' : 'info');
    await this.sleep(600);

    // ====== ИТОГ ======
    if (success) {
      e.status = '✅ Успех';
      State.money += 20000;
      State.reputation += 3;
      State.myExp += 50;
      fighters.forEach(s => {
        if (!s.wounded) {
          s.exp += 30;
          s.fatigue += 15;
        }
      });
      this.logOp(`✅ Операция завершена успешно`, 'good');
      this.logOp(`💰 +20 000₽ · ⭐ +3 репутации`, 'good');
      this.log(`✅ Группа «${g.name}» — ${e.title}. Потери: ${ourKilled}/${ourWounded}`, 'success');
      this.toast('Успех! +20000₽', 'success');
    } else {
      e.status = '❌ Провал';
      State.reputation -= 5;
      State.myExp += 10;
      this.logOp(`❌ Операция провалена`, 'bad');
      this.logOp(`📉 -5 репутации`, 'bad');
      this.log(`❌ Провал: ${e.title}. Потери: ${ourKilled}/${ourWounded}`, 'danger');
      this.toast('Провал операции', 'danger');
    }

    this.showOpResult(e, { success, ourKilled, ourWounded, enemyKilled, enemyWounded });
    this.renderEvents();
    this.renderStaff();
    this.renderGroups();
    this.updateStats();
    this.autoSave();
  },

  // ----------------------------------------
  //  ЛИЧНЫЙ ВЫЕЗД
  // ----------------------------------------
  async goSelf(eventId) {
    const e = State.events.find(x => x.id === eventId);
    if (!e) return;

    const opLog = document.getElementById('op-log');
    opLog.innerHTML = '';

    this.logOp(`🚗 Полковник лично выехал на задание`, 'system');
    await this.sleep(900);
    this.logOp(`📻 «Прибыл на место. Оцениваю обстановку»`, 'info');
    await this.sleep(1100);
    this.logOp(`👁 Преступников: ${e.criminals}`, 'warn');
    await this.sleep(1100);
    this.logOp(`🔫 Вступаю в контакт!`, 'bad');
    await this.sleep(1200);

    const success = chance(0.65);
    let ourKilled = 0, ourWounded = 0, enemyKilled = 0, enemyWounded = 0;

    if (success) {
      enemyKilled = rndInt(1, e.criminals);
      enemyWounded = e.criminals - enemyKilled;
      ourWounded = chance(0.3) ? 1 : 0;
      this.logOp(`✅ Преступники нейтрализованы`, 'good');
      await this.sleep(800);
      this.logOp(`📊 Убито: ${enemyKilled}, ранено: ${enemyWounded}`, 'info');
      if (ourWounded) this.logOp(`🏥 Полковник ранен`, 'warn');

      e.status = '✅ Успех (лично)';
      State.money += 15000;
      State.reputation += 5;
      State.myExp += 80;
      this.logOp(`💰 +15 000₽ · ⭐ +5 репутации`, 'good');
      this.log(`✅ Лично: ${e.title}`, 'success');
      this.toast('Личный успех! +15000₽', 'success');
    } else {
      enemyKilled = rndInt(0, Math.floor(e.criminals / 2));
      enemyWounded = rndInt(0, e.criminals);
      ourWounded = 1;
      this.logOp(`❌ Преступники скрылись`, 'bad');
      await this.sleep(800);
      this.logOp(`📊 Убито: ${enemyKilled}, ранено: ${enemyWounded}`, 'info');
      this.logOp(`🏥 Полковник ранен`, 'warn');

      e.status = '❌ Провал (лично)';
      State.reputation -= 8;
      State.myExp += 20;
      this.logOp(`📉 -8 репутации`, 'bad');
      this.log(`❌ Провал лично: ${e.title}`, 'danger');
      this.toast('Провал лично', 'danger');
    }

    this.showOpResult(e, { success, ourKilled, ourWounded, enemyKilled, enemyWounded });
    this.renderEvents();
    this.renderStaff();
    this.renderGroups();
    this.updateStats();
    this.autoSave();
  },

  // ----------------------------------------
  //  ОКНО РЕЗУЛЬТАТА
  // ----------------------------------------
  showOpResult(e, r) {
    const res = document.getElementById('op-result');
    res.style.display = 'block';
    res.className = 'op-result ' + (r.success ? 'win' : 'lose');
    res.innerHTML = `
      <div class="res-title ${r.success ? 'win' : 'lose'}">
        ${r.success ? '✅ Операция завершена' : '❌ Операция провалена'}
      </div>
      <div class="res-row"><span>Объект:</span><b>${e.title}</b></div>
      <div class="res-row"><span>💀 Наши убиты:</span><b style="color:${r.ourKilled > 0 ? '#f85149' : '#3fb950'}">${r.ourKilled}</b></div>
      <div class="res-row"><span>🏥 Наши ранены:</span><b style="color:${r.ourWounded > 0 ? '#d29922' : '#3fb950'}">${r.ourWounded}</b></div>
      <div class="res-row"><span>💀 Убито преступников:</span><b>${r.enemyKilled}</b></div>
      <div class="res-row"><span>🏥 Задержано:</span><b>${r.enemyWounded}</b></div>
    `;
  },

  // ----------------------------------------
  //  ИГНОР
  // ----------------------------------------
  ignore(eventId) {
    const e = State.events.find(x => x.id === eventId);
    if (!e) return;
    e.status = '⚪ Игнор';
    State.reputation -= 3;
    this.log(`⚪ Игнор: ${e.title}`, 'warn');
    this.renderEvents();
    this.updateStats();
    this.autoSave();
  }
});
// ============================================================
//  ПОЛКОВНИК — game4.js — Часть 4/4
//  Розыск, журнал, статистика, сейвы, UI-утилиты
// ============================================================

Object.assign(Game, {

  // ----------------------------------------
  //  ДОБАВИТЬ В РОЗЫСК
  // ----------------------------------------
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

  // ----------------------------------------
  //  СПИСОК РОЗЫСКА
  // ----------------------------------------
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

  // ----------------------------------------
  //  ОКНО ЗАДЕРЖАНИЯ
  // ----------------------------------------
  openWanted(id) {
    const w = State.wanted.find(x => x.id === id);
    if (!w) return;
    State._wanted = id;

    document.getElementById('wanted-detail').style.display = 'block';
    document.getElementById('wanted-detail-title').textContent = `Задержание: ${w.name}`;
    document.getElementById('wanted-info').innerHTML = `
      <div class="oi-row"><span>ФИО:</span><b>${w.name}</b></div>
      <div class="oi-row"><span>Преступление:</span><b>${w.crime}</b></div>
      <div class="oi-row"><span>Уровень:</span><b>${w.level}</b></div>
    `;

    const picker = document.getElementById('wanted-groups-picker');
    const available = State.groups.filter(g =>
      g.members.some(id => {
        const s = this.findStaff(id);
        return s && !s.wounded;
      })
    );

    if (available.length === 0) {
      picker.innerHTML = '<p class="placeholder">Нет боеспособных групп</p>';
      return;
    }

    picker.innerHTML = available.map(g => {
      const alive = g.members.filter(id => {
        const s = this.findStaff(id);
        return s && !s.wounded;
      });
      return `
        <div class="gp-item" onclick="Game.sendWantedGroup(${g.id})">
          <div class="gp-name">${g.custom ? `<img src="${g.icon}">` : g.icon} ${g.name}</div>
          <div class="gp-info">👥 Бойцов: ${alive.length}</div>
        </div>`;
    }).join('');
  },

  closeWanted() {
    document.getElementById('wanted-detail').style.display = 'none';
    State._wanted = null;
  },

  // ----------------------------------------
  //  ОТПРАВКА НА ЗАДЕРЖАНИЕ
  // ----------------------------------------
  async sendWantedGroup(groupId) {
    const w = State.wanted.find(x => x.id === State._wanted);
    const g = State.groups.find(x => x.id === groupId);
    if (!w || !g) return;

    const tempEvent = {
      id: 0,
      title: `Задержание: ${w.name}`,
      addr: w.crime,
      threat: 'medium',
      criminals: 1,
      status: 'pending'
    };

    document.getElementById('wanted-detail').style.display = 'none';
    document.getElementById('operation-detail').style.display = 'block';
    document.getElementById('op-title').textContent = `Задержание: ${w.name}`;
    document.getElementById('op-info').innerHTML = `
      <div class="oi-row"><span>👤 Объект:</span><b>${w.name}</b></div>
      <div class="oi-row"><span>⚖️ Преступление:</span><b>${w.crime}</b></div>
      <div class="oi-row"><span>🎯 Уровень:</span><b>${w.level}</b></div>
      <div class="oi-row"><span>🚔 Группа:</span><b>${g.name}</b></div>
    `;
    document.getElementById('op-log').innerHTML = '';
    document.getElementById('op-result').style.display = 'none';

    const fighters = g.members.map(id => this.findStaff(id))
      .filter(s => s && !s.wounded);

    this.logOp(`🚔 Группа «${g.name}» выехала на задержание`, 'system');
    await this.sleep(900);
    this.logOp(`📻 «Прибыли по адресу. Ищем объект»`, 'info');
    await this.sleep(1100);
    this.logOp(`👁 Объект обнаружен, начинаем преследование`, 'warn');
    await this.sleep(1200);

    const avgBravery = fighters.reduce((a, s) => a + s.skills.bravery, 0) / fighters.length;
    const successChance = 0.55 + avgBravery / 400;
    const success = chance(successChance);

    let ourWounded = 0;

    if (success) {
      this.logOp(`✅ Объект задержан!`, 'good');
      await this.sleep(700);

      ourWounded = chance(0.25) ? 1 : 0;
      if (ourWounded) {
        const s = fighters[rndInt(0, fighters.length - 1)];
        s.health = rndInt(30, 60);
        s.wounded = true;
        s.healDays = rndInt(1, 3);
        this.logOp(`🏥 ${s.name} получил травму (${s.healDays} дн.)`, 'warn');
      }
      await this.sleep(700);

      this.logOp(`📊 Задержан: ${w.name}`, 'info');
      this.logOp(`💰 Награда: +30 000₽ · ⭐ +4 репутации`, 'good');

      State.wanted = State.wanted.filter(x => x.id !== w.id);
      State.money += 30000;
      State.reputation += 4;
      State.myExp += 40;
      this.log(`🚔 Задержан: ${w.name}`, 'success');
      this.toast(`${w.name} задержан`, 'success');

      this.showOpResult(tempEvent, {
        success: true, ourKilled: 0, ourWounded,
        enemyKilled: 0, enemyWounded: 1
      });
    } else {
      this.logOp(`❌ Объект скрылся!`, 'bad');
      await this.sleep(700);
      this.logOp(`📊 Побег: ${w.name}`, 'info');
      this.log(`❌ ${w.name} скрылся`, 'danger');
      this.toast('Не удалось задержать', 'danger');

      this.showOpResult(tempEvent, {
        success: false, ourKilled: 0, ourWounded: 0,
        enemyKilled: 0, enemyWounded: 0
      });
    }

    this.renderWanted();
    this.renderStaff();
    this.renderGroups();
    this.updateStats();
    this.autoSave();
  },

  // ----------------------------------------
  //  ЖУРНАЛ
  // ----------------------------------------
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

  // ----------------------------------------
  //  СТАТИСТИКА
  // ----------------------------------------
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

  // ----------------------------------------
  //  СОХРАНЕНИЕ / ЗАГРУЗКА
  // ----------------------------------------
  autoSave() {
    try {
      const data = {
        version: SAVE_VERSION,
        state: State,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      const ls = document.getElementById('load-slot');
      if (ls) ls.style.display = 'block';
    } catch (e) {
      console.warn('Ошибка автосейва:', e);
    }
  },

  loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return this.toast('Сохранений нет', 'warn');
      const data = JSON.parse(raw);
      if (!data.state || !data.state.org) return this.toast('Файл повреждён', 'danger');

      Object.keys(State).forEach(k => { delete State[k]; });
      Object.assign(State, data.state);

      // защита от старых сейвов
      if (!State.candidates) State.candidates = [];
      if (!State.selectedStaff) State.selectedStaff = [];
      if (State.currentCandId === undefined) State.currentCandId = null;

      document.getElementById('screen-org').classList.remove('active');
      document.getElementById('screen-office').classList.add('active');
      document.getElementById('org-name').textContent =
        State.org === 'FSB' ? '🔵 ФСБ России' : '🟢 МВД России';
      document.getElementById('my-rank').textContent = State.myRank;

      this.renderAll();
      this.toast('💾 Игра загружена', 'success');
      this.log('💾 Загружено', 'success');
    } catch (err) {
      this.toast('Ошибка загрузки: ' + err.message, 'danger');
    }
  },

  // ----------------------------------------
  //  UI-УТИЛИТЫ
  // ----------------------------------------
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
    this.renderLog();
    this.updateStats();
  }
});

// ============ ЗАПУСК ============
window.addEventListener('DOMContentLoaded', () => Game.init());
