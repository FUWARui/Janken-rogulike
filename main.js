/* =========================================
   🧠 じゃんけんローグライク main.js
========================================= */

let playerLife = 10;
let playerMaxLife = 10; 
let enemyLife = 0;
let enemyMaxLife = 0;  

let playerDamage = 1;
let damageMultipliers = { "グー": 1, "チョキ": 1, "パー": 1, "all": 1 };

let turnFlags = { healOnKill: null, doubleGoldOnKill: false };
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

const stageData = new Array(
    { hp: 5,  probPattern: new Array(80, 10, 10) },
    { hp: 8,  probPattern: new Array(50, 40, 10) },
    { hp: 12,  probPattern: new Array(34, 33, 33) },
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

const cardTemplates = {
    "グーUP": { name: "最初は、、、", type: "グー", desc: "敵の✊+10%", isRare: false, icon: "✊", combo: "rock", sortOrder: 1 },
    "ビンタ": { name: "ビンタ", type: "ビンタ", desc: "✋で勝った時\nダメージ3倍", isRare: false, icon: "👋", combo: "rock", sortOrder: 3 },
    "チョキUP": { name: "ハイチーズ", type: "チョキ", desc: "敵の✌️+10%", isRare: false, icon: "✌️", combo: "scissors", sortOrder: 1 },
    "グーパン": { name: "グーパン", type: "グーパン", desc: "✊で勝った時\nダメージ3倍", isRare: false, icon: "🥊", combo: "scissors", sortOrder: 3 },
    "パーUP": { name: "ヘッドイズ", type: "パー", desc: "敵の✋+10%", isRare: false, icon: "✋", combo: "paper", sortOrder: 1 },
    "目つぶし": { name: "目つぶし", type: "目つぶし", desc: "✌️で勝った時\nダメージ3倍", isRare: false, icon: "👀", combo: "paper", sortOrder: 3 },
    "リドロー": { name: "リドロー", type: "リドロー", desc: "敵のランダムな手+15%\nカードを2枚引く", isRare: false, icon: "🔄", sortOrder: 2 },
    "ダブル": { name: "ダブルハンド", type: "ダブル", desc: "次の攻撃ダメージ2倍", isRare: false, icon: "⚔️", sortOrder: 3 },
    
    "癒しグー": { name: "癒しの拳", type: "癒しグー", desc: "このターン✊で\n敵を倒すとライフ+1", isRare: true, icon: "💖", combo: "rock", sortOrder: 5 },
    "癒しチョキ": { name: "癒しの鋏", type: "癒しチョキ", desc: "このターン✌️で\n敵を倒すとライフ+1", isRare: true, icon: "💖", combo: "scissors", sortOrder: 5 },
    "癒しパー": { name: "癒しの掌", type: "癒しパー", desc: "このターン✋で\n敵を倒すとライフ+1", isRare: true, icon: "💖", combo: "paper", sortOrder: 5 },
    "ハイロー": { name: "ハイ＆ロー", type: "ハイロー", desc: "このターン敵を\n倒すと獲得ロー2倍", isRare: true, icon: "🎰", sortOrder: 5 },
    "カットボーン": { name: "ボーンカッター", type: "カットボーン", desc: "自傷ダメ(最低1)を受け\n2ターン基礎ダメ+3", isRare: true, icon: "🩸", sortOrder: 5 },

    "グパ": { name: "奥義: グパ", type: "グパ", desc: "✊と✋を同時に出す\n(使用後ターン終了)", isRare: true, icon: "✊✋", sortOrder: 4 },
    "グチョ": { name: "奥義: グチョ", type: "グチョ", desc: "✊と✌️を同時に出す\n(使用後ターン終了)", isRare: true, icon: "✊✌️", sortOrder: 4 },
    "チョパ": { name: "奥義: チョパ", type: "チョパ", desc: "✌️と✋を同時に出す\n(使用後ターン終了)", isRare: true, icon: "✌️✋", sortOrder: 4 },
    "救済": { name: "救済", type: "救済", desc: "敵の手のどれか1つが\n100%に固定", isRare: true, icon: "👼", sortOrder: 4 },

    "リミットブレイク": { name: "リミットブレイク", type: "リミットブレイク", desc: "手札を全捨て。捨てた枚数×2をこのターンの基本攻撃力に足す。", isRare: true, icon: "💥", sortOrder: 4 },
    "崖っぷち": { name: "崖っぷち", type: "崖っぷち", desc: "敵に4ターン後50ダメージ。バトル中確率操作不可。", isRare: true, icon: "☠️", sortOrder: 4 }
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

// =========================================
// UIレイアウト（左サイドバー＆中央HPボード）
// =========================================
let statusBar = document.querySelector('.status-bar');

let oldLifeDisplay = document.getElementById("lifeDisplay");
if(oldLifeDisplay) oldLifeDisplay.style.display = "none";

let sideBar = document.createElement('div');
sideBar.id = "sideBar";
sideBar.style.position = "absolute";
sideBar.style.left = "30px";
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

let hpInfoDiv = document.createElement('div');
hpInfoDiv.id = "hpInfo";
hpInfoDiv.style.backgroundColor = "#2c3e50"; 
hpInfoDiv.style.padding = "10px 0"; 
hpInfoDiv.style.borderRadius = "12px"; 
hpInfoDiv.style.margin = "10px auto 15px auto"; 
hpInfoDiv.style.maxWidth = "700px";
hpInfoDiv.style.display = "flex"; 
hpInfoDiv.style.justifyContent = "center"; 
hpInfoDiv.style.border = "3px solid #7f8c8d"; 
hpInfoDiv.style.boxShadow = "inset 0 4px 6px rgba(0,0,0,0.3)";

hpInfoDiv.innerHTML = `
    <div style="flex: 1; text-align: center; border-right: 2px solid #34495e; padding: 5px;">
        <div style="color: #2ecc71; font-weight: bold; font-size: 1.1em; margin-bottom: 5px;">🧑 あなたのHP</div>
        <div style="font-size: 2em; color: #fff; font-weight: bold; text-shadow: 2px 2px 0 #000;"><span id="playerHpDisplay">3 / 3</span></div>
    </div>
    <div style="flex: 1; text-align: center; padding: 5px;">
        <div style="color: #e74c3c; font-weight: bold; font-size: 1.1em; margin-bottom: 5px;">😈 敵のHP</div>
        <div style="font-size: 2em; color: #fff; font-weight: bold; text-shadow: 2px 2px 0 #000;"><span id="enemyHpDisplay">0 / 0</span></div>
    </div>
`;
statusBar.parentNode.insertBefore(hpInfoDiv, statusBar.nextSibling);

// =========================================
// 山札・捨て札確認モーダル（閲覧専用）
// =========================================
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
        
        let safeName = card.name || "不明";
        let safeIcon = card.icon || "❓";
        let safeDesc = card.desc || "";
        cardDiv.innerHTML = `<div class="card-name">${safeName}</div><div class="card-icon">${safeIcon}</div><div class="card-desc">${safeDesc}</div>`;
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

// =========================================
// ★修正：初期デッキを固定の構成に変更
// =========================================
function initDeck() {
    deck = new Array(); discardPile = new Array();
    
    // 最初は、、、（グーUP） 各7枚
    for(let i=0; i<7; i++) { deck.push({ ...cardTemplates["グーUP"] }); }
    // ハイチーズ（チョキUP） 各7枚
    for(let i=0; i<7; i++) { deck.push({ ...cardTemplates["チョキUP"] }); }
    // ヘッドイズ（パーUP） 各7枚
    for(let i=0; i<7; i++) { deck.push({ ...cardTemplates["パーUP"] }); }
    
    // リドロー 4枚
    for(let i=0; i<4; i++) { deck.push({ ...cardTemplates["リドロー"] }); }
    // ダブルハンド（ダブル） 4枚
    for(let i=0; i<4; i++) { deck.push({ ...cardTemplates["ダブル"] }); }

    // グーパン 2枚
    for(let i=0; i<2; i++) { deck.push({ ...cardTemplates["グーパン"] }); }
    // ビンタ 2枚
    for(let i=0; i<2; i++) { deck.push({ ...cardTemplates["ビンタ"] }); }
    // 目つぶし 2枚
    for(let i=0; i<2; i++) { deck.push({ ...cardTemplates["目つぶし"] }); }
    
    // 奥義＆救済 各1枚
    deck.push({ ...cardTemplates["グチョ"] });
    deck.push({ ...cardTemplates["グパ"] });
    deck.push({ ...cardTemplates["チョパ"] });
    deck.push({ ...cardTemplates["救済"] });
    
    // ※癒し系、ハイロー、カットボーン、新カード（リミットブレイク等）は初期デッキから除外
    // これらはショップや戦闘報酬でのみ手に入ります！

    shuffleDeck();
}
// =========================================

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) { let j = Math.floor(Math.random() * (i + 1)); let temp = deck[i]; deck[i] = deck[j]; deck[j] = temp; }
}

