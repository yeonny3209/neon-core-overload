/* ═══════════ 사운드 ═══════════
   효과음은 전부 합성한다. 배경음악은 챕터 1에 사용자가 만든 곡(mp3)을 쓰고,
   나머지 테마는 같은 엔진으로 절차적으로 연주한다. */
const MUSIC_MP3='data:audio/mpeg;base64,/*MUSIC*/';

/* 패턴 문자열 → 배열. '.'은 쉼표 */
function pat(s){ return s.replace(/\s+/g,'').split(''); }

const THEMES={
 menu:{bpm:80,root:110,scale:[0,2,3,5,7,8,10],prog:[0,5,3,4],
  bass:pat('x... .... x... ..o.'), arp:pat('0.1. 2.1. 0.1. 2.3.'),
  kick:pat('x... .... x... ....'), snare:pat('.... x... .... x...'), hat:pat('..x. ..x. ..x. ..x.'),
  bassType:'triangle', bassLp:500, arpType:'sine', arpLp:2600, pad:1, verb:1},
 ch2:{bpm:88,root:73.42,scale:[0,2,3,5,7,9,10],prog:[0,3,6,4],
  bass:pat('x..x ..x. x..x .o..'), arp:pat('0.2. 1.3. 2.1. 3.2.'),
  kick:pat('x... ..x. x... ....'), snare:pat('.... x... .... x..x'), hat:pat('x.x. x.x. x.x. xxx.'),
  bassType:'sawtooth', bassLp:380, arpType:'triangle', arpLp:2200, pad:1, verb:1},
 ch3:{bpm:122,root:82.41,scale:[0,1,3,5,7,8,10],prog:[0,1,5,6],
  bass:pat('xx.x x.x. xx.x x.o.'), arp:pat('0123 2103 0123 3210'),
  kick:pat('x..x x... x..x x..x'), snare:pat('.... x... .... x.x.'), hat:pat('xxxx xxxx xxxx xxxx'),
  bassType:'sawtooth', bassLp:700, arpType:'square', arpLp:3000, pad:0, verb:0},
 boss1:{bpm:96,root:65.41,scale:[0,2,3,5,7,8,11],prog:[0,0,5,4],
  bass:pat('x.xx .x.x x.xx .xo.'), arp:pat('0... 0..1 0... 2.1.'),
  kick:pat('x.x. x.x. x.x. x.xx'), snare:pat('.... x... .... x...'), hat:pat('x.xx x.xx x.xx x.xx'),
  bassType:'square', bassLp:520, arpType:'sawtooth', arpLp:1800, pad:0, verb:0, drive:1},
 boss2:{bpm:108,root:92.5,scale:[0,1,3,4,6,8,9],prog:[0,1,0,6],
  bass:pat('x..x ..x. .x.. x.o.'), arp:pat('0213 0213 1302 1302'),
  kick:pat('x... x..x ..x. x...'), snare:pat('.... x... .x.. x...'), hat:pat('.xx. .xx. .xx. .xxx'),
  bassType:'sawtooth', bassLp:460, arpType:'triangle', arpLp:3400, pad:1, verb:1},
 boss3:{bpm:132,root:110,scale:[0,2,3,5,7,8,10],prog:[0,5,6,4],
  bass:pat('xoxo xoxo xoxo xoxx'), arp:pat('0123 1230 2301 3210'),
  kick:pat('x.x. x.x. x.x. x.xx'), snare:pat('.... x... .... x.xx'), hat:pat('xxxx xxxx xxxx xxxx'),
  bassType:'sawtooth', bassLp:900, arpType:'square', arpLp:3600, pad:1, verb:1, drive:1}
};

