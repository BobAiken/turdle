// Global Variables
var winningWord = '';
var currentRow = 1;
var guess = '';
var gamesPlayed = [];
var wordsList;

// Query Selectors
var inputs = document.querySelectorAll('input');
var guessButton = document.querySelector('#guess-button');
var keyLetters = document.querySelectorAll('span');
var errorMessage = document.querySelector('#error-message');
var viewRulesButton = document.querySelector('#rules-button');
var viewGameButton = document.querySelector('#play-button');
var viewStatsButton = document.querySelector('#stats-button');
var gameBoard = document.querySelector('#game-section');
var letterKey = document.querySelector('#key-section');
var rules = document.querySelector('#rules-section');
var stats = document.querySelector('#stats-section');
var gameOverBox = document.querySelector('#game-over-section');
var gameOverGuessCount = document.querySelector('#game-over-guesses-count');
var gameOverGuessGrammar = document.querySelector('#game-over-guesses-plural');
var statsTotalGames = document.querySelector('#stats-total-games')
var statsPercentCorrect = document.querySelector('#stats-percent-correct')
var statsAverageGuesses = document.querySelector('#stats-average-guesses')

// Event Listeners
window.addEventListener('load', fetchWordList);

inputs.forEach(input => input.addEventListener('keyup', function() { moveToNextInput(event) }))

keyLetters.forEach(key => key.addEventListener('click', function() { clickLetter(event) }))

guessButton.addEventListener('click', submitGuess);

viewRulesButton.addEventListener('click', viewRules);

viewGameButton.addEventListener('click', viewGame);

viewStatsButton.addEventListener('click', fetchGameStats);

// Functions
function fetchWordList() {
  returnDataPromises().then((data) => {
    wordsList = data[0]
    // gamesPlayed = data[1]
    setGame()
  })
}

function setGame() {
  currentRow = 1;
  winningWord = getRandomWord();
  updateInputPermissions();
}

function getRandomWord() {
  var randomIndex = Math.floor(Math.random() * 2500);
  return wordsList[randomIndex];
}

function updateInputPermissions() {
  inputs.forEach(input=>{
    if(!input.id.includes(`-${currentRow}-`)) {
      input.disabled = true
    } else {
      input.disabled = false
    }
  })

  inputs[0].focus();
}

function moveToNextInput(e) {
  var key = e.keyCode || e.charCode;

  if( key !== 8 && key !== 46 ) {
    var indexOfNext = parseInt(e.target.id.split('-')[2]) + 1;
    inputs[indexOfNext].focus();
  }
}

function clickLetter(e) {
  var activeInput = null;
  var activeIndex = null;

  inputs.forEach((input,index)=>{
    if(input.id.includes(`-${currentRow}-`) && !input.value && !activeInput) {
      activeInput = input;
      activeIndex = index;
    }
  })

  activeInput.value = e.target.innerText;
  inputs[activeIndex + 1].focus();
}

function submitGuess() {
  if (checkIsWord()) {
    errorMessage.innerText = '';
    compareGuess();
    if (checkForWin()) {
      setTimeout(declareWinner, 1000);
    } else {
      if(currentRow !== 6){
        changeRow();
      } else {
        setTimeout(declareLoser, 1000)
      }
    }
  } else {
    errorMessage.innerText = 'Not a valid word. Try again!';
  }
}

function checkIsWord() {
  guess = '';

  inputs.forEach(input => {
    if(input.id.includes(`-${currentRow}-`)) {
        guess += input.value;
      }
  })

  return wordsList.includes(guess);
}

function compareGuess() {
  var guessLetters = guess.split('');

  guessLetters.forEach((letter,i)=>{
    if (winningWord.includes(letter) && winningWord.split('')[i] !== letter) {
          updateBoxColor(i, 'wrong-location');
          updateKeyColor(letter, 'wrong-location-key');
        } else if (winningWord.split('')[i] === letter) {
          updateBoxColor(i, 'correct-location');
          updateKeyColor(letter, 'correct-location-key');
        } else {
          updateBoxColor(i, 'wrong');
          updateKeyColor(letter, 'wrong-key');
        }
  })


}

