/* ═══════════ 이펙트 기본 ═══════════ */
function part(x,y,vx,vy,life,size,col,grav,drag){
 if(G.parts.length>(G.lowfx?240:600)) return;
 G.parts.push({x:x,y:y,vx:vx,vy:vy,life:life,max:life,size:size,col:col,grav:grav||0,drag:drag===undefined?.93:drag});
}
function burst(x,y,col,n,pw){
 if(G.lowfx) n=Math.ceil(n/2);
 for(let i=0;i<n;i++){ const a=Math.random()*TAU, s=rnd(30,100)*(pw||1); part(x,y,Math.cos(a)*s,Math.sin(a)*s,rnd(.3,.7),rnd(1.4,3.6),col); }
}
function say(x,y,s,col,size){
 if(G.texts.length>50) return;
 G.texts.push({x:x,y:y,s:String(s),col:col,size:size||11,life:.85,max:.85,vy:-34,vx:rnd(-8,8)});
}
function addFx(o){ if(G.fx.length<(G.lowfx?140:320)) G.fx.push(o); }
function ring(x,y,r,col,life,w){ addFx({k:'ring',x:x,y:y,r:r,col:col,life:life||.4,max:life||.4,w:w||2}); }
function boom(x,y,r,col){ addFx({k:'boom',x:x,y:y,r:r,col:col,life:.42,max:.42}); }
function beamFx(x1,y1,x2,y2,col,life,w){ addFx({k:'beam',x1:x1,y1:y1,x2:x2,y2:y2,col:col,life:life||.18,max:life||.18,w:w||3}); }
function boltFx(pts,col,life){ addFx({k:'bolt',pts:pts,col:col,life:life||.2,max:life||.2}); }

/* ═══════════ 대상 찾기 ═══════════ */
function canSee(e){ return e.vis; }
function canHit(t,x,e){
 if(!e.alive||!e.vis||e.invuln>0) return false;
 if(e.air&&!t.D.air) return false;
 return true;
}
function findTargets(t,x,n,modeOverride){
 const r2=x.rng*x.rng, list=[];
 for(const e of G.enemies){ if(canHit(t,x,e)&&d2(t.x,t.y,e.x,e.y)<=r2) list.push(e); }
 if(list.length<=1) return list;
 const mode=modeOverride||t.mode;
 if(mode==='first') list.sort((a,b)=>b.prog-a.prog);
 else if(mode==='last') list.sort((a,b)=>a.prog-b.prog);
 else if(mode==='strong') list.sort((a,b)=>(b.hp+b.shield)-(a.hp+a.shield));
 else list.sort((a,b)=>d2(t.x,t.y,a.x,a.y)-d2(t.x,t.y,b.x,b.y));
 return n?list.slice(0,n):list;
}
function findTarget(t,x,mode){ return findTargets(t,x,1,mode)[0]||null; }
function nearestEnemy(x,y,r,skip,air){
 let best=null, bd=r*r;
 for(const e of G.enemies){
  if(!e.alive||!e.vis||(skip&&skip.indexOf(e)>=0)) continue;
  if(e.air&&air===false) continue;
  const dd=d2(x,y,e.x,e.y); if(dd<bd){ bd=dd; best=e; }
 }
 return best;
}
function aim(t,e){ t.ang=Math.atan2(e.y-t.y,e.x-t.x); }

