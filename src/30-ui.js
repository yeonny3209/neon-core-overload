/* ═══════════ 화면 전환 ═══════════ */
const SCREENS=['s-title','s-map','s-prep','s-battle'];
function show(id){
 for(const s of SCREENS) $('#'+s).classList.toggle('hide',s!==id);
 G.scene=id.slice(2);
 if(id==='s-battle') requestAnimationFrame(fitCanvas);
 if(id==='s-title') startTitleBG();
}
function openModal(html,cls){
 const s=$('#sheet'); s.className='sheet'+(cls?' '+cls:''); s.innerHTML=html;
 $('#modal').classList.remove('hide');
 return s;
}
function closeModal(){ $('#modal').classList.add('hide'); }
function modalOpen(){ return !$('#modal').classList.contains('hide'); }

/* ═══════════ 타이틀 ═══════════ */
let titleRAF=0;
function startTitleBG(){
 const c=$('#title-bg'), g=c.getContext('2d');
 cancelAnimationFrame(titleRAF);
 const rng=mulberry32(7), blds=[];
 for(let i=0;i<60;i++) blds.push({x:rng(),w:.02+rng()*.05,h:.08+rng()*.26,c:rng()<.5?'#2fe0ff':'#ff4fd8',l:rng()});
 const draw=()=>{
  if(G.scene!=='title') return;
  const w=c.clientWidth, h=c.clientHeight;
  if(c.width!==w||c.height!==h){ c.width=w; c.height=h; }
  const T=performance.now()/1000;
  const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#090418'); gr.addColorStop(.6,'#0b1430'); gr.addColorStop(1,'#04060e');
  g.fillStyle=gr; g.fillRect(0,0,w,h);
  /* 오버로드의 그림자 */
  const ox=w*.5, oy=h*.32, R=Math.min(w,h)*.32;
  g.save(); g.globalAlpha=.55;
  const og=g.createRadialGradient(ox,oy,0,ox,oy,R*1.6); og.addColorStop(0,'rgba(255,40,80,.35)'); og.addColorStop(1,'rgba(255,40,80,0)');
  g.fillStyle=og; g.fillRect(0,0,w,h);
  g.translate(ox,oy); g.rotate(T*.15); g.strokeStyle='rgba(255,77,109,.35)'; g.lineWidth=3; poly(g,0,0,R,3,0); g.stroke();
  g.rotate(-T*.35); g.strokeStyle='rgba(255,194,71,.22)'; poly(g,0,0,R*.82,6,0); g.stroke();
  g.fillStyle='rgba(255,40,80,'+(.25+.1*Math.sin(T*2))+')'; g.beginPath(); g.ellipse(0,0,R*.32,R*.18,0,0,TAU); g.fill();
  g.restore();
  /* 도시 */
  for(const b of blds){
   const bx=b.x*w, bw=b.w*w, bh=b.h*h, by=h-bh;
   g.fillStyle='#070c1c'; g.fillRect(bx,by,bw,bh);
   g.fillStyle=hexA(b.c,.25+.15*Math.sin(T*1.5+b.l*9));
   for(let k=0;k<bh/16;k++) if((k*7+b.l*10|0)%3) g.fillRect(bx+3,by+6+k*16,bw-6,2);
   g.fillStyle=hexA(b.c,.7); g.fillRect(bx,by,bw,1.5);
  }
  const hg=g.createLinearGradient(0,h*.7,0,h); hg.addColorStop(0,'rgba(47,224,255,0)'); hg.addColorStop(1,'rgba(47,224,255,.12)');
  g.fillStyle=hg; g.fillRect(0,h*.7,w,h*.3);
  titleRAF=requestAnimationFrame(draw);
 };
 draw();
}

/* ═══════════ 챕터 지도 ═══════════ */
let mapCh=0, mapHard=false;
function openMap(ch){
 if(ch===undefined){ ch=0; for(let i=0;i<3;i++) if(chapterOpen(i)) ch=i; }
 mapCh=ch;
 show('s-map');
 renderMap();
 SND.init(); SND.resume(); SND.music('menu');
}
function renderMap(){
 const C=CHAPTERS[mapCh];
 $('#m-title').textContent='챕터 '+(mapCh+1)+' · '+C.n+(mapHard?' · 하드':'');
 $('#m-stars').textContent='★ '+totalStars()+' / 54';
 let tabs='';
 for(let i=0;i<3;i++){
  const open=chapterOpen(i);
  tabs+='<button class="btn ch-tab'+(i===mapCh?' on':'')+(open?'':' off')+'" data-ch="'+i+'">'+(i+1)+'. '+CHAPTERS[i].n+(open?'':' <span class="lock">🔒</span>')+'</button>';
 }
 if(hardOpen()) tabs+='<button class="btn ch-tab'+(mapHard?' on':'')+'" id="m-hard" style="border-color:rgba(255,77,109,.6)">하드 모드 '+(mapHard?'켜짐':'꺼짐')+'</button>';
 $('#m-tabs').innerHTML=tabs;
 $('#m-tabs').querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{ mapCh=+b.dataset.ch; SND.play('click'); renderMap(); });
 const hb=$('#m-hard'); if(hb) hb.onclick=()=>{ mapHard=!mapHard; SND.play('click'); renderMap(); };
 const board=$('#m-board');
 board.innerHTML='<canvas id="m-cv"></canvas>';
 const list=STAGES.filter(s=>s.ch===mapCh);
 let next=null;
 for(const s of list){
  const open=stageOpen(s), st=SAVE.d.stars[s.id]||0, hard=SAVE.d.hard[s.id];
  if(open&&!isCleared(s.id)&&!next) next=s;
  const b=document.createElement('button');
  b.className='node'+(s.boss?' boss':'')+(open?'':' lock');
  b.style.left=s.pos[0]+'%'; b.style.top=s.pos[1]+'%';
  b.innerHTML=s.id+'<span class="ns">'+(open?('★'.repeat(st)+'☆'.repeat(3-st)):'🔒')+(hard?' ◆':'')+'</span><span class="nn">'+esc(s.n)+'</span>';
  if(open){
   b.onclick=()=>{ SND.play('click'); openPrep(s); };
   b.onmouseenter=()=>mapInfo(s);
  }
  board.appendChild(b);
  s._el=b;
 }
 if(next&&next._el) next._el.classList.add('next');
 drawMapArt(list);
 mapInfo(next||list[list.length-1]);
}
function mapInfo(s){
 const st=SAVE.d.stars[s.id]||0;
 $('#m-info').innerHTML='<b>'+s.id+' '+esc(s.n)+'</b> · 별 '+st+'/3 · 별 3개 조건: '+esc(starText(s.star))+
  (SAVE.d.best[s.id]?' · 최고 기록 '+Math.floor(SAVE.d.best[s.id]/60)+'분 '+(SAVE.d.best[s.id]%60)+'초':'');
}
function drawMapArt(list){
 const c=$('#m-cv'), r=c.getBoundingClientRect();
 c.width=Math.max(320,r.width*devicePixelRatio); c.height=Math.max(180,r.height*devicePixelRatio);
 const g=c.getContext('2d'), w=c.width, h=c.height, C=CHAPTERS[mapCh], rng=mulberry32(mapCh+3);
 const gr=g.createLinearGradient(0,0,w,h); gr.addColorStop(0,C.bg[0]); gr.addColorStop(1,C.bg[1]); g.fillStyle=gr; g.fillRect(0,0,w,h);
 if(mapCh===0){ for(let i=0;i<50;i++){ const bw=w*(.02+rng()*.04), bh=h*(.15+rng()*.5), bx=rng()*w; g.fillStyle='rgba(16,26,52,.7)'; g.fillRect(bx,h-bh,bw,bh); g.fillStyle=rng()<.5?'rgba(47,224,255,.25)':'rgba(255,79,216,.25)'; for(let k=0;k<bh/14;k++) if(rng()<.5) g.fillRect(bx+3,h-bh+5+k*14,bw-6,2); } }
 else if(mapCh===1){ for(let i=0;i<40;i++){ g.strokeStyle='rgba(120,200,255,'+(.05+rng()*.12)+')'; circ(g,rng()*w,rng()*h,4+rng()*30); g.stroke(); } for(let i=0;i<18;i++){ const bx=rng()*w, bh=h*(.2+rng()*.5); g.fillStyle='rgba(16,40,80,.55)'; g.fillRect(bx,h-bh,w*.03,bh); } }
 else { for(let i=0;i<300;i++){ g.fillStyle='rgba(255,255,255,'+rng()+')'; g.fillRect(rng()*w,rng()*h,1.5,1.5); } g.strokeStyle='rgba(255,194,71,.2)'; g.lineWidth=h*.03; g.beginPath(); g.ellipse(w*.75,h*.3,w*.3,h*.1,-.2,0,TAU); g.stroke();
  g.fillStyle='rgba(255,77,109,.25)'; circ(g,w*.88,h*.38,h*.12); g.fill(); }
 /* 스테이지 연결선 */
 g.lineCap='round';
 for(let i=0;i<list.length-1;i++){
  const a=list[i], b=list[i+1], done=isCleared(a.id);
  g.strokeStyle=done?hexA(C.acc,.85):'rgba(120,140,180,.3)'; g.lineWidth=h*.008; g.setLineDash(done?[]:[h*.012,h*.012]);
  g.beginPath(); g.moveTo(a.pos[0]/100*w,a.pos[1]/100*h); g.lineTo(b.pos[0]/100*w,b.pos[1]/100*h); g.stroke();
 }
 g.setLineDash([]);
}

