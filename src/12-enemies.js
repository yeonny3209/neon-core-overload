/* ═══════════ 적 ═══════════ */
function spawnEnemy(type,lane,dist,hpMul){
 const D=ENEMIES[type], A=G.aug;
 let hm=(hpMul||1)*(G.hard?1.6:1)*(A.reverse_path?2:1);
 if(D.boss&&G.mode==='campaign') hm=(G.hard?1.6:1)*(A.reverse_path?2:1);
 const chArmor=G.mode==='chaos'?Math.floor(G.wave*.35):(G.st?G.st.ch*2:0);
 const e={type:type,D:D,lane:lane||0,dist:Math.max(0,dist||0),x:0,y:0,ang:0,prog:0,
  hp:D.hp*hm,maxHp:D.hp*hm,hpMulBase:hpMul||1,armor:D.armor+(D.boss?0:chArmor),
  shield:D.shield?D.shield.amt*hm:0,shieldMax:D.shield?D.shield.amt*hm:0,shieldT:0,
  spd:D.spd,gold:D.gold,r:D.r,col:D.col,air:!!D.air,alive:true,hitT:0,
  slow:0,slowT:0,freeze:0,stun:0,root:0,pois:[],markT:0,markV:0,bounty:false,shred:0,crack:0,auraSlow:0,
  vis:!D.stealth,blinkCd:D.blink?D.blink.cd*.6:0,blinkT:0,jamCd:D.jam?D.jam.cd*.6:0,healCd:rnd(.2,1),
  invuln:0,age:0,wob:Math.random()*TAU,padT:0,blockT:0,wpHit:0};
 if(G.mode==='chaos') e.spd*=1+Math.min(.5,G.wave*.01);
 if(D.giant) initBoss(e);
 const p=e.air?airAt(e.lane,e.dist):ptAt(e.lane,e.dist);
 e.x=p.x; e.y=p.y; e.ang=p.ang;
 G.enemies.push(e);
 if(!SAVE.d.seenEnemy[type]&&!D.minion&&!D.giant&&G.mode==='campaign'&&!G.intro){ G.intro=type; }
 return e;
}

