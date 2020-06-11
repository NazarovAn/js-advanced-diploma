import Character from '../Character';

export default class Magician extends Character {
  constructor(level) {
    super(level, 'magician');
    this.attack = 60;
    this.defence = 30;
    this.walkDistance = 1;
    this.attackRange = 4;
    this.team = 'Player';
  }
}