/* ═══════════ 준비 화면 ═══════════ */
let prepSt=null, prepMode='campaign', prepSel=[], prepSk=[], prepMap='1-2';
function openPrep(st,mode){
 prepMode=mode||'campaign'; prepSt=st;
 const L=SAVE.d.loadout, ut=unlockedTowers(), us=unlockedSkills();
 const need=st&&st.tut?['pulse','sniper','mortar','cryo','amp']:null;
 prepSel=(need||L.towers).filter(id=>ut.indexOf(id)>=0).slice(0,6);
 for(const id of ut){ if(prepSel.length>=Math.min(6,ut.length)) break; if(prepSel.indexOf(id)<0) prepSel.push(id); }
 prepSk=L.skills.filter(id=>us.indexOf(id)>=0).slice(0,2);
 for(const id of us){ if(prepSk.length>=Math.min(2,us.length)) break; if(prepSk.indexOf(id)<0) prepSk.push(id); }
 if(prepMode==='chaos'){ const av=chaosMaps(); if(av.indexOf(SAVE.d.chaosMap)>=0) prepMap=SAVE.d.chaosMap; else prepMap=av[0]; }
 show('s-prep');
 renderPrep();
}
function chaosMaps(){ return CHAOS_MAPS.filter(id=>chapterOpen(STAGE_BY_ID[id].ch)&&(isCleared(id)||STAGE_BY_ID[id].ch<2||chapterOpen(STAGE_BY_ID[id].ch))); }
function renderPrep(){
 const st=prepMode==='chaos'?STAGE_BY_ID[prepMap]:prepSt;
 $('#p-title').textContent=prepMode==='chaos'?'아수라장 준비':(st.id+' '+st.n+(mapHard?' · 하드':''));
 $('#p-back').textContent=prepMode==='chaos'?'← 타이틀':'← 지도';
 const ut=unlockedTowers(), us=unlockedSkills();
 let h='';
 for(const id of TOWER_IDS){
  const D=TOWERS[id], un=ut.indexOf(id)>=0, on=prepSel.indexOf(id)>=0;
  h+='<div class="tcard'+(on?' on':'')+(un?'':' lock')+'" data-t="'+id+'"><canvas data-ic="'+id+'"></canvas><div class="tn">'+D.n+'</div>'+
   '<div class="tc">'+(un?D.cost:'')+'</div><div class="tr" style="color:'+ROLES[D.role].c+'">'+ROLES[D.role].n+'</div></div>';
 }
 $('#p-towers').innerHTML=h;
 $('#p-towers').querySelectorAll('canvas[data-ic]').forEach(c=>towerIcon(c,c.dataset.ic));
 $('#p-towers').querySelectorAll('.tcard').forEach(el=>{
  el.onclick=()=>{
   const id=el.dataset.t;
   if(ut.indexOf(id)<0){ toast(unlockWhere(id)+' 클리어하면 열려요'); return; }
   const i=prepSel.indexOf(id);
   if(i>=0) prepSel.splice(i,1); else if(prepSel.length<6) prepSel.push(id); else { toast('방어탑은 6종까지 데려갈 수 있어요','bad'); SND.play('nope'); return; }
   SND.play('click'); renderPrep();
  };
  el.onmouseenter=()=>{ const D=TOWERS[el.dataset.t]; el.title=D.n+' — '+D.desc; };
 });
 $('#p-count').textContent=prepSel.length+' / 6';
 let sk='';
 for(const id of SKILL_IDS){
  const S2=SKILLS[id], un=us.indexOf(id)>=0, on=prepSk.indexOf(id)>=0;
  sk+='<div class="scard'+(on?' on':'')+(un?'':' lock')+'" data-s="'+id+'"><div class="si">'+S2.i+'</div><div><div class="sn">'+S2.n+(un?'':' 🔒')+'</div><div class="sd">'+S2.d+(S2.cd?' · '+S2.cd+'초':'')+'</div></div></div>';
 }
 $('#p-skills').innerHTML=sk;
 $('#p-skills').querySelectorAll('.scard').forEach(el=>el.onclick=()=>{
  const id=el.dataset.s;
  if(us.indexOf(id)<0){ toast(skillWhere(id)+' 클리어하면 열려요'); return; }
  const i=prepSk.indexOf(id);
  if(i>=0) prepSk.splice(i,1); else if(prepSk.length<2) prepSk.push(id); else { prepSk.shift(); prepSk.push(id); }
  SND.play('click'); renderPrep();
 });
 $('#p-scount').textContent=prepSk.length+' / 2';
 /* 정찰 보고 */
 let I='';
 if(prepMode==='chaos'){
  const av=chaosMaps();
  I+='<div class="intel-row" style="flex-direction:column;align-items:flex-start;gap:6px"><b>전장</b><div class="chips">'+
   av.map(id=>'<button class="btn sm'+(id===prepMap?' on':'')+'" data-map="'+id+'">'+id+' '+STAGE_BY_ID[id].n+'</button>').join('')+'</div></div>';
  const best=SAVE.d.chaos[0];
  I+='<div class="intel-row">최고 기록: '+(best?'<b>웨이브 '+best.wave+'</b> · '+fmt(best.score)+'점':'아직 없음')+'</div>';
  I+='<div class="intel-row" style="line-height:1.6;color:var(--mute)">적이 끝없이 강해집니다. 3웨이브마다 증강 3장 중 하나를 고르고, 10웨이브마다 거대 보스가 나와요.</div>';
 } else {
  const seen=SAVE.d.seenEnemy, types=[...new Set(buildWaves(st).flat().map(g=>g[0]))];
  I+='<div class="intel-row" style="flex-direction:column;align-items:flex-start;gap:6px"><b>등장하는 적</b><div class="chips">'+
   types.map(t=>{ const D=ENEMIES[t]; const nw=!seen[t]&&!D.giant; return '<span class="chip'+(D.giant?' boss':(nw?' new':''))+'" title="'+esc(D.d||'')+'">'+(nw?'NEW ':'')+D.n+'</span>'; }).join('')+'</div></div>';
  const tr=[]; const T2=st.terr||{};
  if(T2.energy) tr.push('에너지 칸 (탑 피해 +20%)'); if(T2.pads) tr.push('가속 패드 (적 3초 빨라짐)'); if(T2.em) tr.push('전자기장 (사거리 -20%)');
  if(T2.coolant) tr.push('냉각수 (냉기 탑 2배)'); if(T2.blackout) tr.push('정전 이벤트'); if(T2.moving) tr.push('움직이는 에너지 칸');
  I+='<div class="intel-row" style="flex-direction:column;align-items:flex-start;gap:4px"><b>지형</b><span style="color:var(--mute)">'+(tr.join(' · ')||'특별한 지형 없음')+'</span></div>';
  I+='<div class="intel-row" style="flex-direction:column;align-items:flex-start;gap:4px"><b>별 조건</b><div class="star-cond">'+
   '<div><span class="st">★</span>클리어</div><div><span class="st">★★</span>코어 내구도 절반 이상 지키기</div><div><span class="st">★★★</span>'+esc(starText(st.star))+'</div></div></div>';
  I+='<div class="intel-row">웨이브 '+st.waves+(st.boss?' + 거대 보스':'')+' · 시작 에너지 '+CH_START[st.ch]+(mapHard?' · <b style="color:#ff8da1">하드: 적 체력 1.6배</b>':'')+'</div>';
  const loss=SAVE.d.losses[st.id]||0;
  if(loss>=3){
   const tips=types.filter(t=>ENEMIES[t].tip&&!ENEMIES[t].giant).slice(-2).map(t=>'<b>'+ENEMIES[t].n+'</b>: '+ENEMIES[t].tip);
   I+='<div class="intel-row" style="flex-direction:column;align-items:flex-start;gap:4px;color:#c9ffe4"><b>💡 도움말</b>'+tips.join('<br>')+'</div>';
  }
 }
 $('#p-intel').innerHTML=I;
 $('#p-intel').querySelectorAll('[data-map]').forEach(b=>b.onclick=()=>{ prepMap=b.dataset.map; SAVE.d.chaosMap=prepMap; SND.play('click'); renderPrep(); });
 $('#p-go').classList.toggle('off',prepSel.length<1);
}
function unlockWhere(id){ const s=STAGES.find(s=>s.unlock.tower===id); return s?s.id+' '+s.n+'을(를)':'?'; }
function skillWhere(id){ const s=STAGES.find(s=>s.unlock.skill===id); return s?s.id+' '+s.n+'을(를)':'?'; }
function prepGo(){
 if(!prepSel.length) return;
 SAVE.d.loadout={towers:prepSel.slice(),skills:prepSk.slice()}; SAVE.save();
 SND.play('wave');
 if(prepMode==='chaos') startChaos(prepMap,prepSel,prepSk);
 else startStage(prepSt,mapHard,prepSel,prepSk);
}