/* ═══════════ 피해 ═══════════ */
function hurt(e,amount,o){
 o=o||{};
 if(!e.alive||amount<=0||e.invuln>0) return 0;
 const A=G.aug, src=o.src;
 let dmg=amount, crit=false;
 if(src&&!o.nocrit&&o.kind!=='dot'&&o.crit>0&&Math.random()<o.crit){ crit=true; dmg*=o.cmul||2; }
 let mul=1;
 if(e.D.dr) mul*=1-e.D.dr;
 if(e.markT>0) mul+=e.markV;
 if(A.cryo_shatter&&e.freeze>0) mul+=.5;
 if(A.role_ctrl&&(e.freeze>0||e.stun>0||e.root>0)) mul+=.3;
 if(A.air_def&&e.air) mul+=.5;
 if(A.radar_mark&&e.radarMk) mul+=.1;
 if(A.boss_hunter) mul*=e.D.boss?2:.8;
 /* 보스 약점: 약점 쪽에서 날아온 공격은 2배 */
 if(e.D.giant&&o.from){
  const a=Math.atan2(o.from.y-e.y,o.from.x-e.x);
  if(Math.abs(angDiff(a,e.wpAng))<.9){ mul*=2; e.wpHit=.15; }
 }
 /* 방패병: 앞에서 오는 단일 공격을 막는다 */
 if(e.D.front&&o.kind==='hit'&&o.from){
  const a=Math.atan2(o.from.y-e.y,o.from.x-e.x);
  if(Math.abs(angDiff(a,e.ang))<1.05){ mul*=1-e.D.front; e.blockT=.12; }
 }
 dmg*=mul;
 if(o.kind!=='dot'&&o.kind!=='true'){
  let ar=e.armor-(e.shred||0)-(e.crack||0);
  ar*=(1-(o.pen||0))*(A.armor_break?.5:1);
  if(ar>0) dmg=Math.max(dmg*.15,dmg-ar);
 }
 if(A.giant_slayer&&src&&(o.kind==='hit'||o.kind==='splash')&&!o.aug) dmg+=e.maxHp*(e.D.boss?.005:.03);
 if(A.exec_all&&!e.D.boss&&e.hp-dmg<=e.maxHp*.1&&e.hp-dmg>0){ dmg=e.hp+e.shield+1; o.ignoreShield=true; say(e.x,e.y-e.r-6,'처형','#ff4fd8',13); }
 if(e.shield>0&&!o.ignoreShield){
  const sb=(A.shield_break?3:1);
  const take=Math.min(e.shield,dmg*sb);
  e.shield-=take; dmg-=take/sb;
  if(e.D.shield) e.shieldT=e.D.shield.delay;
  if(e.shield<=0){ ring(e.x,e.y,e.r+10,'#ffe066',.35,2); SND.play('shieldbreak',90); }
 }
 if(dmg<=0) return 0;
 e.hp-=dmg; e.hitT=.1;
 G.stats.dealt+=dmg;
 if(src){ src.dmgDone+=dmg; }
 if(!o.silent&&(dmg>=24||crit)) say(e.x+rnd(-5,5),e.y-e.r-4,Math.round(dmg),crit?'#ffd34d':'#eaf4ff',crit?15:11);
 if(A.echo&&src&&o.kind==='hit'&&!o.aug) G.echoQ.push({e:e,d:dmg*.2,t:.5,src:src});
 if(e.hp<=0) kill(e,src,o);
 return dmg;
}
/* 단일 명중에 붙는 공통 증강 */
function hitAugs(e,dmg,src,from){
 const A=G.aug;
 if(A.splash_all) splash(e.x,e.y,32,dmg*.3,src,{aug:true,silent:true,air:true});
 if(A.dot_all&&e.alive) poison(e,dmg*.1,2,src,1,'all');
 if(A.slow_all&&e.alive) slowE(e,.15,1);
 if(A.ricochet_all&&e.alive){
  const n=nearestEnemy(e.x,e.y,110,[e]);
  if(n){ beamFx(e.x,e.y,n.x,n.y,'#c3ff6b',.12,1.5); hurt(n,dmg*.6,{src:src,kind:'hit',aug:true,silent:true}); }
 }
}
function splash(x,y,r,dmg,src,o){
 o=o||{};
 const r2=r*r; let n=0;
 for(const e of G.enemies){
  if(!e.alive||(e.air&&!o.air)) continue;
  if(d2(x,y,e.x,e.y)<=r2+e.r*e.r){ hurt(e,dmg,{src:src,kind:'splash',pen:o.pen,aug:o.aug,silent:o.silent,from:{x:x,y:y},crit:o.crit,cmul:o.cmul}); n++;
   if(o.stun&&e.alive) stunE(e,o.stun); if(o.freeze&&e.alive) freezeE(e,o.freeze); }
 }
 return n;
}

/* ── 상태 이상 ── */
function slowE(e,amt,t){
 if(e.D.noSlow) return;
 if(amt>=e.slow||e.slowT<=0){ e.slow=Math.max(e.slow,amt); }
 e.slowT=Math.max(e.slowT,t);
}
function freezeE(e,t){ if(e.D.noSlow) return; if(e.D.boss) t*=.35; e.freeze=Math.max(e.freeze,t); }
function stunE(e,t){ if(e.D.boss) t*=.3; e.stun=Math.max(e.stun,t); }
function rootE(e,t){ if(e.D.boss) t*=.3; e.root=Math.max(e.root,t); }
function poison(e,dps,t,src,maxStack,tag,contagion){
 let n=0; for(const p of e.pois) if(p.tag===tag) n++;
 if(n>=maxStack){
  let o=null; for(const p of e.pois) if(p.tag===tag&&(!o||p.t<o.t)) o=p;
  if(o){ o.t=t; o.dps=Math.max(o.dps,dps); o.cont=o.cont||contagion; }
  return;
 }
 e.pois.push({dps:dps,t:t,src:src,tag:tag,cont:contagion});
}
function knock(e,px){ if(e.air) return; if(e.D.boss) px*=.2; e.dist=Math.max(0,e.dist-px); }

/* ═══════════ 처치 ═══════════ */
function goldMul(){
 let m=1; const A=G.aug;
 if(A.kill_gold) m*=1.5; if(A.midas) m*=3; if(A.double_wave) m*=2;
 return m;
}
function kill(e,src,o){
 if(!e.alive) return;
 e.alive=false;
 const chG=G.mode==='chaos'?1+G.wave*.02:CH_GOLD[G.st.ch];
 let g=e.gold*1.25*chG*goldMul();
 if(e.bounty){ g=g*2+5; say(e.x,e.y-e.r-14,'현상금','#ffd34d',12); }
 g=Math.max(1,Math.round(g));
 G.gold+=g;
 G.stats.kills++;
 SAVE.d.stats.kills++;
 G.stats.score+=e.D.pt*(G.aug.double_wave?2:1)*(G.hard?1.5:1);
 if(src) src.kills++;
 if(!e.D.minion||Math.random()<.3) say(e.x,e.y-e.r,'+'+g,'#ffc247',e.D.boss?18:11);
 burst(e.x,e.y,e.col,e.D.giant?60:10,e.D.giant?4:1.4);
 SND.play('die',45);
 const A=G.aug;
 if(e.D.split&&!A.splitter_none){
  for(let i=0;i<e.D.split[1];i++){ const s=spawnEnemy(e.D.split[0],e.lane,e.dist-6-i*10,e.hpMulBase); s.splitFrom=1; }
 }
 if(e.D.cargo){
  for(let i=0;i<e.D.cargo[1];i++) spawnEnemy(e.D.cargo[0],e.lane,Math.max(0,e.dist-8-i*12),e.hpMulBase);
  ring(e.x,e.y,40,'#7dd8ff',.4,3);
 }
 if(e.pois.length){
  const c=e.pois.find(p=>p.cont);
  if(c){
   let n=0;
   for(const o2 of G.enemies){
    if(!o2.alive||o2===e||d2(e.x,e.y,o2.x,o2.y)>110*110) continue;
    poison(o2,c.dps,4,c.src,3,'venom',c.cont); beamFx(e.x,e.y,o2.x,o2.y,'#c3ff6b',.25,1.5);
    if(++n>=c.cont) break;
   }
  }
 }
 if(e.markT>0&&A.mark_spread){
  const n2=nearestEnemy(e.x,e.y,120,[e]);
  if(n2){ n2.markT=e.markT; n2.markV=e.markV; n2.bounty=e.bounty; beamFx(e.x,e.y,n2.x,n2.y,'#ff8ae6',.25,1.5); }
 }
 if(A.kill_rate){ G.killRate=Math.min(1,G.killRate+.04); G.killRateT=3; }
 if(A.vampire){ G.vampN=(G.vampN||0)+1; if(G.vampN>=40){ G.vampN=0; healCore(1); } }
 if(e.D.boss) bossDown(e);
}
function healCore(n){
 const before=G.lives;
 G.lives=Math.min(G.maxLives,G.lives+n);
 if(G.lives>before){ say(G.paths[0].core.x,G.paths[0].core.y-42,'+'+(G.lives-before),'#5ef2a4',16); ring(G.paths[0].core.x,G.paths[0].core.y,50,'#5ef2a4',.6,3); }
}

