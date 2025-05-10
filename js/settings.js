/* ======================================================================
   PadTrainer 共通設定
====================================================================== */
const SETTINGS = {
  sensNormal  : 20,    // 通常感度
  sensAim     : 10,    // エイム時感度
  playTime    : 60,    // ゲームタイマー (秒)
  hitBoxSize  : 0.6,   // 当たり判定スケール (0–1)
  cursorSize  : 50,    // カーソル直径 [px]
  numTarget   : 5,     // ターゲットの数
  birthRate   : 6,     // 的の再生成間隔 (秒)
  minCurveRatio : 0.05, //最小曲率
  maxCurveRatio : 0.30, //最大曲率
  vibration   : true,  // ★ コントローラ振動 (true / false)
  supportLine : false,   // 補助線 (true / false)
  visualizeHitBox : false  // ヒットボックスの可視化 (true / false)
};
