/* ═══════════ 판 시작 ═══════════ */
function resetBattle(){
 Object.assign(G,{wave:0,waveOn:false,queue:[],waveT:0,prep:0,prepMax:0,cShield:0,
  towers:[],ghosts:[],enemies:[],shots:[],fx:[],parts:[],texts:[],pools:[],mines:[],vortex:[],echoQ:[],tele:[],orbitals:[],
  time:0,frame:0,paused:false,over:false,sel:null,buy:null,hover:null,aimSkill:null,
  aug:{},augList:[],augPending:false,overclockT:0,freezeT:0,freezeBoss:0,firstStrikeT:0,killRate:0,killRateT:0,
  bosses:[],bossPending:null,cine:null,slowmo:0,shake:0,cam:{x:W/2,y:H/2,z:1},blackout:-1,buffsDirty:true,
  nukeUsed:false,phoenixUsed:false,gambleMul:1,dualPending:false,stormT:0,orbAutoT:12,overload:false,intro:null,vampN:0,
  stats:freshStats()});
 G.stats.maxTowers=0;
}
function startStage(st,hard,loadout,skills){
 G.mode='campaign'; G.st=st; G.hard=!!hard; G.mapId=st.id;
 resetBattle();
 buildMap(st.lay,st.mir,st.terr,st.idx+1);
 G.waves=buildWaves(st); G.totalWaves=G.waves.length;
 G.gold=CH_START[st.ch]; G.maxLives=20; G.lives=20;
 setLoadout(loadout,skills);
 G.prepMax=st.tut?30:18; G.prep=G.prepMax;
 SAVE.d.stats.games++; SAVE.save();
 enterBattle();
 const lines=[];
 if(st.idx%6===0&&!SAVE.d.seenTalk['ch'+st.ch]){ lines.push(...CHAPTERS[st.ch].talk); SAVE.d.seenTalk['ch'+st.ch]=1; }
 if(st.talk&&!SAVE.d.seenTalk[st.id]){ lines.push(...st.talk); SAVE.d.seenTalk[st.id]=1; }
 if(st.id==='3-6'&&G.hard) lines.push(['ol','다시 왔나. 이번엔 진짜 힘을 보여 주지.']);
 SAVE.save();
 const go=()=>{ if(st.tut&&!SAVE.d.tut) tutStart(); };
 if(lines.length) talk(lines,go); else go();
}
function startChaos(mapId,loadout,skills){
 const st=STAGE_BY_ID[mapId];
 G.mode='chaos'; G.st=st; G.hard=false; G.mapId=mapId;
 resetBattle();
 buildMap(st.lay,st.mir,st.terr,st.idx+101);
 G.totalWaves=Infinity; G.waves=[];
 G.gold=320; G.maxLives=20; G.lives=20;
 setLoadout(loadout,skills);
 G.prepMax=18; G.prep=G.prepMax;
 SAVE.d.stats.games++; SAVE.save();
 enterBattle();
}
function setLoadout(loadout,skills){
 G.loadout=loadout.slice();
 G.skills=skills.map(id=>({id:id,cd:0,uses:SKILLS[id].uses||0}));
}
function musicFor(){
 if(G.bosses.length) return CHAPTERS[Math.min(2,G.st.ch)].boss;
 if(G.mode==='chaos') return ['ch1','ch2','ch3'][Math.floor((G.wave-1)/10)%3]||'ch1';
 return CHAPTERS[G.st.ch].theme;
}

