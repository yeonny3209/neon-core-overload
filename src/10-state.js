/* ═══════════ 게임 상태 ═══════════ */
const G={
 scene:'title', mode:'campaign', st:null, hard:false, mapId:null,
 wave:0, totalWaves:0, waves:[], waveOn:false, queue:[], waveT:0, prep:0, prepMax:0, auto:true,
 gold:0, lives:20, maxLives:20, cShield:0,
 towers:[], ghosts:[], enemies:[], shots:[], fx:[], parts:[], texts:[], pools:[], mines:[], vortex:[], echoQ:[], tele:[],
 paths:[], pathTiles:new Set(), pathBuild:new Set(), occ:[], energy:new Set(), moving:[], pads:[], em:[], coolant:new Set(), blocked:[],
 time:0, frame:0, speed:1, paused:false, over:false,
 sel:null, buy:null, hover:null, aimSkill:null,
 loadout:[], skills:[], aug:{}, augList:[], augPending:false,
 overclockT:0, freezeT:0, firstStrikeT:0, killRate:0, killRateT:0,
 stats:null, bosses:[], cine:null, slowmo:0, shake:0, cam:{x:W/2,y:H/2,z:1},
 blackout:-1, buffsDirty:true, lowfx:false, fxMode:'auto',
 nukeUsed:false, phoenixUsed:false, gambleMul:1, dualPending:false, stormT:0, orbAutoT:0, rng:Math.random
};
function freshStats(){
 return {leaked:0,skillsUsed:0,stomped:0,maxGold:0,evos:0,splitLeak:0,bossStart:-1,bossTime:0,kills:0,score:0,dealt:0,built:{},bossLeft:0,time:0};
}

/* ── 경로 ── */
function makePath(pts){
 const P={pts:pts.map(([x,y])=>({x:x*TILE+TILE/2,y:y*TILE+TILE/2})),segs:[],total:0};
 for(let i=0;i<P.pts.length-1;i++){
  const a=P.pts[i], b=P.pts[i+1], len=Math.hypot(b.x-a.x,b.y-a.y);
  P.segs.push({a:a,b:b,len:len,ux:(b.x-a.x)/len,uy:(b.y-a.y)/len,s:P.total});
  P.total+=len;
 }
 P.core=P.pts[P.pts.length-1];
 P.gate=P.pts[0];
 /* 공중 경로: 관문에서 코어로 곧장 */
 P.airLen=Math.hypot(P.core.x-P.gate.x,P.core.y-P.gate.y);
 /* 길이가 제각각인 맵에서도 적이 건너는 시간이 비슷하도록 속도를 맞춘다 */
 P.spdMul=clamp(Math.pow(P.total/2000,.6),.72,1.9);
 P.airMul=clamp(Math.pow(P.airLen/1100,.4),.8,1.3);
 return P;
}
function ptAt(lane,d){
 const P=G.paths[lane]||G.paths[0], n=P.segs.length; d=clamp(d,0,P.total);
 for(let i=0;i<n;i++){ const s=P.segs[i];
  if(d<=s.s+s.len||i===n-1){ const k=d-s.s; return {x:s.a.x+s.ux*k,y:s.a.y+s.uy*k,ang:Math.atan2(s.uy,s.ux)}; } }
 return {x:P.core.x,y:P.core.y,ang:0};
}
function airAt(lane,d){
 const P=G.paths[lane]||G.paths[0], k=clamp(d/P.airLen,0,1);
 return {x:lerp(P.gate.x,P.core.x,k),y:lerp(P.gate.y,P.core.y,k),ang:Math.atan2(P.core.y-P.gate.y,P.core.x-P.gate.x)};
}
const inGrid=(tx,ty)=>tx>=0&&ty>=0&&tx<COLS&&ty<ROWS;
const tkey=(tx,ty)=>tx+','+ty;
function isBlocked(tx,ty){ for(const b of G.blocked) if(b.tx===tx&&b.ty===ty) return true; return false; }
function buildable(tx,ty){
 if(!inGrid(tx,ty)) return false;
 const k=tkey(tx,ty);
 if(G.pathTiles.has(k)&&!G.pathBuild.has(k)) return false;
 if(G.occ[ty*COLS+tx]) return false;
 if(isBlocked(tx,ty)) return false;
 const c=G.paths[0].core; if(Math.abs(c.x-(tx+.5)*TILE)<TILE&&Math.abs(c.y-(ty+.5)*TILE)<TILE) return false;
 return true;
}

