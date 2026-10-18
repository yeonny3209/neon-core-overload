'use strict';
/* ═══════════════════════════════════════════════════════════════
   네온 코어 디펜스: 오버로드
   파일 순서대로 이어 붙여 하나의 <script>가 된다 (build.py).
   ═══════════════════════════════════════════════════════════════ */
const W=1280, H=720, TILE=40, COLS=32, ROWS=18, TAU=Math.PI*2, FIX=1/60;
const DEBUG=/[?&]debug/.test(location.search);

const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>a+Math.random()*(b-a);
const d2=(ax,ay,bx,by)=>{ const dx=ax-bx, dy=ay-by; return dx*dx+dy*dy; };
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const fmt=n=>Math.round(n).toLocaleString('ko-KR');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const angDiff=(a,b)=>{ let d=(a-b)%TAU; if(d>Math.PI) d-=TAU; if(d<-Math.PI) d+=TAU; return d; };
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function easeOut(t){ return 1-Math.pow(1-t,3); }
function easeInOut(t){ return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }

/* ═══════════ 저장 ═══════════
   기기(브라우저 저장소)에만 저장한다. 전작과 섞이지 않도록 다른 키를 쓴다. */
const SAVE={
 key:'ncd_overload_v1',
 d:null,
 fresh(){
  return {
   v:1,
   stars:{}, best:{}, hard:{},            // 스테이지별 별 · 최고 기록(초) · 하드 클리어
   cleared:{},                            // 처음 클리어한 스테이지
   seenEnemy:{}, seenBoss:{}, seenTalk:{},
   loadout:{towers:[],skills:[]},
   chaos:[],                              // 아수라장 상위 10판
   chaosMap:'1-1',
   losses:{},                             // 스테이지별 연속 패배
   stats:{time:0,kills:0,games:0,use:{},evo:{}},
   tut:false,
   set:{mus:.7,sfx:.8,fx:'auto'}
  };
 },
 load(){
  let d=null;
  try{ d=JSON.parse(localStorage.getItem(this.key)||'null'); }catch(e){ d=null; }
  const f=this.fresh();
  if(!d||typeof d!=='object') d=f;
  for(const k in f) if(d[k]===undefined) d[k]=f[k];
  for(const k in f.set) if(d.set[k]===undefined) d.set[k]=f.set[k];
  for(const k in f.stats) if(d.stats[k]===undefined) d.stats[k]=f.stats[k];
  this.d=d;
  return d;
 },
 save(){ try{ localStorage.setItem(this.key,JSON.stringify(this.d)); }catch(e){} },
 reset(){ this.d=this.fresh(); this.save(); }
};
SAVE.load();

/* 해금 여부는 클리어 기록에서 계산한다 — 저장 형식이 단순해진다 */
function isCleared(id){ return !!SAVE.d.cleared[id]; }
function totalStars(){ let n=0; for(const k in SAVE.d.stars) n+=SAVE.d.stars[k]; return n; }

/* 간단한 화면 알림 */
function toast(msg,kind){
 const el=document.createElement('div');
 el.className='tst'+(kind?' '+kind:'');
 el.innerHTML=msg;
 $('#toast').appendChild(el);
 setTimeout(()=>el.remove(),2700);
}
function screenFlash(col){
 const f=$('#flash');
 f.style.background='radial-gradient(circle at 50% 50%,'+col+',transparent 65%)';
 f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}
