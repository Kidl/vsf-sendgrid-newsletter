export interface Subscribed {
  allList: boolean,
  [key: string]: boolean
}

export default interface SendgridState {
  customer: Object | null,
  subscribed: Subscribed | null
}
