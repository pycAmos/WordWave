const colors = ['Red', 'Blue', 'Green', 'Orange', 'Purple'];
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const vowels = ['A', 'E', 'I', 'O', 'U'];
let deck = [];
let discardPile = [];
let playerHand = [];
let aiHand = [];
let currentCard = null;
let baseNumber = 3;
let currentPlayer = 'player'; 
let gameOver = false;
let selectedCards = [];
let canPung = false;
let isPungActive = false;
let pungTimer = null; // PUNG 倒计时定时器
let pungCountdown = 5;
let playOutTimer = null;
let penaltyActive = false;
let penaltyTarget = null;
const penaltyCardCount = 3;
const penaltyDrawCount = 2;

// 获取DOM元素
const pungButton = document.getElementById('pung-button');

// 定义特殊词
const specialWords = ['AI', 'TNT', 'NB', 'IQ', 'HP', 'WC'];

// 确保按钮存在并绑定事件
if (pungButton) {
    pungButton.addEventListener('click', pung);
}


// 消息提示框函数
function showMessage(message, duration = 3000) {
    const messageBox = document.getElementById('message-box');
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.style.display = 'block';
    if (showMessage.timeout) {
        clearTimeout(showMessage.timeout);
    }
    showMessage.timeout = setTimeout(() => {
        messageBox.style.display = 'none';
    }, duration);
}

// 更新 PUNG 倒计时的 UI 提示
function updatePungCountdownUI() {
    const message = pungCountdown > 0
        ? `PUNG: You have ${pungCountdown} seconds to select cards.`
        : 'PUNG: Time is up! Checking your selection...';
    showMessage(message, pungCountdown > 0 ? 1000 : 3000); // 每秒更新消息框
}

// 检测 PUNG 拼接的单词是否合法
async function detectPungWord() {
    if (selectedCards.length === 0) {
        showMessage('You did not select any cards for PUNG.');
        return false;
    }

    const referenceLetter = currentCard.letter;
    const selectedWord = selectedCards.map(card => card.letter).join('');
    const fullWord = referenceLetter + selectedWord;

    console.log(`Word to validate for PUNG: ${fullWord}`);

    const isValid = await validateWord(fullWord);

    if (isValid) {
        console.log(`"${fullWord}" is a valid word for PUNG.`);
        showMessage(`"${fullWord}" is a valid word! You played successfully.`);

        // 更新 currentCard
        currentCard = selectedCards[selectedCards.length - 1];

        // 从玩家手牌中移除 PUNG 的牌
        selectedCards.forEach(card => {
            const index = playerHand.indexOf(card);
            if (index !== -1) {
                playerHand.splice(index, 1);
            }
            discardPile.push(card);
        });
        discardPile.push(currentCard); // 将 referenceCard 加入弃牌堆
        selectedCards = [];

        // 更新 UI 和状态
        updatePlayerHandUI();
        updateCurrentCardUI();

        // 检查游戏是否结束
        if (playerHand.length === 0) {
            gameOver = true;
            showMessage('You Won the Game!');
            updateGameStatus('Game over.');
            alert("Wanna Play Again?");
            location.reload();
            return true;
        }

        // 清理 PUNG 状态
        isPungActive = false;
        canPung = true;

        // 检查是否有可出的牌
        if (!hasPlayableCard()) {
            showMessage('You have no playable cards. Please click the DRAW button to draw a card.');
            updateGameStatus('You have no playable cards.');
        } else {
            updateGameStatus("It's your turn.");
        }
        return true;
    } else {
        console.log(`"${fullWord}" is not a valid word for PUNG.`);
        showMessage(`"${fullWord}" is not a valid word.`);

        // 撤回选中的牌
        selectedCards.forEach(card => {
            const index = discardPile.indexOf(card);
            if (index !== -1) {
                discardPile.splice(index, 1); // 从弃牌堆中移除
            }
            playerHand.push(card); // 返回玩家手牌
        });
        selectedCards = []; // 清空选中牌

        updatePlayerHandUI();
        updateCurrentCardUI();

        // 清理 PUNG 状态
        isPungActive = false;
        canPung = true;

        return false;
    }
}

