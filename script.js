const BOARD_SIZE = 10;
const TOTAL_SQUARES = 100;

const SNAKES_AND_LADDERS = {
    2: 38, 7: 14, 8: 31, 15: 26, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 78: 98, 87: 94, 

    16: 6, 46: 25, 49: 11, 62: 19, 64: 60, 74: 53, 92: 88, 95: 75, 99: 80
};

const AVAILABLE_COLORS = [
    { name: 'Merah', color: 'var(--color-p1)' },
    { name: 'Biru', color: 'var(--color-p2)' },
    { name: 'Hijau', color: 'var(--color-p3)' },
    { name: 'Kuning', color: 'var(--color-p4)' }
];

// --- ELEMEN DOM ---
const boardContainerElement = document.getElementById('board-container');
const boardMarkersElement = document.getElementById('board-markers'); 
const playerCountSelect = document.getElementById('player-count');
const colorSelectionDiv = document.getElementById('player-color-selection');
const startGameBtn = document.getElementById('start-game-btn');
const rollDiceBtn = document.getElementById('roll-dice-btn'); 
const diceElement = document.getElementById('dice');
const currentPlayerInfo = document.getElementById('current-player-info');
const rollResultText = document.getElementById('roll-result-text'); 
const newGameBtn = document.getElementById('new-game-btn');

// --- ELEMEN AUDIO
const soundRoll = document.getElementById('sound-roll');
const soundMove = document.getElementById('sound-move');
const soundLadder = document.getElementById('sound-ladder');
const soundSnake = document.getElementById('sound-snake');
const soundWin = document.getElementById('sound-win');

// --- STATE PERMAINAN ---
let players = [];
let winners = [];
let currentPlayerIndex = 0;
let gameActive = false;
let gamePhase = 'setup';
let selectedColors = {}; 

// --- FUNGSI UTILITY & KOORDINAT ---

function playSound(audioElement) {
    if (audioElement && audioElement.play) {
        audioElement.currentTime = 0; 
        audioElement.play().catch(e => console.log("Error playing sound:", e));
    }
}

function getCoords(square) {
    const cellIndex = square - 1; 
    const rowFromBottom = Math.floor(cellIndex / BOARD_SIZE); 
    const isOddRowFromBottom = rowFromBottom % 2 !== 0; 

    let col;
    if (isOddRowFromBottom) {
        col = 9 - (cellIndex % BOARD_SIZE); 
    } else {
        col = cellIndex % BOARD_SIZE; 
    }

    const row = 9 - rowFromBottom; 
    
    return { x: col, y: row }; 
}

function getCenterPosition(square) {
    const coords = getCoords(square);
    const boardContainerElement = document.getElementById('board-container');
    if (!boardContainerElement) return { x: 0, y: 0 }; 
    const boardWidth = boardContainerElement.offsetWidth;
    const cellSize = boardWidth / BOARD_SIZE; 
    const x = coords.x * cellSize + (cellSize / 2);
    const y = coords.y * cellSize + (cellSize / 2);
    return { x, y }; 
}

function setPlayerPosition(playerIndex, square) {
    const playerToken = document.getElementById(`player-${playerIndex + 1}-token`);
    if (!playerToken) return; 
    const centerPos = getCenterPosition(square);
    const playersOnSameSquare = players.filter(p => p.position === square);
    const indexOnSquare = playersOnSameSquare.findIndex(p => p.id === players[playerIndex].id);
    const tokenOffset = (indexOnSquare - (playersOnSameSquare.length - 1) / 2) * (playerToken.offsetWidth * 0.6); 
    const xPos = centerPos.x - (playerToken.offsetWidth / 2) + tokenOffset;
    const yPos = centerPos.y - (playerToken.offsetHeight / 2) + tokenOffset;
    playerToken.style.transform = `translate(${xPos}px, ${yPos}px)`;
    players[playerIndex].position = square;
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    document.getElementById(screenId).classList.add('active');
    document.getElementById(screenId).style.display = 'flex';
}

function updateControlPanel() {
    const player = players[currentPlayerIndex];
    currentPlayerInfo.textContent = `Giliran ${player.id}`;
    currentPlayerInfo.style.color = player.color;
}

function animateMove(playerIndex, startPosition, endPosition, callback) {
    let currentPos = startPosition;
    const moveSpeed = 500; 

    function step() {
        if (currentPos < endPosition) {
            currentPos++;
            playSound(soundMove); 
            setPlayerPosition(playerIndex, currentPos); 
            setTimeout(step, moveSpeed);
        } else {
            if (callback) {
                callback();
            }
        }
    }
    step();
}

function changeTurn() {
    if (gamePhase !== 'playing') return;

    let nextPlayerIndex = currentPlayerIndex;
    let attempts = 0;
    
    do {
        nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
        attempts++;
        if (attempts > players.length) break; 

    } while (players[nextPlayerIndex].position >= TOTAL_SQUARES);

    currentPlayerIndex = nextPlayerIndex;
    updateControlPanel();
    
    rollDiceBtn.disabled = false; 
}

