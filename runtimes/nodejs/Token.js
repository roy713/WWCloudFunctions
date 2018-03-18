/*
 */

var request = require('request');
var _ = require('lodash');
var currentToken;
var tokenExpiration = 0;

function main(params) {
  if (tokenExpiration < Date.now())
    return refresh(params);
  else
    return Promise.resolve(_.merge(_.omit(params, "WatsonWorkspace"), {
        jwt: currentToken,
        source: "cache"
      }));
}

function expires(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace('-', '+').replace('_', '/');
  var object = JSON.parse(Buffer.from(base64, 'base64').toString());
  return object.exp * 1000;
};

function refresh(params) {
  return new Promise((resolve, reject) => {
    request.post('https://api.watsonwork.ibm.com/oauth/token', {
      auth: {
        user: params.WatsonWorkspace.AppId,
        pass: params.WatsonWorkspace.AppSecret
      },
      json: true,
      form: {
        grant_type: 'client_credentials'
      }
    }, (err, res) => {
      if (err || res.statusCode !== 200) {
        reject(err || res);
      } else {
        currentToken = res.body.access_token;
        tokenExpiration = expires(currentToken);
        resolve(_.merge(_.omit(params, "WatsonWorkspace"), {
          source: "refresh",
          jwt: currentToken
        }));
      }
    })
  });
}