/* ═══════════ 전투 화면 ═══════════ */
function enterBattle(){
 show('s-battle');
 BG=null;
 $('#h-stage').textContent=G.mode==='chaos'?'아수라장 · '+G.st.n:(G.st.id+' '+G.st.n+(G.hard?' · 하드':''));
 $('#dock').classList.remove('fold');
 buildShop(); buildSkills(); syncHUD(true); closePop(); tip('');
 setSpeed(1); G.paused=false; $('#h-pause').textContent='❚❚';
 SND.init(); SND.resume(); SND.music(musicFor());
 SND.intensity=.25;
}
function fitCanvas(){
 const st=$('#stage'); if(!st) return;
 const r=st.getBoundingClientRect();
 const s=Math.min(r.width/W,r.height/H);
 cv.style.width=Math.floor(W*s)+'px'; cv.style.height=Math.floor(H*s)+'px';
 G.viewScale=s;
}
function buildShop(){
 const box=$('#shop'); box.innerHTML='';
 G.loadout.forEach((id,i)=>{
  const D=TOWERS[id], el=document.createElement('div');
  el.className='scard2'; el.dataset.t=id;
  el.innerHTML='<span class="hk">'+(i+1)+'</span><canvas></canvas><div class="n">'+D.n+'</div><div class="c">'+buildCost(id)+'</div>';
  towerIcon(el.querySelector('canvas'),id);
  box.appendChild(el);
  bindShopCard(el,id);
 });
 syncShop();
}
function syncShop(){
 $$('#shop .scard2').forEach(el=>{
  const id=el.dataset.t, c=buildCost(id);
  el.classList.toggle('on',G.buy===id);
  el.classList.toggle('poor',G.gold<c||!!canBuildType(id));
  el.querySelector('.c').textContent=c;
 });
}
function buildSkills(){
 const box=$('#skills');
 box.innerHTML='';
 G.skills.forEach((s,i)=>{
  const S2=SKILLS[s.id], b=document.createElement('button');
  b.className='skbtn'; b.dataset.i=i;
  b.innerHTML='<span class="hk">'+(i===0?'Q':'W')+'</span><span class="cd"></span><span class="i">'+S2.i+'</span><span class="n">'+S2.n+'</span><span class="ct"></span>';
  b.onclick=()=>{ SND.init(); useSkill(i); };
  box.appendChild(b);
 });
 syncSkills();
}
function syncSkills(){
 $$('#skills .skbtn').forEach(b=>{
  const s=G.skills[+b.dataset.i]; if(!s) return;
  const S2=SKILLS[s.id], ready=skillReady(s);
  const tot=S2.cd*skillCdMul()||1, f=s.id==='repair'?(s.uses>0?0:1):clamp(s.cd/tot,0,1);
  b.querySelector('.cd').style.height=(f*100)+'%';
  b.querySelector('.ct').textContent=s.id==='repair'?(s.uses>0?'×'+s.uses:''):(s.cd>0?Math.ceil(s.cd):'');
  b.classList.toggle('ready',ready&&!G.over);
  b.classList.toggle('aim',G.aimSkill===+b.dataset.i);
  b.classList.toggle('off',G.aug.time_lord&&s.id!=='freeze');
 });
}
let hudCache={};
function syncHUD(force){
 const set=(id,v)=>{ if(force||hudCache[id]!==v){ hudCache[id]=v; $(id).textContent=v; } };
 set('#h-wave',G.mode==='chaos'?String(G.wave):G.wave+'/'+G.totalWaves);
 set('#h-gold',fmt(G.gold));
 set('#h-life',G.lives+(G.maxLives!==20?'/'+G.maxLives:''));
 $('#h-life').parentNode.classList.toggle('low',G.lives<=5);
 $('#h-shield-box').classList.toggle('hide',G.cShield<=0);
 set('#h-shield',String(G.cShield));
 const call=$('#d-call'), sub=$('#d-callsub');
 let txt, s2;
 if(G.over){ txt='종료'; s2=''; }
 else if(!G.waveOn){ const b=Math.round(Math.ceil(G.prep)*3*(G.aug.wave_gold?3:1)*(G.mode==='chaos'?1:CH_GOLD[G.st.ch])); txt='웨이브 '+(G.wave+1)+' 호출'; s2=(G.prep>0?Math.ceil(G.prep)+'초 · +'+b:'Space'); }
 else if(!G.queue.length&&G.wave<G.totalWaves){ txt='다음 웨이브 당기기'; s2='Space'; }
 else { txt='교전 중'; s2=G.queue.length+'기 남음'; }
 if(force||hudCache.call!==txt+s2){ hudCache.call=txt+s2; call.firstChild.textContent=txt; sub.textContent=s2; call.classList.toggle('busy',G.waveOn&&!!G.queue.length); }
 $('#d-auto').classList.toggle('on',G.auto);
 syncShop(); syncSkills();
 if(G.sel) syncPop();
}
function setSpeed(n){ G.speed=n; $$('#hud [data-speed]').forEach(b=>b.classList.toggle('on',+b.dataset.speed===n)); }
function togglePause(force){
 if(G.scene!=='battle'||G.over) return;
 G.paused=force!==undefined?force:!G.paused;
 $('#h-pause').textContent=G.paused?'▶':'❚❚';
 if(G.paused) SND.pauseAll(); else SND.resumeAll();
}
function banner(txt,sub,bad){
 const b=$('#banner');
 b.querySelector('.b-txt').textContent=txt; b.querySelector('.b-sub').textContent=sub||'';
 b.classList.toggle('bad',!!bad);
 b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}
