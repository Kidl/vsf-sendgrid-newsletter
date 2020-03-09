import { VueStorefrontModule, VueStorefrontModuleConfig } from '@vue-storefront/core/lib/module'
import { afterRegistration } from './hooks/afterRegistration'
import { module } from './store'
import { StorageManager } from '@vue-storefront/core/lib/storage-manager'

export const KEY = 'sendgrid-newsletter'

StorageManager.init(KEY)

const moduleConfig: VueStorefrontModuleConfig = {
  key: KEY,
  store: { modules: [{ key: KEY, module }] },
  afterRegistration
}

export const SendgridNewsletter = new VueStorefrontModule(moduleConfig)
