/* -------------------------------------------------
   Practice モード
   ・時間無制限で自由に練習
   ・△ボタンでターゲット静止／移動を切替
   ・OPTIONS ボタンでホームへ戻る
   ------------------------------------------------- */
   (() => {
    /* ===== DOM 取得 ===== */
    const circle         = document.getElementById('circle');
    const frame          = document.querySelector('.frame');
    const scoreDisplay   = document.getElementById('score');
    const timeDisplay    = document.getElementById('time');   // 本モードでは使わない
    const startMessage   = document.getElementById('start-message');
    const countdownDisp  = document.getElementById('countdown');
  
    /* ===== 初期 UI 調整 ===== */
    timeDisplay.classList.add('hidden');             // タイマー非表示
    scoreDisplay.textContent = 'Score: 0';
  
    /* ===== 定数 ===== */
    const sensNormal       = 20;
    const sensAim          = 10;
    const targetSpeedRatio = 0.2;
    const circleSize       = 50;
    const targetSize       = circleSize * 1.1;
    const hitboxRatio      = 0.5;                    // ★当たり判定半径
    const targetCount      = 3;
  
    /* ===== 状態変数 ===== */
    let frameW, frameH;
    let x = 0, y = 0;
    let score = 0;
    let targets = [];
    let gameStarted = false;
    let isMoving = false;                            // △で切替
    /* 入力エッジ検出用 */
    let prevR1 = false, prevTri = false, prevOpt = false;
  
    /* -------------------------------------------------
       ★ 追加：最初からパッドが挿さっていると
               gamepadconnected イベントが発生しない
               場合があるため自前チェックを追加
       ------------------------------------------------- */
    function gamepadPresent() {
      return Array.from(navigator.getGamepads?.() || []).some(Boolean);
    }
  
    /* ===== ユーティリティ ===== */
    function updateSizes() {
      circle.style.width  = `${circleSize}px`;
      circle.style.height = `${circleSize}px`;
      frameW = frame.clientWidth;
      frameH = frame.clientHeight;
      x = Math.min(Math.max(x, 0), frameW - circleSize);
      y = Math.min(Math.max(y, 0), frameH - circleSize);
      setPos(x, y);
    }
    function setPos(px, py) { circle.style.left = `${px}px`; circle.style.top = `${py}px`; }
  
    function createTarget() {
      const tx = Math.random() * (frameW - targetSize);
      const ty = Math.random() * (frameH - targetSize);
      let vx = 0, vy = 0;
      if (isMoving) {
        const max = sensNormal * targetSpeedRatio;
        vx = (Math.random() * 2 - 1) * max;
        vy = (Math.random() * 2 - 1) * max;
      }
      const el = document.createElement('div');
      el.classList.add('target');
      el.style.width = `${targetSize}px`;
      el.style.height = `${targetSize}px`;
      el.style.left = `${tx}px`;
      el.style.top  = `${ty}px`;
      el.style.zIndex = '11';
      frame.appendChild(el);
      return { el, x: tx, y: ty, vx, vy };
    }
    function spawnTargets(n) { targets.forEach(t => t.el.remove()); targets = Array.from({length:n}, createTarget); }
    function refreshVelocity() {
      const max = sensNormal * targetSpeedRatio;
      for (const t of targets) {
        if (isMoving) {
          t.vx = (Math.random() * 2 - 1) * max;
          t.vy = (Math.random() * 2 - 1) * max;
        } else {
          t.vx = t.vy = 0;
        }
      }
    }
  
    function hit(t) {
      const cx = x + circleSize / 2, cy = y + circleSize / 2;
      const tx = t.x + targetSize / 2, ty = t.y + targetSize / 2;
      return Math.hypot(cx - tx, cy - ty) < circleSize * hitboxRatio;
    }
  
    /* ===== メインループ ===== */
    function loop() {
      const [gp] = navigator.getGamepads();
  
      if (gp && gameStarted) {
        /* 照準移動 */
        const sens = gp.buttons[4].pressed ? sensAim : sensNormal;  // L1 = AIM
        x = Math.min(Math.max(x + gp.axes[2] * sens, 0), frameW - circleSize);
        y = Math.min(Math.max(y + gp.axes[3] * sens, 0), frameH - circleSize);
        setPos(x, y);
  
        /* ターゲット移動 */
        if (isMoving) {
          for (const t of targets) {
            t.x += t.vx; t.y += t.vy;
            if (t.x <= 0 || t.x >= frameW - targetSize) { t.vx *= -1; t.x = Math.min(Math.max(t.x,0), frameW - targetSize); }
            if (t.y <= 0 || t.y >= frameH - targetSize) { t.vy *= -1; t.y = Math.min(Math.max(t.y,0), frameH - targetSize); }
            t.el.style.left = `${t.x}px`; t.el.style.top = `${t.y}px`;
          }
        }
  
        /* R1 シュート */
        const r1 = gp.buttons[5].pressed;
        if (r1 && !prevR1) {
          for (let i=0;i<targets.length;i++){
            if (hit(targets[i])){
              targets[i].el.remove();
              targets[i] = createTarget();
              scoreDisplay.textContent = `Score: ${++score}`;
              gp.vibrationActuator?.playEffect('dual-rumble',{duration:100,strongMagnitude:1,weakMagnitude:1});
              break;
            }
          }
        }
        prevR1 = r1;
  
        /* △ ：静止⇔移動 */
        const tri = gp.buttons[3].pressed;
        if (tri && !prevTri) { isMoving = !isMoving; refreshVelocity(); }
        prevTri = tri;
  
        /* OPTIONS：ホームへ */
        const opt = gp.buttons[9]?.pressed;
        if (opt && !prevOpt) window.location.href = 'index.html';
        prevOpt = opt;
  
        /* ヒットリング */
        circle.classList.toggle('hit', targets.some(hit));
      }
      requestAnimationFrame(loop);
    }
  
    /* ===== 起動シーケンス ===== */
    function initialize() {
      updateSizes();
      x = (frameW - circleSize) / 2;
      y = (frameH - circleSize) / 2;
      setPos(x, y);
    }
  
    function startGame() {
      gameStarted = true;
      circle.classList.remove('hidden');
      score = 0; scoreDisplay.textContent = 'Score: 0';
      initialize(); spawnTargets(targetCount);
    }
  
    function startCountdown() {
      let cnt = 3;
      countdownDisp.textContent = cnt;
      const id = setInterval(()=>{
        if (--cnt > 0) { countdownDisp.textContent = cnt; }
        else { clearInterval(id); countdownDisp.textContent=''; startGame(); }
      },1000);
    }
  
    function waitForAnyButton() {
      const id = setInterval(()=>{
        const [gp] = navigator.getGamepads();
        if (gp && gp.buttons.some(b=>b.pressed)) {
          clearInterval(id);
          startMessage.style.display='none';
          startCountdown();
        }
      },100);
    }
  
    /* ===== イベント登録 ===== */
    window.addEventListener('gamepadconnected', () => {
      /* 接続イベントが来た場合も同じ処理 */
      startMessage.style.display='block';
      scoreDisplay.classList.remove('hidden');
      waitForAnyButton();
    });
    window.addEventListener('resize', updateSizes);
  
    /* -------------------------------------------------
       ★ 追加：ページ読み込み直後にすでにパッドがあるか確認し、
               あれば即 waitForAnyButton() を呼び出す
       ------------------------------------------------- */
    if (gamepadPresent()) {
      startMessage.style.display='block';
      scoreDisplay.classList.remove('hidden');
      waitForAnyButton();
    }
  
    /* ===== 初期化 ===== */
    initialize();
    requestAnimationFrame(loop);
  })();
  