// 玩家点击 PUNG 按钮
async function pung() {
    console.log("PUNG button clicked!");

    if (gameOver || !canPung) {
        console.warn("PUNG action is not allowed right now.");
        return;
    }

    const playOutButton = document.getElementById('playout-button');
    // 如果 PUNG 正在倒计时中，再次点击立即验证单词
    if (isPungActive) {
        console.log("PUNG is active, stopping countdown and validating word immediately...");
        clearInterval(pungTimer); // 停止倒计时
        pungTimer = null; // 清空倒计时
        const isPungValid = await detectPungWord(); // 验证单词
        if (!isPungValid) {
            applyPungPenalty(); // 如果单词不合法，执行惩罚逻辑
        }
        // 恢复 playOut 按钮
        if (playOutButton) {
            playOutButton.disabled = false;
        }
        isPungActive = false; // 清理 PUNG 状态
        return; // 提前结束逻辑
    }

    // 开始新的 PUNG 流程
    console.log("Starting a new PUNG countdown...");
    isPungActive = true; // 标记为 PUNG 激活状态
    pungCountdown = 5; // 倒计时重置为 5 秒
    updatePungCountdownUI(); // 更新倒计时 UI 提示

    // 禁用 playOut 按钮
    if (playOutButton) {
        playOutButton.disabled = true;
    }

    // 启动 PUNG 倒计时
    pungTimer = setInterval(async () => {
        pungCountdown--;
        updatePungCountdownUI();

        if (pungCountdown <= 0) {
            // 倒计时结束，清理定时器
            console.log("PUNG countdown completed. Validating word...");
            clearInterval(pungTimer);
            pungTimer = null;

            const isPungValid = await detectPungWord(); // 验证单词
            if (!isPungValid) {
                applyPungPenalty(); // 如果单词不合法，执行惩罚逻辑
            }

            // 恢复 playOut 按钮
            if (playOutButton) {
                playOutButton.disabled = false;
            }
            isPungActive = false; // 清理 PUNG 状态
        }
    }, 1000);
}



function applyPungPenalty() {
    console.log("PUNG failed! Drawing n penalty cards...");
    for (let i = 0; i < 2; i++) {
        if (deck.length > 0) {
            playerHand.push(deck.pop());
        } else {
            console.log("Deck is empty! No penalty cards can be drawn.");
            break;
        }
    }
    updatePlayerHandUI();
    updateDeckCount();
    showMessage("PUNG failed! You have drawn n penalty cards.", 3000);

    const playOutButton = document.getElementById('playout-button');
    if (playOutButton) {
        playOutButton.disabled = false; // 恢复按钮可用状态
    }

    selectedCards = []; // 清空选中牌
    updateCurrentCardUI();
    isPungActive = false; // 清理 PUNG 激活状态
    currentPlayer = "ai"; // 切换到 AI 回合
    updateGameStatus("It’s Bot’s turn.");
    setTimeout(aiTurn, 1000); // 触发 AI 回合
}

// 创建牌堆
function createDeck() {
    colors.forEach(color => {
        // 每个字母的牌
        letters.forEach(letter => {
            deck.push({ color, letter, img: `../images/cards/${letter}_${color}.png` });
        });
        // 元音
        vowels.forEach(vowel => {
            for (let i = 0; i < 3; i++) {
                deck.push({ color, letter: vowel, img: `../images/cards/${vowel}_${color}.png` });
            }
        });
    });

    // 创建黑色功能牌
    letters.forEach(letter => {
        deck.push({ color: 'Black', letter, img: `../images/cards/${letter}_Black.png` });
    });
    vowels.forEach(vowel => {
        for (let i = 0; i < 3; i++) {
            deck.push({ color: 'Black', letter: vowel, img: `../images/cards/${vowel}_Black.png` });
        }
    });
}

