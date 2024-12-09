
const colors = ['Red', 'Blue', 'Green', 'Orange', 'Purple'];// 定义颜色
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');// 定义字母
const vowels = ['A', 'E', 'I', 'O', 'U'];// 定义字母
let deck = [];
let discardPile = [];
let playerHand = [];
let aiHand = [];
let currentCard = null;
let baseNumber = 1;
let currentPlayer = 'player'; 
let gameOver = false;
let selectedCards = []; // 玩家选中的牌
let canPung = false; // 是否可以PUNG
let isPungActive = false; // 是否处于PUNG状态
let pungTimer; 
let playOutTimer; // Play Out后的计时器
let penaltyActive = false; // 是否触发基数惩罚
let penaltyTarget = null; // 当前需要应对基数惩罚的玩家
const penaltyCardCount = 3; // 惩罚的基数
const penaltyDrawCount = 2; // 罚牌数


// 特殊词
const specialWords = ['AI', 'TNT', 'NB', 'IQ', 'HP', 'WC'];

// 消息提示框
function showMessage(message, duration = 3000) {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = message;
    messageBox.style.display = 'block';
    if (showMessage.timeout) {
        clearTimeout(showMessage.timeout);
    }
    showMessage.timeout = setTimeout(() => {
        messageBox.style.display = 'none';
    }, duration);
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
function playOut() {
    if (gameOver || selectedCards.length === 0) return;

    if (penaltyActive && penaltyTarget === 'player') {
        if (selectedCards.length < penaltyCardCount) {
            applyPenalty('player');
            return; // 未满足条件直接返回
        }
    }

    const firstCard = selectedCards[0];
    if (!canPlayCard(firstCard)) {
        showMessage('The first card does not match the last card on the table. Please check the rules.');
        return;
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



// 玩家点击PUNG按钮
function pung() {
    if (gameOver || !canPung) return;
    canPung = false;
    clearTimeout(playOutTimer);
    updateGameStatus('You can continue playing.');
}



// AI回合 + 加入基数惩罚的处理逻辑
function aiTurn() {
    console.log('Penalty Active:', penaltyActive);
    console.log('Penalty Target:', penaltyTarget);

    if (currentPlayer !== 'ai' || gameOver) return;

    if (penaltyActive && penaltyTarget === 'ai') {
        const playableCombination = findPlayableCombination(aiHand, currentCard, penaltyCardCount);

        console.log('Playable Combination:', playableCombination);

        if (playableCombination && playableCombination.length === penaltyCardCount) {
            for (let card of playableCombination) {
                playCard(aiHand, aiHand.indexOf(card), 'ai');
            }
            penaltyTarget = 'player';
            penaltyActive = true;
            console.log('AI met the penalty, transferring to player.');
            showMessage('The bot met the penalty! It\'s now your turn to face the penalty.');
            currentPlayer = 'player';
            updateGameStatus('It\'s your turn to face the penalty!');
            return;
        } else {
            console.log('AI failed to meet the penalty. Applying penalty.');
            applyPenalty('ai');
            return;
        }
    }

    console.log('AI is playing normally.');
    // 正常出牌逻辑
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

// 玩家回合逻辑
function playerTurn() {
    if (currentPlayer !== 'player' || gameOver) return;
    isPungActive = false;
    updateGameStatus('It\'s your turn');
    if (!hasPlayableCard()) {
        showMessage('You don\'t have any playable cards. Please click the DRAW button to draw a card.');
    }
    updateGameStatus('It\'s your turn');
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



function findPlayableCombination(hand, referenceCard, count) {
    const firstCards = hand.filter(card => {
        return (
            card.color === referenceCard.color || // 颜色相同
            card.letter === referenceCard.letter || // 字母相同
            card.color === 'Black' // 黑色牌
        );
    });

    console.log('Reference Card:', referenceCard);
    console.log('AI Hand:', hand);
    console.log('Valid First Cards:', firstCards);

    if (firstCards.length === 0) return null;

    for (let firstCard of firstCards) {
        const remainingCards = hand.filter(card => card !== firstCard);
        console.log('Remaining Cards for Combination:', remainingCards);

        if (remainingCards.length >= count - 1) {
            const combination = [firstCard, ...remainingCards.slice(0, count - 1)];
            console.log('Combination Found:', combination);
            if (combination.length === count) {
                return combination;
            }
        }
    }

    console.log('No Valid Combination Found');
    return null;
}


window.onload = initializeGame;