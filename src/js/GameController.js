/* eslint-disable max-len */
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
    const { selectedCell } = this.gameState;
    let selectedCharacter;
    // Есть ли в памяти выбранный персонаж?
    if (this.gameState.selectedCharacter !== undefined && this.gameState.selectedCharacter !== null) {
      selectedCharacter = this.gameState.selectedCharacter;
    }

    // Персонаж еще не выбран
    if (selectedCharacter === undefined || selectedCharacter === null) {
      // В выбранной клетке кто-то есть
      if (character !== undefined && character !== null) {
        // Ход команды этого персонажа?
        if (character.team === this.gameState.turn) {
          // Может он ходить или атаковать?
          if (character.canWalk === false && character.canAttack === false) {
            GamePlay.showMessage('Персонаж будет доступен на следующем ходу');
            return;
          }
          // Новый персонаж выбран и записан в память
          this.selectNewCell(selectedCell, index);
          this.gameState.selectedCharacter = character;
          selectedCharacter = character;
        } else {
          GamePlay.showMessage(`Ход команды ${this.gameState.turn}`);
          return;
        }
      } else {
        return;
      }
    }

    // Персонаж выбран

    // Если персонаж стрелял и ходил - закончить ход.
    if (selectedCharacter.canWalk === false && selectedCharacter.canAttack === false) {
      GamePlay.showMessage('Персонаж будет доступен на следующем ходу');
      this.gameState.selectedCharacter = null;
      this.checkTurns();
      return;
    }

    const { walkDistance } = selectedCharacter.character;
    const { attackRange } = selectedCharacter.character;
    // В выбранной клетке пусто
    if (character === null) {
      // Выбранный персонаж может передвигаться?
      if (selectedCharacter.canWalk !== false) {
        // Он может попасть на эту клетку?
        if (GameController.checkWalkRange(selectedCell, walkDistance, index)) {
          selectedCharacter.position = index;
          this.selectNewCell(selectedCell, index);
          this.gamePlay.redrawPositions(getPositionedCharacters(this.playerTeam, this.computerTeam));
          this.gameState.selectedCharacter.canWalk = false;
          this.characterIsActive(selectedCharacter);
        } else {
          GamePlay.showError('Персонаж не может попасть на эту клетку');
        }
      }
      this.checkTurns();
      return;
    }

    // В выбранной клетке кто-то есть
    if (character !== null) {
      // Ход команды этого персонажа?
      if (character.team === this.gameState.turn) {
        this.selectNewCell(selectedCell, index);
        this.gameState.selectedCharacter = character;
        return;
      }
      // Персонаж может атаковать?
      if (selectedCharacter.canAttack !== false) {
        // Он может попасть в противника?
        if (GameController.checkCircleRange(selectedCell, attackRange, index)) {
          console.log('attack');

          this.gameState.selectedCharacter.canAttack = false;
          this.checkTurns();
          this.characterIsActive(selectedCharacter);
          return;
        }
        GamePlay.showError('Не попал - цель слишком далеко');
        this.gameState.selectedCharacter.canAttack = false;
        this.characterIsActive(selectedCharacter);
      }
    }
    this.checkTurns();
  }

  onCellEnter(index) {
    const character = GameController.findCharacterOnCell(this.playerTeam, this.computerTeam, index);
    const { selectedCharacter } = this.gameState;
    const { selectedCell } = this.gameState;
    const { tolltipCell } = this.gameState;
    this.gamePlay.setCursor(cursors.auto);

    // Отображение информации о персонаже
    if (character !== null) {
      const tooltipString = GameController.getTooltipString(character);
      this.gamePlay.showCellTooltip(tooltipString, index);
    }

    // Если есть выбранный персонаж
    if (selectedCharacter !== undefined && selectedCharacter !== null) {
      const { walkDistance } = selectedCharacter.character;
      const { attackRange } = selectedCharacter.character;

      // Клетка пустая
      if (character === null) {
        // Подсветка допустимых для перехода клеток
        if (selectedCharacter.canWalk !== false) {
        // Проверка максимальной дальности передвижения
          if (GameController.checkCircleRange(selectedCell, walkDistance, index)) {
          // Проверка по линиям
            if (GameController.checkWalkRange(selectedCell, walkDistance, index)) {
              this.selectNewCell(tolltipCell, index, 'green');
            } else {
              this.gamePlay.setCursor(cursors.notallowed);
              this.gamePlay.deselectCell(tolltipCell);
            }
          } else {
            this.gamePlay.setCursor(cursors.notallowed);
            this.gamePlay.deselectCell(tolltipCell);
          }
          return;
        }
        this.gamePlay.setCursor(cursors.notallowed);
      }

      // Клетка не пустая
      if (character !== null) {
        // Персонажи в одной команде
        if (character.team === this.gameState.turn) {
          this.gamePlay.setCursor(cursors.pointer);
          return;
        }
        // Персонаж противника
        if (character.team !== this.gameState.turn) {
          if (selectedCharacter.canAttack !== false) {
            if (GameController.checkCircleRange(selectedCell, attackRange, index)) {
              this.gamePlay.setCursor(cursors.crosshair);
              this.selectNewCell(selectedCell, index, 'red');
              this.gamePlay.deselectCell(tolltipCell);
              return;
            }
          }
          this.gamePlay.setCursor(cursors.notallowed);
        }
      }
    }
  }

  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);
  }

  selectNewCell(cell, index, color) {
    if (cell !== undefined && cell !== null) {
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

  characterIsActive(char) {
    if (char.canAttack === false && char.canWalk === false) {
      this.gameState.selectedCharacter = null;
      return false;
    }
    return true;
  }

  checkTurns() {
    if (this.playerTeam.members.every((char) => char.canAttack === false)
      && this.playerTeam.members.every((char) => char.canWalk === false)) {
      this.gameState.turn = this.computerTeam.type;
      this.playerTeam.members.forEach((item) => item.canAttack = true);
      this.playerTeam.members.forEach((item) => item.canWalk = true);
      alert('Ход второй команды');
      return;
    }

    if (this.computerTeam.members.every((char) => char.canAttack === false)
      && this.computerTeam.members.every((char) => char.canWalk === false)) {
      this.gameState.turn = this.playerTeam.type;
      this.computerTeam.members.forEach((item) => item.canAttack = true);
      this.computerTeam.members.forEach((item) => item.canWalk = true);
      alert('Ходит игрок');
    }
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

  static checkCircleRange(selected, allowedDistance, int) {
    const testArray = [8, 16, 24, 32, 40, 48, 56, 64];
    const lineIndex = testArray.findIndex((item) => item > int);
    const selectedLineIndex = testArray.findIndex((item) => item > selected);

    let columnsDistance;
    if ((int % 8) > (selected % 8)) {
      columnsDistance = (int % 8) - (selected % 8);
    } else {
      columnsDistance = (selected % 8) - (int % 8);
    }

    let rowsDistance;
    let result = false;
    if (lineIndex >= selectedLineIndex) {
      rowsDistance = lineIndex - selectedLineIndex;
    } else {
      rowsDistance = selectedLineIndex - lineIndex;
    }

    if (columnsDistance <= allowedDistance) {
      if (rowsDistance <= allowedDistance) {
        result = true;
      }
    }
    return result;
  }
}
