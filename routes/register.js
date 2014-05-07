/**
 * Module dependencies
 */

var oidc        = require('../lib/oidc')
  , Client      = require('../models/Client')
  , ClientToken = require('../models/ClientToken')
  ;


/**
 * Dynamic Client Registration Endpoints
 */

module.exports = function (server) {

  /**
   * Client Registration Endpoint
   */

  server.post('/register', function (req, res, next) {
    Client.insert(req.body, function (err, client) {
      if (err) { return next(err); }

      ClientToken.issue({

        iss: server.settings.issuer,
        sub: client._id,
        aud: client._id

      }, server.settings.privateKey, function (err, token) {
        if (err) { return next(err); }

        res.set({
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache'
        });

        res.json(201, client.configuration(server, token));
      });
    });
  });


  /**
   * Client Configuration Endpoint
   */

  server.get('/register/:clientId',
    oidc.verifyClientToken(server),
    oidc.verifyClientIdentifiers,
    function (req, res, next) {
      Client.get(req.token.payload.sub, function (err, client) {
        if (err) { return next(err); }
        if (!client) { return next(new NotFoundError()); }
        res.json(client.configuration(server));
      });
    });


  server.patch('/register/:clientId',
    oidc.verifyClientToken(server),
    oidc.verifyClientIdentifiers,
    function (req, res, next) {
      if (req.is('json')) {
        Client.patch(req.token.payload.sub, req.body, function (err, client) {
          if (err) { return next(err); }
          if (!client) { return next(new NotFoundError()); }
          res.json(client.configuration(server));
        });
      }

      // Wrong Content-type
      else {
        var err = new Error();
        err.error = 'invalid_request';
        err.error_description = 'Content-type must be application/json';
        err.statusCode = 400;
        next(err);
      }
    });


};