/* ── 맵 만들기: 경로 · 지형 ── */
function buildMap(lay,mirror,terr,seed){
 G.paths=layoutPaths(lay,mirror).map(makePath);
 G.pathTiles=new Set(); G.pathBuild=new Set();
 for(const P of G.paths){
  for(const s of P.segs){
   const steps=Math.ceil(s.len/(TILE/2));
   for(let i=0;i<=steps;i++){
    const x=s.a.x+s.ux*s.len*i/steps, y=s.a.y+s.uy*s.len*i/steps;
    const tx=Math.floor(x/TILE), ty=Math.floor(y/TILE);
    if(inGrid(tx,ty)) G.pathTiles.add(tkey(tx,ty));
   }
  }
 }
 G.occ=new Array(COLS*ROWS).fill(null);
 G.energy=new Set(); G.coolant=new Set(); G.pads=[]; G.em=[]; G.blocked=[]; G.moving=[]; G.movingPool=[];
 const rng=mulberry32(seed*9301+49297);
 const pts=[...G.pathTiles].map(k=>k.split(',').map(Number));
 const cov=(tx,ty)=>{ let c=0; for(const p of pts){ const dx=p[0]-tx, dy=p[1]-ty; if(dx*dx+dy*dy<=9) c++; } return c; };
 const cands=[];
 for(let ty=0;ty<ROWS;ty++) for(let tx=0;tx<COLS;tx++) if(buildable(tx,ty)) cands.push({tx:tx,ty:ty,c:cov(tx,ty)});
 cands.sort((a,b)=>b.c-a.c);
 const used=[];
 const far=(k,d)=>used.every(u=>Math.max(Math.abs(u.tx-k.tx),Math.abs(u.ty-k.ty))>=d);
 const pick=(n,dist,top)=>{
  const out=[], pool=cands.slice(0,Math.max(6,Math.floor(cands.length*top)));
  for(let tries=0;tries<400&&out.length<n;tries++){
   const k=pool[Math.floor(rng()*pool.length)];
   if(!k||!far(k,dist)) continue;
   out.push(k); used.push(k);
  }
  return out;
 };
 /* 장식 장애물: 길에서 먼 칸 몇 개 */
 const lows=cands.filter(k=>k.c<=1&&k.tx>0&&k.ty>0&&k.tx<COLS-1&&k.ty<ROWS-1);
 for(let i=0;i<9&&lows.length;i++){
  const k=lows.splice(Math.floor(rng()*lows.length),1)[0];
  if(far(k,2)){ G.blocked.push({tx:k.tx,ty:k.ty,v:Math.floor(rng()*4)}); used.push(k); }
 }
 terr=terr||{};
 if(terr.energy) for(const k of pick(terr.energy,4,.3)) G.energy.add(tkey(k.tx,k.ty));
 if(terr.coolant) for(const k of pick(terr.coolant,3,.35)) G.coolant.add(tkey(k.tx,k.ty));
 if(terr.em) for(const k of pick(terr.em,5,.25)) G.em.push({tx:k.tx,ty:k.ty});
 if(terr.moving){ G.movingPool=pick(10,3,.35); G.movingN=terr.moving; }
 if(terr.pads){
  const P=G.paths[0];
  for(let i=0;i<terr.pads;i++){
   const d=P.total*(.28+.5*i/Math.max(1,terr.pads-1));
   const p=ptAt(0,d); G.pads.push({x:p.x,y:p.y,ang:p.ang});
  }
 }
 G.terr=terr;
 G.blackout=-1;
}
function rollMoving(){
 if(!G.movingPool||!G.movingPool.length) return;
 G.moving=[];
 const n=G.movingPool.length;
 for(let i=0;i<G.movingN;i++){ const k=G.movingPool[(G.wave*2+i*3)%n]; G.moving.push(tkey(k.tx,k.ty)); }
 G.buffsDirty=true;
}
function isEnergy(tx,ty){ const k=tkey(tx,ty); return G.energy.has(k)||G.moving.indexOf(k)>=0; }
function inEm(tx,ty){ for(const z of G.em) if(Math.abs(z.tx-tx)<=1&&Math.abs(z.ty-ty)<=1) return true; return false; }

