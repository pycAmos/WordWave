// 定义游戏变量
const colors = ['Red', 'Blue', 'Green', 'Orange', 'Purple'];
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const vowels = ['A', 'E', 'I', 'O', 'U'];
let deck = [];
let discardPile = [];
let playerHand = [];
let aiHand = [];
let currentCard = null;
let baseNumber = 1;
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
const pungStatus = document.getElementById('pung-status');

// 定义特殊词
const specialWords = ['AI', 'TNT', 'NB', 'IQ', 'HP', 'WC'];

// 确保按钮存在并绑定事件
if (pungButton) {
    pungButton.addEventListener('click', pung);
}

// 初始化 PUNG 状态文本
if (pungStatus) {
    pungStatus.textContent = 'PUNG: Ready to start countdown.';
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
    if (!pungStatus) return;
    pungStatus.textContent = pungCountdown > 0
        ? `PUNG: You have ${pungCountdown} seconds to select cards.`
        : 'PUNG: Time is up! Checking your selection...';
}

// 检测 PUNG 拼接的单词是否合法
async function detectPungWord() {
    if (selectedCards.length === 0) {
        showMessage('You did not select any cards for PUNG.', 3000);
        return false; // 无选牌直接返回 false
    }

    const referenceLetter = currentCard.letter; // Reference Card 的字母
    const selectedWord = selectedCards.map(card => card.letter).join('');
    const fullWord = referenceLetter + selectedWord; // 拼接后的完整单词

    console.log(`Word to validate for PUNG: ${fullWord}`);

    const isValid = await validateWord(fullWord); // 调用服务器验证

    if (isValid) {
        console.log(`"${fullWord}" is a valid word for PUNG.`);
        showMessage(`"${fullWord}" is a valid word! You played successfully.`, 3000);

        // 成功逻辑
        selectedCards.forEach(card => {
            const index = playerHand.indexOf(card);
            if (index !== -1) {
                playerHand.splice(index, 1); // 从玩家手牌中移除
            }
            discardPile.push(card); // 加入弃牌堆
        });

        discardPile.push(currentCard); // 将 Reference Card 加入弃牌堆
        currentCard = selectedCards[selectedCards.length - 1]; // 更新 Reference Card
        selectedCards = []; // 清空选中牌
        canPung = false;

        updatePlayerHandUI();
        updateCurrentCardUI();

        if (playerHand.length === 0) {
            gameOver = true;
            showMessage('You Won the Game!', 3000);
            updateGameStatus('Game over.');
            return true; // 返回 true，表示成功
        }

        // 切换到 AI 回合
        updateGameStatus('It’s Bot’s turn');
        setTimeout(aiTurn, 1000);
        return true; // 返回 true，表示成功
    } else {
        console.log(`"${fullWord}" is not a valid word for PUNG.`);
        showMessage(`"${fullWord}" is not a valid word.`, 3000);
        return false; // 返回 false，表示失败
    }
}

// 玩家点击 PUNG 按钮
async function pung() {
    console.log("PUNG button clicked!");

    if (gameOver || !canPung) return;

    // 如果已经在倒计时中，再次点击按钮立即触发检测
    if (pungTimer) {
        console.log("PUNG timer already running. Stopping and detecting...");
        clearTimeout(pungTimer); // 停止现有倒计时
        pungTimer = null;        // 清空定时器
        const isPungValid = await detectPungWord(); // 检测单词是否合法
        if (isPungValid) return; // 如果合法，直接退出
        // 不合法则继续执行惩罚逻辑
        applyPungPenalty();
        return;
    }

    // 开始倒计时
    pungCountdown = 5; // 倒计时初始值
    console.log("Starting PUNG countdown...");
    updatePungCountdownUI(); // 更新倒计时 UI 提示

    pungTimer = setInterval(async () => {
        pungCountdown--;
        console.log("PUNG Countdown:", pungCountdown); // 调试输出倒计时
        updatePungCountdownUI();

        if (pungCountdown <= 0) {
            clearInterval(pungTimer); // 清除定时器
            pungTimer = null;         // 重置定时器
            console.log("PUNG countdown completed. Detecting word...");

            const isPungValid = await detectPungWord(); // 检测单词是否合法
            if (!isPungValid) {
                applyPungPenalty(); // 如果不合法，执行惩罚逻辑
            }
        }
    }, 1000);
}

