import { generateTeam, getRandomInt } from './generators';
import Bowman from './characters/Bowman';
import Swordsman from './characters/Swordsman';
import Magician from './characters/Magician';
import Daemon from './characters/Daemon';
import Undead from './characters/Undead';
import Vampire from './characters/Vampire';
import { PositionedCharacter } from './PositionedCharacter';

const playerCharactersTypes = new Set([
  Bowman,
  Swordsman,
  Magician,
]);

const computerCharactersTypes = new Set([
  Daemon,
  Undead,
  Vampire,
]);

export function getPlayerPositions(team, membersCount) {
  const intArray = [];
  const resultSet = new Set();
  let allowedLineA = 0;
  let allowedLineB = 1;
  if (team !== 'Player') {
    allowedLineA = 7;
    allowedLineB = 6;
  }
  for (let i = 0; i < 64; i += 1) {
    if (i % 8 === allowedLineA || i % 8 === allowedLineB) {
      intArray.push(i);
    }
  }
  while (resultSet.size < membersCount) {
    resultSet.add(intArray[getRandomInt(15, 0)]);
  }
  return Array.from(resultSet);
}

export default class Team {
  constructor(teamType, maxLevel, charactersCount) {
    this.type = teamType;
    if (teamType === 'Player') {
      this.members = generateTeam(playerCharactersTypes, maxLevel, charactersCount);
    } else {
      this.members = generateTeam(computerCharactersTypes, maxLevel, charactersCount);
    }
    if (charactersCount > 15) {
      throw new Error('Team size must be less than 15');
    }
    this.startingPositions = getPlayerPositions(teamType, charactersCount);
    // eslint-disable-next-line max-len
    this.members = this.members.map((char, index) => new PositionedCharacter(char, this.startingPositions[index]));
    delete this.startingPositions;
  }
}
