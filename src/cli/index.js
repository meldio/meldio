import program from 'commander';
import chalk from 'chalk';
import strip from '../jsutils/strip';
import { version } from '../../package.json';
import { init } from './init';
import { build } from './build';
import { run } from './run';
import { watch } from './watch';

export function cli(args) {
  program
    .version(version);

  const commands = { };

  commands.init =
    program
      .command('init [project]')
      .description('creates a new project')
      .action( project => {
        init(project)
          .then(() => {
            //
          })
          .catch(error => {
            console.error(strip`
              |
              | ${chalk.bgRed('Error')}: ${error.message}
              |
              |`);
            process.exit(1);
          });
      });

  commands.build =
    program
      .command('build')
      .description('build the project')
      .option('-w, --no-warnings', 'suppress schema definition warnings')
      .option('-d, --dry-run', 'build but do not write to directory')
      .action( options => {
        build(options)
          .then(() => process.exit(0))
          .catch(error => {
            console.error(strip`
              |
              | ${chalk.bgRed('Error')}: ${error.message}
              |
              |`);
            process.exit(1);
          });
      });

  commands.run =
    program
      .command('run')
      .description('start the dev server')
      .option('--host <address>', 'bind to the specified address')
      .option('--port <number>', 'bind to the specified port')
      .option('--no-warnings', 'suppress schema definition warnings')
      .action( options => {
        run(options)
          .then(() => {
            //
          })
          .catch(error => {
            console.error(strip`
              |
              | ${chalk.bgRed('Error')}: ${error.message}
              |
              |`);
            process.exit(1);
          });
      });

  commands.watch =
    program
      .command('watch')
      .description('start the dev server and watch for changes')
      .option('--host <address>', 'bind to the specified address')
      .option('--port <number>', 'bind to the specified port')
      .option('--no-warnings', 'suppress schema definition warnings')
      .action( options => {
        watch(options)
          .then(() => {
            //
          })
          .catch(error => {
            console.error(error);
            process.exit(1);
          });
      });

  commands.help = program
    .command('help [command]')
    .description('display help for [command]')
    .action( command => {
      if (commands[command]) {
        commands[command].outputHelp();
      } else {
        commands.help.outputHelp();
      }
    });

  program.parse(args);

  if (!program.args.length) {
    program.help();
  }
}
