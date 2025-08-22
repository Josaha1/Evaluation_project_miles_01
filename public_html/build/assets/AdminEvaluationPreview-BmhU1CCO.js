import{r as l,j as s,R as y,a as I,K as Ae,S as O}from"./app-DM3CWPwz.js";import{C as Re,M as Pe,B as T,t as Y}from"./MainLayout-yPW0h5_m.js";import{c as z}from"./utils-ONoQxm8A.js";import{C as Ie,a as _e,b as Ee}from"./card-CxD-Wc6R.js";import{B as $e}from"./breadcrumb-BKTxKc6Q.js";import{c as ke}from"./x--rbPaS5b.js";/**
 * @license lucide-react v0.486.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Me=[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]],Oe=ke("printer",Me);function oe(e,t=[]){let o=[];function r(i,a){const c=l.createContext(a),u=o.length;o=[...o,a];const d=m=>{var C;const{scope:f,children:h,...b}=m,g=((C=f==null?void 0:f[e])==null?void 0:C[u])||c,v=l.useMemo(()=>b,Object.values(b));return s.jsx(g.Provider,{value:v,children:h})};d.displayName=i+"Provider";function p(m,f){var g;const h=((g=f==null?void 0:f[e])==null?void 0:g[u])||c,b=l.useContext(h);if(b)return b;if(a!==void 0)return a;throw new Error(`\`${m}\` must be used within \`${i}\``)}return[d,p]}const n=()=>{const i=o.map(a=>l.createContext(a));return function(c){const u=(c==null?void 0:c[e])||i;return l.useMemo(()=>({[`__scope${e}`]:{...c,[e]:u}}),[c,u])}};return n.scopeName=e,[r,Te(n,...t)]}function Te(...e){const t=e[0];if(e.length===1)return t;const o=()=>{const r=e.map(n=>({useScope:n(),scopeName:n.scopeName}));return function(i){const a=r.reduce((c,{useScope:u,scopeName:d})=>{const m=u(i)[`__scope${d}`];return{...c,...m}},{});return l.useMemo(()=>({[`__scope${t.scopeName}`]:a}),[a])}};return o.scopeName=t.scopeName,o}function J(e,t){if(typeof e=="function")return e(t);e!=null&&(e.current=t)}function re(...e){return t=>{let o=!1;const r=e.map(n=>{const i=J(n,t);return!o&&typeof i=="function"&&(o=!0),i});if(o)return()=>{for(let n=0;n<r.length;n++){const i=r[n];typeof i=="function"?i():J(e[n],null)}}}}function D(...e){return l.useCallback(re(...e),e)}function L(e){const t=De(e),o=l.forwardRef((r,n)=>{const{children:i,...a}=r,c=l.Children.toArray(i),u=c.find(Ve);if(u){const d=u.props.children,p=c.map(m=>m===u?l.Children.count(d)>1?l.Children.only(null):l.isValidElement(d)?d.props.children:null:m);return s.jsx(t,{...a,ref:n,children:l.isValidElement(d)?l.cloneElement(d,void 0,p):null})}return s.jsx(t,{...a,ref:n,children:i})});return o.displayName=`${e}.Slot`,o}function De(e){const t=l.forwardRef((o,r)=>{const{children:n,...i}=o;if(l.isValidElement(n)){const a=Be(n),c=ze(i,n.props);return n.type!==l.Fragment&&(c.ref=r?re(r,a):a),l.cloneElement(n,c)}return l.Children.count(n)>1?l.Children.only(null):null});return t.displayName=`${e}.SlotClone`,t}var Le=Symbol("radix.slottable");function Ve(e){return l.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===Le}function ze(e,t){const o={...t};for(const r in t){const n=e[r],i=t[r];/^on[A-Z]/.test(r)?n&&i?o[r]=(...c)=>{i(...c),n(...c)}:n&&(o[r]=n):r==="style"?o[r]={...n,...i}:r==="className"&&(o[r]=[n,i].filter(Boolean).join(" "))}return{...e,...o}}function Be(e){var r,n;let t=(r=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:r.get,o=t&&"isReactWarning"in t&&t.isReactWarning;return o?e.ref:(t=(n=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:n.get,o=t&&"isReactWarning"in t&&t.isReactWarning,o?e.props.ref:e.props.ref||e.ref)}function Ue(e){const t=e+"CollectionProvider",[o,r]=oe(t),[n,i]=o(t,{collectionRef:{current:null},itemMap:new Map}),a=g=>{const{scope:v,children:C}=g,x=y.useRef(null),N=y.useRef(new Map).current;return s.jsx(n,{scope:v,itemMap:N,collectionRef:x,children:C})};a.displayName=t;const c=e+"CollectionSlot",u=L(c),d=y.forwardRef((g,v)=>{const{scope:C,children:x}=g,N=i(c,C),w=D(v,N.collectionRef);return s.jsx(u,{ref:w,children:x})});d.displayName=c;const p=e+"CollectionItemSlot",m="data-radix-collection-item",f=L(p),h=y.forwardRef((g,v)=>{const{scope:C,children:x,...N}=g,w=y.useRef(null),A=D(v,w),S=i(p,C);return y.useEffect(()=>(S.itemMap.set(w,{ref:w,...N}),()=>void S.itemMap.delete(w))),s.jsx(f,{[m]:"",ref:A,children:x})});h.displayName=p;function b(g){const v=i(e+"CollectionConsumer",g);return y.useCallback(()=>{const x=v.collectionRef.current;if(!x)return[];const N=Array.from(x.querySelectorAll(`[${m}]`));return Array.from(v.itemMap.values()).sort((S,k)=>N.indexOf(S.ref.current)-N.indexOf(k.ref.current))},[v.collectionRef,v.itemMap])}return[{Provider:a,Slot:d,ItemSlot:h},b,r]}function Fe(e,t,{checkForDefaultPrevented:o=!0}={}){return function(n){if(e==null||e(n),o===!1||!n.defaultPrevented)return t==null?void 0:t(n)}}var ie=globalThis!=null&&globalThis.document?l.useLayoutEffect:()=>{},We=I[" useInsertionEffect ".trim().toString()]||ie;function se({prop:e,defaultProp:t,onChange:o=()=>{},caller:r}){const[n,i,a]=qe({defaultProp:t,onChange:o}),c=e!==void 0,u=c?e:n;{const p=l.useRef(e!==void 0);l.useEffect(()=>{const m=p.current;m!==c&&console.warn(`${r} is changing from ${m?"controlled":"uncontrolled"} to ${c?"controlled":"uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`),p.current=c},[c,r])}const d=l.useCallback(p=>{var m;if(c){const f=He(p)?p(e):p;f!==e&&((m=a.current)==null||m.call(a,f))}else i(p)},[c,e,i,a]);return[u,d]}function qe({defaultProp:e,onChange:t}){const[o,r]=l.useState(e),n=l.useRef(o),i=l.useRef(t);return We(()=>{i.current=t},[t]),l.useEffect(()=>{var a;n.current!==o&&((a=i.current)==null||a.call(i,o),n.current=o)},[o,n]),[o,r,i]}function He(e){return typeof e=="function"}var Ke=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],ae=Ke.reduce((e,t)=>{const o=L(`Primitive.${t}`),r=l.forwardRef((n,i)=>{const{asChild:a,...c}=n,u=a?o:t;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),s.jsx(u,{...c,ref:i})});return r.displayName=`Primitive.${t}`,{...e,[t]:r}},{});function Ge(e,t,{checkForDefaultPrevented:o=!0}={}){return function(n){if(e==null||e(n),o===!1||!n.defaultPrevented)return t==null?void 0:t(n)}}function Qe(e,t=[]){let o=[];function r(i,a){const c=l.createContext(a),u=o.length;o=[...o,a];const d=m=>{var C;const{scope:f,children:h,...b}=m,g=((C=f==null?void 0:f[e])==null?void 0:C[u])||c,v=l.useMemo(()=>b,Object.values(b));return s.jsx(g.Provider,{value:v,children:h})};d.displayName=i+"Provider";function p(m,f){var g;const h=((g=f==null?void 0:f[e])==null?void 0:g[u])||c,b=l.useContext(h);if(b)return b;if(a!==void 0)return a;throw new Error(`\`${m}\` must be used within \`${i}\``)}return[d,p]}const n=()=>{const i=o.map(a=>l.createContext(a));return function(c){const u=(c==null?void 0:c[e])||i;return l.useMemo(()=>({[`__scope${e}`]:{...c,[e]:u}}),[c,u])}};return n.scopeName=e,[r,Ze(n,...t)]}function Ze(...e){const t=e[0];if(e.length===1)return t;const o=()=>{const r=e.map(n=>({useScope:n(),scopeName:n.scopeName}));return function(i){const a=r.reduce((c,{useScope:u,scopeName:d})=>{const m=u(i)[`__scope${d}`];return{...c,...m}},{});return l.useMemo(()=>({[`__scope${t.scopeName}`]:a}),[a])}};return o.scopeName=t.scopeName,o}var B=globalThis!=null&&globalThis.document?l.useLayoutEffect:()=>{},Ye=I[" useInsertionEffect ".trim().toString()]||B;function Je({prop:e,defaultProp:t,onChange:o=()=>{},caller:r}){const[n,i,a]=Xe({defaultProp:t,onChange:o}),c=e!==void 0,u=c?e:n;{const p=l.useRef(e!==void 0);l.useEffect(()=>{const m=p.current;m!==c&&console.warn(`${r} is changing from ${m?"controlled":"uncontrolled"} to ${c?"controlled":"uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`),p.current=c},[c,r])}const d=l.useCallback(p=>{var m;if(c){const f=et(p)?p(e):p;f!==e&&((m=a.current)==null||m.call(a,f))}else i(p)},[c,e,i,a]);return[u,d]}function Xe({defaultProp:e,onChange:t}){const[o,r]=l.useState(e),n=l.useRef(o),i=l.useRef(t);return Ye(()=>{i.current=t},[t]),l.useEffect(()=>{var a;n.current!==o&&((a=i.current)==null||a.call(i,o),n.current=o)},[o,n]),[o,r,i]}function et(e){return typeof e=="function"}function X(e,t){if(typeof e=="function")return e(t);e!=null&&(e.current=t)}function ce(...e){return t=>{let o=!1;const r=e.map(n=>{const i=X(n,t);return!o&&typeof i=="function"&&(o=!0),i});if(o)return()=>{for(let n=0;n<r.length;n++){const i=r[n];typeof i=="function"?i():X(e[n],null)}}}}function tt(...e){return l.useCallback(ce(...e),e)}function nt(e){const t=ot(e),o=l.forwardRef((r,n)=>{const{children:i,...a}=r,c=l.Children.toArray(i),u=c.find(it);if(u){const d=u.props.children,p=c.map(m=>m===u?l.Children.count(d)>1?l.Children.only(null):l.isValidElement(d)?d.props.children:null:m);return s.jsx(t,{...a,ref:n,children:l.isValidElement(d)?l.cloneElement(d,void 0,p):null})}return s.jsx(t,{...a,ref:n,children:i})});return o.displayName=`${e}.Slot`,o}function ot(e){const t=l.forwardRef((o,r)=>{const{children:n,...i}=o;if(l.isValidElement(n)){const a=at(n),c=st(i,n.props);return n.type!==l.Fragment&&(c.ref=r?ce(r,a):a),l.cloneElement(n,c)}return l.Children.count(n)>1?l.Children.only(null):null});return t.displayName=`${e}.SlotClone`,t}var rt=Symbol("radix.slottable");function it(e){return l.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===rt}function st(e,t){const o={...t};for(const r in t){const n=e[r],i=t[r];/^on[A-Z]/.test(r)?n&&i?o[r]=(...c)=>{i(...c),n(...c)}:n&&(o[r]=n):r==="style"?o[r]={...n,...i}:r==="className"&&(o[r]=[n,i].filter(Boolean).join(" "))}return{...e,...o}}function at(e){var r,n;let t=(r=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:r.get,o=t&&"isReactWarning"in t&&t.isReactWarning;return o?e.ref:(t=(n=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:n.get,o=t&&"isReactWarning"in t&&t.isReactWarning,o?e.props.ref:e.props.ref||e.ref)}var ct=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],U=ct.reduce((e,t)=>{const o=nt(`Primitive.${t}`),r=l.forwardRef((n,i)=>{const{asChild:a,...c}=n,u=a?o:t;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),s.jsx(u,{...c,ref:i})});return r.displayName=`Primitive.${t}`,{...e,[t]:r}},{});function ee(e,t){if(typeof e=="function")return e(t);e!=null&&(e.current=t)}function lt(...e){return t=>{let o=!1;const r=e.map(n=>{const i=ee(n,t);return!o&&typeof i=="function"&&(o=!0),i});if(o)return()=>{for(let n=0;n<r.length;n++){const i=r[n];typeof i=="function"?i():ee(e[n],null)}}}}function dt(...e){return l.useCallback(lt(...e),e)}var te=globalThis!=null&&globalThis.document?l.useLayoutEffect:()=>{};function ut(e,t){return l.useReducer((o,r)=>t[o][r]??o,e)}var le=e=>{const{present:t,children:o}=e,r=pt(t),n=typeof o=="function"?o({present:r.isPresent}):l.Children.only(o),i=dt(r.ref,mt(n));return typeof o=="function"||r.isPresent?l.cloneElement(n,{ref:i}):null};le.displayName="Presence";function pt(e){const[t,o]=l.useState(),r=l.useRef({}),n=l.useRef(e),i=l.useRef("none"),a=e?"mounted":"unmounted",[c,u]=ut(a,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return l.useEffect(()=>{const d=R(r.current);i.current=c==="mounted"?d:"none"},[c]),te(()=>{const d=r.current,p=n.current;if(p!==e){const f=i.current,h=R(d);e?u("MOUNT"):h==="none"||(d==null?void 0:d.display)==="none"?u("UNMOUNT"):u(p&&f!==h?"ANIMATION_OUT":"UNMOUNT"),n.current=e}},[e,u]),te(()=>{if(t){let d;const p=t.ownerDocument.defaultView??window,m=h=>{const g=R(r.current).includes(h.animationName);if(h.target===t&&g&&(u("ANIMATION_END"),!n.current)){const v=t.style.animationFillMode;t.style.animationFillMode="forwards",d=p.setTimeout(()=>{t.style.animationFillMode==="forwards"&&(t.style.animationFillMode=v)})}},f=h=>{h.target===t&&(i.current=R(r.current))};return t.addEventListener("animationstart",f),t.addEventListener("animationcancel",m),t.addEventListener("animationend",m),()=>{p.clearTimeout(d),t.removeEventListener("animationstart",f),t.removeEventListener("animationcancel",m),t.removeEventListener("animationend",m)}}else u("ANIMATION_END")},[t,u]),{isPresent:["mounted","unmountSuspended"].includes(c),ref:l.useCallback(d=>{d&&(r.current=getComputedStyle(d)),o(d)},[])}}function R(e){return(e==null?void 0:e.animationName)||"none"}function mt(e){var r,n;let t=(r=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:r.get,o=t&&"isReactWarning"in t&&t.isReactWarning;return o?e.ref:(t=(n=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:n.get,o=t&&"isReactWarning"in t&&t.isReactWarning,o?e.props.ref:e.props.ref||e.ref)}var ft=I[" useId ".trim().toString()]||(()=>{}),xt=0;function ht(e){const[t,o]=l.useState(ft());return B(()=>{o(r=>r??String(xt++))},[e]),e||(t?`radix-${t}`:"")}var _="Collapsible",[gt,de]=Qe(_),[vt,F]=gt(_),ue=l.forwardRef((e,t)=>{const{__scopeCollapsible:o,open:r,defaultOpen:n,disabled:i,onOpenChange:a,...c}=e,[u,d]=Je({prop:r,defaultProp:n??!1,onChange:a,caller:_});return s.jsx(vt,{scope:o,disabled:i,contentId:ht(),open:u,onOpenToggle:l.useCallback(()=>d(p=>!p),[d]),children:s.jsx(U.div,{"data-state":q(u),"data-disabled":i?"":void 0,...c,ref:t})})});ue.displayName=_;var pe="CollapsibleTrigger",me=l.forwardRef((e,t)=>{const{__scopeCollapsible:o,...r}=e,n=F(pe,o);return s.jsx(U.button,{type:"button","aria-controls":n.contentId,"aria-expanded":n.open||!1,"data-state":q(n.open),"data-disabled":n.disabled?"":void 0,disabled:n.disabled,...r,ref:t,onClick:Ge(e.onClick,n.onOpenToggle)})});me.displayName=pe;var W="CollapsibleContent",fe=l.forwardRef((e,t)=>{const{forceMount:o,...r}=e,n=F(W,e.__scopeCollapsible);return s.jsx(le,{present:o||n.open,children:({present:i})=>s.jsx(bt,{...r,ref:t,present:i})})});fe.displayName=W;var bt=l.forwardRef((e,t)=>{const{__scopeCollapsible:o,present:r,children:n,...i}=e,a=F(W,o),[c,u]=l.useState(r),d=l.useRef(null),p=tt(t,d),m=l.useRef(0),f=m.current,h=l.useRef(0),b=h.current,g=a.open||c,v=l.useRef(g),C=l.useRef(void 0);return l.useEffect(()=>{const x=requestAnimationFrame(()=>v.current=!1);return()=>cancelAnimationFrame(x)},[]),B(()=>{const x=d.current;if(x){C.current=C.current||{transitionDuration:x.style.transitionDuration,animationName:x.style.animationName},x.style.transitionDuration="0s",x.style.animationName="none";const N=x.getBoundingClientRect();m.current=N.height,h.current=N.width,v.current||(x.style.transitionDuration=C.current.transitionDuration,x.style.animationName=C.current.animationName),u(r)}},[a.open,r]),s.jsx(U.div,{"data-state":q(a.open),"data-disabled":a.disabled?"":void 0,id:a.contentId,hidden:!g,...i,ref:p,style:{"--radix-collapsible-content-height":f?`${f}px`:void 0,"--radix-collapsible-content-width":b?`${b}px`:void 0,...e.style},children:g&&n})});function q(e){return e?"open":"closed"}var Ct=ue,yt=me,Nt=fe,wt=I[" useId ".trim().toString()]||(()=>{}),jt=0;function St(e){const[t,o]=l.useState(wt());return ie(()=>{o(r=>r??String(jt++))},[e]),t?`radix-${t}`:""}var At=l.createContext(void 0);function Rt(e){const t=l.useContext(At);return e||t||"ltr"}var j="Accordion",Pt=["Home","End","ArrowDown","ArrowUp","ArrowLeft","ArrowRight"],[H,It,_t]=Ue(j),[E,Jt]=oe(j,[_t,de]),K=de(),xe=y.forwardRef((e,t)=>{const{type:o,...r}=e,n=r,i=r;return s.jsx(H.Provider,{scope:e.__scopeAccordion,children:o==="multiple"?s.jsx(Mt,{...i,ref:t}):s.jsx(kt,{...n,ref:t})})});xe.displayName=j;var[he,Et]=E(j),[ge,$t]=E(j,{collapsible:!1}),kt=y.forwardRef((e,t)=>{const{value:o,defaultValue:r,onValueChange:n=()=>{},collapsible:i=!1,...a}=e,[c,u]=se({prop:o,defaultProp:r??"",onChange:n,caller:j});return s.jsx(he,{scope:e.__scopeAccordion,value:y.useMemo(()=>c?[c]:[],[c]),onItemOpen:u,onItemClose:y.useCallback(()=>i&&u(""),[i,u]),children:s.jsx(ge,{scope:e.__scopeAccordion,collapsible:i,children:s.jsx(ve,{...a,ref:t})})})}),Mt=y.forwardRef((e,t)=>{const{value:o,defaultValue:r,onValueChange:n=()=>{},...i}=e,[a,c]=se({prop:o,defaultProp:r??[],onChange:n,caller:j}),u=y.useCallback(p=>c((m=[])=>[...m,p]),[c]),d=y.useCallback(p=>c((m=[])=>m.filter(f=>f!==p)),[c]);return s.jsx(he,{scope:e.__scopeAccordion,value:a,onItemOpen:u,onItemClose:d,children:s.jsx(ge,{scope:e.__scopeAccordion,collapsible:!0,children:s.jsx(ve,{...i,ref:t})})})}),[Ot,$]=E(j),ve=y.forwardRef((e,t)=>{const{__scopeAccordion:o,disabled:r,dir:n,orientation:i="vertical",...a}=e,c=y.useRef(null),u=D(c,t),d=It(o),m=Rt(n)==="ltr",f=Fe(e.onKeyDown,h=>{var Q;if(!Pt.includes(h.key))return;const b=h.target,g=d().filter(M=>{var Z;return!((Z=M.ref.current)!=null&&Z.disabled)}),v=g.findIndex(M=>M.ref.current===b),C=g.length;if(v===-1)return;h.preventDefault();let x=v;const N=0,w=C-1,A=()=>{x=v+1,x>w&&(x=N)},S=()=>{x=v-1,x<N&&(x=w)};switch(h.key){case"Home":x=N;break;case"End":x=w;break;case"ArrowRight":i==="horizontal"&&(m?A():S());break;case"ArrowDown":i==="vertical"&&A();break;case"ArrowLeft":i==="horizontal"&&(m?S():A());break;case"ArrowUp":i==="vertical"&&S();break}const k=x%C;(Q=g[k].ref.current)==null||Q.focus()});return s.jsx(Ot,{scope:o,disabled:r,direction:n,orientation:i,children:s.jsx(H.Slot,{scope:o,children:s.jsx(ae.div,{...a,"data-orientation":i,ref:u,onKeyDown:r?void 0:f})})})}),P="AccordionItem",[Tt,G]=E(P),be=y.forwardRef((e,t)=>{const{__scopeAccordion:o,value:r,...n}=e,i=$(P,o),a=Et(P,o),c=K(o),u=St(),d=r&&a.value.includes(r)||!1,p=i.disabled||e.disabled;return s.jsx(Tt,{scope:o,open:d,disabled:p,triggerId:u,children:s.jsx(Ct,{"data-orientation":i.orientation,"data-state":Se(d),...c,...n,ref:t,disabled:p,open:d,onOpenChange:m=>{m?a.onItemOpen(r):a.onItemClose(r)}})})});be.displayName=P;var Ce="AccordionHeader",ye=y.forwardRef((e,t)=>{const{__scopeAccordion:o,...r}=e,n=$(j,o),i=G(Ce,o);return s.jsx(ae.h3,{"data-orientation":n.orientation,"data-state":Se(i.open),"data-disabled":i.disabled?"":void 0,...r,ref:t})});ye.displayName=Ce;var V="AccordionTrigger",Ne=y.forwardRef((e,t)=>{const{__scopeAccordion:o,...r}=e,n=$(j,o),i=G(V,o),a=$t(V,o),c=K(o);return s.jsx(H.ItemSlot,{scope:o,children:s.jsx(yt,{"aria-disabled":i.open&&!a.collapsible||void 0,"data-orientation":n.orientation,id:i.triggerId,...c,...r,ref:t})})});Ne.displayName=V;var we="AccordionContent",je=y.forwardRef((e,t)=>{const{__scopeAccordion:o,...r}=e,n=$(j,o),i=G(we,o),a=K(o);return s.jsx(Nt,{role:"region","aria-labelledby":i.triggerId,"data-orientation":n.orientation,...a,...r,ref:t,style:{"--radix-accordion-content-height":"var(--radix-collapsible-content-height)","--radix-accordion-content-width":"var(--radix-collapsible-content-width)",...e.style}})});je.displayName=we;function Se(e){return e?"open":"closed"}var Dt=xe,Lt=be,Vt=ye,zt=Ne,Bt=je;function Ut({...e}){return s.jsx(Dt,{"data-slot":"accordion",...e})}function Ft({className:e,...t}){return s.jsx(Lt,{"data-slot":"accordion-item",className:z("border-b last:border-b-0",e),...t})}function Wt({className:e,children:t,...o}){return s.jsx(Vt,{className:"flex",children:s.jsxs(zt,{"data-slot":"accordion-trigger",className:z("focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",e),...o,children:[t,s.jsx(Re,{className:"text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200"})]})})}function qt({className:e,children:t,...o}){return s.jsx(Bt,{"data-slot":"accordion-content",className:"data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm",...o,children:s.jsx("div",{className:z("pt-0 pb-4",e),children:t})})}function ne(e){return s.jsx("ul",{className:"ml-6 mt-2 list-decimal space-y-2 text-sm",children:e.map((t,o)=>s.jsxs("li",{children:[s.jsxs("strong",{children:["Q",o+1,":"]})," ",t.title,s.jsx("ul",{className:"ml-4 list-disc mt-1",children:t.options.map(r=>s.jsxs("li",{children:[r.label," (",r.score,")"]},r.id))})]},t.id))})}function Xt(){const{evaluation:e}=Ae().props,t=()=>{O.visit(route("evaluations.edit",{evaluation:e.id}))},o=()=>{confirm("ยืนยันเผยแพร่แบบประเมินนี้หรือไม่?")&&O.patch(route("evaluations.publish",{evaluation:e.id}),{},{onSuccess:()=>{Y.success("เผยแพร่แบบประเมินเรียบร้อยแล้ว"),O.visit(route("evaluations.index"))},onError:()=>{Y.error("ไม่สามารถเผยแพร่แบบประเมินได้")}})},r=()=>{const n=`
            /* Hide print-only content on screen */
            .print-only {
                display: none !important;
            }
            
            @page {
                size: A4;
                margin: 20mm 15mm 20mm 15mm;
                counter-increment: page;
            }
            
            @media print {
                /* Reset everything for print */
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                /* Hide everything except print area */
                body * {
                    visibility: hidden;
                }
                
                /* Show only print area content */
                .print-area,
                .print-area * {
                    visibility: visible !important;
                }
                
                /* Position print area */
                .print-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: 210mm !important;
                    margin: 0 !important;
                    padding: 20mm 15mm !important;
                }
                
                /* Body styles */
                body {
                    font-family: 'THSarabunNew', 'Sarabun', 'Arial Unicode MS', sans-serif !important;
                    font-size: 14px !important;
                    line-height: 1.5 !important;
                    color: #000 !important;
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: visible !important;
                }
                
                /* Hide non-print elements */
                .no-print {
                    display: none !important;
                    visibility: hidden !important;
                }
                
                /* Show print-only content during printing */
                .print-only {
                    display: block !important;
                    visibility: visible !important;
                }
                
                /* Document Header */
                .print-document-header {
                    text-align: center;
                    border-bottom: 3px double #000;
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                    page-break-after: avoid;
                }
                
                .print-main-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #000 !important;
                    margin-bottom: 10px;
                    letter-spacing: 1px;
                    line-height: 1.3;
                }
                
                .print-subtitle {
                    font-size: 20px;
                    font-weight: normal;
                    color: #000 !important;
                    margin-bottom: 0;
                    line-height: 1.3;
                }
                
                /* Document Info */
                .print-document-info {
                    border: 2px solid #000;
                    padding: 15px;
                    margin-bottom: 30px;
                    background: white;
                    font-size: 12px;
                    display: block;
                    page-break-after: avoid;
                    border-radius: 3px;
                }
                
                .print-summary {
                    color: #000 !important;
                    margin-bottom: 10px;
                    font-weight: bold;
                    line-height: 1.4;
                }
                
                .print-date {
                    color: #000 !important;
                    font-style: italic;
                    text-align: right;
                    font-size: 11px;
                    margin-top: 8px;
                }
                
                /* Hide TOC */
                .print-toc {
                    display: none !important;
                }
                
                /* Continuous Content */
                .print-continuous-content {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    overflow: visible;
                }
                
                /* Parts - Smart page breaks */
                .print-part {
                    margin-bottom: 20px;
                    page-break-inside: avoid;
                    orphans: 3;
                    widows: 3;
                }
                
                .print-part:not(:first-child) {
                    page-break-before: auto;
                    margin-top: 25px;
                }
                
                .print-part-header {
                    background: white !important;
                    color: #000 !important;
                    font-size: 18px;
                    font-weight: bold;
                    text-align: center;
                    margin: 20px 0 15px 0;
                    padding: 10px 0;
                    border-top: 3px solid #000;
                    border-bottom: 3px solid #000;
                    letter-spacing: 0.8px;
                    page-break-after: avoid;
                    line-height: 1.3;
                }
                
                .print-part-content {
                    margin: 0;
                    padding: 0;
                }
                
                /* Aspects */
                .print-aspect {
                    margin: 15px 0;
                    page-break-inside: avoid;
                    orphans: 2;
                    widows: 2;
                }
                
                .print-aspect-title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #000 !important;
                    margin: 12px 0 8px 0;
                    text-decoration: underline;
                    text-underline-offset: 4px;
                    text-decoration-thickness: 2px;
                    page-break-after: avoid;
                    line-height: 1.3;
                }
                
                /* Sub Aspects */
                .print-subaspect {
                    margin: 12px 0;
                    page-break-inside: avoid;
                    orphans: 2;
                    widows: 2;
                }
                
                .print-subaspect-title {
                    font-size: 15px;
                    font-weight: bold;
                    color: #000 !important;
                    margin: 10px 0 6px 0;
                    padding-bottom: 3px;
                    border-bottom: 2px solid #000;
                    font-style: italic;
                    page-break-after: avoid;
                    line-height: 1.3;
                }
                
                /* Questions - Better spacing and breaks */
                .print-question {
                    margin: 8px 0 12px 0;
                    page-break-inside: avoid;
                    padding-bottom: 4px;
                    orphans: 2;
                    widows: 2;
                }
                
                .print-question-line {
                    margin-bottom: 6px;
                    line-height: 1.5;
                    page-break-after: avoid;
                }
                
                .print-question-number {
                    font-size: 14px;
                    font-weight: bold;
                    color: #000 !important;
                    margin-right: 10px;
                    display: inline-block;
                    min-width: 30px;
                }
                
                .print-question-title {
                    font-size: 14px;
                    font-weight: normal;
                    color: #000 !important;
                    display: inline;
                    line-height: 1.5;
                }
                
                /* Options - Better horizontal layout */
                .print-options {
                    margin: 6px 0 10px 30px;
                    font-size: 12px;
                    line-height: 1.4;
                    border-left: 3px solid #e0e0e0;
                    padding-left: 12px;
                }
                
                .print-option {
                    display: inline-block;
                    color: #000 !important;
                    margin-right: 12px;
                    white-space: nowrap;
                }
                
                .print-option-text {
                    color: #000 !important;
                    font-weight: normal;
                }
                
                .print-option-score {
                    color: #000 !important;
                    font-weight: bold;
                }
                
                .print-option-score:before {
                    content: " (";
                    font-weight: normal;
                }
                
                .print-option-score:after {
                    content: ")";
                    font-weight: normal;
                }
                
                /* Footer */
                .print-footer {
                    position: fixed;
                    bottom: 15mm;
                    left: 15mm;
                    right: 15mm;
                    text-align: center;
                    font-size: 11px;
                    color: #000 !important;
                    border-top: 2px solid #000;
                    padding-top: 8px;
                    background: white;
                    z-index: 1000;
                }
                
                /* Intelligent page break control */
                .print-part-header,
                .print-aspect-title,
                .print-subaspect-title {
                    page-break-after: avoid !important;
                }
                
                .print-question {
                    page-break-inside: avoid !important;
                }
                
                /* Prevent awkward breaks */
                .print-aspect:has(.print-subaspect) {
                    page-break-inside: avoid;
                }
                
                /* Ensure content flows naturally */
                .print-continuous-content > * {
                    page-break-before: auto;
                    page-break-after: auto;
                }
                
                /* Better widow/orphan control */
                p, div, .print-question, .print-aspect, .print-subaspect {
                    orphans: 2;
                    widows: 2;
                }
            }
        `,i=document.getElementById("print-styles");i&&i.remove();const a=document.createElement("style");a.id="print-styles",a.type="text/css",a.innerHTML=n,document.head.appendChild(a),setTimeout(()=>{window.print()},100)};return s.jsx(Pe,{title:"Preview แบบประเมิน",breadcrumb:s.jsx($e,{items:[{label:"แดชบอร์ดผู้ดูแลระบบ",href:route("admindashboard")},{label:"รายการแบบประเมิน",href:route("evaluations.index")},{label:"Preview แบบประเมิน",active:!0}]}),children:s.jsxs("div",{className:"max-w-6xl mx-auto px-6 py-10 space-y-6",children:[s.jsxs("h1",{className:"text-3xl font-bold text-gray-800 dark:text-white no-print",children:["👁️ Preview แบบประเมิน: ",e.title]}),s.jsxs("div",{className:"print-area",children:[s.jsxs("div",{className:"print-document-header",children:[s.jsx("div",{className:"print-main-title",children:"รายงานแบบประเมิน 360 องศา"}),s.jsx("div",{className:"print-subtitle",children:e.title})]}),s.jsxs("div",{className:"print-document-info",children:[s.jsxs("div",{className:"print-summary",children:[s.jsx("strong",{children:"สรุปเอกสาร:"})," ",e.parts.length," ส่วน • ",e.aspects_count," ด้าน • ",e.subaspects_count," หัวข้อย่อย • ",e.questions_count," คำถาม • ",e.options_count," ตัวเลือก"]}),s.jsxs("div",{className:"print-date",children:["วันที่พิมพ์: ",new Date().toLocaleDateString("th-TH",{year:"numeric",month:"long",day:"numeric"})]})]}),s.jsxs("div",{className:"print-toc",children:[s.jsx("div",{className:"print-toc-title",children:"สารบัญ"}),e.parts.map((n,i)=>s.jsxs("div",{className:"print-toc-item",children:[s.jsxs("span",{children:["ส่วนที่ ",i+1,": ",n.title]}),s.jsxs("span",{children:[n.aspects.length," ด้าน"]})]},n.id))]}),e.parts.map((n,i)=>s.jsx("div",{className:"print-card",children:s.jsxs(Ie,{className:"no-print",children:[s.jsxs(_e,{className:"text-xl font-semibold",children:["Part ",i+1,": ",n.title]}),s.jsx(Ee,{children:s.jsx(Ut,{type:"multiple",className:"w-full",children:n.aspects.map(a=>{var c;return s.jsxs(Ft,{value:`aspect-${a.id}`,children:[s.jsx(Wt,{children:String(a.title??"").trim()!==""?a.title:s.jsx("span",{className:"text-muted-foreground italic",children:"*ไม่มีชื่อด้าน*"})}),s.jsx(qt,{children:a.has_subaspects&&((c=a.subaspects)!=null&&c.length)?s.jsx("div",{className:"space-y-4 mt-2",children:a.subaspects.map(u=>s.jsxs("div",{children:[s.jsx("h4",{className:"text-base font-medium",children:String(u.title??"").trim()!==""?u.title:s.jsx("span",{className:"text-muted-foreground italic",children:"*ไม่มีชื่อหัวข้อย่อย*"})}),ne(u.questions)]},u.id))}):ne(a.questions??[])})]},a.id)})})})]})},n.id)),s.jsx("div",{className:"print-only print-content",children:(()=>{let n=0;return s.jsx("div",{className:"print-continuous-content",children:e.parts.map((i,a)=>s.jsxs("div",{className:"print-part",children:[s.jsxs("div",{className:"print-part-header",children:["ส่วนที่ ",a+1,": ",i.title]}),s.jsx("div",{className:"print-part-content",children:i.aspects.map(c=>{var u;return s.jsxs("div",{className:"print-aspect",children:[s.jsx("div",{className:"print-aspect-title",children:String(c.title??"").trim()!==""?c.title:"ไม่มีชื่อด้าน"}),c.has_subaspects&&((u=c.subaspects)!=null&&u.length)?s.jsx(s.Fragment,{children:c.subaspects.map(d=>s.jsxs("div",{className:"print-subaspect",children:[s.jsx("div",{className:"print-subaspect-title",children:String(d.title??"").trim()!==""?d.title:"ไม่มีชื่อหัวข้อย่อย"}),d.questions.map(p=>(n++,s.jsxs("div",{className:"print-question",children:[s.jsxs("div",{className:"print-question-line",children:[s.jsxs("span",{className:"print-question-number",children:[n,"."]}),s.jsx("span",{className:"print-question-title",children:p.title})]}),s.jsx("div",{className:"print-options",children:p.options.map((m,f)=>s.jsxs("span",{className:"print-option",children:[s.jsx("span",{className:"print-option-text",children:m.label}),s.jsx("span",{className:"print-option-score",children:m.score}),f<p.options.length-1?" | ":""]},m.id))})]},p.id)))]},d.id))}):s.jsx(s.Fragment,{children:(c.questions??[]).map(d=>(n++,s.jsxs("div",{className:"print-question",children:[s.jsxs("div",{className:"print-question-line",children:[s.jsxs("span",{className:"print-question-number",children:[n,"."]}),s.jsx("span",{className:"print-question-title",children:d.title})]}),s.jsx("div",{className:"print-options",children:d.options.map((p,m)=>s.jsxs("span",{className:"print-option",children:[s.jsx("span",{className:"print-option-text",children:p.label}),s.jsx("span",{className:"print-option-score",children:p.score}),m<d.options.length-1?" | ":""]},p.id))})]},d.id)))})]},c.id)})})]},i.id))})})()}),s.jsx("div",{className:"print-footer",children:s.jsxs("div",{children:["รายงานแบบประเมิน 360 องศา | สร้างโดยระบบประเมินการปฏิบัติงาน | หน้า ",s.jsx("span",{className:"print-page-number"})]})})]}),s.jsx("div",{className:"rounded-xl border p-4 shadow-sm bg-muted no-print",children:s.jsxs("p",{className:"text-gray-800 dark:text-white",children:["📊 ",s.jsx("strong",{children:"สรุป:"})," Part: ",e.parts.length," | ด้าน: ",e.aspects_count," | หัวข้อย่อย: ",e.subaspects_count," | คำถาม: ",e.questions_count," | ตัวเลือก: ",e.options_count]})}),s.jsxs("div",{className:"flex justify-end space-x-3 no-print",children:[s.jsxs(T,{variant:"outline",onClick:r,className:"bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 font-medium",children:[s.jsx(Oe,{className:"w-4 h-4 mr-2"}),"พิมพ์รายงานแบบประเมิน"]}),s.jsx(T,{variant:"outline",onClick:t,children:"🔙 แก้ไขแบบประเมิน"}),s.jsx(T,{variant:"default",onClick:o,children:"🚀 เผยแพร่"})]})]})})}export{Xt as default};
