/* ======================================================================
   Trace The Line
   - Catmull-Rom スプラインをゴーストが走る
   - visualizeHitBox で赤円／赤点の表示を切替
   - L1 / L2 で感度切替 (buttonLayout 対応)
====================================================================== */
GameCore.init({

  /* ---------------------------- 開始 ---------------------------- */
  start() {
    this.hitScale = SETTINGS.hitBoxSize;

    /* DOM 取得 --------------------------------------------------- */
    this.circle = document.getElementById('circle');
    this.frame  = document.querySelector('.frame');
    this.canvas = document.getElementById('path-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this.circle.classList.remove('hidden');
    this.canvas.classList.remove('hidden');

    /* カーソルサイズ適用 ----------------------------------------- */
    this.circleSize = SETTINGS.cursorSize;
    this.circle.style.width =
    this.circle.style.height = `${this.circleSize}px`;

    /* 中心ドット (ヒットボックス可視時) -------------------------- */
    if (SETTINGS.visualizeHitBox && !this.circle.querySelector('.cursor-dot')) {
      const d = document.createElement('div');
      d.className = 'cursor-dot';
      this.circle.appendChild(d);
    }

    /* サイズ派生 -------------------------------------------------- */
    this.targetSize  = this.circleSize;
    this.hitDiameter = this.targetSize * this.hitScale;
    this.hitRadius   = this.hitDiameter / 2;

    /* カーソル初期位置 ------------------------------------------ */
    this.cx = this.frame.clientWidth  / 2 - this.circleSize / 2;
    this.cy = this.frame.clientHeight / 2 - this.circleSize / 2;
    this.circle.style.left = `${this.cx}px`;
    this.circle.style.top  = `${this.cy}px`;

    /* ゴースト DOM ---------------------------------------------- */
    this.ghost = document.createElement('div');
    this.ghost.className = 'target';
    this.ghost.style.width =
    this.ghost.style.height = `${this.targetSize}px`;
    this.frame.appendChild(this.ghost);

    this.ghostHB = null;
    if (SETTINGS.visualizeHitBox) {
      this.ghostHB = document.createElement('div');
      this.ghostHB.className = 'hitbox';
      this.ghostHB.style.width =
      this.ghostHB.style.height = `${this.hitDiameter}px`;
      this.frame.appendChild(this.ghostHB);
    }

    /* パス生成 ---------------------------------------------------- */
    this.anchors = 8;   // 制御点数
    this.step    = 0.02;
    buildCourse.call(this);

    document.getElementById('score').textContent = 'Score: 0';
  },

  /* ---------------------------- 毎フレーム ------------------------ */
  update() {
    const gp = navigator.getGamepads()[0];
    if (!gp || !this.path) return;

    /* 感度ボタン: L1 または L2 ---------------------------------- */
    const aimIdx = (SETTINGS.buttonLayout === 'R2L2') ? 6 : 4; // 6=L2, 4=L1
    const sens   = gp.buttons[aimIdx]?.pressed ? 10 : 20;

    /* カーソル移動 ---------------------------------------------- */
    this.cx += gp.axes[2] * sens;
    this.cy += gp.axes[3] * sens;
    this.cx = Math.max(0, Math.min(this.cx, this.frame.clientWidth  - this.circleSize));
    this.cy = Math.max(0, Math.min(this.cy, this.frame.clientHeight - this.circleSize));
    this.circle.style.left = `${this.cx}px`;
    this.circle.style.top  = `${this.cy}px`;

    /* ゴースト進行 & ヒット判定 ---------------------------------- */
    const hit = updateGhost.call(this);
    if (hit) addScore.call(this, 1);
    this.circle.classList.toggle('hit', hit);
  },

  /* ---------------------------- 終了 ---------------------------- */
  cleanup() {
    this.ghost.remove();
    if (this.ghostHB) this.ghostHB.remove();
    this.circle.classList.add('hidden');
    this.canvas.classList.add('hidden');
  }
});

/* ======================================================================
   Utility functions
====================================================================== */

/* ---- コース生成 ----------------------------------------------------- */
function buildCourse() {
  const w = this.frame.clientWidth;
  const h = this.frame.clientHeight;
  this.canvas.width  = w;
  this.canvas.height = h;

  /* 制御点をランダム生成 (枠 10% 内側) --------------------------- */
  const pts = [...Array(this.anchors)].map(() => ({
    x: w * 0.10 + Math.random() * w * 0.80,
    y: h * 0.10 + Math.random() * h * 0.80
  }));

  /* Catmull-Rom 補間でパス点列生成 ------------------------------ */
  const path = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;

    for (let t = 0; t < 1; t += this.step) {
      const t2 = t * t, t3 = t2 * t;
      path.push({
        x: 0.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
        y: 0.5*((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
      });
    }
  }

  /* 区間距離 & 総距離 ------------------------------------------- */
  const seg = []; let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const d = Math.hypot(path[i+1].x - path[i].x, path[i+1].y - path[i].y);
    seg.push(d); total += d;
  }

  Object.assign(this, { path, seg, total, gDist: 0, active: false });

  /* コース描画 -------------------------------------------------- */
  this.ctx.clearRect(0,0,w,h);
  this.ctx.lineWidth   = 6;
  this.ctx.strokeStyle = '#00ffff';
  this.ctx.lineCap     = 'round';
  this.ctx.beginPath();
  this.ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) this.ctx.lineTo(path[i].x, path[i].y);
  this.ctx.stroke();

  /* ゴースト初期位置 ------------------------------------------- */
  setGhostPos.call(this, path[0].x, path[0].y);
}

/* ---- ゴースト更新 ----------------------------------------------- */
function updateGhost() {
  const curX = this.cx + this.circleSize / 2;
  const curY = this.cy + this.circleSize / 2;

  /* 始点で重なったらスタート ----------------------------------- */
  if (!this.active && Math.hypot(curX - this.path[0].x, curY - this.path[0].y) <= this.hitRadius) {
    this.active = true;
  }

  /* 進行距離を増加 (2px/フレーム) ------------------------------ */
  if (this.active) {
    this.gDist += 2;
    if (this.gDist >= this.total) buildCourse.call(this);
  }

  /* gDist が属する線分を探索 ---------------------------------- */
  let acc = 0, i = 0;
  while (i < this.seg.length && acc + this.seg[i] < this.gDist) {
    acc += this.seg[i]; i++;
  }
  const A = this.path[i], B = this.path[i+1] || this.path[i];
  const t = (this.seg[i] ? (this.gDist - acc) / this.seg[i] : 0);

  /* 線形補間 ---------------------------------------------------- */
  const x = A.x + (B.x - A.x) * t;
  const y = A.y + (B.y - A.y) * t;
  setGhostPos.call(this, x, y);

  return Math.hypot(curX - x, curY - y) <= this.hitRadius;
}

/* ---- ゴースト DOM 位置反映 ------------------------------------ */
function setGhostPos(x, y) {
  this.ghost.style.left = `${x - this.targetSize / 2}px`;
  this.ghost.style.top  = `${y - this.targetSize / 2}px`;
  if (this.ghostHB) {
    this.ghostHB.style.left = `${x}px`;   // hitbox は中心座標
    this.ghostHB.style.top  = `${y}px`;
  }
}

/* ---- スコア加算 ------------------------------------------------ */
function addScore(v) {
  const s = document.getElementById('score');
  s.textContent = 'Score: ' + (parseInt(s.textContent.split(': ')[1]) + v);
}