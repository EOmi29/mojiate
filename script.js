// ===================================================
// 50音データ（空文字はボードの空白スペース用）
// ===================================================
const HIRAGANA_CHARS = [
    'あ', 'い', 'う', 'え', 'お',
    'か', 'き', 'く', 'け', 'こ',
    'さ', 'し', 'す', 'せ', 'そ',
    'た', 'ち', 'つ', 'て', 'と',
    'な', 'に', 'ぬ', 'ね', 'の',
    'は', 'ひ', 'ふ', 'へ', 'ほ',
    'ま', 'み', 'む', 'め', 'も',
    'や', ' ', 'ゆ', ' ', 'よ',
    'ら', 'り', 'る', 'れ', 'ろ',
    'わ', ' ', 'を', ' ', 'ん'
];

const KATAKANA_CHARS = [
    'ア', 'イ', 'ウ', 'エ', 'オ',
    'カ', 'キ', 'ク', 'ケ', 'コ',
    'サ', 'シ', 'ス', 'セ', 'ソ',
    'タ', 'チ', 'ツ', 'テ', 'ト',
    'ナ', 'ニ', 'ヌ', 'ネ', 'ノ',
    'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
    'マ', 'ミ', 'ム', 'メ', 'モ',
    'ヤ', ' ', 'ユ', ' ', 'ヨ',
    'ラ', 'リ', 'ル', 'レ', 'ロ',
    'ワ', ' ', 'ヲ', ' ', 'ン'
];

// ===================================================
// 状態管理変数
// ===================================================
let currentMode = 'hiragana';     // 現在のモード (hiragana, katakana, kanji)
let selectedCharacter = '';       // 出題される文字
let currentLightSize = 150;       // ライトの初期サイズ (ふつう)
let isTracking = false;           // タッチ/マウスが押されているか

// ===================================================
// HTML要素の取得
// ===================================================
const pageTop = document.getElementById('page-top');
const pageSetup = document.getElementById('page-setup');
const pageGame = document.getElementById('page-game');

const btnStart = document.getElementById('btn-start');
const btnPlay = document.getElementById('btn-play');
const btnBackToTop = document.getElementById('btn-back-to-top');
const btnBackToSetup = document.getElementById('btn-back-to-setup');
const btnReveal = document.getElementById('btn-reveal');
const btnRandom = document.getElementById('btn-random');

const tabHiragana = document.getElementById('tab-hiragana');
const tabKatakana = document.getElementById('tab-katakana');
const tabKanji = document.getElementById('tab-kanji');

const boardContainer = document.getElementById('board-container');
const syuonBoard = document.getElementById('syuon-board');
const kanjiContainer = document.getElementById('kanji-container');
const kanjiInput = document.getElementById('kanji-input');
const errorMessage = document.getElementById('error-message');
const currentSelectedText = document.getElementById('current-selected-text');

const gameArea = document.getElementById('game-area');
const hiddenText = document.getElementById('hidden-text');
const darkOverlay = document.getElementById('dark-overlay');

// ===================================================
// 懐中電灯（ライト）エフェクトの準備
// ===================================================
// ライトの絵文字本体と、放射状に広がる灯りをJS側で1つ作成して追加します
const flashlightElement = document.createElement('div');
flashlightElement.id = 'flashlight-tool';
// CSSで位置や見た目を整えるためのスタイルを注入
const style = document.createElement('style');
style.innerHTML = `
    #flashlight-tool {
        position: absolute;
        pointer-events: none;
        z-index: 5;
        transform: translate(-50%, -50%);
        display: none; /* 最初は非表示 */
    }
    /* 懐中電灯の絵文字 */
    #flashlight-tool::before {
        content: '🔦';
        font-size: 40px;
        position: absolute;
        top: -15px;
        left: -15px;
        transform: rotate(45deg); /* ライトを左上に向ける */
    }
    /* ライトの先から放射状に広がる白い灯り部分（あまり遠くまでは照らさない） */
    #flashlight-tool::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: var(--glow-size, 300px);
        height: var(--glow-size, 300px);
        transform: translate(-50%, -50%);
        /* 中心が白く、外側に向かって放射状に消えていく（遠くは真っ黒に溶け込む） */
        background: radial-gradient(
            circle, 
            rgba(255, 255, 255, 0.4) 0%, 
            rgba(255, 255, 255, 0.1) 40%, 
            rgba(255, 255, 255, 0) 70%
        );
        border-radius: 50%;
        pointer-events: none;
    }
`;
document.head.appendChild(style);
gameArea.appendChild(flashlightElement);


