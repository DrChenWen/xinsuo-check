/* ============================================================
 * 五十心所 · 每日省察 —— 主逻辑
 * 数据存储：localStorage（key: xinsuo_records_v1）
 * 记录结构：{ [date]: { dz:{心所:1|0|-1}, dl:{心所:0..3}, note, plan, savedAt } }
 *   dz（对照条目）: 1=善现前 0=平(无记) -1=不善现前
 *   dl（独立不善）: 0=未现 1=微现 2=明显 3=炽盛
 * ============================================================ */

'use strict';

/* ---------------- 工具 ---------------- */
const $ = id => document.getElementById(id);
const LS_KEY = 'xinsuo_records_v1';

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function todayStr() { return fmtDate(new Date()); }
function weekdayCN(d) { return '日一二三四五六'[d.getDay()]; }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ---------------- 存储 ---------------- */
function loadRecords() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveRecords(recs) { localStorage.setItem(LS_KEY, JSON.stringify(recs)); }

/* ---------------- 状态 ---------------- */
let curDate = todayStr();
let draft = { dz: {}, dl: {}, note: '', plan: '' };

/* 从存储加载当前日期的草稿（仅在日期切换/初始化时调用，避免覆盖进行中的选择） */
function loadDraft() {
  const recs = loadRecords();
  const rec = recs[curDate];
  draft = rec ? {
    dz: { ...(rec.dz || {}) },
    dl: { ...(rec.dl || {}) },
    note: rec.note || '',
    plan: rec.plan || ''
  } : { dz: {}, dl: {}, note: '', plan: '' };
}

/* ---------------- 打卡页渲染 ---------------- */
function renderCheck() {
  $('dateText').textContent = `${curDate} · 周${weekdayCN(parseDate(curDate))}`;

  const recs = loadRecords();
  const rec = recs[curDate];

  // 打卡状态
  const st = $('checkState');
  if (rec && rec.savedAt) { st.textContent = '已省察'; st.classList.add('done'); }
  else { st.textContent = '未省察'; st.classList.remove('done'); }

  // 单元一：对照
  $('duizhaoList').innerHTML = XINSHUO.duizhao.map(it => {
    const v = draft.dz[it.key];
    const sel = n => (v === n ? 'sel-' + (n === 1 ? 'shan' : n === 0 ? 'mid' : 'bu') : 'sel-none');
    return `
    <div class="item" id="dz-${it.key}">
      <div class="item-head" onclick="toggleItem('dz-${it.key}')">
        <span class="item-name">
          <span class="shan-name">${it.shan}</span><span class="vs">↔</span><span class="bu-name">${it.bushan}</span>
        </span>
        <span class="item-toggle">▾</span>
      </div>
      <div class="item-def">
        <p><b>${it.shan}</b>：${it.shanDef}</p>
        <p><b>${it.bushan}</b>：${it.bushanDef}</p>
        <p class="q">「${it.quote}」——${it.src}</p>
      </div>
      <div class="choice-group">
        <button class="choice-btn ${sel(1)}" onclick="pickDZ('${it.key}',1,event)">善现前</button>
        <button class="choice-btn ${sel(0)}" onclick="pickDZ('${it.key}',0,event)">平 · 无记</button>
        <button class="choice-btn ${sel(-1)}" onclick="pickDZ('${it.key}',-1,event)">恶现前</button>
      </div>
    </div>`;
  }).join('');

  // 单元二：独立不善
  $('duliList').innerHTML = XINSHUO.duli.map(it => {
    const v = draft.dl[it.key];
    const sel = n => (v === n ? 'sel-' + n : 'sel-none');
    return `
    <div class="item" id="dl-${it.key}">
      <div class="item-head" onclick="toggleItem('dl-${it.key}')">
        <span class="item-name"><span class="ind-name">${it.name}</span><span class="item-type">${it.type}</span></span>
        <span class="item-toggle">▾</span>
      </div>
      <div class="item-def">
        <p>${it.def}</p>
        ${it.quote && it.quote !== '——' ? `<p class="q">「${it.quote}」——${it.src}</p>` : ''}
      </div>
      <div class="quad-group">
        <button class="quad-btn ${sel(0)}" onclick="pickDL('${it.key}',0,event)">未现</button>
        <button class="quad-btn ${sel(1)}" onclick="pickDL('${it.key}',1,event)">微现</button>
        <button class="quad-btn ${sel(2)}" onclick="pickDL('${it.key}',2,event)">明显</button>
        <button class="quad-btn ${sel(3)}" onclick="pickDL('${it.key}',3,event)">炽盛</button>
      </div>
    </div>`;
  }).join('');

  $('noteReflect').value = draft.note;
  $('notePlan').value = draft.plan;
  $('saveMsg').textContent = '';

  if (rec && rec.savedAt) { updateSummary(rec); } else { $('summaryCard').classList.add('hidden'); }
}

