import chalk from 'chalk';
import colors from 'ansi-256-colors';
import { version } from '../../../package.json';

export function logo(line, rainbow) {
  const add = (!line || line.length !== 6) ?
    [ ``, ``, ``, ``, ``, `` ] :
    line;
  const ver = version || '';

  if (rainbow) {
    const red = str => `${colors.fg.codes[196]}${str}${colors.reset}`;
    const ora = str => `${colors.fg.codes[208]}${str}${colors.reset}`;
    const yel = str => `${colors.fg.codes[11]}${str}${colors.reset}`;
    const gre = str => `${colors.fg.codes[46]}${str}${colors.reset}`;
    const blu = str => `${colors.fg.codes[12]}${str}${colors.reset}`;
    const pur = str => `${colors.fg.codes[54]}${str}${colors.reset}`;

    console.log();
    console.log(red('  __  __ ______ _      _____ _____ ____  '), add[0]);
    console.log(ora(' |  \\/  |  ____| |    |  __ \\_   _/ __ \\ '), add[1]);
    console.log(yel(' | \\  / | |__  | |    | |  | || || |  | |'), add[2]);
    console.log(gre(' | |\\/| |  __| | |    | |  | || || |  | |'), add[3]);
    console.log(blu(' | |  | | |____| |____| |__| || || |__| |'), add[4]);
    console.log(pur(' |_|  |_|______|______|_____/_____\\____/' + ver),
      add[5]);
    console.log();
  } else {
    const color = chalk.cyan;
    console.log();
    console.log(color('  __  __ ______ _      _____ _____ ____  '), add[0]);
    console.log(color(' |  \\/  |  ____| |    |  __ \\_   _/ __ \\ '), add[1]);
    console.log(color(' | \\  / | |__  | |    | |  | || || |  | |'), add[2]);
    console.log(color(' | |\\/| |  __| | |    | |  | || || |  | |'), add[3]);
    console.log(color(' | |  | | |____| |____| |__| || || |__| |'), add[4]);
    console.log(color(' |_|  |_|______|______|_____/_____\\____/' + ver),
      add[5]);
    console.log();
  }
}
