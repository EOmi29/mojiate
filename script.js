// ===================================================
// 50音データ
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
    'サ', 'シ', 'セ', 'ソ', 'タ',
    'チ', 'ツ', 'テ', 'ト', 'ナ',
    'ニ', 'ヌ', 'ネ', 'ノ', 'ハ',
    'ひ', 'フ', 'ヘ', 'ホ', 'マ',
    'ミ', 'ム', 'メ', 'モ', 'ヤ',
    ' ', 'ユ', ' ', 'ヨ', 'ラ',
    'り', 'る', 'れ', 'ろ', 'ワ',
    ' ', 'ヲ', ' ', 'ン'
];

// ===================================================
// 状態管理変数
// ===================================================
let currentMode = 'hiragana';
let selectedCharacter = '';

// くり抜く円の初期半径（ちいさい：35px）
let currentLightSize = 35; 

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
const sizeButtons = document.querySelectorAll('.btn-size');

// ===================================================
// 【リニューアル】懐中電灯を「絵文字（🔦）」として動的に生成
// ===================================================
const flashlightElement = document.createElement('div');
flashlightElement.id = 'flashlight-tool';
flashlightElement.textContent = '🔦'; // どの端末でもハッキリ映る絵文字を採用

const beamElement = document.createElement('div');
beamElement.id = 'flashlight-beam';

gameArea.appendChild(beamElement);
gameArea.appendChild(flashlightElement);

// ===================================================
// イベントリスナー
// ===================================================

createBoard(HIRAGANA_CHARS);

btnStart.addEventListener('click', () => switchPage(pageSetup));
btnBackToTop.addEventListener('click', () => switchPage(pageTop));
tabHiragana.addEventListener('click', () => changeMode('hiragana'));
tabKatakana.addEventListener('click', () => changeMode('katakana'));
tabKanji.addEventListener('click', () => changeMode('kanji'));

btnRandom.addEventListener('click', () => {
    let chars = currentMode === 'hiragana' ? HIRAGANA_CHARS : KATAKANA_CHARS;
    let validChars = chars.filter(c => c.trim() !== '');
    let randomIndex = Math.floor(Math.random() * validChars.length);
    selectCharacter(validChars[randomIndex]);
});

kanjiInput.addEventListener('input', () => {
    let val = kanjiInput.value;
    if (val.length === 1) {
        errorMessage.classList.add('hidden');
        selectCharacter(val);
    } else if (val.length > 1) {
        errorMessage.classList.remove('hidden');
        kanjiInput.value = val.substring(0, 1);
        selectCharacter(val.substring(0, 1));
    } else {
        errorMessage.classList.add('hidden');
        selectCharacter('');
    }
});

