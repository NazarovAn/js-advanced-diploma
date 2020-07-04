import GameController from '../GameController';

describe('tagged templates', () => test.each([
  ['1', {
    characteristics: {
      level: 1,
      attack: 20,
      defence: 40,
      health: 100,
    },
  }, '\uD83C\uDF961 \u269420 \uD83D\uDEE140 \u2764100',
  ],
  ['2', {
    characteristics: {
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
    expect(GameController.getTooltipString(object)).toEqual(expected);
  },
));


// Нужен тест на пункт №10 - Визуальный отклик
