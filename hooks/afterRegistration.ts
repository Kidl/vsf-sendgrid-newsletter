import { KEY } from '../'
import { StorageManager } from '@vue-storefront/core/lib/storage-manager'
import * as types from '../store/mutation-types'

export async function afterRegistration({ Vue, store, isServer }) {
  if (!isServer) {
    Vue.prototype.$bus.$on('user-after-loggedin', receivedData => {
      store.dispatch('sendgrid-newsletter/identify', { user: receivedData })
    })

    if (!store.getters['user/isLoggedIn']) {
      try {
        const savedAsGuest = await StorageManager.get(KEY).getItem('saved-as-guest')
        store.commit(`${KEY}/${types.SET_SAVED_AS_GUEST}`, !!savedAsGuest)
      } catch (err) {
        console.log(err)
      }
    }
  }
}
