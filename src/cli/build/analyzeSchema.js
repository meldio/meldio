import ProgressBar from 'progress';
import chalk from 'chalk';
import codeFrame from 'babel-code-frame';
import { resolve as resolvePath } from 'path';

import strip from '../../jsutils/strip';

import {
  parse,
  print,
  analyzeAST,
  validate,
  transformAST,
  Source,
  getLocation,
} from '../../schema';
import { rootViewerDirectives } from '../../schema/analyzer';

import { readFile, writeFile, mkdir } from '../common';

export async function analyzeSchema(schemaFile, options, config) {
  const {
    build: buildDirectory,
    enabledAuth,
  } = config;
  const rootDirectory = config.root || '';

  const warnings = Boolean(options.warnings);
  const dryRun = Boolean(options.dryRun);

  const progress = new ProgressBar(' analyzing schema [:bar] :percent :etas', {
    width: 20,
    total: 7,
    clear: true
  });
  progress.tick(1);

  const schemaPath = resolvePath(rootDirectory, schemaFile);
  const schemaText = await readFile(schemaPath);
  progress.tick(1);

  let ast = null;
  try {
    ast = parse(schemaText);
  } catch (e) {
    const opts = { highlightCode: false };
    const loc = `(${e.line}:${e.column})`;
    const frame = codeFrame(schemaText, e.line, e.column, opts);

    console.error(strip`
      |
      | ${chalk.bgRed(e.name)} in ${schemaFile}: ${e.description} ${loc}
      |
      |${frame}
      |
      |`);

    return null;
  }
  progress.tick(1);
  const schema = analyzeAST(ast);
  progress.tick(1);
  const results = validate(schema);
  progress.tick(1);

  // ensure that rootViewer is specified if auth is enabled:
  const viewerTypeName = rootViewerDirectives(schema)
    .map(directive => directive.parentTypeName)[0];

  if (enabledAuth.length && !viewerTypeName) {
    results.push({
      kind: 'error',
      description: strip`Authentication is enabled, but schema does not define
                       ~ root viewer field. Add @rootViewer(field: "viewer")
                       ~ directive to the type that represents application
                       ~ user.`
    });
  }

  const hasValidationErrors =
    Boolean(results.filter(r => r.kind === 'error').length);

  if (!hasValidationErrors) {
    const transformedAST = transformAST(ast, schema);
    progress.tick(1);

    if (!dryRun) {
      const schemaOut =
        resolvePath(rootDirectory, buildDirectory, 'schema-debug.graphql');
      await mkdir(schemaOut);
      await writeFile(schemaOut, print(transformedAST));
    }
    progress.tick(1);
  } else {
    progress.tick(2);
  }

  if (results.length) {
    results.forEach(result => {
      let frame = '';
      let loc = '';
      if (result.loc && result.loc.start) {
        const src = new Source(schemaText, schemaFile);
        const startPosition = getLocation(src, result.loc.start);

        loc = `(${startPosition.line}:${startPosition.column})`;
        frame = codeFrame(schemaText, startPosition.line, startPosition.column,
                          { highlightCode: false });
      }
      if (result.kind === 'warning' && warnings) {
        console.log(strip`
          | ${chalk.bgYellow('Warning')} in ${schemaFile}:
            ~ ${result.description} ${loc}
          |
          |${frame}
          |
          |`);
      }
      if (result.kind === 'error') {
        console.error(strip`
          | ${chalk.bgRed('Error')} in ${schemaFile}:
            ~ ${result.description} ${loc}
          |
          |${frame}
          |
          |`);
      }
    });

    if (hasValidationErrors) {
      return null;
    }
  }

  return schema;
}
