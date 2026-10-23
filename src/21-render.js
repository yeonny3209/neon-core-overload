/* ═══════════ 렌더링 ═══════════ */
const cv=$('#game'), cx=cv.getContext('2d');
let BG=null, BGkey='';

function buildBG(){
 const ch=G.st.ch, C=CHAPTERS[ch], key=G.mapId+'|'+G.mode;
 BGkey=key;
 const c=document.createElement('canvas'); c.width=W; c.height=H;
 const g=c.getContext('2d'), rng=mulberry32(G.st.idx*77+5);
 const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,C.bg[0]); gr.addColorStop(1,C.bg[1]);
 g.fillStyle=gr; g.fillRect(0,0,W,H);
 /* 챕터 배경 장식 */
 if(ch===0){
  for(let i=0;i<70;i++){
   const x=rng()*W, w=20+rng()*50, h=40+rng()*170, y=H-h*(rng()<.5?1:.4)-rng()*H*.6;
   g.fillStyle='rgba(20,30,60,'+(.18+rng()*.2)+')'; g.fillRect(x,y,w,h);
   g.fillStyle=rng()<.5?'rgba(47,224,255,.12)':'rgba(255,79,216,.12)';
   for(let k=0;k<6;k++) g.fillRect(x+3+rng()*(w-8),y+4+rng()*(h-8),3,2);
  }
  g.strokeStyle='rgba(120,180,255,.05)'; g.lineWidth=1;
  for(let i=0;i<90;i++){ const x=rng()*W, y=rng()*H; g.beginPath(); g.moveTo(x,y); g.lineTo(x-6,y+18); g.stroke(); }
 } else if(ch===1){
  for(let i=0;i<26;i++){
   const x=rng()*W, w=26+rng()*18, h=60+rng()*120, y=rng()*(H-h);
   g.fillStyle='rgba(16,40,80,.28)'; rrect(g,x,y,w,h,4); g.fill();
   for(let k=0;k<h/12;k++){ g.fillStyle=rng()<.4?'rgba(77,166,255,.22)':'rgba(169,139,255,.12)'; g.fillRect(x+4,y+6+k*12,w-8,3); }
  }
  for(let i=0;i<60;i++){ const r=2+rng()*7; g.strokeStyle='rgba(120,200,255,'+(.05+rng()*.08)+')'; circ(g,rng()*W,rng()*H,r); g.stroke(); }
 } else {
  for(let i=0;i<220;i++){ g.fillStyle='rgba(255,255,255,'+(.15+rng()*.6)+')'; const s=rng()<.08?2:1; g.fillRect(rng()*W,rng()*H,s,s); }
  g.strokeStyle='rgba(255,194,71,.08)'; g.lineWidth=18;
  g.beginPath(); g.ellipse(W*.7,H*.15,520,120,-.2,0,TAU); g.stroke();
  const pg=g.createRadialGradient(W*.12,H*.88,10,W*.12,H*.88,260); pg.addColorStop(0,'rgba(255,77,109,.25)'); pg.addColorStop(1,'rgba(255,77,109,0)');
  g.fillStyle=pg; g.fillRect(0,0,W,H);
 }
 /* 격자 */
 g.strokeStyle='rgba(120,170,255,.045)'; g.lineWidth=1;
 for(let x=0;x<=W;x+=TILE){ g.beginPath(); g.moveTo(x+.5,0); g.lineTo(x+.5,H); g.stroke(); }
 for(let y=0;y<=H;y+=TILE){ g.beginPath(); g.moveTo(0,y+.5); g.lineTo(W,y+.5); g.stroke(); }
 /* 회랑 */
 g.lineCap='round'; g.lineJoin='round';
 const trace=P=>{ g.beginPath(); P.pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y)); };
 for(const P of G.paths){ trace(P); g.strokeStyle=hexA(C.acc,.16); g.lineWidth=46; g.stroke(); }
 for(const P of G.paths){ trace(P); g.strokeStyle='#060a16'; g.lineWidth=36; g.stroke(); }
 for(const P of G.paths){ trace(P); g.strokeStyle=hexA(C.acc,.55); g.lineWidth=38; g.stroke(); }
 for(const P of G.paths){ trace(P); g.strokeStyle='#060a16'; g.lineWidth=35; g.stroke(); }
 for(const P of G.paths){ trace(P); g.strokeStyle=hexA(C.acc,.4); g.lineWidth=1.5; g.setLineDash([10,14]); g.stroke(); g.setLineDash([]); }
 /* 관문 */
 for(const P of G.paths){
  const a=P.pts[0], b=P.pts[1], ex=clamp(a.x,18,W-18), ey=clamp(a.y,18,H-18);
  g.save(); g.translate(ex,ey); g.rotate(Math.atan2(b.y-a.y,b.x-a.x));
  g.fillStyle=hexA(C.acc2,.25); g.fillRect(-8,-24,16,48);
  g.strokeStyle=C.acc2; g.lineWidth=2; g.strokeRect(-8,-24,16,48);
  g.restore();
 }
 /* 장애물 */
 for(const b of G.blocked){
  const x=b.tx*TILE, y=b.ty*TILE;
  if(ch===0){ g.fillStyle='#101a33'; g.fillRect(x+4,y+2,32,36); g.fillStyle='rgba(255,194,71,.35)'; for(let k=0;k<4;k++) g.fillRect(x+9+(k%2)*14,y+8+Math.floor(k/2)*12,6,4); g.strokeStyle='rgba(47,224,255,.35)'; g.strokeRect(x+4.5,y+2.5,31,35); }
  else if(ch===1){ g.fillStyle='#0d2142'; rrect(g,x+6,y+3,28,34,3); g.fill(); g.fillStyle='rgba(77,166,255,.45)'; for(let k=0;k<4;k++) g.fillRect(x+10,y+8+k*7,20,2); }
  else { g.fillStyle='#241a26'; poly(g,x+20,y+20,15,7,b.v); g.fill(); g.strokeStyle='rgba(255,194,71,.3)'; g.stroke(); }
 }
 /* 가장자리 어둡게 */
 const vg=g.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*.95);
 vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.55)');
 g.fillStyle=vg; g.fillRect(0,0,W,H);
 BG=c;
}

