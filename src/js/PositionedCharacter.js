import Character from './Character';

export class PositionedCharacter {
  constructor(character, position) {
    if (!(character instanceof Character)) {
      throw new Error('character must be instance of Character or its children');
    }

    if (typeof position !== 'number') {
      throw new Error('position must be a number');
    }

    this.characteristics = character;
    this.position = position;
    this.canWalk = true;
    this.canAttack = true;
  }
}

export function getPositionedCharacters(teamA, teamB) {
  const charactersA = teamA.members;
  const charactersB = teamB.members;
  const result = [];
  charactersA.forEach((item) => {
    result.push(new PositionedCharacter(item.characteristics, item.position));
  });
  charactersB.forEach((item) => {
    result.push(new PositionedCharacter(item.characteristics, item.position));
  });
  return result;
}
