(() => {
    const buttons = Array.from(document.querySelectorAll('.menu-button'));
    const menu = document.getElementById('menu');
    const connectMessage = document.getElementById('connect-message');
    let selectedIndex = 0;
    let prevUp = false;
    let prevDown = false;
    let prevX = false;
    let inputEnabled = false;
  
    function updateSelection() {
      buttons.forEach((btn, index) => {
        btn.classList.toggle('selected', index === selectedIndex);
      });
    }
  
    function waitForGamepadRelease() {
      const check = () => {
        const [gp] = navigator.getGamepads();
        if (gp && gp.buttons.some(b => b.pressed)) {
          requestAnimationFrame(check);
        } else {
          inputEnabled = true;
          updateSelection();
          requestAnimationFrame(loop);
        }
      };
      requestAnimationFrame(check);
    }
  
    function loop() {
      const [gp] = navigator.getGamepads();
  
      if (gp && inputEnabled) {
        const up = gp.buttons[12]?.pressed;
        const down = gp.buttons[13]?.pressed;
        const x = gp.buttons[0]?.pressed;
  
        if (up && !prevUp) {
          selectedIndex = (selectedIndex - 1 + buttons.length) % buttons.length;
          updateSelection();
        }
  
        if (down && !prevDown) {
          selectedIndex = (selectedIndex + 1) % buttons.length;
          updateSelection();
        }
  
        if (x && !prevX) {
          buttons[selectedIndex].click();
        }
  
        prevUp = up;
        prevDown = down;
        prevX = x;
      }
  
      requestAnimationFrame(loop);
    }
  
    function checkGamepadConnection() {
      const hasGamepad = navigator.getGamepads()[0];
      if (hasGamepad) {
        connectMessage.classList.add('hidden');
        menu.classList.remove('hidden');
        waitForGamepadRelease();
      } else {
        connectMessage.classList.remove('hidden');
        menu.classList.add('hidden');
        setTimeout(checkGamepadConnection, 500);
      }
    }
  
    window.addEventListener('load', () => {
      checkGamepadConnection();
    });
  
    window.addEventListener('gamepadconnected', () => {
      checkGamepadConnection();
    });
  
    // キーボード（任意）
    window.addEventListener('keydown', (e) => {
      if (!inputEnabled) return;
  
      if (e.key === 'ArrowUp') {
        selectedIndex = (selectedIndex - 1 + buttons.length) % buttons.length;
        updateSelection();
      } else if (e.key === 'ArrowDown') {
        selectedIndex = (selectedIndex + 1) % buttons.length;
        updateSelection();
      } else if (e.key === 'Enter') {
        buttons[selectedIndex].click();
      }
    });
  
    updateSelection();
  })();
  