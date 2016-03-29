/* @flow */

import values from '../../../jsutils/values';
import type { Rules } from '../types';

const Enum = require('./Enum');
const Filter = require('./Filter');
const FilterCondition = require('./FilterCondition');
const FilterConditionArgument = require('./FilterConditionArgument');
const Input = require('./Input');
const InputArgument = require('./InputArgument');
const Interface = require('./Interface');
const InterfaceDirective = require('./InterfaceDirective');
const InterfaceField = require('./InterfaceField');
const InterfaceFieldDirective = require('./InterfaceFieldDirective');
const Mutation = require('./Mutation');
const MutationDirective = require('./MutationDirective');
const MutationArgument = require('./MutationArgument');
const MutationField = require('./MutationField');
const MutationFieldDirective = require('./MutationFieldDirective');
const Order = require('./Order');
const OrderExpression = require('./OrderExpression');
const Schema = require('./Schema');
const Type = require('./Type');
const TypeDirective = require('./TypeDirective');
const TypeField = require('./TypeField');
const TypeFieldDirective = require('./TypeFieldDirective');
const Union = require('./Union');
const UnionDirective = require('./UnionDirective');

export const rules: Rules = {
  '/': values(Schema),
  '/enum': values(Enum),
  '/filter': values(Filter),
  '/filter/condition': values(FilterCondition),
  '/filter/condition/argument': values(FilterConditionArgument),
  '/input': values(Input),
  '/input/argument': values(InputArgument),
  '/interface': values(Interface),
  '/interface/directive': values(InterfaceDirective),
  '/interface/field': values(InterfaceField),
  '/interface/field/directive': values(InterfaceFieldDirective),
  '/mutation': values(Mutation),
  '/mutation/directive': values(MutationDirective),
  '/mutation/argument': values(MutationArgument),
  '/mutation/field': values(MutationField),
  '/mutation/field/directive': values(MutationFieldDirective),
  '/order': values(Order),
  '/order/expression': values(OrderExpression),
  '/type': values(Type),
  '/type/directive': values(TypeDirective),
  '/type/field': values(TypeField),
  '/type/field/directive': values(TypeFieldDirective),
  '/union': values(Union),
  '/union/directive': values(UnionDirective),
};
