/* ======================================================================
   Tracking Target – visualizeHitBox / vibration 対応
====================================================================== */
GameCore.init({

  start() {
    this.sensNormal = SETTINGS.sensNormal;
    this.sensAim    = SETTINGS.sensAim;
    this.hitScale   = SETTINGS.hitBoxSize;

    this.circle = document.getElementById('circle');
    this.frame  = document.querySelector('.frame');
    this.circle.classList.remove('hidden');

    this.circleSize = SETTINGS.cursorSize;
    this.circle.style.width =
    this.circle.style.height = `${this.circleSize}px`;

    if (SETTINGS.visualizeHitBox && !this.circle.querySelector('.cursor-dot')) {
      const d=document.createElement('div'); d.className='cursor-dot';
      this.circle.appendChild(d);
    }

    this.targetSize  = this.circleSize;
    this.hitDiameter = this.targetSize * this.hitScale;
    this.hitRadius   = this.hitDiameter / 2;

    this.cx=this.frame.clientWidth/2-this.circleSize/2;
    this.cy=this.frame.clientHeight/2-this.circleSize/2;
    this.circle.style.left=`${this.cx}px`; this.circle.style.top=`${this.cy}px`;

    this.speedRatio=0.2;
    this.target=createTarget.call(this);
    document.getElementById('score').textContent='Score: 0';
  },

  update() {
    const gp=navigator.getGamepads()[0]; if(!gp) return;

    const sens=gp.buttons[4]?.pressed?this.sensAim:this.sensNormal;
    this.cx+=gp.axes[2]*sens; this.cy+=gp.axes[3]*sens;
    this.cx=Math.max(0,Math.min(this.cx,this.frame.clientWidth - this.circleSize));
    this.cy=Math.max(0,Math.min(this.cy,this.frame.clientHeight- this.circleSize));
    this.circle.style.left=`${this.cx}px`; this.circle.style.top=`${this.cy}px`;

    const t=this.target;
    t.x+=t.vx; t.y+=t.vy;
    if(t.x<=0||t.x>=this.frame.clientWidth - this.targetSize) t.vx*=-1;
    if(t.y<=0||t.y>=this.frame.clientHeight- this.targetSize) t.vy*=-1;
    const ang=Math.atan2(t.vy,t.vx)+t.omega;
    t.vx=Math.cos(ang)*t.speed; t.vy=Math.sin(ang)*t.speed;

    t.el.style.left=`${t.x}px`; t.el.style.top=`${t.y}px`;
    if (t.hb){
      t.hb.style.left=`${t.x+this.targetSize/2}px`;
      t.hb.style.top =`${t.y+this.targetSize/2}px`;
    }

    const hit=hitCheck.call(this,t);
    if(hit) addScore(1);
    this.circle.classList.toggle('hit', hit);
  },

  cleanup(){ this.target.el.remove(); if(this.target.hb) this.target.hb.remove(); this.circle.classList.add('hidden'); }
});

/* ---------- utility ---------- */
function createTarget(){
  const max=this.sensNormal*this.speedRatio;
  const vx=(Math.random()*2-1)*max, vy=(Math.random()*2-1)*max;
  const x=Math.random()*(this.frame.clientWidth - this.targetSize);
  const y=Math.random()*(this.frame.clientHeight- this.targetSize);
  const curv=0.05+Math.random()*0.15, omega=curv*0.05, speed=Math.hypot(vx,vy);

  const el=document.createElement('div');
  el.className='target';
  el.style.width=el.style.height=`${this.targetSize}px`;
  el.style.left=`${x}px`; el.style.top=`${y}px`;

  let hb=null;
  if(SETTINGS.visualizeHitBox){
    hb=document.createElement('div'); hb.className='hitbox';
    hb.style.width=hb.style.height=`${this.hitDiameter}px`;
    hb.style.left=`${x+this.targetSize/2}px`; hb.style.top=`${y+this.targetSize/2}px`;
    this.frame.appendChild(hb);
  }

  this.frame.appendChild(el);
  return {el,hb,x,y,vx,vy,omega,speed};
}
function hitCheck(t){ const cx=this.cx+this.circleSize/2, cy=this.cy+this.circleSize/2, tx=t.x+this.targetSize/2, ty=t.y+this.targetSize/2; return Math.hypot(cx-tx, cy-ty)<=this.hitRadius; }
function addScore(v){ const s=document.getElementById('score'); s.textContent='Score: '+(parseInt(s.textContent.split(': ')[1])+v); }
