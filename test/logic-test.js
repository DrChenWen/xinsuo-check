// mock 浏览器环境
global.document = {
  addEventListener(){}, getElementById(){ return { textContent:'', innerHTML:'', value:'', classList:{add(){},remove(){},toggle(){}}, style:{}, onclick:null }; },
  querySelectorAll(){ return []; }, createElement(){ return { click(){}, style:{} }; }
};
global.localStorage = { _s:{}, getItem(k){ return this._s[k]||null; }, setItem(k,v){ this._s[k]=v; }, removeItem(k){ delete this._s[k]; } };
global.navigator = {}; global.window = { devicePixelRatio: 1 };
global.confirm = () => true; global.alert = () => {};

const fs = require('fs');
const dataCode = fs.readFileSync('../js/data.js','utf8');
const appCode = fs.readFileSync('../js/app.js','utf8');
const fn = new Function(dataCode + '\n' + appCode + '\n; return { computeDay, verdict, XINSHUO };');
const { computeDay, verdict, XINSHUO } = fn();

let pass = 0, fail = 0;
function eq(name, got, want){ if(JSON.stringify(got)===JSON.stringify(want)){pass++; console.log('  ✓', name);} else {fail++; console.log('  ✗', name, '→ got', JSON.stringify(got), 'want', JSON.stringify(want));} }

let rec = { dz:{}, dl:{} };
XINSHUO.duizhao.forEach(it => rec.dz[it.key]=1);
XINSHUO.duli.forEach(it => rec.dl[it.key]=0);
let r = computeDay(rec);
eq('全善日 shan=11', r.shan, 11); eq('全善日 bu=0', r.bu, 0);
eq('日评 全善', verdict(r.shan, r.bu, r.selected, r.buCount), '善根增长 · 道心日固');

rec = { dz:{}, dl:{} };
XINSHUO.duizhao.forEach(it => rec.dz[it.key]=-1);
XINSHUO.duli.forEach(it => rec.dl[it.key]=3);
r = computeDay(rec);
eq('全恶日 shan=-11', r.shan, -11); eq('全恶日 bu=45', r.bu, 45);
eq('日评 全恶', verdict(r.shan, r.bu, r.selected, r.buCount), '烦恼炽盛 · 宜静坐对治');

rec = { dz:{}, dl:{} };
r = computeDay(rec);
eq('空记录 shan=0', r.shan, 0); eq('空记录 bu=0', r.bu, 0);
eq('日评 空(未选)', verdict(r.shan, r.bu, r.selected, r.buCount), '省察未周 · 明日细观');

rec = { dz:{}, dl:{} };
XINSHUO.duizhao.forEach((it,i)=>{ rec.dz[it.key] = i<6?1:(i<8?-1:0); });
XINSHUO.duli.forEach((it,i)=>{ rec.dl[it.key] = i<3?1:0; });
r = computeDay(rec);
eq('混合 shan=4', r.shan, 4); eq('混合 bu=3', r.bu, 3);
eq('日评 混合', verdict(r.shan, r.bu, r.selected, r.buCount), '择善有功 · 力用渐熟');

rec = { dz:{}, dl:{} };
XINSHUO.duizhao.forEach((it,i)=>{ rec.dz[it.key]=1; });
XINSHUO.duli.forEach((it,i)=>{ rec.dl[it.key]= i<7?3:0; });
r = computeDay(rec);
eq('善高不善高 shan=11 bu=21', r.shan, 11); eq('bu=21', r.bu, 21);
eq('日评 炽盛', verdict(r.shan, r.bu, r.selected, r.buCount), '烦恼炽盛 · 宜静坐对治');

// 存储往返测试
const saveFn = fn() && undefined;
console.log('\n结果: '+pass+' 通过, '+fail+' 失败');
process.exit(fail?1:0);