function toggleItem(id) { document.getElementById(id).classList.toggle('open'); }

function pickDZ(key, val) {
  draft.dz[key] = (draft.dz[key] === val ? undefined : val);
  renderCheck(); // 仅重绘 UI，不重建 draft
}
function pickDL(key, val) {
  draft.dl[key] = (draft.dl[key] === val ? undefined : val);
  renderCheck();
}

/* ---------------- 评分与日评 ---------------- */
function computeDay(rec) {
  let shan = 0, shanCount = 0, bu = 0, buCount = 0, selected = 0;
  for (const it of XINSHUO.duizhao) {
    const v = rec.dz[it.key];
    if (v === 1) { shan += 1; shanCount++; selected++; }
    else if (v === -1) { shan -= 1; selected++; }
    else if (v === 0) { selected++; }
  }
  for (const it of XINSHUO.duli) {
    const v = rec.dl[it.key];
    if (v !== undefined && v !== null) { bu += v; if (v >= 1) buCount++; selected++; }
  }
  return { shan, shanCount, bu, buCount, selected };
}

function verdict(s, b, selected, buCount) {
  if (selected !== undefined && selected < 3) return '省察未周 · 明日细观';
  if (b >= 19) return '烦恼炽盛 · 宜静坐对治';
  if (buCount >= 2 && b >= 4) return '烦恼现行 · 慎勿随转';
  if (b >= 9 || s < 0) return '烦恼现行 · 慎勿随转';
  if (s >= 7 && b <= 8) return '善根增长 · 道心日固';
  if (s >= 4 && b <= 12) return '择善有功 · 力用渐熟';
  if (s >= 0 && b <= 8) return '心地平正 · 宜续精进';
  return '平平一日 · 宜加观照';
}

function updateSummary(rec) {
  const r = computeDay(rec);
  $('sumShan').textContent = r.shan;
  $('sumBu').textContent = r.bu;
  $('sumVerdict').textContent = verdict(r.shan, r.bu, r.selected, r.buCount);
  $('summaryCard').classList.remove('hidden');
}

/* ---------------- 保存 ---------------- */
function saveCurrent() {
  const recs = loadRecords();
  const unselDz = XINSHUO.duizhao.filter(it => draft.dz[it.key] === undefined);
  const unselDl = XINSHUO.duli.filter(it => draft.dl[it.key] === undefined);
  const unsel = unselDz.length + unselDl.length;

  if (unsel > 0) {
    if (!confirm(`尚有 ${unsel} 项心所未省察（含 ${unselDz.length} 项对照、${unselDl.length} 项不善）。\n未察者将以「平/未现」计。仍保存？`)) return;
  }

  const rec = {
    dz: { ...draft.dz }, dl: { ...draft.dl },
    note: $('noteReflect').value.trim(),
    plan: $('notePlan').value.trim(),
    savedAt: Date.now()
  };
  recs[curDate] = rec;
  saveRecords(recs);

  updateSummary(rec);
  const st = $('checkState');
  st.textContent = '已省察'; st.classList.add('done');
  const msg = $('saveMsg');
  const r = computeDay(rec);
  msg.textContent = `已保存 · ${curDate} 善分 ${r.shan}/11 · 不善 ${r.bu}/45 · ${verdict(r.shan, r.bu, r.selected, r.buCount)}`;
}

