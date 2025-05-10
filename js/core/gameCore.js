/* ======================================================================
   GAME CORE – 全モード共通ステートマシン
====================================================================== */
const GameCore = (() => {

  const core = {
    phase      : 'wait-pad',
    countdown  : 3,
    selected   : 0,
    game       : { start(){}, update(){}, cleanup(){} },
    prevAny    : false,   // 前フレームの AnyButton 状態
    buttonsUp  : false,   // Pad 選択後、ボタンを放したか
  };

  /* DOM 取得 */
  const $score   = document.getElementById('score');
  const $time    = document.getElementById('time');
  const $start   = document.getElementById('start-message');
  const $count   = document.getElementById('countdown');
  const $result  = document.getElementById('game-over-message');
  const $final   = document.getElementById('final-score');
  const $btnRetry= document.getElementById('btn-retry');
  const $btnHome = document.getElementById('btn-home');

  /* ---------------- フェーズ制御 ---------------- */
  function setPhase(p){
    core.phase = p;

    switch(p){
      case 'wait-press':
        $start.style.display='block';
        $time.textContent = `${SETTINGS.playTime.toString().padStart(2,'0')}:00`; // 初期表示も設定値
        break;

      case 'countdown':
        core.countdown = 3;
        $count.textContent = 3;
        $count.classList.remove('hidden');
        $start.style.display='none';
        core.nextTick = performance.now() + 1000;      // 1秒後
        break;

      case 'playing':
        core.game.start();
        core.endTime = performance.now() + SETTINGS.playTime * 1000;
        break;

      case 'over':
        core.game.cleanup();
        $result.classList.remove('hidden');
        $final.textContent = $score.textContent.split(': ')[1];
        core.selected = 0;  setButtons();
        break;
    }
  }

  /* ---------------- 毎フレームループ ---------------- */
  function loop(){
    const gp = navigator.getGamepads()[0];
    const anyPressed = gp ? gp.buttons.some(b=>b.pressed) : false;

    switch(core.phase){

      case 'wait-pad':
        if(gp) setPhase('wait-release');
        break;

      case 'wait-release':           // モード選択時の押下をリリース待ち
        if(!anyPressed){
          core.buttonsUp = true;
          setPhase('wait-press');
        }
        break;

      case 'wait-press':
        if(anyPressed && !core.prevAny) setPhase('countdown');
        break;

      case 'countdown':{
        const now = performance.now();
        if(now >= core.nextTick){
          core.countdown--;
          if(core.countdown === 0){
            $count.classList.add('hidden');
            setPhase('playing');
          } else {
            $count.textContent = core.countdown;
            core.nextTick += 1000;
          }
        }
      }break;

      case 'playing':{
        /* タイマー */
        const left = Math.max(0, core.endTime - performance.now());
        const sec  = Math.floor(left / 1000);
        const cs   = Math.floor((left % 1000) / 10);
        $time.textContent = `${sec.toString().padStart(2,'0')}:${cs.toString().padStart(2,'0')}`;
        if(left <= 0) setPhase('over');

        core.game.update();
      }break;

      case 'over':{
        if(!gp) break;
        if(gp.buttons[14]?.pressed) core.selected = 0;
        if(gp.buttons[15]?.pressed) core.selected = 1;
        setButtons();
        if(gp.buttons[0]?.pressed){
          if(core.selected === 0) location.reload();
          else location.href = 'index.html';
        }
      }break;
    }

    core.prevAny = anyPressed;
    requestAnimationFrame(loop);
  }

  function setButtons(){
    $btnRetry.classList.toggle('selected', core.selected===0);
    $btnHome .classList.toggle('selected', core.selected===1);
  }

  /* ---------------- 公開 ---------------- */
  requestAnimationFrame(loop);
  return { init(obj){ Object.assign(core.game,obj);} };

})();
