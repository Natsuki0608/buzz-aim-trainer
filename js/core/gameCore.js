/* ======================================================================
   GAME CORE
====================================================================== */
const GameCore = (()=>{

  const core={
    phase:'wait-pad',count:3,sel:0,
    game:{start(){},update(){},cleanup(){}},
    prevAny:false, end:0
  };

  const $s=document.getElementById('score'),
        $t=document.getElementById('time'),
        $msg=document.getElementById('start-message'),
        $cnt=document.getElementById('countdown'),
        $res=document.getElementById('game-over-message'),
        $fin=document.getElementById('final-score'),
        $r=document.getElementById('btn-retry'),
        $h=document.getElementById('btn-home');

  function phase(p){
    core.phase=p;
    if(p==='wait-press'){ $msg.style.display='block'; $t.textContent=`${SETTINGS.playTime.toString().padStart(2,'0')}:00`; }
    if(p==='count'){ core.count=3; $cnt.textContent=3; $cnt.classList.remove('hidden'); $msg.style.display='none'; core.next=performance.now()+1000; }
    if(p==='play'){ core.game.start(); core.end=performance.now()+SETTINGS.playTime*1000; }
    if(p==='over'){ core.game.cleanup(); $res.classList.remove('hidden'); $fin.textContent=$s.textContent.split(': ')[1]; core.sel=0; selUI(); }
  }

  function selUI(){ $r.classList.toggle('selected',core.sel===0); $h.classList.toggle('selected',core.sel===1); }

  function loop(){
    const gp=navigator.getGamepads()[0], any=gp?gp.buttons.some(b=>b.pressed):false;

    switch(core.phase){
      case 'wait-pad': if(gp) phase('wait-release'); break;
      case 'wait-release': if(!any){ phase('wait-press'); } break;
      case 'wait-press': if(any&&!core.prevAny) phase('count'); break;
      case 'count':{
        const n=performance.now();
        if(n>=core.next){ core.count--; if(core.count===0){ $cnt.classList.add('hidden'); phase('play'); }
          else{ $cnt.textContent=core.count; core.next+=1000; } }
      }break;
      case 'play':{
        const left=Math.max(0,core.end-performance.now()),
              sec=Math.floor(left/1000),
              cs=Math.floor((left%1000)/10);
        $t.textContent=`${sec.toString().padStart(2,'0')}:${cs.toString().padStart(2,'0')}`;
        if(left<=0) phase('over');
        core.game.update();
      }break;
      case 'over':{
        if(!gp) break;
        if(gp.buttons[14]?.pressed) core.sel=0;
        if(gp.buttons[15]?.pressed) core.sel=1;
        selUI();
        if(gp.buttons[0]?.pressed){
          if(core.sel===0) location.reload();
          else location.href='index.html';
        }
      }break;
    }
    core.prevAny=any; requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return{init(o){Object.assign(core.game,o);}};

})();