/* ═══════════ 방어탑 발사 ═══════════ */
function hitOpt(t,x,extra){
 const o={src:t,kind:'hit',crit:x.crit,cmul:x.cmul,pen:x.pen||0,from:{x:t.x,y:t.y}};
 return extra?Object.assign(o,extra):o;
}
function shoot(t,w){
 const x=S(t,w), k=x.kind, A=G.aug;
 switch(k){
 case 'bullet': case 'gatling': {
  const n=(t.id==='pulse'&&A.pulse_double)?2:1;
  const list=findTargets(t,x,n); if(!list.length) return false;
  aim(t,list[0]);
  for(let i=0;i<n;i++){
   const tg=list[i]||list[0];
   G.shots.push({k:'bullet',x:t.x+Math.cos(t.ang)*14,y:t.y+Math.sin(t.ang)*14,tg:tg,tx:tg.x,ty:tg.y,spd:680,dmg:x.dmg*(n>1?.7:1),src:t,x0:x,col:evoCol(t),
    bounce:(t.id==='pulse'&&A.pulse_bounce?1:0),pierce:A.pierce_all?1:0,hit:[],life:1.6,small:k==='gatling'});
  }
  if(k==='gatling'){ w.spin=Math.min(1,w.spin+.05); SND.play('gatling',55); } else SND.play('pulse',50);
  t.recoil=1; return true;
 }
 case 'rail': {
  const tg=findTarget(t,x); if(!tg) return false;
  aim(t,tg);
  const L=x.rng*1.3, ex=t.x+Math.cos(t.ang)*L, ey=t.y+Math.sin(t.ang)*L;
  for(const e of G.enemies){ if(!canHit(t,x,e)) continue; if(distSeg(e.x,e.y,t.x,t.y,ex,ey)<=e.r+8) hurt(e,x.dmg,hitOpt(t,x)); }
  beamFx(t.x,t.y,ex,ey,evoCol(t),.3,5); beamFx(t.x,t.y,ex,ey,'#ffffff',.15,1.6);
  t.recoil=1.6; SND.play('rail',80); return true;
 }
 case 'snipe': {
  const tg=findTarget(t,x); if(!tg) return false;
  aim(t,tg);
  let d=x.dmg; if(tg.D.boss&&x.bossMul) d*=x.bossMul;
  beamFx(t.x,t.y,tg.x,tg.y,evoCol(t),.22,x.rng>400?4:2.5);
  if(x.exec&&!tg.D.boss&&tg.hp/tg.maxHp<=x.exec){ say(tg.x,tg.y-tg.r-6,'처형','#ffd36b',14); hurt(tg,tg.hp+tg.shield+1,{src:t,kind:'true',ignoreShield:true}); }
  else { const done=hurt(tg,d,hitOpt(t,x)); if(done) hitAugs(tg,done,t); }
  if(A.sniper_pierce){
   const ang=t.ang; let nb=null, bd=1e9;
   for(const e of G.enemies){ if(e===tg||!canHit(t,x,e)) continue;
    const dx=e.x-tg.x, dy=e.y-tg.y, along=dx*Math.cos(ang)+dy*Math.sin(ang);
    if(along<=0||along>120) continue;
    if(Math.abs(-dx*Math.sin(ang)+dy*Math.cos(ang))>e.r+10) continue;
    if(along<bd){ bd=along; nb=e; } }
   if(nb){ hurt(nb,d*.7,hitOpt(t,x)); beamFx(tg.x,tg.y,nb.x,nb.y,evoCol(t),.18,2); }
  }
  burst(tg.x,tg.y,evoCol(t),5,1);
  t.recoil=1.5; SND.play('sniper',90); return true;
 }
 case 'bounce': {
  const tg=findTarget(t,x); if(!tg) return false;
  aim(t,tg);
  G.shots.push({k:'dart',x:t.x,y:t.y,tg:tg,tx:tg.x,ty:tg.y,spd:560,dmg:x.dmg,src:t,x0:x,col:evoCol(t),bounce:x.bounce,fall:x.fall,hit:[],life:3});
  t.recoil=1; SND.play('bounce',60); return true;
 }
 case 'shotgun': {
  const tg=findTarget(t,x,'close'); if(!tg) return false;
  aim(t,tg);
  const r2=x.rng*x.rng, cands=[];
  for(const e of G.enemies){ if(!canHit(t,x,e)||d2(t.x,t.y,e.x,e.y)>r2) continue;
   if(Math.abs(angDiff(Math.atan2(e.y-t.y,e.x-t.x),t.ang))<=x.cone) cands.push(e); }
  for(let i=0;i<x.pellets;i++){
   const e=cands[i%cands.length];
   const done=hurt(e,x.dmg,hitOpt(t,x,{silent:true}));
   beamFx(t.x,t.y,e.x+rnd(-6,6),e.y+rnd(-6,6),evoCol(t),.1,1.4);
   if(done&&i<cands.length) hitAugs(e,done,t);
  }
  t.recoil=2; SND.play('shotgun',90); return true;
 }
 case 'shell': case 'cluster': {
  const tg=findTarget(t,x); if(!tg) return false;
  aim(t,tg);
  const lead=Math.min(40,tg.spd*.55);
  const p=tg.air?{x:tg.x,y:tg.y}:ptAt(tg.lane,tg.dist+lead);
  G.shots.push({k:'shell',x:t.x,y:t.y,sx:t.x,sy:t.y,tx:p.x,ty:p.y,tt:0,dur:.75,dmg:x.dmg,src:t,x0:x,col:evoCol(t),splash:x.splash,stun:x.stun,cluster:k==='cluster'?x.bomblets:0,bdmg:x.bdmg});
  t.recoil=1.6; SND.play('mortar',110); return true;
 }
 case 'missile': {
  const list=findTargets(t,x,x.cnt>1?x.cnt:1); if(!list.length) return false;
  aim(t,list[0]);
  for(let i=0;i<x.cnt;i++){
   const tg=list[i%list.length];
   G.shots.push({k:'missile',x:t.x,y:t.y,ang:t.ang+rnd(-.9,.9),spd:300,turn:7,tg:tg,dmg:x.dmg,src:t,x0:x,col:evoCol(t),splash:x.splash,airMul:x.airMul||1,life:3,delay:i*.05});
  }
  t.recoil=1.2; SND.play('missile',100); return true;
 }
 case 'mine': {
  if(!w.spots) w.spots=mineSpots(t,x.rng);
  if(!w.spots.length) return false;
  let mine=0; for(const m of G.mines) if(m.src===t) mine++;
  if(mine>=x.max) return false;
  const sp=w.spots[Math.floor(Math.random()*w.spots.length)];
  G.shots.push({k:'lob',x:t.x,y:t.y,sx:t.x,sy:t.y,tx:sp.x,ty:sp.y,tt:0,dur:.45,src:t,x0:x,spot:sp,col:evoCol(t)});
  t.recoil=1; SND.play('mine',120); return true;
 }
 case 'plasma': {
  const tg=findTarget(t,x,x.single?'strong':null); if(!tg) return false;
  aim(t,tg);
  G.shots.push({k:'plasma',x:t.x,y:t.y,tg:tg,tx:tg.x,ty:tg.y,spd:x.single?520:260,dmg:x.dmg,src:t,x0:x,col:evoCol(t),splash:x.splash,single:x.single,pool:x.pool,poolT:x.poolT,life:3});
  t.recoil=2; SND.play(x.single?'overcharge':'plasma',140); return true;
 }
 case 'chain': {
  const tg=findTarget(t,x); if(!tg) return false;
  aim(t,tg);
  const pts=[{x:t.x,y:t.y-10}], hit=[]; let cur=tg, d=x.dmg;
  for(let i=0;i<x.chains&&cur;i++){
   hit.push(cur); pts.push({x:cur.x,y:cur.y});
   const air=(A.arc_air&&cur.air)?2:1;
   hurt(cur,d*air,hitOpt(t,x,{from:pts[pts.length-2]}));
   if(A.arc_stun&&cur.alive) stunE(cur,.3);
   d*=x.fall;
   cur=nearestEnemy(cur.x,cur.y,105,hit);
  }
  boltFx(pts,evoCol(t),.2);
  SND.play('arc',70); return true;
 }
 case 'frost': {
  const tg=findTarget(t,x); if(!tg) return false;
  aim(t,tg);
  w.cnt++;
  const fz=x.freezeEvery&&w.cnt%x.freezeEvery===0;
  const r2=x.splash*x.splash;
  for(const e of G.enemies){
   if(!e.alive||!e.vis||d2(tg.x,tg.y,e.x,e.y)>r2) continue;
   if(e.air&&!t.D.air) continue;
   hurt(e,x.dmg,hitOpt(t,x,{kind:'splash',silent:true}));
   if(!e.alive) continue;
   slowE(e,x.slow,x.slowT); e.frostT=x.slowT;
   if(fz) freezeE(e,x.freezeT);
  }
  addFx({k:'frost',x:tg.x,y:tg.y,r:x.splash,col:evoCol(t),life:.35,max:.35});
  if(fz) SND.play('freeze',150); else SND.play('cryo',140);
  return true;
 }
 case 'venom': {
  const tg=findTarget(t,x); if(!tg) return false;
  aim(t,tg);
  G.shots.push({k:'venom',x:t.x,y:t.y,tg:tg,tx:tg.x,ty:tg.y,spd:520,src:t,x0:x,col:evoCol(t),life:2});
  t.recoil=.8; SND.play('venom',110); return true;
 }
 case 'gravpull': {
  const list=findTargets(t,x,0); if(!list.length) return false;
  for(const e of list){
   knock(e,x.pull); slowE(e,x.slow,1.4);
   if(A.grav_crush) hurt(e,x.pull*1.6*towerMods(t).dm,{src:t,kind:'splash',silent:true});
  }
  addFx({k:'implode',x:t.x,y:t.y,r:x.rng,col:evoCol(t),life:.5,max:.5});
  SND.play('grav',200); return true;
 }
 case 'blackhole': {
  const tg=findTarget(t,x,'strong'); if(!tg) return false;
  G.vortex.push({x:tg.x,y:tg.y,r:x.bhR,t:x.bhT,max:x.bhT,dps:x.dps,src:t,col:evoCol(t)});
  SND.play('grav',200); return true;
 }
 case 'sonic': {
  const tg=findTarget(t,x); if(!tg) return false;
  aim(t,tg);
  sonicWave(t,x);
  if(A.sonic_double) w.again=.18;
  return true;
 }
 case 'mark': {
  const n=x.targets||1, list=findTargets(t,x,0,'strong'); if(!list.length) return false;
  list.sort((a,b)=>(a.markT>0)-(b.markT>0)||(b.hp-a.hp));
  for(let i=0;i<Math.min(n,list.length);i++){
   const e=list[i]; e.markT=x.markT; e.markV=Math.max(e.markT>0?e.markV:0,x.weak); e.bounty=!!x.bounty;
   beamFx(t.x,t.y,e.x,e.y,evoCol(t),.25,1.5);
  }
  aim(t,list[0]); SND.play('mark',120); return true;
 }
 case 'net': {
  const n=x.targets||1, list=findTargets(t,x,n); if(!list.length) return false;
  aim(t,list[0]);
  for(const e of list){
   netHit(t,x,e);
   if(A.net_wide){ let c=0; for(const o2 of G.enemies){ if(o2===e||!o2.alive||d2(e.x,e.y,o2.x,o2.y)>70*70) continue; netHit(t,x,o2,true); if(++c>=2) break; } }
  }
  SND.play('net',120); return true;
 }
 }
 return false;
}
function netHit(t,x,e,side){
 if(x.shieldBreak&&e.shield>0){ e.shield=0; ring(e.x,e.y,e.r+10,'#ffe066',.35,2); SND.play('shieldbreak',90); }
 hurt(e,x.dmg*(side?.5:1),hitOpt(t,x));
 if(!e.alive) return;
 rootE(e,x.root);
 if(G.aug.net_poison) poison(e,14*towerMods(t).dm,x.root+1,t,1,'net');
 addFx({k:'net',x:e.x,y:e.y,r:e.r+8,col:evoCol(t),life:Math.max(.4,x.root),max:Math.max(.4,x.root)});
 if(!side) beamFx(t.x,t.y,e.x,e.y,evoCol(t),.15,1.2);
}
function sonicWave(t,x){
 const r2=x.rng*x.rng, A=G.aug;
 for(const e of G.enemies){
  if(!canHit(t,x,e)||d2(t.x,t.y,e.x,e.y)>r2) continue;
  if(Math.abs(angDiff(Math.atan2(e.y-t.y,e.x-t.x),t.ang))>x.cone) continue;
  hurt(e,x.dmg,hitOpt(t,x,{kind:'splash'}));
  if(!e.alive) continue;
  knock(e,x.knock);
  if(x.stun) stunE(e,x.stun);
  if(A.sonic_crack) e.crack=Math.min(9,(e.crack||0)+3);
 }
 addFx({k:'cone',x:t.x,y:t.y,ang:t.ang,r:x.rng,c:x.cone,col:evoCol(t),life:.3,max:.3});
 t.recoil=1.4; SND.play('sonic',120);
}
function mineSpots(t,rng){
 const out=[], r2=rng*rng;
 G.paths.forEach((P,lane)=>{ for(let d=0;d<P.total;d+=18){ const p=ptAt(lane,d); if(d2(t.x,t.y,p.x,p.y)<=r2) out.push({x:p.x,y:p.y,lane:lane,dist:d}); } });
 return out;
}
function distSeg(px,py,ax,ay,bx,by){
 const dx=bx-ax, dy=by-ay, l2=dx*dx+dy*dy;
 let k=l2?((px-ax)*dx+(py-ay)*dy)/l2:0; k=clamp(k,0,1);
 return Math.hypot(px-(ax+dx*k),py-(ay+dy*k));
}

