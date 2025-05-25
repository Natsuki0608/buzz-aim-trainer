/* ======================================================================
   Settings Editor
   - カテゴリーごとにフォーム生成
   - Import / Export / Default / Save 各ボタンを実装
   - game time / target quantity は1以上の整数
   - curve ratio は 0～1 かつ min ≦ max
====================================================================== */

/* -------------------- デフォルト値を保持 ---------------------------- */
const DEFAULT_SETTINGS = {
  sensNormal:20,sensAim:10,playTime:60,hitBoxSize:0.6,cursorSize:50,
  numTarget:5,birthRate:6,minCurveRatio:0.05,maxCurveRatio:0.30,
  vibration:true,supportLine:false,visualizeHitBox:false,buttonLayout:'R1L1'
};

window.addEventListener('DOMContentLoaded', () => {

  /* ---- ラベルとカテゴリ構造 --------------------------------------- */
  const LABELS = {
    sensNormal:'sensitive(normal)',sensAim:'sensitive(aim)',
    playTime:'game time',hitBoxSize:'hit box size',cursorSize:'cursor size',
    vibration:'vibration',visualizeHitBox:'visualize hit box',
    buttonLayout:'button layout',numTarget:'target quantity',
    supportLine:'support line',birthRate:'birth rate'
  };

  const CATEGORIES = [
    { title:'General', keys:['sensNormal','sensAim','playTime','hitBoxSize',
                              'cursorSize','vibration','visualizeHitBox','buttonLayout'] },
    { title:'Shoot Target', keys:['numTarget','supportLine'] },
    { title:'Tracking Target', keys:['birthRate','curveRatio'] }  /* curveRatio は特別行 */
  ];

  const form = document.getElementById('form-container');

  /* ---- フォーム生成 ----------------------------------------------- */
  CATEGORIES.forEach(cat=>{
    const hdg = document.createElement(cat.title==='General'?'h2':'h3');
    hdg.textContent = cat.title; form.appendChild(hdg);

    cat.keys.forEach(k=>{
      if(k==='curveRatio'){ addCurveRatioRow(); return; }
      addRow(k);
    });
  });

  /* =================================================================
     ボタン機能
     ================================================================= */

  /* Save ----------------------------------------------------------- */
  document.getElementById('btn-save').addEventListener('click', saveSettings);

  /* Export --------------------------------------------------------- */
  document.getElementById('btn-export').addEventListener('click', () => {
    const data = collectSettings();
    if(!data) return;                           // バリデーション失敗
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'buzzAimTrainer_mySettings.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* Import --------------------------------------------------------- */
  const fileInput = document.getElementById('file-input');
  document.getElementById('btn-import').addEventListener('click', ()=>fileInput.click());

  fileInput.addEventListener('change', evt=>{
    const file = evt.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = e=>{
      try{
        const obj = JSON.parse(e.target.result);
        const required = Object.keys(DEFAULT_SETTINGS);
        /* 構造チェック */
        const ok = required.every(k=>k in obj) && Object.keys(obj).length===required.length;
        if(!ok) throw 'format';
        /* フォームに反映 */
        required.forEach(k=>{
          const el = document.querySelector(`[data-key="${k}"]`);
          if(!el) return;
          if(el.type==='checkbox')       el.checked = obj[k];
          else if(el.tagName==='SELECT') el.value   = obj[k];
          else                           el.value   = obj[k];
        });
        alert('Settings imported!');
      }catch{
        alert('buzz aim trainerの設定ファイルを選択してください');
      }
      fileInput.value='';               // 同じファイル再選択許可
    };
    reader.readAsText(file);
  });

  /* Default -------------------------------------------------------- */
  document.getElementById('btn-default').addEventListener('click',()=>{
    if(!confirm('全ての設定をデフォルトに戻しますか？')) return;
    Object.entries(DEFAULT_SETTINGS).forEach(([k,v])=>{
      const el = document.querySelector(`[data-key="${k}"]`);
      if(!el) return;
      if(el.type==='checkbox')       el.checked=v;
      else if(el.tagName==='SELECT') el.value  =v;
      else                           el.value  =v;
    });
    localStorage.removeItem('userSettings');
    alert('Default settings restored!');
  });

  /* =================================================================
     ユーティリティ関数
     ================================================================= */

  /* 通常行 */
  function addRow(key){
    const val = SETTINGS[key];
    const row = document.createElement('div'); row.className='form-row';

    const lab = document.createElement('label'); lab.textContent=LABELS[key];
    row.appendChild(lab);

    let input;
    if(typeof val==='number'){
      input=document.createElement('input');
      input.type='number';
      input.step = (key==='playTime'||key==='numTarget')?'1':'any';
      input.value=val;
      switch(key){
        case 'sensNormal':input.min=0;break;
        case 'sensAim':   input.min=0;break;
        case 'playTime':  input.min=1;break;
        case 'hitBoxSize':input.min=0.01;input.max=1;break;
        case 'numTarget': input.min=1;break;
        case 'birthRate': input.min=1;break;
        case 'cursorSize':input.min=1;break;
      }
    }else if(typeof val==='boolean'){
      input=document.createElement('input'); input.type='checkbox'; input.checked=val;
    }else{
      if(key==='buttonLayout'){
        input=document.createElement('select');
        ['R1L1','R2L2'].forEach(opt=>{
          const o=document.createElement('option'); o.value=opt;o.textContent=opt;
          if(opt===val) o.selected=true; input.appendChild(o);
        });
      }else{
        input=document.createElement('input'); input.type='text'; input.value=val;
      }
    }
    input.dataset.key=key;
    row.appendChild(input); form.appendChild(row);
  }

  /* curve ratio 行 */
  function addCurveRatioRow(){
    const row=document.createElement('div'); row.className='form-row';
    const lab=document.createElement('label'); lab.textContent='curve ratio'; row.appendChild(lab);
    const wrap=document.createElement('div'); wrap.className='range-pair';

    const min=document.createElement('input');
    min.type='number'; min.step='any'; min.min=0; min.max=1;
    min.value=SETTINGS.minCurveRatio; min.dataset.key='minCurveRatio';

    const tilde=document.createElement('span'); tilde.textContent='～';

    const max=document.createElement('input');
    max.type='number'; max.step='any'; max.min=0; max.max=1;
    max.value=SETTINGS.maxCurveRatio; max.dataset.key='maxCurveRatio';

    wrap.appendChild(min); wrap.appendChild(tilde); wrap.appendChild(max);
    row.appendChild(wrap); form.appendChild(row);
  }

  /* フォーム値 → オブジェクト & バリデーション */
  function collectSettings(){
    const obj={};
    document.querySelectorAll('[data-key]').forEach(inp=>{
      const k=inp.dataset.key;
      if(inp.type==='number')        obj[k]=parseFloat(inp.value);
      else if(inp.type==='checkbox') obj[k]=inp.checked;
      else                           obj[k]=inp.value;
    });

    /* ---- バリデーション (同じ内容を Save 時にも使用) ---------- */
    const err=[], isInt=n=>Number.isInteger(n);
    if(obj.sensNormal<0) err.push('sensitive(normal) は0以上にしてください');
    if(obj.sensAim<0||obj.sensAim>=obj.sensNormal) err.push('sensitive(aim) は0以上で sensitive(normal) 未満にしてください');
    if(obj.playTime<1||!isInt(obj.playTime)) err.push('game time は1以上の整数で設定してください');
    if(obj.hitBoxSize<0.01||obj.hitBoxSize>1) err.push('hit box size は0.01～1の範囲で設定してください');
    if(obj.numTarget<1||!isInt(obj.numTarget)) err.push('target quantity は1以上の整数で設定してください');
    if(obj.birthRate<1) err.push('birth rate は1以上にしてください');
    if(obj.minCurveRatio<0||obj.minCurveRatio>1||obj.maxCurveRatio<0||obj.maxCurveRatio>1)
      err.push('curve ratio は0～1の範囲で設定してください');
    if(obj.minCurveRatio>obj.maxCurveRatio)
      err.push('curve ratio の最小値は最大値以下にしてください');

    if(err.length){ alert(err.join('\n')); return null; }
    return obj;
  }

  /* Save 処理 (フォーム → localStorage) */
  function saveSettings(){
    const data = collectSettings();
    if(!data) return;
    localStorage.setItem('userSettings', JSON.stringify(data));
    alert('Settings saved!');
  }

});