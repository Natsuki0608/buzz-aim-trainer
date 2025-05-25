/* ======================================================================
   PadTrainer 共通設定
   =====================================================================*/
const SETTINGS = {
  sensNormal     : 20,
  sensAim        : 10,
  playTime       : 60,
  hitBoxSize     : 0.6,
  cursorSize     : 50,
  numTarget      : 3,
  birthRate      : 6,
  minCurveRatio  : 0.05,
  maxCurveRatio  : 0.30,
  vibration      : true,
  supportLine    : false,
  lineWidth      : 1,          /* ★ support line の太さ (1px 以上) */
  visualizeHitBox: false,
  buttonLayout   : 'R1L1'
};

/* ★ ユーザー保存設定を localStorage から読込んで上書き */
(() => {
  const saved = localStorage.getItem('userSettings');
  if (saved) {
    try { Object.assign(SETTINGS, JSON.parse(saved)); } catch (e) {}
  }
})();