function tip(msg){ const t=$('#tip'); if(!msg){ t.classList.add('hide'); return; } t.textContent=msg; t.classList.remove('hide'); }

/* ── 탑 정보 팝업 ── */
function openPop(t){
 G.sel=t; G.buy=null;
 renderPop(); syncShop();
}
function closePop(){ G.sel=null; $('#pop').classList.add('hide'); }
function renderPop(){
 const t=G.sel, p=$('#pop');
 if(!t){ p.classList.add('hide'); return; }
 const D=t.D;
 let rows='';
 const w0=t.wep[0], x=S(t,w0);
 const lab={dmg:'피해',dps:'초당 피해',rate:'초당 공격',rng:'사거리',splash:'폭발 범위',slow:'감속',chains:'연쇄',bounce:'튕김',inc:'웨이브당 에너지',shield:'웨이브당 보호막',aDmg:'오라 피해',aRate:'오라 연사',aCrit:'오라 치명타',max:'최대 지뢰',weak:'약점 노출',root:'속박(초)'};
 for(const k in lab){ if(x[k]===undefined) continue; let v=x[k];
  if(k==='rng') v=Math.round(v/TILE*10)/10+'칸';
  else if(k==='slow'||k==='aDmg'||k==='aRate'||k==='aCrit'||k==='weak') v=Math.round(v*100)+'%';
  else if(k==='rate') v=Math.round(v*100)/100;
  else v=fmt(v);
  rows+='<span>'+lab[k]+'</span><b>'+v+'</b>'; }
 rows+='<span>처치</span><b>'+t.kills+'</b><span>누적 피해</span><b>'+fmt(t.dmgDone)+'</b>';
 const lvTxt=t.evo?(t.evo2?'이중 진화':'진화 '+t.evo):'LV '+(t.lv+1);
 let acts='';
 if(t.lv<2){ const c=upCost(t); acts+='<button class="btn" id="pp-up">강화 <span class="cost">'+c+'</span></button>'; }
 let evo='';
 if(t.lv===2&&!t.evo){
  const c=upCost(t);
  evo='<div class="evo">'+['A','B'].map(k=>'<button class="btn '+k.toLowerCase()+'" data-evo="'+k+'"><b>'+k+' · '+D.evo[k].n+'</b><span>'+D.evo[k].d+'</span><span class="cost">'+c+'</span></button>').join('')+'</div>';
 } else if(t.evo&&!t.evo2&&G.aug.infinite_evo){
  const o=t.evo==='A'?'B':'A';
  evo='<div class="evo"><button class="btn" data-evo="'+o+'" style="grid-column:span 2"><b>무한 진화 · '+D.evo[o].n+'</b><span>'+D.evo[o].d+'</span><span class="cost">'+nextCost(t)+'</span></button></div>';
 }
 acts+='<button class="btn danger" id="pp-sell">해체 <span class="cost">+'+Math.round(t.spent*(G.aug.sell_full?1:.7))+'</span></button>';
 let modes='';
 if(!D.sup&&['gravpull','timewarp','froststorm','storm'].indexOf(w0.s.kind)<0) modes='<div class="modes">'+TARGET_MODES.map(m=>'<button class="btn sm'+(t.mode===m[0]?' on':'')+'" data-mode="'+m[0]+'">'+m[1]+'</button>').join('')+'</div>';
 const desc=t.evo?(t.evo2?D.evo.A.d+' / '+D.evo.B.d:D.evo[t.evo].d):D.desc;
 const terr=(t.onEnergy?'<span class="chip" style="color:#2fe0ff">에너지 칸</span> ':'')+(t.onCool&&t.id==='cryo'?'<span class="chip" style="color:#5aa8ff">냉각수</span> ':'')+(t.inEm?'<span class="chip" style="color:#a98bff">전자기장</span> ':'')+(t.jam>G.time?'<span class="chip" style="color:#ffd34d">정지됨</span>':'');
 p.innerHTML='<div class="ph"><canvas id="pp-ic"></canvas><div><div class="pn">'+esc(towerName(t))+'</div><div class="pl">'+ROLES[D.role].n+' · '+lvTxt+'</div></div><button class="btn sm ghost px" id="pp-x">✕</button></div>'+
  '<div class="prow">'+rows+'</div>'+(terr?'<div style="margin-bottom:6px">'+terr+'</div>':'')+'<div class="pdesc">'+esc(desc)+'</div><div class="pacts">'+acts+'</div>'+evo+modes;
 towerIcon($('#pp-ic'),t.id,t.evo,t.evo2,t.lv);
 p.classList.remove('hide');
 $('#pp-x').onclick=closePop;
 const up=$('#pp-up'); if(up) up.onclick=()=>{ upgradeTower(t); renderPop(); };
 p.querySelectorAll('[data-evo]').forEach(b=>b.onclick=()=>{ upgradeTower(t,b.dataset.evo); renderPop(); });
 $('#pp-sell').onclick=()=>sellTower(t);
 p.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{ t.mode=b.dataset.mode; SND.play('click'); renderPop(); });
 placePop();
}
function placePop(){
 const t=G.sel, p=$('#pop'); if(!t) return;
 const r=cv.getBoundingClientRect(), sr=$('#stage').getBoundingClientRect(), s=r.width/W;
 let x=r.left-sr.left+t.x*s+30, y=r.top-sr.top+t.y*s-60;
 const pw=p.offsetWidth||268, ph=p.offsetHeight||300;
 if(x+pw>sr.width-6) x=r.left-sr.left+t.x*s-30-pw;
 x=clamp(x,6,sr.width-pw-6); y=clamp(y,6,sr.height-ph-6);
 p.style.left=x+'px'; p.style.top=y+'px';
}
let popSig='';
function syncPop(){
 const t=G.sel;
 if(!t||G.towers.indexOf(t)<0){ closePop(); return; }
 const sig=G.gold>=(t.lv<2||!t.evo?upCost(t):nextCost(t))?'1':'0';
 const pc=$('#pp-up'); if(pc) pc.classList.toggle('off',G.gold<upCost(t));
 $$('#pop [data-evo]').forEach(b=>b.classList.toggle('off',G.gold<(t.evo?nextCost(t):upCost(t))));
 popSig=sig;
}

