import Character from '../Character';

export default class Bowman extends Character {
  constructor(level) {
    super(level, 'bowman');
    this.attack = 25;
    this.defence = 25;
    this.walkDistance = 2;
    this.attackRange = 2;
    this.team = 'Player';
  }
}
