import Character from '../Character';

export default class Undead extends Character {
  constructor(level) {
    super(level, 'undead');
    this.attack = 60;
    this.defence = 30;
    this.walkDistance = 2;
    this.attackRange = 2;
    this.team = 'Computer';
  }
}
