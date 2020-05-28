import { calcTileType } from '../utils';

describe('calcTileType boardSize = 8', () => test.each([
  ['top-left - 0', 0, 'top-left'],
  ['top-right - 7', 7, 'top-right'],
  ['bottom-left - 56', 56, 'bottom-left'],
  ['bottom-right - 63', 63, 'bottom-right'],
  ['top - 4', 4, 'top'],
  ['bottom - 60', 60, 'bottom'],
  ['right - 31', 31, 'right'],
  ['left - 40', 40, 'left'],
  ['center - 28', 28, 'center'],
])(
  ('returned string %s index'),
  (level, index, result) => {
    const test = calcTileType(index, 8);
    expect(test).toBe(result);
  },
));