/* ── 배경에 떠도는 입자: 챕터마다 비 · 물방울 · 별빛 ── */
let AMB=null, AMBkey='', rLast=0;
function ambInit(){
 const rng=mulberry32(G.st.ch*31+7), n=G.lowfx?30:64; AMB=[];
 for(let i=0;i<n;i++) AMB.push({x:rng()*W,y:rng()*H,s:rng(),p:rng()*TAU,v:.45+rng()});
 AMBkey=G.mapId+'|'+G.mode;
}
function drawAmbient(g,T,dt){
 if(!AMB||AMBkey!==G.mapId+'|'+G.mode) ambInit();
 const ch=G.st.ch;
 g.save(); g.globalCompositeOperation='lighter';
 for(let i=0;i<AMB.length;i++){
  const a=AMB[i];
  if(ch===0){
   a.y+=a.v*640*dt; a.x-=a.v*95*dt;
   if(a.y>H){ a.y=-24; a.x=Math.random()*(W+80); } if(a.x<-30) a.x+=W+60;
   g.strokeStyle='rgba(150,205,255,'+(.1+.12*a.s)+')'; g.lineWidth=1;
   g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(a.x+6,a.y-20*a.v); g.stroke();
  } else if(ch===1){
   a.y-=a.v*28*dt; a.x+=Math.sin(T*1.2+a.p)*12*dt;
   if(a.y<-12){ a.y=H+12; a.x=Math.random()*W; }
   g.strokeStyle='rgba(120,205,255,'+(.14+.16*a.s)+')'; g.lineWidth=1;
   g.beginPath(); g.arc(a.x,a.y,2+a.s*5,0,TAU); g.stroke();
  } else {
   a.x+=a.v*7*dt; if(a.x>W+5) a.x=-5;
   const tw=.5+.5*Math.sin(T*(1+a.v)+a.p);
   g.fillStyle='rgba(255,232,190,'+(.1+.5*tw*a.s)+')'; const sz=1.4+a.s*1.8; g.fillRect(a.x,a.y,sz,sz);
  }
 }
 g.restore();
}
/* 회랑 위로 적이 가는 방향으로 빛이 흐른다 */
function drawFlow(g,T){
 g.save(); g.globalCompositeOperation='lighter'; g.lineCap='round'; g.lineJoin='round';
 const acc=CHAPTERS[G.st.ch].acc;
 for(const P of G.paths){
  if(!P.p2d){ const p=new Path2D(); P.pts.forEach((q,i)=>i?p.lineTo(q.x,q.y):p.moveTo(q.x,q.y)); P.p2d=p; }
  g.strokeStyle=hexA(acc,.5); g.lineWidth=3; g.setLineDash([2,26]); g.lineDashOffset=-T*70; g.stroke(P.p2d);
  g.strokeStyle='rgba(255,255,255,.16)'; g.lineWidth=1.2; g.setLineDash([10,34]); g.lineDashOffset=-T*96; g.stroke(P.p2d);
 }
 g.setLineDash([]); g.restore();
}