function drawCards(num) {
    let discardedDueToLimit = false; 
    for(let i = 0; i < num; i++) {
        if (deck.length === 0) {
            if (discardPile.length === 0) { break; }
            deck = Array.from(discardPile); discardPile = new Array(); shuffleDeck(); se.shuffle(); 
            let resText = document.getElementById("resultText"); resText.innerText = "🔄 山札が空になった！捨て札をシャッフルして山札を再構築！\n" + resText.innerText;
        }
        let drawnCard = deck.pop();
        if (drawnCard) {
            if (hand.length >= MAX_HAND_SIZE) { discardPile.push(drawnCard); discardedDueToLimit = true; } 
            else { hand.push(drawnCard); }
        }
    }
    if (discardedDueToLimit) {
        let resText = document.getElementById("resultText");
        resText.innerText = "⚠️ 手札が上限（" + MAX_HAND_SIZE + "枚）のため、引いたカードは捨てられました！\n" + resText.innerText;
    }
    renderHand(); updateDeckUI();
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
        
        let safeName = card.name || "不明";
        let safeIcon = card.icon || "❓";
        let safeDesc = card.desc || "";
        cardDiv.innerHTML = `<div class="card-name">${safeName}</div><div class="card-icon">${safeIcon}</div><div class="card-desc">${safeDesc}</div>`;
        
        cardDiv.onclick = function() { useCard(index); }; handArea.appendChild(cardDiv);
    });
}

