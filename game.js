// ============================================================
//  ПОЛКОВНИК — Часть 1: ядро, состояние, кадры
// ============================================================

const SAVE_KEY = 'polkovnik_save_v2';
const SAVE_VERSION = 2;
const HEAL_PER_DAY = 15;
const HEAL_COST = 10000;

const State = {
  org: null, myRank: 'Полковник', myExp: 0, money: 100000, reputation: 50,
  day: 1, staff: [], groups: [], events: [], wanted: [], log: [],
  nextStaffId: 1, nextGroupId: 1, nextEventId: 1, nextWantedId: 1
};

const FIRST_NAMES_M = ['Александр','Дмитрий','Сергей','Андрей','Иван','Максим','Николай','Владимир','Егор','Артём','Кирилл','Роман','Павел','Денис','Антон','Виктор','Олег','Игорь','Юрий','Константин','Григорий','Тимур','Руслан','Валерий','Станислав','Борис','Геннадий','Аркадий','Леонид','Пётр'];
const FIRST_NAMES_F = ['Анна','Мария','Ольга','Екатерина','Татьяна','Светлана','Ирина','Наталья','Юлия','Виктория','Елена','Дарья','Алиса','Полина','Ксения','Вероника','Алина','Кристина','Марина','Оксана','Людмила','Валентина'];
const LAST_NAMES = ['Иванов','Петров','Смирнов','Кузнецов','Соколов','Попов','Лебедев','Козлов','Новиков','Морозов','Волков','Соловьёв','Васильев','Зайцев','Павлов','Семёнов','Голубев','Виноградов','Богданов','Воробьёв','Фёдоров','Михайлов','Беляев','Тарасов','Белов','Комаров','Орлов','Киселёв','Макаров','Андреев','Ковалёв','Ильин','Гусев','Титов','Кузьмин'];
const CITIES = ['Москва','Санкт-Петербург','Казань','Новосибирск','Екатеринбург','Самара','Омск','Ростов-на-Дону','Уфа','Красноярск','Воронеж','Пермь','Волгоград','Краснодар','Саратов','Тюмень','Тольятти','Ижевск'];
const CRIMES = ['Терроризм','Захват заложников','Вооружённое ограбление','Убийство','Угон','Наркоторговля','Мошенничество','Контрабанда','Похищение','Разбойное нападение','Поджог','Взрыв','Стрельба в людном месте','Нападение на участок','Захват автобуса'];
const STREETS = ['ул. Ленина','пр. Мира','ул. Гагарина','ул. Советская','пр. Победы','ул. Кирова','ул. Пушкина','ул. Чехова','ул. Гоголя','ул. Тверская','ул. Арбат','пр. Ленинградский','ул. Садовая','ул. Лесная','ул. Новая','ул. Центральная','ул. Школьная','ул. Заводская'];
const JOBS = ['Охрана','МВД','Армия','ЧОП','Без опыта','Служба безопасности','Водитель','Строитель','Студент','Курьер','Продавец','Инженер'];
const MED_ISSUES = ['Гипертония','Астма','Сахарный диабет','Проблемы со зрением','Плоскостопие','Сколиоз','Аллергия','Мигрень'];
const HOTSPOT_LABELS = ['Чечня','Дагестан','Сирия','Афганистан','Таджикистан'];

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
    if (localStorage.getItem(SAVE_KEY)) {
      document.getElementById('load-slot').style.display = 'block';
    }
    console.log('ПОЛКОВНИК: игра инициализирована');
  },

  chooseOrg(org) {
    console.log('Выбрано ведомство:', org);
    State.org = org;
    State.myRank = 'Полковник';
    State.myExp = org === 'FSB' ? 2000 : 6000;
    State.money = org === 'FSB' ? 80000 : 150000;
    State.reputation = org === 'FSB' ? 60 : 50;

    document.getElementById('screen-org').classList.remove('active');
    document.getElementById('screen-office').classList.add('active');
    document.getElementById('org-name').textContent =
      org === 'FSB' ? '🔵 ФСБ России' : '🟢 МВД России';
    document.getElementById('my-rank').textContent = State.myRank;

    this.log(`Вы возглавили ${org === 'FSB' ? 'ФСБ' : 'МВД'}. Звание: Полковник`, 'success');
    this.renderAll();
    this.toast('Добро пожаловать, Полковник!', 'success');
    this.autoSave();
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
    const gender = chance(0.8) ? 'М' : 'Ж';
    const age = rndInt(21, 45);
    const hasCriminal = chance(0.15);
    const hasHealth = chance(0.2);
    const served = chance(0.7);

    const cand = {
      id: State.nextStaffId++, gender, name: fullName(gender), age,
      phone: genPhone(),
      passport: { number: genPassportNumber(), city: rnd(CITIES), criminal: hasCriminal, debts: chance(0.25) },
      medical: { healthy: !hasHealth, issue: hasHealth ? rnd(MED_ISSUES) : 'Здоров', psych: rndInt(60, 100) },
      military: { served, category: served ? rnd(['А','Б','В']) : '—', hotSpots: served && chance(0.2), hotspot: served ? rnd(HOTSPOT_LABELS) : '—' },
      experience: { years: rndInt(0, 15), lastJob: rnd(JOBS), fired: chance(0.2) },
      skills: { loyalty: rndInt(40,95), corruption: rndInt(0,40), bravery: rndInt(30,95), intellect: rndInt(40,95), stamina: rndInt(50,95) },
      rank: State.org === 'FSB' ? 'Прапорщик' : 'Рядовой',
      exp: 0, health: 100, fatigue: 0,
      salary: rndInt(30000, 60000),
      wounded: false, healDays: 0
    };
    this.renderCandidate(cand);
  },

  renderCandidate(c) {
    const el = document.getElementById('candidate-card');
    if (!el) return;
    el.classList.remove('empty');
    const crim = c.passport.criminal;
    const deb = c.passport.debts;
    const med = c.medical;
    const mil = c.military;

    el.innerHTML = `
      <div class="cand-header">
        <div>
          <div class="cand-name">${c.gender === 'М' ? '👨' : '👩'} ${c.name}</div>
          <div class="cand-age">${c.age} лет · ${c.experience.lastJob} · ${c.phone}</div>
        </div>
        <div class="rank-badge">${c.rank}</div>
      </div>
      <div class="docs-grid">
        <div class="doc-card">
          <div class="doc-title">📕 Паспорт</div>
          <div class="doc-row"><span>Серия/номер:</span><b>${c.passport.number}</b></div>
          <div class="doc-row"><span>Город:</span><b>${c.passport.city}</b></div>
          <div class="doc-row"><span>Судимости:</span><b class="${crim ? 'doc-bad' : 'doc-good'}">${crim ? '⚠ ЕСТЬ' : 'Нет'}</b></div>
          <div class="doc-row"><span>Долги:</span><b class="${deb ? 'doc-warn' : 'doc-good'}">${deb ? '⚠ Есть' : 'Нет'}</b></div>
        </div>
        <div class="doc-card">
          <div class="doc-title">🩺 Медкарта</div>
          <div class="doc-row"><span>Статус:</span><b class="${med.healthy ? 'doc-good' : 'doc-bad'}">${med.healthy ? 'Здоров' : med.issue}</b></div>
          <div class="doc-row"><span>Психика:</span><b class="${med.psych > 80 ? 'doc-good' : med.psych > 60 ? 'doc-warn' : 'doc-bad'}">${med.psych}/100</b></div>
        </div>
        <div class="doc-card">
          <div class="doc-title">🎖️ Военный билет</div>
          <div class="doc-row"><span>Служба:</span><b class="${mil.served ? 'doc-good' : 'doc-bad'}">${mil.served ? 'Да' : 'Нет'}</b></div>
          <div class="doc-row"><span>Категория:</span><b>${mil.category}</b></div>
          <div class="doc-row"><span>Горячие точки:</span><b class="${mil.hotSpots ? 'doc-warn' : ''}">${mil.hotSpots ? 'Да (' + mil.hotspot + ')' : 'Нет'}</b></div>
        </div>
        <div class="doc-card">
          <div class="doc-title">📜 Трудовой стаж</div>
          <div class="doc-row"><span>Лет:</span><b>${c.experience.years}</b></div>
          <div class="doc-row"><span>Последнее:</span><b>${c.experience.lastJob}</b></div>
          <div class="doc-row"><span>Уволен по статье:</span><b class="${c.experience.fired ? 'doc-bad' : 'doc-good'}">${c.experience.fired ? 'Да' : 'Нет'}</b></div>
        </div>
      </div>
      <div class="cand-actions">
        <button class="btn success" onclick="Game.hire(${c.id})">✅ Одобрено</button>
        <button class="btn danger" onclick="Game.reject(${c.id})">❌ Отказано</button>
      </div>
    `;
    this._current = c;
    this.log(`Кандидат: ${c.name}, ${c.age} лет`, 'info');
  },

  hire(id) {
    const c = this._current;
    if (!c || c.id !== id) return;
    State.staff.push(c);
    this.log(`✅ Принят на службу: ${c.name} (${c.rank})`, 'success');
    this.toast(`${c.name} зачислен в штат`, 'success');
    this._current = null;
    document.getElementById('candidate-card').innerHTML =
      '<p class="placeholder">Кандидат принят. Вызовите следующего.</p>';
    document.getElementById('candidate-card').classList.add('empty');
    this.renderStaff();
    this.autoSave();
  },

  reject(id) {
    const c = this._current;
    if (!c || c.id !== id) return;
    this.log(`❌ Отказано: ${c.name}`, 'warn');
    this.toast(`${c.name} — отказано`, 'warn');
    this._current = null;
    document.getElementById('candidate-card').innerHTML =
      '<p class="placeholder">Кандидату отказано. Вызовите следующего.</p>';
    document.getElementById('candidate-card').classList.add('empty');
  }
};
// ============================================================
//  ПОЛКОВНИК — Часть 2: сотрудники, больничный, группы
// ============================================================