/* ═══════════ 방어탑 ═══════════ */
function makeTower(id,tx,ty){
 const t={id:id,D:TOWERS[id],tx:tx,ty:ty,x:(tx+.5)*TILE,y:(ty+.5)*TILE,lv:0,evo:null,evo2:false,
  spent:0,ang:-Math.PI/2,recoil:0,spin:0,mode:'first',kills:0,dmgDone:0,born:G.time,jam:0,shots:0,
  buf:{dmg:0,rate:0,crit:0,cmul:0,rng:0,near:0},wep:[],ghost:false,ghostT:0,flash:0};
 rebuildWeapons(t);
 return t;
}
/* 진화 갈래마다 '무기'를 하나씩 — 이중 진화면 두 무기가 각자 쏜다 */
function rebuildWeapons(t){
 const old=t.wep||[];
 const keys=t.evo?(t.evo2?['A','B']:[t.evo]):[null];
 t.wep=keys.map((k,i)=>{
  const s=towerBase(t.id,t.lv,k);
  const o=old[i]||{};
  return {key:k,s:s,cd:o.cd||rnd(0,.3),lock:null,lockT:0,spin:0,cnt:0,beams:[],_sf:-1,_m:null};
 });
 if(t.id==='amp'&&G.aug.amp_self) t.wep.push({key:'self',s:{kind:'bullet',dmg:14,rate:1.6,rng:120},cd:0,lock:null,lockT:0,spin:0,cnt:0,beams:[],_sf:-1});
 G.buffsDirty=true;
}
function evoCol(t){ return t.evo?(t.evo2?'#ffffff':TOWERS[t.id].evo[t.evo].col):TOWERS[t.id].col; }
function towerName(t){ return t.evo?(t.evo2?TOWERS[t.id].evo.A.n+' + '+TOWERS[t.id].evo.B.n:TOWERS[t.id].evo[t.evo].n):TOWERS[t.id].n; }

/* 지원 탑 오라 · 지형 · 공명 — 탑 구성이 바뀔 때만 다시 계산 */
function refreshAuras(){
 G.buffsDirty=false;
 const ts=G.towers.concat(G.ghosts);
 for(const t of ts){
  t.buf={dmg:0,rate:0,crit:0,cmul:0,rng:0,near:0};
  t.onEnergy=isEnergy(t.tx,t.ty); t.onCool=G.coolant.has(tkey(t.tx,t.ty)); t.inEm=inEm(t.tx,t.ty);
 }
 const supMul=G.aug.role_sup?1.5:1;
 for(const a of G.towers){
  if(a.jam>G.time) continue;
  for(const w of a.wep){
   if(w.s.kind!=='aura') continue;
   let R=w.s.rng*supMul*(a.id==='amp'&&G.aug.amp_range?1.5:1)*(a.id==='radar'&&G.aug.radar_far?1.5:1);
   const r2=R*R;
   for(const t of ts){
    if(t===a||d2(a.x,a.y,t.x,t.y)>r2) continue;
    t.buf.dmg+=w.s.aDmg||0; t.buf.rate+=w.s.aRate||0; t.buf.crit+=w.s.aCrit||0; t.buf.cmul+=w.s.aCritMul||0; t.buf.rng+=w.s.aRng||0;
   }
  }
 }
 if(G.aug.tower_aura){
  for(const t of ts) for(const o of ts){ if(o!==t&&Math.abs(o.tx-t.tx)<=2&&Math.abs(o.ty-t.ty)<=2) t.buf.dmg+=.1; }
 }
 for(const t of ts){
  let n=0; for(const o of G.towers) if(o!==t&&Math.abs(o.tx-t.tx)<=2&&Math.abs(o.ty-t.ty)<=2) n++;
  t.buf.near=n;
  t.buf.dmg=Math.min(t.buf.dmg,2.5); t.buf.rate=Math.min(t.buf.rate,1.6); t.buf.crit=Math.min(t.buf.crit,.75);
 }
 G.kinds={}; for(const t of G.towers) G.kinds[t.id]=(G.kinds[t.id]||0)+1;
}

