/* ======================================================================
   Tracking Target
   - カーソルを重ね続けて 1 フレーム 1 スコア
   - birthRate 秒ごとに速度 & 曲率をリロール（位置は保持）
   - 曲率は SETTINGS.minCurveRatio ～ maxCurveRatio の範囲
   - visualizeHitBox / vibration オプション対応
====================================================================== */
GameCore.init({

  start() {
    /* 共通設定 */
    this.sensNormal = SETTINGS.sensNormal;
    this.sensAim    = SETTINGS.sensAim;
    this.hitScale   = SETTINGS.hitBoxSize;
    this.birthMs    = SETTINGS.birthRate * 1000;     // ★ ms 単位

    /* DOM */
    this.circle = document.getElementById('circle');
    this.frame  = document.querySelector('.frame');
    this.circle.classList.remove('hidden');

    /* カーソルサイズ */
    this.circleSize = SETTINGS.cursorSize;
    this.circle.style.width =
    this.circle.style.height = `${this.circleSize}px`;

    if (SETTINGS.visualizeHitBox && !this.circle.querySelector('.cursor-dot')) {
      const dot = document.createElement('div'); dot.className = 'cursor-dot';
      this.circle.appendChild(dot);
    }

    /* 派生サイズ */
    this.targetSize  = this.circleSize;
    this.hitDiameter = this.targetSize * this.hitScale;
    this.hitRadius   = this.hitDiameter / 2;

    /* カーソル初期位置 */
    this.cx = this.frame.clientWidth  / 2 - this.circleSize / 2;
    this.cy = this.frame.clientHeight / 2 - this.circleSize / 2;
    this.circle.style.left = `${this.cx}px`;
    this.circle.style.top  = `${this.cy}px`;

    /* ターゲット生成 */
    this.speedRatio = 0.2;
    this.target     = createTarget.call(this);   // 初回は位置ランダム
    this.spawnTimer = performance.now();

    document.getElementById('score').textContent = 'Score: 0';
  },

  update() {
    const gp = navigator.getGamepads()[0];
    if (!gp) return;

    /* カーソル移動 */
    const sens = gp.buttons[4]?.pressed ? this.sensAim : this.sensNormal;
    this.cx += gp.axes[2] * sens;
    this.cy += gp.axes[3] * sens;
    this.cx = Math.max(0, Math.min(this.cx, this.frame.clientWidth  - this.circleSize));
    this.cy = Math.max(0, Math.min(this.cy, this.frame.clientHeight - this.circleSize));
    this.circle.style.left = `${this.cx}px`;
    this.circle.style.top  = `${this.cy}px`;

    /* リロール判定 */
    const now = performance.now();
    if (now - this.spawnTimer >= this.birthMs) {
      const { x, y } = this.target;                     // 現在位置保持
      this.target.el.remove();
      if (this.target.hb) this.target.hb.remove();
      this.target = createTarget.call(this, x, y);      // 位置固定
      this.spawnTimer = now;
    }

    /* ターゲット移動 */
    const t = this.target;
    t.x += t.vx; t.y += t.vy;

    /* 枠反射 */
    if (t.x <= 0 || t.x >= this.frame.clientWidth  - this.targetSize) t.vx *= -1;
    if (t.y <= 0 || t.y >= this.frame.clientHeight - this.targetSize) t.vy *= -1;

    /* カーブ更新 */
    const ang = Math.atan2(t.vy, t.vx) + t.omega;
    t.vx = Math.cos(ang) * t.speed;
    t.vy = Math.sin(ang) * t.speed;

    /* DOM 反映 */
    t.el.style.left = `${t.x}px`; t.el.style.top = `${t.y}px`;
    if (t.hb) {
      t.hb.style.left = `${t.x + this.targetSize / 2}px`;
      t.hb.style.top  = `${t.y + this.targetSize / 2}px`;
    }

    /* ヒット判定 */
    const hit = hitCheck.call(this, t);
    if (hit) addScore(1);
    this.circle.classList.toggle('hit', hit);
  },

  cleanup() {
    this.target.el.remove();
    if (this.target.hb) this.target.hb.remove();
    this.circle.classList.add('hidden');
  }
});

/* ======================================================================
   Utility
====================================================================== */

/* ターゲット生成
   optX / optY が与えられた場合は位置固定、なければランダム */
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

  /* 曲率を設定ファイルの範囲で乱数 */
  const range = SETTINGS.maxCurveRatio - SETTINGS.minCurveRatio;
  const curve = SETTINGS.minCurveRatio + Math.random() * range;
  const omega = curve * 0.05;
  const speed = Math.hypot(vx, vy);

  /* DOM: 本体 */
  const el = document.createElement('div');
  el.className     = 'target';
  el.style.width   =
  el.style.height  = `${this.targetSize}px`;
  el.style.left    = `${x}px`;
  el.style.top     = `${y}px`;

  /* DOM: ヒットボックス (可視オプション) */
  let hb = null;
  if (SETTINGS.visualizeHitBox) {
    hb = document.createElement('div');
    hb.className      = 'hitbox';
    hb.style.width    =
    hb.style.height   = `${this.hitDiameter}px`;
    hb.style.left     = `${x + this.targetSize / 2}px`;
    hb.style.top      = `${y + this.targetSize / 2}px`;
    this.frame.appendChild(hb);
  }

  this.frame.appendChild(el);
  return { el, hb, x, y, vx, vy, omega, speed };
}

function hitCheck(t) {
  const cx = this.cx + this.circleSize / 2;
  const cy = this.cy + this.circleSize / 2;
  const tx = t.x  + this.targetSize  / 2;
  const ty = t.y  + this.targetSize  / 2;
  return Math.hypot(cx - tx, cy - ty) <= this.hitRadius;
}

function addScore(v) {
  const s = document.getElementById('score');
  s.textContent = 'Score: ' +
    (parseInt(s.textContent.split(': ')[1]) + v);
}