// ===================================================
// イベントリスナー（画面の切り替えなど）
// ===================================================

// アプリ起動時：50音ボード（初期はひらがな）を作成
createBoard(HIRAGANA_CHARS);

// 画面遷移：トップ -> 出題設定
btnStart.addEventListener('click', () => {
    switchPage(pageSetup);
});

// 画面遷移：出題設定 -> トップ
btnBackToTop.addEventListener('click', () => {
    switchPage(pageTop);
});

// モード切り替え（ひらがな）
tabHiragana.addEventListener('click', () => {
    changeMode('hiragana');
});

// モード切り替え（カタカナ）
tabKatakana.addEventListener('click', () => {
    changeMode('katakana');
});

// モード切り替え（漢字）
tabKanji.addEventListener('click', () => {
    changeMode('kanji');
});

// ランダム選択
btnRandom.addEventListener('click', () => {
    let chars = currentMode === 'hiragana' ? HIRAGANA_CHARS : KATAKANA_CHARS;
    // 空白以外の文字を抽出
    let validChars = chars.filter(c => c.trim() !== '');
    let randomIndex = Math.floor(Math.random() * validChars.length);
    selectCharacter(validChars[randomIndex]);
});

// 漢字の入力チェック
kanjiInput.addEventListener('input', () => {
    let val = kanjiInput.value;
    if (val.length === 1) {
        errorMessage.classList.add('hidden');
        selectCharacter(val);
    } else if (val.length > 1) {
        errorMessage.classList.remove('hidden');
        // 2文字目以降をカットして1文字にする
        kanjiInput.value = val.substring(0, 1);
        selectCharacter(val.substring(0, 1));
    } else {
        errorMessage.classList.add('hidden');
        selectCharacter('');
    }
});

// 画面遷移：出題設定 -> ゲーム画面（問題をだす！）
btnPlay.addEventListener('click', () => {
    hiddenText.textContent = selectedCharacter;
    
    // ゲーム画面の初期化（暗闇に戻す）
    pageGame.classList.remove('revealed');
    btnReveal.classList.remove('hidden');
    btnBackToSetup.classList.add('hidden');
    flashlightElement.style.display = 'block'; // ライトを表示
    
    // ライトの初期位置を中央にセット
    const rect = gameArea.getBoundingClientRect();
    updateLightPosition(rect.width / 2, rect.height / 2);
    
    switchPage(pageGame);
});

// 正解を見る！
btnReveal.addEventListener('click', () => {
    pageGame.classList.add('revealed');
    btnReveal.classList.add('hidden');
    btnBackToSetup.classList.remove('hidden');
    flashlightElement.style.style = 'none'; // 正解時はライト不要なので消す
    flashlightElement.style.display = 'none';
});

// ゲーム画面 -> 出題設定に戻る
btnBackToSetup.addEventListener('click', () => {
    switchPage(pageSetup);
});

// ===================================================
// ゲーム本番：ライトを動かす処理（PC・スマホ両対応）
// ===================================================

// マウス/指を動かしたとき
function handleMove(e) {
    const rect = gameArea.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
        // スマホなどのタッチ操作
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        // PCのマウス操作
        clientX = e.clientX;
        clientY = e.clientY;
    }

    // ゲームエリア内での相対的な座標を計算
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // 範囲内ならライト位置を更新
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        updateLightPosition(x, y);
    }
}