function render(){
 if(!G.paths.length) return;
 if(!BG||BGkey!==G.mapId+'|'+G.mode) buildBG();
 const T=performance.now()/1000, g=cx;
 g.setTransform(1,0,0,1,0,0);
 g.clearRect(0,0,W,H);
 g.save();
 /* 카메라 */
 const cam=G.cam;
 if(cam.z!==1||cam.x!==W/2||cam.y!==H/2){ g.translate(W/2,H/2); g.scale(cam.z,cam.z); g.translate(-cam.x,-cam.y); }
 if(G.shake>.05) g.translate(rnd(-G.shake,G.shake)*.6,rnd(-G.shake,G.shake)*.6);
 g.drawImage(BG,0,0);
 { const rdt=Math.min(.05,Math.max(0,T-(rLast||T))); rLast=T; drawAmbient(g,T,rdt); }
 drawFlow(g,T);
 drawTerrain(g,T);
 drawCore(g,T);
 drawPools(g,T);
 drawMines(g,T);
 drawHoverAndRange(g,T);
 drawTowers(g,T);
 drawEnemies(g,T,false);
 drawEnemies(g,T,true);
 drawShots(g,T);
 drawFx(g,T);
 drawTele(g,T);
 drawParts(g);
 drawTexts(g);
 drawAim(g,T);
 drawCoach(g,T);
 g.restore();
 /* 화면 전체 효과 */
 if(G.blackout>=0){ g.fillStyle='rgba(0,0,8,.5)'; g.fillRect(G.blackout===0?0:W/2,0,W/2,H); }
 if(G.overload){ g.fillStyle='rgba(255,20,60,'+(.08+.05*Math.sin(T*6))+')'; g.fillRect(0,0,W,H); }
 if(G.freezeT>0){ g.fillStyle='rgba(127,216,255,'+Math.min(.18,G.freezeT*.06)+')'; g.fillRect(0,0,W,H); }
 if(G.overclockT>0){ g.strokeStyle='rgba(255,79,216,'+(.35+.2*Math.sin(T*12))+')'; g.lineWidth=6; g.strokeRect(3,3,W-6,H-6); }
 if(G.slowmo>0){ g.fillStyle='rgba(255,255,255,'+(G.slowmo*.04)+')'; g.fillRect(0,0,W,H); }
 drawBossBar(g,T);
}

