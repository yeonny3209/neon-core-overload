/* ═══════════ 맵 · 스테이지 ═══════════
   맵은 타일 좌표(32×18)의 꺾은선. 첫 점은 화면 밖 관문, 마지막 점은 코어. */
const LAYOUTS={
 A:[[[-1,4],[9,4],[9,13],[18,13],[18,4],[26,4],[26,10]]],
 B:[[[-1,2],[25,2],[25,7],[6,7],[6,12],[25,12],[25,15]]],
 C:[[[-1,9],[5,9],[5,2],[27,2],[27,15],[10,15],[10,6],[22,6],[22,11],[15,11]]],
 D:[[[-1,4],[11,4],[11,9],[28,9]],[[-1,14],[11,14],[11,9],[28,9]]],
 E:[[[3,-1],[3,14],[10,14],[10,3],[17,3],[17,14],[24,14],[24,3],[29,3],[29,9]]],
 F:[[[-1,15],[4,15],[4,3],[27,3],[27,15],[10,15],[10,9],[21,9]]],
 G:[[[8,-1],[8,6],[20,6],[20,9],[26,9]],[[8,18],[8,12],[20,12],[20,9],[26,9]]],
 H:[[[-1,3],[6,3],[6,9],[27,9]],[[16,-1],[16,5],[22,5],[22,9],[27,9]],[[-1,15],[16,15],[16,13],[22,13],[22,9],[27,9]]],
 I:[[[-1,1],[29,1],[29,5],[2,5],[2,9],[29,9],[29,13],[2,13],[2,16],[15,16]]]
};
function layoutPaths(key,mirror){
 return LAYOUTS[key].map(p=>p.map(([x,y])=>[mirror?31-x:x,y]));
}

const CHAPTERS=[
 {n:'네온 시가지',sub:'비 오는 밤거리, 간판 불빛',theme:'ch1',boss:'boss1',bg:['#071026','#12082a'],acc:'#2fe0ff',acc2:'#ff4fd8',
  talk:[['rina','사령관님, 오버로드의 침공체가 시가지로 들어왔어요.'],['rina','첫 번째 방어선을 세워 주세요. 제가 옆에서 도울게요.']]},
 {n:'데이터 심해',sub:'물속처럼 느린 빛, 서버 숲',theme:'ch2',boss:'boss2',bg:['#04142a','#0c0a30'],acc:'#4da6ff',acc2:'#a98bff',
  talk:[['rina','신호가 데이터 심해 쪽으로 이어져요.'],['rina','여기선 전자기장 때문에 사거리가 줄어요. 조심하세요.']]},
 {n:'코어 궤도',sub:'우주 위 거대 코어, 별빛',theme:'ch3',boss:'boss3',bg:['#0a0a1e','#1e0814'],acc:'#ffc247',acc2:'#ff4d6d',
  talk:[['rina','드디어 코어 궤도예요. 오버로드가 바로 저 위에 있어요.'],['ol','여기까지 왔나. 그 작은 불빛으로 무엇을 지킬 수 있지?']]}
];

/* 별 3개 조건 */
const STAR={
 noLeak:{t:'코어 피해 0'},
 maxTowers:{t:n=>'탑 '+n+'기 이하'},
 noSkills:{t:'사령관 스킬 없이'},
 noTower:{t:id=>TOWERS[id].n+' 없이'},
 noRole:{t:r=>ROLES[r].n+' 탑 없이'},
 time:{t:n=>Math.round(n/60)+'분 안에 클리어'},
 noStomp:{t:'짓밟힌 탑 0기'},
 maxEvos:{t:n=>'진화 '+n+'개 이하'},
 maxGold:{t:n=>'에너지를 '+fmt(n)+' 넘게 모으지 않기'},
 noSplitLeak:{t:'분열체가 코어에 닿지 않게'},
 maxLeak:{t:n=>'코어 피해 '+n+' 이하'},
 maxSkills:{t:n=>'사령관 스킬 '+n+'번만'},
 bossTime:{t:n=>'오버로드를 '+Math.round(n/60)+'분 안에'}
};
function starText(s){ const f=STAR[s[0]].t; return typeof f==='function'?f(s[1]):f; }

