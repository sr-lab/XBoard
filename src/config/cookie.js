/**
 * Created by OXOYO on 2019/5/29.
 *
 *
 */

export default {
  prefix: 'x-board-',
  path: '/',
  items: {
    account: 'a',
    token: 't',
    locale: 'l'
  },
  // cookie key - No need to clear when exiting
  unless: ['locale'],
  getItem (key) {
    return key ? this.prefix + this.items[key] : ''
  }
}
