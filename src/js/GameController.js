import Team from './Team';
import { getPositionedCharacters } from './PositionedCharacter';
import GameState from './GameState';
import GamePlay from './GamePlay';
import cursors from './cursors';

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
    const character = GameController.findCharacterOnCell(this.playerTeam, this.computerTeam, index);
    const { selectedCharacter } = this.gameState;
    const { selectedCell } = this.gameState;
    let walkDistance;
    let attackRange;
    if (selectedCharacter !== undefined) {
      walkDistance = selectedCharacter.character.walkDistance;
      attackRange = selectedCharacter.character.attackRange;
    }

    // Передвижение
    if (character === null) {
      if (GameController.checkWalkRange(selectedCell, walkDistance, index)) {
        selectedCharacter.position = index;
        this.selectNewCell(selectedCell, index);
        this.gamePlay.redrawPositions(getPositionedCharacters(this.playerTeam, this.computerTeam));
      } else {
        GamePlay.showError('Персонаж не может попасть на эту клетку');
      }
      return;
    }

    // Атака
    if (character.team !== this.gameState.turn) {
      if (GameController.checkCircleRange(selectedCell, attackRange, index)) {
        console.log('attack');
        return;
      }
      GamePlay.showError(`Ход команды ${this.gameState.turn}`);
    } else {
      this.selectNewCell(selectedCell, index);
      this.gameState.selectedCharacter = character;
    }

    // Отмена выбора персонажа
    if (character === selectedCharacter) {
      this.gamePlay.deselectCell(index);
      this.gameState.selectedCharacter = null;
    }
  }

  onCellEnter(index) {
    const character = GameController.findCharacterOnCell(this.playerTeam, this.computerTeam, index);
    const { selectedCharacter } = this.gameState;
    const { selectedCell } = this.gameState;
    const { tolltipCell } = this.gameState;
    let walkDistance;
    let attackRange;
    if (selectedCharacter !== undefined) {
      walkDistance = selectedCharacter.character.walkDistance;
      attackRange = selectedCharacter.character.attackRange;
    }

    // Отображение информации о персонаже
    if (character !== null) {
      const tooltipString = GameController.getTooltipString(character);
      this.gamePlay.showCellTooltip(tooltipString, index);
    }

    // Изменение курсора
    if (selectedCharacter !== undefined || selectedCharacter === null) {
      if (character === null) {
        this.gamePlay.setCursor(cursors.auto);
        // Подсветка допустимых для перехода клеток
        if (GameController.checkCircleRange(selectedCell, walkDistance, index)) {
          if (GameController.checkWalkRange(selectedCell, walkDistance, index)) {
            this.selectNewCell(tolltipCell, index, 'green');
          } else {
            this.gamePlay.setCursor(cursors.notallowed);
            this.gamePlay.deselectCell(tolltipCell);
          }
        } else {
          this.gamePlay.setCursor(cursors.notallowed);
        }
        return;
      } if (character !== null) {
        if (character.team !== this.gameState.turn
          && GameController.checkCircleRange(selectedCell, attackRange, index)) {
          this.gamePlay.setCursor(cursors.crosshair);
          this.selectNewCell(selectedCell, index, 'red');
          this.gamePlay.deselectCell(tolltipCell);
          return;
        } if (character.team === this.gameState.turn) {
          this.gamePlay.setCursor(cursors.pointer);
        } else {
          this.gamePlay.setCursor(cursors.notallowed);
        }
      }
    }
  }

  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);
  }

  selectNewCell(cell, index, color) {
    if (cell !== undefined) {
      this.gamePlay.deselectCell(cell);
    }
    if (color !== undefined) {
      this.gamePlay.selectCell(index, color);
      this.gameState.tolltipCell = index;
      return;
    }
    this.gamePlay.selectCell(index);
    this.gameState.selectedCell = index;
  }

  static getTooltipString(obj) {
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

  static findCharacterOnCell(teamA, teamB, index) {
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

  static checkWalkRange(cell, distance, index) {
    const testArr = [-9, -8, -7, -1, 1, 7, 8, 9];
    const resultArr = [];
    for (let i = 1; i <= distance; i += 1) {
      testArr.forEach((item) => {
        resultArr.push(cell - item * i);
      });
    }
    return resultArr.includes(index);
  }

  static checkCircleRange(selected, circleDistance, int) {
    const testArray = [8, 16, 24, 32, 40, 48, 56, 64];
    const lineIndex = testArray.findIndex((item) => item > int);
    const selectedLineIndex = testArray.findIndex((item) => item > selected);
    const columnsDistance = (int % 8) - (selected % 8);
    let rowsDistance;
    let result = false;
    if (lineIndex >= selectedLineIndex) {
      rowsDistance = lineIndex - selectedLineIndex;
    } else {
      rowsDistance = selectedLineIndex - lineIndex;
    }
    if (columnsDistance <= circleDistance) {
      if (rowsDistance <= circleDistance) {
        result = true;
      }
    }
    return result;
  }
}