/* 계속 쏘는 무기 (광선 · 화염 · 오라) */
function continuous(t,w,dt){
 const x=S(t,w), k=x.kind, A=G.aug;
 if(k==='beam'||k==='splitbeam'){
  const n=k==='splitbeam'?x.beams:1;
  w.beams=w.beams.filter(b=>b.e.alive&&b.e.vis&&d2(t.x,t.y,b.e.x,b.e.y)<=x.rng*x.rng);
  if(w.beams.length<n){
   for(const e of findTargets(t,x,0)){ if(w.beams.length>=n) break; if(!w.beams.some(b=>b.e===e)) w.beams.push({e:e,t:0}); }
  }
  if(!w.beams.length) return;
  aim(t,w.beams[0].e);
  for(const b of w.beams){
   b.t=Math.min(x.rup,b.t+dt);
   const ramp=1+(x.ramp-1)*(b.t/x.rup);
   hurt(b.e,x.dps*ramp*dt,{src:t,kind:'beam',silent:true,nocrit:true,from:{x:t.x,y:t.y}});
   if(A.laser_burn&&b.e.alive){ b.bt=(b.bt||0)-dt; if(b.bt<=0){ b.bt=.5; poison(b.e,x.dps*.25,2,t,1,'burn'); } }
  }
  t.recoil=.3+.2*Math.sin(G.time*40);
  if(Math.random()<dt*2.5) SND.play('laser',300);
  return;
 }
 if(k==='flame'){
  const tg=findTarget(t,x,'close');
  if(!tg){ w.on=false; return; }
  w.on=true; aim(t,tg);
  const r2=x.rng*x.rng;
  for(const e of G.enemies){
   if(!e.alive||e.air||!e.vis||d2(t.x,t.y,e.x,e.y)>r2) continue;
   if(Math.abs(angDiff(Math.atan2(e.y-t.y,e.x-t.x),t.ang))>x.cone) continue;
   let d=x.dps*dt;
   if(x.furnace) d*=1+(1-Math.sqrt(d2(t.x,t.y,e.x,e.y))/x.rng);
   hurt(e,d,{src:t,kind:'beam',silent:true,nocrit:true});
  }
  w.pt=(w.pt||0)-dt;
  if((x.napalm||A.flame_trail)&&w.pt<=0){
   w.pt=.3;
   const p=tg.air?null:ptAt(tg.lane,tg.dist);
   if(p) G.pools.push({x:p.x,y:p.y,r:24,dps:x.dps*(x.napalm?.4:.25),t:2.5,max:2.5,src:t,col:'#ff6b3d'});
  }
  if(!G.lowfx||Math.random()<.5){
   const a=t.ang+rnd(-x.cone,x.cone), s=rnd(120,220);
   part(t.x+Math.cos(t.ang)*14,t.y+Math.sin(t.ang)*14,Math.cos(a)*s,Math.sin(a)*s,x.rng/s,rnd(3,6),Math.random()<.5?'#ff7b3d':'#ffd36b',0,.97);
  }
  if(Math.random()<dt*4) SND.play('flame',200);
  return;
 }
 if(k==='storm'||k==='froststorm'||k==='timewarp'){
  const r2=x.rng*x.rng;
  for(const e of G.enemies){
   if(!e.alive||!e.vis||d2(t.x,t.y,e.x,e.y)>r2) continue;
   if(e.air&&!t.D.air) continue;
   if(x.dps) hurt(e,x.dps*dt,{src:t,kind:k==='storm'?'beam':'dot',silent:true,nocrit:true});
   if(x.slow&&e.alive&&!e.D.noSlow) e.auraSlow=Math.max(e.auraSlow,e.D.boss?x.slow*.5:x.slow);
  }
  if(k==='storm'&&Math.random()<dt*6){
   const e=nearestEnemy(t.x+rnd(-x.rng,x.rng),t.y+rnd(-x.rng,x.rng),x.rng);
   if(e&&d2(t.x,t.y,e.x,e.y)<=r2) boltFx([{x:t.x,y:t.y-10},{x:(t.x+e.x)/2+rnd(-12,12),y:(t.y+e.y)/2+rnd(-12,12)},{x:e.x,y:e.y}],evoCol(t),.14);
   if(Math.random()<.3) SND.play('arc',250);
  }
 }
}
const CONT_KINDS={beam:1,splitbeam:1,flame:1,storm:1,froststorm:1,timewarp:1};
const PASSIVE_KINDS={aura:1,income:1,core:1};

