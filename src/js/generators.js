export function getRandomInt(max, min) {
  const minInt = Math.ceil(min);
  const maxInt = Math.floor(max);
  return Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt;
}

/**
 * Generates random characters
 *
 * @param allowedTypes iterable of classes
 * @param maxLevel max character level
 * @returns Character type children (ex. Magician, Bowman, etc)
 */
export function characterGenerator(Type, maxLevel) {
  return new Type(maxLevel);
}

export function generateTeam(allowedTypes, maxLevel, characterCount) {
  const typesArr = Array.from(allowedTypes);
  const teamArr = [];
  for (let i = 0; i < characterCount; i += 1) {
    teamArr.push(characterGenerator(typesArr[getRandomInt(2, 0)], getRandomInt(maxLevel, 0)));
  }
  return teamArr;
}

// Изначально сделал так, но все созданные персонажи одного типа были одним объектом.

// export function* characterGenerator(allowedTypes, maxLevel) {
//   for (const Char of allowedTypes) {
//     yield new Char(getRandomInt(maxLevel, 1));
//   }
// }

// export function generateTeam(allowedTypes, maxLevel, characterCount) {
//   const allowedTypesArray = Array.from(characterGenerator(allowedTypes, maxLevel));
//   const teamArr = [];
//   for (let i = 0; i < characterCount; i += 1) {
//     teamArr.push(allowedTypesArray[getRandomInt(allowedTypesArray.length - 1, 0)]);
//   }
//   return teamArr;
// }
