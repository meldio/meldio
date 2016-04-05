import invariant from '../../jsutils/invariant';
import values from '../../jsutils/values';
import strip from '../../jsutils/strip';
import {
  resolve as resolvePath,
  join as joinPath,
} from 'path';
import express from 'express';
import cors from 'cors';
import {
  json as jsonParser,
  urlencoded as urlEncodedParser,
} from 'body-parser';
import graphqlHTTP from '../../express-graphql';
import chalk from 'chalk';
import * as resolvers from '../../resolvers/mongodb';

import { build } from '../build';
import {
  parse,
  analyzeAST,
  validate,
  transformAST,
  generate,
} from '../../schema';
import {
  readFile,
  logo,
  loadEnv,
  loadConfig,
  newMasterSecret,
} from '../common';
import { HOOKS } from '../build';

import { relay } from './winchan';
import {
  AuthenticationHandler,
  LogoutHandler,
  OAuthHandlers,
  PasswordHandler
} from './security';

export async function run(options, preloadedConfig, preloadedEnv) {
  const CHECK = chalk.green.bold('\u2713');
  const X = chalk.red.bold('\u2718');

  const config = preloadedConfig ? preloadedConfig : await loadConfig();
  const {
    name: projectName,
    version: projectVersion,
    enabledAuth,
    schema: schemaFile,
    permissions: permissionsFile,
    mutations: mutationsDirectory,
    hooks: hooksDirectory,
    build: buildDirectory,
  } = config;
  const rootDirectory = config.root || '';
  const protocol = config.protocol || 'http';
  const host = options.host || config.host;
  const port = options.port || config.port;

  const envPath = rootDirectory ?
    resolvePath(joinPath(rootDirectory, '.env')) :
    resolvePath('.env');
  const env = preloadedEnv ? preloadedEnv : await loadEnv(envPath);

  if (!env.MASTER_SECRET) {
    env.MASTER_SECRET = await newMasterSecret();
  }

  if (!options.skipBuild) {
    const buildResult = await build(options, config);
    if (!buildResult) {
      return null;
    }
  }
  console.log(chalk.bgGreen(` starting... `));

  const app = express();
  app.use(jsonParser());
  app.use(urlEncodedParser({ extended: true }));

  app.use('/static', express.static(joinPath(__dirname, 'static')));

  const schemaPath = resolvePath(rootDirectory, schemaFile);
  const schemaText = await readFile(schemaPath);
  const ast = parse(schemaText);
  const schema = analyzeAST(ast);
  const results = validate(schema);
  const hasValidationErrors =
    Boolean(results.filter(r => r.kind === 'error').length);
  invariant(!hasValidationErrors, 'Cannot have errors while running');
  const transformedAST = transformAST(ast, schema);
  const result = generate(transformedAST, schema, resolvers);

  const permissionsPath = resolvePath(
    rootDirectory, buildDirectory, permissionsFile);
  let permissions = { };
  try {
    delete require.cache[require.resolve(permissionsPath)];
    const { permissions: permissionsFn } = require(permissionsPath);
    permissions = permissionsFn();
  } catch (e) {
    // permissions file missing
    permissions = { };
  }

  let db;
  try {
    db = await resolvers.connect(config, schema);
  } catch (e) {
    console.error(strip`
      | ${chalk.bgRed('Error')}${!e.meldio ? ' MongoDB connection failed:' : ''}
        ~ ${e.message}
      | ${ e.details || '' }
      |`);
    process.exit(1);
  }

  const mutations = values(schema)
    .filter(type => type.kind === 'mutation')
    .map(mutation => mutation.name)
    .reduce(
      (acc, mutation) => {
        const file = resolvePath(
          rootDirectory, buildDirectory, mutationsDirectory, mutation + '.js');
        delete require.cache[require.resolve(file)];
        const mutationModule = require(file);
        return { ...acc, ...mutationModule };
      },
      { });

  const rootValue = {
    db,
    permissions,
    mutations,
    config,
    env,
  };

  const hooks = Object.keys(HOOKS)
    .reduce(
      (acc, hook) => {
        const file = resolvePath(
          rootDirectory, buildDirectory, hooksDirectory, hook + '.js');
        let hookModule = { };
        try {
          delete require.cache[require.resolve(file)];
          hookModule = require(file);
        } catch (e) {
          return acc;
        }
        const hookFn = hookModule[hook];
        const context = resolvers.makeHookContext(schema, rootValue, hook);
        return { ...acc, [hook]: hookFn.bind(context) };
      },
      { });

  rootValue.hooks = hooks;

  app.use(cors());

  const handlers = OAuthHandlers(rootValue, resolvers);

  const setupOAuthRoutes = provider => {
    if (enabledAuth.includes(provider)) {
      const { redirect, accessTokenAuth, codeAuth } = handlers(provider);
      app.get(`/auth/${provider}`, redirect);
      app.post(`/auth/${provider}`, accessTokenAuth);
      app.get(`/auth/${provider}/callback`, codeAuth);
    }
  };

  setupOAuthRoutes('facebook');
  setupOAuthRoutes('google');
  setupOAuthRoutes('github');

  if (enabledAuth.includes('password')) {
    app.post(`/auth/password`, PasswordHandler(rootValue, resolvers));
  }

  app.post(`/auth/logout`, LogoutHandler(rootValue, resolvers));
  app.get(`/auth/relay`, relay);

  app.use('/graphql',
    AuthenticationHandler(env.MASTER_SECRET),
    graphqlHTTP(request => ({
      schema: result,
      rootValue: { ...rootValue, viewerId: request.viewerId },
      graphiql: true
    })));

  const server = await promiseToListen(app, port, host);

  const abbName = projectName.length > 15 ?
    projectName.substr(0, 12) + '...' :
    projectName;
  const abbVer = projectVersion.substr(0, 8);
  const gray = chalk.gray;

  const fb = enabledAuth.includes('facebook') ? CHECK : X;
  const goog = enabledAuth.includes('google') ? CHECK : X;
  const ghub = enabledAuth.includes('github') ? CHECK : X;
  const pass = enabledAuth.includes('password') ? CHECK : X;
  // const twtr = enabledAuth.includes('twitter') ? CHECK : X;

  const lines = [
    ``,
    gray(`     app ${chalk.cyan.bold(abbName)} ver ${chalk.cyan.bold(abbVer)}`),
    gray(`     ${chalk.underline(`${protocol}://${host}:${port}/graphql`)}`),
    gray(`     auth: ${fb} facebook   ${goog} google`),
    gray(`           ${ghub} github     ${pass} password`),
    gray(``)
  ];
  logo(lines);

  return server;
}

const promiseToListen = async (app, port, host) =>
  new Promise( (resolve, reject) => {
    const server = app.listen(port, host, error => {
      if (error) {
        reject(error);
      } else {
        resolve(server);
      }
    });
  });
