let playerLife = 3;
        let enemyLife = 0;
        let playerDamage = 1;
        let hand = new Array();
        let currentStage = 1;
        let hasGodHand = false;
        
        let turnCount = 0; 
        let popupTimer;

        const stages = new Array(
            { hp: 5, probPattern: new Array(80, 10, 10) },
            { hp: 8, probPattern: new Array(50, 40, 10) },
            { hp: 15, probPattern: new Array(34, 33, 33) }
        );

        let baseEnemyProb = {};
        let enemyProb = {};

        const cardPool = new Array(
            { name: "ハイチーズ", type: "チョキ", desc: "敵の✌️+10%", weight: 30, isRare: false, icon: "✌️" },
            { name: "最初は、、、", type: "グー", desc: "敵の✊+10%", weight: 30, isRare: false, icon: "✊" },
            { name: "ヘッドイズ", type: "パー", desc: "敵の✋+10%", weight: 30, isRare: false, icon: "✋" },
            { name: "ダブルハンド", type: "ダブル", desc: "次の攻撃ダメージ2倍", weight: 15, isRare: false, icon: "⚔️" },
            { name: "リドロー", type: "リドロー", desc: "敵のランダムな手+15%\nカードを2枚引く", weight: 20, isRare: false, icon: "🔄" },
            { name: "奥義: グパ", type: "グパ", desc: "✊と✋を同時に出す\n(使用後ターン終了)", weight: 3, isRare: true, icon: "✊✋" },
            { name: "奥義: グチョ", type: "グチョ", desc: "✊と✌️を同時に出す\n(使用後ターン終了)", weight: 3, isRare: true, icon: "✊✌️" },
            { name: "奥義: チョパ", type: "チョパ", desc: "✌️と✋を同時に出す\n(使用後ターン終了)", weight: 3, isRare: true, icon: "✌️✋" }
        );

        function showPopup(type, title, detail) {
            let popup = document.getElementById("battlePopup");
            let pTitle = document.getElementById("popupTitle");
            let pDetail = document.getElementById("popupDetail");

            popup.className = "";
            pTitle.innerText = title;
            pDetail.innerText = detail;

            if (type === "win") popup.classList.add("popup-win", "show");
            else if (type === "lose") popup.classList.add("popup-lose", "show");
            else popup.classList.add("popup-tie", "show");

            clearTimeout(popupTimer);
            popupTimer = setTimeout(() => { popup.classList.remove("show"); }, 1200);
        }

        function updateTurnDisplay() {
            let displayElement = document.getElementById("turnDisplay");
            
            // ★大変更：ステージ3の時だけタイマーを表示し、それ以外は隠す処理
            if (currentStage !== 3) {
                displayElement.style.display = "none";
                return; // ステージ3以外はここで処理を止める
            }

            // ステージ3なら表示する
            displayElement.style.display = "inline-block";
            let turnsLeft = 10 - turnCount;
            displayElement.innerText = "⏳ 大技まで: " + turnsLeft;
            
            if (turnsLeft <= 3) {
                displayElement.style.backgroundColor = "#c0392b";
                displayElement.style.color = "#fff";
            } else {
                displayElement.style.backgroundColor = "#000";
                displayElement.style.color = "#e74c3c";
            }
        }

        function setRandomBaseProb() {
            let stageIndex = currentStage - 1;
            let pattern = Array.from(stages.at(stageIndex).probPattern);
            
            for (let i = pattern.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                let temp = pattern[i];
                pattern[i] = pattern[j];
                pattern[j] = temp;
            }
            
            baseEnemyProb = {
                "グー": pattern.at(0),
                "チョキ": pattern.at(1),
                "パー": pattern.at(2)
            };
            
            enemyProb = { ...baseEnemyProb };
            updateProbDisplay();
        }

        function loadStage(stageIndex) {
            let data = stages.at(stageIndex - 1);
            enemyLife = data.hp;
            if (hasGodHand === true) { playerDamage = 2; } else { playerDamage = 1; }

            turnCount = 0; 
            updateTurnDisplay(); // ★ステージを読み込む時に表示・非表示を切り替える

            document.getElementById("stageDisplay").innerText = "🚩 ステージ " + stageIndex;
            setRandomBaseProb();
            updateLifeDisplay();
        }

        function drawCards(num) {
            let totalWeight = 0;
            for(let i = 0; i < cardPool.length; i++) {
                totalWeight += cardPool.at(i).weight;
            }

            for(let i = 0; i < num; i++) {
                let randomVal = Math.random() * totalWeight;
                let currentWeight = 0;
                for(let j = 0; j < cardPool.length; j++) {
                    currentWeight += cardPool.at(j).weight;
                    if (randomVal <= currentWeight) {
                        hand.push(cardPool.at(j));
                        break;
                    }
                }
            }
            renderHand();
        }

        function renderHand() {
            let handArea = document.getElementById("handArea");
            handArea.innerHTML = "";

            hand.forEach((card, index) => {
                let cardDiv = document.createElement("div");
                cardDiv.className = card.isRare ? "card rare" : "card";
                
                cardDiv.innerHTML = `
                    <div class="card-name">${card.name}</div>
                    <div class="card-icon">${card.icon}</div>
                    <div class="card-desc">${card.desc}</div>
                `;
                
                cardDiv.onclick = function() {
                    useCard(index);
                };
                
                handArea.appendChild(cardDiv);
            });
        }

        function changeProb(targetHand, amount) {
            let others = Object.keys(enemyProb).filter(key => key !== targetHand);
            if (others.length !== 2) return;
            
            let handA = others.at(0);
            let handB = others.at(1);
            let totalOthers = enemyProb[handA] + enemyProb[handB];
            let actualAdd = Math.min(amount, totalOthers);
            if (actualAdd <= 0) return;

            enemyProb[targetHand] += actualAdd;

            if (totalOthers > 0) {
                let reduceA = actualAdd * (enemyProb[handA] / totalOthers);
                let reduceB = actualAdd * (enemyProb[handB] / totalOthers);
                enemyProb[handA] -= reduceA;
                enemyProb[handB] -= reduceB;
            }

            for(let key in enemyProb) {
                if(enemyProb[key] < 0) enemyProb[key] = 0;
                if(enemyProb[key] > 100) enemyProb[key] = 100;
            }
        }

        function updateProbDisplay() {
            let rockDisp = Math.round(enemyProb["グー"]);
            let scissorsDisp = Math.round(enemyProb["チョキ"]);
            let paperDisp = 100 - rockDisp - scissorsDisp;

            if (paperDisp < 0) { scissorsDisp += paperDisp; paperDisp = 0; }
            document.getElementById("probDisplay").innerText = "✊ " + rockDisp + "%  |  ✌️ " + scissorsDisp + "%  |  ✋ " + paperDisp + "%";
        }

        function updateLifeDisplay() {
            document.getElementById("lifeDisplay").innerText = "❤️ あなた: " + playerLife + "  /  😈 敵: " + enemyLife;
        }

        function useCard(index) {
            let card = hand.at(index);

            // ① 奥義カードの場合（使うと即ターン終了でバトルへ）
            if (card.type === "グパ" || card.type === "グチョ" || card.type === "チョパ") {
                hand.splice(index, 1);
                renderHand();
                playGame(card.type);
                return;
            }

            // ② リドローの処理
            if (card.type === "リドロー") {
                hand.splice(index, 1);
                
                let handsArray = new Array("グー", "チョキ", "パー");
                let randomTarget = handsArray.at(Math.floor(Math.random() * handsArray.length));
                
                changeProb(randomTarget, 15);
                updateProbDisplay();
                drawCards(2); 
                
                document.getElementById("resultText").innerText = "「リドロー」発動！敵の「" + randomTarget + "」が15%UPし、カードを2枚引いた！";
                return;
            }

            // ③ その他の通常カードの処理
            if (card.type === "ダブル") {
                playerDamage *= 2;
                document.getElementById("resultText").innerText = "「" + card.name + "」発動！次の攻撃が " + playerDamage + " 倍ダメージ！";
            } else {
                changeProb(card.type, 10);
                document.getElementById("resultText").innerText = "「" + card.name + "」を使った！敵の「" + card.type + "」が10%UP！";
                updateProbDisplay();
            }

            hand.splice(index, 1);
            renderHand();
        }

        function decideEnemyHand() {
            let rand = Math.random() * 100;
            if (rand < enemyProb["グー"]) return "グー";
            else if (rand < enemyProb["グー"] + enemyProb["チョキ"]) return "チョキ";
            else return "パー";
        }

        function playGame(playerHand) {
            turnCount++;
            updateTurnDisplay();

            // ★大変更：即死判定の条件に「ステージ3の時だけ」を追加しました！
            if (currentStage === 3 && turnCount >= 10) {
                playerLife = 0; 
                updateLifeDisplay();
                document.getElementById("resultText").innerText = "💀 ターンオーバー！ボスの大技が発動し、消し飛ばされた... 💀";
                showPopup("lose", "ANNIHILATED", "タイムオーバー：ボスの即死攻撃");
                disableButtons();
                return; 
            }

            let enemyHand = decideEnemyHand();
            let resultMessage = "";
            let isWin = false;
            let isTie = false;

            if (playerHand === "グパ") {
                if (enemyHand === "チョキ" || enemyHand === "グー") { isWin = true; } else { isTie = true; }
            } else if (playerHand === "グチョ") {
                if (enemyHand === "パー" || enemyHand === "チョキ") { isWin = true; } else { isTie = true; }
            } else if (playerHand === "チョパ") {
                if (enemyHand === "グー" || enemyHand === "パー") { isWin = true; } else { isTie = true; }
            } else {
                if (playerHand === enemyHand) {
                    isTie = true;
                } else if (
                    (playerHand === "グー" && enemyHand === "チョキ") ||
                    (playerHand === "チョキ" && enemyHand === "パー") ||
                    (playerHand === "パー" && enemyHand === "グー")
                ) {
                    isWin = true;
                }
            }

            let detailText = playerHand + " VS " + enemyHand;

            if (isWin === true) {
                resultMessage = "✨ あなたの勝ち！ 敵に " + playerDamage + " ダメージ！ ✨";
                enemyLife -= playerDamage;
                showPopup("win", "WIN!!", detailText);
            } else if (isTie === true) {
                resultMessage = "あいこ！（ライフ変動なし）";
                showPopup("tie", "DRAW", detailText);
            } else {
                resultMessage = "💀 あなたの負け... あなたに1ダメージ！ 💀";
                playerLife--;
                showPopup("lose", "LOSE...", detailText);
            }

            if (playerHand === "グパ" || playerHand === "グチョ" || playerHand === "チョパ") {
                document.getElementById("resultText").innerText = "奥義発動！【" + playerHand + "】 VS 敵: " + enemyHand + "\n" + resultMessage;
            } else {
                document.getElementById("resultText").innerText = "あなた: " + playerHand + " / 敵: " + enemyHand + "\n" + resultMessage;
            }
            
            updateLifeDisplay();

            if (playerLife <= 0) {
                document.getElementById("resultText").innerText += "\n【ゲームオーバー...】\n画面を更新してリトライしてね！";
                disableButtons();
                return;
            } else if (enemyLife <= 0) {
                document.getElementById("resultText").innerText += "\n【敵を撃破！次のステージへ！】";

                if (currentStage === 2) {
                    document.getElementById("resultText").innerText += "\n🎁【ボーナス獲得】永久バフ「ライフプラス」「ゴッドハンド」をゲット！";
                    playerLife += 1;
                    hasGodHand = true;
                    document.getElementById("buffBar").style.display = "block";
                    document.getElementById("buffList").innerText = "ライフプラス (体力+1), ゴッドハンド (基礎ダメージ2倍)";
                }

                currentStage++;
                
                if (currentStage > stages.length) {
                    document.getElementById("resultText").innerText += "\n🎉 ボスを撃破！完全クリア！！おめでとうございます！ 🎉";
                    disableButtons();
                } else {
                    loadStage(currentStage);
                    hand = new Array(); 
                    drawCards(5); 
                }
                return;
            }

            if (hasGodHand === true) { playerDamage = 2; } else { playerDamage = 1; }
            setRandomBaseProb();
            drawCards(2);
        }

        function disableButtons() {
            document.getElementById("btnRock").disabled = true;
            document.getElementById("btnScissors").disabled = true;
            document.getElementById("btnPaper").disabled = true;
            document.getElementById("handArea").innerHTML = "";
        }

        loadStage(1);
        drawCards(5);