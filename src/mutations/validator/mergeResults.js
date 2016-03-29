
export function mergeResults(...args) {
  if (args.length) {
    return {
      context: args[0].context,
      results: args
        .map(a => a.results || [ ])
        .reduce( (acc, r) => acc.concat(r), [ ])
    };
  }
  return {
    context: null,
    results: [ ]
  };
}
