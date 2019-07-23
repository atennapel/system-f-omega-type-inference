export type Type
  = TVar
  | TMeta
  | TApp
  | TAbs
  | TForall;

export type TVarName = string;
export interface TVar {
  readonly tag: 'TVar';
  readonly name: TVarName;
}
export const TVar = (name: TVarName): TVar =>
  ({ tag: 'TVar', name });

export type TMetaId = number;
let tmetaId: TMetaId = 0;
export const resetTMetaId = () => { tmetaId = 0 };

export interface TMeta {
  readonly tag: 'TMeta';
  readonly id: TMetaId;
  type: Type | null;
}
export const TMeta = (id: TMetaId): TMeta =>
  ({ tag: 'TMeta', id, type: null });
export const freshTMeta = () => TMeta(tmetaId++);

export interface TApp {
  readonly tag: 'TApp';
  readonly left: Type;
  readonly right: Type;
}
export const TApp = (left: Type, right: Type): TApp =>
  ({ tag: 'TApp', left, right });
export const tappFrom = (ts: Type[]) => ts.reduce(TApp);
export const tapp = (...ts: Type[]) => tappFrom(ts);
export const foldTApp = (t: Type, ts: Type[]) => ts.reduce(TApp, t);
export const unfoldTApp = (t: Type): [Type, Type[]] => {
  const ts: Type[] = [];
  while (t.tag === 'TApp') {
    ts.push(t.right);
    t = t.left;
  }
  return [t, ts.reverse()];
};

export interface TAbs {
  readonly tag: 'TAbs';
  readonly name: TVarName;
  readonly body: Type;
}
export const TAbs = (name: TVarName, body: Type): TAbs =>
  ({ tag: 'TAbs', name, body });
export const tabs = (ns: TVarName[], body: Type) =>
  ns.reduceRight((x, y) => TAbs(y, x), body);
export const unfoldTAbs = (t: Type): [TVarName[], Type] => {
  const ns: TVarName[] = [];
  while (t.tag === 'TAbs') {
    ns.push(t.name);
    t = t.body;
  }
  return [ns, t];
};

export interface TForall {
  readonly tag: 'TForall';
  readonly name: TVarName;
  readonly body: Type;
}
export const TForall = (name: TVarName, body: Type): TForall =>
  ({ tag: 'TForall', name, body });
export const tforall = (ns: TVarName[], body: Type) =>
  ns.reduceRight((x, y) => TForall(y, x), body);
export const unfoldTForall = (t: Type): [TVarName[], Type] => {
  const ns: TVarName[] = [];
  while (t.tag === 'TForall') {
    ns.push(t.name);
    t = t.body;
  }
  return [ns, t];
};

export const TFunC = TVar('->');
export interface TFun {
  readonly tag: 'TApp';
  readonly left: {
    readonly tag: 'TApp';
    readonly left: TVar;
    readonly right: Type;
  }
  readonly right: Type;
}
export const TFun = (left: Type, right: Type): TFun =>
  TApp(TApp(TFunC, left), right) as TFun;
export const isTFun = (t: Type): t is TFun =>
  t.tag === 'TApp' && t.left.tag === 'TApp' && t.left.left === TFunC;
export const tfunL = (t: TFun) => t.left.right;
export const tfunR = (t: TFun) => t.right;
export const tfunFrom = (ts: Type[]) =>
  ts.reduceRight((x, y) => TFun(y, x));
export const tfun = (...ts: Type[]) => tfunFrom(ts);
// unfoldTFun

// showType

// prune

// substTVar