// 洗牌
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// 发牌
function dealCards() {
    // 各发7张牌
    for (let i = 0; i < 7; i++) {
        playerHand.push(deck.pop());
        aiHand.push(deck.pop());
    }

    // 抽一张作为起始牌
    currentCard = deck.pop();
    while (currentCard.color === 'Black') {
        deck.unshift(currentCard); 
        currentCard = deck.pop();
    }
    discardPile.push(currentCard);

    updateCurrentCardUI();
    updateDeckCount();
}

// 更新牌库数量
function updateDeckCount() {
    document.querySelector('.deck-count').textContent = deck.length;
}

// 更新当前牌的显示
function updateCurrentCardUI() {
    const playedCardsDiv = document.getElementById('played-cards');
    playedCardsDiv.innerHTML = '';

    for (let i = 0; i < discardPile.length; i++) {
        const card = discardPile[i];
        if (!card || !card.img) {
            console.warn('Invalid card in discardPile:', card);
            continue; // 跳过无效卡牌
        }
        addCardToDiscardPile(card);
    }

    if (currentPlayer === 'player' && selectedCards.length > 0) {
        selectedCards.forEach(card => {
            if (!card || !card.img) {
                console.warn('Invalid card in selectedCards:', card);
                return; // 跳过无效卡牌
            }
            addCardToDiscardPile(card, true);
        });
    }
}


// 添加卡牌到弃牌堆显示
function addCardToDiscardPile(card, isSemiTransparent = false) {
    if (!card || !card.img) {
        console.error("Invalid card passed to addCardToDiscardPile:", card);
        return; // 如果卡片无效，则直接退出函数
    }

    const playedCardsDiv = document.getElementById('played-cards');
    const img = document.createElement('img');
    img.src = card.img;
    img.alt = `${card.letter} of ${card.color}`;
    if (isSemiTransparent) {
        img.classList.add('semi-transparent');
        img.dataset.cardId = `${card.color}_${card.letter}`;
    }
    playedCardsDiv.appendChild(img);
}


// 更新玩家手牌显示
function updatePlayerHandUI() {
    const playerHandDiv = document.querySelector('.player-hand');
    playerHandDiv.innerHTML = ''; 
    playerHand.forEach((card, index) => {
        const img = document.createElement('img');
        img.src = card.img;
        img.alt = `${card.letter} of ${card.color}`;
        img.onclick = () => {
            if (gameOver || (currentPlayer !== 'player' && !canPung)) return;
            if (selectedCards.includes(card)) {
                selectedCards = selectedCards.filter(c => c !== card);
                img.classList.remove('selected-card');
                removeCardFromDiscardPile(card);
            } else {
                selectedCards.push(card);
                img.classList.add('selected-card');
                addCardToDiscardPile(card, true);
            }
            updateCurrentCardUI();
        };
        playerHandDiv.appendChild(img);
    });
}

function removeCardFromDiscardPile(card) {
    if (!card || !card.color || !card.letter) {
        console.warn("Invalid card passed to removeCardFromDiscardPile:", card);
        return; // 跳过无效卡片
    }

    const playedCardsDiv = document.getElementById('played-cards');
    const img = playedCardsDiv.querySelector(`img.semi-transparent[data-card-id="${card.color}_${card.letter}"]`);
    if (img) {
        playedCardsDiv.removeChild(img);
    } else {
        console.warn("Card not found in discard pile:", card);
    }
}


// 更新AI手牌
function updateAIHandUI() {
    const aiHandDiv = document.querySelector('.ai-hand');
    aiHandDiv.innerHTML = '';

    aiHand.forEach(() => {
        const img = document.createElement('img');
        img.src = '../images/Card_back.png'; 
        img.alt = 'AI Card';
        aiHandDiv.appendChild(img);
    });
    console.log('xxxxxxxxxxxxxxxxx123', aiHand.map(card => `${card.color} ${card.letter}`).join(', '));
}