/* ═══════════ 웨이브 ═══════════ */
function waveDefNow(n){ return G.mode==='chaos'?chaosWave(n):G.waves[n-1]; }
function hpMulNow(n){ return G.mode==='chaos'?chaosHpMul(n):waveHpMul(G.st,n); }
function startWave(bonus){
 if(G.over||G.wave>=G.totalWaves) return;
 G.wave++;
 G.waveOn=true; G.waveT=0; G.prep=0;
 const def=waveDefNow(G.wave), hm=hpMulNow(G.wave), A=G.aug;
 const lanes=G.paths.length;
 let boss=false, k=0;
 G.queue=[];
 for(const g of def){
  const D=ENEMIES[g[0]];
  if(D.boss) boss=true;
  let cnt=g[1]; if(A.double_wave&&!D.boss) cnt*=2;
  const gap=A.double_wave&&!D.boss?g[2]*.55:g[2];
  for(let i=0;i<cnt;i++) G.queue.push({t:g[0],at:g[3]+i*gap,lane:(k++)%lanes,hm:D.boss&&G.mode==='chaos'?hm/2.4:hm});
 }
 G.queue.sort((a,b)=>a.at-b.at);
 G.stats.waveTotal=G.queue.length;
 /* 웨이브 시작 효과 */
 let sh=0; for(const t of G.towers) if(t.id==='barrier') sh+=S(t,t.wep[0]).shield||0;
 G.cShield=Math.min(30,G.cShield+sh);
 if(A.first_strike) G.firstStrikeT=6;
 if(A.gamble){ G.gambleMul=Math.random()<.5?2:.7; toast('도박사: 이번 웨이브 피해 '+(G.gambleMul>1?'2배!':'0.7배…'),G.gambleMul>1?'gold':'bad'); }
 if(A.blood_price){ G.lives-=1; if(G.lives<=0){ G.lives=0; gameOver(false); return; } }
 if(A.mine_everywhere) for(let i=0;i<3;i++){
  const lane=Math.floor(Math.random()*lanes), P=G.paths[lane], d=P.total*rnd(.2,.85), p=ptAt(lane,d);
  G.mines.push({x:p.x,y:p.y,lane:lane,dist:d,src:null,x0:{splash:48},dmg:90*hm,arm:.2,col:'#ffe066',auto:true});
 }
 if(G.terr&&G.terr.moving) rollMoving();
 if(G.terr&&G.terr.blackout&&G.wave%3===0){ G.blackout=(G.wave/3)%2; banner('정전!',(G.blackout===0?'왼쪽':'오른쪽')+' 구역 탑 피해 -30%',true); }
 if(bonus>0){ G.gold+=bonus; say(W-160,H-40,'조기 호출 +'+bonus,'#ffc247',14); }
 const label=G.mode==='chaos'?'WAVE '+G.wave:'WAVE '+G.wave+' / '+G.totalWaves;
 if(!(G.terr&&G.terr.blackout&&G.wave%3===0)) banner(label,boss?'거대 보스 접근':(G.wave===G.totalWaves?'마지막 웨이브':''),boss);
 SND.play('wave');
 SND.intensity=clamp(.25+G.wave/(G.mode==='chaos'?30:G.totalWaves)*.75,0,1);
 tutEvent('wave');
 syncHUD(true);
}
function callWave(){
 if(G.over||G.cine||G.augPending) return;
 if(!G.waveOn){
  if(G.wave>=G.totalWaves) return;
  const bonus=Math.round(Math.ceil(G.prep)*3*(G.aug.wave_gold?3:1)*(G.mode==='chaos'?1:CH_GOLD[G.st.ch]));
  startWave(bonus);
 } else if(!G.queue.length&&G.wave<G.totalWaves){
  /* 남은 적이 있어도 다음 웨이브를 당겨 부를 수 있다 */
  endWave(true);
  if(!G.augPending) startWave(Math.round(10*(G.mode==='chaos'?1:CH_GOLD[G.st.ch])));
 }
}
function endWave(early){
 G.waveOn=false;
 const A=G.aug, chG=G.mode==='chaos'?1+G.wave*.02:CH_GOLD[G.st.ch];
 let bonus=Math.round((40+G.wave*8)*chG);
 let mined=0, interest=0, repair=0;
 for(const t of G.towers){
  for(const w of t.wep){
   const x=w.s;
   if(x.kind==='income'){ let inc=x.inc*chG; if(A.miner_crit&&Math.random()<.25){ inc*=3; say(t.x,t.y-20,'노다지!','#ffc247',13); } mined+=inc; if(x.interest) interest+=Math.min(x.intCap,G.gold*x.interest); }
   if(x.kind==='core'&&x.repair) repair+=x.repair;
  }
 }
 if(A.interest) interest+=Math.min(200,G.gold*.05);
 if(A.economy) bonus+=300;
 if(A.energy_battery) for(const s of G.skills) bonus+=Math.round(s.cd*2);
 bonus+=Math.round(mined+interest);
 G.gold+=bonus;
 const c=G.paths[0].core;
 say(c.x,c.y-50,'+'+bonus,'#ffc247',18);
 if(repair) healCore(repair);
 if(A.barrier_regen&&G.cShield>0) healCore(1);
 if(A.cooldown_reset) for(const s of G.skills) s.cd=0;
 G.blackout=-1;
 G.prepMax=G.mode==='chaos'?12:10; G.prep=G.prepMax;
 if(G.mode==='chaos'&&G.wave%3===0){ offerAugments(); }
 syncHUD(true);
}
function stepWaves(dt){
 if(G.waveOn){
  G.waveT+=dt;
  while(G.queue.length&&G.queue[0].at<=G.waveT){
   const q=G.queue.shift();
   spawnEnemy(q.t,q.lane,0,q.hm);
  }
  if(!G.queue.length&&!G.enemies.length){
   if(G.wave>=G.totalWaves) victory();
   else endWave(false);
  }
 } else if(!G.over&&!G.augPending){
  if(G.prep>0){
   if(tutHold()) G.prep=Math.max(G.prep,6);
   else G.prep-=dt;
   if(G.prep<=0){ G.prep=0; if(G.auto) startWave(0); }
  }
 }
}

