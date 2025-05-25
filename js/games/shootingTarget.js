/* ======================================================================
   Shoot Target
   - 静止ターゲットを撃つ
   - buttonLayout で R1L1 ⇔ R2L2 切替
====================================================================== */
GameCore.init({

  /* ---------------------------- 開始 ---------------------------- */
  start() {
    this.sensNormal = SETTINGS.sensNormal;
    this.sensAim    = SETTINGS.sensAim;
    this.hitScale   = SETTINGS.hitBoxSize;
    this.maxTargets = SETTINGS.numTarget;

    /* DOM -------------------------------------------------------- */
    this.circle = document.getElementById('circle');
    this.frame  = document.querySelector('.frame');
    this.circle.classList.remove('hidden');

    this.circleSize = SETTINGS.cursorSize;
    this.circle.style.width =
    this.circle.style.height = `${this.circleSize}px`;

    if (SETTINGS.visualizeHitBox && !this.circle.querySelector('.cursor-dot')) {
      const d = document.createElement('div');
      d.className = 'cursor-dot';
      this.circle.appendChild(d);
    }

    this.targetSize  = this.circleSize;
    this.hitDiameter = this.targetSize * this.hitScale;
    this.hitRadius   = this.hitDiameter / 2;

    this.cx = this.frame.clientWidth  / 2 - this.circleSize / 2;
    this.cy = this.frame.clientHeight / 2 - this.circleSize / 2;
    this.circle.style.left = `${this.cx}px`;
    this.circle.style.top  = `${this.cy}px`;

    /* 補助線 Canvas ---------------------------------------------- */
    if (SETTINGS.supportLine) {
      this.aux = document.getElementById('aux-lines') || (() => {
        const c = document.createElement('canvas');
        c.id = 'aux-lines';
        this.frame.appendChild(c);
        return c;
      })();
      this.aux.width  = this.frame.clientWidth;
      this.aux.height = this.frame.clientHeight;
      this.ctx = this.aux.getContext('2d');
    } else {
      this.ctx = null;
    }

    /* ターゲット生成 -------------------------------------------- */
    this.targets = [];
    while (this.targets.length < this.maxTargets) addTarget.call(this);

    document.getElementById('score').textContent = 'Score: 0';
    drawLines.call(this);
    this.prevShot = false;
  },

  /* ---------------------------- 毎フレーム ------------------------ */
  update() {
    const gp = navigator.getGamepads()[0]; if (!gp) return;

    /* レイアウト依存ボタン -------------------------------------- */
    const aimIdx   = (SETTINGS.buttonLayout === 'R2L2') ? 6 : 4; // L2 or L1
    const shootIdx = (SETTINGS.buttonLayout === 'R2L2') ? 7 : 5; // R2 or R1

    /* カーソル移動 ---------------------------------------------- */
    const sens = gp.buttons[aimIdx]?.pressed ? this.sensAim : this.sensNormal;
    this.cx += gp.axes[2] * sens;
    this.cy += gp.axes[3] * sens;
    this.cx = Math.max(0, Math.min(this.cx, this.frame.clientWidth  - this.circleSize));
    this.cy = Math.max(0, Math.min(this.cy, this.frame.clientHeight - this.circleSize));
    this.circle.style.left = `${this.cx}px`;
    this.circle.style.top  = `${this.cy}px`;

    /* ヒット演出 -------------------------------------------------- */
    const hitAny = this.targets.some(t => hitCheck.call(this, t));
    this.circle.classList.toggle('hit', hitAny);

    /* 発砲処理 ---------------------------------------------------- */
    if (gp.buttons[shootIdx]?.pressed && !this.prevShot) {
      for (let i = 0; i < this.targets.length; i++) {
        if (hitCheck.call(this, this.targets[i])) {

          if (SETTINGS.vibration && gp.vibrationActuator) {
            gp.vibrationActuator.playEffect('dual-rumble', {
              duration: 100,
              strongMagnitude: 1.0,
              weakMagnitude:   1.0
            });
          }

          removeTarget.call(this, i);
          while (this.targets.length < this.maxTargets) addTarget.call(this);
          drawLines.call(this);
          addScore(1);
          break;
        }
      }
    }
    this.prevShot = gp.buttons[shootIdx]?.pressed;
  },

  /* ---------------------------- 終了 ---------------------------- */
  cleanup() {
    this.targets.forEach(t => { t.el.remove(); if (t.hb) t.hb.remove(); });
    if (this.ctx) this.ctx.clearRect(0, 0, this.aux.width, this.aux.height);
    this.circle.classList.add('hidden');
  }
});

/* ======================================================================
   Utility
====================================================================== */

/* ターゲット追加 ------------------------------------------------------- */
function addTarget() {
  const x = Math.random() * (this.frame.clientWidth  - this.targetSize);
  const y = Math.random() * (this.frame.clientHeight - this.targetSize);

  const el = document.createElement('div');
  el.className     = 'target';
  el.style.width   =
  el.style.height  = `${this.targetSize}px`;
  el.style.left    = `${x}px`;
  el.style.top     = `${y}px`;

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
  this.targets.push({ el, hb, x, y });
}

/* ターゲット削除 ------------------------------------------------------- */
function removeTarget(i) {
  const t = this.targets[i];
  t.el.remove();
  if (t.hb) t.hb.remove();
  this.targets.splice(i, 1);
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
  s.textContent = 'Score: ' + (parseInt(s.textContent.split(': ')[1]) + v);
}

/* 補助線描画 ----------------------------------------------------------- */
function drawLines() {
  if (!this.ctx || !SETTINGS.supportLine) return;
  this.ctx.clearRect(0, 0, this.aux.width, this.aux.height);
  const ax = this.cx + this.circleSize / 2;
  const ay = this.cy + this.circleSize / 2;
  this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  this.ctx.lineWidth   = 1;
  this.ctx.beginPath();
  this.targets.forEach(t => {
    const tx = t.x + this.targetSize / 2;
    const ty = t.y + this.targetSize / 2;
    this.ctx.moveTo(ax, ay);
    this.ctx.lineTo(tx, ty);
  });
  this.ctx.stroke();
}
