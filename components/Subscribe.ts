import { required, email } from "vuelidate/lib/validators";
import { Subscribed } from '../types/SendgridState'

export const Subscribe = {

  name: "SendgridSubscribe",

  data() {
    return {
      email: ""
    };
  },

  validations: {
    email: {
      required,
      email
    }
  },

  methods: {
    async sendgridSubscribe(list?: string) {
      if (!this.$v.$invalid) {
        await this.$store
          .dispatch("sendgrid-newsletter/subscribe", {
            email: this.email,
            key: list
          })
      } else if (this.$store.getters['user/isLoggedIn']) {
        await this.$store
          .dispatch("sendgrid-newsletter/subscribe", {
            email: this.$store.getters['user/getUserEmail'],
            key: list
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
