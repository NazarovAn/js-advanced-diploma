/* eslint-disable max-len */
import Team, { getPlayerPositions } from './Team';
import { getRandomInt } from './generators';
import GamePlay from './GamePlay';
import cursors from './cursors';
import EventsWidget from './Game-events';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.level = 1;
    this.levelFeatures = GameController.chooseLevel(this.level, 2);
    this.playerTeam = this.levelFeatures.playerTeam;
    this.computerTeam = this.levelFeatures.computerTeam;
    this.turn = 'Player';
    this.targetCellCharacter = null;
    this.selectedCharacter = null;
    this.selectedCharacterCell = null;
    this.tooltipCell = null;
    this.points = 0;
    this.eventsWidget = new EventsWidget();
    this.gameOver = false;
    this.blockActions = false;
  }

  init() {
    this.gamePlay.drawUi(GameController.chooseLevel(this.level).theme);
    this.gamePlay.redrawPositions(this.playerTeam.members.concat(this.computerTeam.members));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addSaveGameListener(this.saveGame.bind(this));
    this.gamePlay.addNewGameListener(this.newGame.bind(this));
    this.gamePlay.addLoadGameListener(this.loadGame.bind(this));
  }

  saveGame() {
    const gameState = {
      playerTeam: this.playerTeam,
      computerTeam: this.computerTeam,
      turn: this.turn,
      level: this.level,
      points: this.points,
    };

    this.stateService.save(gameState);
  }

  loadGame() {
    const gameState = this.stateService.load('state');
    this.playerTeam = gameState.playerTeam;
    this.computerTeam = gameState.computerTeam;
    this.turn = gameState.turn;
    this.level = gameState.level;
    this.points = gameState.points;
    this.gamePlay.drawUi(GameController.chooseLevel(this.level).theme);
    this.gamePlay.redrawPositions(this.playerTeam.members.concat(this.computerTeam.members));
  }

  static chooseLevel(level, numberOfCharacters) {
    const levels = {
      1: {
        theme: 'prairie',
        playerTeam: new Team('Player', 1, numberOfCharacters),
        computerTeam: new Team('Computer', 1, numberOfCharacters),
      },
      2: {
        theme: 'desert',
        playerTeam: new Team('Player', 1, 1),
        computerTeam: new Team('Computer', 2, numberOfCharacters + 1),
      },
      3: {
        theme: 'arctic',
        playerTeam: new Team('Player', 2, 2),
        computerTeam: new Team('Computer', 3, numberOfCharacters + 2),
      },
      4: {
        theme: 'mountain',
        playerTeam: new Team('Player', 3, 2),
        computerTeam: new Team('Computer', 4, numberOfCharacters + 2),
      },
    };

    return levels[level];
  }

  newGame() {
    this.level = 1;
    this.levelFeatures = GameController.chooseLevel(this.level, 2);
    this.playerTeam = this.levelFeatures.playerTeam;
    this.computerTeam = this.levelFeatures.computerTeam;
    this.turn = 'Player';
    this.targetCellCharacter = null;
    this.selectedCharacter = null;
    this.selectedCharacterCell = null;
    this.tooltipCell = null;
    this.gamePlay.drawUi(GameController.chooseLevel(this.level).theme);
    this.gamePlay.redrawPositions(this.playerTeam.members.concat(this.computerTeam.members));
    this.gameOver = false;
  }

  checkGameOver() {
    if (this.gameOver) {
      return true;
    }
    if (this.playerTeam.members.length === 0) {
      GamePlay.showMessage(`      GAME OVER\n\n Набранные очки - ${this.points}`);
      this.eventsWidget.newGame(() => this.newGame());
      this.gameOver = true;
      return true;
    }

    if (this.computerTeam.members.length === 0) {
      this.level += 1;
      if (this.level > 4) {
        this.level = 2;
      }

      let points = 0;
      this.playerTeam.members.forEach((item) => {
        points += item.characteristics.health;
      });

      this.playerTeam.members.forEach((item) => {
        const character = item;
        GameController.levelUp(character);
        character.characteristics.health += 80;
        if (character.characteristics.health > 100) {
          character.characteristics.health = 100;
        }
      });

      this.points += points;
      this.levelFeatures = GameController.chooseLevel(this.level, this.playerTeam.members.length);
      this.playerTeam.members = this.playerTeam.members.concat(this.levelFeatures.playerTeam.members);
      this.computerTeam = this.levelFeatures.computerTeam;
      this.targetCellCharacter = null;
      this.selectedCharacter = null;
      this.selectedCharacterCell = null;
      this.tooltipCell = null;

      const newStartingPositions = getPlayerPositions('Player', this.playerTeam.members.length);
      this.playerTeam.members.forEach((char, index) => {
        const character = char;
        character.position = newStartingPositions[index];
        character.canAttack = true;
        character.canWalk = true;
      });

      this.gamePlay.drawUi(GameController.chooseLevel(this.level).theme);
      this.gamePlay.redrawPositions(this.playerTeam.members.concat(this.computerTeam.members));
    }

    return false;
  }

  onCellClick(index) {
    if (this.checkGameOver()) {
      return;
    }
    this.checkTurns();

    if (this.turn !== 'Player') {
      this.eventsWidget.insertMessage('Ходит компьютер');
      return;
    }

    const characterOnCell = this.findCharacterOnCell(index);

    if (this.selectedCharacter === null) {
      if (characterOnCell !== null) {
        if (characterOnCell.characteristics.team !== this.turn) {
          this.eventsWidget.insertMessage(`Ход команды ${this.turn}`);
          this.checkTurns();
          return;
        }

        if (!this.characterIsActive(characterOnCell)) {
          this.eventsWidget.insertMessage('Персонаж будет доступен на следующем ходу');
          this.checkTurns();
          return;
        }

        // Выбор нового персонажа
        this.selectedCharacter = characterOnCell;
        this.selectNewCell(null, this.selectedCharacter.position);
        this.checkTurns();
      }
      return;
    }

    if (characterOnCell === null) {
      if (!this.selectedCharacter.canWalk) {
        this.eventsWidget.insertMessage('Персонаж сможет ходить на следующем ходу');
        this.characterIsActive(this.selectedCharacter);
        this.checkTurns();
        return;
      }

      // Движение персонажа
      if (GameController.checkWalkRange(this.selectedCharacter, index)) {
        this.selectNewCell(this.selectedCharacter.position, index);
        this.selectedCharacter.position = index;
        this.selectedCharacter.canWalk = false;
        this.gamePlay.redrawPositions(this.playerTeam.members.concat(this.computerTeam.members));
        this.tooltipCell = null;
        this.characterIsActive(this.selectedCharacter);
        this.checkTurns();

        if (this.selectedCharacter === null) {
          return;
        }

        if (!this.canAttackSomeone(this.selectedCharacter)) {
          this.eventsWidget.insertMessage('Противник далеко, персонаж сможет атаковать на следующем ходу');
          this.selectedCharacter.canAttack = false;
          this.characterIsActive(this.selectedCharacter);
          this.checkTurns();
        }
      }
      this.checkTurns();
      return;
    }


    if (this.selectedCharacter.characteristics.team === characterOnCell.characteristics.team) {
      if (!this.characterIsActive(characterOnCell)) {
        this.eventsWidget.insertMessage('Персонаж будет доступен на следующем ходу');
        return;
      }

      // Отмена выбора персонажа
      if (characterOnCell === this.selectedCharacter) {
        this.gamePlay.deselectCell(index);
        this.selectedCharacter = null;
        this.selectedCharacterCell = null;
        return;
      }

      // Выбор другого персонажа той же команды
      this.selectNewCell(this.selectedCharacter.position, index);
      this.selectedCharacter = characterOnCell;
      return;
    }

    if (!this.selectedCharacter.canAttack) {
      this.eventsWidget.insertMessage('Персонаж сможет атаковать на следующем ходу');
      this.checkTurns();
      return;
    }

    if (!GameController.checkAttackRange(this.selectedCharacter, index)) {
      this.eventsWidget.insertMessage('Цель слишком далеко');
      this.selectedCharacter.canAttack = false;
      this.checkTurns();
      return;
    }

    this.attack(this.selectedCharacter, characterOnCell);
    this.characterIsActive(this.selectedCharacter);
  }

  onCellEnter(index) {
    const characterOnCell = this.findCharacterOnCell(index);
    this.gamePlay.setCursor(cursors.auto);

    // Отображение информации о персонаже
    if (characterOnCell !== null) {
      const tooltipString = GameController.getTooltipString(characterOnCell);
      this.gamePlay.showCellTooltip(tooltipString, index);
    }

    if (this.selectedCharacter !== null) {
      if (characterOnCell === null) {
        if (!this.selectedCharacter.canWalk) {
          this.gamePlay.setCursor(cursors.notallowed);
          return;
        }

        // Подсветка допустимых для перехода клеток
        if (GameController.checkWalkRange(this.selectedCharacter, index)) {
          this.selectNewCell(this.tooltipCell, index, 'green');
        } else {
          this.gamePlay.setCursor(cursors.notallowed);
        }
        return;
      }

      if (!this.selectedCharacter.canAttack) {
        this.gamePlay.setCursor(cursors.notallowed);
        return;
      }

      if (this.selectedCharacter.characteristics.team === characterOnCell.characteristics.team) {
        this.gamePlay.setCursor(cursors.pointer);
        return;
      }

      if (GameController.checkAttackRange(this.selectedCharacter, index)) {
        this.gamePlay.setCursor(cursors.crosshair);
        this.selectNewCell(this.tooltipCell, index, 'red');
        return;
      }
      this.gamePlay.setCursor(cursors.notallowed);
    }
  }

  onCellLeave(index) {
    this.gamePlay.setCursor(cursors.auto);
    this.gamePlay.hideCellTooltip(index);

    if (this.tooltipCell !== null) {
      this.gamePlay.deselectCell(this.tooltipCell);
      this.tooltipCell = null;
    }
  }


  static levelUp(char) {
    const character = char;
    character.characteristics.level += 1;
    const attackBefore = character.characteristics.attack;
    const life = character.characteristics.health;
    const attackAfter = Math.max(attackBefore, attackBefore * (1.8 - life / 100));
    character.characteristics.attack = attackAfter;
  }

  // Методы навигации

  /**
     * Finds and returns character on cell, else returns null.
     *
     * @param index - index of target cell.
     */
  findCharacterOnCell(index) {
    const aChar = this.playerTeam.members.find((char) => char.position === index);
    if (aChar !== undefined) {
      return aChar;
    }

    const bChar = this.computerTeam.members.find((char) => char.position === index);
    if (bChar !== undefined) {
      return bChar;
    }
    return null;
  }

  /**
   * Returns array of all or specified team positions.
   *
   * @param {string} team if undefined returns array of all characters positions.
   */
  findAllCaractersPositions(team) {
    const teamAArr = this.playerTeam.members.map((member) => member.position);
    const teamBArr = this.computerTeam.members.map((member) => member.position);
    if (team === undefined) {
      const joinedArr = teamAArr.concat(teamBArr);
      return joinedArr;
    }

    if (team === 'Player') {
      return teamAArr;
    }
    return teamBArr;
  }

  /**
   * Returns object with X and Y coordinates.
   *
   * @param {number} index
   */
  static convertToCoordinates(index) {
    const xPos = index % 8;
    const yPos = Math.floor(index / 8);
    return { xPos, yPos };
  }

  /**
   * Returns index from coordiantes
   *
   * @param {object} coordinates
   */
  static convertToIndex(coordinates) {
    const x = coordinates.xPos;
    const y = coordinates.yPos;
    return y * 8 + x;
  }

  // Методы проверок

  /**
   * Returns true if character can attack target cell.
   *
   * @param character
   * @param index - index of cell that need to be checked
   * @param customDistance
   */
  static checkAttackRange(character, index, customDistance) {
    let { attackRange } = character.characteristics;
    if (customDistance !== undefined) {
      attackRange = customDistance;
    }

    const { position } = character;
    const testArray = [8, 16, 24, 32, 40, 48, 56, 64];
    const lineIndex = testArray.findIndex((item) => item > index);
    const characterLineIndex = testArray.findIndex((item) => item > position);

    let columnsDistance;
    if ((index % 8) > (position % 8)) {
      columnsDistance = (index % 8) - (position % 8);
    } else {
      columnsDistance = (position % 8) - (index % 8);
    }

    let rowsDistance;
    let result = false;
    if (lineIndex >= characterLineIndex) {
      rowsDistance = lineIndex - characterLineIndex;
    } else {
      rowsDistance = characterLineIndex - lineIndex;
    }

    if (columnsDistance <= attackRange) {
      if (rowsDistance <= attackRange) {
        result = true;
      }
    }
    return result;
  }

  /**
   * @param character
   * @param index - null if all available for walking positions needed
   * @param customParam - if true returns all positions available for walking
   */
  static checkWalkRange(character, index, customParam) {
    const walker = character;
    const walkerPosition = walker.position;
    const { walkDistance } = walker.characteristics;
    const walkerCoords = GameController.convertToCoordinates(walkerPosition);
    const x = walkerCoords.xPos;
    const y = walkerCoords.yPos;
    const resultArr = [];

    for (let i = 1; i <= walkDistance; i += 1) {
      if (x - i >= 0) {
        const left = y * 8 + (x - i);
        resultArr.push(left);
      }
      if (x - i >= 0 && y - i >= 0) {
        const topLeft = (y - i) * 8 + (x - i);
        resultArr.push(topLeft);
      }
      if (y - i >= 0) {
        const top = (y - i) * 8 + x;
        resultArr.push(top);
      }
      if (x + i <= 7 && y - i >= 0) {
        const topRight = (y - i) * 8 + (x + i);
        resultArr.push(topRight);
      }
      if (x + i <= 7) {
        const right = y * 8 + (x + i);
        resultArr.push(right);
      }
      if (x + i <= 7 && y + i <= 7) {
        const bottomRight = (y + i) * 8 + (x + i);
        resultArr.push(bottomRight);
      }
      if (y + i <= 7) {
        const bottom = (y + i) * 8 + x;
        resultArr.push(bottom);
      }
      if (x - i >= 0 && y + i <= 7) {
        const bottomLeft = (y + i) * 8 + (x - i);
        resultArr.push(bottomLeft);
      }
    }

    if (customParam === true) {
      return resultArr;
    }
    return resultArr.includes(index);
  }

  /**
   * Returns true if any character is in attack range.
   *
   * @param character
   */
  canAttackSomeone(character) {
    const computerTeamPositions = this.findAllCaractersPositions(this.computerTeam.type);
    const playerTeamPositions = this.findAllCaractersPositions(this.playerTeam.type);
    let result;

    if (character.characteristics.team === this.playerTeam.type) {
      result = computerTeamPositions.filter((position) => {
        if (GameController.checkAttackRange(character, position)) {
          return character.position;
        }
        return false;
      });
    } else {
      result = playerTeamPositions.filter((position) => {
        if (GameController.checkAttackRange(character, position)) {
          return character.position;
        }
        return false;
      });
    }

    if (result.length >= 1) {
      return true;
    }

    return false;
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
    if (this.selectedCharacter === null) {
      return false;
    }
    this.gamePlay.deselectCell(this.selectedCharacter.position);
    this.selectedCharacter = null;
    this.selectedCharacterCell = null;
    return false;
  }

  /**
   * Changes turns if no characters can walk or attack.
   */
  checkTurns() {
    if (this.checkGameOver()) {
      return;
    }

    const playerTeam = this.playerTeam.members;
    const computerTeam = this.computerTeam.members;

    if (this.turn !== 'Player') {
      if (this.blockActions === true) {
        return;
      }

      this.computerResponse();
      computerTeam.forEach((item) => {
        const teamMember = item;
        teamMember.canAttack = true;
        teamMember.canWalk = true;
      });
      this.blockActions = true;
      return;
    }

    if (playerTeam.every((char) => char.canAttack === false) && playerTeam.every((char) => char.canWalk === false)) {
      this.turn = this.computerTeam.type;
      playerTeam.forEach((item) => {
        const teamMember = item;
        teamMember.canAttack = true;
        teamMember.canWalk = true;
      });
      this.eventsWidget.insertMessage('Ход второй команды');
      this.blockActions = false;
    }
  }

  // Утилитарные методы

  static getTooltipString(obj) {
    const icons = {
      attack: '\u2694',
      defence: '\uD83D\uDEE1',
      health: '\u2764',
      level: '\uD83C\uDF96',
    };
    const {
      attack, defence, health, level,
    } = obj.characteristics;
    return `${icons.level}${level} ${icons.attack}${attack} ${icons.defence}${defence} ${icons.health}${health}`;
  }

  /**
   * Removes character from team.
   *
   * @param obj - character to remove
   */
  removeCharacterFromTeam(obj) {
    const character = obj;
    if (this.playerTeam.members.includes(character)) {
      const removeIndex = this.playerTeam.members.indexOf(character);
      this.playerTeam.members.splice(removeIndex, 1);
    }
    if (this.computerTeam.members.includes(character)) {
      const removeIndex = this.computerTeam.members.indexOf(character);
      this.computerTeam.members.splice(removeIndex, 1);
    }
  }

  /**
   * Removes selection from old cell and selects new.
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
      this.tooltipCell = index;
      return;
    }
    this.gamePlay.selectCell(index);
    this.selectedCharacterCell = index;
  }

  /**
   * Calculates attack value, removes character from board if target health <= 0
   * and redraws caracters on field.
   *
   * @param attacker
   * @param target
   */
  attack(attacker, target) {
    (async () => {
      try {
        const attackIndex = target.position;
        const attacked = target;
        const attackValue = attacker.characteristics.attack;
        const targetDefence = attacked.characteristics.defence;
        const attackResult = Math.max(attackValue - targetDefence, attackValue * 0.1);

        // console.log('\nattackResult');
        // console.log(attackResult);

        attacked.characteristics.health -= attackResult;
        if (attacked.characteristics.health <= 0) {
          this.removeCharacterFromTeam(attacked);
        }

        await this.gamePlay.showDamage(attackIndex, attackResult);
      } finally {
        const aggressor = attacker;
        aggressor.canAttack = false;
        this.gamePlay.redrawPositions(this.playerTeam.members.concat(this.computerTeam.members));
        this.characterIsActive(aggressor);
      }
    })();
  }

  // Методы хода компьютера

  async computerResponse() {
    const computerTeam = this.computerTeam.members;

    for (let i = 0; i < computerTeam.length; i += 1) {
      this.computerTeamWalk(computerTeam[i]);
      // eslint-disable-next-line no-await-in-loop
      await GameController.waitForComputer(600);
    }

    for (let i = 0; i < computerTeam.length; i += 1) {
      this.computerTeamAttack(computerTeam[i]);
      // eslint-disable-next-line no-await-in-loop
      await GameController.waitForComputer(600);
    }

    this.turn = this.playerTeam.type;
    this.eventsWidget.insertMessage('Ход игрока');
    this.checkTurns();
  }

  /**
   * Helps to visualize computer actions.
   *
   * @param ms
   */
  static waitForComputer(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  computerTeamWalk(character) {
    const walker = character;
    if (walker.canWalk === false) {
      return;
    }
    if (this.canAttackSomeone(walker)) {
      walker.canWalk = false;
      return;
    }

    const availableForWalkArr = GameController.checkWalkRange(walker, null, true);
    const allCharactersPositions = this.findAllCaractersPositions();
    const filteredForWalkArr = availableForWalkArr.filter((item) => !allCharactersPositions.includes(item));

    if (filteredForWalkArr.length === 0) {
      console.log('no places to walk');
      return;
    }
    walker.position = filteredForWalkArr[getRandomInt(filteredForWalkArr.length - 1, 0)];
    walker.canWalk = false;
    this.gamePlay.redrawPositions(this.playerTeam.members.concat(this.computerTeam.members));
  }

  /**
   * Attacking character with less defence value
   *
   * @param  attacker
   */
  computerTeamAttack(attacker) {
    const aggressor = attacker;
    const targetsArr = this.playerTeam.members.filter((member) => {
      if (GameController.checkAttackRange(aggressor, member.position)) {
        return member;
      }
      return false;
    });

    if (targetsArr.length === 0) {
      console.log('targets too far');
      return;
    }

    const target = targetsArr.reduce((a, b) => ((a.characteristics.defence > b.characteristics.defence) ? a : b));
    this.attack(aggressor, target);
    aggressor.canWalk = false;
  }
}