/* ── 대사 ── */
function talk(lines,cb){
 G.talking=true;
 let i=0;
 const st=$('#stage');
 const el=document.createElement('div');
 st.appendChild(el);
 const next=()=>{
  if(i>=lines.length){ el.remove(); G.talking=false; if(cb) cb(); return; }
  const [who,txt]=lines[i++];
  const ol=who==='ol';
  el.className='talk'+(ol?' ol':'');
  el.innerHTML='<div class="av">'+(ol?'👁':'✦')+'</div><div><div class="who">'+(ol?'오버로드':'오퍼레이터 리나')+'</div><div class="say">'+esc(txt)+'</div><div class="nx">눌러서 계속 ▸</div></div>';
  SND.play('click');
 };
 el.onclick=next;
 next();
}

/* ── 새 적 소개 ── */
function showIntro(type){
 const D=ENEMIES[type];
 SAVE.d.seenEnemy[type]=1; SAVE.save();
 G.introOpen=true;
 const s=openModal('<div class="intro"><canvas id="in-cv"></canvas><div><div class="ik">NEW ENEMY</div><h3>'+D.n+'</h3><p>'+esc(D.d)+'</p><div class="tip">💡 '+esc(D.tip||'')+'</div></div></div><div class="row"><button class="btn big" id="in-ok">알겠어요</button></div>','narrow');
 enemyIcon($('#in-cv'),type);
 $('#in-ok').onclick=()=>{ closeModal(); G.introOpen=false; };
 SND.play('augshow');
}

/* ── 보스 등장 연출 ── */
function startCine(e){
 const seen=!!SAVE.d.seenBoss[e.type];
 SAVE.d.seenBoss[e.type]=1; SAVE.save();
 G.cine={t:0,dur:3.2,e:e};
 const bn=$('#bossname');
 bn.innerHTML='<div class="bn-k">WARNING · GIANT BOSS</div><div class="bn-n">'+e.D.n+'</div><div class="bn-q">“'+esc(e.D.quote)+'”</div>';
 bn.classList.remove('hide');
 $('#skip-cine').hidden=!seen;
 SND.play('bossin');
 SND.music(CHAPTERS[Math.min(2,G.st.ch)].boss);
 SND.intensity=1;
 closePop();
}
function stepCine(dt){
 const c=G.cine; c.t+=dt;
 const k=c.t/c.dur, e=c.e;
 const tz=1.7, tx=clamp(e.x,W/2/tz,W-W/2/tz), ty=clamp(e.y,H/2/tz,H-H/2/tz);
 let f=k<.25?easeInOut(k/.25):(k>.8?1-easeInOut((k-.8)/.2):1);
 G.cam.z=1+(tz-1)*f; G.cam.x=lerp(W/2,tx,f); G.cam.y=lerp(H/2,ty,f);
 if(c.t>=c.dur) endCine();
}
function endCine(){
 G.cine=null; G.cam={x:W/2,y:H/2,z:1};
 $('#bossname').classList.add('hide'); $('#skip-cine').hidden=true;
 banner('보스전','약점(빛나는 점) 쪽에서 쏘면 피해 2배',true);
}

