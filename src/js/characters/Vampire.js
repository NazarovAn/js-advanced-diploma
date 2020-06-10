import Character from '../Character';

export default class Vampire extends Character {
  constructor(level) {
    super(level, 'vampire');
    this.attack = 40;
    this.defence = 10;
    this.walkDistance = 4;
    this.attackRange = 1;
    this.team = 'Computer';
  }
}
