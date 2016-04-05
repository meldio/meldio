# Meldio Development Server [![Build Status](https://travis-ci.org/meldio/meldio.svg?branch=master)](https://travis-ci.org/meldio/meldio) [![Coverage Status](https://coveralls.io/repos/github/meldio/meldio/badge.svg?branch=master)](https://coveralls.io/github/meldio/meldio?branch=master)

Meldio is an open source GraphQL backend for building delightful mobile and
web apps.

Meldio provides three key benefits over the existing solutions:

 * **Blazing Takeoff**. Meldio allows you to describe data elements in a few
 lines of intuitive schema definition language and get a powerful GraphQL
 endpoint with filtering, ordering, paging and aggregation queries that works
 great with React and Relay.
 * **Ultimate Versatility**. With Meldio, complex data mutations are defined
 with modern JavaScript and beautiful APIs. Mutations run entirely on the
 server, enabling code reuse across mobile, web and desktop and access to more
 than 250,000 npm packages.
 * **Flexible Security**. Meldio allows you to setup the social and password
 logins, then configure functional authorization to the security model most
 suitable for your app, whether it is ACL, role-based, attribute-based or
 anything in between.

Need help?
  * [Join our Slack channel](https://meldio-slack.herokuapp.com)
  * [Ask a question on Stack Overflow](https://stackoverflow.com/questions/ask?tags=meldio)

## Installation and Setup

See [our start building guide](https://www.meldio.com/start-building) for
detailed instructions.

First, we will install two Meldio dependencies, Node.js and MongoDB. Once
Node.js and MongoDB are in place, Meldio setup is super simple.

#### Node.js

The recommended way to install Node.js is with NVM. Please consult
[nvm installation instructions](https://github.com/creationix/nvm#installation)
and then install NVM with the following command:

```bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash
```

Once NVM is installed, open a new terminal window and install Node.js with the
following:

```bash
nvm install node && nvm alias default node
```

This will install the latest version of Node.js and alias it as node. Open a
new terminal window and confirm Node.js is set up correctly with
`node --version` command. This should print the latest version of Node.js.

#### MongoDB

The recommended way to install MongoDB on an OS X system is with [brew package manager](http://brew.sh/), like this:

```bash
brew update && brew install mongodb
```

It is easiest to configure the system to launch MongoDB on startup using the
following commands:

```bash
ln -sfv /usr/local/opt/mongodb/*.plist ~/Library/LaunchAgents
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.mongodb.plist
```

Alternatively, use the following command to start the mongo daemon as needed:

```bash
mongod --config /usr/local/etc/mongod.conf
```
For MongoDB installation on various Linux distributions, please consult the
[MongoDB documentation here](https://docs.mongodb.org/manual/administration/install-on-linux/).

#### Meldio

To install Meldio, run the following:

```bash
npm install -g meldio
```

If the system permissions require sudo for installing global npm modules, the
command above will not work. Instead, run npm with sudo like this:
`sudo npm install -g meldio`

## Installation from Source

Once Node.js and MongoDB are in place, you can also install Meldio from source
using the following steps:

```bash
git clone https://github.com/meldio/meldio.git
cd meldio
npm install
npm run test
npm run build
npm install -g
```

## Next Steps

Check out [our start building guide](https://www.meldio.com/start-building) or
get started with [some cool examples](https://www.meldio.com/examples).

## License

This code is free software, licensed under the The GNU Affero General Public
License v3 (AGPL-3). See the `LICENSE` file for more details.
