import { Name } from './names';
import { TVal } from './tvals';

export type TMetaId = number;
export type TVar = { tag: 'TVar', name: Name };
export type TMeta = { tag: 'TMeta', id: TMetaId, tval: TVal | null };
export type Type
  = TVar
  | { tag: 'TApp', left: Type, right: Type }
  | { tag: 'TFun', left: Type, right: Type }
  | { tag: 'TForall', name: Name, body: Type }
  | TMeta;

export const TVar = (name: Name): TVar => ({ tag: 'TVar', name });
export const TApp = (left: Type, right: Type): Type => ({ tag: 'TApp', left, right });
export const TFun = (left: Type, right: Type): Type => ({ tag: 'TFun', left, right });
export const TForall = (name: Name, body: Type): Type => ({ tag: 'TForall', name, body });

let tmetaId: TMetaId = 0;
export const TMeta = (): TMeta => ({ tag: 'TMeta', id: tmetaId++, tval: null });

export const tappFrom = (ts: Type[]) => ts.reduce(TApp);
export const tapp = (...ts: Type[]) => tappFrom(ts);
export const tfunFrom = (ts: Type[]) => ts.reduceRight((x, y) => TFun(y, x));
export const tfun = (...ts: Type[]) => tfunFrom(ts);
export const tforall = (xs: Name[], t: Type) => xs.reduceRight((b, x) => TForall(x, b), t);

export const showType = (t: Type): string => {
  if (t.tag === 'TVar') return t.name;
  if (t.tag === 'TApp') return `(${showType(t.left)} ${showType(t.right)})`;
  if (t.tag === 'TFun') return `(${showType(t.left)} -> ${showType(t.right)})`;
  if (t.tag === 'TForall') return `(forall ${t.name}. ${showType(t.body)})`;
  if (t.tag === 'TMeta') return `?${t.tval ? '!' : ''}${t.id}`;
  return t;
};