function updateTowers(dt){
 const list=G.ghosts.length?G.towers.concat(G.ghosts):G.towers;
 for(const t of list){
  if(t.recoil>0) t.recoil=Math.max(0,t.recoil-dt*6);
  if(t.flash>0) t.flash-=dt;
  t.spin+=dt;
  if(t.jam>G.time){ for(const w of t.wep){ w.beams=[]; w.on=false; } continue; }
  for(const w of t.wep){
   const k=w.s.kind;
   if(PASSIVE_KINDS[k]) continue;
   if(CONT_KINDS[k]){ continuous(t,w,dt); continue; }
   if(w.again>0){ w.again-=dt; if(w.again<=0){ const x=S(t,w); sonicWave(t,x); } }
   if(k==='gatling') w.spin=Math.max(0,w.spin-dt*(t.evo2?.2:.35));
   w.cd-=dt;
   if(w.cd<=0){
    if(shoot(t,w)){
     const x=S(t,w);
     let rate=x.rate;
     if(k==='gatling') rate*=1+w.spin*(x.spin-1);
     w.cd=1/Math.max(.05,rate);
     t.shots++;
    } else w.cd=.1;
   }
  }
 }
 for(let i=G.ghosts.length-1;i>=0;i--){ const g=G.ghosts[i]; g.ghostT-=dt; if(g.ghostT<=0){ G.ghosts.splice(i,1); G.buffsDirty=true; } }
}

