export class Popup {
  static info(msg){ alert(msg); }
  static error(msg){ alert('ERROR: ' + msg); }
    static async confirm(msg) {
    return new Promise((resolve) => {
      const ok = confirm(msg);
      resolve(ok);
    });
  }
}