/* ── 증강 선택 ── */
function showAugPick(picks){
 SND.play('augshow');
 const four=picks.length>3;
 const s=openModal('<div class="kicker">AUGMENT · WAVE '+G.wave+'</div><h2>증강을 하나 고르세요</h2><p class="lead">고른 증강은 이번 판 끝까지 유지됩니다. 보유 '+G.augList.length+'개</p>'+
  '<div class="augs'+(four?' four':'')+'">'+picks.map(a=>'<button class="aug r'+a[1]+'" data-a="'+a[0]+'"><span class="ar">'+RARITY[a[1]].n+'</span><span class="an">'+esc(a[2])+'</span><span class="ad">'+esc(a[3])+'</span></button>').join('')+'</div>'+
  (G.augList.length?'<div class="auglist">'+G.augList.map(a=>'<span class="chip" style="color:'+RARITY[a[1]].c+'">'+esc(a[2])+'</span>').join('')+'</div>':''));
 s.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ closeModal(); takeAug(b.dataset.a); });
}
function showSeventhPick(){
 const opts=unlockedTowers().filter(id=>G.loadout.indexOf(id)<0);
 G.augPending=true;
 const s=openModal('<div class="kicker">일곱 번째 칸</div><h2>탑을 하나 더 고르세요</h2><div class="prep-towers" style="margin-top:12px">'+
  opts.map(id=>'<div class="tcard" data-t="'+id+'"><canvas data-ic="'+id+'"></canvas><div class="tn">'+TOWERS[id].n+'</div><div class="tc">'+TOWERS[id].cost+'</div></div>').join('')+'</div>');
 s.querySelectorAll('canvas[data-ic]').forEach(c=>towerIcon(c,c.dataset.ic));
 s.querySelectorAll('[data-t]').forEach(el=>el.onclick=()=>{ G.loadout.push(el.dataset.t); closeModal(); G.augPending=false; buildShop(); SND.play('build'); });
}

/* ── 결과 ── */
function showResult(r){
 const st=G.st, S2=G.stats;
 let h='';
 if(G.mode==='chaos'){
  const best=SAVE.d.chaos[0], isBest=best&&best.wave===G.wave&&Math.round(S2.score)===best.score;
  h+='<div class="kicker'+(r.win?'':' bad')+'">CHAOS · RESULT</div><h2>웨이브 '+G.wave+' 도달</h2><p class="lead">'+(isBest?'🏆 새 최고 기록!':'최고 기록: 웨이브 '+(best?best.wave:0))+'</p>';
 } else if(r.win){
  h+='<div class="kicker">STAGE CLEAR</div><h2>'+st.id+' '+esc(st.n)+(G.hard?' · 하드':'')+'</h2>';
  h+='<div class="res-stars">'+[0,1,2].map(i=>'<span class="res-star '+(i<r.stars?'got':'miss')+'" style="animation-delay:'+(.25+i*.35)+'s">★</span>').join('')+'</div>';
  h+='<div class="res-conds"><div><span>클리어</span><span class="ok">✓</span></div><div><span>코어 내구도 절반 이상</span><span class="'+(r.half?'ok':'no')+'">'+(r.half?'✓':G.lives+'/'+G.maxLives)+'</span></div>'+
   '<div><span>'+esc(starText(st.star))+'</span><span class="'+(r.cond?'ok':'no')+'">'+(r.cond?'✓':'✗')+'</span></div></div>';
 } else {
  h+='<div class="kicker bad">DEFEAT</div><h2>코어가 무너졌어요</h2>';
  if(r.near) h+='<p class="near">보스 체력 '+r.near+'% 남음 — 거의 다 왔어요!</p>';
  else h+='<p class="lead">웨이브 '+G.wave+'/'+G.totalWaves+'까지 버텼어요.</p>';
  const loss=SAVE.d.losses[st.id]||0;
  if(loss>=3) h+='<p class="lead" style="color:#c9ffe4">💡 준비 화면의 도움말에서 이 스테이지에 맞는 탑을 확인해 보세요.</p>';
 }
 h+='<div class="res-stats"><div><b>'+fmt(S2.score)+'</b><span>점수</span></div><div><b>'+S2.kills+'</b><span>처치</span></div><div><b>'+Math.floor(G.time/60)+':'+String(Math.floor(G.time%60)).padStart(2,'0')+'</b><span>시간</span></div><div><b>'+S2.evos+'</b><span>진화</span></div></div>';
 const u=r.unlock;
 if(u&&(u.tower||u.skill)){
  const name=u.tower?TOWERS[u.tower].n:SKILLS[u.skill].n;
  h+='<div class="unlock"><div class="card"><div class="face back">?</div><div class="face front">'+(u.tower?'<canvas id="ul-cv"></canvas>':'<div style="font-size:44px">'+SKILLS[u.skill].i+'</div>')+'<span>UNLOCKED</span><b>'+name+'</b></div></div></div>';
  if(u.tower&&u.skill) h+='<p class="lead" style="text-align:center;margin-top:8px">사령관 스킬 <b>'+SKILLS[u.skill].n+'</b>도 열렸어요!</p>';
 }
 if(u&&u.hard) h+='<p class="lead" style="text-align:center;color:#ffd0d8;margin-top:10px">🎉 축하해요! <b>하드 모드</b>가 열렸어요. 지도에서 켤 수 있어요.</p>';
 if(u&&u.skin) h+='<p class="lead" style="text-align:center;margin-top:10px">✨ <b>황금 진화 외형</b>이 열렸어요. 진화한 탑이 금빛으로 빛나요.</p>';
 if(st&&st.id==='1-6'&&r.win&&r.first) h+='<p class="lead" style="text-align:center;color:#ffb3f0;margin-top:10px">🌀 <b>아수라장</b> 모드가 열렸어요!</p>';
 const nextSt=G.mode==='campaign'&&r.win?STAGES[st.idx+1]:null;
 h+='<div class="row">'+
  (nextSt?'<button class="btn big" id="r-next">다음 스테이지 ▶</button>':'')+
  '<button class="btn'+(nextSt?'':' big')+'" id="r-again">다시 하기</button>'+
  '<button class="btn" id="r-map">'+(G.mode==='chaos'?'타이틀':'지도')+'</button>'+
  '<button class="btn ghost" id="r-card">결과 카드</button></div>';
 openModal(h);
 if(u&&u.tower){ towerIcon($('#ul-cv'),u.tower); setTimeout(()=>SND.play('unlock'),1300); }
 if(r.win&&G.mode==='campaign') for(let i=0;i<r.stars;i++) setTimeout(()=>SND.play('star'),300+i*350);
 if(st&&st.id==='3-6'&&r.win&&r.first) setTimeout(showEnding,400);
 const nx=$('#r-next'); if(nx) nx.onclick=()=>{ closeModal(); openPrep(nextSt); };
 $('#r-again').onclick=()=>{ closeModal(); if(G.mode==='chaos') startChaos(G.mapId,G.loadout.slice(0,6),G.skills.map(s=>s.id)); else startStage(st,G.hard,SAVE.d.loadout.towers,SAVE.d.loadout.skills); };
 $('#r-map').onclick=()=>{ closeModal(); if(G.mode==='chaos') show('s-title'); else openMap(st.ch); };
 $('#r-card').onclick=()=>showCard(r);
}
function showEnding(){
 const s=openModal('<div class="kicker">ENDING</div><h2>도시에 다시 불이 켜졌어요</h2><p class="lead">오버로드가 사라지자 코어 궤도에서 빛이 쏟아져 내려, 꺼져 가던 네온 시가지에 하나둘 불빛이 돌아왔습니다.</p>'+
  '<div class="talk" style="position:static;transform:none;width:100%;margin-top:6px"><div class="av">✦</div><div><div class="who">오퍼레이터 리나</div><div class="say">해냈어요, 사령관님! 이제 하드 모드와 아수라장에서 진짜 실력을 보여 주세요.</div></div></div>'+
  '<div class="row"><button class="btn big gold" id="end-ok">고마워!</button></div>','narrow');
 $('#end-ok').onclick=()=>{ closeModal(); showResult({win:true,stars:SAVE.d.stars['3-6'],half:true,cond:starCheck(G.st),first:false,unlock:{hard:1}}); };
}
function makeCard(r){
 const c=document.createElement('canvas'); c.width=1200; c.height=630;
 const g=c.getContext('2d');
 const gr=g.createLinearGradient(0,0,1200,630); gr.addColorStop(0,'#0a1430'); gr.addColorStop(1,'#1a0828');
 g.fillStyle=gr; g.fillRect(0,0,1200,630);
 g.strokeStyle='#2fe0ff'; g.lineWidth=6; rrect(g,18,18,1164,594,26); g.stroke();
 g.strokeStyle='rgba(255,79,216,.6)'; g.lineWidth=2; rrect(g,32,32,1136,566,20); g.stroke();
 g.fillStyle='#2fe0ff'; g.font='700 22px Orbitron, sans-serif'; g.fillText('NEON CORE DEFENSE · OVERLOAD',70,90);
 g.fillStyle='#ffffff'; g.font='800 64px sans-serif';
 g.fillText(G.mode==='chaos'?'아수라장 웨이브 '+G.wave:(G.st.id+' '+G.st.n),70,180);
 if(G.mode==='campaign'&&r.win){ g.font='80px sans-serif'; for(let i=0;i<3;i++){ g.fillStyle=i<r.stars?'#ffc247':'#2a3450'; g.fillText('★',70+i*92,290); } }
 else if(!r.win){ g.fillStyle='#ff8da1'; g.font='800 40px sans-serif'; g.fillText(r.near?'보스 체력 '+r.near+'% 남기고 아깝게 패배':'다음엔 꼭 이긴다!',70,270); }
 g.fillStyle='#ffc247'; g.font='800 48px Orbitron, sans-serif'; g.fillText(fmt(G.stats.score)+' 점',70,380);
 g.fillStyle='#9fb2d4'; g.font='600 26px sans-serif'; g.fillText('처치 '+G.stats.kills+' · 진화 '+G.stats.evos+' · '+Math.floor(G.time/60)+'분 '+Math.floor(G.time%60)+'초',70,430);
 const ic=document.createElement('canvas');
 G.loadout.forEach((id,i)=>{ towerIcon(ic,id); g.drawImage(ic,70+i*104,470,96,96); });
 g.fillStyle='rgba(255,255,255,.55)'; g.font='600 20px sans-serif'; g.textAlign='right'; g.fillText('너도 한번 해볼래?',1130,580);
 return c;
}
function showCard(r){
 const c=makeCard(r), url=c.toDataURL('image/png');
 const s=openModal('<div class="kicker">RESULT CARD</div><h2>결과 카드</h2><p class="lead">길게 누르거나 저장 버튼으로 그림을 저장해서 친구에게 보내 보세요.</p>'+
  '<img src="'+url+'" style="width:100%;border-radius:12px;border:1px solid var(--edge2)" alt="결과 카드">'+
  '<div class="row"><a class="btn big" download="neon-overload-result.png" href="'+url+'">카드 저장</a><button class="btn" id="cd-copy">글로 복사</button><button class="btn ghost" id="cd-back">돌아가기</button></div>');
 $('#cd-copy').onclick=()=>{
  const txt='네온 코어 디펜스: 오버로드 · '+(G.mode==='chaos'?'아수라장 웨이브 '+G.wave:G.st.id+' '+G.st.n+' '+(r.win?'★'.repeat(r.stars):'패배'))+' · '+fmt(G.stats.score)+'점\n너도 한번 해볼래?';
  if(navigator.clipboard) navigator.clipboard.writeText(txt).then(()=>toast('복사했어요','good'),()=>toast('복사하지 못했어요','bad'));
 };
 $('#cd-back').onclick=()=>showResult(r);
}

