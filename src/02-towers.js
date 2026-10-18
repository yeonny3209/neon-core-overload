/* ═══════════ 방어탑 20종 ═══════════
   LV1 → LV2 → LV3 강화 후 A/B 중 하나로 진화한다.
   kind = 공격 방식(전투 코드에서 이 이름으로 분기), 나머지는 수치. */
const ROLES={
 direct:{n:'사격',c:'#6fe4ff'}, blast:{n:'폭발',c:'#ff9a3c'}, elem:{n:'원소',c:'#b58bff'},
 ctrl:{n:'제어',c:'#5ef2a4'}, sup:{n:'지원',c:'#ffd34d'}
};
const TARGET_MODES=[['first','선두'],['last','후미'],['strong','강적'],['close','근접']];

const TOWERS={
 /* ── 사격 ── */
 pulse:{n:'펄스 터렛',role:'direct',cost:60,col:'#6fe4ff',air:1,desc:'싸고 빠른 기본 탑. 어디에나 무난하다.',
  lv:[{kind:'bullet',dmg:10,rate:2,rng:120},{dmg:16,rate:2.1,rng:128},{dmg:25,rate:2.2,rng:136}],
  evo:{A:{n:'개틀링 코어',d:'쏠수록 빨라지는 초고속 연사. 최대 3배까지 회전이 붙는다.',kind:'gatling',dmg:12,rate:4,rng:140,spin:3,col:'#ffd36b'},
       B:{n:'레일 펄스',d:'일직선으로 꿰뚫는 관통 레일. 줄지어 오는 적에게 강하다.',kind:'rail',dmg:90,rate:.8,rng:190,pen:.5,col:'#c78bff'}}},
 sniper:{n:'저격포',role:'direct',cost:90,col:'#9fd8ff',air:1,desc:'멀리서 한 발을 강하게. 장갑을 일부 무시한다.',
  lv:[{kind:'snipe',dmg:48,rate:.55,rng:230,pen:.3},{dmg:74,rate:.58,rng:250,pen:.3},{dmg:112,rate:.6,rng:270,pen:.35}],
  evo:{A:{n:'처형자',d:'체력 15% 이하인 일반 적을 즉시 처치한다. 보스에게는 피해 +60%.',kind:'snipe',dmg:150,rate:.65,rng:280,pen:.4,exec:.15,bossMul:1.6,col:'#ffd36b'},
       B:{n:'장거리 포대',d:'맵 절반을 덮는 사거리. 느리지만 엄청난 한 방.',kind:'snipe',dmg:260,rate:.33,rng:640,pen:.8,col:'#ff7bb5'}}},
 ricochet:{n:'도탄포',role:'direct',cost:85,col:'#c3ff6b',air:1,desc:'탄이 적에서 적으로 튕긴다. 몰려오는 무리에 좋다.',
  lv:[{kind:'bounce',dmg:15,rate:1.15,rng:130,bounce:3,fall:.85},{dmg:23,rate:1.2,rng:136,bounce:4,fall:.86},{dmg:35,rate:1.25,rng:142,bounce:5,fall:.88}],
  evo:{A:{n:'프리즘',d:'튕길수록 강해진다. 최대 8번, 한 번 튕길 때마다 피해 +18%.',kind:'bounce',dmg:38,rate:1.3,rng:150,bounce:8,fall:1.18,col:'#7dfcff'},
       B:{n:'산탄포',d:'가까운 적에게 6발을 한꺼번에 퍼붓는다.',kind:'shotgun',dmg:24,rate:1,rng:115,pellets:6,cone:.7,col:'#ffb36b'}}},
 laser:{n:'레이저',role:'direct',cost:120,col:'#ff6b8a',air:1,desc:'끊김 없는 광선. 같은 적을 오래 쏠수록 강해진다.',
  lv:[{kind:'beam',dps:20,ramp:2.4,rup:2,rng:140},{dps:31,ramp:2.5,rng:146},{dps:46,ramp:2.6,rng:152}],
  evo:{A:{n:'집중 빔',d:'최대 출력 4.5배. 보스를 녹이는 광선.',kind:'beam',dps:62,ramp:4.5,rup:3,rng:160,col:'#ff3d5e'},
       B:{n:'분할 빔',d:'세 갈래 광선으로 적 3기를 동시에 지진다.',kind:'splitbeam',dps:34,ramp:2,rup:1.5,rng:150,beams:3,col:'#ff9ad6'}}},
 /* ── 폭발 ── */
 mortar:{n:'박격포',role:'blast',cost:100,col:'#ff9a3c',air:0,desc:'넓은 범위 폭발. 공중은 못 맞힌다.',
  lv:[{kind:'shell',dmg:32,rate:.7,rng:190,splash:46},{dmg:48,rate:.72,rng:200,splash:50},{dmg:72,rate:.75,rng:210,splash:56}],
  evo:{A:{n:'집속탄',d:'폭발과 함께 작은 폭탄 5개가 흩어진다.',kind:'cluster',dmg:60,rate:.75,rng:220,splash:56,bomblets:5,bdmg:26,col:'#ffd36b'},
       B:{n:'지진탄',d:'맞은 적을 기절시키는 묵직한 포탄.',kind:'shell',dmg:110,rate:.6,rng:215,splash:66,stun:.9,col:'#c9844a'}}},
 missile:{n:'미사일 포드',role:'blast',cost:110,col:'#ffb36b',air:1,desc:'적을 따라가는 유도 미사일. 공중도 맞힌다.',
  lv:[{kind:'missile',dmg:26,rate:1,rng:180,splash:28,cnt:1},{dmg:38,rate:1.05,rng:186,splash:30,cnt:1},{dmg:56,rate:1.1,rng:192,splash:32,cnt:1}],
  evo:{A:{n:'유도 군집',d:'2초마다 미사일 8발을 한꺼번에 쏜다.',kind:'missile',dmg:30,rate:.5,rng:210,splash:30,cnt:8,col:'#ff7b3d'},
       B:{n:'대공 요격기',d:'공중 적에게 피해 3배. 빠르게 연사한다.',kind:'missile',dmg:52,rate:1.7,rng:230,splash:24,cnt:1,airMul:3,col:'#7dd8ff'}}},
 mines:{n:'지뢰 투척기',role:'blast',cost:90,col:'#ffe066',air:0,desc:'사거리 안 길 위에 지뢰를 깔아 둔다.',
  lv:[{kind:'mine',dmg:62,rate:.62,rng:130,splash:42,max:5},{dmg:94,rate:.66,rng:136,splash:46,max:6},{dmg:142,rate:.7,rng:142,splash:50,max:7}],
  evo:{A:{n:'연쇄 지뢰',d:'지뢰가 터지면 근처 지뢰도 함께 터진다. 폭발 범위 +30%.',kind:'mine',dmg:170,rate:.75,rng:150,splash:66,max:9,chainMine:1,col:'#ffb13d'},
       B:{n:'중력 지뢰',d:'터지기 직전 주변 적을 끌어모아 한꺼번에 날린다.',kind:'mine',dmg:200,rate:.7,rng:150,splash:56,max:7,gravMine:1,col:'#a98bff'}}},
 plasma:{n:'플라즈마 캐논',role:'blast',cost:140,col:'#ff5fd2',air:0,desc:'느리고 강한 플라즈마 포탄.',
  lv:[{kind:'plasma',dmg:120,rate:.36,rng:170,splash:50},{dmg:180,rate:.38,rng:176,splash:54},{dmg:270,rate:.4,rng:182,splash:58}],
  evo:{A:{n:'불바다',d:'떨어진 자리에 4초 동안 타오르는 불 장판을 남긴다.',kind:'plasma',dmg:280,rate:.42,rng:190,splash:62,pool:46,poolT:4,col:'#ff7b3d'},
       B:{n:'과충전',d:'5초에 한 번, 단일 적에게 초강력 한 방.',kind:'plasma',dmg:1600,rate:.2,rng:200,splash:34,single:1,col:'#ffffff'}}},
 /* ── 원소 ── */
 arc:{n:'아크 코일',role:'elem',cost:100,col:'#9b8cff',air:1,desc:'번개가 적을 따라 이어진다.',
  lv:[{kind:'chain',dmg:18,rate:1,rng:130,chains:3,fall:.85},{dmg:27,rate:1.05,rng:136,chains:4,fall:.86},{dmg:40,rate:1.1,rng:142,chains:5,fall:.87}],
  evo:{A:{n:'연쇄 번개',d:'번개가 적 8기까지 이어지고 거의 약해지지 않는다.',kind:'chain',dmg:48,rate:1.15,rng:150,chains:8,fall:.95,col:'#7dfcff'},
       B:{n:'폭풍 코일',d:'주변 모든 적에게 쉬지 않고 전류를 흘린다.',kind:'storm',dps:62,rng:120,col:'#d2b8ff'}}},
 cryo:{n:'냉각기',role:'elem',cost:70,col:'#7fd8ff',air:1,desc:'냉기로 주변 적을 느리게 만든다.',
  lv:[{kind:'frost',dmg:5,rate:1.2,rng:120,splash:38,slow:.35,slowT:1.5},{dmg:8,rate:1.25,rng:126,splash:40,slow:.45,slowT:1.6},{dmg:12,rate:1.3,rng:132,splash:44,slow:.55,slowT:1.7}],
  evo:{A:{n:'절대영도',d:'세 번에 한 번 적을 1.2초 얼린다.',kind:'frost',dmg:18,rate:1.4,rng:140,splash:46,slow:.6,slowT:1.8,freezeEvery:3,freezeT:1.2,col:'#ffffff'},
       B:{n:'서리 폭풍',d:'넓은 범위의 모든 적을 계속 느리게 한다.',kind:'froststorm',dps:10,rng:170,slow:.45,col:'#9fe8ff'}}},
 venom:{n:'맹독 분사기',role:'elem',cost:90,col:'#7dff9b',air:1,desc:'독으로 지속 피해. 3번까지 겹친다.',
  lv:[{kind:'venom',dps:14,dotT:4,stack:3,rate:1,rng:130},{dps:22,stack:3,rate:1.05,rng:136},{dps:34,stack:3,rate:1.1,rng:142}],
  evo:{A:{n:'전염',d:'중독된 적이 죽으면 독이 주변 적 3기에게 옮겨 간다.',kind:'venom',dps:48,dotT:4,stack:3,rate:1.15,rng:150,contagion:3,col:'#c3ff6b'},
       B:{n:'산성',d:'맞을 때마다 장갑을 녹인다 (최대 -14).',kind:'venom',dps:40,dotT:4,stack:3,rate:1.2,rng:150,acid:3.5,acidMax:14,col:'#e0ff4d'}}},
 flame:{n:'화염방사기',role:'elem',cost:110,col:'#ff7b3d',air:0,desc:'가까운 부채꼴 범위를 태운다.',
  lv:[{kind:'flame',dps:42,rng:92,cone:.55},{dps:62,rng:96,cone:.55},{dps:92,rng:100,cone:.6}],
  evo:{A:{n:'용광로',d:'가까이 있는 적일수록 피해가 최대 2배로 커진다.',kind:'flame',dps:120,rng:104,cone:.65,furnace:1,col:'#ffd36b'},
       B:{n:'네이팜',d:'불길이 닿은 길에 2.5초간 불 장판이 남는다.',kind:'flame',dps:100,rng:112,cone:.6,napalm:1,col:'#ff4d6d'}}},
 /* ── 제어 ── */
 grav:{n:'중력 우물',role:'ctrl',cost:130,col:'#a98bff',air:0,desc:'주기적으로 적을 뒤로 끌어당기고 느리게 한다.',
  lv:[{kind:'gravpull',rate:.5,rng:110,pull:18,slow:.2},{rate:.55,rng:116,pull:22,slow:.25},{rate:.6,rng:122,pull:28,slow:.3}],
  evo:{A:{n:'블랙홀',d:'4초마다 강적 위치에 블랙홀을 열어 빨아들이며 피해를 준다.',kind:'blackhole',rate:.25,rng:150,dps:70,bhR:96,bhT:1.6,col:'#6b3dff'},
       B:{n:'시간 왜곡',d:'범위 안 모든 적을 크게 느리게 한다 (보스는 절반).',kind:'timewarp',rng:150,slow:.5,col:'#7dfcff'}}},
 sonic:{n:'소닉 포',role:'ctrl',cost:110,col:'#5ef2a4',air:1,desc:'음파로 앞쪽 적들을 밀어내며 피해를 준다.',
  lv:[{kind:'sonic',dmg:20,rate:.8,rng:110,cone:.7,knock:12},{dmg:30,rate:.82,rng:116,cone:.7,knock:14},{dmg:44,rate:.85,rng:122,cone:.75,knock:16}],
  evo:{A:{n:'충격파',d:'음파에 맞은 적을 0.7초 기절시킨다.',kind:'sonic',dmg:56,rate:.85,rng:128,cone:.8,knock:10,stun:.7,col:'#c3ff6b'},
       B:{n:'밀쳐내기',d:'적을 멀리 뒤로 날려 보낸다 (보스는 조금만).',kind:'sonic',dmg:50,rate:.75,rng:128,cone:.8,knock:46,col:'#7dfcff'}}},
 marker:{n:'표식기',role:'ctrl',cost:80,col:'#ff8ae6',air:1,desc:'강한 적에게 표식을 붙여 받는 피해를 늘린다.',
  lv:[{kind:'mark',rate:.7,rng:170,weak:.2,markT:4},{rate:.75,rng:180,weak:.28,markT:4},{rate:.8,rng:190,weak:.36,markT:4}],
  evo:{A:{n:'약점 노출',d:'적 2기에게 동시에 표식. 받는 피해 +60%.',kind:'mark',rate:.85,rng:210,weak:.6,markT:5,targets:2,col:'#ff4d6d'},
       B:{n:'현상금',d:'표식된 적을 처치하면 에너지 2배 + 5.',kind:'mark',rate:.9,rng:210,weak:.3,markT:5,targets:2,bounty:1,col:'#ffd34d'}}},
 net:{n:'전자 그물',role:'ctrl',cost:95,col:'#7dfcff',air:1,desc:'적 하나를 잠깐 제자리에 묶는다.',
  lv:[{kind:'net',dmg:10,rate:.4,rng:140,root:.8},{dmg:16,rate:.42,rng:146,root:1},{dmg:24,rate:.45,rng:152,root:1.2}],
  evo:{A:{n:'속박',d:'적 2기를 1.6초 동안 묶는다.',kind:'net',dmg:30,rate:.48,rng:160,root:1.6,targets:2,col:'#5ef2a4'},
       B:{n:'과부하 그물',d:'보호막을 완전히 부수고 큰 피해를 준다.',kind:'net',dmg:90,rate:.5,rng:160,root:.5,shieldBreak:1,col:'#ffe066'}}},
 /* ── 지원 ── */
 amp:{n:'증폭기',role:'sup',cost:120,col:'#ffd34d',air:0,sup:1,desc:'범위 안 방어탑의 피해를 높인다.',
  lv:[{kind:'aura',rng:110,aDmg:.15},{rng:116,aDmg:.22},{rng:122,aDmg:.3}],
  evo:{A:{n:'공격력 오라',d:'범위 안 방어탑 피해 +50%.',kind:'aura',rng:130,aDmg:.5,col:'#ff9a3c'},
       B:{n:'연사 오라',d:'범위 안 방어탑 연사 +40%.',kind:'aura',rng:130,aDmg:.15,aRate:.4,col:'#7dfcff'}}},
 radar:{n:'레이더',role:'sup',cost:100,col:'#9fe8ff',air:0,sup:1,desc:'범위 안 방어탑의 치명타 확률을 높인다.',
  lv:[{kind:'aura',rng:130,aCrit:.08},{rng:136,aCrit:.12},{rng:142,aCrit:.16}],
  evo:{A:{n:'치명타 오라',d:'치명타 확률 +30%, 치명타 피해 2.5배.',kind:'aura',rng:150,aCrit:.3,aCritMul:.6,col:'#ff4d6d'},
       B:{n:'정찰 레이더',d:'사거리 +20%. 넓은 범위의 은신체를 드러낸다.',kind:'aura',rng:150,aCrit:.1,aRng:.2,reveal:230,col:'#5ef2a4'}}},
 miner:{n:'채굴기',role:'sup',cost:120,col:'#ffc247',air:0,sup:1,desc:'웨이브가 끝날 때마다 에너지를 만든다.',
  lv:[{kind:'income',inc:22},{inc:38},{inc:58}],
  evo:{A:{n:'에너지 채굴',d:'웨이브마다 에너지 120.',kind:'income',inc:120,col:'#ffe066'},
       B:{n:'이자 은행',d:'웨이브마다 보유 에너지의 7%를 이자로 (최대 220).',kind:'income',inc:20,interest:.07,intCap:220,col:'#5ef2a4'}}},
 barrier:{n:'방벽 발생기',role:'sup',cost:140,col:'#5ef2a4',air:0,sup:1,desc:'웨이브마다 코어 보호막을 만든다.',
  lv:[{kind:'core',shield:1},{shield:2},{shield:3}],
  evo:{A:{n:'코어 보호막',d:'웨이브마다 코어 보호막 7.',kind:'core',shield:7,col:'#7dfcff'},
       B:{n:'수리 드론',d:'웨이브마다 코어 내구도 +1, 보호막 2.',kind:'core',shield:2,repair:1,col:'#c3ff6b'}}}
};
const TOWER_IDS=Object.keys(TOWERS);
const START_TOWERS=['pulse','sniper','mortar','cryo','amp'];

/* 탑 하나의 현재 기본 수치(레벨·진화 합산). 증강·오라는 전투 코드에서 더한다. */
function towerBase(id,lv,evo){
 const D=TOWERS[id], o={};
 for(let i=0;i<=lv;i++) Object.assign(o,D.lv[i]);
 if(evo) Object.assign(o,D.evo[evo]);
 return o;
}
function upCost(t){
 const D=TOWERS[t.id]; let c;
 if(t.lv<2) c=D.cost*(t.lv===0?1:2);
 else c=D.cost*3;
 if(t.lv<2) c*=(1-(G.aug.upg_discount?.3:0))*(G.aug.midas?2:1)*(G.aug.all_evo?2:1);
 else c*=(1-(G.aug.evo_discount?.4:0))*(G.aug.all_evo?0:1);
 return Math.round(c);
}
function buildCost(id){
 let c=TOWERS[id].cost;
 if(G.aug.tower_cheap) c*=.5;
 if(G.aug.blood_price) c*=.5;
 return Math.round(c);
}