function updateBoxColor(letterLocation, className) {
  var row = [];

  inputs.forEach(input=>{
    if(input.id.includes(`-${currentRow}-`)) {
          row.push(input);
        }
  })

  row[letterLocation].classList.add(className);
}

function updateKeyColor(letter, className) {
  var keyLetter = null;

  keyLetters.forEach(key => {
    if (key.innerText === letter) {
          keyLetter = key;
        }
  })

  keyLetter.classList.add(className);
}

function checkForWin() {
  return guess === winningWord;
}

function changeRow() {
  currentRow++;
  updateInputPermissions();
}

function declareWinner() {
  recordGameStats(true);
  changeGameOverText();
  viewGameOverMessage();
  setTimeout(startNewGame, 4000);
}

function declareLoser() {
  recordGameStats(false);
  errorMessage.innerText = `The winning word was ${winningWord}, try again!`
  setTimeout(startNewGame, 4000);
}

function recordGameStats(gameState) {
  fetch(`http://localhost:3001/api/v1/games`,{
    method: 'POST',
    body: JSON.stringify({ solved: gameState, guesses: currentRow }),
    headers: {
       'Content-Type': "application/json"
    }
  }).then(response => response.json())
}

function changeGameOverText() {
  gameOverGuessCount.innerText = currentRow;
  if (currentRow < 2) {
    gameOverGuessGrammar.classList.add('collapsed');
  } else {
    gameOverGuessGrammar.classList.remove('collapsed');
  }
}

function startNewGame() {
  clearGameBoard();
  errorMessage.innerText = ''
  clearKey();
  setGame();
  viewGame();
  inputs[0].focus();
}

function clearGameBoard() {
  inputs.forEach(input => {
    input.value = '';
    input.classList.remove('correct-location', 'wrong-location', 'wrong');
  })
}

function clearKey() {
  keyLetters.forEach(key => {
    key.classList.remove('correct-location-key', 'wrong-location-key', 'wrong-key');
  })
}

function findGamesPlayed(){
  return gamesPlayed.length
}

function findGuessCorrectPercent() {
  if (gamesPlayed.length !== 0) {
    return (gamesPlayed.reduce((numberCorrect,game)=>{
      if(game.solved){
        numberCorrect++
      }
      return numberCorrect
    },0)/gamesPlayed.length * 100).toFixed(2)
  } else {
    return 0
  }
}

function findAverageGuesses() {
  if (gamesPlayed.length > 0 ) {
    return (gamesPlayed.reduce((numberGuesses,game)=>{
      numberGuesses += (game.numGuesses)
      return numberGuesses
    },0)/gamesPlayed.length).toFixed(2)
  } else {
    return 0
  }
}

function fetchGameStats(){
  returnDataPromises().then((data)=>{
    gamesPlayed = data[1]
  })
  setTimeout(viewStats,50)
}

// Change Page View Functions

function viewRules() {
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.remove('collapsed');
  stats.classList.add('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.add('active');
  viewStatsButton.classList.remove('active');
}

function viewGame() {
  letterKey.classList.remove('hidden');
  gameBoard.classList.remove('collapsed');
  rules.classList.add('collapsed');
  stats.classList.add('collapsed');
  gameOverBox.classList.add('collapsed')
  viewGameButton.classList.add('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.remove('active');
}

function viewStats() {
  statsTotalGames.innerText = findGamesPlayed()
  statsPercentCorrect.innerText = findGuessCorrectPercent()
  statsAverageGuesses.innerText = findAverageGuesses()
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.add('collapsed');
  stats.classList.remove('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.add('active');
}

function viewGameOverMessage() {
  gameOverBox.classList.remove('collapsed')
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
}
