import ProgressBar from 'progress';
import inquirer from 'inquirer';
import semver from 'semver';
import chalk from 'chalk';

import {
  resolve as resolvePath,
  join as joinPath,
} from 'path';

import strip from '../../jsutils/strip';

import {
  readFile,
  writeFile,
  mkdir,
  logo,
  loadEnv,
  writeEnv,
  createFileIfMissing,
  newMasterSecret,
} from '../common';

import {
  hooks,
  eslintrc,
  gitignore,
  permissions,
  schema,
} from './templates';

import { HOOKS } from '../build/checkHooks';

export async function init(project) {
  if (project) {
    const validName = validateName(project);
    if (!validName) {
      console.error(strip`
        |
        | ${chalk.bgRed('Error')}: ${validName}
        |
        `);
      return false;
    }
  }

  logo();

  const defaultScopes = {
    facebook: [ 'public_profile', 'email' ],
    github: [ 'user:email' ],
    google: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    // twitter: [ ],
  };
  let path = resolvePath(project || '.');
  const packagePath = joinPath(path, 'package.json');

  await mkdir(packagePath);

  let packageJson;
  try {
    const packageText = await readFile(packagePath);
    packageJson = JSON.parse(packageText);
  } catch (e) {
    packageJson = { };
  }

  const rootDirectory =
    packageJson.config && packageJson.config.meldio &&
    packageJson.config.meldio.root ?
      packageJson.config.meldio.root :
      '';

  const envPath = resolvePath(joinPath(rootDirectory || path, '.env'));
  const env = await loadEnv(envPath);

  const baseUrl = ans => `http://${ans.host}:${ans.port}`;
  const redirectUrl = ans => ({
    facebook: chalk.underline(`${baseUrl(ans)}/auth/facebook/callback`),
    google: chalk.underline(`${baseUrl(ans)}/auth/google/callback`),
    github: chalk.underline(`${baseUrl(ans)}/auth/github/callback`),
    // twitter: chalk.underline(`${baseUrl(ans)}/auth/twitter/callback`),
  });
  const instructions = ans => ({
    facebook:
      `\nfacebook: use the following for "Valid OAuth redirect URIs":\n` +
        `          "${redirectUrl(ans).facebook}"`,
    google:
      `\ngoogle: use the following for "Authorized Redirect URI":\n` +
        `        "${redirectUrl(ans).google}"`,
    // twitter:
    //   `\ntwitter: use the following for "Callback URL":\n` +
    //     `         "${redirectUrl(ans).twitter}"`,
    github:
      `\ngithub: use the following for "Authorization callback URL":\n` +
        `        "${redirectUrl(ans).github}"`,
    password:
      `\npassword`
  });

  const questions = [
    {
      type: 'input',
      name: 'project',
      message: 'Project name',
      default: packageJson.name ? packageJson.name : undefined,
      validate: validateName,
      when: () => !project || !project.length,
    },
    {
      type: 'input',
      name: 'version',
      message: 'Version',
      default: packageJson.version ? packageJson.version : undefined,
      validate: validateVersion,
    },
    {
      type: 'input',
      name: 'dbConnectionUri',
      message: 'MongoDB connection URI',
      default: answers =>
        packageJson.config && packageJson.config.meldio &&
        packageJson.config.meldio.dbConnectionUri ?
          packageJson.config.meldio.dbConnectionUri :
          `mongodb://localhost:27017/${project || answers.project}`,
    },
    {
      type: 'input',
      name: 'host',
      message: 'Meldio server host',
      default: packageJson.config && packageJson.config.meldio &&
        packageJson.config.meldio.host ?
          packageJson.config.meldio.host :
          'localhost',
    },
    {
      type: 'input',
      name: 'port',
      message: 'Meldio server port',
      default: packageJson.config && packageJson.config.meldio &&
        packageJson.config.meldio.port ?
          packageJson.config.meldio.port :
          9000,
      validate: value =>
        !Number.isInteger(Number.parseInt(value, 10)) ||
        Number.parseInt(value, 10) < 1024 ?
          'Port must be an integer value greater or equal to 1024' :
          true
    },
    {
      type: 'checkbox',
      name: 'enabledAuth',
      message: 'Select authentication methods',
      choices: ans => [
        {
          name: 'facebook',
          short: instructions(ans).facebook,
          checked: packageJson.config && packageJson.config.meldio &&
            packageJson.config.meldio.enabledAuth &&
            Array.isArray(packageJson.config.meldio.enabledAuth) &&
            packageJson.config.meldio.enabledAuth.includes('facebook'),
        },
        {
          name: 'google',
          short: instructions(ans).google,
          checked: packageJson.config && packageJson.config.meldio &&
            packageJson.config.meldio.enabledAuth &&
            Array.isArray(packageJson.config.meldio.enabledAuth) &&
            packageJson.config.meldio.enabledAuth.includes('google'),
        },
        // {
        //   name: 'twitter',
        //   short: instructions(ans).twitter,
        //   checked: packageJson.config && packageJson.config.meldio &&
        //     packageJson.config.meldio.enabledAuth &&
        //     Array.isArray(packageJson.config.meldio.enabledAuth) &&
        //     packageJson.config.meldio.enabledAuth.includes('twitter'),
        // },
        {
          name: 'github',
          short: instructions(ans).github,
          checked: packageJson.config && packageJson.config.meldio &&
            packageJson.config.meldio.enabledAuth &&
            Array.isArray(packageJson.config.meldio.enabledAuth) &&
            packageJson.config.meldio.enabledAuth.includes('github'),
        },
        {
          name: 'password',
          short: instructions(ans).password,
          checked: packageJson.config && packageJson.config.meldio &&
            packageJson.config.meldio.enabledAuth &&
            Array.isArray(packageJson.config.meldio.enabledAuth) &&
            packageJson.config.meldio.enabledAuth.includes('password'),
        },
      ]
    },
    {
      type: 'input',
      name: 'FACEBOOK_CLIENT_ID',
      message: 'Facebook App ID',
      validate: val => !val || !val.length ?
        'Facebook App ID is required' :
        true,
      when: answers => answers.enabledAuth.includes('facebook'),
      default:
        env && env.FACEBOOK_CLIENT_ID ?
          env.FACEBOOK_CLIENT_ID :
          undefined,
    },
    {
      type: 'password',
      name: 'FACEBOOK_CLIENT_SECRET',
      message: 'Facebook App Secret',
      validate: val => !val || !val.length ?
        'Facebook App Secret is required' :
        true,
      when: answers => answers.enabledAuth.includes('facebook'),
      default:
        env && env.FACEBOOK_CLIENT_SECRET ?
          env.FACEBOOK_CLIENT_SECRET :
          undefined,
    },

    {
      type: 'input',
      name: 'GOOGLE_CLIENT_ID',
      message: 'Google Client ID',
      validate: val => !val || !val.length ?
        'Google Client ID is required' :
        true,
      when: answers => answers.enabledAuth.includes('google'),
      default:
        env && env.GOOGLE_CLIENT_ID ?
          env.GOOGLE_CLIENT_ID :
          undefined,
    },
    {
      type: 'password',
      name: 'GOOGLE_CLIENT_SECRET',
      message: 'Google Client Secret',
      validate: val => !val || !val.length ?
        'Google Client Secret is required' :
        true,
      when: answers => answers.enabledAuth.includes('google'),
      default:
        env && env.GOOGLE_CLIENT_SECRET ?
          env.GOOGLE_CLIENT_SECRET :
          undefined,
    },

    // {
    //   type: 'input',
    //   name: 'TWITTER_CLIENT_ID',
    //   message: 'Twitter API Key',
    //   validate: val => !val || !val.length ?
    //     'Twitter API Key is required' :
    //     true,
    //   when: answers => answers.enabledAuth.includes('twitter'),
    //   default:
    //     env && env.TWITTER_CLIENT_ID ?
    //       env.TWITTER_CLIENT_ID :
    //       undefined,
    // },
    // {
    //   type: 'password',
    //   name: 'TWITTER_CLIENT_SECRET',
    //   message: 'Twitter API Secret',
    //   validate: val => !val || !val.length ?
    //     'Twitter API Secret is required' :
    //     true,
    //   when: answers => answers.enabledAuth.includes('twitter'),
    //   default:
    //     env && env.TWITTER_CLIENT_SECRET ?
    //       env.TWITTER_CLIENT_SECRET :
    //       undefined,
    // },

    {
      type: 'input',
      name: 'GITHUB_CLIENT_ID',
      message: 'GitHub Client ID',
      validate: val => !val || !val.length ?
        'Github Client ID is required' :
        true,
      when: answers => answers.enabledAuth.includes('github'),
      default:
        env && env.GITHUB_CLIENT_ID ?
          env.GITHUB_CLIENT_ID :
          undefined,
    },
    {
      type: 'password',
      name: 'GITHUB_CLIENT_SECRET',
      message: 'GitHub Client Secret',
      validate: val => !val || !val.length ?
        'GitHub Client Secret is required' :
        true,
      when: answers => answers.enabledAuth.includes('github'),
      default:
        env && env.GITHUB_CLIENT_SECRET ?
          env.GITHUB_CLIENT_SECRET :
          undefined,
    },

    {
      type: 'list',
      name: 'passwordHashStrength',
      message: 'Select password hash strength',
      default:
        packageJson.config && packageJson.config.meldio &&
        packageJson.config.meldio.passwordHashStrength &&
        [ 12, 13, 14, 15, 16 ]
          .includes(packageJson.config.meldio.passwordHashStrength) ?
          packageJson.config.meldio.passwordHashStrength :
          12,
      choices: [
        { name: '12', value: 12 },
        { name: '13', value: 13 },
        { name: '14', value: 14 },
        { name: '15', value: 15 },
        { name: '16', value: 16 },
      ],
      when: answers => answers.enabledAuth.includes('password'),
    },

    {
      type: 'list',
      name: 'sessionDurationUnit',
      message: 'Select authentication session duration unit',
      default:
        packageJson.config && packageJson.config.meldio &&
        packageJson.config.meldio.sessionDurationUnit &&
        [ 'hours', 'days', 'weeks', 'months' ]
          .includes(packageJson.config.meldio.sessionDurationUnit) ?
          packageJson.config.meldio.sessionDurationUnit :
          'days',
      choices: [
        { name: 'hours' },
        { name: 'days' },
        { name: 'weeks' },
        { name: 'months' },
      ],
      when: answers => answers.enabledAuth.length,
    },
    {
      type: 'input',
      name: 'sessionDuration',
      message: answers =>
        'Session duration in ' + answers.sessionDurationUnit,
      default: answers =>
        packageJson.config && packageJson.config.meldio &&
        packageJson.config.meldio.sessionDuration &&
        packageJson.config.meldio.sessionDurationUnit ===
          answers.sessionDurationUnit ?
          packageJson.config.meldio.sessionDuration :
        answers.sessionDurationUnit === 'hours' ? 48 :
        answers.sessionDurationUnit === 'days' ? 2 :
        answers.sessionDurationUnit === 'weeks' ? 1 :
        answers.sessionDurationUnit === 'months' ? 1 :
          undefined,
      validate: value =>
        !Number.isInteger(Number.parseInt(value, 10)) ||
         Number.parseInt(value, 10) <= 0 ?
          'Session duration must be a positive integer value' :
          true,
      when: answers => answers.enabledAuth.length,
    }
  ];

  const answers = await promiseInquiry(questions);

  const name = project || answers.project;
  const pathFragment = path.length > 75 ?
    '...' + path.substr(path.length - 72, 72) : path;

  console.log();
  console.log(
    `  ${chalk.white.bold(`setting up project ${chalk.cyan(name)} in:`)}`);
  console.log(`  ${chalk.cyan(pathFragment)}`);
  console.log();

  const newPackageJson = {
    ...packageJson,
    name,
    version: answers.version,
    config: {
      ...packageJson.config || { },
      meldio: {
        dbConnectionUri: answers.dbConnectionUri,
        protocol: 'http',
        host: answers.host,
        port: answers.port,
        enabledAuth: answers.enabledAuth,
        sessionDurationUnit: answers.sessionDurationUnit,
        sessionDuration: answers.sessionDuration,
        passwordHashStrength: answers.passwordHashStrength,
        // default authentication scopes:
        scopes: {
          ...packageJson.config && packageJson.config.meldio &&
            packageJson.config.meldio.scopes ?
              packageJson.config.meldio.scopes : { },
          ...answers.enabledAuth.includes('facebook') &&
            !(packageJson.config && packageJson.config.meldio &&
              packageJson.config.meldio.scopes &&
              packageJson.config.meldio.scopes.facebook) ?
            { facebook: defaultScopes.facebook } : { },
          ...answers.enabledAuth.includes('google') &&
            !(packageJson.config && packageJson.config.meldio &&
              packageJson.config.meldio.scopes &&
              packageJson.config.meldio.scopes.google) ?
            { google: defaultScopes.google } : { },
          ...answers.enabledAuth.includes('github') &&
            !(packageJson.config && packageJson.config.meldio &&
              packageJson.config.meldio.scopes &&
              packageJson.config.meldio.scopes.github) ?
            { github: defaultScopes.github } : { },
          // ...answers.enabledAuth.includes('twitter') &&
          //   !(packageJson.config && packageJson.config.meldio &&
          //     packageJson.config.meldio.scopes &&
          //     packageJson.config.meldio.scopes.twitter) ?
          //   { twitter: defaultScopes.twitter } : { },
        },
        // paths and files that are not configurable through CLI:
        root:
          packageJson.config && packageJson.config.meldio &&
          packageJson.config.meldio.root ?
            packageJson.config.meldio.root :
            '',
        schema:
          packageJson.config && packageJson.config.meldio &&
          packageJson.config.meldio.schema ?
            packageJson.config.meldio.schema :
            'schema.sdl',
        permissions:
          packageJson.config && packageJson.config.meldio &&
          packageJson.config.meldio.permissions ?
            packageJson.config.meldio.permissions :
            'permissions.js',
        mutations:
          packageJson.config && packageJson.config.meldio &&
          packageJson.config.meldio.mutations ?
            packageJson.config.meldio.mutations :
            'mutations',
        hooks:
          packageJson.config && packageJson.config.meldio &&
          packageJson.config.meldio.hooks ?
            packageJson.config.meldio.hooks :
            'hooks',
        build:
          packageJson.config && packageJson.config.meldio &&
          packageJson.config.meldio.build ?
            packageJson.config.meldio.build :
            '.build',
      }
    }
  };

  const newEnv = {
    ...env,
    ...answers.FACEBOOK_CLIENT_ID ?
      { FACEBOOK_CLIENT_ID: answers.FACEBOOK_CLIENT_ID } :
      { FACEBOOK_CLIENT_ID: undefined },
    ...answers.FACEBOOK_CLIENT_SECRET ?
      { FACEBOOK_CLIENT_SECRET: answers.FACEBOOK_CLIENT_SECRET } :
      { FACEBOOK_CLIENT_SECRET: undefined },
    ...answers.GOOGLE_CLIENT_ID ?
      { GOOGLE_CLIENT_ID: answers.GOOGLE_CLIENT_ID } :
      { GOOGLE_CLIENT_ID: undefined },
    ...answers.GOOGLE_CLIENT_SECRET ?
      { GOOGLE_CLIENT_SECRET: answers.GOOGLE_CLIENT_SECRET } :
      { GOOGLE_CLIENT_SECRET: undefined },
    // ...answers.TWITTER_CLIENT_ID ?
    //   { TWITTER_CLIENT_ID: answers.TWITTER_CLIENT_ID } :
    //   { TWITTER_CLIENT_ID: undefined },
    // ...answers.TWITTER_CLIENT_SECRET ?
    //   { TWITTER_CLIENT_SECRET: answers.TWITTER_CLIENT_SECRET } :
    //   { TWITTER_CLIENT_SECRET: undefined },
    ...answers.GITHUB_CLIENT_ID ?
      { GITHUB_CLIENT_ID: answers.GITHUB_CLIENT_ID } :
      { GITHUB_CLIENT_ID: undefined },
    ...answers.GITHUB_CLIENT_SECRET ?
      { GITHUB_CLIENT_SECRET: answers.GITHUB_CLIENT_SECRET } :
      { GITHUB_CLIENT_SECRET: undefined },
    ...env.MASTER_SECRET ?
      { MASTER_SECRET: env.MASTER_SECRET } :
      { MASTER_SECRET: await newMasterSecret() },
  };

  const progress = new ProgressBar('  setting up [:bar] :percent :etas', {
    width: 20,
    total: 8 + Object.keys(HOOKS).length * 2,
    clear: true
  });
  progress.tick(1);

  await writeFile(packagePath, JSON.stringify(newPackageJson, null, '  '));
  progress.tick(1);

  await writeEnv(envPath, newEnv);
  progress.tick(1);

  const eslintrcPath = joinPath(path, '.eslintrc');
  await createFileIfMissing(eslintrcPath, eslintrc);
  progress.tick(1);

  const gitignorePath = joinPath(path, '.gitignore');
  await createFileIfMissing(gitignorePath, gitignore);
  progress.tick(1);

  // balance of the files will be under "root" if it is specified
  if (newPackageJson.config.meldio.root) {
    path = resolvePath('.', newPackageJson.config.meldio.root);
  }

  const schemaPath = joinPath(path, newPackageJson.config.meldio.schema);
  await createFileIfMissing(schemaPath, schema);
  progress.tick(1);

  const permissionsPath =
    joinPath(path, newPackageJson.config.meldio.permissions);
  await createFileIfMissing(permissionsPath, permissions);
  progress.tick(1);

  const mutationsPath = joinPath(path, newPackageJson.config.meldio.mutations);
  await mkdir(mutationsPath, true);
  progress.tick(1);

  const hooksPath = joinPath(path, newPackageJson.config.meldio.hooks);

  await Promise.all(
    Object.keys(HOOKS).map(async hook => {
      const hookPath = joinPath(hooksPath, hook + '.js');
      await mkdir(hookPath);
      progress.tick(1);
      if (hooks[hook]) {
        await createFileIfMissing(hookPath, hooks[hook]);
      }
      progress.tick(1);
    })
  );

  return true;
}

async function promiseInquiry(questions) {
  return new Promise( resolve => {
    inquirer.prompt(questions, answers => {
      resolve(answers);
    });
  });
}

function validateName(name) {
  const NPM_MAX_NAME_LEN = 214;
  const ALLOWED_FIRST_CHAR =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const ALLOWED_CHARS = '-0123456789' + ALLOWED_FIRST_CHAR;

  return (!name || !name.length) ?
      `Project name is required.` :
    name.length > NPM_MAX_NAME_LEN ?
      `Project name must be shorter than ${NPM_MAX_NAME_LEN} characters.` :
    !ALLOWED_FIRST_CHAR.includes(name.split('')[0]) ?
      'Project name must start with a letter.' :
    !name.split('').every(ch => ALLOWED_CHARS.includes(ch)) ?
      'Project name can only include letters, numbers or dashes.' :
    true;
}

function validateVersion(version) {
  return !semver.valid(version) ?
    'Must be a valid semver version number.' :
    true;
}