const STAGES=[
 /* 챕터 1 */
 {id:'1-1',n:'첫 불빛',ch:0,lay:'A',waves:8,pool:['drone','swift'],terr:{energy:2},star:['noLeak'],unlock:{tower:'arc'},tut:1,
  pos:[12,72]},
 {id:'1-2',n:'간판 거리',ch:0,lay:'B',waves:10,pool:['drone','swift','brute'],intro:'brute',terr:{energy:3},star:['maxTowers',5],unlock:{tower:'ricochet'},pos:[26,46],
  talk:[['rina','저 주황색 중장갑은 장갑이 두꺼워요. 저격포가 잘 통해요.']]},
 {id:'1-3',n:'고가도로',ch:0,lay:'F',waves:10,pool:['drone','swift','brute','flyer'],intro:'flyer',terr:{energy:3},star:['noSkills'],unlock:{tower:'missile',skill:'overclock'},pos:[40,64],
  talk:[['rina','비행체가 와요! 길을 무시하고 코어로 곧장 날아가요.']]},
 {id:'1-4',n:'가속 구간',ch:0,lay:'C',waves:10,pool:['drone','swift','flyer','splitter','blinker'],intro:'blinker',terr:{energy:2,pads:3},star:['noTower','cryo'],unlock:{tower:'venom'},pos:[54,36],
  talk:[['rina','바닥의 가속 패드를 지나면 적이 빨라져요. 패드 뒤를 단단히 지켜요.']]},
 {id:'1-5',n:'지하철',ch:0,lay:'E',waves:10,pool:['drone','brute','flyer','splitter','healer'],intro:'healer',terr:{energy:3,pads:2},star:['time',300],unlock:{tower:'mines'},pos:[68,62]},
 {id:'1-6',n:'보스: 기가 크러셔',ch:0,lay:'A',mir:1,waves:8,pool:['drone','swift','brute','splitter','berserk'],intro:'berserk',terr:{energy:3},boss:'crusher',star:['noStomp'],unlock:{tower:'miner'},pos:[86,40],
  talk:[['rina','거대한 반응이 다가와요… 길 바로 옆 탑은 짓밟힐 수 있어요!']]},
 /* 챕터 2 */
 {id:'2-1',n:'서버 숲 입구',ch:1,lay:'D',waves:10,pool:['drone','swift','brute','flyer','shield'],intro:'shield',terr:{energy:2,em:1},star:['noLeak'],unlock:{tower:'laser',skill:'repair'},pos:[12,40]},
 {id:'2-2',n:'데이터 폭포',ch:1,lay:'E',mir:1,waves:10,pool:['swift','flyer','splitter','shield','phase'],intro:'phase',terr:{em:2,energy:2},star:['maxTowers',6],unlock:{tower:'flame'},pos:[26,66],
  talk:[['rina','위상체는 감속이 안 통해요. 화력으로 밀어붙여요.']]},
 {id:'2-3',n:'전자기 해구',ch:1,lay:'C',mir:1,waves:10,pool:['drone','brute','healer','shield','sapper'],intro:'sapper',terr:{em:3,energy:1},star:['noRole','blast'],unlock:{tower:'plasma'},pos:[40,38],
  talk:[['rina','노란 교란체가 탑을 멈춰요. 멀리서 먼저 잡아요.']]},
 {id:'2-4',n:'심해 동굴',ch:1,lay:'G',waves:10,pool:['brute','splitter','phase','sapper','bearer'],intro:'bearer',terr:{coolant:3,em:1},star:['maxEvos',2],unlock:{tower:'grav',skill:'surge'},pos:[54,64],
  talk:[['rina','방패병은 앞에서 오는 공격을 막아요. 옆에서 쏘거나 폭발로 상대해요.']]},
 {id:'2-5',n:'냉각수 터널',ch:1,lay:'B',mir:1,waves:10,pool:['swift','flyer','shield','phase','berserk','bearer'],terr:{coolant:5,energy:1},star:['maxGold',2000],unlock:{tower:'sonic'},pos:[70,40],
  talk:[['rina','냉각수 칸 위에 냉기 탑을 지으면 효과가 두 배예요.']]},
 {id:'2-6',n:'보스: 하이브 마더',ch:1,lay:'F',mir:1,waves:8,pool:['splitter','shield','phase','sapper','healer'],terr:{em:2,coolant:2},boss:'hive',star:['noSplitLeak'],unlock:{tower:'barrier'},pos:[87,62]},
 /* 챕터 3 */
 {id:'3-1',n:'궤도 엘리베이터',ch:2,lay:'E',waves:10,pool:['brute','flyer','phase','sapper','stealth'],intro:'stealth',terr:{energy:3},star:['noTower','radar'],unlock:{tower:'marker'},pos:[12,62],
  talk:[['rina','은신체예요! 탑 가까이 와야만 보여요.']]},
 {id:'3-2',n:'별빛 부두',ch:2,lay:'D',mir:1,waves:10,pool:['brute','shield','bearer','berserk','carrier'],intro:'carrier',terr:{energy:3,pads:2},star:['maxLeak',3],unlock:{tower:'net'},pos:[26,36],
  talk:[['rina','운반선이 쓰러지면 드론이 쏟아져요. 터질 자리를 미리 막아 두세요.']]},
 {id:'3-3',n:'정전 구역',ch:2,lay:'I',waves:10,pool:['swift','flyer','healer','phase','stealth','sapper'],terr:{blackout:1,energy:2},star:['maxSkills',1],unlock:{tower:'radar'},pos:[42,62],
  talk:[['rina','이 구역은 전력이 불안정해요. 정전이 오면 그쪽 탑이 약해져요.']]},
 {id:'3-4',n:'코어 외벽',ch:2,lay:'C',waves:10,pool:['brute','shield','phase','bearer','carrier','blinker'],terr:{moving:3},star:['noRole','sup'],unlock:{skin:1},pos:[56,34],
  talk:[['rina','에너지 칸이 웨이브마다 자리를 옮겨요. 잘 보고 지어요.']]},
 {id:'3-5',n:'최후의 회랑',ch:2,lay:'I',mir:1,waves:12,pool:['brute','flyer','splitter','healer','shield','phase','blinker','sapper','bearer','stealth','berserk','carrier'],terr:{blackout:1,energy:3},star:['noLeak'],unlock:{invite:1},pos:[70,60]},
 {id:'3-6',n:'보스: 오버로드',ch:2,lay:'H',waves:8,pool:['brute','phase','shield','stealth','carrier','berserk','sapper'],terr:{moving:3},boss:'overlord',star:['bossTime',300],unlock:{hard:1},pos:[87,38]}
];
const STAGE_BY_ID={}; STAGES.forEach((s,i)=>{ s.idx=i; STAGE_BY_ID[s.id]=s; });

