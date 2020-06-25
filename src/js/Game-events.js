export default class EventsWidget {
  constructor() {
    this.eventsWidget = document.getElementById('game-events');
  }

  static getMessage(text) {
    return `<div class="message">${text}</div>`;
  }

  insertMessage(message) {
    this.eventsWidget.innerHTML = '';
    this.eventsWidget.insertAdjacentHTML('afterbegin', EventsWidget.getMessage(message));
  }

  newGame(func) {
    this.eventsWidget.innerHTML = '';
    this.eventsWidget.insertAdjacentHTML('afterbegin', EventsWidget.getMessage('Начать новую игру'));
    const newGameMessage = document.querySelector('.message');
    newGameMessage.style.color = 'green';
    newGameMessage.addEventListener('click', () => func());
  }
}
