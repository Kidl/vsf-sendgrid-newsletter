import SendgridState from '../types/SendgridState'
import { GetterTree } from 'vuex';

export const getters: GetterTree<SendgridState, any> = {
  isSubscribed: state => key => state.subscribed[key]
}