/* 해금 표 → 지금 쓸 수 있는 탑 · 스킬 */
function unlockedTowers(){
 const out=START_TOWERS.slice();
 for(const s of STAGES) if(isCleared(s.id)&&s.unlock.tower) out.push(s.unlock.tower);
 return TOWER_IDS.filter(id=>out.indexOf(id)>=0);
}
function unlockedSkills(){
 const out=['orbital','freeze'];
 for(const s of STAGES) if(isCleared(s.id)&&s.unlock.skill) out.push(s.unlock.skill);
 return SKILL_IDS.filter(id=>out.indexOf(id)>=0);
}
function stageOpen(s){
 if(s.idx===0) return true;
 const prev=STAGES[s.idx-1];
 return isCleared(prev.id);
}
function chapterOpen(ch){ return ch===0||isCleared(STAGES[ch*6-1].id); }
function hardOpen(){ return isCleared('3-6'); }
function chaosOpen(){ return isCleared('1-6')||DEBUG; }

/* ── 웨이브 ── */
const CH_HP=[1,1.85,3.1], CH_GOLD=[1,1.5,2.05], CH_START=[260,450,680];
function waveHpMul(st,w){ return CH_HP[st.ch]*(1+.05*(st.idx%6))*(1+.1*(w-1)+.006*(w-1)*(w-1)); }
/* 적마다 위협도(비용)를 매기고, 웨이브마다 정해진 예산 안에서
   싼 적(물량)과 특수 적(소수)을 섞는다 — 특수 적이 한꺼번에 몰리는 일이 없다. */