function checkAndMoveSL(player, currentPosition) {
    let finalPosition = SNAKES_AND_LADDERS[currentPosition];
    
    if (finalPosition) {
        let message = (finalPosition > currentPosition) ? 
            `Hore! Naik Tangga ke ${finalPosition}! 🪜` : 
            `Aww! Tergelincir Ular ke ${finalPosition}! 🐍`;
        
        playSound((finalPosition > currentPosition) ? soundLadder : soundSnake); 
        rollResultText.textContent = message;
        
        const token = document.getElementById(`player-${currentPlayerIndex + 1}-token`);
        token.classList.remove('no-transition'); 
        
        setTimeout(() => {
            setPlayerPosition(currentPlayerIndex, finalPosition);
            setTimeout(() => {
                changeTurn();
                rollDiceBtn.disabled = false;
            }, 600);
        }, 100); 

    } else {
        changeTurn();
        rollDiceBtn.disabled = false;
    }
}

function endGameCheck() {
    const remainingPlayers = players.filter(p => p.position < TOTAL_SQUARES);

    if (remainingPlayers.length === 1) {
        const lastPlayer = remainingPlayers[0];
        winners.push(lastPlayer);
        
        if (typeof confetti === 'function') {
            confetti({ particleCount: 200, spread: 360, origin: { x: 0.5, y: 0.5 } });
        }
        
        rollResultText.textContent = `${lastPlayer.id} adalah pemenang terakhir!`;
        alert(`Semua selesai! Urutan Kemenangan: ${winners.map(w => w.id).join(', ')}`);
        
        gamePhase = 'setup'; 
        gameActive = false;
        rollDiceBtn.disabled = true;
        newGameBtn.classList.remove('hidden');
        return true; 
    }
    return false; 
}

function updateColorSelectionDisplay() {
    const count = parseInt(playerCountSelect.value);
    
    document.querySelectorAll('.color-option').forEach((div, index) => {
        const playerNumber = index + 1;
        const playerToAssign = `Pemain ${playerNumber}`;
        const color = div.getAttribute('data-color');
        
        if (playerNumber <= count) {
            div.classList.remove('disabled');
            if (!selectedColors[playerToAssign]) {
                selectedColors[playerToAssign] = color;
            }
        } else {
            div.classList.add('disabled');
            div.classList.remove('selected');
            delete selectedColors[playerToAssign];
        }
        
        const chosenColor = selectedColors[playerToAssign];
        const isCurrentlySelected = Array.from(document.querySelectorAll('.color-option.selected')).some(opt => opt.getAttribute('data-color') === color);

        if (chosenColor === color) {
            div.classList.add('selected');
        } else if (div.classList.contains('selected') && !selectedColors[playerToAssign]) {
             div.classList.remove('selected');
        } else if (playerNumber <= count) {
             div.classList.remove('selected');
        }
    });

    const finalSelectedColors = {};
    document.querySelectorAll('.color-option.selected').forEach(opt => {
        const p = opt.getAttribute('data-player');
        if (parseInt(p.split(' ')[1]) <= count) {
             finalSelectedColors[p] = opt.getAttribute('data-color');
        }
    });
}

function initColorSelection() {
    colorSelectionDiv.innerHTML = '';
    
    AVAILABLE_COLORS.forEach((data, index) => {
        const div = document.createElement('div');
        div.className = 'color-option disabled'; 
        div.style.backgroundColor = data.color;
        div.setAttribute('data-color', data.color);
        div.setAttribute('data-player', `Pemain ${index + 1}`);

        if (index < 2) {
             selectedColors[`Pemain ${index + 1}`] = data.color;
             div.classList.add('selected');
        }

        div.addEventListener('click', function() {
            if (this.classList.contains('disabled')) return;
            
            const chosenColor = this.getAttribute('data-color');
            const playerToAssign = this.getAttribute('data-player');

            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                delete selectedColors[playerToAssign]; 
                return;
            }
            
            document.querySelectorAll('.color-option').forEach(opt => {
                if (opt.getAttribute('data-color') === chosenColor && opt.classList.contains('selected')) {
                    const otherPlayer = opt.getAttribute('data-player');
                    opt.classList.remove('selected');
                    delete selectedColors[otherPlayer];
                }
            });
            
            document.querySelectorAll(`.color-option[data-player="${playerToAssign}"]`).forEach(opt => {
                 opt.classList.remove('selected');
            });

            this.classList.add('selected');
            selectedColors[playerToAssign] = chosenColor;
        });
        
        colorSelectionDiv.appendChild(div);
    });
    
    updateColorSelectionDisplay();
}

