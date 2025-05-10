/* ======================================================================
   Shoot Target – 静止的を撃つ + 補助線
====================================================================== */
GameCore.init({

  start(){
    this.sensNormal=SETTINGS.sensNormal;
    this.sensAim   =SETTINGS.sensAim;
    this.hitScale  =SETTINGS.hitBoxSize;

    this.circle=document.getElementById('circle');
    this.frame =document.querySelector('.frame');
    this.circle.classList.remove('hidden');

    this.circleSize=SETTINGS.cursorSize;
    this.circle.style.width=this.circle.style.height=`${this.circleSize}px`;

    if(!this.circle.querySelector('.cursor-dot')){
      const d=document.createElement('div'); d.className='cursor-dot'; this.circle.appendChild(d);
    }

    this.targetSize=this.circleSize;
    this.hitDiameter=this.targetSize*this.hitScale;
    this.hitRadius=this.hitDiameter/2;

    this.cx=this.frame.clientWidth/2-this.circleSize/2;
    this.cy=this.frame.clientHeight/2-this.circleSize/2;
    this.circle.style.left=`${this.cx}px`; this.circle.style.top=`${this.cy}px`;

    this.aux=document.getElementById('aux-lines')||(()=>{const c=document.createElement('canvas');c.id='aux-lines';this.frame.appendChild(c);return c;})();
    this.aux.width=this.frame.clientWidth; this.aux.height=this.frame.clientHeight; this.ctx=this.aux.getContext('2d');

    this.targets=[]; for(let i=0;i<3;i++) addTarget.call(this);
    document.getElementById('score').textContent='Score: 0';
    draw.call(this); this.prevShot=false;
  },

  update(){
    const gp=navigator.getGamepads()[0]; if(!gp) return;
    const sens=gp.buttons[4]?.pressed?this.sensAim:this.sensNormal;
    this.cx+=gp.axes[2]*sens; this.cy+=gp.axes[3]*sens;
    this.cx=Math.max(0,Math.min(this.cx,this.frame.clientWidth-this.circleSize));
    this.cy=Math.max(0,Math.min(this.cy,this.frame.clientHeight-this.circleSize));
    this.circle.style.left=`${this.cx}px`; this.circle.style.top=`${this.cy}px`;

    const hitAny=this.targets.some(t=>hitCheck.call(this,t));
    this.circle.classList.toggle('hit',hitAny);

    if(gp.buttons[5]?.pressed&&!this.prevShot){
      for(let i=0;i<this.targets.length;i++){
        if(hitCheck.call(this,this.targets[i])){ remove.call(this,i); addTarget.call(this); draw.call(this); addScore(1); break; }
      }
    }
    this.prevShot=gp.buttons[5]?.pressed;
  },

  cleanup(){
    this.targets.forEach(t=>{t.el.remove();t.hb.remove();});
    this.ctx.clearRect(0,0,this.aux.width,this.aux.height);
    this.circle.classList.add('hidden');
  }
});

/* -------- utilities -------- */
function addTarget(){
  const x=Math.random()*(this.frame.clientWidth-this.targetSize),
        y=Math.random()*(this.frame.clientHeight-this.targetSize);
  const el=document.createElement('div'); el.className='target';
  el.style.width=el.style.height=`${this.targetSize}px`; el.style.left=`${x}px`; el.style.top=`${y}px`;
  const hb=document.createElement('div'); hb.className='hitbox';
  hb.style.width=hb.style.height=`${this.hitDiameter}px`;
  hb.style.left=`${x+this.targetSize/2}px`; hb.style.top=`${y+this.targetSize/2}px`;
  this.frame.appendChild(hb); this.frame.appendChild(el);
  this.targets.push({el,hb,x,y});
}
function remove(i){ const t=this.targets[i]; t.el.remove(); t.hb.remove(); this.targets.splice(i,1);}
function hitCheck(t){ const cx=this.cx+this.circleSize/2,cy=this.cy+this.circleSize/2,tx=t.x+this.targetSize/2,ty=t.y+this.targetSize/2; return Math.hypot(cx-tx,cy-ty)<=this.hitRadius;}
function addScore(v){ const s=document.getElementById('score'); s.textContent='Score: '+(parseInt(s.textContent.split(': ')[1])+v);}
function draw(){ this.ctx.clearRect(0,0,this.aux.width,this.aux.height); const ax=this.cx+this.circleSize/2,ay=this.cy+this.circleSize/2; this.ctx.strokeStyle='rgba(255,255,255,0.2)'; this.ctx.lineWidth=1; this.ctx.beginPath(); this.targets.forEach(t=>{const tx=t.x+this.targetSize/2,ty=t.y+this.targetSize/2; this.ctx.moveTo(ax,ay); this.ctx.lineTo(tx,ty);}); this.ctx.stroke();}