/* ═══════════ 한 프레임 ═══════════ */
function step(dt){
 G.frame++;
 stepFx(dt);
 if(G.over||G.augPending) return;
 G.time+=dt;
 if(G.buffsDirty) refreshAuras();
 stepSkills(dt);
 stepWaves(dt);
 if(G.over) return;
 updateEnemies(dt);
 updateTowers(dt);
 updateShots(dt);
 updateMines(dt);
 updatePools(dt);
 updateVortex(dt);
 updateEcho(dt);
 if(G.killRateT>0){ G.killRateT-=dt; if(G.killRateT<=0) G.killRate=0; }
 if(G.gold>G.stats.maxGold) G.stats.maxGold=G.gold;
 if(G.towers.length>G.stats.maxTowers) G.stats.maxTowers=G.towers.length;
 if(G.tele.length) G.tele=G.tele.filter(e=>e.alive&&e.tele);
 /* 교란이 풀린 지원 탑은 오라를 다시 계산해야 한다 */
 if(G.frame%15===0) for(const t of G.towers){ if(t.jam>0&&t.jam<=G.time){ t.jam=0; G.buffsDirty=true; } }
}
function stepFx(dt){
 if(G.shake>0) G.shake=Math.max(0,G.shake-dt*40);
 let w=0; const fx=G.fx;
 for(let i=0;i<fx.length;i++){ const f=fx[i]; f.life-=dt; if(f.life>0) fx[w++]=f; } fx.length=w;
 const ps=G.parts; w=0;
 for(let i=0;i<ps.length;i++){ const p=ps[i]; p.life-=dt; if(p.life<=0) continue;
  p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=p.grav*dt; const k=Math.pow(p.drag,dt*60); p.vx*=k; p.vy*=k; ps[w++]=p; }
 ps.length=w;
 const tx=G.texts; w=0;
 for(let i=0;i<tx.length;i++){ const q=tx[i]; q.life-=dt; if(q.life<=0) continue; q.y+=q.vy*dt; q.x+=q.vx*dt; q.vy*=Math.pow(.94,dt*60); tx[w++]=q; }
 tx.length=w;
}