function setupGame() {
    const count = parseInt(playerCountSelect.value);
    const requiredPlayers = Array.from({ length: count }, (_, i) => `Pemain ${i + 1}`);
    const missingColor = requiredPlayers.some(p => !selectedColors[p]);

    if (missingColor) {
        alert("Harap pilih warna untuk setiap pemain yang berpartisipasi.");
        return;
    }

    winners = [];
    players = [];
    currentPlayerIndex = 0;
    
    for (let i = 0; i < count; i++) {
        players.push({
            id: `Pemain ${i + 1}`,
            position: 1, 
            color: selectedColors[`Pemain ${i + 1}`] || AVAILABLE_COLORS[i].color,
        });
    }
    
    boardMarkersElement.innerHTML = '';
    players.forEach((player, index) => {
    const token = document.createElement('div');
    token.className = 'player-token no-transition'; 
    token.id = `player-${index + 1}-token`;
    token.style.backgroundColor = player.color;
    boardMarkersElement.appendChild(token); 
    
    players[index].position = 1; 
    setPlayerPosition(index, 1); 
    
    setTimeout(() => {
        setPlayerPosition(index, 1);
        token.classList.remove('no-transition');
    }, 50); 
});

    gamePhase = 'dice-off';
    updateControlPanel(); 
    
    rollDiceBtn.disabled = true; 
    switchScreen('game-screen');
    
    rollDiceBtn.disabled = false;
    
    rollResultText.textContent = `Ayo, ${players[currentPlayerIndex].id}, kocok dadu untuk menentukan giliran pertama!`;
}


function rollDice() {
    if (gamePhase === 'setup' || rollDiceBtn.disabled) return; 

    rollDiceBtn.disabled = true; 
    
    rollResultText.textContent = (gamePhase === 'dice-off') ? 'Mengocok dadu awal...' : 'Melempar...';
    newGameBtn.classList.add('hidden');

    playSound(soundRoll); 
    
    diceElement.classList.add('rolling'); 
    diceElement.textContent = ''; 
    
    const animationDuration = 1500; 

    setTimeout(() => {
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        
        diceElement.classList.remove('rolling'); 
        diceElement.className = `dice-face-${finalRoll}`; 
        
        rollResultText.textContent = `Hasil Dadu: ${finalRoll}`;
        
        if (gamePhase === 'dice-off') {
            handleDiceOffRoll(finalRoll); 
        } else if (gamePhase === 'playing') {
            movePlayer(finalRoll); 
        }
        
    }, animationDuration);
}

function handleDiceOffRoll(roll) {
    let player = players[currentPlayerIndex];
    player.diceOffRoll = roll;

    rollResultText.textContent = `${player.id} mendapat hasil dadu: ${roll}.`;

    const isLastPlayer = currentPlayerIndex === players.length - 1; 
    
    if (!isLastPlayer) {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        updateControlPanel();
        
        rollDiceBtn.disabled = false; 
        
        rollResultText.textContent += ` Sekarang giliran ${players[currentPlayerIndex].id} untuk kocok dadu awal.`;
        return;
    }

    players.sort((a, b) => b.diceOffRoll - a.diceOffRoll);
    currentPlayerIndex = 0;
    
    gamePhase = 'playing';
    gameActive = true; 
    
    updateControlPanel(); 
    
    rollResultText.textContent = `🎉 ${players[currentPlayerIndex].id} kocok dadu tertinggi (${players[currentPlayerIndex].diceOffRoll}) dan mulai duluan! Lempar Dadu!`;

    rollDiceBtn.disabled = false;
}


function movePlayer(roll) {
    let player = players[currentPlayerIndex];
    const startPosition = player.position; 
    let targetPosition = startPosition + roll;

    if (targetPosition >= TOTAL_SQUARES) {
        targetPosition = TOTAL_SQUARES;
        
        animateMove(currentPlayerIndex, startPosition, targetPosition, () => {
            
            winners.push(player);
            rollResultText.textContent = `${player.id} mencapai garis finish! Juara ke-${winners.length} 🎉`;
            playSound(soundWin); 
            
            if (typeof confetti === 'function') {
                confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
            }
            
            player.position = TOTAL_SQUARES; 

            if (!endGameCheck()) {
                changeTurn();
                rollDiceBtn.disabled = false;
            }
        });
        return;
    }

    animateMove(currentPlayerIndex, startPosition, targetPosition, () => {
        checkAndMoveSL(player, targetPosition);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (startGameBtn) startGameBtn.addEventListener('click', setupGame);
    if (playerCountSelect) playerCountSelect.addEventListener('change', updateColorSelectionDisplay);
    if (diceElement) diceElement.addEventListener('click', rollDice); 
    if (newGameBtn) newGameBtn.addEventListener('click', () => {
        switchScreen('home-screen');
    });

    if (rollDiceBtn) rollDiceBtn.disabled = true; 

    initColorSelection();
    switchScreen('home-screen');
});