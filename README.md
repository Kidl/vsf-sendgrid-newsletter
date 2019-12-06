# Vue Storefront Sendgrid Newsletter Extension

The Sendgrid Newsletter integration module for [vue-storefront](https://github.com/DivanteLtd/vue-storefront).

## Installation

By hand (preferer):

```shell
git clone git@github.com:new-fantastic/vsf-sendgrid-newsletter.git src/modules
```
Or:
```shell
git submodule add https://github.com/new-fantastic/vsf-sendgrid-newsletter.git src/modules/vsf-sendgrid-newsletter
```

Registration the Sendgrid Newsletter module. Go to `src/modules/index.ts` or `src/modules/client.ts`

```js
...
import { SendgridNewsletter } from './vsf-sendgrid-newsletter'

export const registerModules: VueStorefrontModule[] = [
  ...
  SendgridNewsletter
]
```

If you use multistore add to each storeView in the config inside i18n 3 letter abbrevation, e.g. for Germany:
```json
"i18n": {
  "abbreviation": "DEU",
  "fullCountryName": "Germany",
  "fullLanguageName": "German",
  "defaultCountry": "DE",
  "defaultLanguage": "DE",
  "defaultLocale": "de-DE"
}
```

If you have single store add abrevation just to the main `i18n` inside config, e.g.:
```json
"i18n": {
  "abbreviation": "USA",
  "defaultCountry": "US",
  "defaultLanguage": "EN",
  "availableLocale": ["en-US","de-DE","fr-FR","es-ES","nl-NL", "jp-JP", "ru-RU", "it-IT", "pt-BR", "pl-PL", "cs-CZ"],
  "defaultLocale": "en-US",
  "currencyCode": "USD",
  "currencySign": "$",
  "priceFormat": "{sign}{amount}",
  "dateFormat": "HH:mm D/M/YYYY",
  "fullCountryName": "United States",
  "fullLanguageName": "English",
  "bundleAllStoreviewLanguages": true
}
```

Now open your VSF-API:
Copy content of API catalog to the`src/api/extensions/sendgrid-newsletter`.
Add to the config `sendgrid-newsletter`:
```json
"registeredExtensions": [
  "mailchimp-subscribe",
  "example-magento-api",
  "cms-data",
  "mail-service",
  "example-processor",
  "elastic-stock",
  "braintree",
  "sendgrid-newsletter"
]
```
And inside extensions
```json
"sendgrid": {
  "key": "<YOUR_KEY_HERE>"
}
```

## Endpoints
### Add contact to the list
POST `/api/ext/sengrid-newsletter`
Payload:
```ts
{
  email: string,
  country: string,
  lists?: Array<string> | string
}
```

*email* - That's obviously email address which wants to subscribe   
*country* - 3 Letter abbreviation of user's country   
*lists* - Inside contacts we can create lists. There we could put name of them. If we leaft it empty, Api would add Contact to **All contacts**   

Responses:
200 - "Subscribed!"   
500 - "Could not subscribe, sorry!"   
500 - "Could not fetch lists, sorry!"   

### Check if contact exists in the list
GET `/api/ext/sengrid-newsletter/identify?email=<requested_email>`
or
GET `/api/ext/sengrid-newsletter/identify?email=<requested_email>&list=<requested_list>`

*email* - That's obviously email address which wants to subscribe   
*list* - Inside contacts we can create lists. There we could put name of one of them. If we left it empty, Api would search inside **All contacts**   

Responses:
200 - 
```js
{
  exists: true / false
}
```
500 - "Provide email address"   
500 - "Could not fetch lists, sorry!"   
500 - "Something went wrong, sorry!"   

## Components / Mixins
### Subscribe.ts
Path to import: `src/modules/vsf-sendgrid-newsletter/components/Subscribe.ts`

It creates data field for email with the Vuelidate validator for it.   
It also provides method:   
```ts
sendgridSubscribe(list?: string)
```
We can specify *list* if we want to add to the specific list. Otherwise user would be added to All contacts.    

If user is authenticated, method does not require email from him. It will be taken from his profile. Otherwise, he/she has to provide it.   

And computed:   
```ts
sendgridSubscriptions(): Subscribed
```