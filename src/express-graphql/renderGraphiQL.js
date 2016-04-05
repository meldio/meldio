/* @flow */
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

type GraphiQLData = {
  query: ?string,
  variables: ?Object,
  result?: Object,
  rootValue: ?Object,
};

import { config as buildConfig } from '../../package';

const {
  clientVersion,
  graphiqlVersion,
  humaneVersion,
  reactVersion,
} = buildConfig;

/**
 * When express-graphql receives a request which does not Accept JSON, but does
 * Accept HTML, it may present GraphiQL, the in-browser GraphQL explorer IDE.
 *
 * When shown, it will be pre-populated with the result of having executed the
 * requested query.
 */
export function renderGraphiQL(data: GraphiQLData): string {
  const rootValue = data.rootValue || { };
  const config = rootValue.config || { };
  const enabledAuth = config.enabledAuth || [ ];
  const isFacebookEnabled = enabledAuth.includes('facebook');
  const isGoogleEnabled = enabledAuth.includes('google');
  const isGithubEnabled = enabledAuth.includes('github');
  const isPasswordEnabled = enabledAuth.includes('password');
  const isAuthEnabled = isFacebookEnabled || isGoogleEnabled ||
                        isGithubEnabled || isPasswordEnabled;

  const queryString = data.query;
  const variablesString =
    data.variables ? JSON.stringify(data.variables, null, 2) : null;
  const resultString =
    data.result ? JSON.stringify(data.result, null, 2) : null;

  /* eslint-disable max-len */
  return `<!--
The request to this GraphQL server provided the header "Accept: text/html"
and as a result has been presented GraphiQL - an in-browser IDE for
exploring GraphQL.

If you wish to receive JSON, provide the header "Accept: application/json" or
add "&raw" to the end of the URL within a browser.
-->
<!DOCTYPE html>
<html>
<head>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      overflow: hidden;
      width: 100%;
    }
  </style>
  <link href="//cdn.jsdelivr.net/graphiql/${graphiqlVersion}/graphiql.css" rel="stylesheet" />
  <link href="//cdn.jsdelivr.net/humane.js/${humaneVersion}/themes/jackedup.css" rel="stylesheet" />
  <script src="//cdn.jsdelivr.net/react/${reactVersion}/react.min.js"></script>
  <script src="//cdn.jsdelivr.net/react/${reactVersion}/react-dom.min.js"></script>
  <script src="//cdn.jsdelivr.net/graphiql/${graphiqlVersion}/graphiql.min.js"></script>
  <script src="//cdn.jsdelivr.net/meldio.client.js/${clientVersion}/meldio.min.js"></script>
  <script src="//cdn.jsdelivr.net/humane.js/${humaneVersion}/humane.min.js"></script>

  <style>
    * {
      margin: 0;
    }

    html, body {
      height: 100%;
    }

    #container {
      margin: 0 auto;
      min-height: 100%;
      height: 100% !important;
    }

    #graphiql-container .authpanel-spacer { padding-right: 14px; }
  </style>
</head>
<body>
  <div id="container"></div>
  <script>
    var notify = humane.create({
      timeout: 2500,
      waitForMove: true,
      timeoutAfterMove: 1000,
      clickToClose: true
    });

    // Collect the URL parameters
    var parameters = {};
    window.location.search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1));
      }
    });

    // Get the url of this endpoint
    var meldioUrl = window.location.origin;
    var meldio = new Meldio(meldioUrl);

    // Produce a Location query string from a parameter object.
    function locationQuery(params) {
      return '?' + Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(params[key]);
      }).join('&');
    }

    // Derive a fetch URL from the current URL, sans the GraphQL parameters.
    var graphqlParamNames = {
      query: true,
      variables: true,
      operationName: true
    };


    var otherParams = {};
    for (var k in parameters) {
      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
        otherParams[k] = parameters[k];
      }
    }
    var fetchURL = locationQuery(otherParams);

    // When the query and variables string is edited, update the URL bar so
    // that it can be easily shared.
    function onEditQuery(newQuery) {
      parameters.query = newQuery;
      updateURL();
    }

    function onEditVariables(newVariables) {
      parameters.variables = newVariables;
      updateURL();
    }

    function updateURL() {
      history.replaceState(null, null, locationQuery(parameters));
    }

    var MeldioGraphiQL = React.createClass({
      getInitialState: function() {
        return {
          isLoggedIn: meldio.isLoggedIn(),
          login: '',
          password: ''
        };
      },

      loginListenerHandler: function(isLoggedIn) {
        this.setState({ isLoggedIn: isLoggedIn });
      },

      componentWillMount: function() {
        var loginHandler = this.loginListenerHandler.bind(this, true);
        var logoutHandler = this.loginListenerHandler.bind(this, false);

        this.loginListener = meldio.addListener('login', loginHandler);
        this.logoutListener = meldio.addListener('logout', logoutHandler);
      },

      componentWillUnmount() {
        this.loginListener.remove();
        this.logoutListener.remove();
      },

      loginChangeHandler: function(e) {
        this.setState({ login: e.target.value });
      },

      passwordChangeHandler: function(e) {
        this.setState({ password: e.target.value });
      },

      onOAuthLogin: function(provider) {
        meldio.loginWithOAuthPopup(provider)
          .catch(function (err) {
            notify.log(err.message);
          });
      },

      onPasswordLogin: function() {
        meldio.loginWithPassword(this.state.login, this.state.password)
          .catch(function (err) {
            if (err.code === 'LOGIN_REQUIRED') {
              notify.log('Login is a required field.');
            } else if (err.code === 'PASSWORD_REQUIRED') {
              notify.log('Password is a required field.');
            } else if (err.code === 'INVALID_LOGINID') {
              notify.log('Login is invalid.');
            } else if (err.code === 'INVALID_PASSWORD') {
              notify.log('Password is invalid.');
            } else {
              notify.log(err.message);
            }
          });
      },

      onLogout: function () {
        meldio.logout();
      },

      render: function() {
        var logo = React.createElement(GraphiQL.Logo, { }, 'MELDIO');
        var toolbar = React.createElement(GraphiQL.Toolbar, { },
          !this.state.isLoggedIn ? [
            React.createElement('span', { className: 'authpanel-spacer' }),

            React.createElement(
              'em',
              { },
              'Authentication options: '),

            ${isFacebookEnabled ? `
              React.createElement(GraphiQL.ToolbarButton, {
                title: 'Facebook',
                label: 'Facebook',
                onClick: this.onOAuthLogin.bind(this, 'facebook')
              }),` : ``}

            ${isGoogleEnabled ? `
              React.createElement(GraphiQL.ToolbarButton, {
                title: 'Google',
                label: 'Google',
                onClick: this.onOAuthLogin.bind(this, 'google')
              }),` : ``}

            ${isGithubEnabled ? `
              React.createElement(GraphiQL.ToolbarButton, {
                title: 'Github',
                label: 'Github',
                onClick: this.onOAuthLogin.bind(this, 'github')
              }),` : ``}

            ${isPasswordEnabled ? `
              React.createElement('input', {
                type: 'text',
                placeholder: 'Login',
                tabIndex: 1,
                value: this.state.login,
                onChange: this.loginChangeHandler
              }),
              React.createElement('input', {
                type: 'password',
                placeholder: 'Password',
                tabIndex: 2,
                value: this.state.password,
                onChange: this.passwordChangeHandler
              }),
              React.createElement('a', {
                className: 'toolbar-button',
                title: 'Login',
                tabIndex: 3,
                onClick: this.onPasswordLogin
              }, 'Login') ` : ``}
          ] : [
            React.createElement('span', { className: 'authpanel-spacer' }),

            React.createElement(GraphiQL.ToolbarButton, {
              title: 'Logout',
              label: 'Logout',
              onClick: this.onLogout
            })
          ]
        );

        return (
          React.createElement(GraphiQL, {
            fetcher: meldio.graphql.bind(meldio),
            onEditQuery: onEditQuery,
            onEditVariables: onEditVariables,
            query: ${JSON.stringify(queryString)},
            response: ${JSON.stringify(resultString)},
            variables: ${JSON.stringify(variablesString)}
          }, ${ isAuthEnabled ? `[ logo, toolbar ]` : `[ logo ]`})
        );
      }
    });

    React.render(
      React.createElement(MeldioGraphiQL),
      document.getElementById('container'));
  </script>
</body>
</html>`;
}
