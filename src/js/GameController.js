/* eslint-disable max-len */
import Team from './Team';
import { getPositionedCharacters } from './PositionedCharacter';
import GamePlay from './GamePlay';
import cursors from './cursors';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.playerTeam = new Team('Player', 1, 5);
    this.computerTeam = new Team('Computer', 1, 5);
    this.turn = 'Player';
    this.singlePlayer = true;
    this.targetCellCharacter = null;
    this.selectedCharacter = null;
    this.selectedCell = null;
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
    this.targetCellCharacter = GameController.findCharacterOnCell(this.playerTeam, this.computerTeam, index);

    // Персонаж еще не выбран
    if (this.selectedCharacter === null) {
      // В выбранной клетке кто-то есть
      if (this.targetCellCharacter !== null) {
        // Ход команды этого персонажа?
        if (this.targetCellCharacter.team === this.turn) {
          // Может он ходить или атаковать?
          if (!this.characterIsActive(this.targetCellCharacter)) {
            GamePlay.showMessage('Персонаж будет доступен на следующем ходу');
            return;
          }
          // Новый персонаж выбран и записан
          this.selectNewCell(this.selectedCell, index);
          this.selectedCharacter = this.targetCellCharacter;
        }
      } else {
        GamePlay.showMessage('В выбранной клетке пусто');
        return;
      }
    }

    // Персонаж выбран
    const { walkDistance } = this.selectedCharacter.character;
    const { attackRange } = this.selectedCharacter.character;
    const selectedCharacterCanWalk = this.selectedCharacter.canWalk;
    const selectedCharacterCanAttack = this.selectedCharacter.canAttack;
    // В выбранной клетке пусто
    if (this.targetCellCharacter === null) {
      // Выбранный персонаж может передвигаться?
      if (selectedCharacterCanWalk !== false) {
        // Он может попасть на эту клетку?
        if (GameController.checkWalkRange(this.selectedCell, walkDistance, index)) {
          this.selectedCharacter.position = index;
          this.selectNewCell(this.selectedCell, index);
          this.gamePlay.redrawPositions(getPositionedCharacters(this.playerTeam, this.computerTeam));
          this.selectedCharacter.canWalk = false;
          this.characterIsActive(this.selectedCharacter);
          this.checkTurns();
        } else {
          GamePlay.showError('Персонаж не может попасть на эту клетку');
        }
      }
      return;
    }

    // В выбранной клетке кто-то есть
    if (this.targetCellCharacter !== null) {
      // Ход команды этого персонажа?
      if (this.targetCellCharacter.team === this.turn) {
        this.selectNewCell(this.selectedCell, index);
        this.selectedCharacter = this.targetCellCharacter;
        return;
      }
      // Персонаж может атаковать?
      if (selectedCharacterCanAttack !== false) {
        // Он может попасть в противника?
        if (GameController.checkCircleRange(this.selectedCell, attackRange, index)) {
          // Атака
          this.attack(this.selectedCharacter, this.targetCellCharacter, index);
          this.characterIsActive(this.selectedCharacter);
          this.checkTurns();
          return;
        }
        GamePlay.showError('Не попал - цель слишком далеко');
        this.selectedCharacter.canAttack = false;
        this.characterIsActive(this.selectedCharacter);
        this.checkTurns();
      }
    }
  }

  onCellEnter(index) {
    this.targetCellCharacter = GameController.findCharacterOnCell(this.playerTeam, this.computerTeam, index);
    this.gamePlay.setCursor(cursors.auto);

    // Отображение информации о персонаже
    if (this.targetCellCharacter !== null) {
      const tooltipString = GameController.getTooltipString(this.targetCellCharacter);
      this.gamePlay.showCellTooltip(tooltipString, index);
    }

    // Если есть выбранный персонаж
    if (this.selectedCharacter !== null) {
      const { walkDistance } = this.selectedCharacter.character;
      const { attackRange } = this.selectedCharacter.character;
      const { position } = this.selectedCharacter;
      const { canWalk } = this.selectedCharacter;
      const { canAttack } = this.selectedCharacter;
      const allowedWalkDistance = GameController.checkWalkRange(position, walkDistance, index);
      const allowedAttackRange = GameController.checkCircleRange(position, attackRange, index);

      // Клетка пустая
      // Подсветка допустимых для перехода клеток
      if (this.targetCellCharacter === null && canWalk !== false) {
        // Проверка максимальной дальности передвижения
        if (GameController.checkCircleRange(position, walkDistance, index)) {
          // Проверка по линиям
          if (allowedWalkDistance) {
            this.selectNewCell(this.tolltipCell, index, 'green');
            return;
          }
        }
        this.setNotallowedCell();
      } else {
        this.setNotallowedCell();
      }

      // Клетка не пустая
      if (this.targetCellCharacter !== null) {
        // Персонажи в одной команде
        if (this.targetCellCharacter.team === this.turn) {
          this.gamePlay.setCursor(cursors.pointer);
          return;
        }
        // Персонаж противника
        if (this.targetCellCharacter.team !== this.turn) {
          if (canAttack !== false) {
            if (allowedAttackRange) {
              this.gamePlay.setCursor(cursors.crosshair);
              this.selectNewCell(position, index, 'red');
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
    if (this.tolltipCell !== null) {
      this.gamePlay.deselectCell(this.tolltipCell);
    }
  }

  /**
   * Removes selection from ol
   *
   * @param {number} cell - index of cell to deselect.
   * @param {number} index - index of new cell to select.
   * @param {string} color - color of new cell.
   */
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

  setNotallowedCell() {
    this.gamePlay.setCursor(cursors.notallowed);
    this.gamePlay.deselectCell(this.tolltipCell);
  }

  /**
   * Returns false if character can't walk or attack.
   * Removes selection from character if character can't walk and attack.
   *
   * @param char
   */
  characterIsActive(char) {
    if (char.canAttack !== false || char.canWalk !== false) {
      return true;
    }
    this.gamePlay.deselectCell(this.selectedCharacter.position);
    this.selectedCharacter = null;
    return false;
  }

  /**
   * Calculates attack value, removes character from board if target health <= 0
   * and redraws caracters on field.
   *
   * @param attacker
   * @param target
   * @param attackIndex - index of target cell
   */
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
          this.removeCharacterFromTeam(attacked);
        }
      } finally {
        const aggressor = attacker;
        aggressor.canAttack = false;
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
      GamePlay.showMessage('Ход второй команды');
    }

    // Если идет игра против компьютера
    if (this.singlePlayer === true && this.turn !== 'Player') {
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
      GamePlay.showMessage('Ходит игрок');
    }
  }

  async computerResponse() {
    const computerTeam = this.computerTeam.members;
    for (let i = 0; i < computerTeam.length; i += 1) {
      this.computerTeamAttack(computerTeam[i]);
      // eslint-disable-next-line no-await-in-loop
      await GameController.waitForComputer(1000);
    }
  }

  static waitForComputer(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Attacking character with less defence value
   *
   * @param  attacker
   */
  computerTeamAttack(attacker) {
    const { position } = attacker;
    const { attackRange } = attacker.character;
    const targetsArr = this.playerTeam.members.filter((member) => {
      if (GameController.checkCircleRange(position, attackRange, member.position)) {
        return member;
      }
      return false;
    });

    if (targetsArr.length === 1) {
      this.attack(attacker, targetsArr[0], targetsArr[0].position);
      return true;
    }

    if (targetsArr.length > 1) {
      const target = targetsArr.reduce((a, b) => ((a.character.defence > b.character.defence) ? a : b));
      this.attack(attacker, target, target.position);
      return true;
    }
    return false;
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

  /**
   * Finds and returns character on cell, else returns null.
   *
   * @param teamA
   * @param teamB
   * @param index - index of target cell.
   */
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