// 更新游戏状态提示 + 基数惩罚
function updateGameStatus(message) {
    const statusDiv = document.getElementById('game-status');
    const drawButton = document.getElementById('draw-button');

    // 更新状态信息
    if (penaltyActive) {
        const penaltyMessage = `Penalty Active: ${penaltyTarget === 'player' ? 'You must play at least 3 cards!' : 'Bot must play at least 3 cards!'}`;
        statusDiv.textContent = `${message} ${penaltyMessage}`;
    } else {
        statusDiv.textContent = message || (currentPlayer === 'player' ? "It's your turn." : "It's Bot's turn.");
    }

    // 更新抽牌按钮状态
    if (currentPlayer === 'player' && !hasPlayableCard() && !isPungActive) {
        drawButton.classList.add('blink');
        drawButton.disabled = false;
    } else {
        drawButton.classList.remove('blink');
        drawButton.disabled = true;
    }

    // 显示基数信息（可选）
    const baseNumberUI = document.getElementById('base-number');
    baseNumberUI.textContent = penaltyActive ? `Penalty` : '3';
}

// 检查是否可以出牌
function canPlayCard(card) {
    if (card.color === 'Black') {
        return true;
    }
    // 检查颜色或字母是否匹配
    if (card.color === currentCard.color || card.letter === currentCard.letter) {
        return true;
    }
    
    return false;
}

// 是否有可以出的牌
function hasPlayableCard() {
    return playerHand.some(card => canPlayCard(card));
}

// 玩家抽牌
function drawCard() {
    if (currentPlayer !== 'player' || gameOver || isPungActive) return; 

    if (hasPlayableCard()) {
        showMessage('You have playable cards, drawing is not allowed!');
        return;
    }
    if (deck.length === 0) {
        showMessage('The deck is empty, no more cards can be drawn!');
        return;
    }
    const newCard = deck.pop();
    playerHand.push(newCard);
    updateDeckCount();
    updatePlayerHandUI();

    if (canPlayCard(newCard)) {
        showMessage('You have drawn a playable card. Please continue playing.。');
        updateGameStatus('You have drawn a playable card. Please continue playing.');
    } else {
        currentPlayer = 'ai';
        updateGameStatus('It’s Bot’s turn');
        setTimeout(aiTurn, 1000);
    }
}

async function validateSelectedCards(selectedCards) {
    // 将玩家选中的卡片按顺序组合成一个字符串，并转换为小写
    const word = selectedCards.map(card => card.letter).join('').toLowerCase();
    console.log("Word formed from selected cards:", word);

    // 调用 validateWord 函数验证单词是否合法
    const isValid = await validateWord(word);

    if (isValid) {
        console.log(`"${word}" is a valid word!`);
    } else {
        console.log(`"${word}" is not a valid word.`);
    }

    return isValid; // 返回验证结果，供其他逻辑使用
}