/* ── 일시정지 메뉴 ── */
function openMenu(){
 if(G.scene!=='battle') return;
 togglePause(true);
 const s=openModal('<div class="kicker">PAUSED</div><h2>일시정지</h2>'+
  (G.augList.length?'<div class="auglist">'+G.augList.map(a=>'<span class="chip" style="color:'+RARITY[a[1]].c+'" title="'+esc(a[3])+'">'+esc(a[2])+'</span>').join('')+'</div>':'')+
  '<div class="row"><button class="btn big" id="pm-go">계속하기</button><button class="btn" id="pm-re">다시 시작</button><button class="btn" id="pm-set">설정</button><button class="btn danger" id="pm-quit">'+(G.mode==='chaos'?'포기하고 나가기':'지도로 나가기')+'</button></div>','narrow');
 $('#pm-go').onclick=()=>{ closeModal(); togglePause(false); };
 $('#pm-re').onclick=()=>{ closeModal(); if(G.mode==='chaos') startChaos(G.mapId,G.loadout.slice(0,6),G.skills.map(s=>s.id)); else startStage(G.st,G.hard,SAVE.d.loadout.towers,SAVE.d.loadout.skills); };
 $('#pm-set').onclick=()=>openSettings(true);
 $('#pm-quit').onclick=()=>{
  closeModal(); tutEnd(false);
  if(G.mode==='chaos'&&G.wave>0){ G.paused=false; SND.resumeAll(); gameOver(false); return; }
  G.over=true; SND.resumeAll(); SND.stopMusic();
  if(G.mode==='chaos') show('s-title'); else openMap(G.st.ch);
 };
}

