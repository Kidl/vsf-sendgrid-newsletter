import { VueStorefrontModule, VueStorefrontModuleConfig } from '@vue-storefront/core/lib/module'
import { afterRegistration } from './hooks/afterRegistration'
import { module } from './store'

const KEY = 'sendgrid-newsletter'

const moduleConfig: VueStorefrontModuleConfig = {
  key: KEY,
  store: { modules: [{ key: KEY, module }] },
  afterRegistration
}

export const SendgridNewsletter = new VueStorefrontModule(moduleConfig)
