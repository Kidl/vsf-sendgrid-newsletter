export function afterRegistration({ Vue, store, isServer }) {
  if (!isServer) {
    Vue.prototype.$bus.$on('user-after-loggedin', receivedData => {
      store.dispatch('sendgrid-newsletter/identify', { user: receivedData })
    })
  }
}