// 座標に合わせて暗闇の穴あき（マスク）と、ライトイラストの位置を連動
function updateLightPosition(x, y) {
    // style.cssの変数に位置とサイズを渡す（文字が見えるようになる処理）
    darkOverlay.style.setProperty('--light-x', `${x}px`);
    darkOverlay.style.setProperty('--light-y', `${y}px`);
    darkOverlay.style.setProperty('--light-size', `${currentLightSize}px`);

    // 懐中電灯ツールと放射状の灯りの位置を移動
    flashlightElement.style.left = `${x}px`;
    flashlightElement.style.top = `${y}px`;
    // 放射状の灯りの大きさもライトサイズと連動させる
    flashlightElement.style.setProperty('--glow-size', `${currentLightSize * 2.5}px`);
}

// イベントの登録（PC）
gameArea.addEventListener('mousemove', handleMove);
// イベントの登録（スマホ・タブレット：指で触った瞬間に動くようにする）
gameArea.addEventListener('touchstart', (e) => {
    handleMove(e);
}, { passive: true });
gameArea.addEventListener('touchmove', handleMove, { passive: true });


// ===================================================
// 右側パネル：ライトの大きさ変更処理
// ===================================================
const sizeButtons = document.querySelectorAll('.btn-size');
sizeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // アクティブなボタンの見た目を切り替え
        sizeButtons.forEach(b => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        
        // サイズを更新（ボタンのdata-size属性から数字を読み取る）
        currentLightSize = parseInt(targetBtn.getAttribute('data-size'), 10);
        
        // 現在のライト位置のままサイズを即座に反映
        const x = darkOverlay.style.getPropertyValue('--light-x') || '0px';
        const y = darkOverlay.style.getPropertyValue('--light-y') || '0px';
        darkOverlay.style.setProperty('--light-size', `${currentLightSize}px`);
        flashlightElement.style.setProperty('--glow-size', `${currentLightSize * 2.5}px`);
    });
});


// ===================================================
// 便利なサポート関数（処理の共通化）
// ===================================================

// ページを切り替える関数
function switchPage(targetPage) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    targetPage.classList.add('active');
}

// 50音表のボタンを画面に敷き詰める関数
function createBoard(chars) {
    syuonBoard.innerHTML = ''; // 一旦クリア
    chars.forEach(char => {
        const btn = document.createElement('button');
        if (char === ' ') {
            btn.className = 'char-btn empty';
        } else {
            btn.className = 'char-btn';
            btn.textContent = char;
            btn.addEventListener('click', () => {
                // すでに選ばれているボタンの選択を解除
                const allButtons = syuonBoard.querySelectorAll('.char-btn');
                allButtons.forEach(b => b.classList.remove('selected'));
                // 新しく選んだボタンをピカッとさせる
                btn.classList.add('selected');
                selectCharacter(char);
            });
        }
        syuonBoard.appendChild(btn);
    });
}

// モード（タブ）を切り替えたときの処理
function changeMode(mode) {
    currentMode = mode;
    tabHiragana.classList.remove('active');
    tabKatakana.classList.remove('active');
    tabKanji.classList.remove('active');

    // 選択のリセット
    selectCharacter('');
    kanjiInput.value = '';
    errorMessage.classList.add('hidden');

    if (mode === 'hiragana') {
        tabHiragana.classList.add('active');
        boardContainer.classList.remove('hidden');
        kanjiContainer.classList.add('hidden');
        createBoard(HIRAGANA_CHARS);
    } else if (mode === 'katakana') {
        tabKatakana.classList.add('active');
        boardContainer.classList.remove('hidden');
        kanjiContainer.classList.add('hidden');
        createBoard(KATAKANA_CHARS);
    } else if (mode === 'kanji') {
        tabKanji.classList.add('active');
        boardContainer.classList.add('hidden');
        kanjiContainer.classList.remove('hidden');
    }
}

// 出題する文字が確定したときの処理
function selectCharacter(char) {
    selectedCharacter = char;
    if (char && char.trim() !== '') {
        currentSelectedText.textContent = `「 ${char} 」`;
        btnPlay.disabled = false; // 問題を出すボタンを押せるようにする
    } else {
        currentSelectedText.textContent = '（まだえらばれていません）';
        btnPlay.disabled = true;  // 文字がないときは押せない
    }
}
