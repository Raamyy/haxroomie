const logger = require('../../logger');
const colors = require('colors');

/** Handles the console logs that happen in the headless browser. */
class RoomErrorHandler {
  /**
   * @param {object} opt - Options.
   * @param {object} opt.page - RoomControllers page object.
   * @param {object} opt.emit - RoomControllers emit function.
   */
  constructor({ page, emit, roomId }) {
    this.page = page;
    this.emit = emit;
    this.roomId = roomId;

    this.handleConsole = this.handleConsole.bind(this);

    this.page.on('console', this.handleConsole);
  }

  /**
   * Handle the `console` event from Puppeteer.
   */
  handleConsole(msg) {
    if (msg.type() === 'error') {
      this.handleConsoleError(msg);
    } else if (msg.type() === 'warning') {
      this.handleConsoleWarning(msg);
    } else {
      this.handleConsoleLog(msg);
    }
  }
  /**
   * Handle console messages of type `error`.
   * @emits RoomController#error-logged
   */
  handleConsoleError(msg) {
    if (this.ignoreConsoleMsg(msg)) {
      return;
    }

    let logMsg = '';
    for (let jsHandle of msg.args()) {
      if (jsHandle._remoteObject.type === 'object') {
        logMsg += jsHandle._remoteObject.description;
      }
    }
    if (!logMsg) logMsg = msg.text();
    if (!logMsg) return;

    this.emit('error-logged', logMsg);
    logger.debug(
      `[${colors.cyan(this.roomId)}] [${colors.red('ERROR')}] ${logMsg}`
    );
  }

  /**
   * Handle console messages of type `warning`.
   * @emits RoomController#warning-logged
   */
  handleConsoleWarning(msg) {
    if (this.ignoreConsoleMsg(msg)) {
      return;
    }

    let logMsg = msg.text();
    if (!logMsg) return;

    this.emit('warning-logged', logMsg);
    logger.debug(
      `[${colors.cyan(this.roomId)}] ` +
        `[${colors.yellow('WARNING')}] ${logMsg}`
    );
  }

  /**
   * Handle console messages that are not warnings or errors.
   * @emits RoomController#info-logged
   */
  handleConsoleLog(msg) {
    let logMsg = msg.text();
    if (!logMsg) return;
    this.emit('info-logged', logMsg);
    logger.debug(
      `[${colors.cyan(this.roomId)}] ` +
        `[${colors.green('INFO')}] ${msg.text()}`
    );
  }

  ignoreConsoleMsg(msg) {
    const text = msg.text();

    // ignore the errors that happen during loading plugins
    if (
      text.startsWith(
        `Failed to load resource: the server responded with a status of 404`
      )
    ) {
      return true;
    }

    // do not display warning that happens during loading HHM
    if (msg.text().startsWith('[WARN HHM]:  No room config was provided')) {
      return true;
    }
    return false;
  }
}

module.exports = RoomErrorHandler;