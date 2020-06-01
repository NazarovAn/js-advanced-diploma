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
  const positionsA = teamA.startingPositions;
  const charactersA = teamA.members;
  const positionsB = teamB.startingPositions;
  const charactersB = teamB.members;
  const result = [];
  charactersA.forEach((item, index) => {
    result.push(new PositionedCharacter(item, positionsA[index]));
  });
  charactersB.forEach((item, index) => {
    result.push(new PositionedCharacter(item, positionsB[index]));
  });
  return result;
}
