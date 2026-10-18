/* ═══════════ 그림 도구 ═══════════
   그림자 효과(shadowBlur) 대신 미리 그려 둔 빛 번짐 그림을 겹쳐 그린다 — 태블릿에서도 가볍다. */
function hexA(c,a){
 if(c[0]!=='#') return c;
 const n=parseInt(c.slice(1),16);
 return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')';
}
const GLOW={};
function glowSprite(col){
 let s=GLOW[col]; if(s) return s;
 s=document.createElement('canvas'); s.width=s.height=64;
 const g=s.getContext('2d'), gr=g.createRadialGradient(32,32,0,32,32,32);
 gr.addColorStop(0,hexA(col,.95)); gr.addColorStop(.3,hexA(col,.42)); gr.addColorStop(1,hexA(col,0));
 g.fillStyle=gr; g.fillRect(0,0,64,64);
 GLOW[col]=s; return s;
}
function glow(g,x,y,r,col,a){
 if(a<=0) return;
 g.globalAlpha=a; g.drawImage(glowSprite(col),x-r,y-r,r*2,r*2); g.globalAlpha=1;
}
function rrect(g,x,y,w,h,r){
 g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
}
function poly(g,x,y,r,n,rot){
 g.beginPath();
 for(let i=0;i<n;i++){ const a=rot+i/n*TAU; if(i) g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); else g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r); }
 g.closePath();
}
function circ(g,x,y,r){ g.beginPath(); g.arc(x,y,r,0,TAU); }
function star(g,x,y,r1,r2,n,rot){
 g.beginPath();
 for(let i=0;i<n*2;i++){ const r=i%2?r2:r1, a=rot+i/(n*2)*TAU; if(i) g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); else g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r); }
 g.closePath();
}
const INK='#0b1428', INK2='#14213f';

