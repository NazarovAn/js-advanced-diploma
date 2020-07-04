import Character from '../Character';
import Daemon from '../characters/Daemon';

test('new Character error', () => {
  expect(() => new Character(10)).toThrow(new Error('new Character must be specified'));
});

test('new Daemon', () => {
  expect(new Daemon(10)).toEqual({
    attack: 60,
    attackRange: 4,
    defence: 30,
    health: 50,
    level: 10,
    team: 'Computer',
    type: 'daemon',
    walkDistance: 1,
  });
});
