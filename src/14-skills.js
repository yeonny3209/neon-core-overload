/* ═══════════ 사령관 스킬 ═══════════ */
G.orbitals=[];
function skillCdMul(){ let m=1; if(G.aug.skill_cd) m*=.7; if(G.aug.skill_spam) m*=.3; return m; }
function skillReady(s){
 if(G.aug.time_lord&&s.id!=='freeze') return false;
 if(s.id==='repair') return s.uses>0;
 return s.cd<=0;
}
function useSkill(i){
 const s=G.skills[i];
 if(!s||G.over||G.cine||G.augPending||G.paused) return;
 if(!skillReady(s)){ SND.play('nope'); if(G.aug.time_lord&&s.id!=='freeze') toast('시간의 주인: 시간 동결만 쓸 수 있어요','bad'); return; }
 if(SKILLS[s.id].aim){
  G.aimSkill=G.aimSkill===i?null:i;
  if(G.aimSkill!==null){ G.buy=null; closePop(); tip('폭격할 곳을 누르세요'); }
  else tip('');
  buildSkills();
  return;
 }
 fireSkill(i);
}
function fireSkill(i,x,y){
 const s=G.skills[i], A=G.aug;
 switch(s.id){
  case 'orbital': orbitalAt(x,y,false); break;
  case 'freeze': {
   const d=4+(A.freeze_long?3:0);
   G.freezeT=d; G.freezeBoss=d-2;
   for(const e of G.enemies) if(e.alive) e.frostT=d;
   screenFlash('rgba(127,216,255,.6)'); SND.play('skfreeze');
   banner('시간 동결','',false);
   break;
  }
  case 'overclock': G.overclockT=8*(A.overclock_long?2:1); SND.play('overclock'); screenFlash('rgba(255,79,216,.45)'); for(const t of G.towers) ring(t.x,t.y,22,'#ff4fd8',.5,2); break;
  case 'repair': s.uses--; healCore(5); SND.play('repair'); break;
  case 'surge': {
   const ch=G.mode==='chaos'?1+G.wave*.02:CH_GOLD[G.st.ch];
   const g=Math.round((60+G.wave*14)*ch*(A.surge_more?2:1));
   G.gold+=g; say(W/2,H-60,'+'+g+' 에너지','#ffc247',18); SND.play('surge');
   break;
  }
 }
 if(s.id!=='repair'){
  s.cd=SKILLS[s.id].cd*skillCdMul();
  if(A.time_lord&&s.id==='freeze') s.cd=10;
 }
 if(A.chain_react) for(const o of G.skills) if(o!==s) o.cd=Math.max(0,o.cd-10);
 if(A.skill_spam){ G.lives-=1; if(G.lives<=0){ G.lives=0; gameOver(false); } }
 G.stats.skillsUsed++;
 G.aimSkill=null; tip('');
 buildSkills();
 tutEvent('skill');
}
function orbitalAt(x,y,auto){
 const A=G.aug;
 G.orbitals.push({x:x,y:y,t:1,max:1,r:80*(A.skill_dmg?1.5:1),auto:auto});
 SND.play('orbitalcharge');
}
function orbitalDmg(){ return 230*hpMulNow(Math.max(1,G.wave))*(G.aug.skill_dmg?2:1); }
function stepSkills(dt){
 for(const s of G.skills) if(s.cd>0) s.cd=Math.max(0,s.cd-dt);
 if(G.overclockT>0) G.overclockT-=dt;
 if(G.freezeT>0) G.freezeT-=dt;
 if(G.firstStrikeT>0) G.firstStrikeT-=dt;
 for(let i=G.orbitals.length-1;i>=0;i--){
  const o=G.orbitals[i]; o.t-=dt;
  if(o.t>0) continue;
  G.orbitals.splice(i,1);
  const d=orbitalDmg()*(o.auto?.6:1), r2=o.r*o.r;
  for(const e of G.enemies){ if(e.alive&&d2(o.x,o.y,e.x,e.y)<=r2+e.r*e.r) hurt(e,e.D.boss?d*.5:d,{kind:'skill',silent:false}); }
  addFx({k:'orbital',x:o.x,y:o.y,r:o.r,life:.6,max:.6});
  boom(o.x,o.y,o.r,'#ff9aea'); burst(o.x,o.y,'#ffd6f6',40,3);
  G.shake=Math.max(G.shake,12); SND.play('orbital');
 }
 const A=G.aug;
 if(A.storm_core&&G.waveOn){
  G.stormT-=dt;
  if(G.stormT<=0){
   G.stormT=3;
   let best=null; for(const e of G.enemies) if(e.alive&&e.vis&&(!best||e.prog>best.prog)) best=e;
   if(best){ const c=G.paths[0].core; hurt(best,70*hpMulNow(G.wave),{kind:'skill'}); boltFx([{x:c.x,y:c.y},{x:(c.x+best.x)/2+rnd(-20,20),y:(c.y+best.y)/2+rnd(-20,20)},{x:best.x,y:best.y}],'#7dfcff',.25); SND.play('arc',200); }
  }
 }
 if(A.orbital_auto&&G.waveOn){
  G.orbAutoT-=dt;
  if(G.orbAutoT<=0){
   G.orbAutoT=12;
   let best=null; for(const e of G.enemies) if(e.alive&&e.vis&&(!best||e.hp>best.hp)) best=e;
   if(best) orbitalAt(best.x,best.y,true);
  }
 }
 if(A.freeze_wave&&G.waveOn&&G.waveT<.05&&G.waveT>0){ G.freezeT=Math.max(G.freezeT,3); G.freezeBoss=Math.max(0,G.freezeT-1); }
}