/* ═══════════ 방어탑 그림 (기본 + A + B = 60가지) ═══════════ */
function drawTowerArt(g,id,evo,evo2,lv,ang,recoil,spin,T){
 const D=TOWERS[id], role=ROLES[D.role].c;
 const col=evo?(evo2?'#ffffff':D.evo[evo].col):D.col;
 const rc=recoil||0, sp=spin||0;
 /* 받침 */
 g.fillStyle=INK; rrect(g,-16,-16,32,32,7); g.fill();
 g.strokeStyle=hexA(role,.75); g.lineWidth=1.5; g.stroke();
 g.fillStyle=hexA(role,.12); rrect(g,-13,-13,26,26,5); g.fill();
 if(evo){
  g.strokeStyle=evo2?'#ffffff':(evo==='A'?'#ffc247':'#ff4fd8'); g.lineWidth=2;
  rrect(g,-18.5,-18.5,37,37,9); g.stroke();
 }
 g.lineJoin='round'; g.lineCap='round';
 const body=()=>{ g.fillStyle=INK2; g.strokeStyle=col; g.lineWidth=1.8; };
 const aimRot=()=>{ g.rotate(ang); };
 g.save();
 switch(id){
 case 'pulse':
  aimRot();
  if(evo==='A'&&!evo2){
   body(); circ(g,0,0,9); g.fill(); g.stroke();
   for(let i=0;i<3;i++){ const a=sp*14+i/3*TAU; g.fillStyle=col; g.fillRect(4-rc*2,Math.sin(a)*4-1.6,15,3.2); }
   g.fillStyle='#ffd36b'; circ(g,0,0,4); g.fill();
  } else if(evo==='B'&&!evo2){
   body(); rrect(g,-8,-8,16,16,4); g.fill(); g.stroke();
   g.fillStyle=col; g.fillRect(-2-rc*3,-5.5,24,2.6); g.fillRect(-2-rc*3,2.9,24,2.6);
   for(let i=0;i<3;i++){ g.strokeStyle=hexA(col,.8); g.strokeRect(4+i*6-rc*3,-7,3,14); }
  } else {
   body(); circ(g,0,0,9); g.fill(); g.stroke();
   g.fillStyle=col; g.fillRect(4-rc*3,-2.6,13,5.2);
   if(evo2){ g.fillStyle='#c78bff'; g.fillRect(-2,-7,20,2); g.fillRect(-2,5,20,2); }
   g.fillStyle=hexA(col,.9); circ(g,0,0,3.4); g.fill();
  }
  break;
 case 'sniper':
  aimRot();
  body(); circ(g,0,0,8); g.fill(); g.stroke();
  if(evo==='B'&&!evo2){
   g.fillStyle=col; g.fillRect(-6-rc*4,-4,30,8);
   g.fillStyle=INK; g.fillRect(16-rc*4,-2.2,8,4.4);
   g.strokeStyle=col; g.beginPath(); g.moveTo(-4,-8); g.lineTo(-12,-14); g.moveTo(-4,8); g.lineTo(-12,14); g.stroke();
  } else {
   g.fillStyle=col; g.fillRect(2-rc*4,-1.8,22,3.6);
   g.fillStyle=hexA(col,.8); g.fillRect(-2,-6.5,9,3);
   if(evo==='A'||evo2){ g.fillStyle='#ffd36b'; g.fillRect(20-rc*4,-3.6,5,7.2); }
  }
  break;
 case 'ricochet':
  if(evo==='A'&&!evo2){ g.rotate(sp*1.5); body(); poly(g,0,0,11,6,0); g.fill(); g.stroke(); g.fillStyle=hexA(col,.85); poly(g,0,0,5,6,Math.PI/6); g.fill(); }
  else if(evo==='B'&&!evo2){ aimRot(); body(); circ(g,0,0,8); g.fill(); g.stroke(); g.fillStyle=col; g.beginPath(); g.moveTo(4-rc*2,-3); g.lineTo(18-rc*2,-8); g.lineTo(18-rc*2,8); g.lineTo(4-rc*2,3); g.closePath(); g.fill(); }
  else { aimRot(); body(); poly(g,0,0,11,3,0); g.fill(); g.stroke(); g.fillStyle=col; circ(g,5,0,3); g.fill(); if(evo2){ g.strokeStyle='#ffb36b'; poly(g,0,0,14,6,sp); g.stroke(); } }
  break;
 case 'laser':
  aimRot();
  if(evo==='B'&&!evo2){
   body(); poly(g,0,0,10,3,0); g.fill(); g.stroke();
   for(let i=0;i<3;i++){ const a=i/3*TAU; glow(g,Math.cos(a)*7,Math.sin(a)*7,7,col,.6); g.fillStyle=col; circ(g,Math.cos(a)*7,Math.sin(a)*7,2.6); g.fill(); }
  } else {
   const r=evo==='A'?12:10;
   body(); circ(g,0,0,r); g.fill(); g.stroke();
   g.strokeStyle=hexA(col,.6); circ(g,0,0,r-4); g.stroke();
   glow(g,r-2,0,10,col,.7); g.fillStyle='#fff'; circ(g,r-3,0,2.4); g.fill();
   if(evo2){ g.fillStyle='#ff9ad6'; circ(g,-4,-6,2); g.fill(); circ(g,-4,6,2); g.fill(); }
  }
  break;
 case 'mortar':
  body(); g.fillStyle=INK2; rrect(g,-11,-11,22,22,5); g.fill(); g.stroke();
  if(evo==='A'&&!evo2){ for(let i=0;i<4;i++){ const a=i/4*TAU+Math.PI/4; g.fillStyle='#050913'; circ(g,Math.cos(a)*5,Math.sin(a)*5,3.4); g.fill(); g.strokeStyle=col; g.stroke(); } }
  else { const r=evo==='B'?8:7; g.fillStyle='#050913'; circ(g,0,0,r); g.fill(); g.strokeStyle=col; g.lineWidth=evo==='B'?3.4:2.2; g.stroke(); if(evo2){ g.fillStyle=col; for(let i=0;i<4;i++) { const a=i/4*TAU; circ(g,Math.cos(a)*10,Math.sin(a)*10,1.6); g.fill(); } } }
  break;
 case 'missile':
  aimRot();
  body(); rrect(g,-10,-9,20,18,4); g.fill(); g.stroke();
  if(evo==='A'&&!evo2){ g.fillStyle=col; for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){ circ(g,i*5.4+1,j*5,1.9); g.fill(); } }
  else if(evo==='B'&&!evo2){ g.fillStyle=col; g.fillRect(2-rc*2,-6,14,3); g.fillRect(2-rc*2,3,14,3); g.strokeStyle=col; g.beginPath(); g.arc(-4,0,6,-1.2,1.2); g.stroke(); }
  else { g.fillStyle=col; circ(g,-3,-4,2.4); g.fill(); circ(g,3,-4,2.4); g.fill(); circ(g,-3,4,2.4); g.fill(); circ(g,3,4,2.4); g.fill(); }
  break;
 case 'mines':
  body(); rrect(g,-11,-9,22,18,4); g.fill(); g.stroke();
  if(evo==='A'&&!evo2){ g.strokeStyle=col; g.lineWidth=2; for(let i=-1;i<=1;i++){ circ(g,i*6,0,3.4); g.stroke(); } }
  else if(evo==='B'&&!evo2){ glow(g,0,0,12,col,.6); g.fillStyle=col; circ(g,0,0,5); g.fill(); g.strokeStyle=hexA(col,.7); circ(g,0,0,8+Math.sin(T*4)); g.stroke(); }
  else { g.save(); rrect(g,-11,-9,22,18,4); g.clip(); g.strokeStyle=hexA(col,.7); g.lineWidth=3; for(let i=-20;i<20;i+=7){ g.beginPath(); g.moveTo(i,-10); g.lineTo(i+10,10); g.stroke(); } g.restore(); g.fillStyle=col; circ(g,0,0,3); g.fill(); }
  break;
 case 'plasma':
  if(evo==='B'&&!evo2){ glow(g,0,0,16,'#ffffff',.6); g.fillStyle='#ffffff'; star(g,0,0,12,5,4,T*.8); g.fill(); g.fillStyle='#ff5fd2'; circ(g,0,0,4); g.fill(); }
  else {
   glow(g,0,0,14,col,.55);
   g.fillStyle=col; circ(g,0,0,7); g.fill();
   g.strokeStyle=evo==='A'?'#ffd36b':hexA(col,.85); g.lineWidth=2;
   g.save(); g.rotate(T*1.4); g.scale(1,.42); circ(g,0,0,12); g.stroke(); g.restore();
   if(evo==='A'||evo2){ g.save(); g.rotate(-T*1.1); g.scale(.42,1); circ(g,0,0,12); g.stroke(); g.restore(); }
  }
  break;
 case 'arc':
  if(evo==='B'&&!evo2){
   g.fillStyle=hexA(col,.55); for(let i=0;i<5;i++){ const a=i/5*TAU+T*.6; circ(g,Math.cos(a)*7,Math.sin(a)*5,5.5); g.fill(); }
   g.strokeStyle='#fff'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-2,-6); g.lineTo(2,-1); g.lineTo(-1,1); g.lineTo(3,7); g.stroke();
  } else {
   const n=evo==='A'?4:3;
   for(let i=0;i<n;i++){ g.strokeStyle=hexA(col,.45+i*.15); g.lineWidth=1.6; circ(g,0,0,12-i*3); g.stroke(); }
   glow(g,0,0,12,col,.65); g.fillStyle='#fff'; circ(g,0,0,3); g.fill();
  }
  break;
 case 'cryo':
  g.rotate(T*.5);
  if(evo==='A'&&!evo2){ g.fillStyle='#ffffff'; star(g,0,0,13,4,8,0); g.fill(); g.fillStyle=col; circ(g,0,0,3); g.fill(); }
  else if(evo==='B'&&!evo2){ g.strokeStyle=col; g.lineWidth=2; for(let i=0;i<3;i++){ g.beginPath(); g.arc(0,0,5+i*3.5,i,i+4); g.stroke(); } }
  else { g.strokeStyle=col; g.lineWidth=2.2; for(let i=0;i<6;i++){ const a=i/6*TAU; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*12,Math.sin(a)*12); g.moveTo(Math.cos(a)*7,Math.sin(a)*7); g.lineTo(Math.cos(a+.5)*9,Math.sin(a+.5)*9); g.stroke(); } if(evo2){ g.fillStyle='#fff'; circ(g,0,0,3); g.fill(); } }
  break;
 case 'venom':
  aimRot();
  body(); circ(g,-2,0,9); g.fill(); g.stroke();
  g.fillStyle=col; g.fillRect(5-rc*2,-2.4,11,4.8);
  g.fillStyle=hexA(col,.5); circ(g,-2,0,5); g.fill();
  if(evo==='A'||evo2){ g.fillStyle='#c3ff6b'; for(let i=0;i<4;i++){ const a=i/4*TAU+T; circ(g,-2+Math.cos(a)*11,Math.sin(a)*11,1.8); g.fill(); } }
  if(evo==='B'||evo2){ g.fillStyle='#e0ff4d'; circ(g,16,4+((T*3)%1)*5,1.8); g.fill(); }
  break;
 case 'flame':
  aimRot();
  if(evo==='A'&&!evo2){ body(); rrect(g,-10,-10,20,20,3); g.fill(); g.stroke(); g.fillStyle='#ffd36b'; g.fillRect(4,-5,6,10); glow(g,8,0,10,'#ff9a3c',.6); }
  else { body(); circ(g,-4,0,8); g.fill(); g.stroke(); g.fillStyle=col; g.beginPath(); g.moveTo(2-rc,-4); g.lineTo(15-rc,-6); g.lineTo(15-rc,6); g.lineTo(2-rc,4); g.closePath(); g.fill();
   if(evo==='B'||evo2){ g.fillStyle='#ff4d6d'; rrect(g,-12,-11,6,8,2); g.fill(); rrect(g,-12,3,6,8,2); g.fill(); } }
  break;
 case 'grav':
  if(evo==='A'&&!evo2){ glow(g,0,0,15,col,.5); g.fillStyle='#000'; circ(g,0,0,7); g.fill(); g.strokeStyle=col; g.lineWidth=2; g.save(); g.rotate(T*2); g.scale(1,.4); circ(g,0,0,12); g.stroke(); g.restore(); }
  else if(evo==='B'&&!evo2){ g.strokeStyle=col; g.lineWidth=2; g.beginPath(); g.moveTo(-8,-11); g.lineTo(8,-11); g.lineTo(-8,11); g.lineTo(8,11); g.closePath(); g.stroke(); g.fillStyle=col; g.beginPath(); g.moveTo(-4,8); g.lineTo(4,8); g.lineTo(0,3); g.fill(); }
  else { for(let i=0;i<3;i++){ g.strokeStyle=hexA(col,.35+i*.22); g.lineWidth=1.8; g.beginPath(); g.arc(0,0,4+i*4,T*(i+1)*.8,T*(i+1)*.8+4.4); g.stroke(); } g.fillStyle='#000'; circ(g,0,0,3.5); g.fill(); }
  break;
 case 'sonic':
  aimRot();
  body(); circ(g,-3,0,8); g.fill(); g.stroke();
  if(evo==='B'&&!evo2){ g.fillStyle=col; g.beginPath(); g.moveTo(2,-4); g.lineTo(15,-10); g.lineTo(15,10); g.lineTo(2,4); g.closePath(); g.fill(); }
  else { g.strokeStyle=col; g.lineWidth=2; for(let i=0;i<(evo==='A'?3:2);i++){ g.beginPath(); g.arc(0,0,6+i*4.5,-.8,.8); g.stroke(); } }
  break;
 case 'marker':
  if(evo==='B'&&!evo2){ g.fillStyle='#ffd34d'; circ(g,0,0,10); g.fill(); g.strokeStyle='#8a6a00'; g.lineWidth=2; circ(g,0,0,7); g.stroke(); g.beginPath(); g.moveTo(0,-5); g.lineTo(0,5); g.moveTo(-3,-2); g.lineTo(3,-2); g.stroke(); }
  else { g.strokeStyle=evo==='A'?'#ff4d6d':col; g.lineWidth=2; circ(g,0,0,9); g.stroke(); g.beginPath(); g.moveTo(-13,0); g.lineTo(-5,0); g.moveTo(5,0); g.lineTo(13,0); g.moveTo(0,-13); g.lineTo(0,-5); g.moveTo(0,5); g.lineTo(0,13); g.stroke(); g.fillStyle=evo==='A'?'#ff4d6d':col; circ(g,0,0,2.6); g.fill(); }
  break;
 case 'net':
  aimRot();
  body(); circ(g,0,0,10); g.fill(); g.stroke();
  g.save(); circ(g,0,0,9); g.clip(); g.strokeStyle=hexA(col,.8); g.lineWidth=1; const st=evo==='A'?3:4.5;
  for(let i=-10;i<=10;i+=st){ g.beginPath(); g.moveTo(i,-10); g.lineTo(i,10); g.moveTo(-10,i); g.lineTo(10,i); g.stroke(); } g.restore();
  if(evo==='B'||evo2){ g.strokeStyle='#ffe066'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-6,-4); g.lineTo(-1,1); g.lineTo(2,-2); g.lineTo(7,4); g.stroke(); }
  break;
 case 'amp':
  { const p=1+Math.sin(T*3)*.08; g.scale(p,p);
   const c2=evo==='A'?'#ff9a3c':(evo==='B'?'#7dfcff':col);
   glow(g,0,0,14,c2,.45); g.fillStyle=c2; poly(g,0,0,11,4,0); g.fill(); g.fillStyle=INK; poly(g,0,0,5,4,0); g.fill();
   if(evo==='B'||evo2){ g.strokeStyle='#7dfcff'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-14,4); g.lineTo(-14,-4); g.lineTo(-16,-2); g.moveTo(14,4); g.lineTo(14,-4); g.lineTo(16,-2); g.stroke(); } }
  break;
 case 'radar':
  { const c2=evo==='A'?'#ff4d6d':(evo==='B'?'#5ef2a4':col);
   g.strokeStyle=hexA(c2,.4); g.lineWidth=1; circ(g,0,0,12); g.stroke(); circ(g,0,0,7); g.stroke();
   g.rotate(T*1.6);
   g.fillStyle=hexA(c2,.35); g.beginPath(); g.moveTo(0,0); g.arc(0,0,12,-.5,.3); g.closePath(); g.fill();
   g.strokeStyle=c2; g.lineWidth=2; g.beginPath(); g.moveTo(0,0); g.lineTo(12,0); g.stroke();
   g.fillStyle=c2; circ(g,0,0,2.5); g.fill(); }
  break;
 case 'miner':
  if(evo==='B'&&!evo2){ g.fillStyle='#5ef2a4'; for(let i=0;i<3;i++){ g.beginPath(); g.ellipse(0,6-i*5,9,3.4,0,0,TAU); g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke(); } }
  else { const c2=evo==='A'?'#ffe066':col; glow(g,0,0,13,c2,.4+.2*Math.sin(T*3)); g.fillStyle=c2; poly(g,0,0,evo==='A'?12:10,6,Math.PI/6); g.fill(); g.fillStyle=hexA('#ffffff',.5); g.beginPath(); g.moveTo(0,-8); g.lineTo(5,-3); g.lineTo(0,0); g.lineTo(-5,-3); g.fill(); }
  break;
 case 'barrier':
  { const c2=evo==='A'?'#7dfcff':col, s=evo==='A'?1.2:1;
   g.scale(s,s); g.fillStyle=hexA(c2,.25); g.strokeStyle=c2; g.lineWidth=2;
   g.beginPath(); g.moveTo(0,-11); g.lineTo(9,-7); g.lineTo(8,4); g.lineTo(0,11); g.lineTo(-8,4); g.lineTo(-9,-7); g.closePath(); g.fill(); g.stroke();
   if(evo==='B'||evo2){ const a=T*2.4; g.fillStyle='#c3ff6b'; circ(g,Math.cos(a)*14,Math.sin(a)*14,2.6); g.fill(); } }
  break;
 }
 g.restore();
 /* 레벨 표시 */
 if(lv>0&&!evo){ g.fillStyle=col; for(let i=0;i<lv;i++){ circ(g,-4+i*8-(lv-1)*0+ (lv===1?4:0),13,1.8); g.fill(); } }
}