/* ---------------- 回顾页 ---------------- */
function lastNDates(n) {
  const arr = [];
  for (let i = n - 1; i >= 0; i--) arr.push(fmtDate(addDays(new Date(), -i)));
  return arr;
}

function renderReview() {
  const recs = loadRecords();
  const dates = Object.keys(recs).filter(d => recs[d].savedAt).sort();
  const n = dates.length;

  // 统计卡
  $('statDays').textContent = n;
  let streak = 0;
  let probe = new Date();
  if (!recs[fmtDate(probe)]) probe = addDays(probe, -1);
  while (recs[fmtDate(probe)]) { streak++; probe = addDays(probe, -1); }
  $('statStreak').textContent = streak;

  const last7 = lastNDates(7);
  let sSum = 0, bSum = 0, sCnt = 0, bCnt = 0;
  for (const d of last7) {
    if (recs[d]) { const r = computeDay(recs[d]); sSum += r.shan; bSum += r.bu; sCnt++; bCnt++; }
  }
  $('statShanAvg').textContent = sCnt ? (sSum / sCnt).toFixed(1) : '—';
  $('statBuAvg').textContent = bCnt ? (bSum / bCnt).toFixed(1) : '—';

  // 趋势图
  drawTrend(recs, lastNDates(30));

  // 不善排行（近30天）
  const last30 = lastNDates(30);
  const buRank = XINSHUO.duli.map(it => {
    let days = 0, score = 0;
    for (const d of last30) {
      const v = recs[d] && recs[d].dl[it.key];
      if (v !== undefined && v >= 1) { days++; score += v; }
    }
    return { name: it.name, key: it.key, days, score };
  }).filter(x => x.days > 0).sort((a, b) => b.score - a.score || b.days - a.days);

  $('buRank').innerHTML = buRank.length
    ? buRank.map((x, i) => `
      <div class="rank-item">
        <span class="rank-name">${i + 1}. ${x.name}</span>
        <span class="rank-bar bu"><i style="width:${Math.round(x.score / (buRank[0].score || 1) * 100)}%"></i></span>
        <span class="rank-count">${x.days}天</span>
      </div>`).join('')
    : '<p class="rank-empty">三十日内无不善心所显现记录，善哉。</p>';

  // 善法现前（近30天）
  const shanRank = XINSHUO.duizhao.map(it => {
    let good = 0, bad = 0;
    for (const d of last30) {
      const v = recs[d] && recs[d].dz[it.key];
      if (v === 1) good++;
      else if (v === -1) bad++;
    }
    return { name: it.shan, key: it.key, good, bad };
  }).filter(x => x.good > 0 || x.bad > 0).sort((a, b) => b.good - a.good || a.bad - b.bad);

  $('shanRank').innerHTML = shanRank.length
    ? shanRank.map((x, i) => `
      <div class="rank-item">
        <span class="rank-name">${i + 1}. ${x.name}</span>
        <span class="rank-bar shan"><i style="width:${Math.round(x.good / (shanRank[0].good || 1) * 100)}%"></i></span>
        <span class="rank-count">善${x.good}天${x.bad ? ` · 恶${x.bad}天` : ''}</span>
      </div>`).join('')
    : '<p class="rank-empty">三十日内尚无善法现前记录，从今日一念省察始。</p>';

  // 日历
  renderCalendar(recs);
}