function drawTerrain(g,T){
 const p=.5+.5*Math.sin(T*3);
 g.save(); g.globalCompositeOperation='lighter';
 const etile=(k,col,icon)=>{
  const [tx,ty]=k.split(',').map(Number), x=tx*TILE, y=ty*TILE;
  g.fillStyle=hexA(col,.08+.08*p); g.fillRect(x+2,y+2,TILE-4,TILE-4);
  g.strokeStyle=hexA(col,.45+.25*p); g.lineWidth=1.5; g.strokeRect(x+3.5,y+3.5,TILE-7,TILE-7);
  g.fillStyle=hexA(col,.6);
  if(icon==='bolt'){ g.beginPath(); g.moveTo(x+22,y+9); g.lineTo(x+15,y+21); g.lineTo(x+20,y+21); g.lineTo(x+17,y+31); g.lineTo(x+26,y+18); g.lineTo(x+21,y+18); g.closePath(); g.fill(); }
  else { circ(g,x+20,y+18+Math.sin(T*2+tx)*2,4); g.fill(); g.beginPath(); g.moveTo(x+16,y+18); g.lineTo(x+20,y+10); g.lineTo(x+24,y+18); g.fill(); }
 };
 for(const k of G.energy) etile(k,'#2fe0ff','bolt');
 for(const k of G.moving) etile(k,'#ffc247','bolt');
 for(const k of G.coolant) etile(k,'#5aa8ff','drop');
 g.restore();
 for(const z of G.em){
  const x=(z.tx-1)*TILE, y=(z.ty-1)*TILE;
  g.fillStyle='rgba(169,139,255,.07)'; g.fillRect(x,y,TILE*3,TILE*3);
  g.strokeStyle='rgba(169,139,255,'+(.3+.2*p)+')'; g.lineWidth=1.5; g.setLineDash([6,6]); g.lineDashOffset=-T*20; g.strokeRect(x+.5,y+.5,TILE*3-1,TILE*3-1); g.setLineDash([]);
  if(Math.random()<.04) boltFx([{x:x+rnd(0,120),y:y+rnd(0,120)},{x:x+rnd(0,120),y:y+rnd(0,120)}],'#a98bff',.12);
 }
 for(const pd of G.pads){
  g.save(); g.translate(pd.x,pd.y); g.rotate(pd.ang);
  const rev=G.aug.pad_reverse;
  for(let i=0;i<3;i++){
   const o=((T*2+i/3)%1)*24-12;
   g.strokeStyle=rev?'rgba(94,242,164,'+(1-Math.abs(o)/12)+')':'rgba(255,154,60,'+(1-Math.abs(o)/12)+')'; g.lineWidth=3;
   g.beginPath(); g.moveTo(o-5*(rev?-1:1),-9); g.lineTo(o+5*(rev?-1:1),0); g.lineTo(o-5*(rev?-1:1),9); g.stroke();
  }
  g.restore();
 }
 for(const k of G.pathBuild){ const [tx,ty]=k.split(',').map(Number); g.strokeStyle='rgba(47,224,255,.6)'; g.lineWidth=2; g.strokeRect(tx*TILE+3,ty*TILE+3,TILE-6,TILE-6); }
}
function drawCore(g,T){
 const c=G.paths[0].core, low=G.lives<=5;
 const col=low?'#ff4d6d':CHAPTERS[G.st.ch].acc;
 g.save(); g.globalCompositeOperation='lighter';
 glow(g,c.x,c.y,70,col,.35+.15*Math.sin(T*(low?8:2)));
 g.restore();
 g.save(); g.translate(c.x,c.y);
 g.rotate(T*.6); g.strokeStyle=hexA(col,.6); g.lineWidth=2; poly(g,0,0,26,6,0); g.stroke();
 g.rotate(-T*1.4); g.strokeStyle=hexA(col,.35); poly(g,0,0,34,6,0); g.stroke();
 g.restore();
 g.fillStyle=col; poly(g,c.x,c.y,14+Math.sin(T*3)*1.5,6,Math.PI/6); g.fill();
 g.fillStyle='#ffffff'; poly(g,c.x,c.y,6,6,Math.PI/6); g.fill();
 if(G.cShield>0){ g.strokeStyle='rgba(125,252,255,'+(.5+.2*Math.sin(T*4))+')'; g.lineWidth=3; circ(g,c.x,c.y,44); g.stroke();
  g.fillStyle='#bff8ff'; g.font='700 11px Orbitron'; g.textAlign='center'; g.fillText(G.cShield,c.x,c.y-50); }
}
function drawPools(g,T){
 if(!G.pools.length&&!G.vortex.length) return;
 g.save(); g.globalCompositeOperation='lighter';
 for(const p of G.pools){ const a=clamp(p.t/p.max,0,1); glow(g,p.x,p.y,p.r*1.3,p.col,.55*a); }
 g.restore();
 for(const v of G.vortex){
  const a=clamp(v.t/v.max,0,1);
  g.save(); g.translate(v.x,v.y); g.rotate(-T*5);
  g.fillStyle='rgba(0,0,0,'+(.7*a)+')'; circ(g,0,0,v.r*.35); g.fill();
  g.strokeStyle=hexA(v.col,.7*a); g.lineWidth=2;
  for(let i=0;i<4;i++){ g.beginPath(); g.arc(0,0,v.r*(.4+i*.15),i,i+2.2); g.stroke(); }
  g.restore();
 }
}
function drawMines(g,T){
 for(const m of G.mines){
  const b=(Math.sin(T*8+m.x)>.3);
  g.fillStyle='#1a1408'; circ(g,m.x,m.y,6); g.fill();
  g.strokeStyle=m.col; g.lineWidth=1.5; g.stroke();
  if(b){ g.fillStyle=m.arm>0?'#666':'#ff4d6d'; circ(g,m.x,m.y,2); g.fill(); }
 }
}
function drawHoverAndRange(g,T){
 const h=G.hover;
 if(G.buy&&h){
  const ok=buildable(h.tx,h.ty)&&!canBuildType(G.buy)&&G.gold>=buildCost(G.buy);
  const x=h.tx*TILE, y=h.ty*TILE, col=ok?'#5ef2a4':'#ff4d6d';
  g.fillStyle=hexA(col,.18); g.fillRect(x+1,y+1,TILE-2,TILE-2);
  g.strokeStyle=col; g.lineWidth=2; g.strokeRect(x+1.5,y+1.5,TILE-3,TILE-3);
  if(inGrid(h.tx,h.ty)){
   const base=towerBase(G.buy,0,null), rr=(base.rng||0)*(isEnergy(h.tx,h.ty)?1:1)*(inEm(h.tx,h.ty)?.8:1);
   if(rr){ g.fillStyle='rgba(255,255,255,.05)'; circ(g,x+20,y+20,rr); g.fill(); g.strokeStyle=hexA(col,.5); g.lineWidth=1.2; g.setLineDash([5,5]); g.stroke(); g.setLineDash([]); }
   g.globalAlpha=.6; g.save(); g.translate(x+20,y+20); drawTowerArt(g,G.buy,null,false,0,-Math.PI/2,0,0,T); g.restore(); g.globalAlpha=1;
   if(isEnergy(h.tx,h.ty)){ g.fillStyle='#2fe0ff'; g.font='700 11px sans-serif'; g.textAlign='center'; g.fillText('에너지 칸 · 피해 +'+(G.aug.energy_power?60:20)+'%',x+20,y-6); }
   else if(G.coolant.has(tkey(h.tx,h.ty))&&G.buy==='cryo'){ g.fillStyle='#5aa8ff'; g.font='700 11px sans-serif'; g.textAlign='center'; g.fillText('냉각수 칸 · 냉기 효과 2배',x+20,y-6); }
   else if(inEm(h.tx,h.ty)){ g.fillStyle='#a98bff'; g.font='700 11px sans-serif'; g.textAlign='center'; g.fillText('전자기장 · 사거리 -20%',x+20,y-6); }
  }
 }
 const s=G.sel;
 if(s&&G.towers.indexOf(s)>=0){
  let rr=0; for(const w of s.wep) rr=Math.max(rr,S(s,w).rng||0);
  if(rr){ g.fillStyle='rgba(47,224,255,.06)'; circ(g,s.x,s.y,rr); g.fill(); g.strokeStyle='rgba(47,224,255,.6)'; g.lineWidth=1.5; g.setLineDash([6,5]); g.lineDashOffset=-T*12; g.stroke(); g.setLineDash([]); }
  g.strokeStyle='#ffffff'; g.lineWidth=2; rrect(g,s.x-21,s.y-21,42,42,10); g.stroke();
 }
}
function drawTowers(g,T){
 const draw=(t,ghost)=>{
  g.save(); g.translate(t.x,t.y);
  if(ghost){ g.globalAlpha=.4+.15*Math.sin(T*6); }
  if(t.flash>0){ g.save(); g.globalCompositeOperation='lighter'; glow(g,0,0,40+t.flash*20,evoCol(t),Math.min(1,t.flash)); g.restore(); }
  /* 새로 지은 탑은 커지며 나타나고 번쩍인다 */
  const bage=G.time-t.born;
  if(bage>=0&&bage<.4){
   const bk=Math.min(1,bage/.34), bs=.5+.5*easeOut(bk)+.14*Math.sin(bk*Math.PI);
   g.scale(bs,bs);
   g.save(); g.globalCompositeOperation='lighter'; glow(g,0,0,40,t.D.col,(1-bage/.4)*.85); g.restore();
  }
  if(SAVE.d.cleared['3-4']&&t.evo&&SAVE.d.set.skin!==false){ g.save(); g.globalCompositeOperation='lighter'; glow(g,0,0,30,'#ffc247',.25+.1*Math.sin(T*2+t.x)); g.restore(); }
  let sp=t.spin;
  const w0=t.wep[0];
  if(w0&&w0.s.kind==='gatling') sp=t.spin*(.4+w0.spin*2.5);
  drawTowerArt(g,t.id,t.evo,t.evo2,t.lv,t.ang,t.recoil,sp,T);
  if(t.muzzle>0&&!G.lowfx){
   g.save(); g.globalCompositeOperation='lighter';
   glow(g,Math.cos(t.ang)*16,Math.sin(t.ang)*16,10+14*t.muzzle,evoCol(t),.9*t.muzzle); g.restore();
  }
  if(t.jam>G.time){
   g.globalAlpha=.6; g.fillStyle='rgba(5,8,16,.75)'; circ(g,0,0,19); g.fill();
   g.globalAlpha=.6+Math.sin(T*20)*.3; g.strokeStyle='#ffd34d'; g.lineWidth=2; g.setLineDash([4,4]); circ(g,0,0,21); g.stroke(); g.setLineDash([]);
   g.fillStyle='#ffd34d'; g.globalAlpha=1;
   g.beginPath(); g.moveTo(2,-9); g.lineTo(-5,1); g.lineTo(-1,1); g.lineTo(-3,9); g.lineTo(5,-2); g.lineTo(1,-2); g.closePath(); g.fill();
  }
  g.restore();
  /* 광선류 */
  for(const w of t.wep){
   if(w.beams&&w.beams.length&&t.jam<=G.time){
    for(const b of w.beams){
     const e=b.e, k=b.t/(S(t,w).rup||1), col=evoCol(t);
     g.save(); g.globalCompositeOperation='lighter';
     g.strokeStyle=hexA(col,.35); g.lineWidth=6+k*6; g.beginPath(); g.moveTo(t.x,t.y); g.lineTo(e.x,e.y); g.stroke();
     g.strokeStyle='#ffffff'; g.lineWidth=1.5+k*1.5; g.stroke();
     glow(g,e.x,e.y,12+k*10,col,.7);
     g.restore();
    }
   }
  }
 };
 for(const t of G.towers) draw(t,false);
 for(const t of G.ghosts) draw(t,true);
}
function drawEnemies(g,T,airPass){
 for(const e of G.enemies){
  if(!e.alive||!!e.air!==airPass) continue;
  const stealthy=e.D.stealth&&!e.vis;
  g.save(); g.translate(e.x,e.y);
  if(e.air){ g.save(); g.globalAlpha=.3; g.fillStyle='#000'; g.beginPath(); g.ellipse(4,e.r*1.15,e.r*.85,e.r*.3,0,0,TAU); g.fill(); g.restore(); }
  if(stealthy) g.globalAlpha=.16+.06*Math.sin(T*5+e.wob);
  else if(e.D.stealth) g.globalAlpha=.7;
  const col=e.hitT>0?'#ffffff':e.col;
  if(!G.lowfx&&!stealthy){ g.save(); g.globalCompositeOperation='lighter'; glow(g,0,0,e.r*2,e.col,e.D.giant?0:.32); g.restore(); }
  if(e.D.giant){ if(e.invuln>0) g.globalAlpha=.6+.4*Math.sin(T*30); drawBoss(g,e,T); }
  else { g.save(); drawEnemyShape(g,e,col,T); g.restore(); }
  g.globalAlpha=1;
  if(e.shield>0&&e.shieldMax>0&&!stealthy){
   g.globalAlpha=.15+.3*(e.shield/e.shieldMax); g.fillStyle='#ffe066'; circ(g,0,0,e.r+6); g.fill();
   g.globalAlpha=.7; g.strokeStyle='#ffe066'; g.lineWidth=1.2; g.stroke(); g.globalAlpha=1;
  }
  if(e.freeze>0||(G.freezeT>0&&!(e.D.boss&&G.freezeT<G.freezeBoss))){ g.globalAlpha=.5; g.fillStyle='#bfe6ff'; poly(g,0,0,e.r+4,6,T*.4); g.fill(); g.globalAlpha=1; }
  else if(e.slowT>0||e.auraSlowShow){ g.globalAlpha=.55; g.strokeStyle='#9fd8ff'; g.lineWidth=1.4; g.beginPath(); g.arc(0,0,e.r+4,T*2,T*2+2.1); g.stroke(); g.beginPath(); g.arc(0,0,e.r+4,T*2+Math.PI,T*2+Math.PI+2.1); g.stroke(); g.globalAlpha=1; }
  if(e.stun>0||e.root>0){ g.fillStyle=e.root>0?'#7dfcff':'#ffe066'; for(let k=0;k<3;k++){ const a=T*7+k/3*TAU; circ(g,Math.cos(a)*(e.r+7),Math.sin(a)*(e.r+7)*.5-e.r-2,1.9); g.fill(); } }
  if(e.markT>0){ g.strokeStyle=e.bounty?'#ffd34d':'#ff4fd8'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-6,-e.r-12); g.lineTo(0,-e.r-6); g.lineTo(6,-e.r-12); g.stroke(); }
  if(e.padT>0&&!G.lowfx&&Math.random()<.3) part(e.x-Math.cos(e.ang)*e.r,e.y-Math.sin(e.ang)*e.r,0,0,.25,2,G.aug.pad_reverse?'#5ef2a4':'#ff9a3c');
  g.restore();
  if(!e.D.giant&&!stealthy&&(e.hp<e.maxHp||e.shield>0)){
   const w=Math.max(18,e.r*2.2), x=e.x-w/2, y=e.y-e.r-9;
   g.fillStyle='rgba(0,0,0,.6)'; g.fillRect(x-1,y-1,w+2,5);
   const f=clamp(e.hp/e.maxHp,0,1);
   g.fillStyle=f>.5?'#5ef2a4':(f>.25?'#ffc247':'#ff4d6d'); g.fillRect(x,y,w*f,3);
   if(e.shield>0) { g.fillStyle='#ffe066'; g.fillRect(x,y-3,w*clamp(e.shield/Math.max(1,e.shieldMax),0,1),2); }
  }
  if(e.blinkT>0){
   const nd=Math.min(e.dist+e.D.blink.dist,G.paths[e.lane].total-8), p=ptAt(e.lane,nd);
   g.strokeStyle=hexA(e.col,.6); g.lineWidth=1.5; g.setLineDash([3,4]); g.beginPath(); g.moveTo(e.x,e.y); g.lineTo(p.x,p.y); g.stroke(); g.setLineDash([]);
   g.globalAlpha=.35+.3*Math.sin(T*30); g.fillStyle=e.col; poly(g,p.x,p.y,e.r+2,4,Math.PI/4); g.fill(); g.globalAlpha=1;
  }
 }
}
function drawShots(g,T){
 g.save(); g.globalCompositeOperation='lighter';
 for(const p of G.shots){
  if(p.delay>0) continue;
  if(p.tr&&p.tr.length>=4){
   const a=p.tr; g.lineCap='round';
   for(let i=2;i<a.length;i+=2){
    const f=i/a.length;
    g.strokeStyle=hexA(p.col||'#ffffff',f*.6); g.lineWidth=1+f*(p.k==='plasma'?5:2.6);
    g.beginPath(); g.moveTo(a[i-2],a[i-1]); g.lineTo(a[i],a[i+1]); g.stroke();
   }
  }
  switch(p.k){
   case 'bullet': glow(g,p.x,p.y,p.small?7:10,p.col,.9); g.fillStyle='#fff'; circ(g,p.x,p.y,p.small?1.6:2.2); g.fill(); break;
   case 'dart': glow(g,p.x,p.y,10,p.col,.9); g.fillStyle=p.col; poly(g,p.x,p.y,4,3,T*20); g.fill(); break;
   case 'venom': glow(g,p.x,p.y,9,p.col,.8); g.fillStyle=p.col; circ(g,p.x,p.y,3); g.fill(); break;
   case 'plasma': glow(g,p.x,p.y,p.single?24:18,p.col,.95); g.fillStyle='#fff'; circ(g,p.x,p.y,p.single?6:4.5); g.fill(); break;
   case 'missile': glow(g,p.x,p.y,9,'#ffb36b',.8); g.save(); g.translate(p.x,p.y); g.rotate(p.ang); g.fillStyle=p.col; g.fillRect(-5,-1.6,10,3.2); g.restore(); break;
   case 'shell': case 'bomblet': glow(g,p.x,p.y,p.k==='bomblet'?7:11,p.col,.85); g.fillStyle='#fff'; circ(g,p.x,p.y,p.k==='bomblet'?1.8:3); g.fill(); break;
   case 'lob': g.fillStyle=p.col; circ(g,p.x,p.y,3.5); g.fill(); break;
  }
 }
 g.restore();
}
function drawFx(g,T){
 g.save();
 for(const f of G.fx){
  const k=1-f.life/f.max, a=f.life/f.max;
  switch(f.k){
   case 'ring': g.strokeStyle=hexA(f.col,a); g.lineWidth=f.w; circ(g,f.x,f.y,f.r*(.4+.6*easeOut(k))); g.stroke(); break;
   case 'boom': g.globalCompositeOperation='lighter'; glow(g,f.x,f.y,f.r*(1+k*.6),f.col,a*.9); g.globalCompositeOperation='source-over';
    g.strokeStyle=hexA(f.col,a*.8); g.lineWidth=2; circ(g,f.x,f.y,f.r*(.5+k*.7)); g.stroke(); break;
   case 'beam': g.globalCompositeOperation='lighter'; g.strokeStyle=hexA(f.col,a); g.lineWidth=f.w; g.beginPath(); g.moveTo(f.x1,f.y1); g.lineTo(f.x2,f.y2); g.stroke(); g.globalCompositeOperation='source-over'; break;
   case 'bolt': g.globalCompositeOperation='lighter'; g.strokeStyle=hexA(f.col,a); g.lineWidth=2.4; g.beginPath();
    for(let i=0;i<f.pts.length;i++){ const p=f.pts[i]; if(!i){ g.moveTo(p.x,p.y); continue; } const q=f.pts[i-1];
     for(let s=1;s<=3;s++){ const t2=s/3; g.lineTo(lerp(q.x,p.x,t2)+(s<3?rnd(-6,6):0),lerp(q.y,p.y,t2)+(s<3?rnd(-6,6):0)); } }
    g.stroke(); g.strokeStyle=hexA('#ffffff',a*.8); g.lineWidth=1; g.stroke(); g.globalCompositeOperation='source-over'; break;
   case 'frost': g.fillStyle=hexA(f.col,.25*a); circ(g,f.x,f.y,f.r*(.6+.4*k)); g.fill(); g.strokeStyle=hexA('#ffffff',.6*a); g.lineWidth=1.5; g.stroke(); break;
   case 'implode': g.strokeStyle=hexA(f.col,a); g.lineWidth=2.5; circ(g,f.x,f.y,f.r*(1-k*.85)); g.stroke(); break;
   case 'cone': g.fillStyle=hexA(f.col,.22*a); g.beginPath(); g.moveTo(f.x,f.y); g.arc(f.x,f.y,f.r*(.3+.7*k),f.ang-f.c,f.ang+f.c); g.closePath(); g.fill(); break;
   case 'net': g.strokeStyle=hexA(f.col,.8*a); g.lineWidth=1; for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(f.x-f.r,f.y+i*f.r*.5); g.lineTo(f.x+f.r,f.y+i*f.r*.5); g.moveTo(f.x+i*f.r*.5,f.y-f.r); g.lineTo(f.x+i*f.r*.5,f.y+f.r); g.stroke(); } break;
   case 'evo': g.globalCompositeOperation='lighter'; g.fillStyle=hexA(f.col,.35*a); g.fillRect(f.x-14,f.y-200*easeOut(k),28,200*easeOut(k)+14); glow(g,f.x,f.y,50+k*40,f.col,a); g.globalCompositeOperation='source-over';
    g.strokeStyle=hexA(f.col,a); g.lineWidth=3; poly(g,f.x,f.y,20+k*50,6,k*3); g.stroke(); break;
   case 'orbital': g.globalCompositeOperation='lighter'; g.fillStyle=hexA('#ff9aea',.6*a); g.fillRect(f.x-f.r*.45*a,0,f.r*.9*a,f.y); glow(g,f.x,f.y,f.r*1.6,'#ff9aea',a); g.globalCompositeOperation='source-over'; break;
  }
 }
 g.restore();
}
function drawTele(g,T){
 for(const o of G.orbitals){
  const k=1-o.t/o.max;
  g.strokeStyle='rgba(255,154,234,'+(.5+.4*Math.sin(T*30))+')'; g.lineWidth=2; circ(g,o.x,o.y,o.r); g.stroke();
  g.fillStyle='rgba(255,154,234,.12)'; circ(g,o.x,o.y,o.r*k); g.fill();
  g.strokeStyle='rgba(255,154,234,.35)'; g.lineWidth=2+k*6; g.beginPath(); g.moveTo(o.x,0); g.lineTo(o.x,o.y); g.stroke();
 }
 for(const e of G.tele){
  const k=e.tele, f=1-k.t/k.max;
  g.save();
  const red='rgba(255,60,90,';
  if(k.k==='charge'){
   const len=G.paths[e.lane].total;
   g.lineCap='round'; g.strokeStyle=red+(.25+.25*Math.sin(T*16))+')'; g.lineWidth=e.r*1.6;
   g.beginPath(); for(let d=e.dist;d<=Math.min(len,e.dist+120);d+=8){ const p=ptAt(e.lane,d); if(d===e.dist) g.moveTo(p.x,p.y); else g.lineTo(p.x,p.y); } g.stroke();
  } else if(k.k==='stomp'){
   for(const t of k.targets){ g.strokeStyle=red+'.9)'; g.lineWidth=3; circ(g,t.x,t.y,30-f*10); g.stroke(); g.fillStyle=red+(f*.35)+')'; circ(g,t.x,t.y,26); g.fill(); }
  } else if(k.k==='emp'){
   const R=G.hard?234:180;
   g.strokeStyle='rgba(255,211,77,'+(.4+.3*Math.sin(T*18))+')'; g.lineWidth=2; g.setLineDash([8,6]); circ(g,e.x,e.y,R); g.stroke(); g.setLineDash([]);
   g.strokeStyle='rgba(255,211,77,.6)'; g.lineWidth=3; circ(g,e.x,e.y,R*f); g.stroke();
   for(const t of G.towers) if(d2(e.x,e.y,t.x,t.y)<=R*R){ g.strokeStyle='rgba(255,211,77,.85)'; g.lineWidth=2; circ(g,t.x,t.y,22); g.stroke(); }
   g.fillStyle='#ffd34d'; g.font='800 14px sans-serif'; g.textAlign='center'; g.fillText('EMP 충전 — 기절·빙결로 끊기!',e.x,e.y-e.r-30);
  } else if(k.k==='tp'){
   const p=ptAt(e.lane,k.d);
   g.strokeStyle=red+(.5+.4*Math.sin(T*20))+')'; g.lineWidth=3; circ(g,p.x,p.y,e.r*(1.4-f*.4)); g.stroke();
   g.setLineDash([6,6]); g.beginPath(); g.moveTo(e.x,e.y); g.lineTo(p.x,p.y); g.stroke(); g.setLineDash([]);
  }
  g.restore();
 }
}
function drawParts(g){
 if(!G.parts.length) return;
 g.save(); g.globalCompositeOperation='lighter';
 const lo=G.lowfx;
 for(const p of G.parts){
  const a=clamp(p.life/p.max,0,1), r=p.size*a+.4;
  g.globalAlpha=a*.9; g.fillStyle=p.col;
  if(lo||r<1.6) g.fillRect(p.x-r,p.y-r,r*2,r*2); else { circ(g,p.x,p.y,r); g.fill(); }
 }
 g.restore();
}
function drawTexts(g){
 g.save(); g.textAlign='center'; g.textBaseline='middle'; g.lineJoin='round';
 let sz=-1;
 for(const q of G.texts){
  const a=clamp(q.life/q.max,0,1);
  g.globalAlpha=a<.35?a/.35:1;
  if(q.size!==sz){ sz=q.size; g.font='800 '+sz+'px Orbitron, sans-serif'; }
  g.lineWidth=3.2; g.strokeStyle='rgba(2,5,12,.85)'; g.strokeText(q.s,q.x,q.y);
  g.fillStyle=q.col; g.fillText(q.s,q.x,q.y);
 }
 g.restore();
}
function drawAim(g,T){
 if(G.aimSkill===null||!G.hover) return;
 const r=80*(G.aug.skill_dmg?1.5:1), x=G.hover.x, y=G.hover.y;
 g.strokeStyle='rgba(255,154,234,.9)'; g.lineWidth=2; g.setLineDash([6,6]); g.lineDashOffset=-T*20; circ(g,x,y,r); g.stroke(); g.setLineDash([]);
 g.fillStyle='rgba(255,154,234,.1)'; circ(g,x,y,r); g.fill();
}
function drawBossBar(g,T){
 if(!G.bosses.length) return;
 let b=G.bosses[0]; for(const o of G.bosses) if(o.hp>b.hp) b=o;
 const w=560,h=12,x=(W-w)/2,y=18;
 g.save();
 g.fillStyle='rgba(4,8,18,.85)'; rrect(g,x-8,y-8,w+16,h+38,10); g.fill();
 g.strokeStyle=hexA(b.col,.6); g.lineWidth=1; g.stroke();
 g.fillStyle='#1a2034'; g.fillRect(x,y,w,h);
 const f=clamp(b.hp/b.maxHp,0,1);
 const gr=g.createLinearGradient(x,0,x+w,0); gr.addColorStop(0,b.col); gr.addColorStop(1,'#ffffff');
 g.fillStyle=gr; g.fillRect(x,y,w*f,h);
 if(b.shield>0) { g.fillStyle='#ffe066'; g.fillRect(x,y-3,w*clamp(b.shield/b.shieldMax,0,1),3); }
 g.fillStyle='#05070f'; g.fillRect(x+w*.66-1,y-2,2,h+4); g.fillRect(x+w*b.p3at-1,y-2,2,h+4);
 g.font='800 13px sans-serif'; g.textAlign='left'; g.fillStyle='#ffffff';
 g.fillText(b.D.n+(G.bosses.length>1?' ×'+G.bosses.length:''),x,y+h+18);
 g.textAlign='right'; g.font='700 11px Orbitron, sans-serif'; g.fillStyle='#ffd0d8';
 g.fillText(fmt(b.hp)+' / '+fmt(b.maxHp),x+w,y+h+18);
 g.textAlign='center'; g.font='700 11px sans-serif';
 for(let i=1;i<=3;i++){ g.fillStyle=i<=b.phase?b.col:'#3a4560'; circ(g,W/2-24+(i-1)*24,y+h+14,5); g.fill(); }
 g.fillStyle='#fff2a8'; g.fillText('✦ 약점 쪽에서 쏘면 2배',W/2,y+h+30);
 g.restore();
}
