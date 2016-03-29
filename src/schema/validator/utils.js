/* @flow */

import { camelCase } from '../../jsutils/casing';
import strip from '../../jsutils/strip';

import type { Error, Warning } from './types';

import type { Schema } from '../analyzer';

import {
  rootConnectionDirectives,
  rootPluralIdDirectives,
  implicitRootPluralIdTypes,
  rootViewerDirectives,
} from '../analyzer';

export function error(template: Array<string>, ...vs: Array<any>): Error {
  const loc = vs.filter(v =>
    typeof v === 'object' && (!v || v.kind === 'location'))[0];
  const values = vs.map(v =>
    typeof v === 'object' && (!v || v.kind === 'location') ? `` : v);

  return {kind: 'error', description: strip(template, ...values).trim(), loc};
}

export function warning(template: Array<string>, ...vs: Array<any>): Warning {
  const loc = vs.filter(v =>
    typeof v === 'object' && (!v || v.kind === 'location'))[0];
  const values = vs.map(v =>
    typeof v === 'object' && (!v || v.kind === 'location') ? `` : v);

  return {kind: 'warning', description: strip(template, ...values).trim(), loc};
}

export function rootQueryFieldNames(schema: Schema): Array<string> {
  const getFieldValue = directive =>
    directive.arguments.filter(a => a.name === 'field').map(a => a.value)[0];

  const rootConnectionFieldNames = rootConnectionDirectives(schema)
    .map(directive => String(getFieldValue(directive)));

  const rootPluralIdFieldNames = rootPluralIdDirectives(schema)
    .map(directive => String(directive.arguments[0].value));

  const implicitRootPluralIdFieldNames =
    implicitRootPluralIdTypes(schema)
      .map(type => camelCase(type.name));

  const viewerFieldName = rootViewerDirectives(schema)
    .map(directive => String(directive.arguments[0].value));

  return [
    'node',
    ...viewerFieldName,
    ...implicitRootPluralIdFieldNames,
    ...rootConnectionFieldNames,
    ...rootPluralIdFieldNames,
  ];
}