/* ---------------- 趋势图（canvas） ---------------- */
function drawTrend(recs, dates) {
  const canvas = $('trendChart');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 320, H = 180;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const padL = 26, padR = 30, padT = 14, padB = 22;
  const iw = W - padL - padR, ih = H - padT - padB;
  const maxShan = 11, maxBu = 45;
  const x = i => padL + iw * i / (dates.length - 1 || 1);
  const yShan = v => padT + ih * (1 - v / maxShan);
  const yBu = v => padT + ih * (1 - v / maxBu);

  // 网格
  ctx.strokeStyle = '#e3dccb'; ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const gy = padT + ih * g / 4;
    ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(W - padR, gy); ctx.stroke();
  }

  // 左轴（善）右轴（不善）
  ctx.fillStyle = '#9a938a'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('11', padL - 4, yShan(11) + 3); ctx.fillText('0', padL - 4, yShan(0) + 3);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#b0543f'; ctx.fillText('45', W - padR + 4, yBu(45) + 3); ctx.fillText('0', W - padR + 4, yBu(0) + 3);

  // 善分线
  ctx.strokeStyle = '#3a7d5c'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  let hasPrev = false;
  dates.forEach((d, i) => {
    const v = recs[d] ? computeDay(recs[d]).shan : null;
    if (v === null) { hasPrev = false; return; }
    const px = x(i), py = yShan(v);
    if (!hasPrev) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    hasPrev = true;
  });
  ctx.stroke();

  // 不善分线
  ctx.strokeStyle = '#b0543f'; ctx.lineWidth = 1.8; ctx.setLineDash([4, 3]);
  ctx.beginPath();
  hasPrev = false;
  dates.forEach((d, i) => {
    const v = recs[d] ? computeDay(recs[d]).bu : null;
    if (v === null) { hasPrev = false; return; }
    const px = x(i), py = yBu(v);
    if (!hasPrev) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    hasPrev = true;
  });
  ctx.stroke(); ctx.setLineDash([]);

  // 底轴标签（每5天一个）
  ctx.fillStyle = '#9a938a'; ctx.textAlign = 'center';
  for (let i = 0; i < dates.length; i += 5) {
    ctx.fillText(dates[i].slice(5), x(i), H - 6);
  }
}

/* ---------------- 日历 ---------------- */
let calYear, calMonth;

function renderCalendar(recs) {
  if (calYear === undefined) { const t = new Date(); calYear = t.getFullYear(); calMonth = t.getMonth(); }
  $('calTitle').textContent = `${calYear}年${calMonth + 1}月`;
  const first = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startWeek = first.getDay();

  const weeks = ['日', '一', '二', '三', '四', '五', '六'];
  let html = '<div class="cal-week">' + weeks.map(w => `<span>${w}</span>`).join('') + '</div><div class="cal-grid">';
  for (let i = 0; i < startWeek; i++) html += '<div class="cal-day empty"></div>';
  const tStr = todayStr();
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = fmtDate(new Date(calYear, calMonth, d));
    const rec = recs[ds];
    let cls = 'cal-day';
    if (rec && rec.savedAt) {
      const r = computeDay(rec);
      if (r.shan >= 3) cls += ' good';
      else if (r.shan < 0 || r.bu >= 18) cls += ' bad';
      else cls += ' mid';
      cls += ' has';
    }
    if (ds === tStr) cls += ' today';
    html += `<div class="${cls}" onclick="goDate('${ds}')">${d}</div>`;
  }
  html += '</div>';
  $('calendar').innerHTML = html;
}

function goDate(ds) {
  curDate = ds;
  loadDraft();
  switchView('check');
  renderCheck();
}