/* ═══════════ 투사체 ═══════════ */
function updateShots(dt){
 const out=[];
 for(const p of G.shots){
  if(p.delay>0){ p.delay-=dt; out.push(p); continue; }
  if(p.k==='shell'||p.k==='lob'||p.k==='bomblet'){
   p.tt+=dt/p.dur;
   const k=Math.min(1,p.tt);
   p.x=lerp(p.sx,p.tx,k); p.y=lerp(p.sy,p.ty,k)-Math.sin(k*Math.PI)*(p.k==='bomblet'?22:60);
   if(k>=1){ landShell(p); continue; }
   out.push(p); continue;
  }
  p.life-=dt;
  if(p.life<=0) continue;
  if(p.k==='missile'){
   if(!p.tg||!p.tg.alive){ p.tg=nearestEnemy(p.x,p.y,260,null,true); }
   if(p.tg){
    const want=Math.atan2(p.tg.y-p.y,p.tg.x-p.x);
    p.ang+=clamp(angDiff(want,p.ang),-p.turn*dt,p.turn*dt);
   }
   p.spd=Math.min(520,p.spd+400*dt);
   p.x+=Math.cos(p.ang)*p.spd*dt; p.y+=Math.sin(p.ang)*p.spd*dt;
   if(!G.lowfx&&Math.random()<.6) part(p.x,p.y,rnd(-15,15),rnd(-15,15),.3,2,'#ffb36b',0,.9);
   if(p.tg&&d2(p.x,p.y,p.tg.x,p.tg.y)<(p.tg.r+6)*(p.tg.r+6)){ missileHit(p); continue; }
   out.push(p); continue;
  }
  /* 직선 · 유도 탄 */
  if(p.tg&&p.tg.alive){ p.tx=p.tg.x; p.ty=p.tg.y; }
  const dx=p.tx-p.x, dy=p.ty-p.y, dist=Math.hypot(dx,dy), step=p.spd*dt;
  if(dist<=step+(p.tg?p.tg.r*.5:4)){
   p.x=p.tx; p.y=p.ty;
   if(projHit(p)) out.push(p);
   continue;
  }
  p.x+=dx/dist*step; p.y+=dy/dist*step;
  out.push(p);
 }
 G.shots=out;
}
/* 명중 처리. 계속 날아가야 하면 true */
function projHit(p){
 const e=p.tg, A=G.aug;
 if(!e||!e.alive){
  if(p.k==='plasma') plasmaBoom(p,p.x,p.y);
  return false;
 }
 const x=p.x0;
 if(p.k==='bullet'){
  const done=hurt(e,p.dmg,{src:p.src,kind:'hit',crit:x.crit,cmul:x.cmul,from:{x:p.src.x,y:p.src.y}});
  if(done) hitAugs(e,done,p.src);
  p.hit.push(e);
  if(p.bounce>0){ p.bounce--; const n=nearestEnemy(e.x,e.y,120,p.hit); if(n){ p.tg=n; p.dmg*=.8; return true; } }
  if(p.pierce>0){ p.pierce--; const n=nearestEnemy(e.x,e.y,90,p.hit); if(n){ p.tg=n; return true; } }
  return false;
 }
 if(p.k==='dart'){
  const done=hurt(e,p.dmg,{src:p.src,kind:'hit',crit:x.crit,cmul:x.cmul,from:{x:p.x-1,y:p.y}});
  if(done&&!p.hit.length) hitAugs(e,done,p.src);
  if(A.rico_domino) { splash(e.x,e.y,28,p.dmg*.35,p.src,{aug:true,silent:true}); boom(e.x,e.y,28,'#c3ff6b'); }
  p.hit.push(e);
  if(p.bounce>0){
   const n=nearestEnemy(e.x,e.y,115,p.hit,true);
   if(n){ p.bounce--; p.dmg*=p.fall; p.tg=n; SND.play('bounce',70); return true; }
  }
  return false;
 }
 if(p.k==='venom'){
  hurt(e,x.dps*.25,{src:p.src,kind:'hit',silent:true,from:{x:p.src.x,y:p.src.y}});
  if(e.alive){
   poison(e,x.dps,x.dotT,p.src,x.stack,'venom',x.contagion||0);
   if(x.acid) e.shred=Math.min(x.acidMax,(e.shred||0)+x.acid);
   if(A.venom_slow) slowE(e,.2,x.dotT);
  }
  burst(e.x,e.y,p.col,4,.6);
  return false;
 }
 if(p.k==='plasma'){ plasmaBoom(p,e.x,e.y,e); return false; }
 return false;
}
function plasmaBoom(p,x,y,e){
 const A=G.aug;
 if(p.single&&e){
  hurt(e,p.dmg,{src:p.src,kind:'hit',crit:p.x0.crit,cmul:p.x0.cmul,from:{x:p.src.x,y:p.src.y},pen:.3});
  splash(x,y,p.splash,p.dmg*.08,p.src,{silent:true});
  boom(x,y,p.splash*1.6,'#ffffff'); ring(x,y,70,p.col,.5,4); G.shake=Math.max(G.shake,5);
 } else {
  splash(x,y,p.splash,p.dmg,p.src,{crit:p.x0.crit,cmul:p.x0.cmul});
  boom(x,y,p.splash,p.col);
 }
 if(p.pool) G.pools.push({x:x,y:y,r:p.pool,dps:p.dmg*.18,t:p.poolT,max:p.poolT,src:p.src,col:'#ff6b3d'});
 if(A.plasma_chain&&!p.chained){
  const n=nearestEnemy(x,y,160,e?[e]:null);
  if(n){ beamFx(x,y,n.x,n.y,p.col,.25,3); splash(n.x,n.y,p.splash*.7,p.dmg*.5,p.src,{silent:true}); boom(n.x,n.y,p.splash*.7,p.col); }
 }
 SND.play('boom',90);
}
function landShell(p){
 const A=G.aug;
 if(p.k==='lob'){
  G.mines.push({x:p.tx,y:p.ty,lane:p.spot.lane,dist:p.spot.dist,src:p.src,x0:p.x0,arm:.25,col:p.col,auto:false});
  return;
 }
 const st=p.stun||0;
 splash(p.tx,p.ty,p.splash,p.dmg,p.src,{stun:st,crit:p.x0&&p.x0.crit,cmul:p.x0&&p.x0.cmul});
 boom(p.tx,p.ty,p.splash,p.col);
 if(p.k==='shell'){
  if(st){ ring(p.tx,p.ty,p.splash*1.2,'#c9844a',.5,3); G.shake=Math.max(G.shake,3); }
  if(A.mortar_fire&&p.src&&p.src.id==='mortar') G.pools.push({x:p.tx,y:p.ty,r:p.splash*.8,dps:p.dmg*.25,t:2.5,max:2.5,src:p.src,col:'#ff6b3d'});
  if(p.cluster){
   for(let i=0;i<p.cluster;i++){
    const a=i/p.cluster*TAU+rnd(-.3,.3), d=rnd(26,58);
    G.shots.push({k:'bomblet',x:p.tx,y:p.ty,sx:p.tx,sy:p.ty,tx:p.tx+Math.cos(a)*d,ty:p.ty+Math.sin(a)*d,tt:0,dur:.35,dmg:p.bdmg*towerMods(p.src).dm,src:p.src,x0:p.x0,col:p.col,splash:30});
   }
  }
 }
 SND.play('boom',80);
}
function missileHit(p){
 const e=p.tg, A=G.aug;
 const air=e.air?(p.airMul||1)*(A.missile_air&&p.src.id==='missile'?2:1):1;
 hurt(e,p.dmg*air,{src:p.src,kind:'hit',crit:p.x0.crit,cmul:p.x0.cmul,from:{x:p.x-Math.cos(p.ang)*20,y:p.y-Math.sin(p.ang)*20}});
 splash(e.x,e.y,p.splash,p.dmg*.5,p.src,{air:true,silent:true});
 boom(e.x,e.y,p.splash,p.col);
 if(A.missile_split&&!p.mini){
  for(let i=0;i<2;i++){
   const n=nearestEnemy(e.x,e.y,160,[e],true);
   if(n) G.shots.push({k:'missile',x:e.x,y:e.y,ang:rnd(0,TAU),spd:260,turn:8,tg:n,dmg:p.dmg*.4,src:p.src,x0:p.x0,col:p.col,splash:18,airMul:p.airMul,life:2,mini:1});
  }
 }
}