/* ═══════════ 승패 ═══════════ */
function starCheck(st){
 const s=st.star, k=s[0], v=s[1], S2=G.stats;
 switch(k){
  case 'noLeak': return S2.leaked===0;
  case 'maxTowers': return S2.maxTowers<=v;
  case 'noSkills': return S2.skillsUsed===0;
  case 'noTower': return !S2.built[v];
  case 'noRole': return !Object.keys(S2.built).some(id=>TOWERS[id].role===v);
  case 'time': return G.time<=v;
  case 'noStomp': return S2.stomped===0;
  case 'maxEvos': return S2.evos<=v;
  case 'maxGold': return S2.maxGold<=v;
  case 'noSplitLeak': return S2.splitLeak===0;
  case 'maxLeak': return S2.leaked<=v;
  case 'maxSkills': return S2.skillsUsed<=v;
  case 'bossTime': return S2.bossTime>0&&S2.bossTime<=v;
 }
 return false;
}
function victory(){
 if(G.over) return;
 G.over=true; G.waveOn=false;
 closePop(); tutEnd(false);
 const st=G.st, D=SAVE.d;
 const half=G.lives>=G.maxLives/2, cond=starCheck(st);
 const stars=1+(half?1:0)+(cond?1:0);
 const first=!D.cleared[st.id];
 const prevStars=D.stars[st.id]||0;
 D.cleared[st.id]=1;
 D.stars[st.id]=Math.max(prevStars,stars);
 if(G.hard) D.hard[st.id]=1;
 if(!D.best[st.id]||G.time<D.best[st.id]) D.best[st.id]=Math.round(G.time);
 D.losses[st.id]=0;
 D.stats.time+=G.time;
 if(st.tut) D.tut=true;
 SAVE.save();
 SND.play('win');
 SND.stopMusic();
 setTimeout(()=>showResult({win:true,stars:stars,half:half,cond:cond,first:first,unlock:first?st.unlock:null,newBest:stars>prevStars}),900);
}
function gameOver(win){
 if(G.over) return;
 G.over=true; G.waveOn=false;
 closePop(); tutEnd(false);
 const D=SAVE.d;
 D.stats.time+=G.time;
 let near=null;
 if(G.bosses.length){ const b=G.bosses.reduce((a,c)=>a.hp/a.maxHp<c.hp/c.maxHp?a:c); near=Math.max(1,Math.round(b.hp/b.maxHp*100)); }
 if(G.mode==='campaign'){
  D.losses[G.st.id]=(D.losses[G.st.id]||0)+1;
 } else {
  D.chaos.push({wave:G.wave,score:Math.round(G.stats.score),map:G.mapId,towers:G.loadout.slice(),augs:G.augList.map(a=>a[0]),date:Date.now()});
  D.chaos.sort((a,b)=>b.wave-a.wave||b.score-a.score);
  D.chaos=D.chaos.slice(0,10);
 }
 SAVE.save();
 SND.play('lose');
 SND.stopMusic();
 setTimeout(()=>showResult({win:false,near:near}),900);
}

