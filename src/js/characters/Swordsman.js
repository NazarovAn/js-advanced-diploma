import Character from '../Character';

export default class Swordsman extends Character {
  constructor(level) {
    super(level, 'swordsman');
    this.attack = 70;
    this.defence = 50;
    this.walkDistance = 4;
    this.attackRange = 1;
    this.team = 'Player';
  }
}