/* ---------------- 词典页 ---------------- */
function renderDict() {
  // 六位总览表
  $('liuweiTable').innerHTML = `
    <table class="liuwei-table">
      <tr><th>位</th><th>数量</th><th>心所</th><th>性质</th></tr>
      ${XINSHUO.liuwei.map(w => `
        <tr><td><b>${w.wei}</b></td><td>${w.n}</td><td>${w.list.join('、')}</td><td>${w.note}</td></tr>`).join('')}
    </table>`;

  // 善心所
  $('dictShan').innerHTML = XINSHUO.duizhao.map(it => `
    <div class="dict-item">
      <h4>${it.shan} <span class="tag tag-shan">善</span><span class="tag tag-bu">对治 ${it.bushan}</span></h4>
      <p>${it.shanDef}</p>
      <p class="q">「${it.quote}」——${it.src}</p>
    </div>`).join('');

  // 不善心所（独立15 + 对照侧11 = 26）
  const buItems = XINSHUO.duli.map(it => `
    <div class="dict-item">
      <h4>${it.name} <span class="tag tag-bu">${it.type}</span></h4>
      <p>${it.def}</p>
      ${it.quote && it.quote !== '——' ? `<p class="q">「${it.quote}」——${it.src}</p>` : ''}
    </div>`).join('');
  const buPair = XINSHUO.duizhao.map(it => `
    <div class="dict-item">
      <h4>${it.bushan} <span class="tag tag-bu">随烦恼</span><span class="tag tag-shan">对治 ${it.shan}</span></h4>
      <p>${it.bushanDef}</p>
      <p class="q">与「${it.shan}」相对照：${it.shanDef}</p>
    </div>`).join('');
  $('dictBu').innerHTML = buItems + buPair;

  // 遍行/别境/不定
  const other = [...XINSHUO.bianxing.map(x => ({ ...x, g: '遍行' })), ...XINSHUO.biejing.map(x => ({ ...x, g: '别境' })), ...XINSHUO.buding.map(x => ({ ...x, g: '不定' }))];
  $('dictOther').innerHTML = other.map(x => `
    <div class="dict-item">
      <h4>${x.name} <span class="tag tag-neu">${x.g}</span></h4>
      <p>${x.def}</p>
    </div>`).join('');
}

/* ---------------- 数据管理 ---------------- */
function exportData() {
  const recs = loadRecords();
  const payload = { app: 'xinsuo-check', version: 1, exportedAt: new Date().toISOString(), records: recs };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `xinsuo-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.records || typeof data.records !== 'object') throw new Error('bad');
      const recs = loadRecords();
      const before = Object.keys(recs).length;
      Object.assign(recs, data.records);
      saveRecords(recs);
      const after = Object.keys(recs).length;
      alert(`导入成功：原有 ${before} 天记录，现共 ${after} 天（同名日期已覆盖）。`);
      renderReview();
    } catch (err) {
      alert('导入失败：文件格式不正确。');
    }
  };
  reader.readAsText(file);
}

function clearAll() {
  if (!confirm('确定清空全部打卡记录？此操作不可恢复！')) return;
  if (!confirm('再次确认：将删除本机所有省察记录（建议先导出备份）。')) return;
  localStorage.removeItem(LS_KEY);
  loadDraft();
  renderCheck();
  alert('已清空全部记录。');
}

/* ---------------- 视图切换 ---------------- */
function switchView(v) {
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  $('view-' + v).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  if (v === 'review') renderReview();
  if (v === 'dict') renderDict();
}

/* ---------------- 事件绑定 ---------------- */
function bindEvents() {
  $('prevDay').onclick = () => { curDate = fmtDate(addDays(parseDate(curDate), -1)); loadDraft(); renderCheck(); };
  $('nextDay').onclick = () => { curDate = fmtDate(addDays(parseDate(curDate), 1)); loadDraft(); renderCheck(); };
  $('todayBtn').onclick = () => { curDate = todayStr(); loadDraft(); renderCheck(); };
  $('saveBtn').onclick = saveCurrent;

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.onclick = () => switchView(b.dataset.view);
  });

  $('calPrev').onclick = () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(loadRecords()); };
  $('calNext').onclick = () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(loadRecords()); };

  $('exportBtn').onclick = exportData;
  $('clearBtn').onclick = clearAll;
  $('importBtn').onclick = () => $('importFile').click();
  $('importFile').onchange = e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; };
}

/* ---------------- 初始化 ---------------- */
function init() {
  bindEvents();
  loadDraft();
  renderCheck();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