/* ═══════════ 증강 (아수라장) ═══════════ */
function augAllowed(a){
 const id=a[0], A=G.aug;
 if(A[id]) return false;
 const tw=id.split('_')[0];
 const map={pulse:'pulse',sniper:'sniper',rico:'ricochet',laser:'laser',mortar:'mortar',missile:'missile',mine:'mines',plasma:'plasma',arc:'arc',cryo:'cryo',
  venom:'venom',flame:'flame',grav:'grav',sonic:'sonic',mark:'marker',net:'net',amp:'amp',radar:'radar',miner:'miner',barrier:'barrier'};
 if(a[1]===1&&map[tw]&&id!=='mine_everywhere'&&G.loadout.indexOf(map[tw])<0) return false;
 const has=s=>G.skills.some(k=>k.id===s);
 if(id==='skill_dmg'||id==='orbital_auto') return has('orbital');
 if(id==='freeze_long'||id==='time_lord') return has('freeze');
 if(id==='overclock_long') return has('overclock');
 if(id==='repair_more') return has('repair');
 if(id==='surge_more') return has('surge');
 if(id==='pad_reverse') return G.pads.length>0;
 if(id==='energy_power') return G.energy.size>0||!!A.energy_tiles||(G.terr&&G.terr.moving);
 if(id==='seventh') return unlockedTowers().length>G.loadout.length;
 if(id==='monoculture') return G.towers.length>0;
 if(id==='dual_evo') return true;
 if(id==='pacifist') return G.towers.length<=5;
 if(id==='overlord_heart') return !A.phoenix;
 return true;
}
function rollAugments(){
 const n=G.aug.chaos_luck?4:3, out=[];
 const w=G.aug.chaos_luck?[30,35,35]:[56,31,13];
 for(let tries=0;tries<200&&out.length<n;tries++){
  let r=Math.random()*100, tier=r<w[0]?1:(r<w[0]+w[1]?2:3);
  const pool=AUGS.filter(a=>a[1]===tier&&augAllowed(a)&&out.indexOf(a)<0);
  if(!pool.length) continue;
  out.push(pool[Math.floor(Math.random()*pool.length)]);
 }
 return out;
}
function offerAugments(){
 const picks=rollAugments();
 if(!picks.length) return;
 G.augPending=true;
 showAugPick(picks);
}
function takeAug(id){
 const a=AUG_BY_ID[id], A=G.aug;
 G.augPending=false;
 A[id]=true; G.augList.push(a);
 SND.play('aug'+a[1]);
 screenFlash(RARITY[a[1]].c+'88');
 switch(id){
  case 'lives_up': G.maxLives+=10; G.lives+=10; break;
  case 'overlord_heart': G.lives=1; G.maxLives=1; break;
  case 'second_core': G.maxLives*=2; G.lives=Math.min(G.maxLives,G.lives*2); break;
  case 'energy_tiles': addEnergyTiles(3); break;
  case 'energy_path': energyPath(); break;
  case 'repair_more': for(const s of G.skills) if(s.id==='repair') s.uses+=2; break;
  case 'monoculture': { let best=null,bn=0; for(const k in G.kinds||{}) if(G.kinds[k]>bn){ bn=G.kinds[k]; best=k; } A.monoculture=best||G.loadout[0]; toast('단일 품종: '+TOWERS[A.monoculture].n,'gold'); break; }
  case 'dual_evo': G.dualPending=true; break;
  case 'amp_self': for(const t of G.towers) if(t.id==='amp') rebuildWeapons(t); break;
 }
 G.buffsDirty=true;
 for(const t of G.towers) for(const w of t.wep) w.spots=null;
 buildShop(); buildSkills(); syncHUD(true);
 if(id==='seventh') showSeventhPick();
}
function addEnergyTiles(n){
 const c=[];
 for(let ty=0;ty<ROWS;ty++) for(let tx=0;tx<COLS;tx++){
  if(!buildable(tx,ty)||isEnergy(tx,ty)) continue;
  let v=0; for(const k of G.pathTiles){ const [px,py]=k.split(',').map(Number); if((px-tx)*(px-tx)+(py-ty)*(py-ty)<=9) v++; }
  c.push({tx:tx,ty:ty,v:v});
 }
 c.sort((a,b)=>b.v-a.v);
 const top=c.slice(0,20);
 for(let i=0;i<n&&top.length;i++){ const k=top.splice(Math.floor(Math.random()*top.length),1)[0]; G.energy.add(tkey(k.tx,k.ty)); ring((k.tx+.5)*TILE,(k.ty+.5)*TILE,30,'#2fe0ff',.8,3); }
}
function energyPath(){
 const P=G.paths[0], picks=[.35,.6];
 for(const f of picks){
  const p=ptAt(0,P.total*f), tx=Math.floor(p.x/TILE), ty=Math.floor(p.y/TILE);
  const k=tkey(tx,ty);
  if(G.pathTiles.has(k)){ G.pathBuild.add(k); G.energy.add(k); ring(p.x,p.y,30,'#2fe0ff',.8,3); }
 }
}