/* 탑 하나에 걸리는 배율(프레임마다 한 번만 계산) */
function towerMods(t){
 if(t._mf===G.frame) return t._m;
 const A=G.aug, role=t.D.role;
 let dm=1+t.buf.dmg, rm=1+t.buf.rate, gm=1+t.buf.rng, crit=t.buf.crit, cmul=2+t.buf.cmul;
 if(t.onEnergy) dm+=A.energy_power?.6:.2;
 if(t.inEm) gm-=.2;
 if(G.blackout>=0&&((t.x<W/2)===(G.blackout===0))) dm*=.7;
 if(G.overclockT>0) rm*=2;
 if(G.firstStrikeT>0) dm*=2;
 if(A.last_stand&&G.lives<=5) dm*=2;
 if(A.overlord_heart) dm*=3;
 if(A.glass){ dm*=2; gm-=.3; }
 if(A.pacifist) dm*=3.5;
 if(A.economy) dm*=.75;
 if(A.tower_cheap) dm*=.8;
 if(A.gamble) dm*=G.gambleMul;
 if(A.chrono) rm*=1.5;
 if(A.range_all) gm+=.15;
 if(A.second_core) gm-=.15;
 if(A.boss_magnet&&G.bosses.length) gm+=.4;
 if(A.crit_all) crit+=.1;
 if(A.crit_mega){ crit+=.25; cmul=Math.max(cmul,3); }
 if(A.role_direct){ if(role==='direct') rm*=1.4; else dm*=.9; }
 if(A.monoculture&&A.monoculture===t.id) dm*=4;
 if(A.swarm_mind) dm*=1+.15*((G.kinds&&G.kinds[t.id])||1);
 if(A.diversity&&G.kinds) dm*=1+.1*Object.keys(G.kinds).length;
 if(A.energy_dmg) dm*=1+Math.min(1,.2*Math.floor(G.gold/1000));
 if(A.kill_rate) rm*=1+Math.min(1,G.killRate);
 if(t.id==='sniper'&&A.sniper_lonely&&t.buf.near===0) dm*=2;
 const m={dm:dm,rm:Math.max(.2,rm),gm:Math.max(.4,gm),crit:crit,cmul:cmul};
 t._mf=G.frame; t._m=m;
 return m;
}
/* 무기의 실제 수치 */
function S(t,w){
 if(w._sf===G.frame) return w._x;
 const m=towerMods(t), s=w.s, x=Object.assign({},s);
 if(s.dmg) x.dmg=s.dmg*m.dm;
 if(s.dps) x.dps=s.dps*m.dm;
 if(s.rate) x.rate=s.rate*m.rm;
 x.rng=(s.rng||0)*m.gm;
 x.crit=m.crit; x.cmul=m.cmul;
 /* 탑별 증강 */
 const A=G.aug;
 if(t.id==='mortar'&&A.mortar_rapid){ x.rate*=1.6; x.splash*=.75; }
 if(t.D.role==='blast'&&A.role_blast&&x.splash) x.splash*=1.4;
 if(t.id==='plasma'&&A.plasma_big&&x.splash) x.splash*=1.5;
 if(t.id==='ricochet'&&A.rico_more&&x.bounce){ x.bounce+=3; x.dmg*=.8; }
 if(t.id==='arc'&&A.arc_air&&x.chains) x.chains+=2;
 if(t.id==='cryo'&&A.cryo_wide){ if(x.splash) x.splash*=1.6; if(x.kind==='froststorm') x.rng*=1.6; }
 if(t.id==='flame'&&A.flame_long) x.rng*=1.4;
 if(t.id==='grav'&&A.grav_wide) x.rng*=1.4;
 if(t.id==='mines'&&A.mine_rain){ x.max*=2; x.rate*=1.4; }
 if(t.id==='venom'&&A.venom_stack) x.stack=5;
 if(t.id==='laser'&&A.laser_quick&&x.rup) x.rup*=.5;
 if(t.id==='marker'&&A.mark_long) x.markT*=2;
 if(t.onCool&&(t.id==='cryo')){ if(x.slow) x.slow=Math.min(.85,x.slow*1.4); if(x.slowT) x.slowT*=2; if(x.freezeT) x.freezeT*=2; if(x.dmg) x.dmg*=2; if(x.dps) x.dps*=2; }
 if(A.role_elem&&t.D.role==='elem'){ if(x.slowT) x.slowT*=2; if(x.dotT) x.dotT*=2; if(x.freezeT) x.freezeT*=2; }
 w._sf=G.frame; w._x=x;
 return x;
}