// 点击Play Out按钮 + 玩家回合中加入基数惩罚的触发与处理
async function playOut() {
    const playOutButton = document.getElementById('playout-button');
    if (playOutButton && playOutButton.disabled) {
        console.warn("playOut is disabled during PUNG action.");
        return; // 如果被禁用，则直接返回
    }
    if (gameOver || selectedCards.length === 0 || isPungActive) return;
    checkForSpecialWord(); //仅测试

    const firstCard = selectedCards[0];
    // 检查选中的第一张牌是否符合 reference card
    if (!canPlayCard(firstCard)) {
        showMessage('The first selected card does not match the reference card. Please check the rules.');
        return;
    }

    // 如果只有一张牌，直接判断合法性
    if (selectedCards.length === 1) {
        if (!canPlayCard(firstCard)) {
            showMessage('The selected card does not match the last card on the table. Please check the rules.');
            return;
        }
    } else {
        // 多张牌时调用 validateSelectedCards 验证单词
        const isValid = await validateSelectedCards(selectedCards);
        if (!isValid) {
            showMessage('The selected cards do not form a valid word. You are penalized with one card draw!');
            // 自动罚拿牌一张
            if (deck.length > 0) {
                const penaltyCard = deck.pop();
                playerHand.push(penaltyCard);
                updateDeckCount();
                updatePlayerHandUI();
            } else {
                showMessage('The deck is empty, no more cards can be drawn!');
            }
            // 清空选中的牌
            selectedCards = [];
            updateCurrentCardUI();

            // 自动轮换到 AI 出牌
            currentPlayer = 'ai';
            updateGameStatus('It’s Bot’s turn');
            setTimeout(aiTurn, 1000); // 触发 AI 回合
            return; // 提前结束逻辑
        }
    }

    // **处理基数惩罚逻辑**
    if (penaltyActive && penaltyTarget === "player") {
        if (selectedCards.length >= penaltyCardCount) {
            console.log("Player satisfied penalty. Passing penalty to Bot.");
            penaltyTarget = "ai"; // 惩罚转移给 AI
            showMessage("You satisfied the penalty! Now Bot must play at least 3 cards.");
        } else {
            console.log("Player failed to satisfy penalty. Drawing penalty cards...");
            drawPenaltyCards(playerHand, penaltyDrawCount);
            penaltyActive = false; // 清除惩罚状态
            penaltyTarget = null;
            showMessage("You failed to satisfy the penalty! You have drawn penalty cards.");
            updateGameStatus("It's Bot's turn.");
            currentPlayer = "ai";
            setTimeout(aiTurn, 1000);
            return;
        }
    } else if (selectedCards.length >= penaltyCardCount) {
        // 如果没有惩罚状态，但玩家打出足够的牌，启动基数惩罚逻辑
        penaltyActive = true;
        penaltyTarget = "ai";
        console.log("Player triggered penalty for Bot.");
        showMessage("You have triggered the penalty! The bot must play at least 3 cards.");
    }

    // 出牌并更新状态
    selectedCards.forEach(card => {
        const index = playerHand.indexOf(card);
        playerHand.splice(index, 1);
        discardPile.push(card);
    });

    currentCard = selectedCards[selectedCards.length - 1];
    updatePlayerHandUI();
    selectedCards = [];

    updateCurrentCardUI();

    // checkForSpecialWord();

    if (playerHand.length === 0) {
        gameOver = true;
        showMessage('You Won the Game!');
        updateGameStatus('Game over.');
        alert("Wanna Play Again?");
        location.reload();
        return;
    }

    currentPlayer = 'ai';
    updateGameStatus('It’s Bot’s turn');
    setTimeout(aiTurn, 1000);
}



