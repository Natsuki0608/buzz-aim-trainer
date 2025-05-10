/* ======================================================================
   Trace The Line – buildCourse 復活・中心合わせ修正・SETTINGS 対応
====================================================================== */
GameCore.init({

  start(){
    this.hitScale = SETTINGS.hitBoxSize;

    /* DOM */
    this.circle=document.getElementById('circle');
    this.frame =document.querySelector('.frame');
    this.canvas=document.getElementById('path-canvas');
    this.ctx   =this.canvas.getContext('2d');
    this.circle.classList.remove('hidden'); this.canvas.classList.remove('hidden');

    if(!this.circle.querySelector('.cursor-dot')){
      const d=document.createElement('div'); d.className='cursor-dot'; this.circle.appendChild(d);
    }

    this.circleSize = parseFloat(getComputedStyle(this.circle).width);
    this.targetSize = this.circleSize;
    this.hitDiameter= this.targetSize*this.hitScale;
    this.hitRadius  = this.hitDiameter/2;

    this.cx=this.frame.clientWidth/2 - this.circleSize/2;
    this.cy=this.frame.clientHeight/2- this.circleSize/2;
    this.circle.style.left=`${this.cx}px`; this.circle.style.top=`${this.cy}px`;

    this.ghost=document.createElement('div'); this.ghost.className='target'; this.frame.appendChild(this.ghost);
    this.ghostHB=document.createElement('div'); this.ghostHB.className='hitbox';
    this.ghostHB.style.width=this.ghostHB.style.height=`${this.hitDiameter}px`; this.frame.appendChild(this.ghostHB);

    this.anchors=8; this.step=0.02;
    buildCourse.call(this);
    document.getElementById('score').textContent='Score: 0';
  },

  update(){
    const gp=navigator.getGamepads()[0]; if(!gp||!this.path) return;
    const sens=gp.buttons[4]?.pressed?10:20;
    this.cx+=gp.axes[2]*sens; this.cy+=gp.axes[3]*sens;
    this.cx=Math.max(0,Math.min(this.cx,this.frame.clientWidth - this.circleSize));
    this.cy=Math.max(0,Math.min(this.cy,this.frame.clientHeight- this.circleSize));
    this.circle.style.left=`${this.cx}px`; this.circle.style.top=`${this.cy}px`;

    const hit=updateGhost.call(this);
    if(hit) addScore(1);
    this.circle.classList.toggle('hit',hit);
  },

  cleanup(){ this.ghost.remove(); this.ghostHB.remove(); this.circle.classList.add('hidden'); this.canvas.classList.add('hidden'); }
});

/* ---------------- パス生成 ---------------- */
function buildCourse(){
  const w=this.frame.clientWidth, h=this.frame.clientHeight;
  this.canvas.width=w; this.canvas.height=h;

  /* 制御点 */
  const pts=[...Array(this.anchors)].map(()=>({
    x:w*0.1+Math.random()*w*0.8,
    y:h*0.1+Math.random()*h*0.8
  }));

  /* Catmull-Rom */
  const path=[];
  for(let i=0;i<pts.length-1;i++){
    const p0=pts[i-1]||pts[i], p1=pts[i], p2=pts[i+1], p3=pts[i+2]||p2;
    for(let t=0;t<1;t+=this.step){
      const t2=t*t, t3=t2*t;
      path.push({
        x:0.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
        y:0.5*((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
      });
    }
  }
  /* 距離配列 */
  const seg=[]; let total=0;
  for(let i=0;i<path.length-1;i++){ const d=Math.hypot(path[i+1].x-path[i].x, path[i+1].y-path[i].y); seg.push(d); total+=d;}
  Object.assign(this,{ path, seg, total, gDist:0, active:false });

  /* 描画 */
  this.ctx.clearRect(0,0,w,h);
  this.ctx.lineWidth=6; this.ctx.strokeStyle='#00ffff'; this.ctx.lineCap='round';
  this.ctx.beginPath(); this.ctx.moveTo(path[0].x, path[0].y);
  for(let i=1;i<path.length;i++) this.ctx.lineTo(path[i].x, path[i].y); this.ctx.stroke();

  setGhostPos.call(this,path[0].x,path[0].y);
}

/* ---------------- ゴースト更新 ---------------- */
function updateGhost(){
  /* 始点でカーソル重なり→スタート */
  const curX=this.cx+this.circleSize/2, curY=this.cy+this.circleSize/2;
  if(!this.active && Math.hypot(curX-this.path[0].x, curY-this.path[0].y)<=this.hitRadius) this.active=true;

  if(this.active){
    this.gDist+=2;
    if(this.gDist>=this.total) buildCourse.call(this);
  }

  /* 線分探索 */
  let acc=0,i=0;
  while(i<this.seg.length && acc+this.seg[i]<this.gDist){ acc+=this.seg[i]; i++; }
  const pA=this.path[i], pB=this.path[i+1]||this.path[i];
  const t=(this.gDist-acc)/this.seg[i]||0;
  const gX=pA.x+(pB.x-pA.x)*t, gY=pA.y+(pB.y-pA.y)*t;
  setGhostPos.call(this,gX,gY);

  return Math.hypot(curX-gX, curY-gY)<=this.hitRadius;
}

function setGhostPos(x,y){
  this.ghost.style.left=`${x-this.targetSize/2}px`; this.ghost.style.top=`${y-this.targetSize/2}px`;
  this.ghostHB.style.left=`${x}px`; this.ghostHB.style.top=`${y}px`;   // 中心 (translate-50% 済)
}

/* ---------------- スコア ---------------- */
function addScore(v){ const s=document.getElementById('score');
  s.textContent='Score: '+(parseInt(s.textContent.split(': ')[1])+v); }
