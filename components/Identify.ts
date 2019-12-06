import { Subscribed } from '../types/SendgridState'

export const Identify = (list?: string) => ({

  methods: {
    async identify() {
      if (this.$store.getters['user/isLoggedIn']) {
        await this.$store
          .dispatch("sendgrid-newsletter/identify", {
            user: { email: this.$store.getters['user/getUserEmail'] },
            key: list
          })
      }
    }
  },

  computed: {
    [list ? `identifyList_${list}` : 'identifyListAll'](): Subscribed {
      return this.$store.state['sendgrid-newsletter'].subscribed[list];
    }
  }

})