// AI回合 + 加入基数惩罚的处理逻辑
async function aiTurn() {
    console.log("Bot is thinking...");
    if (currentPlayer !== "ai" || gameOver) return;

    // 获取符合 reference card 的可用卡片
    let playableCards = aiHand.filter(card => canPlayCard(card));

    if (playableCards.length === 0) {
        console.warn("Bot has no playable cards!");

        // AI罚一张牌
        if (deck.length > 0) {
            const penaltyCard = deck.pop();
            aiHand.push(penaltyCard);
            updateDeckCount();
            updateAIHandUI();
            showMessage("Bot has no playable cards and draws 1 card.");

            // 重新检查罚完牌后是否可以出牌
            playableCards = aiHand.filter(card => canPlayCard(card));
            if (playableCards.length === 0) {
                console.warn("Bot still has no playable cards after drawing.");
                currentPlayer = "player";
                updateGameStatus("It's your turn.");
                return;
            }
        } else {
            // 如果牌堆为空，直接结束回合
            console.warn("Deck is empty! Bot cannot draw cards.");
            currentPlayer = "player";
            updateGameStatus("It's your turn.");
            return;
        }
    }

    // 获取所有可能的组合
    const allCombos = getAllCombos(playableCards);

    // 获取合法组合
    const validCombos = await getValidCombos(allCombos);

    // **处理基数惩罚逻辑**
    if (penaltyActive && penaltyTarget === "ai") {
        console.log("Penalty active for Bot. Bot must play at least 3 cards.");
        const penaltyCombos = validCombos.filter(combo => combo.length >= penaltyCardCount);

        if (penaltyCombos.length > 0) {
            penaltyCombos.sort((a, b) => b.length - a.length); // 选择最长的组合
            const bestPenaltyCombo = penaltyCombos[0];
            console.log("Bot satisfied penalty with:", bestPenaltyCombo);

            processAIPlay(bestPenaltyCombo);

            // 转移惩罚状态给玩家
            penaltyTarget = "player"; // 转移惩罚状态给玩家
            showMessage("Bot satisfied the penalty! Now you must play at least 3 cards.");
            return;
        } else {
            console.log("Bot failed to satisfy penalty. Drawing penalty cards...");
            drawPenaltyCards(aiHand, penaltyDrawCount);
            penaltyActive = false; // 清除惩罚状态
            penaltyTarget = null;
            showMessage("Bot failed to satisfy the penalty! It has drawn penalty cards.");
            updateGameStatus("It's your turn.");
            currentPlayer = "player";
            //新增2⬇️
            playerTurn(); // 显式调用 playerTurn
            //新增2⬆️
            return;
        }
    }

    // 正常逻辑：选择最长的合法组合
    if (validCombos.length > 0) {
        validCombos.sort((a, b) => b.length - a.length);
        const bestCombo = validCombos[0];
        console.log("Bot played a valid word:", bestCombo);

        processAIPlay(bestCombo);

        // 如果出牌满足基数惩罚条件，转移惩罚状态给玩家
        if (bestCombo.length >= penaltyCardCount) {
            penaltyActive = true;
            penaltyTarget = "player";
            showMessage("Bot triggered the penalty! You must play at least 3 cards.");
        }
    } else {
        // 没有合法组合，随机出一张牌
        const singleCard = playableCards[0];
        processAIPlay([singleCard]);
        console.log('Bot played a single card: ${singleCard.letter}');
    }

    // 检查游戏是否结束
    if (aiHand.length === 0) {
        gameOver = true;
        showMessage("The bot won the game!");
        alert("Wanna Play Again?");
        location.reload();
        updateGameStatus("Game over.");
        return;
    }

    // 转换到玩家回合
    currentPlayer = "player";
    updateGameStatus("It’s your turn.");
}

function getAllCombos(cards, referenceCard) {
    // 使用 canPlayCard 过滤符合 referenceCard 的卡牌
    const filteredCards = cards.filter(card => canPlayCard(card));

    // 生成所有可能的组合
    const combos = [];
    for (let i = 1; i <= filteredCards.length; i++) {
        combos.push(...getCombinations(filteredCards, i));
    }
    return combos;
}


async function getValidCombos(combos) {
    const validCombos = [];
    await Promise.all(
        combos.map(async combo => {
            const word = combo.map(card => card.letter).join("").toLowerCase();
            const isValid = await validateWord(word);
            if (isValid) {
                validCombos.push(combo);
            }
        })
    );
    return validCombos;
}

function processAIPlay(cards) {
    cards.forEach(card => {
        if (!card || !card.letter || !card.color) {
            console.warn('Invalid card in processAIPlay:', card);
            return; // 跳过无效卡片
        }
        const index = aiHand.indexOf(card);
        if (index !== -1) {
            aiHand.splice(index, 1);
        }
        discardPile.push(card);
    });

    // 确保 currentCard 是有效的
    currentCard = cards[cards.length - 1] || currentCard;
    updateAIHandUI();
    updateCurrentCardUI();
}

