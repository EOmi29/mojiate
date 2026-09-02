// ===================================================
// 文字データ
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

// 追加：アルファベット（7列段組み）
const ALPHABET_UPPER_CHARS = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G',
    'H', 'I', 'J', 'K', 'L', 'M', 'N',
    'O', 'P', 'Q', 'R', 'S', 'T', 'U',
    'V', 'W', 'X', 'Y', 'Z', ' ', ' '
];

const ALPHABET_LOWER_CHARS = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g',
    'h', 'i', 'j', 'k', 'l', 'm', 'n',
    'o', 'p', 'q', 'r', 's', 't', 'u',
    'v', 'w', 'x', 'y', 'z', ' ', ' '
];

// ===================================================
// 状態管理変数
// ===================================================
let currentMode = 'hiragana';
let selectedCharacter = '';
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
const btnRandomAlpha = document.getElementById('btn-random-alpha'); // 追加

const tabHiragana = document.getElementById('tab-hiragana');
const tabKatakana = document.getElementById('tab-katakana');
const tabKanji = document.getElementById('tab-kanji');
const tabAlphabet = document.getElementById('tab-alphabet'); // 追加

const boardContainer = document.getElementById('board-container');
const syuonBoard = document.getElementById('syuon-board');
const kanjiContainer = document.getElementById('kanji-container');
const kanjiInput = document.getElementById('kanji-input');

// 追加：アルファベット用コンテナ
const alphabetContainer = document.getElementById('alphabet-container');
const alphabetUpperBoard = document.getElementById('alphabet-upper-board');
const alphabetLowerBoard = document.getElementById('alphabet-lower-board');

const errorMessage = document.getElementById('error-message');
const currentSelectedText = document.getElementById('current-selected-text');

const gameArea = document.getElementById('game-area');
const hiddenText = document.getElementById('hidden-text');
const darkOverlay = document.getElementById('dark-overlay');
const guideGrid = document.getElementById('guide-grid'); // 追加
const sizeButtons = document.querySelectorAll('.btn-size');

// 追加：アルファベット専用SVG（文字・罫線を同じ座標系で管理）
const alphabetTextSvg = document.getElementById('alphabet-text-svg');
const alphabetHiddenText = document.getElementById('alphabet-hidden-text');
const alphabetGuideSvg = document.getElementById('alphabet-guide-svg');

// ===================================================
// 懐中電灯（画像版）エレメント生成
// ===================================================
const flashlightElement = document.createElement('div');
flashlightElement.id = 'flashlight-tool';
flashlightElement.innerHTML = `<img src="light.png" id="flashlight-img" alt="懐中電灯">`;
gameArea.appendChild(flashlightElement);

// ===================================================
// 初期化とイベントリスナー
// ===================================================
createBoard(HIRAGANA_CHARS, syuonBoard);

btnStart.addEventListener('click', () => switchPage(pageSetup));
btnBackToTop.addEventListener('click', () => switchPage(pageTop));
tabHiragana.addEventListener('click', () => changeMode('hiragana'));
tabKatakana.addEventListener('click', () => changeMode('katakana'));
tabKanji.addEventListener('click', () => changeMode('kanji'));
tabAlphabet.addEventListener('click', () => changeMode('alphabet')); // 追加

// ひらがな・カタカナのランダム
btnRandom.addEventListener('click', () => {
    let chars = currentMode === 'hiragana' ? HIRAGANA_CHARS : KATAKANA_CHARS;
    let validChars = chars.filter(c => c.trim() !== '');
    let char = validChars[Math.floor(Math.random() * validChars.length)];
    updateBoardSelection(char);
    selectCharacter(char);
});

// アルファベットのランダム
btnRandomAlpha.addEventListener('click', () => {
    let allChars = [...ALPHABET_UPPER_CHARS, ...ALPHABET_LOWER_CHARS].filter(c => c.trim() !== '');
    let char = allChars[Math.floor(Math.random() * allChars.length)];
    updateBoardSelection(char);
    selectCharacter(char);
});

kanjiInput.addEventListener('input', () => {
    let val = kanjiInput.value;
    if (val.length === 1) {
        errorMessage.classList.add('hidden');
        selectCharacter(val);
    } else if (val.length > 1) {
        errorMessage.classList.remove('hidden');
        selectCharacter('');
    } else {
        errorMessage.classList.add('hidden');
        selectCharacter('');
    }
});