function showPopup(type, title, detail) {
    let popup = document.getElementById("battlePopup"); let pTitle = document.getElementById("popupTitle"); let pDetail = document.getElementById("popupDetail");
    popup.className = ""; pTitle.innerText = title; pDetail.innerText = detail;
    if (type === "win") popup.classList.add("popup-win", "show"); else if (type === "lose") popup.classList.add("popup-lose", "show"); else popup.classList.add("popup-tie", "show");
    clearTimeout(popupTimer); popupTimer = setTimeout(() => { popup.classList.remove("show"); }, 1200);
}

function spawnDamageEffect(damageAmount) {
    let damageText = document.createElement("div"); damageText.innerText = "-" + damageAmount; damageText.className = "damage-popup";
    let lifeDisplay = document.getElementById("playerHpDisplay"); 
    let rect = lifeDisplay.getBoundingClientRect();
    damageText.style.left = (rect.right + 20) + "px"; damageText.style.top = (rect.top + window.scrollY - 30) + "px"; document.body.appendChild(damageText);
    setTimeout(() => { damageText.remove(); }, 1000);
}

function updateTurnDisplay() {
    let displayElement = document.getElementById("turnDisplay");
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
        cardDiv.innerHTML = `<div class="card-name">${card.name}</div><div class="card-icon">${card.icon}</div><div class="card-desc">${card.desc}</div>`;
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
        cardDiv.innerHTML = `<div class="card-name">${card.name}</div><div class="card-icon">${card.icon}</div><div class="card-desc">${card.desc}</div>`;
        
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
        cardDiv.innerHTML = `<div class="card-name">${card.name}</div><div class="card-icon">${card.icon}</div><div class="card-desc">${card.desc}</div>`;
        cardDiv.onclick = function() {
            if (confirm(`【${currentRemoveCost}ロー】支払って「${card.name}」を完全に削除しますか？`)) {
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
    document.getElementById("battleScreen").style.display = "block";
    
    let data = stageData.at(currentStage - 1);
    enemyLife = data.hp;
    if (type === "elite") { enemyLife = Math.floor(enemyLife * 1.5); }
    enemyMaxLife = enemyLife; 
    
    damageMultipliers = { "グー": 1, "チョキ": 1, "パー": 1, "all": 1 };
    turnFlags = { healOnKill: null, doubleGoldOnKill: false };
    durationBuffs = { bonusDamage: 0, turnsLeft: 0 };
    turnCount = 0; 
    
    turnBaseAttackBonus = 0;
    lockProbability = false;
    poisonCountdown = 0;
    
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

    if (currentStage === 5 || currentStage === 10) {
        document.getElementById("battleScreen").style.display = "none";
        document.getElementById("routeScreen").style.display = "block";
        document.getElementById("stageDisplay").innerText = "🗺️ 分岐 (Stage " + currentStage + ")";
    } else if (currentStage === 11) { 
        startEncounter("boss"); drawCards(initialDrawCount); 
    } else { 
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
        durationBuffs.bonusDamage += 3; durationBuffs.turnsLeft = 2; 
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
    
    if (card.type === "リドロー") {
        let handsArray = new Array("グー", "チョキ", "パー"); let randomTarget = handsArray.at(Math.floor(Math.random() * handsArray.length));
        changeProb(randomTarget, 15); updateProbDisplay(); drawCards(2); 
    } else if (card.type === "救済") {
        let handsArray = new Array("グー", "チョキ", "パー"); let target = handsArray.at(Math.floor(Math.random() * handsArray.length));
        enemyProb["グー"] = 0; enemyProb["チョキ"] = 0; enemyProb["パー"] = 0; enemyProb[target] = 100; updateProbDisplay();
    } else if (card.type === "ダブル") { damageMultipliers.all *= 2; } 
    else if (card.type === "グーパン") { damageMultipliers["グー"] *= 3; } 
    else if (card.type === "目つぶし") { damageMultipliers["チョキ"] *= 3; } 
    else if (card.type === "ビンタ") { damageMultipliers["パー"] *= 3; } 
    else if (card.type === "癒しグー") { turnFlags.healOnKill = "グー"; } 
    else if (card.type === "癒しチョキ") { turnFlags.healOnKill = "チョキ"; } 
    else if (card.type === "癒しパー") { turnFlags.healOnKill = "パー"; } 
    else if (card.type === "ハイロー") { turnFlags.doubleGoldOnKill = true; } 
    
    else if (card.type === "リミットブレイク") {
        let discardCount = hand.length;
        turnBaseAttackBonus += (discardCount * 2);
        discardPile.push(...hand);
        hand = [];
        se.bomb();
        document.getElementById("resultText").innerText = `💥 リミットブレイク！${discardCount}枚捨てて基礎攻撃力が+${discardCount * 2}された！`;
    } 
    else if (card.type === "崖っぷち") {
        poisonCountdown = 4; 
        lockProbability = true; 
        se.bomb();
        document.getElementById("resultText").innerText = `☠️ 崖っぷち！4ターン後に50ダメージ。確率操作が封印された！`;
    } 

    else { changeProb(card.type, 10); updateProbDisplay(); }
    
    updateDamagePreview(); renderHand();
}

function decideEnemyHand() {
    let rand = Math.random() * 100;
    if (rand < enemyProb["グー"]) return "グー"; else if (rand < enemyProb["グー"] + enemyProb["チョキ"]) return "チョキ"; else return "パー";
}

function playGame(playerHand) {
    turnCount++; updateTurnDisplay();
    let container = document.querySelector('.game-container'); let statusBar = document.querySelector('.status-bar');

    if ((currentEnemyType === "elite" || currentEnemyType === "boss") && turnCount >= 10) {
        playerLife = 0; updateLifeDisplay(); 
        showPopup("lose", "ANNIHILATED", "タイムオーバー：即死攻撃"); se.bomb(); container.classList.add('shake'); disableButtons(); return; 
    }

    let enemyHand = decideEnemyHand(); let isWin = false; let isTie = false;
    if (playerHand === "グパ") { if (enemyHand === "チョキ" || enemyHand === "グー") { isWin = true; } else { isTie = true; } } 
    else if (playerHand === "グチョ") { if (enemyHand === "パー" || enemyHand === "チョキ") { isWin = true; } else { isTie = true; } } 
    else if (playerHand === "チョパ") { if (enemyHand === "グー" || enemyHand === "パー") { isWin = true; } else { isTie = true; } } 
    else { if (playerHand === enemyHand) { isTie = true; } else if ((playerHand === "グー" && enemyHand === "チョキ") || (playerHand === "チョキ" && enemyHand === "パー") || (playerHand === "パー" && enemyHand === "グー")) { isWin = true; } }

    let detailText = playerHand + " VS " + enemyHand;
    let overkillAmount = 0;

    if (isWin === true) {
        let finalDamage = (playerDamage + durationBuffs.bonusDamage + turnBaseAttackBonus) * damageMultipliers.all; 
        if (playerHand === "グー") finalDamage *= damageMultipliers["グー"]; else if (playerHand === "チョキ") finalDamage *= damageMultipliers["チョキ"]; else if (playerHand === "パー") finalDamage *= damageMultipliers["パー"];
        
        if (finalDamage > enemyLife) { overkillAmount = finalDamage - enemyLife; }
        enemyLife -= finalDamage;
        se.win(); statusBar.classList.add('status-bar-win'); setTimeout(() => statusBar.classList.remove('status-bar-win'), 1000); 
        spawnDamageEffect(finalDamage); showPopup("win", "WIN!!", detailText); 
    } else if (isTie === true) {
        se.tie(); showPopup("tie", "DRAW", detailText);
    } else {
        playerLife--; se.lose(); showPopup("lose", "LOSE...", detailText); container.classList.add('shake'); setTimeout(() => { container.classList.remove('shake'); }, 500);
    }

    updateLifeDisplay();

    if (poisonCountdown > 0 && enemyLife > 0) {
        poisonCountdown--;
        if (poisonCountdown === 0) {
            enemyLife -= 50;
            se.bomb();
            spawnDamageEffect(50);
            alert("☠️ 崖っぷちの毒が発動！敵に50ダメージ！");
            updateLifeDisplay();
        } else {
            document.getElementById("resultText").innerText = `☠️ 毒発動まであと ${poisonCountdown} ターン...\n` + document.getElementById("resultText").innerText;
        }
    }

    if (playerLife <= 0) {
        disableButtons(); return;
    } else if (enemyLife <= 0) {
        let baseReward = 20;
        if (currentEnemyType === "elite") baseReward = 40;
        if (currentEnemyType === "boss") baseReward = 100;
        
        let earnedGold = baseReward + overkillAmount;
        
        if (turnFlags.doubleGoldOnKill === true) {
            earnedGold *= 2;
            alert("🎰 ハイ＆ロー発動！獲得ローが2倍になった！（+" + earnedGold + "ロー）");
        }
        playerGold += earnedGold;
        updateGoldDisplay();

        if (turnFlags.healOnKill === playerHand) {
            playerLife = Math.min(playerLife + 1, playerMaxLife);
            updateLifeDisplay();
            alert("💖 癒しの力が発動！指定の手でトドメを刺し、ライフが1回復した！");
        }

        se.clear(); disableButtons();
        
        if (currentStage === 3) {
            playerMaxLife += 1; 
            playerLife += 1; hasGodHand = true; playerDamage = 2; 
            activeBuffs.push("❤️ ライフプラス (+1)"); activeBuffs.push("✊ ゴッドハンド (基礎ダメ2倍)");
            document.getElementById("buffBar").style.display = "block"; document.getElementById("buffList").innerText = activeBuffs.join(", ");
        }
        
        setTimeout(() => { 
            if (currentStage >= 11) { alert("🎉 最終ボスを撃破！！完全クリアおめでとう！！ 🎉"); } 
            else if (currentEnemyType === "elite") { showEliteRewardScreen(); } 
            else { showRewardScreen(); }
        }, 1500); 
        return;
    }

    damageMultipliers = { "グー": 1, "チョキ": 1, "パー": 1, "all": 1 };
    turnFlags = { healOnKill: null, doubleGoldOnKill: false };
    
    turnBaseAttackBonus = 0;

    if (durationBuffs.turnsLeft > 0) {
        durationBuffs.turnsLeft--;
        if (durationBuffs.turnsLeft === 0) { durationBuffs.bonusDamage = 0; }
    }
    
    playedCardsThisTurn = new Array();
    updateHistoryUI();
    updateDamagePreview();

    setRandomBaseProb(); drawCards(turnDrawCount);
}

function disableButtons() {
    document.getElementById("btnRock").disabled = true; document.getElementById("btnScissors").disabled = true; document.getElementById("btnPaper").disabled = true; document.getElementById("handArea").innerHTML = "";
}

initDeck(); startEncounter("normal"); drawCards(initialDrawCount); updateGoldDisplay();