/* ═══════════ 15초 광고 ═══════════
   실제 게임 엔진으로 장면을 연출하고, 그 위에 자막과 연출을 덧그려 한 장의 캔버스로 합친다.
   ?record 로 열면 화면과 소리를 녹화해서 파일로 저장한다. */
const ad=$('#ad'), ac=ad.getContext('2d');
const AD_T=15, FONTK="'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif", FONTD="Orbitron,'Noto Sans KR',sans-serif";
let adFlash=null;
screenFlash=function(col){ adFlash={col:col,t:1}; };

/* 장면표 (초) */
const SC={I:[0,2.0],A:[2.0,5.0],B:[5.0,7.6],C:[7.6,11.0],D:[11.0,12.9],E:[12.9,15]};
const MUTE={pulse:1,gatling:1,rail:1,sniper:1,bounce:1,shotgun:1,laser:1,mortar:1,missile:1,mine:1,plasma:1,overcharge:1,arc:1,cryo:1,freeze:1,venom:1,flame:1,grav:1,sonic:1,mark:1,net:1,drone:1,heal:1,jam:1,blink:1,spawn:1,leak:1,shieldbreak:1,build:1,upgrade:1,click:1,die:1,sell:1,nope:1,star:1};
const _play=SND.play.bind(SND);
SND.play=function(n,g){ if(MUTE[n]) return; _play(n,g); };

const SFX=[[2.0,'wave'],[7.65,'bossin'],[11.1,'augshow'],[11.5,'aug1'],[11.9,'aug2'],[12.3,'aug3'],[12.95,'unlock'],[13.9,'win']];
let prebuiltA=false, sfxI=0, cur='', tNow=0, simAcc=0, hero=null, snap=null, bossRef=null, evoDone=false, cineDone=false, phaseDone=false, killDone=false, chargeDone=false;

/* ── 연출 도구 ── */
const ease=(t)=>t<0?0:(t>1?1:1-Math.pow(1-t,3));
const eob=(t)=>{ t=clamp(t,0,1); const c=1.70158; return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2); };
function glowText(g,s,x,y,size,fill,glowCol,align,font,blur){
 g.save(); g.textAlign=align||'center'; g.textBaseline='middle'; g.font=(font||'800')+' '+size+'px '+FONTK;
 g.shadowColor=glowCol||fill; g.shadowBlur=blur===undefined?size*.5:blur; g.fillStyle=fill; g.fillText(s,x,y);
 g.shadowBlur=0; g.fillText(s,x,y); g.restore();
}
function caption(g,t,head,sub,col){
 /* t: 장면 안에서 흐른 시간. 아래에서 미끄러져 올라온다 */
 const k=eob(t/.45), a=clamp(t/.25,0,1), y=H-110+(1-k)*40;
 g.save(); g.globalAlpha=a;
 const grad=g.createLinearGradient(0,H-220,0,H); grad.addColorStop(0,'rgba(0,0,0,0)'); grad.addColorStop(1,'rgba(0,0,0,.72)');
 g.fillStyle=grad; g.fillRect(0,H-220,W,220);
 glowText(g,head,W/2,y,58,'#ffffff',col||'#2fe0ff','center','900');
 g.fillStyle=col||'#2fe0ff'; g.globalAlpha=a*.9; g.fillRect(W/2-90*k,y+38,180*k,4);
 g.globalAlpha=a; glowText(g,sub,W/2,y+68,24,'#cfe2ff','#000','center','600',6);
 g.restore();
}
function vignette(g){
 const vg=g.createRadialGradient(W/2,H/2,H*.5,W/2,H/2,H*.98); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.5)');
 g.fillStyle=vg; g.fillRect(0,0,W,H);
 g.fillStyle='rgba(255,255,255,.025)';
 for(let y=(tNow*40)%4;y<H;y+=4) g.fillRect(0,y,W,1);
}
function cityBG(g,T,eye){
 const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#090418'); gr.addColorStop(.6,'#0b1430'); gr.addColorStop(1,'#04060e');
 g.fillStyle=gr; g.fillRect(0,0,W,H);
 const ox=W/2, oy=H*.34, R=230*(.6+.4*eye);
 const og=g.createRadialGradient(ox,oy,0,ox,oy,R*2.3); og.addColorStop(0,'rgba(255,40,80,'+(.45*eye)+')'); og.addColorStop(1,'rgba(255,40,80,0)');
 g.fillStyle=og; g.fillRect(0,0,W,H);
 g.save(); g.translate(ox,oy); g.rotate(T*.15); g.strokeStyle='rgba(255,77,109,'+(.5*eye)+')'; g.lineWidth=4; poly(g,0,0,R,3,0); g.stroke();
 g.rotate(-T*.35); g.strokeStyle='rgba(255,194,71,'+(.35*eye)+')'; poly(g,0,0,R*.82,6,0); g.stroke();
 g.fillStyle='rgba(255,40,80,'+((.35+.12*Math.sin(T*3))*eye)+')'; g.beginPath(); g.ellipse(0,0,R*.42,R*.2*eye+2,0,0,TAU); g.fill();
 g.fillStyle='rgba(255,230,235,'+(.7*eye)+')'; g.beginPath(); g.ellipse(0,0,R*.08,R*.16*eye+1,0,0,TAU); g.fill();
 g.restore();
 const rng=mulberry32(7);
 for(let i=0;i<64;i++){
  const bx=rng()*W, bw=24+rng()*60, bh=90+rng()*260, by=H-bh, c=rng()<.5?'#2fe0ff':'#ff4fd8', ph=rng()*9;
  g.fillStyle='#070c1c'; g.fillRect(bx,by,bw,bh);
  for(let k=0;k<bh/18;k++){ if(((k*7+ph)|0)%3===0) continue; g.fillStyle=hexA(c,(.18+.16*Math.sin(T*1.5+ph+k))*(1-.7*eye*(i%2))); g.fillRect(bx+4,by+8+k*18,bw-8,3); }
  g.fillStyle=hexA(c,.7*(1-.6*eye)); g.fillRect(bx,by,bw,2);
 }
 /* 비 */
 g.strokeStyle='rgba(160,200,255,.25)'; g.lineWidth=1.3;
 for(let i=0;i<110;i++){ const x=(i*97.3+T*180)%(W+80)-40, y=((i*53.1)+T*900)%(H+60)-30; g.beginPath(); g.moveTo(x,y); g.lineTo(x-7,y+26); g.stroke(); }
}