function updateEnemies(dt){
 const A=G.aug, towers=G.towers;
 /* 지원 정보: 레이더 범위, 은신 감지 */
 let radars=null;
 if(A.radar_mark||G.enemies.some(e=>e.D.stealth)) radars=towers.filter(t=>t.id==='radar');
 for(let i=G.enemies.length-1;i>=0;i--){
  const e=G.enemies[i];
  if(!e.alive){ G.enemies.splice(i,1); continue; }
  e.age+=dt; e.wob+=dt*6;
  if(e.hitT>0) e.hitT-=dt;
  if(e.blockT>0) e.blockT-=dt;
  if(e.wpHit>0) e.wpHit-=dt;
  if(e.invuln>0) e.invuln-=dt;
  if(e.slowT>0){ e.slowT-=dt; if(e.slowT<=0) e.slow=0; }
  if(e.freeze>0) e.freeze-=dt;
  if(e.stun>0) e.stun-=dt;
  if(e.root>0) e.root-=dt;
  if(e.markT>0) e.markT-=dt;
  if(e.padT>0) e.padT-=dt;
  /* 은신 · 레이더 */
  if(e.D.stealth){
   let v=!!A.stealth_reveal;
   if(!v) for(const t of towers){ if(d2(t.x,t.y,e.x,e.y)<92*92){ v=true; break; } }
   if(!v&&radars) for(const r of radars){ const x=S(r,r.wep[0]); if(x.reveal&&d2(r.x,r.y,e.x,e.y)<x.reveal*x.reveal){ v=true; break; } }
   e.vis=v;
  }
  if(A.radar_mark&&radars){ e.radarMk=false; for(const r of radars){ const x=S(r,r.wep[0]); if(d2(r.x,r.y,e.x,e.y)<x.rng*x.rng){ e.radarMk=true; break; } } }
  /* 독 · 화상 */
  if(e.pois.length){
   for(let k=e.pois.length-1;k>=0;k--){
    const q=e.pois[k]; q.t-=dt;
    hurt(e,q.dps*dt,{src:q.src,kind:'dot',silent:true});
    if(q.t<=0) e.pois.splice(k,1);
    if(!e.alive) break;
   }
   if(!e.alive){ G.enemies.splice(i,1); continue; }
   if(!G.lowfx&&Math.random()<dt*6) part(e.x+rnd(-6,6),e.y+rnd(-6,6),rnd(-9,9),-rnd(12,30),.5,2,e.pois[0]&&e.pois[0].tag==='burn'?'#ff9a3c':'#7dff9b');
  }
  if(e.D.shield&&e.shield<e.shieldMax){
   if(e.shieldT>0) e.shieldT-=dt;
   else e.shield=Math.min(e.shieldMax,e.shield+e.D.shield.regen*(e.shieldMax/e.D.shield.amt)*dt);
  }
  if(e.D.heal) enemyHeal(e,dt);
  if(e.D.blink) enemyBlink(e,dt);
  if(e.D.jam) enemyJam(e,dt);
  if(e.D.giant) bossThink(e,dt);
  if(!e.alive){ G.enemies.splice(i,1); continue; }

  /* 이동 */
  const LP=G.paths[e.lane]||G.paths[0];
  let sp=e.spd*(e.air?LP.airMul:LP.spdMul);
  if(A.chrono) sp*=1.3;
  if(A.reverse_path) sp*=.5;
  if(A.boss_slow&&e.D.boss) sp*=.7;
  if(G.overload&&!e.D.boss) sp*=1.2;
  if(e.D.berserk) sp*=1+(1-e.hp/e.maxHp)*e.D.berserk;
  if(e.padT>0) sp*=A.pad_reverse?.6:1.5;
  if(e.dash) sp*=6;
  const sl=Math.max(e.slowT>0?e.slow:0,e.auraSlow);
  e.auraSlow=0;
  sp*=1-Math.min(.85,sl);
  if(e.freeze>0||e.stun>0||e.root>0||G.freezeT>0&&!(e.D.boss&&G.freezeT<G.freezeBoss)) sp=0;
  if(e.bossHold>0) sp=0;
  e.dist+=sp*dt;
  if(e.dash){ e.dashLeft-=sp*dt; if(e.dashLeft<=0) e.dash=false; }
  const P=G.paths[e.lane]||G.paths[0], len=e.air?P.airLen:P.total;
  e.prog=e.dist/len+(e.D.boss?0:0);
  if(e.dist>=len){ leak(e); G.enemies.splice(i,1); continue; }
  const p=e.air?airAt(e.lane,e.dist):ptAt(e.lane,e.dist);
  e.x=p.x; e.y=p.y; e.ang=p.ang;
  /* 가속 패드 */
  if(G.pads.length&&!e.air&&e.padT<=0) for(const pd of G.pads){ if(d2(pd.x,pd.y,e.x,e.y)<20*20){ e.padT=3; break; } }
 }
}
function enemyHeal(e,dt){
 e.healCd-=dt;
 if(e.healCd>0) return;
 e.healCd=e.D.heal.cd;
 const r2=e.D.heal.rad*e.D.heal.rad, amt=e.D.heal.amt*e.hpMulBase*(G.aug.heal_block?.2:1);
 let n=0;
 for(const o of G.enemies){
  if(!o.alive||o===e||o.hp>=o.maxHp||d2(e.x,e.y,o.x,o.y)>r2) continue;
  o.hp=Math.min(o.maxHp,o.hp+amt); beamFx(e.x,e.y,o.x,o.y,'#6effc4',.3,2);
  if(++n>=3) break;
 }
 if(n){ ring(e.x,e.y,e.D.heal.rad,'#6effc4',.4,1.5); SND.play('heal',300); }
}
function enemyBlink(e,dt){
 const held=e.freeze>0||e.stun>0||e.root>0;
 if(e.blinkT>0){
  if(held){ e.blinkT=0; return; }
  e.blinkT-=dt;
  if(e.blinkT<=0){
   const len=G.paths[e.lane].total, nd=Math.min(e.dist+e.D.blink.dist,len-8);
   if(nd>e.dist){
    ring(e.x,e.y,e.r+8,e.col,.35,2); burst(e.x,e.y,e.col,8,1.1);
    e.dist=nd; const p=ptAt(e.lane,nd); e.x=p.x; e.y=p.y;
    ring(e.x,e.y,e.r+8,e.col,.35,2); SND.play('blink',80);
   }
  }
 } else if(!held){
  e.blinkCd-=dt;
  if(e.blinkCd<=0){ e.blinkT=e.D.blink.tele; e.blinkCd=e.D.blink.cd; }
 }
}
function jamTower(t,dur){
 dur*=G.aug.jam_immune?.3:1;
 t.jam=Math.max(t.jam,G.time+dur);
 ring(t.x,t.y,26,'#ffd34d',.4,2); say(t.x,t.y-18,'정지','#ffd34d',11);
 G.buffsDirty=true;
}
function enemyJam(e,dt){
 if(e.freeze>0||e.stun>0) return;
 e.jamCd-=dt;
 if(e.jamCd>0) return;
 const J=e.D.jam; let best=null, bd=J.rad*J.rad;
 for(const t of G.towers){ if(t.D.sup||t.jam>G.time) continue; const dd=d2(e.x,e.y,t.x,t.y); if(dd<bd){ bd=dd; best=t; } }
 if(best){ jamTower(best,J.dur); beamFx(e.x,e.y,best.x,best.y,'#ffd34d',.3,2); e.jamCd=J.cd; SND.play('jam',120); }
 else e.jamCd=.4;
}
function leak(e){
 e.alive=false;
 let dmg=e.D.leak;
 if(G.cShield>0){
  const b=Math.min(G.cShield,dmg); G.cShield-=b; dmg-=b;
  ring(G.paths[0].core.x,G.paths[0].core.y,46,'#7dfcff',.5,3);
  if(G.aug.barrier_spike){ splash(e.x,e.y,90,160*(1+G.wave*.15),null,{air:true}); boom(e.x,e.y,90,'#7dfcff'); }
 }
 if(dmg<=0) return;
 G.lives-=dmg;
 G.stats.leaked+=dmg;
 if(e.D.split||e.splitFrom||e.type==='shard'||e.hiveKid) G.stats.splitLeak++;
 G.shake=Math.max(G.shake,e.D.boss?24:8);
 screenFlash('rgba(255,60,90,.55)');
 SND.play('leak',120);
 const c=G.paths[0].core;
 say(c.x,c.y-34,'-'+dmg,'#ff4d6d',18);
 if(G.aug.nuke&&!G.nukeUsed&&G.lives<=5&&G.lives>0){ G.nukeUsed=true; nuke(); }
 if(G.lives<=0){
  if(G.aug.phoenix&&!G.phoenixUsed){ G.phoenixUsed=true; G.lives=G.maxLives; toast('불사조 코어가 되살아났어요!','gold'); ring(c.x,c.y,200,'#ffc247',1,5); burst(c.x,c.y,'#ffc247',60,3); }
  else { G.lives=0; gameOver(false); }
 }
}
function nuke(){
 const c=G.paths[0].core;
 for(const e of G.enemies) if(e.alive) hurt(e,e.D.boss?e.maxHp*.15:e.hp+e.shield+1,{kind:'true',ignoreShield:true,silent:true});
 ring(c.x,c.y,1400,'#ffffff',1,8); screenFlash('rgba(255,255,255,.9)'); G.shake=30; SND.play('bigboom');
 toast('최후의 수단 발동!','gold');
}