Object.assign(Game, {

  findStaff(id) { return State.staff.find(s => s.id === id); },

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
      const rankIdx = getRankIndex(State.org, s.rank);
      const nextRank = RANKS[State.org][rankIdx + 1];
      const canPromote = nextRank && s.exp >= nextRank.exp;
      return `
      <div class="staff-card">
        <div class="staff-top">
          <div class="staff-name">${s.gender === 'М' ? '👨' : '👩'} ${s.name}</div>
          <div class="staff-rank">${s.rank}</div>
        </div>
        <div class="health-bar"><div style="width:${s.health}%"></div></div>
        <div class="staff-stats">
          <span>⭐ ${s.exp}</span>
          <span>❤️ ${s.health}</span>
          <span>😩 ${s.fatigue}</span>
        </div>
        <div class="staff-actions">
          <button class="btn small ${canPromote ? 'primary' : ''}" onclick="Game.promote(${s.id})">⬆ Повысить</button>
          <button class="btn small" onclick="Game.demote(${s.id})">⬇ Понизить</button>
          <button class="btn small warn" onclick="Game.reprimand(${s.id})">⚠ Выговор</button>
          <button class="btn small danger" onclick="Game.fire(${s.id})">🚫 Уволить</button>
        </div>
      </div>`;
    }).join('');

    this.updateStats();
    this.renderHospital();
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
        <div class="staff-actions">
          <button class="btn small primary" onclick="Game.healFast(${s.id})">💊 Лечить (10 000₽)</button>
          <button class="btn small danger" onclick="Game.fire(${s.id})">🚫 Уволить</button>
        </div>
      </div>`).join('');
  },

  promote(id) {
    const s = this.findStaff(id);
    if (!s) return;
    s.exp += 100;
    const list = RANKS[State.org];
    const idx = list.findIndex(r => r.name === s.rank);
    if (idx < list.length - 1 && s.exp >= list[idx + 1].exp) {
      s.rank = list[idx + 1].name;
      this.log(`⬆ ${s.name} повышен до ${s.rank}`, 'success');
      this.toast(`${s.name} → ${s.rank}`, 'success');
    } else {
      this.log(`⬆ ${s.name}: опыт +100`, 'info');
    }
    this.renderStaff();
    this.autoSave();
  },

  demote(id) {
    const s = this.findStaff(id);
    if (!s) return;
    const list = RANKS[State.org];
    const idx = list.findIndex(r => r.name === s.rank);
    if (idx > 0) {
      s.rank = list[idx - 1].name;
      s.skills.loyalty -= 15;
      this.log(`⬇ ${s.name} понижен до ${s.rank}. Лояльность -15`, 'warn');
      this.toast(`${s.name} понижен`, 'warn');
    }
    this.renderStaff();
    this.autoSave();
  },

  reprimand(id) {
    const s = this.findStaff(id);
    if (!s) return;
    s.skills.loyalty -= 10;
    this.log(`⚠ ${s.name} получил выговор. Лояльность -10`, 'warn');
    this.toast(`${s.name}: выговор`, 'warn');
    this.autoSave();
  },

  fire(id) {
    const s = this.findStaff(id);
    if (!s) return;
    if (!confirm(`Уволить ${s.name}?`)) return;
    State.groups.forEach(g => { g.members = g.members.filter(mid => mid !== id); });
    State.staff = State.staff.filter(x => x.id !== id);
    this.log(`🚫 Уволен: ${s.name}`, 'danger');
    this.toast(`${s.name} уволен`, 'danger');
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
    this.log(`💊 ${s.name} вылечен за ${formatMoney(HEAL_COST)}`, 'success');
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
    this.log(`💊 Вылечено ${wounded.length} чел. за ${formatMoney(cost)}`, 'success');
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

    const available = State.staff.filter(s => !s.wounded);
    if (available.length < 3) return this.toast('Нужно минимум 3 здоровых сотрудника', 'warn');

    const members = available.slice(0, 3).map(s => s.id);
    const g = { id: State.nextGroupId++, name, icon, members, custom: iconSel === '__custom' };
    State.groups.push(g);
    this.log(`🎯 Создана группа «${name}» (${members.length} чел.)`, 'success');
    this.toast(`Группа «${name}» создана`, 'success');
    document.getElementById('group-name').value = '';
    document.getElementById('group-icon-url').value = '';
    const prev = document.getElementById('icon-preview');
    if (prev) prev.innerHTML = '';
    this.renderGroups();
    this.autoSave();
  },

  renderGroups() {
    const el = document.getElementById('groups-list');
    if (!el) return;
    if (State.groups.length === 0) {
      el.innerHTML = '<p class="placeholder">Групп пока нет</p>';
      return;
    }
    el.innerHTML = State.groups.map(g => {
      const alive = g.members.filter(id => {
        const s = this.findStaff(id);
        return s && !s.wounded;
      });
      const woundedCount = g.members.length - alive.length;
      const iconHtml = g.custom
        ? `<img src="${g.icon}" onerror="this.style.opacity=.3">`
        : g.icon;
      return `
        <div class="group-card ${woundedCount > 0 ? 'wounded' : ''}">
          <div class="g-name">${iconHtml} ${g.name}</div>
          <div class="g-info">👥 Готовы: ${alive.length} / ${g.members.length}</div>
          ${woundedCount > 0 ? `<div class="g-info" style="color:#f85149">🏥 Раненых: ${woundedCount}</div>` : ''}
          <div class="g-info">⚡ Статус: ${alive.length >= 1 ? 'готовы' : 'небоеспособна'}</div>
          <button class="btn small danger" style="margin-top:10px" onclick="Game.deleteGroup(${g.id})">Расформировать</button>
        </div>`;
    }).join('');
  },

  deleteGroup(id) {
    State.groups = State.groups.filter(g => g.id !== id);
    this.renderGroups();
    this.log('Группа расформирована', 'warn');
    this.autoSave();
  }
});
// ============================================================
//  ПОЛКОВНИК — Часть 3: операции, розыск, сейвы, UI
// ============================================================

Object.assign(Game, {

  generateEvent() {
    const type = rnd(CRIMES);
    const addr = `${rnd(STREETS)}, д. ${rndInt(1, 120)}`;
    const threat = chance(0.3) ? 'high' : chance(0.5) ? 'medium' : 'low';
    const e = { id: State.nextEventId++, title: type, addr, threat, status: 'pending', createdDay: State.day };
    State.events.push(e);
    this.log(`🚨 ${type} по адресу ${addr}`, 'danger');
    this.toast(`🚨 ${type}!`, 'danger');
    this.renderEvents();
    this.autoSave();
  },

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
          <div class="e-info">
            <div class="e-title">${e.title}</div>
            <div class="e-addr">📍 ${e.addr} · Угроза: ${threatLabel}</div>
          </div>
          <div class="e-actions">
            ${e.status === 'pending' ? `
              <button class="btn small primary" onclick="Game.sendGroup(${e.id})">🎯 Отправить группу</button>
              <button class="btn small" onclick="Game.goSelf(${e.id})">🚗 Выехать лично</button>
              <button class="btn small danger" onclick="Game.ignore(${e.id})">Игнорировать</button>
            ` : `<span class="rank-badge">${e.status}</span>`}
          </div>
        </div>`;
    }).join('');
  },

  sendGroup(eventId) {
    const e = State.events.find(x => x.id === eventId);
    if (!e) return;
    if (State.groups.length === 0) return this.toast('Нет ни одной группы!', 'warn');

    const g = State.groups.find(gr =>
      gr.members.some(id => {
        const s = this.findStaff(id);
        return s && !s.wounded;
      })
    );
    if (!g) return this.toast('Все группы небоеспособны (раненые)', 'danger');

    const fighters = g.members.map(id => this.findStaff(id)).filter(s => s && !s.wounded);
    const avgBravery = fighters.reduce((a, s) => a + s.skills.bravery, 0) / fighters.length;
    const avgIntellect = fighters.reduce((a, s) => a + s.skills.intellect, 0) / fighters.length;
    const successChance = 0.5 + (avgBravery / 100) * 0.25 + (avgIntellect / 100) * 0.15;

    if (chance(successChance)) {
      e.status = '✅ Успех';
      State.money += 20000;
      State.reputation += 3;
      State.myExp += 50;
      fighters.forEach(s => { s.exp += 30; s.fatigue += 15; });
      this.log(`✅ Группа «${g.name}» ликвидировала: ${e.title}. +20000₽`, 'success');
      this.toast('Успех! +20000₽', 'success');
    } else {
      e.status = '❌ Провал';
      State.reputation -= 5;
      State.myExp += 10;
      fighters.forEach(s => {
        s.exp += 10;
        s.fatigue += 25;
        if (chance(0.5)) {
          s.health = rndInt(10, 45);
          s.wounded = true;
          s.healDays = rndInt(2, 5);
          this.log(`🏥 ${s.name} ранен (${s.healDays} дн. больничного)`, 'danger');
        }
      });
      this.log(`❌ Провал операции: ${e.title}. -5 реп.`, 'danger');
      this.toast('Провал! Есть раненые', 'danger');
    }
    this.renderEvents();
    this.renderStaff();
    this.renderGroups();
    this.updateStats();
    this.autoSave();
  },

  goSelf(eventId) {
    const e = State.events.find(x => x.id === eventId);
    if (!e) return;
    if (chance(0.65)) {
      e.status = '✅ Успех (лично)';
      State.money += 15000;
      State.reputation += 5;
      State.myExp += 80;
      this.log(`✅ Полковник лично провёл операцию: ${e.title}`, 'success');
      this.toast('Личный успех! +15000₽', 'success');
    } else {
      e.status = '❌ Провал (лично)';
      State.reputation -= 8;
      State.myExp += 20;
      this.log(`❌ Полковник провалил операцию: ${e.title}`, 'danger');
      this.toast('Провал лично', 'danger');
    }
    this.renderEvents();
    this.updateStats();
    this.autoSave();
  },

  ignore(eventId) {
    const e = State.events.find(x => x.id === eventId);
    if (!e) return;
    e.status = '⚪ Проигнорировано';
    State.reputation -= 3;
    this.log(`⚪ Проигнорировано: ${e.title}. -3 реп.`, 'warn');
    this.renderEvents();
    this.updateStats();
    this.autoSave();
  },

  addWanted() {
    const name = document.getElementById('wanted-name').value.trim();
    const crime = document.getElementById('wanted-crime').value.trim();
    const level = document.getElementById('wanted-level').value;
    if (!name || !crime) return this.toast('Заполните поля', 'warn');
    State.wanted.push({ id: State.nextWantedId++, name, crime, level });
    this.log(`🔍 В розыск (${level}): ${name} — ${crime}`, 'warn');
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
        <button class="btn small" style="margin-top:10px" onclick="Game.catchWanted(${w.id})">🚔 Задержать</button>
      </div>`).join('');
  },

  catchWanted(id) {
    const w = State.wanted.find(x => x.id === id);
    if (!w) return;
    if (chance(0.7)) {
      State.wanted = State.wanted.filter(x => x.id !== id);
      State.money += 30000;
      State.reputation += 4;
      State.myExp += 40;
      this.log(`🚔 Задержан: ${w.name}. +30000₽`, 'success');
      this.toast(`${w.name} задержан`, 'success');
      this.renderWanted();
      this.updateStats();
    } else {
      this.log(`❌ ${w.name} скрылся`, 'danger');
      this.toast('Не удалось задержать', 'danger');
    }
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
    const moneyEl = document.getElementById('stat-money');
    const repEl = document.getElementById('stat-rep');
    const expEl = document.getElementById('stat-exp');
    const staffEl = document.getElementById('stat-staff');
    const hospEl = document.getElementById('stat-hospital');
    const dayEl = document.getElementById('stat-day');

    if (moneyEl) moneyEl.textContent = formatMoney(State.money);
    if (repEl) repEl.textContent = State.reputation;
    if (expEl) expEl.textContent = State.myExp;
    if (staffEl) staffEl.textContent = State.staff.filter(s => !s.wounded).length;
    if (hospEl) hospEl.textContent = State.staff.filter(s => s.wounded).length;
    if (dayEl) dayEl.textContent = State.day;

    const r = getRankByExp(State.org, State.myExp);
    if (r && r.name !== State.myRank) {
      State.myRank = r.name;
      const rankEl = document.getElementById('my-rank');
      if (rankEl) rankEl.textContent = r.name;
      this.log(`🎖️ Ваше звание повышено: ${r.name}`, 'success');
      this.toast(`🎖️ Новое звание: ${r.name}`, 'success');
    }
  },

  // ============ АВТОСОХРАНЕНИЕ ============
  autoSave() {
    try {
      const data = { version: SAVE_VERSION, state: State, savedAt: new Date().toISOString() };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      const ls = document.getElementById('load-slot');
      if (ls) ls.style.display = 'block';
    } catch (e) { console.warn('Ошибка автосейва:', e); }
  },

  loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return this.toast('Сохранений нет', 'warn');
      const data = JSON.parse(raw);
      if (!data.state || !data.state.org) return this.toast('Файл повреждён', 'danger');

      Object.keys(State).forEach(k => { delete State[k]; });
      Object.assign(State, data.state);

      document.getElementById('screen-org').classList.remove('active');
      document.getElementById('screen-office').classList.add('active');
      document.getElementById('org-name').textContent =
        State.org === 'FSB' ? '🔵 ФСБ России' : '🟢 МВД России';
      document.getElementById('my-rank').textContent = State.myRank;

      this.renderAll();
      this.toast('💾 Игра загружена', 'success');
      this.log('💾 Игра загружена из сохранения', 'success');
    } catch (err) {
      this.toast('Ошибка загрузки: ' + err.message, 'danger');
    }
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
    this.renderStaff();
    this.renderHospital();
    this.renderGroups();
    this.renderEvents();
    this.renderWanted();
    this.renderLog();
    this.updateStats();
  }
});

window.addEventListener('DOMContentLoaded', () => Game.init());