/* ── 전투 장면 준비 ── */
function setupBattle(idx,types,count){
 const was=SND.on; SND.on=false;
 startStage(STAGES[idx],false,types,['orbital','freeze']);
 G.talking=false; document.querySelectorAll('.talk').forEach(e=>e.remove()); closeModal(); tutEnd(false);
 G.gold=1e7;
 const pts=[...G.pathTiles].map(k=>k.split(',').map(Number)), cand=[];
 for(let ty=0;ty<ROWS;ty++) for(let tx=0;tx<COLS;tx++){
  if(!buildable(tx,ty)) continue;
  let c=0; for(const p of pts){ const dx=p[0]-tx, dy=p[1]-ty; if(dx*dx+dy*dy<=9) c++; }
  if(c>=3) cand.push({tx:tx,ty:ty,c:c});
 }
 cand.sort((a,b)=>b.c-a.c);
 const picks=[];
 for(const k of cand){ if(picks.length>=count) break; if(picks.every(o=>Math.max(Math.abs(o.tx-k.tx),Math.abs(o.ty-k.ty))>=2)) picks.push(k); }
 const towers=[];
 picks.forEach((k,i)=>{ const t=tryPlace(types[i%types.length],k.tx,k.ty); if(t) towers.push(t); });
 hero=null;
 towers.forEach((t,i)=>{
  upgradeTower(t); upgradeTower(t);
  if(t.id==='pulse'&&!hero) hero=t; else upgradeTower(t,i%2?'B':'A');
 });
 G.buy=null; G.sel=null;
 G.fx=[]; G.parts=[]; G.texts=[];
 SND.on=was;
 return towers;
}
function keepAlive(){ if(G.gold<1e6) G.gold=1e7; G.lives=20; G.cShield=30; }
function preSim(sec){ for(let i=0;i<sec*60;i++){ keepAlive(); step(FIX); } }
function centroid(){
 let x=0,y=0,n=0;
 for(const e of G.enemies){ if(e.alive&&e.x>40&&e.x<W-40){ x+=e.x; y+=e.y; n++; } }
 return n?{x:x/n,y:y/n}:{x:W/2,y:H/2};
}

