export default class GameState {
  static from(object) {
    if (typeof object === 'object') return object;
    return null;
  }
}
