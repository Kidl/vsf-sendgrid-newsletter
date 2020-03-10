import rootStore from '@vue-storefront/core/store';
import SendgridState from "../types/SendgridState";
import { ActionTree } from "vuex";
import * as types from "./mutation-types";
import config from "config";
import { currentStoreView, adjustMultistoreApiUrl } from '@vue-storefront/core/lib/multistore';
import { TaskQueue } from '@vue-storefront/core/lib/sync'
import { StorageManager } from '@vue-storefront/core/lib/storage-manager'
import { KEY } from '../'
import lodashGet from 'lodash.get'

const baseUrl: string = config.api.url.endsWith('/') ? config.api.url : `${config.api.url}/`
const setMagentoAttribute: boolean = config.sendgrid && config.sendgrid.addToMagentoList

const setSavedAsGuest = (commit, value: Boolean = true) => {
  commit(types.SET_SAVED_AS_GUEST, value)
  return StorageManager.get(KEY).setItem('saved-as-guest', value).catch((reason) => {
    console.error(reason) 
  })
}

const setCustomerInMagentoList = async (subscribed: Boolean = true) => {
  
  let customer = rootStore.state.user.current
  if (!customer) {
    return
  }

  customer.extension_attributes.is_subscribed = subscribed

  try {
    await rootStore.dispatch('user/update', { customer })
    return true

  } catch (err) {
    console.log('ERROR', err)
    return false
  }
}

const addGuestToMagentoList = async (email: string) => {
  try {
    let uri = adjustMultistoreApiUrl(`${baseUrl}api/ext/newsletter-guest`)
    let storeView = currentStoreView()
    let abbr = (<any>storeView).i18n.abbreviation
      ? (<any>storeView).i18n.abbreviation : storeView.i18n.fullCountryName

    await fetch(uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        country: abbr
      })
    })
  } catch (err) {
    console.log('ERROR', err)
    return false
  }
  return true
}

const addToMagentoList = async (email?: string) => {
  if (rootStore.getters['user/isLoggedIn']) {
    return await setCustomerInMagentoList(true)
  } else {
    return await addGuestToMagentoList(email)
  }
}

export const actions: ActionTree<SendgridState, any> = {

  async identify({ commit, state }, { user, key = undefined }) {
    const { email } = user
    let list = key

    try {
      let uri = `${baseUrl}api/ext/sendgrid-newsletter/identify?email=${email}`
      if (!list) {
        const { storeCode } = currentStoreView()
        list = lodashGet(config, `sendgrid.defaultLists["${storeCode}"]`, null)
      }

      if (list) {
        uri += `&list=${list}`
      }
      
      let { result } = await (await fetch(uri, {
        method: 'GET'
      })).json()


      const base = list ? { key: list, value: result.exists } : { value: result.exists }
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
      let abbr = (<any>storeView).i18n.abbreviation
        ? (<any>storeView).i18n.abbreviation : storeView.i18n.fullCountryName

      let lists
      if (typeof key === 'string') {
        lists = key
        if (lists === 'allList') {
          lists = lodashGet(config, `sendgrid.defaultLists["${storeView.storeCode}"]`, null)
        }
      } else {
        lists = key.filter(key => !state.subscribed[key])
      }

      try {
        let url = adjustMultistoreApiUrl(`${baseUrl}api/ext/sendgrid-newsletter`)
        if (rootStore.getters['user/isLoggedIn']) {
          url += `${url.includes('?') ? '&' : '?'}token=${rootStore.getters['user/getUserToken']}`
        }
        let { code, result } = await TaskQueue.execute({
          url,
          payload: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify({
              ...(!rootStore.getters['user/isLoggedIn'] ? { email } : {}),
              ...(!!abbr ? { country: abbr } : {}),
              ...(!!lists ? { lists } : {})
            })
          },
          silent: true
        })

        if (code !== 200) {
          if (code === 409 && setMagentoAttribute) {
            await addToMagentoList(email)
          }
          return result
        }

        if (lists && typeof lists === 'string') {
          lists = [lists]
        } 

        for (let list of lists) {
          commit(types.NEWSLETTER_SUBSCRIBE, {
            key: list
          })
        }

        if (!state.customer) {
          commit(types.SET_CUSTOMER, {
            email
          });
        }

        let magentoListStatus = true
        if (setMagentoAttribute) {
          await addToMagentoList(email)
        }
        if (!rootStore.getters['user/isLoggedIn']) {
          setSavedAsGuest(commit)
        }
        return magentoListStatus
  
      } catch (err) {
        console.log('ERROR', err)
        return false
      }

  },

  async unsubscribe({ commit, state }) {
    if (!rootStore.getters['user/isLoggedIn']) {
      console.log('You have to be logged in to unsubscribe')
      return
    }
    // let storeView = currentStoreView()
    // let abbr = (<any>storeView).i18n.abbreviation
    //   ? (<any>storeView).i18n.abbreviation : storeView.i18n.fullCountryName

    // let lists
    // if (typeof key === 'string') {
    //   lists = key
    //   if (lists === 'allList') {
    //     lists = lodashGet(config, `sendgrid.defaultLists["${storeView.storeCode}"]`, null)
    //   }
    // } else {
    //   lists = key.filter(key => !state.subscribed[key])
    // }

    try {
      let url = adjustMultistoreApiUrl(`${baseUrl}api/ext/sendgrid-newsletter`)
      url += `${url.includes('?') ? '&' : '?'}token=${rootStore.getters['user/getUserToken']}`
      // url += `&lists=${lists}`

      let { code, result } = await TaskQueue.execute({
        url,
        payload: {
          method: 'DELETE',
          mode: 'cors'
        },
        silent: true
      })

      if (code !== 200) {
        return result
      }

      commit(types.NEWSLETTER_UNSUBSCRIBE, {});

      let magentoListStatus = true
      if (setMagentoAttribute) {
        await setCustomerInMagentoList(false)
      }
      return magentoListStatus

    } catch (err) {
      console.log('ERROR', err)
      return false
    }

}

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
