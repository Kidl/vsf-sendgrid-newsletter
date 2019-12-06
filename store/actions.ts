import SendgridState from "../types/SendgridState";
import { ActionTree } from "vuex";
import * as types from "./mutation-types";
import config from "config";
import { currentStoreView } from '@vue-storefront/core/lib/multistore';

const baseUrl = config.api.url.endsWith('/') ? config.api.url : `${config.api.url}/`

export const actions: ActionTree<SendgridState, any> = {

  async identify({ commit, state }, { user, key }) {
    const { email } = user

    try {
      let uri = `${baseUrl}api/ext/sendgrid-newsletter/identify?email=${email}`
      if (key) {
        uri += `&list=${key}`
      }
      let { result } = await (await fetch(uri, {
        method: 'GET'
      })).json()


      const base = key ? { key, value: result.exists } : { value: result.exists }
      commit(types.NEWSLETTER_SUBSCRIBE, base);

      if (!state.customer) {
        commit(types.SET_CUSTOMER, {
          email
        });
      }

    } catch (err) {
      console.log('ERROR', err)
    }
  },

  async subscribe({ commit, state }, { email, key = 'allList' }) {
      let storeView = currentStoreView()
      const storeCode = (<any>storeView).i18n.abbreviation ? (<any>storeView).i18n.abbreviation : storeView.i18n.fullCountryName

      let lists
      if (typeof key === 'string') {
        lists = key
        if (lists === 'allList') {
          lists = null
        }
      } else {
        lists = key.filter(key => !state.subscribed[key])
      }

      try {
        await fetch(`${baseUrl}api/ext/sendgrid-newsletter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            ...(!!storeCode ? { country: storeCode } : {}),
            ...(!!lists ? { lists } : {})
          })
        })

        commit(types.NEWSLETTER_SUBSCRIBE);

        if (!state.customer) {
          commit(types.SET_CUSTOMER, {
            email
          });
        }
  
      } catch (err) {
        console.log('ERROR', err)
      }

  },

  // unsubscribe({ commit, state }, email): Promise<Response> {
  //   if (state.isSubscribed) {

  //     const body: any = {email}
  //     if (config.storeViews.multistore === true) {

  //       const { storeCode } = currentStoreView()
  //       body.storeCode = storeCode

  //     }

  //     return new Promise((resolve, reject) => {
  //       fetch(config.klaviyo.endpoint.subscribe, {
  //         method: "DELETE",
  //         headers: { "Content-Type": "application/json" },
  //         mode: "cors",
  //         body: JSON.stringify(body)
  //       })
  //         .then(res => {
  //           commit(types.NEWSLETTER_UNSUBSCRIBE);

  //           if (
  //             !rootStore.state.user.current ||
  //             !rootStore.state.user.current.email
  //           ) {
  //             commit(types.SET_CUSTOMER, null);
  //           }

  //           resolve(res);
  //         })
  //         .catch(err => {
  //           reject(err);
  //         });
  //     });
  //   }
  // }

};