btnPlay.addEventListener('click', () => {
    // 【1】アルファベットモードかどうかで、表示する文字レイヤーを切り替える
    if (currentMode === 'alphabet') {
        // SVG側（文字＋ベースライン基準の罫線）を表示
        alphabetHiddenText.textContent = selectedCharacter;
        alphabetTextSvg.classList.remove('hidden');
        alphabetGuideSvg.classList.remove('hidden');
        // 通常のひらがな等の表示は隠す
        hiddenText.classList.add('hidden');
        guideGrid.classList.add('hidden');
    } else {
        hiddenText.textContent = selectedCharacter;
        hiddenText.classList.remove('hidden');
        guideGrid.classList.remove('hidden');
        alphabetTextSvg.classList.add('hidden');
        alphabetGuideSvg.classList.add('hidden');
    }

    // 【2】ライトの初期化処理
    currentLightSize = 35;
    sizeButtons.forEach(b => {
        if(b.getAttribute('data-size') === '80') b.classList.add('active');
        else b.classList.remove('active');
    });

    pageGame.classList.remove('revealed');
    btnReveal.classList.remove('hidden');
    btnBackToSetup.classList.add('hidden');
    flashlightElement.style.display = 'block';
    
    const rect = gameArea.getBoundingClientRect();
    updateLightPosition(rect.width / 2, rect.height / 2);
    
    switchPage(pageGame);
});
btnReveal.addEventListener('click', () => {
    pageGame.classList.add('revealed');
    btnReveal.classList.add('hidden');
    btnBackToSetup.classList.remove('hidden');
    flashlightElement.style.display = 'none';
});

btnBackToSetup.addEventListener('click', () => switchPage(pageSetup));

// ===================================================
// ライトの移動・座標計算処理
// ===================================================
function handleMove(e) {
    if (pageGame.classList.contains('revealed')) return;
    const rect = gameArea.getBoundingClientRect();
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        updateLightPosition(x, y);
    }
}

function updateLightPosition(touchX, touchY) {
    const angleRad = -30 * (Math.PI / 180); 
    const distance = currentLightSize + 75; 
    const lightX = touchX + distance * Math.cos(angleRad);
    const lightY = touchY + distance * Math.sin(angleRad);

    darkOverlay.style.setProperty('--light-x', `${lightX}px`);
    darkOverlay.style.setProperty('--light-y', `${lightY}px`);
    darkOverlay.style.setProperty('--light-size', `${currentLightSize}px`);

    flashlightElement.style.left = `${touchX}px`;
    flashlightElement.style.top = `${touchY}px`;
}

gameArea.addEventListener('mousemove', handleMove);
gameArea.addEventListener('touchstart', (e) => handleMove(e), { passive: true });
gameArea.addEventListener('touchmove', handleMove, { passive: true });

// ===================================================
// ライトサイズ変更
// ===================================================
sizeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        sizeButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        const rawSize = e.currentTarget.getAttribute('data-size');
        if (rawSize === '80') currentLightSize = 35;  
        else if (rawSize === '150') currentLightSize = 65; 
        else if (rawSize === '250') currentLightSize = 110; 
        
        const x = parseFloat(flashlightElement.style.left) || 0;
        const y = parseFloat(flashlightElement.style.top) || 0;
        if(x > 0 && y > 0) updateLightPosition(x, y);
    });
});

// ===================================================
// サポート関数
// ===================================================
function switchPage(targetPage) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    targetPage.classList.add('active');
}

// どのボードに描画するかを指定できるように改修
function createBoard(chars, targetElement) {
    targetElement.innerHTML = '';
    chars.forEach(char => {
        const btn = document.createElement('button');
        if (char === ' ') {
            btn.className = 'char-btn empty';
        } else {
            btn.className = 'char-btn';
            btn.textContent = char;
            btn.addEventListener('click', () => {
                updateBoardSelection(char);
                selectCharacter(char);
            });
        }
        targetElement.appendChild(btn);
    });
}

function updateBoardSelection(char) {
    document.querySelectorAll('.char-btn').forEach(b => {
        b.classList.remove('selected');
        if (b.textContent === char) b.classList.add('selected');
    });
}

function changeMode(mode) {
    currentMode = mode;
    
    // 全てのタブとコンテナを一旦リセット
    ['hiragana', 'katakana', 'kanji', 'alphabet'].forEach(m => {
        document.getElementById(`tab-${m}`).classList.remove('active');
    });
    boardContainer.classList.add('hidden');
    kanjiContainer.classList.add('hidden');
    alphabetContainer.classList.add('hidden');

    selectCharacter('');
    kanjiInput.value = '';
    errorMessage.classList.add('hidden');

    // 選択されたモードの表示
    if (mode === 'hiragana') {
        tabHiragana.classList.add('active');
        boardContainer.classList.remove('hidden');
        createBoard(HIRAGANA_CHARS, syuonBoard);
    } else if (mode === 'katakana') {
        tabKatakana.classList.add('active');
        boardContainer.classList.remove('hidden');
        createBoard(KATAKANA_CHARS, syuonBoard);
    } else if (mode === 'kanji') {
        tabKanji.classList.add('active');
        kanjiContainer.classList.remove('hidden');
    } else if (mode === 'alphabet') {
        tabAlphabet.classList.add('active');
        alphabetContainer.classList.remove('hidden');
        createBoard(ALPHABET_UPPER_CHARS, alphabetUpperBoard);
        createBoard(ALPHABET_LOWER_CHARS, alphabetLowerBoard);
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
