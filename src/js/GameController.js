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
    if (character.team !== this.gameState.turn) {
      GamePlay.showError(`Ход команды ${this.gameState.turn}`);
    } else {
      const { selectedCell } = this.gameState;
      if (selectedCell !== undefined) {
        this.gamePlay.deselectCell(selectedCell);
      }
      this.gamePlay.selectCell(index);
      this.gameState.selectedCell = index;
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
}
