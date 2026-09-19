// ============================================================
//  ПОЛКОВНИК — Симулятор ведомства
//  ranks.js — система званий (не изменяется)
// ============================================================

const RANKS = {
  FSB: [
    { name: 'Прапорщик',         exp: 0 },
    { name: 'Лейтенант',         exp: 100 },
    { name: 'Ст. лейтенант',     exp: 250 },
    { name: 'Капитан',           exp: 500 },
    { name: 'Майор',             exp: 900 },
    { name: 'Подполковник',      exp: 1400 },
    { name: 'Полковник',         exp: 2000 },
    { name: 'Генерал-майор',     exp: 3000 },
    { name: 'Генерал-лейтенант', exp: 4500 },
    { name: 'Генерал-полковник', exp: 6500 },
    { name: 'Генерал армии',     exp: 9000 },
    { name: 'Маршал',            exp: 15000 }
  ],
  MVD: [
    { name: 'Рядовой',            exp: 0 },
    { name: 'Ефрейтор',           exp: 50 },
    { name: 'Мл. сержант',        exp: 120 },
    { name: 'Сержант',            exp: 200 },
    { name: 'Ст. сержант',        exp: 300 },
    { name: 'Старшина',           exp: 450 },
    { name: 'Прапорщик',          exp: 650 },
    { name: 'Ст. прапорщик',      exp: 900 },
    { name: 'Мл. лейтенант',      exp: 1200 },
    { name: 'Лейтенант',          exp: 1600 },
    { name: 'Ст. лейтенант',      exp: 2100 },
    { name: 'Капитан',            exp: 2700 },
    { name: 'Майор',              exp: 3500 },
    { name: 'Подполковник',       exp: 4500 },
    { name: 'Полковник',          exp: 6000 },
    { name: 'Генерал-майор',      exp: 8000 },
    { name: 'Генерал-лейтенант',  exp: 11000 },
    { name: 'Генерал-полковник',  exp: 15000 },
    { name: 'Генерал полиции РФ', exp: 20000 }
  ]
};

// Получить звание по опыту
function getRankByExp(org, exp) {
  const list = RANKS[org];
  let current = list[0];
  for (const r of list) {
    if (exp >= r.exp) current = r;
    else break;
  }
  return current;
}

// Следующее звание
function getNextRank(org, exp) {
  const list = RANKS[org];
  for (const r of list) {
    if (exp < r.exp) return r;
  }
  return null;
}

// Индекс звания в списке
function getRankIndex(org, rankName) {
  return RANKS[org].findIndex(r => r.name === rankName);
    }
