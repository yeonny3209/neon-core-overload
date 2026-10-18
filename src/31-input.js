/* ═══════════ 입력 ═══════════
   터치와 마우스를 똑같이: 상점 카드를 누르고 칸을 누르거나, 카드를 끌어다 놓는다. */
function toLogical(clientX,clientY){
 const r=cv.getBoundingClientRect();
 const x=(clientX-r.left)/r.width*W, y=(clientY-r.top)/r.height*H;
 return {x:x,y:y,tx:Math.floor(x/TILE),ty:Math.floor(y/TILE),inside:clientX>=r.left&&clientX<=r.right&&clientY>=r.top&&clientY<=r.bottom};
}
let drag=null;
function bindShopCard(el,id){
 el.addEventListener('pointerdown',ev=>{
  ev.preventDefault();
  SND.init(); SND.resume();
  drag={id:id,x:ev.clientX,y:ev.clientY,moved:false,el:el,t:performance.now(),pid:ev.pointerId};
  el.setPointerCapture&&el.setPointerCapture(ev.pointerId);
 });
 el.addEventListener('pointermove',ev=>{
  if(!drag||drag.el!==el) return;
  if(!drag.moved&&Math.hypot(ev.clientX-drag.x,ev.clientY-drag.y)>10){ drag.moved=true; G.buy=id; G.aimSkill=null; closePop(); syncShop(); }
  if(drag.moved){ const p=toLogical(ev.clientX,ev.clientY); G.hover=p.inside?p:null; }
 });
 const end=ev=>{
  if(!drag||drag.el!==el) return;
  const d=drag; drag=null;
  if(d.moved){
   const p=toLogical(ev.clientX,ev.clientY);
   if(p.inside&&ev.type==='pointerup') tryPlace(id,p.tx,p.ty);
   G.buy=null; G.hover=null;
  } else if(ev.type==='pointerup'){
   if(performance.now()-d.t>550){ const D=TOWERS[id]; toast('<b>'+D.n+'</b> · '+esc(D.desc)); }
   else { G.buy=G.buy===id?null:id; G.aimSkill=null; closePop(); SND.play('click'); if(G.buy) tip('설치할 칸을 누르세요'); else tip(''); }
  }
  syncShop();
 };
 el.addEventListener('pointerup',end);
 el.addEventListener('pointercancel',end);
}
function canvasTap(p){
 if(G.over||G.cine||G.talking) return;
 if(G.aimSkill!==null){ const i=G.aimSkill; fireSkill(i,p.x,p.y); return; }
 if(G.buy){
  const t=tryPlace(G.buy,p.tx,p.ty);
  if(t){ G.buy=null; tip(''); }
  syncShop();
  return;
 }
 const t=inGrid(p.tx,p.ty)?G.occ[p.ty*COLS+p.tx]:null;
 if(t){ if(G.sel===t) closePop(); else { openPop(t); SND.play('click'); } }
 else closePop();
}
cv.addEventListener('pointermove',ev=>{ if(drag) return; const p=toLogical(ev.clientX,ev.clientY); G.hover=p; });
cv.addEventListener('pointerleave',()=>{ if(!drag) G.hover=null; });
cv.addEventListener('pointerdown',ev=>{ SND.init(); SND.resume(); cv._down={x:ev.clientX,y:ev.clientY}; const p=toLogical(ev.clientX,ev.clientY); G.hover=p; });
cv.addEventListener('pointerup',ev=>{
 const d=cv._down; cv._down=null;
 if(!d||Math.hypot(ev.clientX-d.x,ev.clientY-d.y)>14) return;
 canvasTap(toLogical(ev.clientX,ev.clientY));
});
cv.addEventListener('contextmenu',ev=>{ ev.preventDefault(); G.buy=null; G.aimSkill=null; closePop(); tip(''); syncShop(); });

document.addEventListener('keydown',ev=>{
 if(G.scene!=='battle'||ev.repeat&&ev.code!=='Space') return;
 if(modalOpen()&&ev.code!=='Escape') return;
 const c=ev.code;
 if(/^Digit[1-7]$/.test(c)){ const id=G.loadout[+c.slice(5)-1]; if(id){ G.buy=G.buy===id?null:id; G.aimSkill=null; closePop(); syncShop(); tip(G.buy?'설치할 칸을 누르세요':''); } }
 else if(c==='KeyQ') useSkill(0);
 else if(c==='KeyW') useSkill(1);
 else if(c==='KeyU'&&G.sel){ if(G.sel.lv<2) upgradeTower(G.sel); renderPop(); }
 else if(c==='KeyX'&&G.sel) sellTower(G.sel);
 else if(c==='Space'){ ev.preventDefault(); SND.init(); callWave(); }
 else if(c==='KeyP') togglePause();
 else if(c==='BracketLeft') setSpeed(Math.max(1,G.speed-1));
 else if(c==='BracketRight') setSpeed(Math.min(3,G.speed+1));
 else if(c==='Escape'){
  if(modalOpen()&&!G.over&&!G.augPending&&!G.introOpen){ closeModal(); togglePause(false); return; }
  if(G.buy||G.aimSkill!==null||G.sel){ G.buy=null; G.aimSkill=null; closePop(); tip(''); syncShop(); syncSkills(); }
  else openMenu();
 }
});

/* ── 버튼 ── */
$$('#hud [data-speed]').forEach(b=>b.onclick=()=>{ setSpeed(+b.dataset.speed); SND.play('click'); });
$('#h-pause').onclick=()=>{ togglePause(); };
$('#h-menu').onclick=()=>openMenu();
$('#d-call').onclick=()=>{ SND.init(); SND.resume(); callWave(); };
$('#d-auto').onclick=()=>{ G.auto=!G.auto; SND.play('click'); syncHUD(true); };
$('#d-fold').onclick=()=>{ $('#dock').classList.toggle('fold'); $('#d-fold').textContent=$('#dock').classList.contains('fold')?'▴':'▾'; setTimeout(fitCanvas,220); };
$('#skip-cine').onclick=()=>{ if(G.cine) endCine(); };
$('#t-campaign').onclick=()=>{ SND.init(); SND.resume(); SND.play('build'); openMap(); };
$('#t-chaos').onclick=()=>{
 SND.init(); SND.resume();
 if(!chaosOpen()){ toast('챕터 1 보스(1-6)를 쓰러뜨리면 열려요','bad'); SND.play('nope'); return; }
 SND.play('build'); SND.music('menu'); openPrep(null,'chaos');
};
$('#t-records').onclick=()=>{ SND.init(); SND.play('click'); openRecords(); };
$('#t-codex').onclick=()=>{ SND.init(); SND.play('click'); openCodex(); };
$('#t-settings').onclick=()=>{ SND.init(); SND.play('click'); openSettings(false); };
$('#m-back').onclick=()=>{ SND.play('click'); show('s-title'); };
$('#p-back').onclick=()=>{ SND.play('click'); if(prepMode==='chaos') show('s-title'); else openMap(prepSt.ch); };
$('#p-go').onclick=prepGo;
window.addEventListener('resize',()=>{ if(G.scene==='battle'){ fitCanvas(); placePop(); } if(G.scene==='map') renderMap(); });
