/* ======================================================================
   Tracking Target
   - カーソルを重ね続けてスコア加算
   - 曲率・速度を birthRate 秒ごとにリロール
   - buttonLayout で L1 / L2 感度切替
====================================================================== */
GameCore.init({

  /* ---------------------------- 開始 ---------------------------- */
  start() {
    this.sensNormal = SETTINGS.sensNormal;
    this.sensAim    = SETTINGS.sensAim;
    this.hitScale   = SETTINGS.hitBoxSize;
    this.birthMs    = SETTINGS.birthRate * 1000;

    /* DOM -------------------------------------------------------- */
    this.circle = document.getElementById('circle');
    this.frame  = document.querySelector('.frame');
    this.circle.classList.remove('hidden');

    this.circleSize = SETTINGS.cursorSize;
    this.circle.style.width =
    this.circle.style.height = `${this.circleSize}px`;

    if (SETTINGS.visualizeHitBox && !this.circle.querySelector('.cursor-dot')) {
      const dot = document.createElement('div');
      dot.className = 'cursor-dot';
      this.circle.appendChild(dot);
    }

    this.targetSize  = this.circleSize;
    this.hitDiameter = this.targetSize * this.hitScale;
    this.hitRadius   = this.hitDiameter / 2;

    this.cx = this.frame.clientWidth  / 2 - this.circleSize / 2;
    this.cy = this.frame.clientHeight / 2 - this.circleSize / 2;
    this.circle.style.left = `${this.cx}px`;
    this.circle.style.top  = `${this.cy}px`;

    /* ターゲット生成 -------------------------------------------- */
    this.speedRatio = 0.2;
    this.target     = createTarget.call(this);   // 初回位置ランダム
    this.spawnTimer = performance.now();

    document.getElementById('score').textContent = 'Score: 0';
  },

  /* ---------------------------- 毎フレーム ------------------------ */
  update() {
    const gp = navigator.getGamepads()[0]; if (!gp) return;

    /* 感度ボタン -------------------------------------------------- */
    const aimIdx = (SETTINGS.buttonLayout === 'R2L2') ? 6 : 4; // 6=L2,4=L1
    const sens   = gp.buttons[aimIdx]?.pressed ? this.sensAim : this.sensNormal;

    /* カーソル移動 ---------------------------------------------- */
    this.cx += gp.axes[2] * sens;
    this.cy += gp.axes[3] * sens;
    this.cx = Math.max(0, Math.min(this.cx, this.frame.clientWidth  - this.circleSize));
    this.cy = Math.max(0, Math.min(this.cy, this.frame.clientHeight - this.circleSize));
    this.circle.style.left = `${this.cx}px`;
    this.circle.style.top  = `${this.cy}px`;

    /* リロール判定 (速度・曲率) ---------------------------------- */
    const now = performance.now();
    if (now - this.spawnTimer >= this.birthMs) {
      const { x, y } = this.target;          // 現在位置を保持
      this.target.el.remove();
      if (this.target.hb) this.target.hb.remove();
      this.target = createTarget.call(this, x, y); // 位置固定でリロール
      this.spawnTimer = now;
    }

    /* ターゲット移動・曲率更新 ---------------------------------- */
    const t = this.target;
    t.x += t.vx; t.y += t.vy;
    if (t.x <= 0 || t.x >= this.frame.clientWidth  - this.targetSize) t.vx *= -1;
    if (t.y <= 0 || t.y >= this.frame.clientHeight - this.targetSize) t.vy *= -1;

    const ang = Math.atan2(t.vy, t.vx) + t.omega;
    t.vx = Math.cos(ang) * t.speed;
    t.vy = Math.sin(ang) * t.speed;

    /* DOM 反映 ---------------------------------------------------- */
    t.el.style.left = `${t.x}px`;
    t.el.style.top  = `${t.y}px`;
    if (t.hb) {
      t.hb.style.left = `${t.x + this.targetSize / 2}px`;
      t.hb.style.top  = `${t.y + this.targetSize / 2}px`;
    }

    /* ヒット判定 -------------------------------------------------- */
    const hit = hitCheck.call(this, t);
    if (hit) addScore(1);
    this.circle.classList.toggle('hit', hit);
  },

  /* ---------------------------- 終了 ---------------------------- */
  cleanup() {
    this.target.el.remove();
    if (this.target.hb) this.target.hb.remove();
    this.circle.classList.add('hidden');
  }
});

/* ======================================================================
   Utility
====================================================================== */

/* ターゲット生成 ------------------------------------------------------- */
function createTarget(optX, optY) {
  const max = this.sensNormal * this.speedRatio;
  const vx  = (Math.random() * 2 - 1) * max;
  const vy  = (Math.random() * 2 - 1) * max;

  const x   = (optX !== undefined)
            ? optX
            : Math.random() * (this.frame.clientWidth  - this.targetSize);
  const y   = (optY !== undefined)
            ? optY
            : Math.random() * (this.frame.clientHeight - this.targetSize);

  /* 曲率を設定ファイルの範囲で乱数 ------------------------------ */
  const range = SETTINGS.maxCurveRatio - SETTINGS.minCurveRatio;
  const curve = SETTINGS.minCurveRatio + Math.random() * range;
  const omega = curve * 0.05;
  const speed = Math.hypot(vx, vy);

  /* DOM: 本体 ---------------------------------------------------- */
  const el = document.createElement('div');
  el.className     = 'target';
  el.style.width   =
  el.style.height  = `${this.targetSize}px`;
  el.style.left    = `${x}px`;
  el.style.top     = `${y}px`;

  /* DOM: ヒットボックス (可視) ---------------------------------- */
  let hb = null;
  if (SETTINGS.visualizeHitBox) {
    hb = document.createElement('div');
    hb.className     = 'hitbox';
    hb.style.width   =
    hb.style.height  = `${this.hitDiameter}px`;
    hb.style.left    = `${x + this.targetSize / 2}px`;
    hb.style.top     = `${y + this.targetSize / 2}px`;
    this.frame.appendChild(hb);
  }

  this.frame.appendChild(el);
  return { el, hb, x, y, vx, vy, omega, speed };
}

/* ヒット判定 ----------------------------------------------------------- */
function hitCheck(t) {
  const cx = this.cx + this.circleSize / 2;
  const cy = this.cy + this.circleSize / 2;
  const tx = t.x  + this.targetSize  / 2;
  const ty = t.y  + this.targetSize  / 2;
  return Math.hypot(cx - tx, cy - ty) <= this.hitRadius;
}

/* スコア加算 ----------------------------------------------------------- */
function addScore(v) {
  const s = document.getElementById('score');
  s.textContent = 'Score: ' +
    (parseInt(s.textContent.split(': ')[1]) + v);
}