/* ═══════════ 거대 보스 ═══════════ */
const WP_ANG={crusher:[-Math.PI/2,Math.PI*.25,Math.PI*.85],hive:[Math.PI,-Math.PI*.3,Math.PI*.4],overlord:[Math.PI/2,-Math.PI*.8,0]};
function initBoss(e){
 e.phase=1; e.wpAng=WP_ANG[e.type][0]; e.p3at=.33;
 e.tA=e.type==='overlord'?7:6; e.tB=8; e.tele=null; e.bossHold=0;
 G.bosses.push(e);
 if(G.stats.bossStart<0) G.stats.bossStart=G.time;
 G.bossPending=e;
}
function bossThink(e,dt){
 const f=e.hp/e.maxHp;
 if(e.phase===1&&f<=.66) bossPhase(e,2);
 else if(e.phase===2&&f<=e.p3at) bossPhase(e,3);
 if(e.bossHold>0) e.bossHold-=dt;
 /* 예고 중인 행동 */
 if(e.tele){
  e.tele.t-=dt;
  if(e.type==='overlord'&&e.tele.k==='emp'&&(e.stun>0||e.freeze>0)){
   say(e.x,e.y-e.r-20,'충전 차단!','#9dff5e',16); ring(e.x,e.y,e.r+20,'#9dff5e',.5,3);
   e.tele=null; e.tA=6; return;
  }
  if(e.tele.t<=0){ const k=e.tele; e.tele=null; bossAct(e,k); }
  return;
 }
 e.tA-=dt;
 if(e.tA>0) return;
 const H=G.hard;
 if(e.type==='crusher'){
  if(e.phase===1||(e.phase===3&&Math.random()<.5)){ startTele(e,{k:'charge',t:2}); e.tA=e.phase===3?6:9; SND.play('charge'); }
  else { const tg=stompTarget(e,H?2:1); if(tg.length){ startTele(e,{k:'stomp',t:1.2,targets:tg}); } e.tA=e.phase===3?6:7; }
 } else if(e.type==='hive'){
  if(e.phase<3){ bossSpawn(e,'splitter',3); if(H&&Math.random()<.4) bossSpawn(e,'carrier',1); e.tA=8; }
  else { bossShield(e); bossSpawn(e,'shard',2); e.tA=7; }
 } else if(e.type==='overlord'){
  if(e.phase===2&&(e.tB-=1)<=0){ startTele(e,{k:'tp',t:1,d:Math.min(e.dist+160,G.paths[e.lane].total-60)}); e.tB=H?2:3; e.tA=3; return; }
  startTele(e,{k:'emp',t:1.2}); SND.play('empwarn');
  e.tA=e.phase===3?10:(e.phase===2?14:12);
  if(e.phase===3) bossSpawn(e,'berserk',2);
 }
}
function startTele(e,k){ e.tele=k; k.max=k.t; G.tele.push(e); }
function stompTarget(e,n){
 const list=G.towers.filter(t=>t.jam<=G.time&&d2(t.x,t.y,e.x,e.y)<130*130).sort((a,b)=>d2(a.x,a.y,e.x,e.y)-d2(b.x,b.y,e.x,e.y));
 return list.slice(0,n);
}
function bossAct(e,k){
 if(k.k==='charge'){
  e.dash=true; e.dashLeft=120; G.shake=Math.max(G.shake,8); SND.play('stomp');
 } else if(k.k==='stomp'){
  for(const t of k.targets){ if(G.towers.indexOf(t)<0) continue; jamTower(t,4); G.stats.stomped++; boom(t.x,t.y,40,'#ff9a3c'); }
  G.shake=Math.max(G.shake,12); SND.play('stomp');
 } else if(k.k==='emp'){
  const R=G.hard?234:180, r2=R*R; let n=0;
  for(const t of G.towers){ if(d2(e.x,e.y,t.x,t.y)<=r2){ jamTower(t,3); n++; if(n<=10) beamFx(e.x,e.y,t.x,t.y,'#ffd34d',.4,2); } }
  ring(e.x,e.y,R,'#ffd34d',.7,5); ring(e.x,e.y,R*.6,'#fff2a8',.5,3);
  G.shake=Math.max(G.shake,10); SND.play('emp');
 } else if(k.k==='tp'){
  ring(e.x,e.y,e.r+20,'#ff4d6d',.5,4); burst(e.x,e.y,'#ff4d6d',30,2);
  e.dist=k.d; const p=ptAt(e.lane,e.dist); e.x=p.x; e.y=p.y;
  ring(e.x,e.y,e.r+30,'#ff4d6d',.6,4); SND.play('teleport');
 }
}
function bossSpawn(e,type,n){
 for(let i=0;i<n;i++){ const s=spawnEnemy(type,e.lane,Math.max(0,e.dist-30-i*16),bossKidHp()); s.hiveKid=e.type==='hive'; }
 ring(e.x,e.y,60,e.col,.4,3); SND.play('spawn',200);
}
function bossKidHp(){ return G.mode==='chaos'?chaosHpMul(G.wave):waveHpMul(G.st,G.totalWaves); }
function bossShield(e){
 let n=0;
 for(const o of G.enemies){
  if(!o.alive||d2(e.x,e.y,o.x,o.y)>200*200) continue;
  const sh=o.D.boss?o.maxHp*.08:o.maxHp*.4;
  o.shieldMax=Math.max(o.shieldMax,sh); o.shield=Math.max(o.shield,sh); n++;
  if(n<=10&&o!==e) beamFx(e.x,e.y,o.x,o.y,'#ffe066',.35,2);
 }
 ring(e.x,e.y,200,'#ffe066',.6,4); SND.play('bastion');
}
const BOSS_LINES={
 crusher:['장갑이 깨져도 멈추지 않는다!','전부 갈아 버리겠다!'],
 hive:['우리는 둘이 된다…','보호막을 펼쳐라, 아이들아!'],
 overlord:['흥미롭군. 더 보여 봐라.','이 도시의 빛을… 전부 삼키겠다!']
};
function bossPhase(e,ph){
 e.phase=ph; e.wpAng=WP_ANG[e.type][ph-1];
 e.invuln=1.2; e.bossHold=1.2; e.tele=null; e.tA=2.5;
 G.shake=Math.max(G.shake,16); screenFlash('rgba(255,255,255,.6)');
 SND.play('phase');
 banner(ph+'단계',BOSS_LINES[e.type][ph-2],true);
 burst(e.x,e.y,e.col,50,3); ring(e.x,e.y,e.r*3,e.col,.8,5);
 if(e.type==='crusher'&&ph===3){ bossSpawn(e,'drone',6); e.spd*=1.35; }
 if(e.type==='hive'&&ph===2){
  e.hp/=2; e.maxHp/=2; e.p3at=.5;
  const tw=spawnEnemy('hive',e.lane,Math.max(0,e.dist-60),1);
  tw.hp=e.hp; tw.maxHp=e.maxHp; tw.phase=2; tw.p3at=.5; tw.wpAng=e.wpAng; tw.invuln=1.2; tw.twin=1;
  G.bossPending=null;
 }
 if(e.type==='overlord'&&ph===2){
  e.shieldMax=e.maxHp*.12; e.shield=e.shieldMax;
  for(const o of G.enemies){ if(o!==e&&o.alive&&d2(e.x,e.y,o.x,o.y)<220*220){ o.shieldMax=Math.max(o.shieldMax,o.maxHp*.5); o.shield=o.shieldMax; } }
  SND.play('bastion'); e.tB=1;
 }
 if(e.type==='overlord'&&ph===3){ G.overload=true; e.spd*=1.6; toast('오버로드 상태: 모든 적이 강해집니다!','bad'); }
}
function bossDown(e){
 const i=G.bosses.indexOf(e); if(i>=0) G.bosses.splice(i,1);
 G.slowmo=1.5; G.shake=26;
 screenFlash('rgba(255,255,255,.85)');
 SND.play('bossdie');
 for(let k=0;k<6;k++) setTimeout(()=>{ boom(e.x+rnd(-60,60),e.y+rnd(-60,60),rnd(50,110),k%2?'#ffffff':e.col); burst(e.x,e.y,e.col,30,3.5); },k*120);
 ring(e.x,e.y,260,e.col,1.2,6);
 if(!G.bosses.length){
  G.overload=false;
  if(e.type==='overlord'&&G.stats.bossStart>=0) G.stats.bossTime=G.time-G.stats.bossStart;
  banner('격파!',ENEMIES[e.type].n,false);
  if(G.aug.cooldown_reset) for(const s of G.skills) s.cd=0;
 }
}
