import Character from '../Character';

export default class Daemon extends Character {
  constructor(level) {
    super(level, 'daemon');
    this.attack = 10;
    this.defence = 40;
    this.walkDistance = 1;
    this.attackRange = 4;
    this.team = 'Computer';
  }
}
