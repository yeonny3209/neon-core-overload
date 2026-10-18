/* ═══════════ 튜토리얼 (1-1) ═══════════
   정보 단계는 [다음], 행동 단계는 실제로 해야 넘어간다. 이미 한 단계는 건너뛴다. */
const TUT={on:false,step:0,tiles:[],shown:''};
const TUT_STEPS=[
 {h:'코어를 지켜라',p:'적이 <b>회랑</b>을 따라 <b>코어</b>(빛나는 육각형)로 와요. 코어 내구도가 <b>0</b>이 되면 패배예요. 1분이면 배울 수 있어요!',hl:'core'},
 {h:'① 방어탑 고르기',p:'아래 <b>상점</b>에서 <b>펄스 터렛</b>을 누르거나, 끌어서 맵에 놓아 보세요.',dom:'#shop .scard2',chk:()=>!!G.buy||G.towers.length>0,pos:'top'},
 {h:'② 빈 칸에 설치하기',p:'<b>반짝이는 칸</b>을 눌러 설치하세요. 회랑과 가까울수록 좋아요. <b>2기</b>를 지어 보세요.',hl:'tiles',chk:()=>G.towers.length>=2},
 {h:'③ 웨이브 시작',p:'오른쪽 아래 <b>웨이브 호출</b>을 눌러 적을 불러요. 일찍 부르면 <b>보너스 에너지</b>를 받아요.',dom:'#d-call',chk:()=>G.wave>=1,pos:'top'},
 {h:'④ 강화하기',p:'설치한 탑을 <b>눌러서</b> 강화해 보세요. 에너지는 적을 잡으면 모여요.',chk:()=>G.towers.some(t=>t.lv>=1)||G.wave>=5,pos:'top'},
 {h:'⑤ 사령관 스킬',p:'위급할 땐 <b>궤도 폭격</b>! 버튼을 누른 뒤 적이 몰린 곳을 누르세요.',dom:'#skills',chk:()=>G.stats.skillsUsed>0||G.wave>=7,pos:'top'},
 {h:'⑥ 갈래 진화',p:'탑을 <b>LV3</b>까지 올리면 <b>A</b>나 <b>B</b>로 진화해요. 같은 탑도 전혀 다르게 변해요. 이제 마음껏 지켜 보세요!',last:1,pos:'top'}
];
function tutStart(){ TUT.on=true; TUT.step=0; tutGo(0); }
function tutHold(){ return TUT.on&&TUT.step<=3; }
function tutEvent(){ }
function tutEnd(done){
 const was=TUT.on;
 TUT.on=false;
 $$('.hl').forEach(e=>e.classList.remove('hl'));
 $('#coach').classList.add('hide');
 if(was&&done){ SAVE.d.tut=true; SAVE.save(); toast('튜토리얼 완료!','good'); }
}
function tutPickTiles(){
 TUT.tiles=[];
 const pts=[...G.pathTiles].map(k=>k.split(',').map(Number)), c=[];
 for(let ty=0;ty<ROWS;ty++) for(let tx=0;tx<COLS;tx++){
  if(!buildable(tx,ty)) continue;
  let v=0; for(const p of pts){ const dx=p[0]-tx, dy=p[1]-ty; if(dx*dx+dy*dy<=9) v++; }
  c.push({tx:tx,ty:ty,v:v+(isEnergy(tx,ty)?6:0)});
 }
 c.sort((a,b)=>b.v-a.v);
 for(const k of c){ if(TUT.tiles.length>=3) break; if(TUT.tiles.every(o=>Math.max(Math.abs(o.tx-k.tx),Math.abs(o.ty-k.ty))>=3)) TUT.tiles.push(k); }
}
function tutGo(n){
 TUT.step=n;
 $$('.hl').forEach(e=>e.classList.remove('hl'));
 if(n>=TUT_STEPS.length){ tutEnd(true); return; }
 const S2=TUT_STEPS[n];
 if(S2.hl==='tiles') tutPickTiles();
 if(S2.dom){ const el=document.querySelector(S2.dom); if(el) el.classList.add('hl'); }
 let dots=''; for(let i=0;i<TUT_STEPS.length;i++) dots+='<i class="'+(i<n?'dn':(i===n?'on':''))+'"></i>';
 const c=$('#coach');
 c.innerHTML='<div class="ch"><span class="cs">TUTORIAL '+(n+1)+' / '+TUT_STEPS.length+'</span><span class="cd">'+dots+'</span></div><h4>'+S2.h+'</h4><p>'+S2.p+'</p>'+
  '<div class="cb"><button class="skip" id="co-skip">튜토리얼 건너뛰기</button><span class="sp"></span>'+(S2.chk?'<span class="wait">직접 해 보세요</span>':'<button class="btn sm on" id="co-next">'+(S2.last?'시작하기!':'다음')+'</button>')+'</div>';
 c.classList.remove('hide');
 $('#co-skip').onclick=()=>tutEnd(true);
 const nx=$('#co-next'); if(nx) nx.onclick=()=>{ SND.play('click'); tutGo(n+1); };
 if(n>0) SND.play('build',80);
 tutPos();
}
function tutPos(){
 const S2=TUT_STEPS[TUT.step]; if(!S2) return;
 let pos=S2.pos||'top';
 if(S2.hl==='core') pos=G.paths[0].core.y<H/2?'bot':'top';
 if(S2.hl==='tiles'&&TUT.tiles.length){ let ay=0; for(const t of TUT.tiles) ay+=t.ty; pos=ay/TUT.tiles.length<ROWS/2?'bot':'top'; }
 $('#coach').classList.toggle('bot',pos==='bot');
}
function tutTick(){
 if(!TUT.on) return;
 const vis=G.scene==='battle'&&!modalOpen()&&!G.talking&&!G.over;
 $('#coach').classList.toggle('hide',!vis);
 let guard=0;
 while(TUT.step<TUT_STEPS.length&&TUT_STEPS[TUT.step].chk&&TUT_STEPS[TUT.step].chk()&&guard++<8) tutGo(TUT.step+1);
}
function drawCoach(g,T){
 if(!TUT.on) return;
 const S2=TUT_STEPS[TUT.step]; if(!S2||!S2.hl) return;
 const p=.5+.5*Math.sin(T*4);
 g.save();
 if(S2.hl==='core'){
  const c=G.paths[0].core;
  g.strokeStyle='#2fe0ff'; g.lineWidth=3; g.globalAlpha=.9-.4*p; circ(g,c.x,c.y,46+p*10); g.stroke();
  g.globalAlpha=.45; circ(g,c.x,c.y,64+p*14); g.stroke();
 } else if(S2.hl==='tiles'){
  for(const k of TUT.tiles){
   if(!buildable(k.tx,k.ty)) continue;
   const x=k.tx*TILE, y=k.ty*TILE;
   g.globalAlpha=.15+.25*p; g.fillStyle='#2fe0ff'; g.fillRect(x+2,y+2,TILE-4,TILE-4);
   g.globalAlpha=.95; g.strokeStyle='#2fe0ff'; g.lineWidth=2.5; g.strokeRect(x+3,y+3,TILE-6,TILE-6);
   const by=y-6-p*5; g.fillStyle='#2fe0ff'; g.beginPath(); g.moveTo(x+12,by-10); g.lineTo(x+28,by-10); g.lineTo(x+20,by); g.closePath(); g.fill();
  }
 }
 g.restore();
}
