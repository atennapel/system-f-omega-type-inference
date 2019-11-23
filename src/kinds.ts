export type KCon = '*';

export type Kind
  = { tag: 'KCon', name: KCon }
  | { tag: 'KFun', left: Kind, right: Kind };

export const KType: Kind = { tag: 'KCon', name: '*' };
export const KFun = (left: Kind, right: Kind): Kind =>
  ({ tag: 'KFun', left, right });

export const showKind = (k: Kind): string => {
  if (k.tag === 'KCon') return k.name;
  if (k.tag === 'KFun') return `(${showKind(k.left)} -> ${showKind(k.right)})`;
  return k;
};

export const eqKind = (a: Kind, b: Kind): boolean => {
  if (a.tag === 'KCon') return b.tag === 'KCon' && a.name === b.name;
  if (a.tag === 'KFun') return b.tag === 'KFun' && eqKind(a.left, b.left) && eqKind(a.right, b.right);
  return a;
};