/* ═══════════ 적 그림 ═══════════ */
function drawEnemyShape(g,e,col,T){
 const r=e.r, s=e.D.shape;
 g.fillStyle='rgba(9,15,31,.85)'; g.strokeStyle=col; g.lineWidth=2;
 switch(s){
 case 'square': g.rotate(T*1.3+e.wob*.08); poly(g,0,0,r,4,0); g.fill(); g.stroke(); g.fillStyle=col; poly(g,0,0,r*.4,4,Math.PI/4); g.fill(); break;
 case 'tri': g.rotate(e.ang); g.beginPath(); g.moveTo(r*1.3,0); g.lineTo(-r*.8,r*.85); g.lineTo(-r*.3,0); g.lineTo(-r*.8,-r*.85); g.closePath(); g.fill(); g.stroke(); break;
 case 'hex': g.rotate(T*.45); poly(g,0,0,r,6,0); g.fill(); g.stroke(); g.globalAlpha=.5; g.lineWidth=3.4; poly(g,0,0,r*.7,6,Math.PI/6); g.stroke(); g.globalAlpha=1; g.fillStyle=col; poly(g,0,0,r*.3,6,0); g.fill(); break;
 case 'wing': { g.rotate(e.ang); const f=Math.sin(T*13+e.wob)*.45;
  g.beginPath(); g.moveTo(0,0); g.lineTo(-r*.95,-r*(1.05+f)); g.lineTo(-r*.15,-r*.25); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(0,0); g.lineTo(-r*.95,r*(1.05+f)); g.lineTo(-r*.15,r*.25); g.closePath(); g.fill(); g.stroke();
  poly(g,0,0,r*.6,4,0); g.fill(); g.stroke(); break; }
 case 'orb': circ(g,0,0,r); g.fill(); g.stroke(); g.save(); g.rotate(T*2.1); g.globalAlpha=.75; for(let i=0;i<3;i++){ g.beginPath(); g.arc(0,0,r*.58,i/3*TAU,i/3*TAU+.95); g.stroke(); } g.restore(); break;
 case 'plus': { g.rotate(T*.85); const a=r*.4; g.beginPath(); g.moveTo(-a,-r); g.lineTo(a,-r); g.lineTo(a,-a); g.lineTo(r,-a); g.lineTo(r,a); g.lineTo(a,a); g.lineTo(a,r); g.lineTo(-a,r); g.lineTo(-a,a); g.lineTo(-r,a); g.lineTo(-r,-a); g.lineTo(-a,-a); g.closePath(); g.fill(); g.stroke(); g.fillStyle=col; circ(g,0,0,r*.28); g.fill(); break; }
 case 'oct': g.rotate(T*.38); poly(g,0,0,r,8,Math.PI/8); g.fill(); g.stroke(); g.fillStyle=col; poly(g,0,0,r*.33,8,0); g.fill(); break;
 case 'star': g.globalAlpha=.55+Math.sin(T*8+e.wob)*.28; g.rotate(T*1.05); star(g,0,0,r,r*.44,5,0); g.fill(); g.stroke(); g.globalAlpha=1; break;
 case 'prism': g.rotate(e.ang+Math.PI/2); g.beginPath(); g.moveTo(0,-r*1.25); g.lineTo(r*.85,0); g.lineTo(0,r*1.25); g.lineTo(-r*.85,0); g.closePath(); g.fill(); g.stroke(); g.fillStyle=col; poly(g,0,0,r*.3,4,Math.PI/4); g.fill(); break;
 case 'gear': g.rotate(T*1.1); poly(g,0,0,r,8,0); g.fill(); g.stroke(); g.save(); g.lineWidth=3.2; g.globalAlpha=.6; for(let i=0;i<8;i++){ const a=i/8*TAU; g.beginPath(); g.moveTo(Math.cos(a)*r,Math.sin(a)*r); g.lineTo(Math.cos(a)*(r+4),Math.sin(a)*(r+4)); g.stroke(); } g.restore(); g.fillStyle=col; circ(g,0,0,r*.32); g.fill(); break;
 case 'ghost': { const wv=Math.sin(T*6+e.wob);
  g.beginPath(); g.arc(0,-r*.2,r,Math.PI,0); g.lineTo(r,r*.8);
  for(let i=0;i<4;i++){ const x=r-(i+.5)*r/2; g.quadraticCurveTo(x,r*(.4+(i%2?.5:0)+wv*.1),x-r/4,r*.8); }
  g.lineTo(-r,-r*.2); g.closePath(); g.fill(); g.stroke();
  g.fillStyle=col; circ(g,-r*.35,-r*.25,2); g.fill(); circ(g,r*.35,-r*.25,2); g.fill(); break; }
 case 'bearer': g.rotate(e.ang); poly(g,0,0,r,6,0); g.fill(); g.stroke();
  g.strokeStyle=e.blockT>0?'#ffffff':'#8fb3ff'; g.lineWidth=4; g.beginPath(); g.arc(0,0,r+5,-1,1); g.stroke(); break;
 case 'berserk': { const p=1+Math.sin(T*10)*.08*(1+(1-e.hp/e.maxHp)*2); g.scale(p,p); g.rotate(T*2); star(g,0,0,r*1.1,r*.55,7,0); g.fill(); g.stroke(); g.fillStyle=col; circ(g,0,0,r*.3); g.fill(); break; }
 case 'carrier': g.rotate(e.ang); rrect(g,-r*1.3,-r*.7,r*2.6,r*1.4,6); g.fill(); g.stroke();
  g.fillStyle=hexA(col,.7); for(let i=-1;i<=1;i++) g.fillRect(i*r*.7-3,-r*.35,6,r*.7);
  g.fillStyle=col; g.fillRect(r*1.1,-3,6,6); break;
 }
}

