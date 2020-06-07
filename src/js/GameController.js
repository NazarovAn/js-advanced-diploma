/* eslint-disable max-len */
import Team from './Team';
import { getPositionedCharacters } from './PositionedCharacter';
// import GameState from './GameState';
import GamePlay from './GamePlay';
import cursors from './cursors';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.playerTeam = new Team('Player', 1, 2);
    this.computerTeam = new Team('Computer', 1, 5);
    // this.gameState = new GameState();
    this.selectedCharacter = null;
    this.selectCell = null;
    this.turn = 'Player';
    this.singlePlayer = true;
    this.tolltipCell = null;
  }

  init() {
    this.gamePlay.drawUi('prairie');
    this.gamePlay.redrawPositions(getPositionedCharacters(this.playerTeam, this.computerTeam));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
  }

  onCellClick(index) {
    const onCellCharacter = GameController.findCharacterOnCell(this.playerTeam, this.computerTeam, index);
    if (this.selectedCharacter !== null) {
      // Если персонаж стрелял и ходил - закончить ход.
      if (this.selectedCharacter.canWalk === false && this.selectedCharacter.canAttack === false) {
        GamePlay.showMessage('Персонаж будет доступен на следующем ходу');
        this.checkTurns();
        this.selectedCharacter = null;
        return;
      }
    }

    // Персонаж еще не выбран
    if (this.selectedCharacter === null) {
      // В выбранной клетке кто-то есть
      if (onCellCharacter !== undefined && onCellCharacter !== null) {
        // Ход команды этого персонажа?
        if (onCellCharacter.team === this.turn) {
          // Может он ходить или атаковать?
          if (onCellCharacter.canWalk === false && onCellCharacter.canAttack === false) {
            GamePlay.showMessage('Персонаж будет доступен на следующем ходу');
            return;
          }
          // Новый персонаж выбран и записан
          this.selectNewCell(this.selectedCell, index);
          this.selectedCharacter = onCellCharacter;
        } else {
          GamePlay.showMessage(`Ход команды ${this.turn}`);
          return;
        }
      } else {
        return;
      }
    }

    // Персонаж выбран
    const { walkDistance } = this.selectedCharacter.character;
    const { attackRange } = this.selectedCharacter.character;
    // В выбранной клетке пусто
    if (onCellCharacter === null) {
      // Выбранный персонаж может передвигаться?
      if (this.selectedCharacter.canWalk !== false) {
        // Он может попасть на эту клетку?
        if (GameController.checkWalkRange(this.selectedCell, walkDistance, index)) {
          this.selectedCharacter.position = index;
          this.selectNewCell(this.selectedCell, index);
          this.gamePlay.redrawPositions(getPositionedCharacters(this.playerTeam, this.computerTeam));
          this.selectedCharacter.canWalk = false;
          this.characterIsActive(this.selectedCharacter);
        } else {
          GamePlay.showError('Персонаж не может попасть на эту клетку');
        }
      }
      this.checkTurns();
      return;
    }

    // В выбранной клетке кто-то есть
    if (onCellCharacter !== null) {
      // Ход команды этого персонажа?
      if (onCellCharacter.team === this.turn) {
        this.selectNewCell(this.selectedCell, index);
        this.selectedCharacter = onCellCharacter;
        return;
      }
      // Персонаж может атаковать?
      if (this.selectedCharacter.canAttack !== false) {
        // Он может попасть в противника?
        if (GameController.checkCircleRange(this.selectedCell, attackRange, index)) {
          // Атака
          this.attack(this.selectedCharacter, onCellCharacter, index);

          this.selectedCharacter.canAttack = false;
          this.checkTurns();
          this.characterIsActive(this.selectedCharacter);
          return;
        }
        GamePlay.showError('Не попал - цель слишком далеко');
        this.selectedCharacter.canAttack = false;
        this.characterIsActive(this.selectedCharacter);
      }
    }
    this.checkTurns();
  }

  onCellEnter(index) {
    const character = GameController.findCharacterOnCell(this.playerTeam, this.computerTeam, index);
    this.gamePlay.setCursor(cursors.auto);

    // Отображение информации о персонаже
    if (character !== null) {
      const tooltipString = GameController.getTooltipString(character);
      this.gamePlay.showCellTooltip(tooltipString, index);
    }

    // Если есть выбранный персонаж
    if (this.selectedCharacter !== null) {
      const { walkDistance } = this.selectedCharacter.character;
      const { attackRange } = this.selectedCharacter.character;

      // Клетка пустая
      if (character === null) {
        // Подсветка допустимых для перехода клеток
        if (this.selectedCharacter.canWalk !== false) {
        // Проверка максимальной дальности передвижения
          if (GameController.checkCircleRange(this.selectedCell, walkDistance, index)) {
          // Проверка по линиям
            if (GameController.checkWalkRange(this.selectedCell, walkDistance, index)) {
              this.selectNewCell(this.tolltipCell, index, 'green');
            } else {
              this.gamePlay.setCursor(cursors.notallowed);
              this.gamePlay.deselectCell(this.tolltipCell);
            }
          } else {
            this.gamePlay.setCursor(cursors.notallowed);
            this.gamePlay.deselectCell(this.tolltipCell);
          }
          return;
        }
        this.gamePlay.setCursor(cursors.notallowed);
      }

      // Клетка не пустая
      if (character !== null) {
        // Персонажи в одной команде
        if (character.team === this.turn) {
          this.gamePlay.setCursor(cursors.pointer);
          return;
        }
        // Персонаж противника
        if (character.team !== this.turn) {
          if (this.selectedCharacter.canAttack !== false) {
            if (GameController.checkCircleRange(this.selectedCell, attackRange, index)) {
              this.gamePlay.setCursor(cursors.crosshair);
              this.selectNewCell(this.selectedCell, index, 'red');
              this.gamePlay.deselectCell(this.tolltipCell);
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
      this.tolltipCell = index;
      return;
    }
    this.gamePlay.selectCell(index);
    this.selectedCell = index;
  }

  /**
   * Returns false if character can walk or attack.
   * Removes selection from character if character can't walk and attack
   *
   * @param char
   */
  characterIsActive(char) {
    if (char.canAttack === false && char.canWalk === false) {
      this.selectedCharacter = null;
      return false;
    }
    return true;
  }

  attack(attacker, target, attackIndex) {
    (async () => {
      try {
        const attacked = target;
        const attackValue = attacker.character.attack;
        const targetDefence = attacked.character.defence;
        const attackResult = Math.max(attackValue - targetDefence, attackValue * 0.1);
        await this.gamePlay.showDamage(attackIndex, attackResult);
        attacked.character.health -= attackResult;
        if (attacked.character.health <= 0) {
          console.log(attacked.character.health);

          this.removeCharacterFromTeam(attacked);
        }
      } finally {
        this.gamePlay.redrawPositions(getPositionedCharacters(this.playerTeam, this.computerTeam));
      }
    })();
  }

  checkTurns() {
    // Каждый персонаж команды игрока ходил и атаковал
    const playerTeam = this.playerTeam.members;
    if (playerTeam.every((char) => char.canAttack === false) && playerTeam.every((char) => char.canWalk === false)) {
      this.turn = this.computerTeam.type;
      playerTeam.forEach((item) => {
        const teamMember = item;
        teamMember.canAttack = true;
        teamMember.canWalk = true;
      });
      alert('Ход второй команды');
    }

    // Если идет игра против компьютера
    if (this.singlePlayer === true && this.turn === this.computerTeam.type) {
      console.log('computerResponse');
      this.computerResponse();
      return;
    }

    // Каждый персонаж второй команды ходил и атаковал
    const computerTeam = this.computerTeam.members;
    if (computerTeam.every((char) => char.canAttack === false) && computerTeam.every((char) => char.canWalk === false)) {
      this.turn = this.playerTeam.type;
      computerTeam.forEach((item) => {
        const teamMember = item;
        teamMember.canAttack = true;
        teamMember.canWalk = true;
      });
      alert('Ходит игрок');
    }
  }

  computerResponse() {
    const playerTeam = this.playerTeam.members;
    const computerTeam = this.computerTeam.members;
    const playerTeamPositions = new Array(playerTeam.length).fill(0).map((item, i) => playerTeam[i].position);
    computerTeam.forEach((char) => {
      console.log(char);
      
      const { position } = char;
      const { attackRange } = char.character;
      playerTeamPositions.forEach((pos, i) => {
        const targetPosition = pos;
        if (GameController.checkCircleRange(position, attackRange, targetPosition)) {
          console.log(GameController.checkCircleRange(char, char.character.attackRange, pos));
          console.log(playerTeam[i]);

          this.attack(char, playerTeam[i], pos);
        }
      });
    });
  }

  removeCharacterFromTeam(obj) {
    if (this.turn === 'Player') {
      const removeIndex = this.computerTeam.members.indexOf(obj);
      this.computerTeam.members.splice(removeIndex, 1);
    } else {
      const removeIndex = this.playerTeam.members.indexOf(obj);
      this.playerTeam.members.splice(removeIndex, 1);
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

  /**
   * Returns true if character can attack target cell.
   *
   * @param selected - selected character position
   * @param allowedDistance - max distance of characters attack.
   * @param int - index of cell that need to be checked
   */
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
