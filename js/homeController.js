(() => {
  const buttons = Array.from(document.querySelectorAll('.menu-button'));
  const menu    = document.getElementById('menu');
  const connect = document.getElementById('connect-message');
  let idx = 0, prevUp=false, prevDown=false, prevX=false, inputOK=false;

  function updateSel(){
    buttons.forEach((b,i)=>b.classList.toggle('selected',i===idx));
  }

  function waitRelease(){
    const chk = () =>{
      const gp=navigator.getGamepads()[0];
      if(gp && gp.buttons.some(b=>b.pressed)) requestAnimationFrame(chk);
      else{ inputOK=true; updateSel(); loop(); }
    };
    chk();
  }

  function loop(){
    const gp=navigator.getGamepads()[0];
    if(gp && inputOK){
      const up=gp.buttons[12]?.pressed, down=gp.buttons[13]?.pressed, x=gp.buttons[0]?.pressed;
      if(up&&!prevUp){ idx=(idx-1+buttons.length)%buttons.length; updateSel(); }
      if(down&&!prevDown){ idx=(idx+1)%buttons.length; updateSel(); }
      if(x&&!prevX) buttons[idx].click();
      prevUp=up; prevDown=down; prevX=x;
    }
    requestAnimationFrame(loop);
  }

  function chkPad(){
    if(navigator.getGamepads()[0]){
      connect.classList.add('hidden'); menu.classList.remove('hidden');
      waitRelease();
    }else{
      connect.classList.remove('hidden'); menu.classList.add('hidden');
      setTimeout(chkPad,500);
    }
  }
  window.addEventListener('load',chkPad);
  window.addEventListener('gamepadconnected',chkPad);
})();