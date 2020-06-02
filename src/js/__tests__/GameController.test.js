import { getTooltipString } from '../GameController';

describe('tagged templates', () => test.each([
  ['1', {
    character: {
      level: 1,
      attack: 20,
      defence: 40,
      health: 100,
    },
  }, '\uD83C\uDF961 \u269420 \uD83D\uDEE140 \u2764100',
  ],
  ['2', {
    character: {
      defence: 80,
      health: 10,
      level: 4,
      attack: 40,
    },
  }, '\uD83C\uDF964 \u269440 \uD83D\uDEE180 \u276410',
  ],
])(
  ('%s'),
  (level, object, expected) => {
    expect(getTooltipString(object)).toEqual(expected);
  },
));