/* ═══════════ 거대 보스 그림 ═══════════ */
function drawBoss(g,e,T){
 const r=e.r, ph=e.phase, col=e.col;
 glow(g,0,0,r*2.4,col,.35+.1*Math.sin(T*3));
 g.lineJoin='round';
 if(e.type==='crusher'){
  g.save(); g.rotate(e.ang);
  /* 무한궤도 */
  g.fillStyle='#1a1020'; g.strokeStyle=hexA(col,.7); g.lineWidth=2;
  rrect(g,-r*1.15,-r*.95,r*2.1,r*.42,8); g.fill(); g.stroke(); rrect(g,-r*1.15,r*.53,r*2.1,r*.42,8); g.fill(); g.stroke();
  g.strokeStyle=hexA(col,.5); g.lineWidth=1.5;
  for(let i=0;i<8;i++){ const x=-r*1.1+((i*r*.28+T*40)%(r*2)); g.beginPath(); g.moveTo(x,-r*.95); g.lineTo(x,-r*.53); g.moveTo(x,r*.53); g.lineTo(x,r*.95); g.stroke(); }
  /* 몸체 */
  g.fillStyle='#2a1408'; g.strokeStyle=col; g.lineWidth=3;
  rrect(g,-r*.95,-r*.6,r*1.7,r*1.2,12); g.fill(); g.stroke();
  g.fillStyle=hexA(col,ph>=2?.5:.3); rrect(g,-r*.6,-r*.35,r*.8,r*.7,6); g.fill();
  /* 드릴 */
  for(const sy of [-1,1]){
   g.save(); g.translate(r*.75,sy*r*.35);
   g.fillStyle=ph===3?'#ffd36b':'#c9844a'; g.beginPath(); g.moveTo(0,-r*.22); g.lineTo(r*.75,0); g.lineTo(0,r*.22); g.closePath(); g.fill();
   g.strokeStyle='#1a1020'; g.lineWidth=2; for(let i=0;i<4;i++){ const x=((i*.2+T*2)%.8)*r; g.beginPath(); g.moveTo(x,-r*.22*(1-x/(r*.75))); g.lineTo(x+r*.08,r*.22*(1-x/(r*.75))); g.stroke(); }
   g.restore();
  }
  if(ph===3){ g.fillStyle='#ff4d6d'; for(let i=0;i<3;i++){ circ(g,-r*.75,-r*.3+i*r*.3,3); g.fill(); } }
  g.restore();
 } else if(e.type==='hive'){
  const n=24;
  g.fillStyle='rgba(40,14,60,.9)'; g.strokeStyle=col; g.lineWidth=3;
  g.beginPath();
  for(let i=0;i<=n;i++){ const a=i/n*TAU, rr=r*(1+.08*Math.sin(a*5+T*3)+.05*Math.sin(a*3-T*2)); const x=Math.cos(a)*rr, y=Math.sin(a)*rr; if(i) g.lineTo(x,y); else g.moveTo(x,y); }
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle=hexA(col,.35);
  for(let i=0;i<5;i++){ const a=i/5*TAU+T*.3; circ(g,Math.cos(a)*r*.45,Math.sin(a)*r*.45,r*.2); g.fill(); }
  g.fillStyle='#ffe6ff'; circ(g,0,0,r*.22+Math.sin(T*4)*2); g.fill();
  for(let i=0;i<6;i++){ const a=i/6*TAU-T*.8, d=r*1.35; g.fillStyle=col; circ(g,Math.cos(a)*d,Math.sin(a)*d,5+Math.sin(T*5+i)*1.5); g.fill(); }
  if(e.twin){ g.strokeStyle='#ffffff'; g.lineWidth=1; circ(g,0,0,r*.6); g.stroke(); }
 } else {
  /* 오버로드 */
  g.save(); g.rotate(T*.4);
  g.strokeStyle=hexA(col,.7); g.lineWidth=3; poly(g,0,0,r*1.3,3,0); g.stroke();
  for(let i=0;i<3;i++){ const a=i/3*TAU; g.fillStyle=col; star(g,Math.cos(a)*r*1.3,Math.sin(a)*r*1.3,8,3,4,T); g.fill(); }
  g.restore();
  g.save(); g.rotate(-T*.7); g.strokeStyle=hexA('#ffc247',.75); g.lineWidth=2; poly(g,0,0,r*1.1,6,0); g.stroke();
  for(let i=0;i<6;i++){ const a=i/6*TAU; g.beginPath(); g.moveTo(Math.cos(a)*r*1.1,Math.sin(a)*r*1.1); g.lineTo(Math.cos(a)*r*1.35,Math.sin(a)*r*1.35); g.stroke(); }
  g.restore();
  g.fillStyle='#1a0610'; g.strokeStyle=col; g.lineWidth=3; circ(g,0,0,r*.85); g.fill(); g.stroke();
  /* 눈 */
  const c=G.paths.length?G.paths[0].core:{x:e.x+10,y:e.y}, la=Math.atan2(c.y-e.y,c.x-e.x);
  g.fillStyle=ph===3?'#ff1f4b':'#ff4d6d'; g.beginPath(); g.ellipse(0,0,r*.6,r*.36,0,0,TAU); g.fill();
  g.fillStyle='#ffe0e6'; circ(g,Math.cos(la)*r*.2,Math.sin(la)*r*.12,r*.2); g.fill();
  g.fillStyle='#000'; circ(g,Math.cos(la)*r*.24,Math.sin(la)*r*.14,r*.09); g.fill();
  if(ph===3){ glow(g,0,0,r*3,'#ff1f4b',.3+.15*Math.sin(T*8)); }
 }
 /* 약점 */
 const wx=Math.cos(e.wpAng)*r*.9, wy=Math.sin(e.wpAng)*r*.9;
 glow(g,wx,wy,16+(e.wpHit>0?8:0),'#fff2a8',.8);
 g.fillStyle=e.wpHit>0?'#ffffff':'#fff2a8'; circ(g,wx,wy,5); g.fill();
 g.strokeStyle='#fff2a8'; g.lineWidth=1.5; circ(g,wx,wy,9+Math.sin(T*6)*2); g.stroke();
}

/* ═══════════ DOM용 아이콘 ═══════════ */
function towerIcon(cv,id,evo,evo2,lv){
 const S2=96; cv.width=S2; cv.height=S2;
 const g=cv.getContext('2d'); g.clearRect(0,0,S2,S2);
 g.save(); g.translate(S2/2,S2/2); g.scale(2.3,2.3);
 drawTowerArt(g,id,evo||null,!!evo2,lv||0,-Math.PI/4,0,.4,1.2);
 g.restore();
}
function enemyIcon(cv,type){
 const S2=120; cv.width=S2; cv.height=S2;
 const g=cv.getContext('2d'); g.clearRect(0,0,S2,S2);
 const D=ENEMIES[type];
 const e={type:type,D:D,r:D.r,col:D.col,ang:-.4,wob:0,hp:1,maxHp:1,phase:1,wpAng:-1.2,wpHit:0,blockT:0,x:0,y:0};
 g.save(); g.translate(S2/2,S2/2);
 const sc=D.giant?.95:Math.min(3,38/D.r);
 g.scale(sc,sc);
 glow(g,0,0,D.r*2.2,D.col,.35);
 if(D.giant) drawBoss(g,e,1.2); else drawEnemyShape(g,e,D.col,1.2);
 g.restore();
}
