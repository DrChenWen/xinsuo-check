const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path').join(__dirname, '..');

(async () => {
  const html = fs.readFileSync(path + '/index.html', 'utf8');
  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.confirm = () => true;
      window.alert = () => {};
      window.HTMLCanvasElement.prototype.getContext = () => ({
        scale(){}, clearRect(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){},
        fillText(){}, setLineDash(){}, fill(){}, set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){}, set font(v){}, set textAlign(v){}
      });
      Object.defineProperty(window.HTMLCanvasElement.prototype, 'clientWidth', { get(){ return 300; } });
      Object.defineProperty(window.HTMLCanvasElement.prototype, 'clientHeight', { get(){ return 180; } });
      window.URL.createObjectURL = () => 'blob:test';
      window.URL.revokeObjectURL = () => {};
    }
  });
  const { window } = dom;
  const { document } = window;

  const dataCode = fs.readFileSync(path + '/js/data.js', 'utf8');
  const appCode = fs.readFileSync(path + '/js/app.js', 'utf8');
  window.eval(dataCode + '\n' + appCode + '\n;globalThis.__t={pickDZ,pickDL,saveCurrent,switchView,renderCheck,exportData,bindEvents,XINSHUO};');
  window.__t.bindEvents();
  window.__t.renderCheck();

  const today = new Date();
  const ds = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  let pass = 0, fail = 0;
  const eq = (name, got, want) => {
    if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log('  ✓', name); }
    else { fail++; console.log('  ✗', name, '→ got', JSON.stringify(got), 'want', JSON.stringify(want)); }
  };

  // 1. 初始渲染
  eq('对照条目数', document.querySelectorAll('#duizhaoList .item').length, 11);
  eq('独立条目数', document.querySelectorAll('#duliList .item').length, 15);
  eq('日期含今日', document.getElementById('dateText').textContent.includes(ds), true);
  eq('日期含星期', /周[日一二三四五六]/.test(document.getElementById('dateText').textContent), true);

  // 2. 模拟打卡（选择后重绘不应丢失）
  window.__t.pickDZ('xin', 1); window.__t.pickDZ('can', -1); window.__t.pickDZ('kui', 0);
  window.__t.pickDL('man', 2); window.__t.pickDL('sanluan', 3);
  eq('信善选中高亮', !!document.querySelector('#dz-xin .choice-btn.sel-shan'), true);
  eq('惭恶选中高亮', !!document.querySelector('#dz-can .choice-btn.sel-bu'), true);
  eq('愧平选中高亮', !!document.querySelector('#dz-kui .choice-btn.sel-mid'), true);
  eq('慢明显选中', !!document.querySelector('#dl-man .quad-btn.sel-2'), true);
  eq('散乱炽盛选中', !!document.querySelector('#dl-sanluan .quad-btn.sel-3'), true);

  // 3. 札记 + 保存
  document.getElementById('noteReflect').value = '今日与人论事，忽起我慢，觉已晚矣。';
  document.getElementById('notePlan').value = '明日观慢，以无我正见对治。';
  window.__t.saveCurrent();
  const saved = JSON.parse(window.localStorage.getItem('xinsuo_records_v1'));
  eq('记录已保存', !!saved[ds], true);
  eq('dz.xin=1', saved[ds].dz.xin, 1);
  eq('dz.can=-1', saved[ds].dz.can, -1);
  eq('dz.kui=0', saved[ds].dz.kui, 0);
  eq('dl.man=2', saved[ds].dl.man, 2);
  eq('dl.sanluan=3', saved[ds].dl.sanluan, 3);
  eq('札记已存', saved[ds].note.includes('我慢'), true);
  eq('摘要已显示', !document.getElementById('summaryCard').classList.contains('hidden'), true);
  eq('摘要善分', document.getElementById('sumShan').textContent, '0');
  eq('摘要不善', document.getElementById('sumBu').textContent, '5');
  eq('摘要日评', document.getElementById('sumVerdict').textContent, '烦恼现行 · 慎勿随转');
  eq('保存消息', document.getElementById('saveMsg').textContent.includes('已保存'), true);

  // 4. 昨天补一条全善记录
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yds = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
  const recs = JSON.parse(window.localStorage.getItem('xinsuo_records_v1'));
  const goodRec = { dz:{}, dl:{}, note:'', plan:'', savedAt: Date.now()-86400000 };
  const XS = window.__t.XINSHUO;
  XS.duizhao.forEach(it => goodRec.dz[it.key] = 1);
  XS.duli.forEach(it => goodRec.dl[it.key] = 0);
  recs[yds] = goodRec;
  window.localStorage.setItem('xinsuo_records_v1', JSON.stringify(recs));

  // 5. 回顾视图
  window.__t.switchView('review');
  eq('回顾-累计天数', document.getElementById('statDays').textContent, '2');
  eq('回顾-连续', document.getElementById('statStreak').textContent, '2');
  eq('不善排行有条目', document.querySelectorAll('#buRank .rank-item').length, 2);
  eq('不善排行第1是散乱', document.querySelector('#buRank .rank-name').textContent.trim(), '1. 散乱');
  eq('善法排行有条目', document.querySelectorAll('#shanRank .rank-item').length, 11);
  eq('日历有标记', document.querySelectorAll('#calendar .cal-day.has').length, 2);
  eq('昨日日历绿色', document.querySelectorAll('#calendar .cal-day.good').length >= 1, true);

  // 6. 词典视图
  window.__t.switchView('dict');
  eq('词典-善11', document.querySelectorAll('#dictShan .dict-item').length, 11);
  eq('词典-不善26', document.querySelectorAll('#dictBu .dict-item').length, 26);
  eq('词典-其他14', document.querySelectorAll('#dictOther .dict-item').length, 14);
  eq('六位总览7行(含表头)', document.querySelectorAll('#liuweiTable tr').length, 7);

  // 7. 日期切换后草稿保留正确（历史记录可回看）
  window.__t.switchView('check');
  document.getElementById('prevDay').click();
  eq('昨日善分摘要', document.getElementById('sumShan').textContent, '11');
  eq('昨日不善摘要', document.getElementById('sumBu').textContent, '0');
  document.getElementById('todayBtn').click();
  eq('回到今日日期', document.getElementById('dateText').textContent.includes(ds), true);

  // 8. 导出
  window.__t.exportData();
  eq('导出无异常', true, true);

  console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('E2E 异常:', e.message); process.exit(1); });
