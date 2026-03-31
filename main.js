/* =========================================
   🧠 じゃんけんローグライク main.js
========================================= */

let playerLife = 10;   // ★前回の変更を反映
let playerMaxLife = 10; // ★前回の変更を反映
let enemyLife = 0;
let enemyMaxLife = 0;  

let playerDamage = 1;
let damageMultipliers = { "グー": 1, "チョキ": 1, "パー": 1, "all": 1 };

// ★修正：癒し系のフラグをオブジェクト化、ゴールド倍率を追加、ロウワーのフラグを追加
let turnFlags = { healOnKill: null, goldMultiplier: 1, lowerUsed: false, lowerMultiplier: 1.2 };
let durationBuffs = { bonusDamage: 0, turnsLeft: 0 };

let currentStage = 1; 
let currentEnemyType = "normal"; 
let hasGodHand = false;
let turnCount = 0; 
let popupTimer;
const MAX_HAND_SIZE = 14; 

let initialDrawCount = 5; 
let turnDrawCount = 2;    
let activeBuffs = new Array(); 
let playedCardsThisTurn = new Array(); 
let playerGold = 0;

let deck = new Array();        
let discardPile = new Array(); 
let hand = new Array();        

let removeCount = 0;
let currentRemoveCost = 20;
let currentShopBuff = null;

// 特殊カード用の状態管理
let turnBaseAttackBonus = 0; 
let lockProbability = false; 
let poisonCountdown = 0;     
let poisonDamage = 50;

// ★新規追加：敵の虚弱（デバフ）管理
let enemyWeakCountdown = 0;
let enemyWeakMultiplier = 1.2;

// ★新規追加：訓練場の状態管理
let trainingCount = 3;

const stageData = new Array(
    { hp: 5,  probPattern: new Array(80, 10, 10) },
    { hp: 8,  probPattern: new Array(50, 40, 10) },
    { hp: 12,  probPattern: new Array(45,45,5 ) },
    { hp: 16,  probPattern: new Array(20, 20, 60) },
    { hp: 22,  probPattern: new Array(40, 40, 20) },
    { hp: 26,  probPattern: new Array(60, 20, 20) },
    { hp: 30,  probPattern: new Array(10, 80, 10) },
    { hp: 35,  probPattern: new Array(10, 10, 80) },
    { hp: 42,  probPattern: new Array(50, 25, 25) },
    { hp: 50,  probPattern: new Array(33, 33, 34) },
    { hp: 100, probPattern: new Array(34, 33, 33) } 
);

let baseEnemyProb = {};
let enemyProb = {};

// ★修正：アップグレード費用(upCost)と強化後の説明(upDesc)を追加
const cardTemplates = {
    "グーUP": { name: "最初は、、、", type: "グー", desc: "敵の✊+10%", upDesc: "敵の✊+15%", isRare: false, icon: "✊", combo: "rock", sortOrder: 1, upCost: 20 },
    "チョキUP": { name: "ハイチーズ", type: "チョキ", desc: "敵の✌️+10%", upDesc: "敵の✌️+15%", isRare: false, icon: "✌️", combo: "scissors", sortOrder: 1, upCost: 20 },
    "パーUP": { name: "ヘッドイズ", type: "パー", desc: "敵の✋+10%", upDesc: "敵の✋+15%", isRare: false, icon: "✋", combo: "paper", sortOrder: 1, upCost: 20 },
    
    "グーパン": { name: "グーパン", type: "グーパン", desc: "✊で勝った時\nダメージ3倍", upDesc: "✊で勝った時\nダメージ3.5倍", isRare: false, icon: "🥊", combo: "scissors", sortOrder: 3, upCost: 30 },
    "ビンタ": { name: "ビンタ", type: "ビンタ", desc: "✋で勝った時\nダメージ3倍", upDesc: "✋で勝った時\nダメージ3.5倍", isRare: false, icon: "👋", combo: "rock", sortOrder: 3, upCost: 30 },
    "目つぶし": { name: "目つぶし", type: "目つぶし", desc: "✌️で勝った時\nダメージ3倍", upDesc: "✌️で勝った時\nダメージ3.5倍", isRare: false, icon: "👀", combo: "paper", sortOrder: 3, upCost: 30 },
    
    "リドロー": { name: "リドロー", type: "リドロー", desc: "敵ランダム手+15%\nカードを2枚引く", upDesc: "敵ランダム手+15%\nカードを3枚引く", isRare: false, icon: "🔄", sortOrder: 2, upCost: 30 },
    "ダブル": { name: "ダブルハンド", type: "ダブル", desc: "次の攻撃ダメージ2倍", upDesc: "次の攻撃ダメージ2.5倍", isRare: false, icon: "⚔️", sortOrder: 3, upCost: 30 },
    
    "癒しグー": { name: "癒しの拳", type: "癒しグー", desc: "✊で倒すと\nライフ+1", upDesc: "✊で倒すと\nライフ+2", isRare: true, icon: "💖", combo: "rock", sortOrder: 5, upCost: 50 },
    "癒しチョキ": { name: "癒しの鋏", type: "癒しチョキ", desc: "✌️で倒すと\nライフ+1", upDesc: "✌️で倒すと\nライフ+2", isRare: true, icon: "💖", combo: "scissors", sortOrder: 5, upCost: 50 },
    "癒しパー": { name: "癒しの掌", type: "癒しパー", desc: "✋で倒すと\nライフ+1", upDesc: "✋で倒すと\nライフ+2", isRare: true, icon: "💖", combo: "paper", sortOrder: 5, upCost: 50 },
    "ハイロー": { name: "ハイ＆ロー", type: "ハイロー", desc: "このターン敵を\n倒すと獲得ロー2倍", upDesc: "このターン敵を\n倒すと獲得ロー4倍", isRare: true, icon: "🎰", sortOrder: 5, upCost: 50 },
    "カットボーン": { name: "ボーンカッター", type: "カットボーン", desc: "自傷ダメ(1)を受け\n2ターン基礎ダメ+3", upDesc: "自傷ダメ(1)を受け\n2ターン基礎ダメ+5", isRare: true, icon: "🩸", sortOrder: 5, upCost: 50 },

    "リミットブレイク": { name: "リミットブレイク", type: "リミットブレイク", desc: "手札を全捨て。捨てた枚数×2を基本攻撃力に。", upDesc: "手札を全捨て。捨てた枚数×4を基本攻撃力に。", isRare: true, icon: "💥", sortOrder: 4, upCost: 50 },
    "崖っぷち": { name: "崖っぷち", type: "崖っぷち", desc: "敵に4ターン後50ダメ。\nバトル中確率操作不可", upDesc: "敵に4ターン後100ダメ。\nバトル中確率操作不可", isRare: true, icon: "☠️", sortOrder: 4, upCost: 50 },
    
    // ★新カード：ロウワー
    "ロウワー": { name: "ロウワー", type: "ロウワー", desc: "ダメージを与えると\n敵に3ターン虚弱(1.2倍)", upDesc: "ダメージを与えると\n敵に3ターン虚弱(1.5倍)", isRare: true, icon: "📉", sortOrder: 4, upCost: 50 },

    // 強化不可（upCost: -1）
    "グパ": { name: "奥義: グパ", type: "グパ", desc: "✊と✋を同時に出す\n(使用後ターン終了)", isRare: true, icon: "✊✋", sortOrder: 4, upCost: -1 },
    "グチョ": { name: "奥義: グチョ", type: "グチョ", desc: "✊と✌️を同時に出す\n(使用後ターン終了)", isRare: true, icon: "✊✌️", sortOrder: 4, upCost: -1 },
    "チョパ": { name: "奥義: チョパ", type: "チョパ", desc: "✌️と✋を同時に出す\n(使用後ターン終了)", isRare: true, icon: "✌️✋", sortOrder: 4, upCost: -1 },
    "救済": { name: "救済", type: "救済", desc: "敵の手のどれか1つが\n100%に固定", isRare: true, icon: "👼", sortOrder: 4, upCost: -1 }
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSynthSound(waveType, freq, duration, volume) {
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = waveType; oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); 
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
    oscillator.start(); oscillator.stop(audioCtx.currentTime + duration);
}

