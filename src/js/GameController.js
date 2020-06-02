import Team from './Team';
import { getPositionedCharacters } from './PositionedCharacter';

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

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.playerTeam = new Team('Player', 4, 4);
    this.computerTeam = new Team('Computer', 3, 3);
  }

  init() {
    this.gamePlay.drawUi('prairie');
    this.gamePlay.redrawPositions(getPositionedCharacters(this.playerTeam, this.computerTeam));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    // this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
  }

  onCellClick(index) {
  }

  onCellEnter(index) {
    const playerCharOnCell = this.playerTeam.members.find((char) => char.position === index);
    const computerCharOnCell = this.computerTeam.members.find((char) => char.position === index);
    let tooltipString = '';
    if (playerCharOnCell !== undefined) {
      tooltipString = getTooltipString(playerCharOnCell);
    }
    if (computerCharOnCell !== undefined) {
      tooltipString = getTooltipString(computerCharOnCell);
    }

    this.gamePlay.showCellTooltip(tooltipString, index);
  }

  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);
  }
}
