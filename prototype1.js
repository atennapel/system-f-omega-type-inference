// kinds
const KType = { tag: 'KType' };
const KFun = (left, right) => ({ tag: 'KFun', left, right });

const showKind = k => {
  if (k.tag === 'KType') return '*';
  if (k.tag === 'KFun')
    return `(${showKind(k.left)} -> ${showKind(k.right)})`;
};

const eqKind = (a, b) => {
  if (a === b) return true;
  if (a.tag === 'KFun')
    return b.tag === 'KFun' && eqKind(a.left, b.left) &&
      eqKind(a.right, b.right);
};

// types
const TVar = name => ({ tag: 'TVar', name });
const TAbs = (name, kind, body) => ({ tag: 'TAbs', name, kind, body });
const TForall = (name, kind, body) =>
  ({ tag: 'TForall', name, kind, body });
const TApp = (left, right) => ({ tag: 'TApp', left, right });

let id = 0;
const TMeta = (id, kind) => ({ tag: 'TMeta', id, kind, type: null });
const freshTMeta = kind => TMeta(id++, kind);

const TFunC = TVar('->');
const TFun = (left, right) => TApp(TApp(TFunC, left), right);
const isTFun = t => t.tag === 'TApp' && t.left.tag === 'TApp' &&
  t.left.left === TFunC;
const tfunL = t => t.left.right;
const tfunR = t => t.right;

const showType = t => {
  if (t.tag === 'TVar') return t.name;
  if (t.tag === 'TMeta')
    return `?${t.id}${t.type ? `{${showType(t.type)}}` : ''}`;
  if (t.tag === 'TAbs')
    return `(\\(${t.name} : ${showKind(t.kind)}). ${showType(t.body)})`;
  if (t.tag === 'TForall')
    return `(forall(${t.name} : ${showKind(t.kind)}). ${showType(t.body)})`;
  if (isTFun(t))
    return `(${showType(tfunL(t))} -> ${showType(tfunR(t))})`;
  if (t.tag === 'TApp')
    return `(${showType(t.left)} ${showType(t.right)})`;
};

// terms
const Var = name => ({ tag: 'Var', name });
const Abs = (name, body) => ({ tag: 'Abs', name, body });
const App = (left, right) => ({ tag: 'App', left, right });
const Ann = (term, type) => ({ tag: 'Ann', term, type });

const showTerm = t => {
  if (t.tag === 'Var') return t.name;
  if (t.tag === 'Abs')
    return `(\\${t.name} -> ${showTerm(t.body)})`;
  if (t.tag === 'App')
    return `(${showTerm(t.left)} ${showTerm(t.right)})`;
  if (t.tag === 'Ann')
    return `(${showTerm(t.term)} : ${showType(t.type)})`;
};