/* ── 장면 시작 ── */
function enterScene(name){
 cur=name;
 if(name==='A'){
  if(prebuiltA){ prebuiltA=false; return; }
  const all=['laser','plasma','arc','missile','cryo','mortar','sniper','pulse'];
  setupBattle(13,all,16);
  G.wave=7; G.prep=.01; callWave();
  preSim(4);
  /* 화면이 북적이도록 적을 길 전체에 흩뿌린다 (체력을 높여 빔 아래서 오래 버티게) */
  const ty=['drone','swift','brute','shield','bearer','berserk','flyer','phase','blinker','carrier'];
  for(let i=0;i<36;i++) spawnEnemy(ty[i%ty.length],i%2,60+i*32,5*hpMulNow(8));
  preSim(1.2);
  G.cam={x:W/2,y:H/2,z:1.0};
 } else if(name==='B'){
  evoDone=false;
 } else if(name==='C'){
  const was=SND.on;
  const all=['laser','plasma','arc','missile','cryo','mortar','sniper','pulse'];
  setupBattle(5,all,15);
  SND.on=false;
  G.wave=G.totalWaves-1; G.prep=.01; callWave();
  G.queue=G.queue.filter(q=>q.t!=='crusher');
  preSim(1.5);
  bossRef=spawnEnemy('crusher',0,880,1); bossRef.tA=99;
  const esc=['drone','swift','brute','shield','berserk'];
  for(let i=0;i<20;i++) spawnEnemy(esc[i%5],0,780-i*30,4*hpMulNow(8));
  G.bossPending=null;
  preSim(.3);
  G.fx=[]; G.parts=[]; G.texts=[];
  SND.on=was;
  cineDone=false; phaseDone=false; killDone=false; chargeDone=false;
  G.cam={x:W/2,y:H/2,z:1};
 } else if(name==='D'){
  snap=document.createElement('canvas'); snap.width=W; snap.height=H;
  snap.getContext('2d').drawImage(ad,0,0);
 }
}

/* ── 한 프레임 진행 ── */
function advance(dt){
 const t=tNow+dt; tNow=t;
 for(const n of Object.keys(SC)){ if(t>=SC[n][0]&&t<SC[n][1]&&cur!==n) enterScene(n); }
 while(sfxI<SFX.length&&SFX[sfxI][0]<=t){ _play(SFX[sfxI][1]); sfxI++; }
 const lt=t-(SC[cur]?SC[cur][0]:0);
 let sc=1;
 if(G.slowmo>0){ G.slowmo-=dt; sc=.3; }
 if(adFlash){ adFlash.t-=dt*3.2; if(adFlash.t<=0) adFlash=null; }
 const fight=(cur==='A'||cur==='B'||cur==='C');
 if(fight){
  simAcc+=Math.min(dt,.05)*sc;
  let g=0; while(simAcc>=FIX&&g++<6){ simAcc-=FIX; keepAlive(); step(FIX); }
 }
 /* 카메라와 사건 */
 if(cur==='A'){
  const c=centroid(), k=lt/3.2;
  G.cam.z=1.0+.22*easeInOut(clamp(k,0,1));
  const mx=(c.x+W*.5)/2, my=(c.y+H*.5)/2;
  G.cam.x=lerp(G.cam.x,clamp(mx,W/2/G.cam.z,W-W/2/G.cam.z),.04);
  G.cam.y=lerp(G.cam.y,clamp(my,H/2/G.cam.z,H-H/2/G.cam.z),.04);
 } else if(cur==='B'){
  if(hero){
   const k=easeInOut(clamp(lt/.7,0,1)), z=1.25+1.25*k;
   G.cam.z=z; G.cam.x=lerp(G.cam.x,clamp(hero.x,W/2/z,W-W/2/z),.12); G.cam.y=lerp(G.cam.y,clamp(hero.y,H/2/z,H-H/2/z),.12);
   if(!evoDone&&lt>=.75){ evoDone=true; hero.mode='first'; upgradeTower(hero,'A'); G.shake=Math.max(G.shake,6); screenFlash('rgba(255,215,120,.55)'); }
  }
 } else if(cur==='C'&&bossRef){
  const b=bossRef;
  if(lt<1.5){
   const k=easeInOut(clamp(lt/.55,0,1)), out=lt>1.15?easeInOut((lt-1.15)/.35):0, z=lerp(1,2.0,k)*(1-out)+1.15*out;
   G.cam.z=z; G.cam.x=lerp(G.cam.x,clamp(b.x,W/2/z,W-W/2/z),.2); G.cam.y=lerp(G.cam.y,clamp(b.y,H/2/z,H-H/2/z),.2);
   b.bossHold=Math.max(b.bossHold||0,.1);
  } else {
   const z=1.15+.1*clamp((lt-1.5)/1.5,0,1);
   G.cam.z=z; G.cam.x=lerp(G.cam.x,clamp(b.x,W/2/z,W-W/2/z),.08); G.cam.y=lerp(G.cam.y,clamp(b.y,H/2/z,H-H/2/z),.08);
  }
  if(!chargeDone&&lt>=1.55){ chargeDone=true; startTele(b,{k:'charge',t:.9}); SND.play('charge'); }
  if(!phaseDone&&lt>=2.05){ phaseDone=true; b.hp=b.maxHp*.6; }
  if(!killDone&&lt>=2.6){ killDone=true; b.invuln=0; b.hp=1; hurt(b,99999999,{kind:'true'}); }
 }
}