function drawPenaltyCards(hand, count) {
    for (let i = 0; i < count; i++) {
        if (deck.length > 0) {
            hand.push(deck.pop());
        } else {
            console.log("Deck is empty! No more cards can be drawn.");
            break;
        }
    }
    updateAIHandUI();
    updateDeckCount();
}

function getCombinations(array, size) {
    const results = [];
    if (size > array.length) return results;
    if (size === 1) return array.map(item => [item]);

    array.forEach((item, index) => {
        const smallerCombinations = getCombinations(array.slice(index + 1), size - 1);
        smallerCombinations.forEach(combination => {
            results.push([item, ...combination]);
        });
    });
    return results;
}

// 检查是否形成特出词
function checkForSpecialWord() {
    // 获取弃牌堆最后3张牌的字母组合
    if (discardPile.length < 3) return; // 如果弃牌堆少于3张，不进行检查
    const letters = discardPile.slice(-3).map(c => c.letter).join('').toUpperCase(); // 组合成大写字母

    console.log("Last three letters in discard pile:", letters);

    // 仅检查是否与 specialWords 中的词完全匹配
    if (specialWords.includes(letters)) {
        console.log(`Special word detected: ${letters}`);
        applySpecialWordEffect(letters, currentPlayer); // 应用特殊词的效果
    }
}

// 处理特出词
function applySpecialWordEffect(word, playerType) {
    switch (word) {
        case 'AI':
            showMessage('Special Rule AI: +5 points after the game ends!');
            break;
        case 'TNT':
            baseNumber = 0;
            updateBaseNumberUI();
            showMessage('Special Rule TNT: Base number becomes 0!');
            break;
        case 'NB':
            baseNumber = Math.max(1, baseNumber - 1);
            updateBaseNumberUI();
            showMessage('Special Rule NB: Base number decreases by 1!');
            break;
        case 'IQ':
            showMessage('Special Rule IQ: You can play an additional round of cards!');
            if (playerType === 'player') {
                // 玩家多一轮行动
                currentPlayer = 'player';
            } else {
                // AI多一轮行动
                aiTurn();
            }
            break;
        case 'HP':
            showMessage('Special Rule HP: You can play one extra card!');
            if (playerType === 'player') {
                currentPlayer = 'player';
            } else {
                aiTurn();
            }
            break;
        case 'WC':
            showMessage('Special Rule WC: The next player skips one turn!');
            if (playerType === 'player') {
                currentPlayer = 'player';
                updateGameStatus('The bot is skipped for one turn, it\'s now your move!');
            } else {
                currentPlayer = 'ai';
                updateGameStatus('You are skipped for one turn, it\'s now the Bot\'s move!');
                setTimeout(aiTurn, 1000);
            }
            break;
        default:
            break;
    }
}

// 更新基数
function updateBaseNumberUI() {
    document.getElementById('base-number').textContent = baseNumber;
}