/* ── 내 기록 · 도감 · 설정 ── */
function openRecords(){
 const D=SAVE.d;
 let rows='';
 for(const s of STAGES){
  const st=D.stars[s.id]||0;
  rows+='<tr><td>'+s.id+'</td><td>'+esc(s.n)+'</td><td style="color:var(--gold)">'+(isCleared(s.id)?'★'.repeat(st)+'☆'.repeat(3-st):'—')+'</td><td class="n">'+(D.best[s.id]?Math.floor(D.best[s.id]/60)+':'+String(D.best[s.id]%60).padStart(2,'0'):'')+'</td><td>'+(D.hard[s.id]?'◆':'')+'</td></tr>';
 }
 let ch='';
 D.chaos.forEach((r,i)=>{ ch+='<tr><td class="n">'+(i+1)+'</td><td class="n">'+r.wave+'</td><td class="n">'+fmt(r.score)+'</td><td>'+r.towers.map(id=>TOWERS[id].n).join(', ')+'</td><td style="color:var(--mute)">'+r.augs.slice(0,4).map(a=>AUG_BY_ID[a]?AUG_BY_ID[a][2]:a).join(', ')+(r.augs.length>4?' 외 '+(r.augs.length-4):'')+'</td></tr>'; });
 const use=Object.entries(D.stats.use).sort((a,b)=>b[1]-a[1])[0], evo=Object.entries(D.stats.evo).sort((a,b)=>b[1]-a[1])[0];
 const s=openModal('<div class="kicker">RECORDS</div><h2>내 기록</h2>'+
  '<div class="res-stats"><div><b>'+Math.floor(D.stats.time/60)+'분</b><span>플레이 시간</span></div><div><b>'+fmt(D.stats.kills)+'</b><span>처치한 적</span></div><div><b>'+(use?TOWERS[use[0]].n:'-')+'</b><span>가장 많이 쓴 탑</span></div><div><b>'+(evo?TOWERS[evo[0].slice(0,-1)].evo[evo[0].slice(-1)].n:'-')+'</b><span>가장 많이 한 진화</span></div></div>'+
  '<div class="tabs2" style="margin-top:14px"><button class="btn sm on" id="rc-a">캠페인</button><button class="btn sm" id="rc-b">아수라장 상위 10판</button></div>'+
  '<div id="rc-1"><table class="tbl"><tr><th>스테이지</th><th>이름</th><th>별</th><th>최고 기록</th><th>하드</th></tr>'+rows+'</table></div>'+
  '<div id="rc-2" class="hide"><table class="tbl"><tr><th>#</th><th>웨이브</th><th>점수</th><th>탑</th><th>증강</th></tr>'+(ch||'<tr><td colspan="5" style="color:var(--mute)">아직 기록이 없어요</td></tr>')+'</table></div>'+
  '<div class="row"><button class="btn big" id="rc-x">닫기</button></div>');
 $('#rc-a').onclick=()=>{ $('#rc-1').classList.remove('hide'); $('#rc-2').classList.add('hide'); $('#rc-a').classList.add('on'); $('#rc-b').classList.remove('on'); };
 $('#rc-b').onclick=()=>{ $('#rc-2').classList.remove('hide'); $('#rc-1').classList.add('hide'); $('#rc-b').classList.add('on'); $('#rc-a').classList.remove('on'); };
 $('#rc-x').onclick=closeModal;
}
function openCodex(){
 const ut=unlockedTowers();
 let h='';
 for(const id of TOWER_IDS){
  const D=TOWERS[id], un=ut.indexOf(id)>=0;
  h+='<div class="cx'+(un?'':' lock')+'"><div class="h"><canvas data-ic="'+id+'"></canvas><div><div class="nm">'+D.n+'</div><div style="font-size:11px;color:'+ROLES[D.role].c+'">'+ROLES[D.role].n+' · '+D.cost+'</div></div></div>'+
   '<div class="ds">'+(un?esc(D.desc):unlockWhere(id)+' 클리어하면 열려요')+'</div>'+
   (un?'<div class="ev">'+['A','B'].map(k=>'<div><canvas data-ic="'+id+'" data-evo="'+k+'"></canvas><b style="color:'+(k==='A'?'#ffc247':'#ff4fd8')+'">'+k+' · '+D.evo[k].n+'</b><br>'+esc(D.evo[k].d)+'</div>').join('')+'</div>':'')+'</div>';
 }
 const s=openModal('<div class="kicker">CODEX</div><h2>방어탑 도감</h2><p class="lead">'+ut.length+' / 20종 해금 · LV3까지 강화하면 A와 B 중 하나로 진화해요.</p><div class="codex">'+h+'</div><div class="row"><button class="btn big" id="cx-x">닫기</button></div>');
 s.querySelectorAll('canvas[data-ic]').forEach(c=>towerIcon(c,c.dataset.ic,c.dataset.evo||null));
 $('#cx-x').onclick=closeModal;
}
function openSettings(fromPause){
 const st=SAVE.d.set;
 const s=openModal('<div class="kicker">SETTINGS</div><h2>설정</h2><div class="set">'+
  '<label>배경음악 <input type="range" min="0" max="1" step=".05" id="st-mus" value="'+st.mus+'"></label>'+
  '<label>효과음 <input type="range" min="0" max="1" step=".05" id="st-sfx" value="'+st.sfx+'"></label>'+
  '<label>화면 효과 <span class="seg"><button class="btn sm" data-fx="auto">자동</button><button class="btn sm" data-fx="high">화려하게</button><button class="btn sm" data-fx="low">가볍게</button></span></label>'+
  (isCleared('3-4')?'<label>황금 진화 외형 <button class="btn sm'+(st.skin!==false?' on':'')+'" id="st-skin">'+(st.skin!==false?'켜짐':'꺼짐')+'</button></label>':'')+
  '<label>튜토리얼 다시 보기 <button class="btn sm" id="st-tut">1-1에서 다시 보기</button></label>'+
  '<p class="lead" style="margin:0">저장은 이 기기에만 됩니다. 앱과 웹은 기록이 따로 저장돼요.</p>'+
  '<label>모든 기록 지우기 <button class="btn sm danger" id="st-reset">초기화</button></label>'+
  '</div><div class="row"><button class="btn big" id="st-x">'+(fromPause?'돌아가기':'닫기')+'</button></div>','narrow');
 const fxb=()=>s.querySelectorAll('[data-fx]').forEach(b=>b.classList.toggle('on',b.dataset.fx===st.fx));
 fxb();
 s.querySelectorAll('[data-fx]').forEach(b=>b.onclick=()=>{ st.fx=b.dataset.fx; G.fxMode=st.fx; G.lowfx=st.fx==='low'; fxb(); SAVE.save(); });
 $('#st-mus').oninput=e=>{ st.mus=+e.target.value; SND.init(); SND.applyVol(); SAVE.save(); };
 $('#st-sfx').oninput=e=>{ st.sfx=+e.target.value; SND.init(); SND.applyVol(); SAVE.save(); SND.play('click'); };
 const sk=$('#st-skin'); if(sk) sk.onclick=()=>{ st.skin=st.skin===false; SAVE.save(); openSettings(fromPause); };
 $('#st-tut').onclick=()=>{ SAVE.d.tut=false; SAVE.save(); toast('1-1을 시작하면 튜토리얼이 다시 나와요','good'); };
 $('#st-reset').onclick=()=>{
  if($('#st-reset').dataset.ok){ SAVE.reset(); closeModal(); toast('모든 기록을 지웠어요'); show('s-title'); return; }
  $('#st-reset').dataset.ok=1; $('#st-reset').textContent='정말 지울까요? 한 번 더 누르기';
 };
 $('#st-x').onclick=()=>{ if(fromPause) openMenu(); else closeModal(); };
}