// 問題をだす！を押した時の初期化処理
btnPlay.addEventListener('click', () => {
    hiddenText.textContent = selectedCharacter;
    
    // デフォルトとして必ず「ちいさい」を選択状態にする
    currentLightSize = 35;
    sizeButtons.forEach(b => {
        if(b.getAttribute('data-size') === '80') { 
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    pageGame.classList.remove('revealed');
    btnReveal.classList.remove('hidden');
    btnBackToSetup.classList.add('hidden');
    
    // ライトと光の筋を表示
    flashlightElement.style.display = 'block';
    beamElement.style.display = 'block';
    
    // 初期位置を画面中央付近に設定
    const rect = gameArea.getBoundingClientRect();
    updateLightPosition(rect.width / 2, rect.height / 2);
    
    switchPage(pageGame);
});

// 正解を見る！ボタンの挙動調整
btnReveal.addEventListener('click', () => {
    pageGame.classList.add('revealed');
    btnReveal.classList.add('hidden');
    btnBackToSetup.classList.remove('hidden');
    
    // 正解発表されたらライトツールと光の筋を消す
    flashlightElement.style.display = 'none';
    beamElement.style.display = 'none';
});

btnBackToSetup.addEventListener('click', () => switchPage(pageSetup));

// ===================================================
// ライトと放射状の光の計算・移動処理
// ===================================================
function handleMove(e) {
    if (pageGame.classList.contains('revealed')) return; // 正解発表後は処理しない

    const rect = gameArea.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    // 指やマウスの、ゲームエリア内における座標 (X, Y)
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        updateLightPosition(x, y);
    }
}

function updateLightPosition(touchX, touchY) {
    // 💡 距離を「ゼロ（超至近距離）」に詰める設計
    // 絵文字ライトの先端（右上）のすぐ目の前がそのまま真ん丸く照らされます！
    const distance = 45; 
    const angleRad = -30 * (Math.PI / 180); // 斜め右上約30度の方向へ照射

    // 1. 照らされる「丸い光の中心点」の座標を計算
    const lightX = touchX + distance * Math.cos(angleRad);
    const lightY = touchY + distance * Math.sin(angleRad);

    // 2. 絵文字「🔦」のレンズ先端にピタッと合わせる発光部の座標
    const bulbX = touchX + 45;
    const bulbY = touchY - 45;

    // 3. CSS変数を書き換えて暗闇のくり抜き位置を連動
    darkOverlay.style.setProperty('--light-x', `${lightX}px`);
    darkOverlay.style.setProperty('--light-y', `${lightY}px`);
    darkOverlay.style.setProperty('--light-size', `${currentLightSize}px`);

    // 4. 懐中電灯本体（絵文字）の位置を指の真下に固定
    flashlightElement.style.left = `${touchX}px`;
    flashlightElement.style.top = `${touchY}px`;

    // 5. ライトの先端から、照らされている丸い円のフチへ広がる「三角形の光の筋」の４点を計算
    const spreadAngle = Math.PI / 2; // 光の広がり角度
    const beamEndX1 = lightX + currentLightSize * Math.cos(angleRad + spreadAngle);
    const beamEndY1 = lightY + currentLightSize * Math.sin(angleRad + spreadAngle);
    const beamEndX2 = lightX + currentLightSize * Math.cos(angleRad - spreadAngle);
    const beamEndY2 = lightY + currentLightSize * Math.sin(angleRad - spreadAngle);

    // クリップパス用のポリゴン座標をCSS変数にセットして放射状の光を表現
    beamElement.style.setProperty('--beam-start-x1', `${bulbX}px`);
    beamElement.style.setProperty('--beam-start-y1', `${bulbY}px`);
    beamElement.style.setProperty('--beam-start-x2', `${bulbX + 2}px`); 
    beamElement.style.setProperty('--beam-start-y2', `${bulbY - 2}px`);
    beamElement.style.setProperty('--beam-end-x1', `${beamEndX1}px`);
    beamElement.style.setProperty('--beam-end-y1', `${beamEndY1}px`);
    beamElement.style.setProperty('--beam-end-x2', `${beamEndX2}px`);
    beamElement.style.setProperty('--beam-end-y2', `${beamEndY2}px`);
}

// イベントのマウス・タッチへの紐付け
gameArea.addEventListener('mousemove', handleMove);
gameArea.addEventListener('touchstart', (e) => handleMove(e), { passive: true });
gameArea.addEventListener('touchmove', handleMove, { passive: true });

// ===================================================
// ライトサイズ変更（切り替え時の半径のピクセル数指定）
// ===================================================
sizeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        sizeButtons.forEach(b => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        
        // 選択されたボタンに応じて、くり抜く円のサイズを打ち変え
        const rawSize = targetBtn.getAttribute('data-size');
        if (rawSize === '80') {
            currentLightSize = 35;  // ちいさい
        } else if (rawSize === '150') {
            currentLightSize = 65; // ふつう
        } else if (rawSize === '250') {
            currentLightSize = 110; // おおきい
        }
        
        // 現在のライト位置を取得して光のサイズを即座にリフレッシュ
        const x = parseFloat(flashlightElement.style.left) || 0;
        const y = parseFloat(flashlightElement.style.top) || 0;
        if(x > 0 && y > 0) {
            updateLightPosition(x, y);
        }
    });
});

// ===================================================
// サポート関数
// ===================================================
function switchPage(targetPage) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    targetPage.classList.add('active');
}

function createBoard(chars) {
    syuonBoard.innerHTML = '';
    chars.forEach(char => {
        const btn = document.createElement('button');
        if (char === ' ') {
            btn.className = 'char-btn empty';
        } else {
            btn.className = 'char-btn';
            btn.textContent = char;
            btn.addEventListener('click', () => {
                const allButtons = syuonBoard.querySelectorAll('.char-btn');
                allButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectCharacter(char);
            });
        }
        syuonBoard.appendChild(btn);
    });
}

function changeMode(mode) {
    currentMode = mode;
    tabHiragana.classList.remove('active');
    tabKatakana.classList.remove('active');
    tabKanji.classList.remove('active');

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
        boardContainer.className = 'hidden';
        kanjiContainer.classList.remove('hidden');
    }
}

function selectCharacter(char) {
    selectedCharacter = char;
    if (char && char.trim() !== '') {
        currentSelectedText.textContent = `「 ${char} 」`;
        btnPlay.disabled = false;
    } else {
        currentSelectedText.textContent = '（まだえらばれていません）';
        btnPlay.disabled = true;
    }
}