// 玩家回合逻辑
async function playerTurn() {
    if (currentPlayer !== 'player' || gameOver) return;
    isPungActive = false;
    canPung = true; // 设置可以使用 PUNG 功能
    // 新增1⬇️ 基数惩罚情况下检查是否有可出牌
    if (penaltyActive && penaltyTarget === "player") {
        const playableCards = playerHand.filter(card => canPlayCard(card));
        if (playableCards.length === 0) {
            // 玩家无可出的牌，直接进入罚牌逻辑
            showMessage('You have no playable cards to satisfy the penalty. Drawing penalty cards...');
            drawPenaltyCards(playerHand, penaltyDrawCount); // 自动罚牌两张
            penaltyActive = false; // 清除基数惩罚状态
            penaltyTarget = null;
            currentPlayer = "ai"; // 转移到 AI 回合
            updateGameStatus("It’s Bot’s turn.");
            setTimeout(aiTurn, 1000); // 触发 AI 回合
            return; // 提前结束玩家逻辑
        }

        // 有可出的牌，调用 AI 验词逻辑检查是否能组成合法单词
        const allCombos = getAllCombos(playableCards);
        const validCombos = await getValidCombos(allCombos);
        const validPenaltyCombos = validCombos.filter(combo => combo.length >= penaltyCardCount);

        if (validPenaltyCombos.length === 0) {
            // 无法组成满足基数要求的单词，自动接受罚牌
            showMessage('You cannot form a valid word of 3 or more cards. Drawing penalty cards...');
            drawPenaltyCards(playerHand, penaltyDrawCount); // 自动罚牌两张
            penaltyActive = false; // 清除基数惩罚状态
            penaltyTarget = null;
            currentPlayer = "ai"; // 转移到 AI 回合
            updateGameStatus("It’s Bot’s turn.");
            setTimeout(aiTurn, 1000); // 触发 AI 回合
            return; // 提前结束玩家逻辑
        }

        // 如果能组成符合基数要求的单词，允许玩家自行选择出牌
        showMessage('You can form a valid word of 3 or more cards. Please select your cards to play.');
        return; // 不自动出牌，允许玩家操作
    }
    // 新增1结束⬆️
    updateGameStatus('It\'s your turn');
    if (!hasPlayableCard()) {
        showMessage('You don\'t have any playable cards. Please click the DRAW button to draw a card.');
    }
}

// 基数惩罚的函数

function applyPenalty(targetPlayer) {
    console.log('Applying Penalty to:', targetPlayer);
    const penaltyCount = 2; 
    drawPenaltyCards(targetPlayer === 'player' ? playerHand : aiHand, penaltyCount);

    // 检查牌堆是否足够
    if (deck.length < penaltyCount) {
        const actualPenalty = deck.length; // 实际可罚的数量
        for (let i = 0; i < actualPenalty; i++) {
            if (targetPlayer === 'player') {
                playerHand.push(deck.pop());
            } else {
                aiHand.push(deck.pop());
            }
        }
        showMessage(`The deck is empty! Only ${actualPenalty} card${actualPenalty > 1 ? 's' : ''} could be drawn.`);
        return;
    }

    // 正常罚牌逻辑
    for (let i = 0; i < penaltyCount; i++) {
        if (targetPlayer === 'player') {
            playerHand.push(deck.pop());
        } else {
            aiHand.push(deck.pop());
        }
    }

    if (targetPlayer === 'player') {
        showMessage(`You failed to meet the penalty! You have drawn ${penaltyCount} card${penaltyCount > 1 ? 's' : ''}.`);
        updatePlayerHandUI();

        // 转移回合到 AI
        currentPlayer = 'ai';
        updateGameStatus('Bot\'s turn after penalty.');
        setTimeout(aiTurn, 1000); // 触发 AI 回合
    } else {
        showMessage(`Bot failed to meet the penalty and has drawn ${penaltyCount} card${penaltyCount > 1 ? 's' : ''}!`);
        updateAIHandUI();

        // 转移回合到玩家
        currentPlayer = 'player';
        updateGameStatus('Your turn after penalty.');
    }

    // 结束惩罚状态
    penaltyActive = false;
    penaltyTarget = null; // 清空目标
    console.log('Penalty resolved. Turn passed to the next player.');
}


// 调用flask
async function validateWord(word) {
    try {
        const response = await fetch(`http://172.23.66.238:5000/validate?word=${encodeURIComponent(word.toLowerCase())}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("API Response:", data);
        return data.is_valid;
    } catch (error) {
        console.error("Error while validating word:", error);
        showMessage('Server error! Unable to validate the word. Please try again later.', 5000);
        return false;
    }
}

// 初始化
function initializeGame() {
    createDeck();
    shuffleDeck(deck);
    dealCards();
    updatePlayerHandUI();
    updateAIHandUI();
    updateDeckCount();
    updateBaseNumberUI();
    updateGameStatus('The game has started! It\'s your turn to play!');
    playerTurn();
}

window.onload = initializeGame;
