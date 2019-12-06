import { MutationTree } from 'vuex'
import * as types from './mutation-types'
import SendgridState from '../types/SendgridState'
import Vue from 'vue'

export const mutations: MutationTree<SendgridState> = {

  [types.SET_CUSTOMER] (state, customer) {
    state.customer = customer
  },

  [types.NEWSLETTER_SUBSCRIBE] (state, { key = 'allList', value = true }) {
    Vue.set(state.subscribed, key, value)
  },

  [types.NEWSLETTER_UNSUBSCRIBE] (state, { key = 'allList' }) {
    Vue.set(state.subscribed, key, false)
  },

}