/* ── 설치 · 강화 · 진화 · 해체 ── */
function canBuildType(id){
 if(G.loadout.indexOf(id)<0) return '데려오지 않은 탑입니다';
 if(G.aug.pacifist&&G.towers.length>=5) return '소수 정예: 탑은 5기까지';
 if(G.aug.monoculture&&G.aug.monoculture!==id) return '단일 품종: '+TOWERS[G.aug.monoculture].n+'만 지을 수 있어요';
 return '';
}
function tryPlace(id,tx,ty){
 const why=canBuildType(id);
 if(why){ toast(why,'bad'); SND.play('nope'); return null; }
 if(!buildable(tx,ty)){ SND.play('nope'); return null; }
 const c=buildCost(id);
 if(G.gold<c){ toast('에너지가 부족해요','bad'); SND.play('nope'); return null; }
 G.gold-=c;
 const t=makeTower(id,tx,ty); t.spent=c;
 G.towers.push(t); G.occ[ty*COLS+tx]=t;
 G.stats.built[id]=(G.stats.built[id]||0)+1;
 SAVE.d.stats.use[id]=(SAVE.d.stats.use[id]||0)+1;
 G.buffsDirty=true;
 burst(t.x,t.y,t.D.col,14,1.2); ring(t.x,t.y,26,t.D.col,.4,2);
 SND.play('build');
 tutEvent('build');
 return t;
}
function upgradeTower(t,branch){
 if(!t||t.ghost) return;
 const c=nextCost(t,branch);
 if(c<0) return;
 if(G.gold<c){ toast('에너지가 부족해요','bad'); SND.play('nope'); return; }
 G.gold-=c; t.spent+=c;
 if(t.lv<2){
  t.lv++;
  SND.play('upgrade'); ring(t.x,t.y,30,t.D.col,.5,2.5);
 } else if(!t.evo){
  t.evo=branch;
  if(G.dualPending){ t.evo2=true; G.dualPending=false; toast('이중 진화! A와 B 능력을 모두 얻었어요','gold'); }
  G.stats.evos++;
  SAVE.d.stats.evo[t.id+branch]=(SAVE.d.stats.evo[t.id+branch]||0)+1;
  evolveFx(t);
 } else if(G.aug.infinite_evo&&!t.evo2){
  t.evo2=true; evolveFx(t);
 }
 rebuildWeapons(t);
 tutEvent('upgrade');
}
function nextCost(t,branch){
 if(t.lv<2||!t.evo) return upCost(t);
 if(G.aug.infinite_evo&&!t.evo2) return Math.round(TOWERS[t.id].cost*5);
 return -1;
}
function evolveFx(t){
 t.flash=1.2;
 SND.play('evolve');
 G.fx.push({k:'evo',x:t.x,y:t.y,col:evoCol(t),life:1.2,max:1.2});
 burst(t.x,t.y,evoCol(t),40,2.2);
 G.shake=Math.max(G.shake,4);
}
function sellTower(t){
 if(!t||t.ghost) return;
 const v=Math.round(t.spent*(G.aug.sell_full?1:.7));
 G.gold+=v;
 G.occ[t.ty*COLS+t.tx]=null;
 const i=G.towers.indexOf(t); if(i>=0) G.towers.splice(i,1);
 say(t.x,t.y-16,'+'+v,'#ffc247',13); burst(t.x,t.y,'#8095bd',12,1);
 SND.play('sell');
 if(G.aug.ghost_towers){ t.ghost=true; t.ghostT=30; G.ghosts.push(t); }
 if(G.sel===t) closePop();
 G.buffsDirty=true;
}
