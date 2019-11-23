import { Name } from './names';
import { Kind, showKind } from './kinds';
import { TMetaId } from './tmetas';

export type Type
  = { tag: 'TVar', name: Name }
  | { tag: 'TMeta', id: TMetaId }
  | { tag: 'TAbs', name: Name, kind: Kind, body: Type }
  | { tag: 'TApp', left: Type, right: Type }
  | { tag: 'TFun', left: Type, right: Type }
  | { tag: 'TForall', name: Name, kind: Kind, body: Type };

export const TVar = (name: Name): Type =>
  ({ tag: 'TVar', name });
export const TMeta = (id: TMetaId): Type =>
  ({ tag: 'TMeta', id});
export const TAbs = (name: Name, kind: Kind, body: Type): Type =>
  ({ tag: 'TAbs', name, kind, body });
export const TApp = (left: Type, right: Type): Type =>
  ({ tag: 'TApp', left, right });
export const TFun = (left: Type, right: Type): Type =>
  ({ tag: 'TFun', left, right });
export const TForall = (name: Name, kind: Kind, body: Type): Type =>
  ({ tag: 'TForall', name, kind, body });

export const showType = (t: Type): string => {
  if (t.tag === 'TVar') return t.name;
  if (t.tag === 'TMeta') return `?${t.id}`;
  if (t.tag === 'TAbs') return `(\\(${t.name} : ${showKind(t.kind)}). ${showType(t.body)})`;
  if (t.tag === 'TApp') return `(${showType(t.left)} ${showType(t.right)})`;
  if (t.tag === 'TFun') return `(${showType(t.left)} -> ${showType(t.right)})`;
  if (t.tag === 'TForall')
    return `(forall(${t.name} : ${showKind(t.kind)}). ${showType(t.body)})`;
  return t;
};