function applyPungPenalty() {
    console.log("PUNG failed! Drawing 2 penalty cards...");
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
    showMessage("PUNG failed! You have drawn 2 penalty cards.", 3000);

    // 清空选中的牌并结束玩家回合
    selectedCards = [];
    updateCurrentCardUI();
    currentPlayer = "ai";
    updateGameStatus("It’s Bot’s turn.");
    setTimeout(aiTurn, 1000); // 触发 AI 回合
}

// 创建牌堆
function createDeck() {
    colors.forEach(color => {
        // 每个字母的牌
        letters.forEach(letter => {
            deck.push({ color, letter, img: `assets/images/cards/${letter}_${color}.png` });
        });
        // 元音
        vowels.forEach(vowel => {
            for (let i = 0; i < 3; i++) {
                deck.push({ color, letter: vowel, img: `assets/images/cards/${vowel}_${color}.png` });
            }
        });
    });

    // 创建黑色功能牌
    letters.forEach(letter => {
        deck.push({ color: 'Black', letter, img: `assets/images/cards/${letter}_Black.png` });
    });
    vowels.forEach(vowel => {
        for (let i = 0; i < 3; i++) {
            deck.push({ color: 'Black', letter: vowel, img: `assets/images/cards/${vowel}_Black.png` });
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
        addCardToDiscardPile(card);
    }

    if (currentPlayer === 'player' && selectedCards.length > 0) {
        selectedCards.forEach(card => {
            addCardToDiscardPile(card, true);
        });
    }
}

// 添加卡牌到弃牌堆显示
function addCardToDiscardPile(card, isSemiTransparent = false) {
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
    const playedCardsDiv = document.getElementById('played-cards');
    const img = playedCardsDiv.querySelector(`img.semi-transparent[data-card-id="${card.color}_${card.letter}"]`);
    if (img) {
        playedCardsDiv.removeChild(img);
    }
}

// 更新AI手牌
function updateAIHandUI() {
    const aiHandDiv = document.querySelector('.ai-hand');
    aiHandDiv.innerHTML = '';

    aiHand.forEach(() => {
        const img = document.createElement('img');
        img.src = 'assets/images/Card_back.png'; 
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
        statusDiv.textContent = message;
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
    baseNumberUI.textContent = penaltyActive ? `Penalty Target: ${penaltyTarget}` : 'Base Number: 3';
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

// 点击Play Out按钮 + 玩家回合中加入基数惩罚的触发与处理
async function playOut() {
    if (gameOver || selectedCards.length === 0 || isPungActive) return;

    const firstCard = selectedCards[0];

    // 单张牌时直接基于规则判断合法性
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

    // 检查是否需要触发基数惩罚
    if (selectedCards.length >= penaltyCardCount) {
        console.log('Selected Cards Length:', selectedCards.length); // 调试输出
        penaltyActive = true;
        penaltyTarget = 'ai'; // 转移惩罚给 AI
        console.log('Player triggered penalty for AI.');
        showMessage('You have triggered the penalty! The bot must play at least 3 cards.');
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

    checkForSpecialWord();

    if (playerHand.length === 0) {
        gameOver = true;
        showMessage('You Won the Game!');
        updateGameStatus('Game over.');
        return;
    }

    currentPlayer = 'ai';
    updateGameStatus('It’s Bot’s turn');
    setTimeout(aiTurn, 1000);
}

// AI回合 + 加入基数惩罚的处理逻辑
async function aiTurn() {
    console.log('Penalty Active:', penaltyActive);
    console.log('Penalty Target:', penaltyTarget);

    if (currentPlayer !== 'ai' || gameOver) return;

    if (penaltyActive && penaltyTarget === 'ai') {
        const playableCombination = await findPlayableCombination(aiHand, currentCard, penaltyCardCount);

        if (playableCombination) {
            const isValid = await validateSelectedCards(playableCombination);
            if (isValid) {
                console.log('AI found a valid playable combination:', playableCombination);
                playableCombination.forEach(card => {
                    playCard(aiHand, aiHand.indexOf(card), 'ai');
                });
                penaltyTarget = 'player';
                penaltyActive = true;
                console.log('AI met the penalty, transferring to player.');
                showMessage('The bot met the penalty! It\'s now your turn to face the penalty.');
                currentPlayer = 'player';
                updateGameStatus('It\'s your turn to face the penalty!');
                return;
            } else {
                console.log('AI found a combination but it is not a valid word:', playableCombination);
            }
        } else {
            console.log('AI failed to find a valid playable combination. Applying penalty.');
            applyPenalty('ai');
            return;
        }
    }

    console.log('AI is playing normally.');
    let played = false;
    for (let i = 0; i < aiHand.length; i++) {
        if (canPlayCard(aiHand[i])) {
            playCard(aiHand, i, 'ai');
            played = true;
            break;
        }
    }

    if (!played) {
        if (deck.length === 0) {
            showMessage('The deck is empty! The Bot cannot draw a card.');
            currentPlayer = 'player';
            updateGameStatus('It\'s your turn');
        } else {
            const newCard = deck.pop();
            aiHand.push(newCard);
            updateDeckCount();
            updateAIHandUI();

            if (canPlayCard(newCard)) {
                const cardIndex = aiHand.indexOf(newCard);
                playCard(aiHand, cardIndex, 'ai');
            }
        }
    }

    currentPlayer = 'player';
    updateGameStatus('It\'s your turn');
}

// AI出牌函数
function playCard(hand, cardIndex, playerType) {
    const card = hand[cardIndex];
    hand.splice(cardIndex, 1); 
    discardPile.push(card);
    currentCard = card;

    if (playerType === 'player') {
        updatePlayerHandUI();
    } else {
        updateAIHandUI();
    }

    // 更新弃牌堆显示
    updateCurrentCardUI();

    // 检查是否形成特殊词汇
    checkForSpecialWord();

    // 检查游戏是否结束
    if (hand.length === 0) {
        gameOver = true;
        showMessage(`${playerType === 'player' ? 'You' : 'Bot'}Won the Game！`);
        updateGameStatus('Game over');
        return;
    }
}

// 检查是否形成特出词
function checkForSpecialWord() {
    let letters = discardPile.slice(-3).map(c => c.letter).join('');
    specialWords.forEach(word => {
        if (letters.includes(word)) {
            applySpecialWordEffect(word, currentPlayer);
        }
    });
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
function playerTurn() {
    if (currentPlayer !== 'player' || gameOver) return;
    isPungActive = false;
    canPung = true; // 设置可以使用 PUNG 功能
    updateGameStatus('It\'s your turn');
    if (!hasPlayableCard()) {
        showMessage('You don\'t have any playable cards. Please click the DRAW button to draw a card.');
    }
}

// 基数惩罚的函数
function applyPenalty(targetPlayer) {
    console.log('Applying Penalty to:', targetPlayer);

    if (targetPlayer === 'player') {
        // 玩家未满足基数条件
        for (let i = 0; i < penaltyDrawCount; i++) {
            if (deck.length > 0) {
                playerHand.push(deck.pop());
            } else {
                showMessage('The deck is empty, no more cards can be drawn!');
                break;
            }
        }
        showMessage(`You failed to meet the penalty! You have drawn ${penaltyDrawCount} cards.`);
        updatePlayerHandUI();

        // 转移回合到 AI
        currentPlayer = 'ai';
        updateGameStatus('The bot\'s turn after penalty.');
        setTimeout(aiTurn, 1000); // 触发 AI 回合
    } else if (targetPlayer === 'ai') {
        // AI 未满足基数条件
        for (let i = 0; i < penaltyDrawCount; i++) {
            if (deck.length > 0) {
                aiHand.push(deck.pop());
            } else {
                showMessage('The deck is empty, no more cards can be drawn!');
                break;
            }
        }
        showMessage('The bot failed to meet the penalty and has drawn 2 cards!');
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



async function findPlayableCombination(hand, referenceCard, count) {
    const firstCards = hand.filter(card => {
        return (
            card.color === referenceCard.color || // 颜色相同
            card.letter === referenceCard.letter || // 字母相同
            card.color === 'Black' // 黑色牌
        );
    });

    for (let firstCard of firstCards) {
        const remainingCards = hand.filter(card => card !== firstCard);
        const combination = [firstCard, ...remainingCards.slice(0, count - 1)];
        if (combination.length === count) {
            const isValid = await validateSelectedCards(combination);
            if (isValid) {
                return combination; // 返回合法组合
            }
        }
    }
    return null; // 未找到合法组合
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

// 调用flask
async function validateWord(word) {
    try {
        const response = await fetch(`http://127.0.0.1:5001/validate?word=${encodeURIComponent(word.toLowerCase())}`);
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