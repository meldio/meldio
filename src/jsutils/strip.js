/* @flow */

export default function strip(
  template: Array<string>,
  ...values: Array<any>
): string {
  const margin = /^[ \t\v]*\|/gm;
  const marginCont = /\n[ \t\v]*~/gm;

  return template[0]
    .replace(margin, '')
    .replace(marginCont, '')
    .concat(
      template
        .slice(1)
        .map((ts, index) =>
          String(values[index])
            .concat(
              ts.replace(margin, '')
                .replace(marginCont, '')
            ))
        .join(''));
}