/* ── 그리기 ── */
function drawGame(){ render(); ac.drawImage(cv,0,0); }
function drawFrame(){
 const t=tNow, g=ac, lt=t-(SC[cur]?SC[cur][0]:0);
 g.setTransform(1,0,0,1,0,0); g.globalAlpha=1;
 if(cur==='I'||!cur){
  const eye=ease((t-.15)/1.5);
  cityBG(g,t,eye);
  const a1=clamp((t-.3)/.35,0,1), a2=clamp((t-1.0)/.35,0,1);
  g.save(); g.globalAlpha=a1; glowText(g,'도시의 불이 꺼진다…',W/2,H*.7,50,'#eaf4ff','#2fe0ff'); g.restore();
  g.save(); g.globalAlpha=a2; glowText(g,'오버로드가 깨어났다.',W/2,H*.7+66,44,'#ff6b88','#ff1f4b'); g.restore();
 } else if(cur==='A'){
  drawGame();
  caption(g,lt,'방어탑 20종','사격 · 폭발 · 원소 · 제어 · 지원','#2fe0ff');
 } else if(cur==='B'){
  drawGame();
  if(lt>.85){
   const k=lt-.85, t0=eob(k/.5);
   const names=[['A',TOWERS.pulse.evo.A.n,'#ffc247','A'],['B',TOWERS.pulse.evo.B.n,'#ff4fd8','B']];
   g.save();
   names.forEach((n,i)=>{
    const x=W/2+(i?1:-1)*270, y=150, s=t0, a=clamp(k/.25,0,1), cw=380, chh=130;
    g.globalAlpha=a;
    g.fillStyle='rgba(8,14,30,.9)'; g.strokeStyle=n[2]; g.lineWidth=3;
    rrect(g,x-cw/2*s,y-chh/2*s,cw*s,chh*s,16); g.fill(); g.stroke();
    if(s>.6){
     const ic=adIcon(i?'B':'A'); g.drawImage(ic,x-cw/2+14,y-46,92,92);
     glowText(g,n[0]+' · '+n[1],x-cw/2+116,y-18,28,'#ffffff',n[2],'left','800',10);
     glowText(g,i?'일직선으로 꿰뚫는 레일':'쏠수록 빨라지는 연사',x-cw/2+116,y+22,19,'#cfe2ff','#000','left','600',4);
    }
    g.globalAlpha=1;
   });
   glowText(g,'VS',W/2,150,34,'#ffffff','#ffffff','center','900',12);
   g.restore();
  }
  caption(g,Math.max(0,lt-.2),'갈래 진화','같은 탑도 A와 B, 전혀 다른 40가지 모습','#ffc247');
 } else if(cur==='C'){
  drawGame();
  if(lt<1.6){
   const k=lt/1.5;
   g.fillStyle='rgba(0,0,0,'+(.5*Math.sin(clamp(k,0,1)*Math.PI))+')'; g.fillRect(0,0,W,H);
   g.fillStyle='rgba(255,30,60,.85)'; g.fillRect(0,H*.14-3,W*ease(lt/.3),4); g.fillRect(W-W*ease(lt/.3),H*.43,W*ease(lt/.3),4);
   const a=clamp(lt/.2,0,1);
   g.save(); g.globalAlpha=a; glowText(g,'WARNING · GIANT BOSS',W/2,H*.2,24,'#ff8da1','#ff1f4b','center','700');
   const s=1+Math.max(0,1-lt/.35)*1.4; g.translate(W/2,H*.29); g.scale(s,s);
   glowText(g,'기가 크러셔',0,0,86,'#ffffff','#ff1f4b','center','900',40);
   g.restore();
   g.save(); g.globalAlpha=clamp((lt-.5)/.3,0,1); glowText(g,'“길을 비켜라, 작은 불빛들.”',W/2,H*.38,26,'#ffd0d8','#000','center','600',6); g.restore();
  } else {
   caption(g,lt-1.6,'거대 보스 3종','3단계 패턴 · 약점을 노려라','#ff4d6d');
  }
 } else if(cur==='D'){
  g.save(); g.filter='blur(8px) brightness(.8) saturate(1.2)'; g.drawImage(snap,-20,-20,W+40,H+40); g.restore();
  g.fillStyle='rgba(5,8,20,.42)'; g.fillRect(0,0,W,H);
  glowText(g,'증강 120종',W/2,92,64,'#ffffff','#ff4fd8','center','900');
  glowText(g,'아수라장 — 끝없이 강해지는 적, 매번 달라지는 선택',W/2,150,24,'#cfe2ff','#000','center','600',6);
  const cards=[['일반','#b9c6ff','쌍열 총신','펄스 터렛이 두 발씩 쏜다.',1],['희귀','#ffc247','이중 진화','다음 진화 탑이\nA와 B 능력을 모두 얻는다.',2],['전설','#ff4fd8','시간의 주인','시간 동결 쿨타임 10초.\n대신 다른 스킬은 못 쓴다.',3]];
  cards.forEach((c,i)=>{
   const k=clamp((lt-.1-i*.4)/.45,0,1); if(k<=0) return;
   const x=W/2+(i-1)*330, y=H*.58, e=eob(k);
   g.save(); g.translate(x,y); g.scale(e,e*(.2+.8*Math.min(1,k*2)));
   g.globalAlpha=Math.min(1,k*2.5);
   const cw=290, ch=330;
   const gr=g.createLinearGradient(0,-ch/2,0,ch/2); gr.addColorStop(0,c[4]===3?'rgba(255,79,216,.35)':'rgba(255,255,255,.1)'); gr.addColorStop(1,'rgba(10,16,34,.95)');
   g.fillStyle=gr; g.strokeStyle=c[1]; g.lineWidth=c[4]===3?5:3; rrect(g,-cw/2,-ch/2,cw,ch,18); g.fill();
   g.shadowColor=c[1]; g.shadowBlur=c[4]===3?36:14; g.stroke(); g.shadowBlur=0;
   g.textAlign='center'; g.textBaseline='middle';
   g.font='800 15px '+FONTK; g.fillStyle=c[1]; g.fillText(c[0],0,-ch/2+34);
   glowText(g,c[2],0,-ch/2+92,36,'#ffffff',c[1],'center','900',c[4]===3?24:8);
   g.font='600 20px '+FONTK; g.fillStyle='#b9c9e8';
   c[3].split('\n').forEach((s,j)=>g.fillText(s,0,-ch/2+170+j*30));
   if(c[4]===3){ const sx=((lt*1.2+i)%1.6-.3)*cw*1.6-cw; g.save(); rrect(g,-cw/2,-ch/2,cw,ch,18); g.clip(); g.fillStyle='rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(sx,-ch/2); g.lineTo(sx+60,-ch/2); g.lineTo(sx-20,ch/2); g.lineTo(sx-80,ch/2); g.closePath(); g.fill(); g.restore(); }
   g.restore();
  });
 } else if(cur==='E'){
  cityBG(g,t,.25);
  g.fillStyle='rgba(4,6,16,.5)'; g.fillRect(0,0,W,H);
  const k=eob(lt/.6), a=clamp(lt/.3,0,1);
  g.save(); g.globalAlpha=a; g.translate(W/2,H*.27); g.scale(k,k);
  g.rotate(t*.6); g.strokeStyle='rgba(255,79,216,.8)'; g.lineWidth=3; poly(g,0,0,46,6,0); g.stroke();
  g.rotate(-t*1.4); g.strokeStyle='rgba(47,224,255,.9)'; poly(g,0,0,34,6,0); g.stroke();
  g.rotate(t*.8); g.fillStyle='#2fe0ff'; g.shadowColor='#2fe0ff'; g.shadowBlur=30; poly(g,0,0,18,6,Math.PI/6); g.fill(); g.restore();
  g.save(); g.globalAlpha=a; glowText(g,'네온 코어 디펜스',W/2,H*.46,88,'#ffffff','#2fe0ff','center','900',46);
  const tg=ac.createLinearGradient(W/2-300,0,W/2+300,0); tg.addColorStop(0,'#ff4fd8'); tg.addColorStop(.5,'#ff4d6d'); tg.addColorStop(1,'#ffc247');
  g.font='900 76px '+FONTD; g.textAlign='center'; g.textBaseline='middle'; g.shadowColor='#ff4fd8'; g.shadowBlur=34; g.fillStyle=tg;
  const spacing='O V E R L O A D'; g.fillText(spacing,W/2,H*.6+(1-k)*20); g.shadowBlur=0; g.fillText(spacing,W/2,H*.6+(1-k)*20);
  g.restore();
  const a2=clamp((lt-.35)/.3,0,1);
  g.save(); g.globalAlpha=a2; glowText(g,'5분 만에 한 판, 그런데 멈출 수 없다.',W/2,H*.71,34,'#eaf4ff','#2fe0ff','center','700',14); g.restore();
  const a3=clamp((lt-.6)/.3,0,1);
  if(a3>0){
   g.save(); g.globalAlpha=a3; const pw=470, ph=64, px=W/2-pw/2, py=H*.8;
   const pg=g.createLinearGradient(px,py,px,py+ph); pg.addColorStop(0,'#5af0ff'); pg.addColorStop(1,'#18b9e0'); g.fillStyle=pg; g.shadowColor='#2fe0ff'; g.shadowBlur=28; rrect(g,px,py,pw,ph,32); g.fill(); g.shadowBlur=0;
   g.fillStyle='#03202b'; g.font='900 28px '+FONTK; g.textAlign='center'; g.textBaseline='middle'; g.fillText('지금 바로 플레이 ▶',W/2,py+ph/2+1);
   glowText(g,'yeonny3209.github.io/neon-core-overload',W/2,py+ph+38,22,'#cfe2ff','#000','center','600',6);
   glowText(g,'웹 · 안드로이드',W/2,py+ph+68,18,'#8fa6cc','#000','center','600',4);
   g.restore();
  }
 }
 vignette(g);
 if(adFlash){ g.fillStyle=adFlash.col; g.globalAlpha=adFlash.t*.85; g.fillRect(0,0,W,H); g.globalAlpha=1; }
 /* 장면이 바뀌는 순간 하얀 섬광 */
 for(const n of ['A','C','D','E']){ const d=t-SC[n][0]; if(d>=0&&d<.2){ g.fillStyle='rgba(255,255,255,'+((1-d/.2)*.8)+')'; g.fillRect(0,0,W,H); } }
 if(t>14.65){ g.fillStyle='rgba(0,0,0,'+clamp((t-14.65)/.35,0,1)+')'; g.fillRect(0,0,W,H); }
}
const _ic={};
function adIcon(k){
 if(_ic[k]) return _ic[k];
 const c=document.createElement('canvas'); towerIcon(c,'pulse',k); _ic[k]=c; return c;
}
G.cam={x:W/2,y:H/2,z:1};

/* ── 재생 · 녹화 ── */
const AD={running:false,rec:null};
function adTick(dt){ advance(dt); drawFrame(); }
/* 미리보기용: 지정한 시각까지 정해진 간격으로 진행하고 한 장을 그린다 */
window.__ad={
 reset(){ tNow=0; sfxI=SFX.length; cur=''; simAcc=0; },
 run(to){ let n=0; while(tNow<to-1e-6&&n++<5000){ advance(Math.min(1/60,to-tNow)); } drawFrame(); return tNow; }
};
async function adRecord(){
 SAVE.d.set.sfx=.8; SAVE.d.set.mus=1;
 for(const s of STAGES){ SAVE.d.cleared[s.id]=1; SAVE.d.seenTalk[s.id]=1; }
 for(const k in ENEMIES) SAVE.d.seenEnemy[k]=1;
 SAVE.d.tut=true; SAVE.d.seenTalk.ch0=SAVE.d.seenTalk.ch1=SAVE.d.seenTalk.ch2=1;
 document.title='1 init'; SND.init(); SND.resume(); SND.applyVol();
 await document.fonts.ready; document.title='2 fonts '+(SND.ctx&&SND.ctx.state);
 const dest=SND.ctx.createMediaStreamDestination(); SND.master.connect(dest);
 SND.intensity=.9; SND.inten=.9; SND.music('ch1');
 for(let i=0;i<100&&!SND.mp3Buf;i++) await new Promise(r=>setTimeout(r,100));
 document.title='3 mp3 '+(!!SND.mp3Buf); await new Promise(r=>setTimeout(r,200));
 /* 장면을 미리 한 번 돌려 두어 첫 순간에 멈칫하지 않게 한다 */
 enterScene('A'); prebuiltA=true; cur=''; tNow=0; sfxI=0; simAcc=0; G.slowmo=0;
 SND.music('ch1');
 document.title='4 scenes'; const vs=ad.captureStream(60);
 const stream=new MediaStream([...vs.getVideoTracks(),...dest.stream.getAudioTracks()]);
 const types=['video/mp4;codecs=avc1.640028,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm'];
 const mime=types.find(t=>MediaRecorder.isTypeSupported(t));
 const chunks=[];
 const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:12e6,audioBitsPerSecond:192e3});
 rec.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
 const done=new Promise(r=>rec.onstop=r);
 rec.start(250); document.title='5 rec '+mime;
 let last=performance.now(), start=last;
 SND.gMus.gain.cancelScheduledValues(SND.ctx.currentTime); SND.gMus.gain.setValueAtTime(0,SND.ctx.currentTime); SND.gMus.gain.linearRampToValueAtTime(.38,SND.ctx.currentTime+.6);
 await new Promise(res=>{
  const f=()=>{
   const now=performance.now(), dt=Math.min(.5,(now-last)/1000); last=now;
   adTick(dt); if(((tNow*4)|0)!==AD.q){ AD.q=(tNow*4)|0; document.title='t='+tNow.toFixed(2)+' '+cur; }
   if(tNow>=14.45&&!AD.fade){ AD.fade=1; SND.gMus.gain.setTargetAtTime(0,SND.ctx.currentTime,.18); }
   if(tNow>=AD_T){ res(); return; }
   requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
 });
 rec.stop(); await done;
 const ext=mime.indexOf('mp4')>=0?'mp4':'webm';
 const blob=new Blob(chunks,{type:mime});
 const r=await fetch('/save?name=neon-core-overload-ad.'+ext,{method:'POST',body:blob});
 document.title='SAVED '+ext+' '+blob.size+' '+mime+' '+((performance.now()-start)/1000).toFixed(1)+'s';
}
if(/[?&]record/.test(location.search)) setTimeout(()=>adRecord().catch(e=>{ document.title='ERR '+e.message; }),1200);
else if(/[?&]live/.test(location.search)){ let last=performance.now(); SND.init(); const f=()=>{ const n=performance.now(); adTick(Math.min(.05,(n-last)/1000)); last=n; if(tNow<AD_T) requestAnimationFrame(f); }; requestAnimationFrame(f); }