const SND={
 ctx:null,master:null,comp:null,gSfx:null,gMus:null,verb:null,send:null,noise:null,
 on:true,ready:false,voices:0,last:Object.create(null),
 init(){
  if(this.ctx) return;
  const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
  try{
   const c=new AC(); this.ctx=c;
   this.comp=c.createDynamicsCompressor();
   this.comp.threshold.value=-10; this.comp.knee.value=8; this.comp.ratio.value=12;
   this.comp.attack.value=.003; this.comp.release.value=.2;
   this.comp.connect(c.destination);
   this.master=c.createGain(); this.master.gain.value=.9; this.master.connect(this.comp);
   this.gSfx=c.createGain(); this.gSfx.connect(this.master);
   this.gMus=c.createGain(); this.gMus.gain.value=0; this.gMus.connect(this.master);
   this.musFilter=c.createBiquadFilter(); this.musFilter.type='lowpass'; this.musFilter.frequency.value=12000;
   this.musFilter.connect(this.gMus);
   this.verb=c.createConvolver(); this.verb.buffer=this.mkIR(1.9,2.6);
   const vg=c.createGain(); vg.gain.value=.8; this.verb.connect(vg); vg.connect(this.master);
   this.send=c.createGain(); this.send.connect(this.verb);
   this.musSend=c.createGain(); this.musSend.gain.value=.35; this.musSend.connect(this.verb);
   const len=(c.sampleRate*1.6)|0, b=c.createBuffer(1,len,c.sampleRate), d=b.getChannelData(0);
   for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
   this.noise=b;
   this.ready=true;
   this.applyVol();
  }catch(e){ this.ready=false; }
 },
 mkIR(dur,decay){
  const c=this.ctx, n=(c.sampleRate*dur)|0, buf=c.createBuffer(2,n,c.sampleRate);
  for(let ch=0;ch<2;ch++){
   const d=buf.getChannelData(ch); let lp=0;
   for(let i=0;i<n;i++){ const v=(Math.random()*2-1)*Math.pow(1-i/n,decay); lp+=(v-lp)*.35; d[i]=lp; }
  }
  return buf;
 },
 applyVol(){
  if(!this.ready) return;
  const s=SAVE.d.set, t=this.ctx.currentTime;
  this.gSfx.gain.setTargetAtTime(.55*s.sfx,t,.05);
  this.on=s.sfx>0.001;
  if(this.mTheme) this.gMus.gain.setTargetAtTime(.38*s.mus,t,.3);
 },
 resume(){ if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume().catch(()=>{}); },
 /* 화면이 가려지거나 일시정지하면 오디오 클록 자체를 멈춘다 */
 pauseAll(){ if(this.ctx&&this.ctx.state==='running') this.ctx.suspend().catch(()=>{}); },
 resumeAll(){ if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume().catch(()=>{}); },
 /* 탭을 닫을 때: 연결을 먼저 끊어(동기) 스피커로 가는 길을 막고 컨텍스트를 닫는다 */
 hardStop(){
  try{ if(this.mp3Src){ this.mp3Src.stop(); this.mp3Src.disconnect(); } }catch(e){}
  try{ if(this.master){ this.master.gain.value=0; this.master.disconnect(); } }catch(e){}
  try{ if(this.comp) this.comp.disconnect(); }catch(e){}
  try{ if(this.ctx) this.ctx.close(); }catch(e){}
  if(this.mTimer){ clearInterval(this.mTimer); this.mTimer=null; }
  this.ctx=null; this.ready=false;
 },
 busy(){ return this.voices>28; },

 tone(o){
  if(!this.ready||!this.on||this.busy()) return;
  const c=this.ctx, t=c.currentTime+(o.at||0);
  const osc=c.createOscillator(), g=c.createGain();
  osc.type=o.type||'sine';
  osc.frequency.setValueAtTime(o.f,t);
  if(o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20,o.f2),t+o.d);
  if(o.detune) osc.detune.value=o.detune;
  g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(o.g||.2,t+(o.atk||.005));
  g.gain.exponentialRampToValueAtTime(.0001,t+o.d);
  let node=osc;
  if(o.lp){
   const f=c.createBiquadFilter(); f.type='lowpass';
   f.frequency.setValueAtTime(o.lp,t);
   if(o.lp2) f.frequency.exponentialRampToValueAtTime(Math.max(60,o.lp2),t+o.d);
   f.Q.value=o.q||.7; node.connect(f); node=f;
  }
  node.connect(g); g.connect(this.gSfx);
  if(o.verb) g.connect(this.send);
  this.voices++; osc.onended=()=>{ this.voices--; };
  osc.start(t); osc.stop(t+o.d+.02);
 },
 hiss(o){
  if(!this.ready||!this.on||this.busy()) return;
  const c=this.ctx, t=c.currentTime+(o.at||0);
  const s=c.createBufferSource(); s.buffer=this.noise;
  if(o.rate) s.playbackRate.value=o.rate;
  const f=c.createBiquadFilter(); f.type=o.type||'lowpass';
  f.frequency.setValueAtTime(o.f,t);
  if(o.f2) f.frequency.exponentialRampToValueAtTime(Math.max(40,o.f2),t+o.d);
  f.Q.value=o.q||1;
  const g=c.createGain();
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(o.g||.2,t+(o.atk||.004));
  g.gain.exponentialRampToValueAtTime(.0001,t+o.d);
  s.connect(f); f.connect(g); g.connect(this.gSfx);
  if(o.verb) g.connect(this.send);
  this.voices++; s.onended=()=>{ this.voices--; };
  s.start(t); s.stop(t+o.d+.02);
 },
 fm(o){
  if(!this.ready||!this.on||this.busy()) return;
  const c=this.ctx, t=c.currentTime+(o.at||0);
  const car=c.createOscillator(), mod=c.createOscillator(), mg=c.createGain(), g=c.createGain();
  car.frequency.setValueAtTime(o.f,t);
  if(o.f2) car.frequency.exponentialRampToValueAtTime(Math.max(20,o.f2),t+o.d);
  mod.frequency.setValueAtTime(o.f*(o.ratio||2.4),t);
  mg.gain.setValueAtTime(o.idx||300,t); mg.gain.exponentialRampToValueAtTime(1,t+o.d*.8);
  mod.connect(mg); mg.connect(car.frequency);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(o.g||.18,t+.004);
  g.gain.exponentialRampToValueAtTime(.0001,t+o.d);
  car.connect(g); g.connect(this.gSfx);
  if(o.verb) g.connect(this.send);
  this.voices++; car.onended=()=>{ this.voices--; };
  car.start(t); mod.start(t); car.stop(t+o.d+.02); mod.stop(t+o.d+.02);
 },
 chord(notes,o){
  o=o||{};
  for(let i=0;i<notes.length;i++)
   this.tone({f:notes[i],type:o.type||'triangle',d:o.d||.5,g:o.g||.09,at:(o.at||0)+i*(o.stag||.06),lp:o.lp||4000,verb:o.verb});
 },

 play(name,gate){
  if(!this.ready||!this.on) return;
  if(gate){ const now=performance.now(); if(this.last[name]&&now-this.last[name]<gate) return; this.last[name]=now; }
  switch(name){
   /* ── 사격 ── */
   case 'pulse': this.fm({f:780,f2:320,d:.07,g:.045,ratio:3.1,idx:420}); this.hiss({f:5200,f2:1800,d:.035,g:.02,type:'highpass'}); break;
   case 'gatling': this.hiss({f:3600,f2:1200,d:.04,g:.035,type:'bandpass',q:1.4}); break;
   case 'rail': this.tone({f:2400,f2:180,type:'sawtooth',d:.22,g:.08,lp:6000,lp2:600}); this.hiss({f:8000,f2:1500,d:.18,g:.06,type:'highpass'}); break;
   case 'sniper': this.fm({f:180,f2:60,d:.22,g:.16,ratio:5,idx:900}); this.hiss({f:6000,f2:900,d:.12,g:.09,type:'highpass'}); break;
   case 'bounce': this.fm({f:1200,f2:2000,d:.06,g:.04,ratio:1.5,idx:200}); break;
   case 'shotgun': this.hiss({f:2600,f2:300,d:.16,g:.14}); this.tone({f:120,f2:50,type:'square',d:.1,g:.06,lp:700}); break;
   case 'laser': this.tone({f:900,f2:1300,type:'sawtooth',d:.12,g:.025,lp:2600}); break;
   case 'mortar': this.tone({f:150,f2:44,type:'sawtooth',d:.2,g:.12,lp:900,lp2:260}); this.hiss({f:1400,f2:300,d:.16,g:.06}); break;
   case 'missile': this.hiss({f:900,f2:3200,d:.28,g:.07,type:'bandpass',q:1.6}); break;
   case 'mine': this.tone({f:420,f2:300,type:'square',d:.06,g:.03,lp:1600}); break;
   case 'plasma': this.tone({f:300,f2:900,type:'sawtooth',d:.3,g:.08,lp:1600,lp2:4000,verb:1}); this.fm({f:120,f2:240,d:.3,g:.06,ratio:1.5,idx:400}); break;
   case 'overcharge': this.tone({f:80,f2:1600,type:'sawtooth',d:.5,g:.12,lp:900,lp2:6000,verb:1}); break;
   case 'arc': this.tone({f:1700,f2:150,type:'sawtooth',d:.14,g:.065,lp:4200,lp2:700}); this.hiss({f:5200,f2:900,d:.12,g:.045,type:'highpass'}); break;
   case 'cryo': this.hiss({f:3000,f2:700,d:.28,g:.05,type:'bandpass',q:2.4,verb:1}); this.tone({f:1800,f2:2600,type:'sine',d:.2,g:.025,at:.02,verb:1}); break;
   case 'freeze': this.fm({f:2400,f2:3600,d:.4,g:.05,ratio:1.41,idx:800,verb:1}); this.hiss({f:7000,f2:2000,d:.3,g:.05,type:'highpass'}); break;
   case 'venom': this.hiss({f:900,f2:2400,d:.14,g:.05,type:'bandpass',q:3}); break;
   case 'flame': this.hiss({f:700,f2:1400,d:.16,g:.06,type:'bandpass',q:.8}); break;
   case 'grav': this.tone({f:90,f2:40,type:'sine',d:.5,g:.15,verb:1}); this.tone({f:180,f2:60,type:'triangle',d:.4,g:.05}); break;
   case 'sonic': this.tone({f:220,f2:70,type:'sine',d:.28,g:.13}); this.hiss({f:1200,f2:200,d:.22,g:.06}); break;
   case 'mark': this.fm({f:1400,f2:1800,d:.12,g:.04,ratio:2,idx:200}); break;
   case 'net': this.hiss({f:2000,f2:600,d:.18,g:.05,type:'bandpass',q:2}); this.tone({f:600,f2:300,type:'triangle',d:.12,g:.03}); break;
   case 'drone': this.fm({f:1100,f2:700,d:.05,g:.025,ratio:2,idx:150}); break;
   /* ── 피격 · 폭발 ── */
   case 'boom': this.tone({f:120,f2:36,type:'sine',d:.32,g:.16}); this.hiss({f:1600,f2:120,d:.3,g:.11}); break;
   case 'bigboom': this.tone({f:80,f2:24,type:'sine',d:.9,g:.26,verb:1}); this.hiss({f:2400,f2:80,d:.9,g:.18,verb:1}); this.fm({f:60,f2:30,d:.7,g:.12,ratio:3,idx:600}); break;
   case 'die': this.fm({f:520,f2:110,d:.13,g:.05,ratio:1.7,idx:260}); break;
   case 'shieldbreak': this.fm({f:1800,f2:400,d:.2,g:.06,ratio:3.3,idx:700}); break;
   case 'leak': this.tone({f:300,f2:90,type:'sawtooth',d:.4,g:.12,lp:900}); this.tone({f:200,f2:60,type:'square',d:.35,g:.06,lp:600,at:.05}); break;
   /* ── UI ── */
   case 'click': this.fm({f:1300,f2:900,d:.05,g:.035,ratio:2,idx:120}); break;
   case 'build': this.tone({f:520,f2:780,type:'triangle',d:.12,g:.08}); this.tone({f:1040,type:'sine',d:.1,g:.04,at:.05}); break;
   case 'upgrade': this.chord([523,659,784],{type:'triangle',d:.3,g:.06,stag:.05}); break;
   case 'evolve': this.chord([392,523,659,784,1047],{type:'sawtooth',d:.8,g:.05,stag:.07,lp:3200,verb:1}); this.hiss({f:2000,f2:9000,d:.7,g:.05,type:'highpass',verb:1}); break;
   case 'sell': this.tone({f:700,f2:420,type:'triangle',d:.14,g:.06}); break;
   case 'nope': this.tone({f:180,f2:140,type:'square',d:.12,g:.05,lp:800}); break;
   case 'wave': this.tone({f:220,f2:440,type:'sawtooth',d:.45,g:.07,lp:1200,lp2:3000,verb:1}); break;
   case 'star': this.chord([1047,1319,1568],{type:'triangle',d:.35,g:.07,stag:.04,verb:1}); break;
   case 'unlock': this.chord([523,784,1047,1568],{type:'triangle',d:.9,g:.07,stag:.09,verb:1}); break;
   case 'win': this.chord([523,659,784,1047],{type:'triangle',d:1.1,g:.09,stag:.12,verb:1}); this.chord([262,330,392],{type:'sine',d:1.4,g:.06,at:.45,verb:1}); break;
   case 'lose': this.chord([392,330,262,196],{type:'sawtooth',d:1,g:.09,stag:.2,lp:1100,verb:1}); this.tone({f:49,type:'sine',d:1.8,g:.13}); break;
   case 'augshow': this.hiss({f:600,f2:6000,d:.5,g:.05,type:'bandpass',q:2,verb:1}); this.chord([440,554,659],{type:'sine',d:.5,g:.04,stag:.08,verb:1}); break;
   case 'aug1': this.chord([523,659,784],{type:'triangle',d:.4,g:.07,stag:.05}); break;
   case 'aug2': this.chord([587,740,880,1175],{type:'triangle',d:.6,g:.07,stag:.06,verb:1}); break;
   case 'aug3': this.chord([440,554,659,880,1109,1319],{type:'sawtooth',d:1.1,g:.05,stag:.07,lp:3600,verb:1}); this.tone({f:55,f2:110,type:'sine',d:1,g:.15}); break;
   /* ── 스킬 ── */
   case 'orbital': this.tone({f:1800,f2:200,type:'sawtooth',d:.8,g:.1,lp:5000,lp2:500,verb:1}); this.tone({f:60,f2:30,type:'sine',d:1,g:.25,at:.05}); this.hiss({f:3000,f2:100,d:1,g:.15,verb:1}); break;
   case 'orbitalcharge': this.tone({f:300,f2:2400,type:'sine',d:1,g:.05,verb:1}); break;
   case 'skfreeze': this.fm({f:2000,f2:4000,d:1,g:.06,ratio:1.41,idx:1200,verb:1}); this.hiss({f:9000,f2:3000,d:.9,g:.06,type:'highpass',verb:1}); break;
   case 'overclock': this.tone({f:200,f2:1600,type:'square',d:.6,g:.06,lp:2400}); this.chord([660,880,1320],{type:'sawtooth',d:.5,g:.04,stag:.05,lp:3000,at:.2}); break;
   case 'repair': this.chord([392,494,587,784],{type:'sine',d:.8,g:.07,stag:.1,verb:1}); break;
   case 'surge': this.chord([784,988,1175],{type:'triangle',d:.4,g:.07,stag:.04}); this.hiss({f:4000,f2:9000,d:.3,g:.04,type:'highpass'}); break;
   /* ── 적 · 보스 ── */
   case 'blink': this.fm({f:1500,f2:300,d:.16,g:.05,ratio:2,idx:350}); this.hiss({f:7000,f2:2500,d:.1,g:.035,type:'highpass'}); break;
   case 'jam': this.fm({f:420,f2:140,d:.25,g:.07,ratio:7,idx:600}); break;
   case 'heal': this.tone({f:660,f2:990,type:'sine',d:.2,g:.03}); break;
   case 'spawn': this.tone({f:200,f2:500,type:'triangle',d:.2,g:.05}); break;
   case 'bossin': this.tone({f:64,f2:40,type:'sawtooth',d:1.8,g:.2,lp:420,lp2:140,verb:1}); this.tone({f:96,f2:60,type:'square',d:1.5,g:.07,lp:500,at:.08}); this.hiss({f:400,f2:80,d:1.6,g:.07,at:.1,verb:1}); break;
   case 'phase': this.tone({f:110,f2:440,type:'sawtooth',d:.8,g:.12,lp:800,lp2:4000,verb:1}); this.hiss({f:600,f2:6000,d:.7,g:.08,verb:1}); this.tone({f:55,type:'sine',d:1.2,g:.2}); break;
   case 'charge': this.tone({f:80,f2:240,type:'sawtooth',d:1.8,g:.1,lp:600,lp2:2400}); break;
   case 'stomp': this.tone({f:70,f2:28,type:'sine',d:.6,g:.28}); this.hiss({f:900,f2:60,d:.5,g:.14}); break;
   case 'empwarn': this.tone({f:300,f2:900,type:'sawtooth',d:1,g:.09,lp:1800,lp2:3600}); this.fm({f:1200,f2:600,d:.9,g:.045,ratio:1.5,idx:500,at:.05}); break;
   case 'emp': this.hiss({f:6000,f2:300,d:.7,g:.15,type:'bandpass',q:1.2,verb:1}); this.fm({f:140,f2:40,d:.6,g:.18,ratio:5,idx:900,verb:1}); this.tone({f:55,f2:30,type:'sine',d:.8,g:.18}); break;
   case 'teleport': this.fm({f:300,f2:2400,d:.4,g:.08,ratio:1.5,idx:900,verb:1}); this.hiss({f:3000,f2:9000,d:.3,g:.05,type:'highpass'}); break;
   case 'bastion': this.chord([220,330,440,660],{type:'square',d:.9,g:.06,stag:.05,lp:2400,verb:1}); break;
   case 'rage': this.tone({f:90,f2:200,type:'sawtooth',d:.9,g:.15,lp:900,lp2:2200,verb:1}); this.tone({f:45,type:'sine',d:1.1,g:.2}); break;
   case 'bossdie': this.tone({f:50,f2:20,type:'sine',d:2.2,g:.3,verb:1}); this.hiss({f:3000,f2:60,d:2,g:.2,verb:1}); this.chord([262,330,392,523],{type:'triangle',d:1.6,g:.06,stag:.15,at:.8,verb:1}); break;
  }
 },

 /* ── 배경음악 ── */
 mTheme:null, mTimer:null, mStep:0, mNext:0, intensity:.3, inten:.3, mp3Buf:null, mp3Src:null, mp3Loading:false,
 music(name){
  if(!this.ready) return;
  if(this.mTheme===name) return;
  this.stopMusic(true);
  this.mTheme=name;
  const c=this.ctx;
  this.gMus.gain.cancelScheduledValues(c.currentTime);
  this.gMus.gain.setValueAtTime(0,c.currentTime);
  this.gMus.gain.setTargetAtTime(.38*SAVE.d.set.mus,c.currentTime,.8);
  if(name==='ch1'){ this.playMp3(); }
  else { this.mStep=0; this.mNext=c.currentTime+.12; }
  if(!this.mTimer) this.mTimer=setInterval(()=>this.pump(),60);
 },
 stopMusic(quick){
  if(this.mp3Src){ try{ this.mp3Src.stop(); }catch(e){} this.mp3Src.disconnect(); this.mp3Src=null; }
  this.mTheme=null;
  if(this.ready&&!quick) this.gMus.gain.setTargetAtTime(0,this.ctx.currentTime,.3);
 },
 playMp3(){
  const c=this.ctx;
  const go=()=>{
   if(this.mTheme!=='ch1'||this.mp3Src) return;
   const s=c.createBufferSource(); s.buffer=this.mp3Buf; s.loop=true;
   s.connect(this.musFilter); s.start(0); this.mp3Src=s;
  };
  if(this.mp3Buf){ go(); return; }
  if(this.mp3Loading) return;
  this.mp3Loading=true;
  fetch(MUSIC_MP3).then(r=>r.arrayBuffer()).then(b=>c.decodeAudioData(b)).then(ab=>{ this.mp3Buf=ab; this.mp3Loading=false; go(); })
   .catch(()=>{ this.mp3Loading=false; });
 },
 mv(f,t,d,g,type,lp,det){
  const c=this.ctx, o=c.createOscillator(), gn=c.createGain(), fl=c.createBiquadFilter();
  o.type=type; o.frequency.setValueAtTime(f,t); if(det) o.detune.value=det;
  fl.type='lowpass'; fl.frequency.setValueAtTime(lp,t); fl.Q.value=.8;
  gn.gain.setValueAtTime(0,t); gn.gain.linearRampToValueAtTime(g,t+.012);
  gn.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(fl); fl.connect(gn); gn.connect(this.musFilter);
  o.start(t); o.stop(t+d+.05);
  return gn;
 },
 drum(kind,t,g){
  const c=this.ctx;
  if(kind==='k'){
   const o=c.createOscillator(), gn=c.createGain();
   o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(42,t+.11);
   gn.gain.setValueAtTime(g,t); gn.gain.exponentialRampToValueAtTime(.0001,t+.25);
   o.connect(gn); gn.connect(this.musFilter); o.start(t); o.stop(t+.27);
   return;
  }
  const s=c.createBufferSource(); s.buffer=this.noise;
  const f=c.createBiquadFilter(), gn=c.createGain(), hat=kind==='h';
  if(hat){ f.type='highpass'; f.frequency.value=7400; } else { f.type='bandpass'; f.frequency.value=1800; f.Q.value=.9; }
  gn.gain.setValueAtTime(g,t); gn.gain.exponentialRampToValueAtTime(.0001,t+(hat?.045:.2));
  s.connect(f); f.connect(gn); gn.connect(this.musFilter);
  s.start(t); s.stop(t+(hat?.06:.22));
 },
 pump(){
  if(!this.ready) return;
  const c=this.ctx;
  this.inten+=(this.intensity-this.inten)*.06;
  this.musFilter.frequency.setTargetAtTime(1400+this.inten*10000,c.currentTime,.4);
  const T=THEMES[this.mTheme];
  if(!T) return;
  const spb=60/T.bpm/4, hot=this.inten;
  if(this.mNext<c.currentTime-.05) this.mNext=c.currentTime+.05;
  const freq=(deg,oct)=>{ const n=T.scale.length, o=Math.floor(deg/n), i=((deg%n)+n)%n; return T.root*Math.pow(2,(T.scale[i]+12*(o+(oct||0)))/12); };
  while(this.mNext<c.currentTime+.3){
   const s=this.mStep%16, bar=Math.floor(this.mStep/16)%T.prog.length, t=this.mNext, r=T.prog[bar];
   if(T.kick[s]==='x') this.drum('k',t,.32);
   if(T.snare[s]==='x'&&hot>.15) this.drum('s',t,.13+hot*.06);
   if(T.hat[s]==='x'&&hot>.25) this.drum('h',t,.035+hot*.04);
   const b=T.bass[s];
   if(b!=='.'){ const f=freq(r,0)*(b==='o'?2:1); this.mv(f,t,spb*1.8,T.drive?.12:.14,T.bassType,T.bassLp+hot*500); }
   const a=T.arp[s];
   if(a!=='.'&&hot>.12){ const k=+a, f=freq(r+[0,2,4,7][k],2); this.mv(f,t,spb*1.6,.028+hot*.03,T.arpType,T.arpLp); }
   if(T.pad&&s===0){
    for(const dg of [0,2,4]) this.mv(freq(r+dg,1),t,spb*15.5,.018+hot*.012,'sawtooth',500+hot*900,dg===2?7:-6);
   }
   this.mNext+=spb; this.mStep++;
  }
 }
};
