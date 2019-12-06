import { apiStatus } from "../../../lib/util";
import { Router } from "express";
import client from "@sendgrid/client";
import { merge } from "lodash";

const Ajv = require("ajv");
const fs = require("fs");

const getAllLists = async (client) => {
  let request = {};
  request.method = "GET";
  request.url = "/v3/marketing/lists";

  try {
    let [response, ] = await client.request(request)
    return response.body.result
  } catch (err) {
    console.log(err.response.body);
    apiStatus(res, "Could not fetch lists, sorry!", 500);
  }
};

const mapListsToIds = (allLists, neededLists) => allLists.filter(list => list.name && neededLists.includes(list.name)).map(list => list.id)
const findListId = (allLists, neededList) => {
  const record = allLists.find(list => list.name === neededList)
  if (!record) {
    return false
  }
  return record.id
}

module.exports = ({ config, db }) => {
  let api = Router();
  client.setApiKey(config.extensions.sendgrid.key);

  api.post("/", async (req, res) => {
    const ajv = new Ajv();

    const contactSchema = require("./models/contact.schema.json");
    let contactSchemaExtension = {};
    if (fs.existsSync("./models/contact.schema.extension.json")) {
      contactSchemaExtension = require("./models/contact.schema.extension.json");
    }
    const validate = ajv.compile(merge(contactSchema, contactSchemaExtension));

    if (!validate(req.body)) {
      console.dir(validate.errors);
      apiStatus(res, validate.errors, 500);
      return;
    }

    const { lists } = req.body;
    let list_ids;

    if (lists) {
      const allLists = await getAllLists(client)
      list_ids = mapListsToIds(allLists, lists)
    }

    let request = {};
    request.body = {
      // Mapping to array
      ...(list_ids
        ? { list_ids: Array.isArray(list_ids) ? list_ids : [list_ids] }
        : {}),
      contacts: [req.body]
    };
    request.method = "PUT";
    request.url = "/v3/marketing/contacts";

    client
      .request(request)
      .then(([response]) => {
        if (response.statusCode === 202) {
          apiStatus(res, "Subscribed!", 200);
        } else {
          apiStatus(res, "Could not subscribe, sorry!", 500);
        }
      })
      .catch(err => {
        console.log(err.response.body);
        apiStatus(res, "Could not subscribe, sorry!", 500);
      });
  });

  api.get("/identify", async (req, res) => {
    const { email, list } = req.query;

    if (!email) {
      apiStatus(res, "Provide email address", 500);
    }

    let request = {};
    request.body = {
      query: `email = '${email}'`
    };
    request.method = "POST";
    request.url = "/v3/marketing/contacts/search";

    let list_id;

    if (list) {
      const allLists = await getAllLists(client)
      list_id = findListId(allLists, list)
      if (!list_id) {
        apiStatus(
          res,
          {
            exists: false
          },
          200
        );
      }
    }

    if (list_id && !!list_id.length) {
      request.body.query += ` AND CONTAINS(list_ids, '${list_id}')`
    }

    client
      .request(request)
      .then(([response]) => {
        console.log(response.body.contact_count);
        if (response.body.contact_count === 1) {
          apiStatus(
            res,
            {
              exists: true
            },
            200
          );
        } else {
          apiStatus(
            res,
            {
              exists: false
            },
            200
          );
        }
      })
      .catch(err => {
        console.log(err.response.body.errors);
        apiStatus(res, "Something went wrong, sorry!", 500);
      });
  });

  return api;
};
