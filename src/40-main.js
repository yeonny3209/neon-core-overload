/* ═══════════ 메인 루프 ═══════════ */
let lastT=0, acc=0, fpsA=0, fpsN=0, fpsGood=0, hudT=0;
function simBlocked(){ return G.paused||G.talking||G.introOpen||G.augPending||G.over&&!G.fx.length; }
function loop(ts){
 requestAnimationFrame(loop);
 if(!lastT){ lastT=ts; return; }
 let dt=(ts-lastT)/1000; lastT=ts;
 if(dt>.25) dt=.25;
 /* 자동 저사양: 느리면 켜고, 한동안 여유가 있어야 끈다 */
 if(G.fxMode==='auto'&&G.scene==='battle'){
  fpsA+=dt; fpsN++;
  if(fpsA>=1.5){ const f=fpsN/fpsA; if(f<44){ G.lowfx=true; fpsGood=0; } else if(G.lowfx&&f>55&&++fpsGood>=6) G.lowfx=false; fpsA=0; fpsN=0; }
 }
 if(G.scene!=='battle') return;
 if(G.cine){ stepCine(dt); render(); return; }
 /* 보스 처치 슬로모션 */
 let sdt=dt;
 if(G.slowmo>0){ G.slowmo-=dt; sdt=dt*.25; }
 if(!simBlocked()){
  acc+=sdt;
  let guard=0;
  while(acc>=FIX&&guard++<8){
   acc-=FIX;
   for(let i=0;i<G.speed;i++){ step(FIX); if(G.cine||G.intro) break; }
   if(G.cine) break;
  }
 } else if(G.over){ stepFx(dt); }
 /* 보스가 화면 안으로 들어온 뒤에 등장 연출을 시작한다 */
 if(G.bossPending&&!G.cine){
  const e=G.bossPending;
  if(!e.alive) G.bossPending=null;
  else if((e.x>e.r&&e.x<W-e.r&&e.y>e.r&&e.y<H-e.r)||e.age>4){ G.bossPending=null; startCine(e); }
 }
 if(G.intro&&!G.cine&&!G.introOpen&&!modalOpen()){ const t=G.intro; G.intro=null; showIntro(t); }
 hudT+=dt;
 if(hudT>.1){ hudT=0; syncHUD(false); }
 tutTick();
 render();
}

/* ═══════════ 생명주기: 화면을 떠나면 확실히 조용하게 ═══════════ */
window.addEventListener('blur',()=>{ if(G.scene==='battle'&&!G.paused&&!G.over) togglePause(true); });
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){ if(G.scene==='battle'&&!G.paused&&!G.over) togglePause(true); SND.pauseAll(); }
 else if(!(G.scene==='battle'&&G.paused)) SND.resumeAll();
});
window.addEventListener('pagehide',ev=>{ if(ev.persisted) SND.pauseAll(); else SND.hardStop(); });
window.addEventListener('unload',()=>SND.hardStop());
/* 안드로이드 앱이 onPause/onResume에서 직접 부른다 */
window.NCD_pause=function(){ if(G.scene==='battle'&&!G.paused&&!G.over) togglePause(true); SND.pauseAll(); };
window.NCD_resume=function(){ if(!(G.scene==='battle'&&G.paused)) SND.resumeAll(); };

/* ═══════════ 시작 ═══════════ */
G.fxMode=SAVE.d.set.fx; G.lowfx=G.fxMode==='low';
show('s-title');
if(!chaosOpen()) $('#t-chaos').style.opacity='.5';
requestAnimationFrame(loop);
if(DEBUG){
 window.__G=G; window.__step=step; window.__render=render; window.__SAVE=SAVE; window.__SND=SND;
 window.__start=startStage; window.__chaos=startChaos; window.__STAGES=STAGES; window.__place=tryPlace;
 window.__up=upgradeTower; window.__takeAug=takeAug; window.__AUGS=AUGS; window.__TOWERS=TOWERS; window.__useSkill=fireSkill;
 window.__spawn=spawnEnemy; window.__callWave=callWave; window.__endCine=endCine;
}