/* ═══════════ 지뢰 · 장판 · 블랙홀 · 메아리 ═══════════ */
function updateMines(dt){
 const keep=[];
 for(const m of G.mines){
  if(m.gone) continue;
  if(m.arm>0){ m.arm-=dt; keep.push(m); continue; }
  let trig=false;
  for(const e of G.enemies){ if(e.alive&&!e.air&&d2(m.x,m.y,e.x,e.y)<(e.r+14)*(e.r+14)){ trig=true; break; } }
  if(trig){ detonate(m); continue; }
  keep.push(m);
 }
 G.mines=keep.filter(m=>!m.gone);
}
function detonate(m){
 if(m.gone) return;
 m.gone=true;
 const x=m.x0, A=G.aug;
 if(x.gravMine){
  for(const e of G.enemies){ if(!e.alive||e.air||d2(m.x,m.y,e.x,e.y)>95*95) continue;
   if(e.lane===m.lane){ const dd=m.dist-e.dist; e.dist+=clamp(dd,-50,50)*(e.D.boss?.2:1); } }
  addFx({k:'implode',x:m.x,y:m.y,r:95,col:'#a98bff',life:.4,max:.4});
 }
 splash(m.x,m.y,x.splash,m.auto?m.dmg:x.dmg*towerMods(m.src).dm,m.src,{freeze:A.mine_ice?1:0});
 boom(m.x,m.y,x.splash,m.col); SND.play('boom',70);
 if(x.chainMine){
  /* gone 표시를 먼저 했으므로 서로를 다시 터뜨리지 않는다 */
  for(const o of G.mines){ if(!o.gone&&d2(m.x,m.y,o.x,o.y)<(x.splash*1.3)*(x.splash*1.3)) detonate(o); }
 }
}
function updatePools(dt){
 const keep=[];
 for(const p of G.pools){
  p.t-=dt;
  if(p.t<=0) continue;
  const r2=p.r*p.r;
  for(const e of G.enemies){ if(e.alive&&!e.air&&d2(p.x,p.y,e.x,e.y)<=r2) hurt(e,p.dps*dt,{src:p.src,kind:'dot',silent:true}); }
  keep.push(p);
 }
 G.pools=keep;
}
function updateVortex(dt){
 const keep=[];
 for(const v of G.vortex){
  v.t-=dt;
  if(v.t<=0) continue;
  const r2=v.r*v.r;
  for(const e of G.enemies){
   if(!e.alive||e.air||d2(v.x,v.y,e.x,e.y)>r2) continue;
   hurt(e,v.dps*dt*towerMods(v.src).dm,{src:v.src,kind:'dot',silent:true});
   if(!e.D.boss) e.root=Math.max(e.root,.08);
   else e.auraSlow=Math.max(e.auraSlow,.4);
  }
  if(Math.random()<.5) { const a=rnd(0,TAU), r=v.r*rnd(.6,1); part(v.x+Math.cos(a)*r,v.y+Math.sin(a)*r,-Math.cos(a)*120,-Math.sin(a)*120,.5,2.5,v.col,0,.95); }
  keep.push(v);
 }
 G.vortex=keep;
}
function updateEcho(dt){
 if(!G.echoQ.length) return;
 const keep=[];
 for(const q of G.echoQ){ q.t-=dt; if(q.t>0){ keep.push(q); continue; } if(q.e.alive) hurt(q.e,q.d,{src:q.src,kind:'hit',aug:true,silent:true,nocrit:true}); }
 G.echoQ=keep;
}
