import i18n from '@vue-storefront/i18n';
import { required, email } from "vuelidate/lib/validators";
import { Subscribed } from '../types/SendgridState'

export const Subscribe = {

  name: "SendgridSubscribe",

  data () {
    return {
      email: this.$store.getters['user/isLoggedIn'] ? this.$store.getters['user/getUserEmail'] : ''
    };
  },

  validations: {
    email: {
      required,
      email
    }
  },

  methods: {
    async sendgridSubscribe({ list = null, silent = false } = {}) {
      let result = false
      if (!this.$v.$invalid) {
        result = await this.$store
          .dispatch("sendgrid-newsletter/subscribe", {
            email: this.email,
            ...(list ? { key: list } : {})
          })
      } else if (this.$store.getters['user/isLoggedIn']) {
        result = await this.$store
          .dispatch("sendgrid-newsletter/subscribe", {
            email: this.$store.getters['user/getUserEmail'],
            ...(list ? { key: list } : {})
          })
      }

      const success = result && result === true

      if (!silent) {
        this.$store.dispatch('notification/spawnNotification', {
          type: success ? 'success' : 'error',
          message: success
            ? i18n.t('You have been successfully subscribed to our newsletter!')
            : i18n.t(typeof result === 'string' ? result : 'Could not subscribe to newsletter!'),
          action1: { label: i18n.t('OK') }
        })
      }
    }
  },
  computed: {
    sendgridSubscriptions(): Subscribed {
      return this.$store.state['sendgrid-newsletter'].subscribed;
    }
  }
};