const DENS=1.35;   /* 한 웨이브의 적 수 배율. 적 하나의 체력·보상은 1/DENS 라서 총량은 같다 */
const THREAT={drone:1,swift:.8,brute:3,flyer:1.5,splitter:2.2,healer:3.5,shield:2.2,phase:2,blinker:1.6,sapper:3.5,stealth:2,bearer:3,berserk:2.5,carrier:5,shard:.5};
function buildWaves(st){
 const P=st.pool, N=st.waves, out=[];
 /* 물량은 항상 땅으로 오는 적 — 비행체만 몰려오는 웨이브가 생기지 않게 */
 const fod=P.filter(t=>THREAT[t]<=1.6&&!ENEMIES[t].air); if(!fod.length) fod.push('drone','swift');
 const spec=P.filter(t=>fod.indexOf(t)<0&&t!==st.intro);
 for(let w=1;w<=N;w++){
  const B=(9+w*3.2)*(1+.12*st.ch)*(1+.04*(st.idx%6));
  const g=[], fShare=spec.length||st.intro?.58:1;
  const f1=fod[(w-1)%fod.length], f2=fod[w%fod.length];
  if(f2!==f1&&w>=3){
   g.push([f1,Math.max(3,Math.round(B*fShare*.6/THREAT[f1])),Math.max(.34,.85-w*.04),0]);
   g.push([f2,Math.max(2,Math.round(B*fShare*.4/THREAT[f2])),.7,3]);
  } else g.push([f1,Math.max(4,Math.round(B*fShare/THREAT[f1])),Math.max(.34,.85-w*.04),0]);
  const ns=spec.length?(w>=5?2:(w>=2?1:0)):0;
  for(let i=0;i<ns;i++){
   const t=spec[(w+i*2)%spec.length];
   g.push([t,Math.max(1,Math.round(B*(1-fShare)*.75/ns/THREAT[t])),1.15,2+i*3]);
  }
  if(st.intro&&w>=2) g.push([st.intro,Math.max(1,Math.round(B*(1-fShare)*(ns?.35:.8)/THREAT[st.intro])),1.3,4.5]);
  if(w===N&&!st.boss) g.push([fod[0],Math.round(B*.35/THREAT[fod[0]]),.4,8]);
  out.push(g);
 }
 for(const wv of out) for(const g of wv){ g[1]=Math.max(1,Math.round(g[1]*DENS)); g[2]=g[2]*.82; }
 if(st.boss){
  const B=(9+N*3.2)*(1+.12*st.ch);
  const g=[[st.boss,1,1,3],[fod[0],Math.round(B*.4/THREAT[fod[0]]),.7,0]];
  if(spec.length) g.push([spec[0],Math.max(2,Math.round(B*.2/THREAT[spec[0]])),1.2,10]);
  if(spec.length>1) g.push([spec[1],Math.max(2,Math.round(B*.2/THREAT[spec[1]])),1.2,18]);
  out.push(g);
 }
 return out;
}
/* 아수라장: 끝없이 강해진다. 10웨이브마다 거대 보스 */
const CHAOS_POOL=['drone','swift','brute','flyer','splitter','healer','shield','phase','blinker','sapper','stealth','bearer','berserk','carrier'];
function chaosWave(n){
 const out=[], avail=CHAOS_POOL.slice(0,Math.min(CHAOS_POOL.length,3+Math.floor(n/2)));
 const cnt=Math.round((7+n*1.1)*DENS);
 out.push([avail[(n*3)%avail.length],cnt,Math.max(.22,.8-n*.012),0]);
 out.push([avail[(n*5+1)%avail.length],Math.round(cnt*.5),.8,3]);
 if(n>=5) out.push([avail[(n*7+2)%avail.length],Math.round(cnt*.35),.9,6]);
 if(n%10===0){ const b=['crusher','hive','overlord'][(n/10-1)%3]; out.unshift([b,1,1,2]); }
 return out;
}
/* 복리로 커진다: 20웨이브 약 22배, 30웨이브 약 100배 — 증강을 잘 모아도 언젠가는 벽을 만난다 */
function chaosHpMul(n){ return 1.2*Math.pow(1.165,n-1); }
const CHAOS_MAPS=['1-2','1-4','1-5','2-1','2-4','2-5','3-2','3-4','3-5'];