const se = {
    win: () => { playSynthSound('triangle', 523.25, 0.1, 0.3); setTimeout(() => playSynthSound('triangle', 659.25, 0.1, 0.3), 100); setTimeout(() => playSynthSound('triangle', 783.99, 0.3, 0.3), 200); },
    lose: () => { playSynthSound('square', 220.00, 0.1, 0.2); setTimeout(() => playSynthSound('square', 196.00, 0.4, 0.2), 150); },
    tie: () => { playSynthSound('sine', 440.00, 0.2, 0.2); },
    card: () => { playSynthSound('sawtooth', 880.00, 0.05, 0.1); },
    clear: () => { playSynthSound('triangle', 783.99, 0.1, 0.2); setTimeout(() => playSynthSound('triangle', 1046.50, 0.5, 0.2), 100); },
    bomb: () => { playSynthSound('square', 110.00, 0.2, 0.4); },
    shuffle: () => { playSynthSound('sawtooth', 300.00, 0.2, 0.1); }
};

let statusBar = document.querySelector('.status-bar');

let oldLifeDisplay = document.getElementById("lifeDisplay");
if(oldLifeDisplay) oldLifeDisplay.style.display = "none";

let sideBar = document.createElement('div');
sideBar.id = "sideBar";
sideBar.style.position = "absolute";
sideBar.style.left = "10px";
sideBar.style.top = "150px"; 
sideBar.style.display = "flex";
sideBar.style.flexDirection = "column";
sideBar.style.gap = "20px";
sideBar.style.zIndex = "10";

sideBar.innerHTML = `
    <div class="clickable-info" onclick="openViewModal('deck')" style="background-color: #34495e; padding: 20px 15px; border-radius: 12px; border: 3px solid #3498db; text-align: center; width: 80px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
        <div style="font-size: 2.5em;">📚</div>
        <div style="font-weight: bold; margin-top: 5px; font-size: 0.9em;">山札</div>
        <div style="font-size: 1.8em; color: #ecf0f1; font-weight: bold; margin-top: 5px;"><span id="deckCount">0</span></div>
    </div>
    <div class="clickable-info" onclick="openViewModal('discard')" style="background-color: #34495e; padding: 20px 15px; border-radius: 12px; border: 3px solid #e74c3c; text-align: center; width: 80px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
        <div style="font-size: 2.5em;">🗑️</div>
        <div style="font-weight: bold; margin-top: 5px; font-size: 0.9em;">捨て札</div>
        <div style="font-size: 1.8em; color: #ecf0f1; font-weight: bold; margin-top: 5px;"><span id="discardCount">0</span></div>
    </div>
`;
document.querySelector('.game-container').appendChild(sideBar);
// =========================================
// 2. 中央の巨大HPボード（敵のHP専用にして大迫力に！）
// =========================================
let enemyHpBoard = document.createElement('div');
enemyHpBoard.id = "enemyHpBoard";
enemyHpBoard.style.backgroundColor = "rgba(44, 62, 80, 0.9)"; 
enemyHpBoard.style.padding = "15px 0"; 
enemyHpBoard.style.borderRadius = "12px"; 
enemyHpBoard.style.margin = "10px auto 20px auto"; 
enemyHpBoard.style.maxWidth = "600px";
enemyHpBoard.style.textAlign = "center";
enemyHpBoard.style.border = "4px solid #c0392b"; 
enemyHpBoard.style.boxShadow = "inset 0 0 20px rgba(192, 57, 43, 0.5), 0 4px 10px rgba(0,0,0,0.5)";

enemyHpBoard.innerHTML = `
    <div style="color: #e74c3c; font-weight: bold; font-size: 1.3em; margin-bottom: 5px; text-shadow: 1px 1px 0 #000; letter-spacing: 2px;">😈 敵のHP</div>
    <div style="font-size: 3.5em; color: #fff; font-weight: bold; text-shadow: 3px 3px 0 #000; font-family: 'Courier New', monospace;"><span id="enemyHpDisplay">0 / 0</span></div>
`;
statusBar.parentNode.insertBefore(enemyHpBoard, statusBar.nextSibling);

// =========================================
// 3. プレイヤーのHPボード（右上の所持金の下へ配置）
// =========================================
let playerHpBoard = document.createElement('div');
playerHpBoard.id = "playerHpBoard";
playerHpBoard.style.position = "absolute";
playerHpBoard.style.top = "60px"; // 所持金表示のすぐ下あたり
playerHpBoard.style.right = "20px"; // 画面の右端に寄せる
playerHpBoard.style.backgroundColor = "rgba(39, 174, 96, 0.9)";
playerHpBoard.style.color = "#fff";
playerHpBoard.style.padding = "10px 20px";
playerHpBoard.style.borderRadius = "8px";
playerHpBoard.style.border = "3px solid #2ecc71";
playerHpBoard.style.boxShadow = "0 4px 6px rgba(0,0,0,0.4)";
playerHpBoard.style.textAlign = "center";
playerHpBoard.style.zIndex = "10";

playerHpBoard.innerHTML = `
    <div style="font-size: 0.9em; font-weight: bold; margin-bottom: 3px; text-shadow: 1px 1px 0 #000;">🧑 あなたのHP</div>
    <div style="font-size: 1.8em; font-weight: bold; text-shadow: 2px 2px 0 #000;"><span id="playerHpDisplay">10 / 10</span></div>
`;
document.querySelector('.game-container').appendChild(playerHpBoard);

// =========================================
// ★復活：訓練場UIの動的生成（これが消えちゃってました！）
// =========================================
let trainingScreen = document.createElement('div');
trainingScreen.id = "trainingScreen";
trainingScreen.style.display = "none";
trainingScreen.style.paddingTop = "10px";
trainingScreen.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h2 style="font-size: 2em; margin: 0 !important; text-align: left;">🏕️ 訓練場</h2>
        <div style="font-size: 1.5em; color: #f1c40f; font-weight: bold; background: rgba(0,0,0,0.5); padding: 5px 15px; border-radius: 8px;">💰 所持金: <span id="trainingGoldDisplay">0</span> ロー</div>
    </div>
    <p style="font-size: 1.2em;">ローを支払ってカードをアップグレードできる。 <span style="color:#e74c3c;font-weight:bold;">残り回数: <span id="trainingCountDisplay">3</span> 回</span></p>
    <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; margin-bottom: 15px;">
        <div id="trainingCards" style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; max-height: 400px; overflow-y: auto; padding: 10px;"></div>
    </div>
    <button class="action-btn skip-btn" style="margin-top: 15px; font-size: 1.2em !important; padding: 10px 30px !important;" onclick="leaveTraining()">訓練を終える ➡️</button>
