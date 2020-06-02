import Character from './Character';

export class PositionedCharacter {
  constructor(character, position) {
    if (!(character instanceof Character)) {
      throw new Error('character must be instance of Character or its children');
    }

    if (typeof position !== 'number') {
      throw new Error('position must be a number');
    }

    this.character = character;
    this.position = position;
  }
}

export function getPositionedCharacters(teamA, teamB) {
  const charactersA = teamA.members;
  const charactersB = teamB.members;
  const result = [];
  charactersA.forEach((item) => {
    result.push(new PositionedCharacter(item.character, item.position));
  });
  charactersB.forEach((item) => {
    result.push(new PositionedCharacter(item.character, item.position));
  });
  return result;
}
