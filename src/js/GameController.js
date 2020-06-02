import Team from './Team';
import { getPositionedCharacters } from './PositionedCharacter';
import GameState from './GameState';
import GamePlay from './GamePlay';

export function getTooltipString(obj) {
  const icons = {
    attack: '\u2694',
    defence: '\uD83D\uDEE1',
    health: '\u2764',
    level: '\uD83C\uDF96',
  };
  const {
    attack, defence, health, level,
  } = obj.character;
  return `${icons.level}${level} ${icons.attack}${attack} ${icons.defence}${defence} ${icons.health}${health}`;
}

function findCharacterOnCell(teamA, teamB, index) {
  const aChar = teamA.members.find((char) => char.position === index);
  if (aChar !== undefined) {
    aChar.team = teamA.type;
    return aChar;
  }
  const bChar = teamB.members.find((char) => char.position === index);
  if (bChar !== undefined) {
    bChar.team = teamB.type;
    return bChar;
  }
  return null;
}

function checkWalkRange(cell, distance, index) {
  const testArr = [-9, -8, -7, -1, 1, 7, 8, 9];
  const resultArr = [];
  for (let i = 1; i <= distance; i += 1) {
    testArr.forEach((item) => {
      resultArr.push(cell - item * i);
    });
  }
  return resultArr.includes(index);
}

function checkAttackRange(selected, attackDistance, attackIndex) {
  const testArray = [8, 16, 24, 32, 40, 48, 56, 64];
  const attackLineIndex = testArray.findIndex((item) => item > attackIndex);
  const selectedLineIndex = testArray.findIndex((item) => item > selected);
  const columnsDistance = (attackIndex % 8) - (selected % 8);
  let rowsDistance;
  let result = false;
  if (attackLineIndex >= selectedLineIndex) {
    rowsDistance = attackLineIndex - selectedLineIndex;
  } else {
    rowsDistance = selectedLineIndex - attackLineIndex;
  }
  if (columnsDistance <= attackDistance) {
    if (rowsDistance <= attackDistance) {
      result = true;
    }
  }
  return result;
}

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.playerTeam = new Team('Player', 4, 4);
    this.computerTeam = new Team('Computer', 3, 3);
    this.gameState = new GameState();
  }

  init() {
    this.gamePlay.drawUi('prairie');
    this.gamePlay.redrawPositions(getPositionedCharacters(this.playerTeam, this.computerTeam));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
  }

  onCellClick(index) {
    const character = findCharacterOnCell(this.playerTeam, this.computerTeam, index);
    const { selectedCharacter } = this.gameState;
    const { selectedCell } = this.gameState;
    if (character === null) {
      if (checkWalkRange(selectedCell, selectedCharacter.character.walkDistance, index)) {
        selectedCharacter.position = index;
        this.selectNewCell(selectedCell, index);
        this.gamePlay.redrawPositions(getPositionedCharacters(this.playerTeam, this.computerTeam));
      } else {
        GamePlay.showError('Персонаж не может попасть на эту клетку');
      }
      return;
    }
    if (character.team !== this.gameState.turn) {
      if (checkAttackRange(selectedCell, selectedCharacter.character.attackRange, index)) {
        console.log('attack');
        return;
      }
      GamePlay.showError(`Ход команды ${this.gameState.turn}`);
    } else {
      this.selectNewCell(selectedCell, index);
      this.gameState.selectedCharacter = character;
    }
  }

  onCellEnter(index) {
    const character = findCharacterOnCell(this.playerTeam, this.computerTeam, index);
    if (character !== null) {
      const tooltipString = getTooltipString(character);
      this.gamePlay.showCellTooltip(tooltipString, index);
    }
  }

  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);
  }

  selectNewCell(cell, index) {
    if (cell !== undefined) {
      this.gamePlay.deselectCell(cell);
    }
    this.gamePlay.selectCell(index);
    this.gameState.selectedCell = index;
  }
}