`;
document.querySelector('.game-container').appendChild(trainingScreen);

let isBattleAnimating = false; 

function getHandIconText(handStr) {
    if (handStr === "グー") return "✊";
    if (handStr === "チョキ") return "✌️";
    if (handStr === "パー") return "✋";
    if (handStr === "グパ") return "✊✋";
    if (handStr === "グチョ") return "✊✌️";
    if (handStr === "チョパ") return "✌️✋";
    return "❓";
}

function openViewModal(type) {
    let modal = document.getElementById("viewModal");
    let title = document.getElementById("viewModalTitle");
    let listArea = document.getElementById("viewCardList");
    
    modal.style.display = "flex";
    listArea.innerHTML = "";

    let targetArray = [];
    if (type === 'deck') {
        title.innerText = "📚 現在の山札";
        targetArray = Array.from(deck);
        targetArray.sort((a, b) => { if (a.sortOrder === b.sortOrder) { return a.name.localeCompare(b.name, 'ja'); } return a.sortOrder - b.sortOrder; });
    } else if (type === 'discard') {
        title.innerText = "🗑️ 現在の捨て札";
        targetArray = Array.from(discardPile);
        targetArray.sort((a, b) => { if (a.sortOrder === b.sortOrder) { return a.name.localeCompare(b.name, 'ja'); } return a.sortOrder - b.sortOrder; });
    }

    if (targetArray.length === 0) {
        listArea.innerHTML = "<span style='color:#bdc3c7; font-size:1.5em; padding:20px;'>カードがありません</span>";
        return;
    }

    targetArray.forEach((card) => {
        let cardDiv = document.createElement("div");
        cardDiv.className = card.isRare ? "card rare view-only-card" : "card view-only-card";
        if (card.combo) { cardDiv.classList.add("combo-" + card.combo); }
        cardDiv.style.setProperty('--rot', '0deg'); cardDiv.style.setProperty('--ty', '0px');
        
        let safeName = (card.isUpgraded ? "✨" : "") + (card.name || "不明");
        let safeDesc = card.isUpgraded ? (card.upDesc || card.desc) : card.desc;
        let safeIcon = card.icon || "❓";
        
        cardDiv.innerHTML = `<div class="card-name">${safeName}</div><div class="card-icon">${safeIcon}</div><div class="card-desc" style="font-size:0.7em;">${safeDesc}</div>`;
        listArea.appendChild(cardDiv);
    });
}

function closeViewModal() {
    document.getElementById("viewModal").style.display = "none";
}

function updateDeckUI() {
    let dCount = document.getElementById("deckCount"); let discCount = document.getElementById("discardCount");
    if(dCount && discCount) { dCount.innerText = deck.length; discCount.innerText = discardPile.length; }
}

function updateHistoryUI() {
    let container = document.getElementById("historyCards");
    if (!container) return;
    if (playedCardsThisTurn.length === 0) { container.innerHTML = "<span style='color: #7f8c8d; font-weight: normal;'>まだ使っていない</span>"; return; }
    container.innerHTML = "";
    playedCardsThisTurn.forEach(card => {
        let span = document.createElement("span"); span.className = "history-card"; span.innerHTML = `${card.icon} ${card.name}`; container.appendChild(span);
    });
}

function updateDamagePreview() {
    let base = (playerDamage + durationBuffs.bonusDamage + turnBaseAttackBonus) * damageMultipliers.all;
    let rockDmg = base * damageMultipliers["グー"]; 
    let scissorsDmg = base * damageMultipliers["チョキ"]; 
    let paperDmg = base * damageMultipliers["パー"];
    
    let pRock = document.getElementById("previewRock"); let pScissors = document.getElementById("previewScissors"); let pPaper = document.getElementById("previewPaper");
    if(pRock) pRock.innerText = `⚔️ 予想ダメ: ${rockDmg}`; if(pScissors) pScissors.innerText = `⚔️ 予想ダメ: ${scissorsDmg}`; if(pPaper) pPaper.innerText = `⚔️ 予想ダメ: ${paperDmg}`;
}

function updateGoldDisplay() {
    let gDisp = document.getElementById("goldDisplay");
    if(gDisp) { gDisp.innerText = `💰 ${playerGold} ロー`; }
    let shopDisp = document.getElementById("shopGoldDisplay");
    if(shopDisp) { shopDisp.innerText = `💰 所持金: ${playerGold} ロー`; }
}

function initDeck() {
    deck = new Array(); discardPile = new Array();
    
    for(let i=0; i<7; i++) { deck.push({ ...cardTemplates["グーUP"] }); }
    for(let i=0; i<7; i++) { deck.push({ ...cardTemplates["チョキUP"] }); }
    for(let i=0; i<7; i++) { deck.push({ ...cardTemplates["パーUP"] }); }
    
    for(let i=0; i<4; i++) { deck.push({ ...cardTemplates["リドロー"] }); }
    for(let i=0; i<4; i++) { deck.push({ ...cardTemplates["ダブル"] }); }

    for(let i=0; i<2; i++) { deck.push({ ...cardTemplates["グーパン"] }); }
    for(let i=0; i<2; i++) { deck.push({ ...cardTemplates["ビンタ"] }); }
    for(let i=0; i<2; i++) { deck.push({ ...cardTemplates["目つぶし"] }); }
    
    deck.push({ ...cardTemplates["グチョ"] });
    deck.push({ ...cardTemplates["グパ"] });
    deck.push({ ...cardTemplates["チョパ"] });
    deck.push({ ...cardTemplates["救済"] });

    shuffleDeck();
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) { let j = Math.floor(Math.random() * (i + 1)); let temp = deck[i]; deck[i] = deck[j]; deck[j] = temp; }
}

function drawCards(num) {
    // 引く枚数が0以下なら何もしない（終了条件）
    if (num <= 0) return;

    let discardedDueToLimit = false;

    // 1枚引く処理
    if (deck.length === 0) {
        if (discardPile.length === 0) { 
            // 山札も捨て札も完全に空なら終了
            updateDeckUI();
            return; 
        }
        // 山札が空ならリシャッフル
        deck = Array.from(discardPile); discardPile = new Array(); shuffleDeck(); se.shuffle(); 
        let resText = document.getElementById("resultText"); resText.innerText = "🔄 山札が空になった！捨て札をシャッフルして再構築！\n" + resText.innerText;
    }

    let drawnCard = deck.pop();
    if (drawnCard) {
        if (hand.length >= MAX_HAND_SIZE) { 
            discardPile.push(drawnCard); discardedDueToLimit = true; 
        } else {
            // ★重要：新しく引いたカードにフラグを立てる
            drawnCard.isNewDraw = true;
            hand.push(drawnCard);
            
            // カードが移動する「シュッ」という音を出す（お好みでse.card()などに変えてもOK）
            // playSynthSound('sawtooth', 880.00, 0.05, 0.1); 
        }
    }

    if (discardedDueToLimit) {
        let resText = document.getElementById("resultText");
        resText.innerText = "⚠️ 手札が上限（" + MAX_HAND_SIZE + "枚）のため、引いたカードは捨てられました！\n" + resText.innerText;
    }

    // 1枚引いた状態で手札を再描画（ここでアニメーションが発動）
    renderHand(); updateDeckUI();

    // ★最重要：少し時間を置いてから、次の1枚を引く（自分自身を呼び出す）
    setTimeout(() => {
        drawCards(num - 1); // 枚数を1枚減らして、また引く
    }, 400); // ここが「バババッ」の間隔。0.1秒（100ms）。
}

function renderHand() {
    let handArea = document.getElementById("handArea"); handArea.innerHTML = "";
    hand.sort((a, b) => { if (a.sortOrder === b.sortOrder) { return a.name.localeCompare(b.name, 'ja'); } return a.sortOrder - b.sortOrder; });
    let totalCards = hand.length; let middleIndex = (totalCards - 1) / 2;
    hand.forEach((card, index) => {
        let cardDiv = document.createElement("div");
        cardDiv.className = card.isRare ? "card rare" : "card";
        
        if (card.combo) { cardDiv.classList.add("combo-" + card.combo); }
        let distanceFromCenter = index - middleIndex; let rotationAngle = distanceFromCenter * 5; let yOffset = Math.pow(distanceFromCenter, 2) * 2; 
        cardDiv.style.setProperty('--rot', rotationAngle + 'deg'); cardDiv.style.setProperty('--ty', yOffset + 'px');
        if (index !== 0) { let overlap = totalCards > 5 ? -50 : -30; cardDiv.style.marginLeft = overlap + "px"; }
        
        let safeName = (card.isUpgraded ? "✨" : "") + (card.name || "不明");
        let safeDesc = card.isUpgraded ? (card.upDesc || card.desc) : card.desc;
        let safeIcon = card.icon || "❓";
        cardDiv.innerHTML = `<div class="card-name">${safeName}</div><div class="card-icon">${safeIcon}</div><div class="card-desc" style="font-size:0.7em;">${safeDesc}</div>`;
        
        // ★新規追加：アニメーション用のフラグ管理
        // カードオブジェクトに「isNewDraw」というフラグが立っていたら、クラスを付与する
        if (card.isNewDraw) {
            cardDiv.classList.add("card-drawing");
            
            // アニメーションが終わる頃（0.5秒後）にクラスを外して、クリック可能にする
            setTimeout(() => {
                cardDiv.classList.remove("card-drawing");
                card.isNewDraw = false; // フラグをおろす
            }, 500);
        }

        cardDiv.onclick = function() { useCard(index); }; handArea.appendChild(cardDiv);
    });
}

function showPopup(type, title, detail) {
    let popup = document.getElementById("battlePopup"); let pTitle = document.getElementById("popupTitle"); let pDetail = document.getElementById("popupDetail");
    popup.className = ""; pTitle.innerText = title; pDetail.innerText = detail;
    if (type === "win") popup.classList.add("popup-win", "show"); else if (type === "lose") popup.classList.add("popup-lose", "show"); else popup.classList.add("popup-tie", "show");
    clearTimeout(popupTimer); popupTimer = setTimeout(() => { popup.classList.remove("show"); }, 1200);
}

// =========================================
// ★修正：ダメージエフェクトの出現位置を調整
// =========================================
function spawnDamageEffect(damageAmount, isPlayer = false) {
    let damageText = document.createElement("div"); 
    damageText.innerText = "-" + damageAmount; 
    damageText.className = "damage-popup";
    
    // プレイヤーへのダメージか、敵へのダメージかで基準位置を切り替える
    let targetId = isPlayer ? "playerHpBoard" : "enemyHpBoard";
    let targetBoard = document.getElementById(targetId);
    
    if (targetBoard) {
        let rect = targetBoard.getBoundingClientRect();
        // 敵ならボードの右側、自分ならボードの左側あたりに出現させる
        let popX = isPlayer ? (rect.left - 50) : (rect.right - 60);
        damageText.style.left = popX + "px"; 
        damageText.style.top = (rect.top + window.scrollY) + "px"; 
    }
    
    document.body.appendChild(damageText);
    setTimeout(() => { damageText.remove(); }, 1000);
}

function updateTurnDisplay() {
    let displayElement = document.getElementById("turnDisplay");
    
    // 虚弱のターン数も画面に出す
    if (enemyWeakCountdown > 0) {
        displayElement.style.display = "inline-block";
        displayElement.innerText = `📉 敵は虚弱状態 (残り${enemyWeakCountdown}T)`;
        displayElement.style.backgroundColor = "#8e44ad";
        displayElement.style.color = "#fff";
        return;
    }

    if (currentEnemyType !== "elite" && currentEnemyType !== "boss") { displayElement.style.display = "none"; return; }
    displayElement.style.display = "inline-block";
    let turnsLeft = 10 - turnCount;
    displayElement.innerText = (currentEnemyType === "boss" ? "👑 ボス" : "💀 強敵") + "の大技まで: " + turnsLeft;
    if (turnsLeft <= 3) { displayElement.style.backgroundColor = "#c0392b"; displayElement.style.color = "#fff"; } 
    else { displayElement.style.backgroundColor = "#000"; displayElement.style.color = "#e74c3c"; }
}

function setRandomBaseProb() {
    let data = stageData.at(currentStage - 1);
    let pattern = Array.from(data.probPattern);
    for (let i = pattern.length - 1; i > 0; i--) { let j = Math.floor(Math.random() * (i + 1)); let temp = pattern.at(i); pattern[i] = pattern.at(j); pattern[j] = temp; }
    baseEnemyProb = { "グー": pattern.at(0), "チョキ": pattern.at(1), "パー": pattern.at(2) };
    enemyProb = { ...baseEnemyProb }; updateProbDisplay();
}

function showRewardScreen() {
    document.getElementById("battleScreen").style.display = "none";
    document.getElementById("routeScreen").style.display = "none";
    document.getElementById("shopScreen").style.display = "none";
    document.getElementById("trainingScreen").style.display = "none";
    document.getElementById("eliteRewardScreen").style.display = "none";
    document.getElementById("rewardScreen").style.display = "block";
    
    let normalKeys = Object.keys(cardTemplates).filter(k => !cardTemplates[k].isRare);
    let rareKeys = Object.keys(cardTemplates).filter(k => cardTemplates[k].isRare);
    
    let chosenKeys = new Array();
    while (chosenKeys.length < 3) {
        let isRareSlot = Math.random() < 0.2; 
        let keyPool = isRareSlot ? rareKeys : normalKeys;
        let randomKey = keyPool.at(Math.floor(Math.random() * keyPool.length));
        
        if (chosenKeys.includes(randomKey) === false) { chosenKeys.push(randomKey); }
    }

    let rewardArea = document.getElementById("rewardCards");
    rewardArea.innerHTML = "";
    chosenKeys.forEach((key) => {
        let card = cardTemplates[key];
        let cardDiv = document.createElement("div");
        cardDiv.className = card.isRare ? "card rare" : "card";
        if (card.combo) { cardDiv.classList.add("combo-" + card.combo); }
        cardDiv.style.setProperty('--rot', '0deg'); cardDiv.style.setProperty('--ty', '0px');
        cardDiv.innerHTML = `<div class="card-name">${card.name}</div><div class="card-icon">${card.icon}</div><div class="card-desc" style="font-size:0.7em;">${card.desc}</div>`;
        cardDiv.onclick = function() {
            se.card(); deck.push({ ...card }); 
            document.getElementById("rewardScreen").style.display = "none"; advanceStage(); 
        };
        rewardArea.appendChild(cardDiv);
    });
}

function skipReward() {
    se.card(); document.getElementById("rewardScreen").style.display = "none"; advanceStage();
}

function showEliteRewardScreen() {
    document.getElementById("battleScreen").style.display = "none";
    document.getElementById("eliteRewardScreen").style.display = "block";
}

function chooseEliteBuff(buffType) {
    se.win();
    if (buffType === "レドロー") { initialDrawCount += 2; activeBuffs.push("🎴 レドロー(初期手札+2)"); } 
    else { turnDrawCount += 1; activeBuffs.push("🃏 プドロー(毎ターン+1)"); }
    
    document.getElementById("buffBar").style.display = "block"; document.getElementById("buffList").innerText = activeBuffs.join(", ");
    document.getElementById("eliteRewardScreen").style.display = "none";
    showRewardScreen(); 
}

// =========================================
// ★新規追加：訓練場システム
// =========================================
function generateTrainingCamp() {

    trainingCount = 3;
    document.getElementById("trainingCountDisplay").innerText = trainingCount;
    document.getElementById("trainingGoldDisplay").innerText = playerGold;
    
    let listArea = document.getElementById("trainingCards");
    listArea.innerHTML = "";
    
    deck.sort((a, b) => { if (a.sortOrder === b.sortOrder) { return a.name.localeCompare(b.name, 'ja'); } return a.sortOrder - b.sortOrder; });
    
    deck.forEach((card) => {
        let cardWrapper = document.createElement("div");
        cardWrapper.className = "shop-card-wrapper";
        cardWrapper.style.margin = "5px";
        
        let cardDiv = document.createElement("div");
        cardDiv.className = card.isRare ? "card rare view-only-card" : "card view-only-card";
        if (card.combo) { cardDiv.classList.add("combo-" + card.combo); }
        cardDiv.style.setProperty('--rot', '0deg'); cardDiv.style.setProperty('--ty', '0px');
        
        let safeName = (card.isUpgraded ? "✨" : "") + (card.name || "不明");
        let safeDesc = card.isUpgraded ? (card.upDesc || card.desc) : card.desc;
        let safeIcon = card.icon || "❓";
        cardDiv.innerHTML = `<div class="card-name">${safeName}</div><div class="card-icon">${safeIcon}</div><div class="card-desc" style="font-size:0.7em;">${safeDesc}</div>`;
        
        let upBtn = document.createElement("button");
        upBtn.className = "action-btn";
        upBtn.style.fontSize = "0.9em"; upBtn.style.padding = "5px 15px"; upBtn.style.margin = "8px 0 0 0";
        
        if (card.isUpgraded) {
            upBtn.innerText = "強化済";
            upBtn.disabled = true;
            upBtn.style.backgroundColor = "#2ecc71";
        } else if (card.upCost < 0) {
            upBtn.innerText = "強化不可";
            upBtn.disabled = true;
            upBtn.style.backgroundColor = "#7f8c8d";
        } else {
            upBtn.innerText = `強化(${card.upCost}ﾛｰ)`;
            upBtn.onclick = function() {
                if (trainingCount <= 0) {
                    alert("強化回数の上限（3回）に達しています！");
                    return;
                }
                if (playerGold >= card.upCost) {
                    playerGold -= card.upCost;
                    trainingCount--;
                    card.isUpgraded = true;
                    se.win();
                    
                    document.getElementById("trainingCountDisplay").innerText = trainingCount;
                    document.getElementById("trainingGoldDisplay").innerText = playerGold;
                    updateGoldDisplay();
                    
                    upBtn.innerText = "強化済";
                    upBtn.disabled = true;
                    upBtn.style.backgroundColor = "#2ecc71";
                    cardDiv.querySelector('.card-name').innerText = "✨" + card.name;
                    cardDiv.querySelector('.card-desc').innerText = card.upDesc || card.desc;
                } else {
                    se.lose(); alert("ローが足りない！");
                }
            };
        }
        cardWrapper.appendChild(cardDiv);
        cardWrapper.appendChild(upBtn);
        listArea.appendChild(cardWrapper);
    });
}

function leaveTraining() {
    document.getElementById("trainingScreen").style.display = "none";

    advanceStage();
}
// =========================================

function generateShop() {
    removeCount = 0; currentRemoveCost = 20;
    document.getElementById("removeCostDisplay").innerText = currentRemoveCost;
    document.getElementById("removeLimitDisplay").innerText = "残り 3 回";
    document.getElementById("removeLimitDisplay").style.color = "#e74c3c";
    document.getElementById("btnRemoveCard").disabled = false;
    updateGoldDisplay();

    let normalKeys = Object.keys(cardTemplates).filter(k => cardTemplates[k].isRare === false);
    let rareKeys = Object.keys(cardTemplates).filter(k => cardTemplates[k].isRare === true);
    
    let shopCardsArea = document.getElementById("shopCards");
    shopCardsArea.innerHTML = "";
    
    for(let i=0; i<6; i++) {
        let isRareSlot = Math.random() < 0.15; 
        let keyPool = isRareSlot ? rareKeys : normalKeys;
        
        let randomKey = keyPool.at(Math.floor(Math.random() * keyPool.length));
        let card = cardTemplates[randomKey];
        let cost = card.isRare ? 200 : 50;

        let cardWrapper = document.createElement("div");
        cardWrapper.className = "shop-card-wrapper";
        
        let cardDiv = document.createElement("div");
        cardDiv.className = card.isRare ? "card rare" : "card";
        if (card.combo) { cardDiv.classList.add("combo-" + card.combo); }
        cardDiv.style.setProperty('--rot', '0deg'); cardDiv.style.setProperty('--ty', '0px');
        cardDiv.innerHTML = `<div class="card-name">${card.name}</div><div class="card-icon">${card.icon}</div><div class="card-desc" style="font-size:0.7em;">${card.desc}</div>`;
        
        let buyBtn = document.createElement("button");
        buyBtn.innerText = `${cost} ロー`;
        buyBtn.className = "action-btn";
        buyBtn.style.fontSize = "0.9em"; buyBtn.style.padding = "5px 15px"; buyBtn.style.margin = "8px 0 0 0";
        
        buyBtn.onclick = function() {
            if (playerGold >= cost) {
                playerGold -= cost;
                deck.push({ ...card }); 
                se.win(); updateGoldDisplay();
                buyBtn.innerText = "SOLD OUT"; buyBtn.disabled = true; buyBtn.style.backgroundColor = "#7f8c8d";
                cardDiv.style.opacity = "0.4"; 
            } else {
                se.lose(); alert("お金が足りないよ！");
            }
        };
        cardWrapper.appendChild(cardDiv); cardWrapper.appendChild(buyBtn); shopCardsArea.appendChild(cardWrapper);
    }

    const buffList = [
        { name: "❤️ 命の泉 (最大ライフ+2)", type: "life" },
        { name: "💪 筋力増強 (基礎ダメ+1)", type: "damage" },
        { name: "🎴 レドロー (初期手札+2)", type: "draw" },
        { name: "🃏 プドロー (毎ターンドロー+1)", type: "turnDraw" }
    ];
    currentShopBuff = buffList.at(Math.floor(Math.random() * buffList.length));
    document.getElementById("shopBuffName").innerText = currentShopBuff.name;
    document.getElementById("btnBuyBuff").disabled = false;
    document.getElementById("btnBuyBuff").innerText = "購入 (1000 ロー)";
    document.getElementById("btnBuyBuff").style.backgroundColor = "#f1c40f";
}

function buyShopBuff() {
    if (playerGold >= 1000) {
        playerGold -= 1000; se.clear(); updateGoldDisplay();
        
        if(currentShopBuff.type === "life") { 
            playerMaxLife += 2; 
            playerLife += 2; 
            updateLifeDisplay(); 
        } 
        else if (currentShopBuff.type === "damage") { playerDamage += 1; } 
        else if (currentShopBuff.type === "draw") { initialDrawCount += 2; } 
        else if (currentShopBuff.type === "turnDraw") { turnDrawCount += 1; }
        
        activeBuffs.push(currentShopBuff.name);
        document.getElementById("buffBar").style.display = "block";
        document.getElementById("buffList").innerText = activeBuffs.join(", ");
        
        let btn = document.getElementById("btnBuyBuff");
        btn.disabled = true; btn.innerText = "SOLD OUT"; btn.style.backgroundColor = "#7f8c8d";
    } else { se.lose(); alert("お金が足りないよ！オーバーキルで稼ごう！"); }
}

function openRemoveModal() {
    if (playerGold < currentRemoveCost) { se.lose(); alert("お金が足りないよ！"); return; }
    document.getElementById("removeModal").style.display = "flex";
    let listArea = document.getElementById("removeCardList"); listArea.innerHTML = "";
    deck.sort((a, b) => { if (a.sortOrder === b.sortOrder) { return a.name.localeCompare(b.name, 'ja'); } return a.sortOrder - b.sortOrder; });
    deck.forEach((card, index) => {
        let cardDiv = document.createElement("div");
        cardDiv.className = card.isRare ? "card rare" : "card";
        if (card.combo) { cardDiv.classList.add("combo-" + card.combo); }
        cardDiv.style.setProperty('--rot', '0deg'); cardDiv.style.setProperty('--ty', '0px');
        
        let safeName = (card.isUpgraded ? "✨" : "") + (card.name || "不明");
        let safeDesc = card.isUpgraded ? (card.upDesc || card.desc) : card.desc;
        cardDiv.innerHTML = `<div class="card-name">${safeName}</div><div class="card-icon">${card.icon}</div><div class="card-desc" style="font-size:0.7em;">${safeDesc}</div>`;
        
        cardDiv.onclick = function() {
            if (confirm(`【${currentRemoveCost}ロー】支払って「${safeName}」を完全に削除しますか？`)) {
                playerGold -= currentRemoveCost; deck.splice(index, 1); 
                removeCount++; currentRemoveCost += 20; 
                se.bomb(); updateGoldDisplay(); updateDeckUI();
                
                if (removeCount >= 3) {
                    document.getElementById("btnRemoveCard").disabled = true;
                    document.getElementById("removeLimitDisplay").innerText = "削除上限に達しました";
                    document.getElementById("removeLimitDisplay").style.color = "#7f8c8d";
                    document.getElementById("removeCostDisplay").innerText = "-";
                } else {
                    document.getElementById("removeCostDisplay").innerText = currentRemoveCost;
                    document.getElementById("removeLimitDisplay").innerText = `残り ${3 - removeCount} 回`;
                }
                closeRemoveModal();
            }
        };
        listArea.appendChild(cardDiv);
    });
}
function closeRemoveModal() { document.getElementById("removeModal").style.display = "none"; }

function startEncounter(type) {
    currentEnemyType = type;
    document.getElementById("routeScreen").style.display = "none";
    document.getElementById("shopScreen").style.display = "none";
    document.getElementById("rewardScreen").style.display = "none";
    document.getElementById("eliteRewardScreen").style.display = "none";
    document.getElementById("trainingScreen").style.display = "none"; // 訓練場も隠す
    document.getElementById("battleScreen").style.display = "block";
    
    let data = stageData.at(currentStage - 1);
    enemyLife = data.hp;
    if (type === "elite") { enemyLife = Math.floor(enemyLife * 1.5); }
    enemyMaxLife = enemyLife; 
    
    damageMultipliers = { "グー": 1, "チョキ": 1, "パー": 1, "all": 1 };
    
    // ★フラグ初期化（虚弱やロウワーも）
    turnFlags = { healOnKill: null, goldMultiplier: 1, lowerUsed: false, lowerMultiplier: 1.2 };
    durationBuffs = { bonusDamage: 0, turnsLeft: 0 };
    turnCount = 0; 
    
    turnBaseAttackBonus = 0;
    lockProbability = false;
    poisonCountdown = 0;
    enemyWeakCountdown = 0;
    
    playedCardsThisTurn = new Array();
    updateHistoryUI();
    updateDamagePreview();
    updateGoldDisplay();

    let stageName = "🚩 ステージ " + currentStage;
    if (type === "boss") stageName = "👑 最終ボス (Stage 11)";
    else if (type === "elite") stageName = "💀 強敵 (Stage " + currentStage + ")";

    document.getElementById("stageDisplay").innerText = stageName;
    
    setRandomBaseProb(); updateLifeDisplay(); updateTurnDisplay();
    document.getElementById("btnRock").disabled = false; document.getElementById("btnScissors").disabled = false; document.getElementById("btnPaper").disabled = false;
}

function advanceStage() {
    currentStage++;
    deck = deck.concat(hand).concat(discardPile);
    hand = new Array(); discardPile = new Array(); shuffleDeck();

    if (currentStage === 11) { 
        startEncounter("boss"); drawCards(initialDrawCount); 
    } 
    // ステージ3, 6, 9のバトルをクリアした直後（Stage 4, 7, 10）に訓練場を出す
    else if (currentStage === 4 || currentStage === 7 || currentStage === 10) {
        document.getElementById("battleScreen").style.display = "none";
        document.getElementById("routeScreen").style.display = "none";
        document.getElementById("rewardScreen").style.display = "none";
        document.getElementById("trainingScreen").style.display = "block";
        document.getElementById("stageDisplay").innerText = "🏕️ 訓練場 (Stage " + currentStage + ")";
        generateTrainingCamp();
    } 
    // 分岐画面はStage 5に出す
    else if (currentStage === 5) {
        document.getElementById("battleScreen").style.display = "none";
        document.getElementById("routeScreen").style.display = "block";
        document.getElementById("stageDisplay").innerText = "🗺️ 分岐 (Stage " + currentStage + ")";
    } 
    else { 
        startEncounter("normal"); drawCards(initialDrawCount); 
    }
}

function chooseRoute(route) {
    if (route === "shop") {
        document.getElementById("routeScreen").style.display = "none";
        document.getElementById("shopScreen").style.display = "block";
        document.getElementById("stageDisplay").innerText = "🛒 ショップ (Stage " + currentStage + ")";
        generateShop(); 
    } else {
        startEncounter(route); drawCards(initialDrawCount); 
    }
}

function leaveShop() { advanceStage(); }

function changeProb(targetHand, amount) {
    if (lockProbability) {
        document.getElementById("resultText").innerText = "⚠️ 崖っぷちの効果で確率操作ができない！\n" + document.getElementById("resultText").innerText;
        return;
    }

    let others = Object.keys(enemyProb).filter(key => key !== targetHand);
    if (others.length !== 2) return;
    let handA = others.at(0); let handB = others.at(1); let totalOthers = enemyProb[handA] + enemyProb[handB];
    let actualAdd = Math.min(amount, totalOthers); if (actualAdd <= 0) return;
    enemyProb[targetHand] += actualAdd;
    if (totalOthers > 0) { let reduceA = actualAdd * (enemyProb[handA] / totalOthers); let reduceB = actualAdd * (enemyProb[handB] / totalOthers); enemyProb[handA] -= reduceA; enemyProb[handB] -= reduceB; }
    for(let key in enemyProb) { if(enemyProb[key] < 0) enemyProb[key] = 0; if(enemyProb[key] > 100) enemyProb[key] = 100; }
}

function updateProbDisplay() {
    let rockDisp = Math.round(enemyProb["グー"]); let scissorsDisp = Math.round(enemyProb["チョキ"]); let paperDisp = 100 - rockDisp - scissorsDisp;
    if (paperDisp < 0) { scissorsDisp += paperDisp; paperDisp = 0; }
    let recHand = "❓ 分散中 (どれでもOK)"; let recColor = "#bdc3c7"; 
    if (rockDisp >= 51) { recHand = "✋ パー"; recColor = "#3498db"; } else if (scissorsDisp >= 51) { recHand = "✊ グー"; recColor = "#e74c3c"; } else if (paperDisp >= 51) { recHand = "✌️ チョキ"; recColor = "#2ecc71"; }
    document.getElementById("probDisplay").innerHTML = `
        <div style="font-size: 0.55em; color: #ecf0f1; margin-bottom: 5px;">🧠 敵の思考（出す確率）</div>
        <div class="enemy-prob-container">
            <div class="prob-box prob-rock">✊<div class="prob-val">${rockDisp}%</div></div>
            <div class="prob-box prob-scissors">✌️<div class="prob-val">${scissorsDisp}%</div></div>
            <div class="prob-box prob-paper">✋<div class="prob-val">${paperDisp}%</div></div>
        </div>
        <div class='rec-hand' style='color:${recColor}; margin-top: 15px;'>💡 おすすめ手: ${recHand}</div>
    `;
}

function updateLifeDisplay() { 
    let pDisplay = document.getElementById("playerHpDisplay");
    let eDisplay = document.getElementById("enemyHpDisplay");
    if(pDisplay) pDisplay.innerText = `${playerLife} / ${playerMaxLife}`;
    if(eDisplay) eDisplay.innerText = `${Math.max(0, enemyLife)} / ${enemyMaxLife}`;
}

function useCard(index) {
    let card = hand.at(index); 
    if (!card) return; 

    if (card.type === "カットボーン") {
        let selfDmg = Math.max(1, Math.floor(playerLife * 0.1));
        if (playerLife - selfDmg <= 0) {
            se.lose(); alert("これ以上血を流すと死んでしまう！"); return; 
        }
        se.bomb(); playerLife -= selfDmg; updateLifeDisplay();
        // ★修正：アップグレード効果反映
        durationBuffs.bonusDamage += card.isUpgraded ? 5 : 3; 
        durationBuffs.turnsLeft = 2; 
        playedCardsThisTurn.push(card); updateHistoryUI();
        hand.splice(index, 1); discardPile.push(card); updateDeckUI();
        updateDamagePreview(); renderHand();
        document.querySelector('.game-container').classList.add('shake'); 
        setTimeout(() => { document.querySelector('.game-container').classList.remove('shake'); }, 500);
        return;
    }

    se.card();
    playedCardsThisTurn.push(card); updateHistoryUI();
    hand.splice(index, 1); discardPile.push(card); updateDeckUI();

    if (card.type === "グパ" || card.type === "グチョ" || card.type === "チョパ") { renderHand(); playGame(card.type); return; }
    
    // ★以下、各カードのアップグレード（card.isUpgraded）での効果分岐
    if (card.type === "リドロー") {
        let handsArray = new Array("グー", "チョキ", "パー"); let randomTarget = handsArray.at(Math.floor(Math.random() * handsArray.length));
        changeProb(randomTarget, 15); updateProbDisplay(); drawCards(card.isUpgraded ? 3 : 2); 
    } else if (card.type === "救済") {
        let handsArray = new Array("グー", "チョキ", "パー"); let target = handsArray.at(Math.floor(Math.random() * handsArray.length));
        enemyProb["グー"] = 0; enemyProb["チョキ"] = 0; enemyProb["パー"] = 0; enemyProb[target] = 100; updateProbDisplay();
    } else if (card.type === "ダブル") { damageMultipliers.all *= card.isUpgraded ? 2.5 : 2; } 
    else if (card.type === "グーパン") { damageMultipliers["グー"] *= card.isUpgraded ? 3.5 : 3; } 
    else if (card.type === "目つぶし") { damageMultipliers["チョキ"] *= card.isUpgraded ? 3.5 : 3; } 
    else if (card.type === "ビンタ") { damageMultipliers["パー"] *= card.isUpgraded ? 3.5 : 3; } 
    else if (card.type === "癒しグー") { turnFlags.healOnKill = { hand: "グー", amount: card.isUpgraded ? 2 : 1 }; } 
    else if (card.type === "癒しチョキ") { turnFlags.healOnKill = { hand: "チョキ", amount: card.isUpgraded ? 2 : 1 }; } 
    else if (card.type === "癒しパー") { turnFlags.healOnKill = { hand: "パー", amount: card.isUpgraded ? 2 : 1 }; } 
    else if (card.type === "ハイロー") { turnFlags.goldMultiplier = card.isUpgraded ? 4 : 2; } 
    
    else if (card.type === "リミットブレイク") {
        let discardCount = hand.length;
        let addAtk = discardCount * (card.isUpgraded ? 4 : 2);
        turnBaseAttackBonus += addAtk;
        discardPile.push(...hand);
        hand = [];
        se.bomb();
        document.getElementById("resultText").innerText = `💥 リミットブレイク！${discardCount}枚捨てて基礎攻撃力が+${addAtk}された！`;
    } 
    else if (card.type === "崖っぷち") {
        poisonCountdown = 4; 
        poisonDamage = card.isUpgraded ? 100 : 50;
        lockProbability = true; 
        se.bomb();
        document.getElementById("resultText").innerText = `☠️ 崖っぷち！4ターン後に${poisonDamage}ダメージ。確率操作が封印された！`;
    } 
    else if (card.type === "ロウワー") {
        turnFlags.lowerUsed = true;
        turnFlags.lowerMultiplier = card.isUpgraded ? 1.5 : 1.2;
        se.bomb();
        document.getElementById("resultText").innerText = `📉 ロウワー準備完了！このターン攻撃を当てれば敵を「虚弱」にできる！`;
    }
    // 確率アップ系（共通処理）
    else { changeProb(card.type, card.isUpgraded ? 15 : 10); updateProbDisplay(); }
    
    updateDamagePreview(); renderHand();
}

function decideEnemyHand() {
    let rand = Math.random() * 100;
    if (rand < enemyProb["グー"]) return "グー"; else if (rand < enemyProb["グー"] + enemyProb["チョキ"]) return "チョキ"; else return "パー";
}

function playGame(playerHand) {
    // 演出中は他のボタンを押せないようにブロックする！
    if (isBattleAnimating) return;
    isBattleAnimating = true;

    turnCount++; updateTurnDisplay();
    let container = document.querySelector('.game-container'); let statusBar = document.querySelector('.status-bar');
    let body = document.body;

    if ((currentEnemyType === "elite" || currentEnemyType === "boss") && turnCount >= 10) {
        playerLife = 0; updateLifeDisplay(); 
        showPopup("lose", "ANNIHILATED", "タイムオーバー：即死攻撃"); se.bomb(); container.classList.add('shake'); disableButtons(); 
        isBattleAnimating = false;
        return; 
    }

    // まず相手の手を裏側でコッソリ決めておく
    let enemyHand = decideEnemyHand(); 

    // --- 演出フェーズ ---
    // 前の演出が残っていたら消す
    let oldOverlay = document.getElementById("handOverlay");
    if(oldOverlay) oldOverlay.remove();

    // 手を出すための専用レイヤーを作る
    let overlay = document.createElement("div");
    overlay.id = "handOverlay";
    document.body.appendChild(overlay);

    let enemyZone = document.createElement("div");
    enemyZone.className = "enemy-zone";
    overlay.appendChild(enemyZone);

    let playerZone = document.createElement("div");
    playerZone.className = "player-zone";
    overlay.appendChild(playerZone);

    // 【1】まず、自分の手を画面下部に出現させる！
    let pHandDiv = document.createElement("div");
    pHandDiv.className = "show-hand";
    pHandDiv.innerText = getHandIconText(playerHand);
    playerZone.appendChild(pHandDiv);
    
    // シュッという音（必要に応じて変えてね）
    playSynthSound('sawtooth', 440.00, 0.1, 0.1); 

    // 【2】0.4秒後（400ms後）に、相手の手を画面上部に出現させる！
    setTimeout(() => {
        let eHandDiv = document.createElement("div");
        eHandDiv.className = "show-hand";
        eHandDiv.innerText = getHandIconText(enemyHand);
        enemyZone.appendChild(eHandDiv);
        
        playSynthSound('square', 330.00, 0.1, 0.1);

        // 【3】0.08秒後（80ms後）に、一気に勝敗の判定とフラッシュ演出を爆発させる！
        setTimeout(() => {
            
            // 演出用レイヤーは、ポップアップが消える頃（1秒後）にフワッと消す
            setTimeout(() => {
                overlay.style.opacity = 0;
                setTimeout(() => overlay.remove(), 300);
            }, 1000);

            // --- 判定・ダメージ処理フェーズ（これ以降は元のコードと同じ！） ---
            let isWin = false; let isTie = false;
            if (playerHand === "グパ") { if (enemyHand === "チョキ" || enemyHand === "グー") { isWin = true; } else { isTie = true; } } 
            else if (playerHand === "グチョ") { if (enemyHand === "パー" || enemyHand === "チョキ") { isWin = true; } else { isTie = true; } } 
            else if (playerHand === "チョパ") { if (enemyHand === "グー" || enemyHand === "パー") { isWin = true; } else { isTie = true; } } 
            else { if (playerHand === enemyHand) { isTie = true; } else if ((playerHand === "グー" && enemyHand === "チョキ") || (playerHand === "チョキ" && enemyHand === "パー") || (playerHand === "パー" && enemyHand === "グー")) { isWin = true; } }

            let detailText = playerHand + " VS " + enemyHand;
            let overkillAmount = 0;

            if (isWin === true) {
                let finalDamage = (playerDamage + durationBuffs.bonusDamage + turnBaseAttackBonus) * damageMultipliers.all; 
                if (playerHand === "グー") finalDamage *= damageMultipliers["グー"]; else if (playerHand === "チョキ") finalDamage *= damageMultipliers["チョキ"]; else if (playerHand === "パー") finalDamage *= damageMultipliers["パー"];
                
                if (enemyWeakCountdown > 0) { finalDamage = Math.floor(finalDamage * enemyWeakMultiplier); }

                if (finalDamage > enemyLife) { overkillAmount = finalDamage - enemyLife; }
                enemyLife -= finalDamage;
                se.win(); statusBar.classList.add('status-bar-win'); setTimeout(() => statusBar.classList.remove('status-bar-win'), 1000); 
                spawnDamageEffect(finalDamage); showPopup("win", "WIN!!", detailText); 

                if (turnFlags.lowerUsed) {
                    enemyWeakCountdown = 3; enemyWeakMultiplier = turnFlags.lowerMultiplier;
                    alert(`📉 ロウワー成功！敵は3ターンの間「虚弱（被ダメ${enemyWeakMultiplier}倍）」になった！`);
                }

                if (playerHand === "グー") {
                    body.classList.add("win-rock"); 
                    playSynthSound('square', 110.00, 0.3, 0.5); 
                } else if (playerHand === "チョキ") {
                    body.classList.add("win-scissors"); 
                    playSynthSound('sawtooth', 600.00, 0.2, 0.4); 
                } else if (playerHand === "パー") {
                    body.classList.add("win-paper"); 
                    playSynthSound('sine', 440.00, 0.4, 0.3); 
                }
                
                setTimeout(() => {
                    body.classList.remove("win-rock", "win-scissors", "win-paper");
                }, 800);

            } else if (isTie === true) {
                se.tie(); showPopup("tie", "DRAW", detailText);
            } else {
                playerLife--; se.lose(); showPopup("lose", "LOSE...", detailText); container.classList.add('shake'); setTimeout(() => { container.classList.remove('shake'); }, 500);
            }

            updateLifeDisplay();

            if (poisonCountdown > 0 && enemyLife > 0) {
                poisonCountdown--;
                if (poisonCountdown === 0) {
                    enemyLife -= poisonDamage; se.bomb(); spawnDamageEffect(poisonDamage);
                    alert(`☠️ 崖っぷちの毒が発動！敵に${poisonDamage}ダメージ！`);
                    updateLifeDisplay();
                } else {
                    document.getElementById("resultText").innerText = `☠️ 毒発動まであと ${poisonCountdown} ターン...\n` + document.getElementById("resultText").innerText;
                }
            }

            if (enemyWeakCountdown > 0) {
                enemyWeakCountdown--;
                if (enemyWeakCountdown === 0) { document.getElementById("resultText").innerText = `📉 敵の虚弱が回復した。\n` + document.getElementById("resultText").innerText; }
            }

            if (playerLife <= 0) {
                disableButtons(); 
                isBattleAnimating = false; // ロック解除
                return;
            } else if (enemyLife <= 0) {
                body.classList.add("finish-effect");
                
                playSynthSound('square', 55.00, 1.0, 0.8); 
                playSynthSound('noise', 0, 1.5, 0.6); 
                
                setTimeout(() => {
                    let baseReward = 20;
                    if (currentEnemyType === "elite") baseReward = 40;
                    if (currentEnemyType === "boss") baseReward = 100;
                    let earnedGold = (baseReward + overkillAmount) * turnFlags.goldMultiplier;
                    
                    if (turnFlags.goldMultiplier > 1) {
                        alert(`🎰 ハイ＆ロー発動！獲得ローが${turnFlags.goldMultiplier}倍になった！（+${earnedGold}ロー）`);
                    }
                    playerGold += earnedGold; updateGoldDisplay();

                    if (turnFlags.healOnKill && turnFlags.healOnKill.hand === playerHand) {
                        playerLife = Math.min(playerLife + turnFlags.healOnKill.amount, playerMaxLife);
                        updateLifeDisplay();
                        alert(`💖 癒しの力が発動！ライフが${turnFlags.healOnKill.amount}回復した！`);
                    }

                    body.classList.remove("finish-effect");
                    se.clear(); disableButtons();
                    
                    if (currentStage === 3) {
                        playerMaxLife += 1; playerLife += 1; hasGodHand = true; playerDamage = 2; 
                        activeBuffs.push("❤️ ライフプラス (+1)"); activeBuffs.push("✊ ゴッドハンド (基礎ダメ2倍)");
                        document.getElementById("buffBar").style.display = "block"; document.getElementById("buffList").innerText = activeBuffs.join(", ");
                    }
                    
                    setTimeout(() => { 
                        if (currentStage >= 11) { alert("🎉 最終ボスを撃破！！完全クリアおめでとう！！ 🎉"); } 
                        else if (currentEnemyType === "elite") { showEliteRewardScreen(); } 
                        else { showRewardScreen(); }
                    }, 1000); 

                    isBattleAnimating = false; // 完全に終了したらロック解除

                }, 3000); 
                
                return; 
            }

            damageMultipliers = { "グー": 1, "チョキ": 1, "パー": 1, "all": 1 };
            turnFlags = { healOnKill: null, goldMultiplier: 1, lowerUsed: false, lowerMultiplier: 1.2 };
            turnBaseAttackBonus = 0;

            if (durationBuffs.turnsLeft > 0) {
                durationBuffs.turnsLeft--;
                if (durationBuffs.turnsLeft === 0) { durationBuffs.bonusDamage = 0; }
            }
            
            playedCardsThisTurn = new Array(); updateHistoryUI(); updateDamagePreview(); updateTurnDisplay();
            setRandomBaseProb(); drawCards(turnDrawCount);
            
            // ターン終了時にロック解除
            isBattleAnimating = false;

        }, 400); // ここが0.08秒（80ms）のタメ！！！

    }, 600); // ここが0.4秒のタメ！！！
}

function disableButtons() {
    document.getElementById("btnRock").disabled = true; document.getElementById("btnScissors").disabled = true; document.getElementById("btnPaper").disabled = true; document.getElementById("handArea").innerHTML = "";
}

initDeck(); startEncounter("normal"); drawCards(initialDrawCount); updateGoldDisplay();