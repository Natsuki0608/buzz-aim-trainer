/* ======================================================================
   Shoot Moving Target
   - 動く的 3 個を撃ってスコア
   - SETTINGS.cursorSize でカーソル & 的サイズを統一
====================================================================== */
GameCore.init({

  /* ---------------------------- 開始 ---------------------------- */
  start() {
    /* 共通設定 */
    this.sensNormal = SETTINGS.sensNormal;
    this.sensAim    = SETTINGS.sensAim;
    this.hitScale   = SETTINGS.hitBoxSize;

    /* DOM */
    this.circle = document.getElementById('circle');
    this.frame  = document.querySelector('.frame');
    this.circle.classList.remove('hidden');

    /* カーソル直径を settings から反映 */
    this.circleSize = SETTINGS.cursorSize;
    this.circle.style.width =
    this.circle.style.height = `${this.circleSize}px`;

    /* 中心赤点を一度だけ追加 */
    if (!this.circle.querySelector('.cursor-dot')) {
      const d = document.createElement('div');
      d.className = 'cursor-dot';
      this.circle.appendChild(d);
    }

    /* サイズ派生値 */
    this.targetSize  = this.circleSize;
    this.hitDiameter = this.targetSize * this.hitScale;
    this.hitRadius   = this.hitDiameter / 2;

    /* カーソル初期位置 */
    this.cx = this.frame.clientWidth  / 2 - this.circleSize / 2;
    this.cy = this.frame.clientHeight / 2 - this.circleSize / 2;
    this.circle.style.left = `${this.cx}px`;
    this.circle.style.top  = `${this.cy}px`;

    /* ターゲット生成 */
    this.targets           = [];
    this.targetSpeedRatio  = 0.2;
    for (let i = 0; i < 3; i++) createTarget.call(this);

    /* スコア初期化 */
    document.getElementById('score').textContent = 'Score: 0';

    this.prevShot = false;
  },

  /* ---------------------------- 毎フレーム ---------------------------- */
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

    /* ターゲット移動 */
    this.targets.forEach(t => {
      t.x += t.vx; t.y += t.vy;

      /* 枠反射 */
      if (t.x <= 0 || t.x >= this.frame.clientWidth  - this.targetSize) t.vx *= -1;
      if (t.y <= 0 || t.y >= this.frame.clientHeight - this.targetSize) t.vy *= -1;

      t.el.style.left = `${t.x}px`;
      t.el.style.top  = `${t.y}px`;
      t.hb.style.left = `${t.x + this.targetSize / 2}px`;
      t.hb.style.top  = `${t.y + this.targetSize / 2}px`;
    });

    /* ヒット演出 */
    const hitAny = this.targets.some(t => hitCheck.call(this, t));
    this.circle.classList.toggle('hit', hitAny);

    /* 発砲 */
    if (gp.buttons[5]?.pressed && !this.prevShot) {
      for (let i = 0; i < this.targets.length; i++) {
        if (hitCheck.call(this, this.targets[i])) {
          removeTarget.call(this, i);
          createTarget.call(this);
          addScore(1);
          break;
        }
      }
    }
    this.prevShot = gp.buttons[5]?.pressed;
  },

  /* ---------------------------- 終了 ---------------------------- */
  cleanup() {
    this.targets.forEach(t => { t.el.remove(); t.hb.remove(); });
    this.circle.classList.add('hidden');
  }
});

/* ===================== Utility ===================== */
function createTarget() {
  const max = this.sensNormal * this.targetSpeedRatio;
  const vx  = (Math.random() * 2 - 1) * max;
  const vy  = (Math.random() * 2 - 1) * max;
  const x   = Math.random() * (this.frame.clientWidth  - this.targetSize);
  const y   = Math.random() * (this.frame.clientHeight - this.targetSize);

  /* 本体 */
  const el = document.createElement('div');
  el.className     = 'target';
  el.style.width   = el.style.height = `${this.targetSize}px`;
  el.style.left    = `${x}px`;
  el.style.top     = `${y}px`;

  /* ヒットボックス */
  const hb = document.createElement('div');
  hb.className      = 'hitbox';
  hb.style.width    = hb.style.height = `${this.hitDiameter}px`;
  hb.style.left     = `${x + this.targetSize / 2}px`;
  hb.style.top      = `${y + this.targetSize / 2}px`;

  this.frame.appendChild(hb);
  this.frame.appendChild(el);
  this.targets.push({ el, hb, x, y, vx, vy });
}

function removeTarget(i) {
  const t = this.targets[i];
  t.el.remove(); t.hb.remove();
  this.targets.splice(i, 1);
}

function hitCheck(t) {
  const cx = this.cx + this.circleSize / 2;
  const cy = this.cy + this.circleSize / 2;
  const tx = t.x  + this.targetSize  / 2;
  const ty = t.y  + this.targetSize  / 2;
  return Math.hypot(cx - tx, cy - ty) <= this.hitRadius;
}

function addScore(val) {
  const s = document.getElementById('score');
  s.textContent = 'Score: ' + (parseInt(s.textContent.split(': ')[1]) + val);
}
