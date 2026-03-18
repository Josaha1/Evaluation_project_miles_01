import{j as i,m as P,t as J}from"./ui-DVaKxNoV.js";import{C as Re,M as Pe}from"./MainLayout-BlLxCing.js";import{r as l,R as C,a as E,K as Ie,S as L}from"./inertia-Du3s-lXJ.js";import{c as A}from"./utils-D7ovTL8T.js";import{B as ke}from"./breadcrumb-B13z1wGi.js";import{L as _e}from"./layers-mV3AuAAh.js";import{C as Ee}from"./chart-column-vX-MBY-A.js";import{F as $e}from"./file-text-ClNQIReL.js";import{C as Me}from"./circle-help-CFXxnYMo.js";import{E as Oe}from"./eye-C3-PG9fH.js";import{C as Te}from"./clipboard-list-diAdr6T5.js";import{P as De}from"./printer-BkYLEwRX.js";import{A as Le}from"./arrow-left-Du4paA9j.js";import{S as Ve}from"./send-DsATIUyF.js";import"./vendor-BkfY9j8H.js";import"./useDarkMode-o_jE3Yk4.js";import"./createLucideIcon-BzbnJQMW.js";import"./log-out-D8Dhth9A.js";import"./x-1MPlkpfU.js";function re(e,t=[]){let n=[];function s(r,c){const a=l.createContext(c),d=n.length;n=[...n,c];const u=p=>{var y;const{scope:f,children:x,...b}=p,g=((y=f==null?void 0:f[e])==null?void 0:y[d])||a,v=l.useMemo(()=>b,Object.values(b));return i.jsx(g.Provider,{value:v,children:x})};u.displayName=r+"Provider";function m(p,f){var g;const x=((g=f==null?void 0:f[e])==null?void 0:g[d])||a,b=l.useContext(x);if(b)return b;if(c!==void 0)return c;throw new Error(`\`${p}\` must be used within \`${r}\``)}return[u,m]}const o=()=>{const r=n.map(c=>l.createContext(c));return function(a){const d=(a==null?void 0:a[e])||r;return l.useMemo(()=>({[`__scope${e}`]:{...a,[e]:d}}),[a,d])}};return o.scopeName=e,[s,ze(o,...t)]}function ze(...e){const t=e[0];if(e.length===1)return t;const n=()=>{const s=e.map(o=>({useScope:o(),scopeName:o.scopeName}));return function(r){const c=s.reduce((a,{useScope:d,scopeName:u})=>{const p=d(r)[`__scope${u}`];return{...a,...p}},{});return l.useMemo(()=>({[`__scope${t.scopeName}`]:c}),[c])}};return n.scopeName=t.scopeName,n}function X(e,t){if(typeof e=="function")return e(t);e!=null&&(e.current=t)}function ie(...e){return t=>{let n=!1;const s=e.map(o=>{const r=X(o,t);return!n&&typeof r=="function"&&(n=!0),r});if(n)return()=>{for(let o=0;o<s.length;o++){const r=s[o];typeof r=="function"?r():X(e[o],null)}}}}function V(...e){return l.useCallback(ie(...e),e)}function z(e){const t=Fe(e),n=l.forwardRef((s,o)=>{const{children:r,...c}=s,a=l.Children.toArray(r),d=a.find(We);if(d){const u=d.props.children,m=a.map(p=>p===d?l.Children.count(u)>1?l.Children.only(null):l.isValidElement(u)?u.props.children:null:p);return i.jsx(t,{...c,ref:o,children:l.isValidElement(u)?l.cloneElement(u,void 0,m):null})}return i.jsx(t,{...c,ref:o,children:r})});return n.displayName=`${e}.Slot`,n}function Fe(e){const t=l.forwardRef((n,s)=>{const{children:o,...r}=n;if(l.isValidElement(o)){const c=Be(o),a=qe(r,o.props);return o.type!==l.Fragment&&(a.ref=s?ie(s,c):c),l.cloneElement(o,a)}return l.Children.count(o)>1?l.Children.only(null):null});return t.displayName=`${e}.SlotClone`,t}var Ue=Symbol("radix.slottable");function We(e){return l.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===Ue}function qe(e,t){const n={...t};for(const s in t){const o=e[s],r=t[s];/^on[A-Z]/.test(s)?o&&r?n[s]=(...a)=>{r(...a),o(...a)}:o&&(n[s]=o):s==="style"?n[s]={...o,...r}:s==="className"&&(n[s]=[o,r].filter(Boolean).join(" "))}return{...e,...n}}function Be(e){var s,o;let t=(s=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:s.get,n=t&&"isReactWarning"in t&&t.isReactWarning;return n?e.ref:(t=(o=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:o.get,n=t&&"isReactWarning"in t&&t.isReactWarning,n?e.props.ref:e.props.ref||e.ref)}function Ke(e){const t=e+"CollectionProvider",[n,s]=re(t),[o,r]=n(t,{collectionRef:{current:null},itemMap:new Map}),c=g=>{const{scope:v,children:y}=g,h=C.useRef(null),N=C.useRef(new Map).current;return i.jsx(o,{scope:v,itemMap:N,collectionRef:h,children:y})};c.displayName=t;const a=e+"CollectionSlot",d=z(a),u=C.forwardRef((g,v)=>{const{scope:y,children:h}=g,N=r(a,y),j=V(v,N.collectionRef);return i.jsx(d,{ref:j,children:h})});u.displayName=a;const m=e+"CollectionItemSlot",p="data-radix-collection-item",f=z(m),x=C.forwardRef((g,v)=>{const{scope:y,children:h,...N}=g,j=C.useRef(null),R=V(v,j),S=r(m,y);return C.useEffect(()=>(S.itemMap.set(j,{ref:j,...N}),()=>void S.itemMap.delete(j))),i.jsx(f,{[p]:"",ref:R,children:h})});x.displayName=m;function b(g){const v=r(e+"CollectionConsumer",g);return C.useCallback(()=>{const h=v.collectionRef.current;if(!h)return[];const N=Array.from(h.querySelectorAll(`[${p}]`));return Array.from(v.itemMap.values()).sort((S,T)=>N.indexOf(S.ref.current)-N.indexOf(T.ref.current))},[v.collectionRef,v.itemMap])}return[{Provider:c,Slot:u,ItemSlot:x},b,s]}function Ge(e,t,{checkForDefaultPrevented:n=!0}={}){return function(o){if(e==null||e(o),n===!1||!o.defaultPrevented)return t==null?void 0:t(o)}}var se=globalThis!=null&&globalThis.document?l.useLayoutEffect:()=>{},Qe=E[" useInsertionEffect ".trim().toString()]||se;function ae({prop:e,defaultProp:t,onChange:n=()=>{},caller:s}){const[o,r,c]=He({defaultProp:t,onChange:n}),a=e!==void 0,d=a?e:o;{const m=l.useRef(e!==void 0);l.useEffect(()=>{const p=m.current;p!==a&&console.warn(`${s} is changing from ${p?"controlled":"uncontrolled"} to ${a?"controlled":"uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`),m.current=a},[a,s])}const u=l.useCallback(m=>{var p;if(a){const f=Ze(m)?m(e):m;f!==e&&((p=c.current)==null||p.call(c,f))}else r(m)},[a,e,r,c]);return[d,u]}function He({defaultProp:e,onChange:t}){const[n,s]=l.useState(e),o=l.useRef(n),r=l.useRef(t);return Qe(()=>{r.current=t},[t]),l.useEffect(()=>{var c;o.current!==n&&((c=r.current)==null||c.call(r,n),o.current=n)},[n,o]),[n,s,r]}function Ze(e){return typeof e=="function"}var Ye=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],ce=Ye.reduce((e,t)=>{const n=z(`Primitive.${t}`),s=l.forwardRef((o,r)=>{const{asChild:c,...a}=o,d=c?n:t;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),i.jsx(d,{...a,ref:r})});return s.displayName=`Primitive.${t}`,{...e,[t]:s}},{});function Je(e,t,{checkForDefaultPrevented:n=!0}={}){return function(o){if(e==null||e(o),n===!1||!o.defaultPrevented)return t==null?void 0:t(o)}}function Xe(e,t=[]){let n=[];function s(r,c){const a=l.createContext(c),d=n.length;n=[...n,c];const u=p=>{var y;const{scope:f,children:x,...b}=p,g=((y=f==null?void 0:f[e])==null?void 0:y[d])||a,v=l.useMemo(()=>b,Object.values(b));return i.jsx(g.Provider,{value:v,children:x})};u.displayName=r+"Provider";function m(p,f){var g;const x=((g=f==null?void 0:f[e])==null?void 0:g[d])||a,b=l.useContext(x);if(b)return b;if(c!==void 0)return c;throw new Error(`\`${p}\` must be used within \`${r}\``)}return[u,m]}const o=()=>{const r=n.map(c=>l.createContext(c));return function(a){const d=(a==null?void 0:a[e])||r;return l.useMemo(()=>({[`__scope${e}`]:{...a,[e]:d}}),[a,d])}};return o.scopeName=e,[s,et(o,...t)]}function et(...e){const t=e[0];if(e.length===1)return t;const n=()=>{const s=e.map(o=>({useScope:o(),scopeName:o.scopeName}));return function(r){const c=s.reduce((a,{useScope:d,scopeName:u})=>{const p=d(r)[`__scope${u}`];return{...a,...p}},{});return l.useMemo(()=>({[`__scope${t.scopeName}`]:c}),[c])}};return n.scopeName=t.scopeName,n}var U=globalThis!=null&&globalThis.document?l.useLayoutEffect:()=>{},tt=E[" useInsertionEffect ".trim().toString()]||U;function nt({prop:e,defaultProp:t,onChange:n=()=>{},caller:s}){const[o,r,c]=ot({defaultProp:t,onChange:n}),a=e!==void 0,d=a?e:o;{const m=l.useRef(e!==void 0);l.useEffect(()=>{const p=m.current;p!==a&&console.warn(`${s} is changing from ${p?"controlled":"uncontrolled"} to ${a?"controlled":"uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`),m.current=a},[a,s])}const u=l.useCallback(m=>{var p;if(a){const f=rt(m)?m(e):m;f!==e&&((p=c.current)==null||p.call(c,f))}else r(m)},[a,e,r,c]);return[d,u]}function ot({defaultProp:e,onChange:t}){const[n,s]=l.useState(e),o=l.useRef(n),r=l.useRef(t);return tt(()=>{r.current=t},[t]),l.useEffect(()=>{var c;o.current!==n&&((c=r.current)==null||c.call(r,n),o.current=n)},[n,o]),[n,s,r]}function rt(e){return typeof e=="function"}function ee(e,t){if(typeof e=="function")return e(t);e!=null&&(e.current=t)}function le(...e){return t=>{let n=!1;const s=e.map(o=>{const r=ee(o,t);return!n&&typeof r=="function"&&(n=!0),r});if(n)return()=>{for(let o=0;o<s.length;o++){const r=s[o];typeof r=="function"?r():ee(e[o],null)}}}}function it(...e){return l.useCallback(le(...e),e)}function st(e){const t=at(e),n=l.forwardRef((s,o)=>{const{children:r,...c}=s,a=l.Children.toArray(r),d=a.find(lt);if(d){const u=d.props.children,m=a.map(p=>p===d?l.Children.count(u)>1?l.Children.only(null):l.isValidElement(u)?u.props.children:null:p);return i.jsx(t,{...c,ref:o,children:l.isValidElement(u)?l.cloneElement(u,void 0,m):null})}return i.jsx(t,{...c,ref:o,children:r})});return n.displayName=`${e}.Slot`,n}function at(e){const t=l.forwardRef((n,s)=>{const{children:o,...r}=n;if(l.isValidElement(o)){const c=ut(o),a=dt(r,o.props);return o.type!==l.Fragment&&(a.ref=s?le(s,c):c),l.cloneElement(o,a)}return l.Children.count(o)>1?l.Children.only(null):null});return t.displayName=`${e}.SlotClone`,t}var ct=Symbol("radix.slottable");function lt(e){return l.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===ct}function dt(e,t){const n={...t};for(const s in t){const o=e[s],r=t[s];/^on[A-Z]/.test(s)?o&&r?n[s]=(...a)=>{r(...a),o(...a)}:o&&(n[s]=o):s==="style"?n[s]={...o,...r}:s==="className"&&(n[s]=[o,r].filter(Boolean).join(" "))}return{...e,...n}}function ut(e){var s,o;let t=(s=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:s.get,n=t&&"isReactWarning"in t&&t.isReactWarning;return n?e.ref:(t=(o=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:o.get,n=t&&"isReactWarning"in t&&t.isReactWarning,n?e.props.ref:e.props.ref||e.ref)}var pt=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],W=pt.reduce((e,t)=>{const n=st(`Primitive.${t}`),s=l.forwardRef((o,r)=>{const{asChild:c,...a}=o,d=c?n:t;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),i.jsx(d,{...a,ref:r})});return s.displayName=`Primitive.${t}`,{...e,[t]:s}},{});function te(e,t){if(typeof e=="function")return e(t);e!=null&&(e.current=t)}function mt(...e){return t=>{let n=!1;const s=e.map(o=>{const r=te(o,t);return!n&&typeof r=="function"&&(n=!0),r});if(n)return()=>{for(let o=0;o<s.length;o++){const r=s[o];typeof r=="function"?r():te(e[o],null)}}}}function ft(...e){return l.useCallback(mt(...e),e)}var ne=globalThis!=null&&globalThis.document?l.useLayoutEffect:()=>{};function xt(e,t){return l.useReducer((n,s)=>t[n][s]??n,e)}var de=e=>{const{present:t,children:n}=e,s=ht(t),o=typeof n=="function"?n({present:s.isPresent}):l.Children.only(n),r=ft(s.ref,gt(o));return typeof n=="function"||s.isPresent?l.cloneElement(o,{ref:r}):null};de.displayName="Presence";function ht(e){const[t,n]=l.useState(),s=l.useRef({}),o=l.useRef(e),r=l.useRef("none"),c=e?"mounted":"unmounted",[a,d]=xt(c,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return l.useEffect(()=>{const u=I(s.current);r.current=a==="mounted"?u:"none"},[a]),ne(()=>{const u=s.current,m=o.current;if(m!==e){const f=r.current,x=I(u);e?d("MOUNT"):x==="none"||(u==null?void 0:u.display)==="none"?d("UNMOUNT"):d(m&&f!==x?"ANIMATION_OUT":"UNMOUNT"),o.current=e}},[e,d]),ne(()=>{if(t){let u;const m=t.ownerDocument.defaultView??window,p=x=>{const g=I(s.current).includes(x.animationName);if(x.target===t&&g&&(d("ANIMATION_END"),!o.current)){const v=t.style.animationFillMode;t.style.animationFillMode="forwards",u=m.setTimeout(()=>{t.style.animationFillMode==="forwards"&&(t.style.animationFillMode=v)})}},f=x=>{x.target===t&&(r.current=I(s.current))};return t.addEventListener("animationstart",f),t.addEventListener("animationcancel",p),t.addEventListener("animationend",p),()=>{m.clearTimeout(u),t.removeEventListener("animationstart",f),t.removeEventListener("animationcancel",p),t.removeEventListener("animationend",p)}}else d("ANIMATION_END")},[t,d]),{isPresent:["mounted","unmountSuspended"].includes(a),ref:l.useCallback(u=>{u&&(s.current=getComputedStyle(u)),n(u)},[])}}function I(e){return(e==null?void 0:e.animationName)||"none"}function gt(e){var s,o;let t=(s=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:s.get,n=t&&"isReactWarning"in t&&t.isReactWarning;return n?e.ref:(t=(o=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:o.get,n=t&&"isReactWarning"in t&&t.isReactWarning,n?e.props.ref:e.props.ref||e.ref)}var vt=E[" useId ".trim().toString()]||(()=>{}),bt=0;function yt(e){const[t,n]=l.useState(vt());return U(()=>{n(s=>s??String(bt++))},[e]),e||(t?`radix-${t}`:"")}var $="Collapsible",[Ct,ue]=Xe($),[Nt,q]=Ct($),pe=l.forwardRef((e,t)=>{const{__scopeCollapsible:n,open:s,defaultOpen:o,disabled:r,onOpenChange:c,...a}=e,[d,u]=nt({prop:s,defaultProp:o??!1,onChange:c,caller:$});return i.jsx(Nt,{scope:n,disabled:r,contentId:yt(),open:d,onOpenToggle:l.useCallback(()=>u(m=>!m),[u]),children:i.jsx(W.div,{"data-state":K(d),"data-disabled":r?"":void 0,...a,ref:t})})});pe.displayName=$;var me="CollapsibleTrigger",fe=l.forwardRef((e,t)=>{const{__scopeCollapsible:n,...s}=e,o=q(me,n);return i.jsx(W.button,{type:"button","aria-controls":o.contentId,"aria-expanded":o.open||!1,"data-state":K(o.open),"data-disabled":o.disabled?"":void 0,disabled:o.disabled,...s,ref:t,onClick:Je(e.onClick,o.onOpenToggle)})});fe.displayName=me;var B="CollapsibleContent",xe=l.forwardRef((e,t)=>{const{forceMount:n,...s}=e,o=q(B,e.__scopeCollapsible);return i.jsx(de,{present:n||o.open,children:({present:r})=>i.jsx(jt,{...s,ref:t,present:r})})});xe.displayName=B;var jt=l.forwardRef((e,t)=>{const{__scopeCollapsible:n,present:s,children:o,...r}=e,c=q(B,n),[a,d]=l.useState(s),u=l.useRef(null),m=it(t,u),p=l.useRef(0),f=p.current,x=l.useRef(0),b=x.current,g=c.open||a,v=l.useRef(g),y=l.useRef(void 0);return l.useEffect(()=>{const h=requestAnimationFrame(()=>v.current=!1);return()=>cancelAnimationFrame(h)},[]),U(()=>{const h=u.current;if(h){y.current=y.current||{transitionDuration:h.style.transitionDuration,animationName:h.style.animationName},h.style.transitionDuration="0s",h.style.animationName="none";const N=h.getBoundingClientRect();p.current=N.height,x.current=N.width,v.current||(h.style.transitionDuration=y.current.transitionDuration,h.style.animationName=y.current.animationName),d(s)}},[c.open,s]),i.jsx(W.div,{"data-state":K(c.open),"data-disabled":c.disabled?"":void 0,id:c.contentId,hidden:!g,...r,ref:m,style:{"--radix-collapsible-content-height":f?`${f}px`:void 0,"--radix-collapsible-content-width":b?`${b}px`:void 0,...e.style},children:g&&o})});function K(e){return e?"open":"closed"}var wt=pe,St=fe,At=xe,Rt=E[" useId ".trim().toString()]||(()=>{}),Pt=0;function It(e){const[t,n]=l.useState(Rt());return se(()=>{n(s=>s??String(Pt++))},[e]),t?`radix-${t}`:""}var kt=l.createContext(void 0);function _t(e){const t=l.useContext(kt);return e||t||"ltr"}var w="Accordion",Et=["Home","End","ArrowDown","ArrowUp","ArrowLeft","ArrowRight"],[G,$t,Mt]=Ke(w),[M,gn]=re(w,[Mt,ue]),Q=ue(),he=C.forwardRef((e,t)=>{const{type:n,...s}=e,o=s,r=s;return i.jsx(G.Provider,{scope:e.__scopeAccordion,children:n==="multiple"?i.jsx(Lt,{...r,ref:t}):i.jsx(Dt,{...o,ref:t})})});he.displayName=w;var[ge,Ot]=M(w),[ve,Tt]=M(w,{collapsible:!1}),Dt=C.forwardRef((e,t)=>{const{value:n,defaultValue:s,onValueChange:o=()=>{},collapsible:r=!1,...c}=e,[a,d]=ae({prop:n,defaultProp:s??"",onChange:o,caller:w});return i.jsx(ge,{scope:e.__scopeAccordion,value:C.useMemo(()=>a?[a]:[],[a]),onItemOpen:d,onItemClose:C.useCallback(()=>r&&d(""),[r,d]),children:i.jsx(ve,{scope:e.__scopeAccordion,collapsible:r,children:i.jsx(be,{...c,ref:t})})})}),Lt=C.forwardRef((e,t)=>{const{value:n,defaultValue:s,onValueChange:o=()=>{},...r}=e,[c,a]=ae({prop:n,defaultProp:s??[],onChange:o,caller:w}),d=C.useCallback(m=>a((p=[])=>[...p,m]),[a]),u=C.useCallback(m=>a((p=[])=>p.filter(f=>f!==m)),[a]);return i.jsx(ge,{scope:e.__scopeAccordion,value:c,onItemOpen:d,onItemClose:u,children:i.jsx(ve,{scope:e.__scopeAccordion,collapsible:!0,children:i.jsx(be,{...r,ref:t})})})}),[Vt,O]=M(w),be=C.forwardRef((e,t)=>{const{__scopeAccordion:n,disabled:s,dir:o,orientation:r="vertical",...c}=e,a=C.useRef(null),d=V(a,t),u=$t(n),p=_t(o)==="ltr",f=Ge(e.onKeyDown,x=>{var Z;if(!Et.includes(x.key))return;const b=x.target,g=u().filter(D=>{var Y;return!((Y=D.ref.current)!=null&&Y.disabled)}),v=g.findIndex(D=>D.ref.current===b),y=g.length;if(v===-1)return;x.preventDefault();let h=v;const N=0,j=y-1,R=()=>{h=v+1,h>j&&(h=N)},S=()=>{h=v-1,h<N&&(h=j)};switch(x.key){case"Home":h=N;break;case"End":h=j;break;case"ArrowRight":r==="horizontal"&&(p?R():S());break;case"ArrowDown":r==="vertical"&&R();break;case"ArrowLeft":r==="horizontal"&&(p?S():R());break;case"ArrowUp":r==="vertical"&&S();break}const T=h%y;(Z=g[T].ref.current)==null||Z.focus()});return i.jsx(Vt,{scope:n,disabled:s,direction:o,orientation:r,children:i.jsx(G.Slot,{scope:n,children:i.jsx(ce.div,{...c,"data-orientation":r,ref:d,onKeyDown:s?void 0:f})})})}),_="AccordionItem",[zt,H]=M(_),ye=C.forwardRef((e,t)=>{const{__scopeAccordion:n,value:s,...o}=e,r=O(_,n),c=Ot(_,n),a=Q(n),d=It(),u=s&&c.value.includes(s)||!1,m=r.disabled||e.disabled;return i.jsx(zt,{scope:n,open:u,disabled:m,triggerId:d,children:i.jsx(wt,{"data-orientation":r.orientation,"data-state":Ae(u),...a,...o,ref:t,disabled:m,open:u,onOpenChange:p=>{p?c.onItemOpen(s):c.onItemClose(s)}})})});ye.displayName=_;var Ce="AccordionHeader",Ne=C.forwardRef((e,t)=>{const{__scopeAccordion:n,...s}=e,o=O(w,n),r=H(Ce,n);return i.jsx(ce.h3,{"data-orientation":o.orientation,"data-state":Ae(r.open),"data-disabled":r.disabled?"":void 0,...s,ref:t})});Ne.displayName=Ce;var F="AccordionTrigger",je=C.forwardRef((e,t)=>{const{__scopeAccordion:n,...s}=e,o=O(w,n),r=H(F,n),c=Tt(F,n),a=Q(n);return i.jsx(G.ItemSlot,{scope:n,children:i.jsx(St,{"aria-disabled":r.open&&!c.collapsible||void 0,"data-orientation":o.orientation,id:r.triggerId,...a,...s,ref:t})})});je.displayName=F;var we="AccordionContent",Se=C.forwardRef((e,t)=>{const{__scopeAccordion:n,...s}=e,o=O(w,n),r=H(we,n),c=Q(n);return i.jsx(At,{role:"region","aria-labelledby":r.triggerId,"data-orientation":o.orientation,...c,...s,ref:t,style:{"--radix-accordion-content-height":"var(--radix-collapsible-content-height)","--radix-accordion-content-width":"var(--radix-collapsible-content-width)",...e.style}})});Se.displayName=we;function Ae(e){return e?"open":"closed"}var Ft=he,Ut=ye,Wt=Ne,qt=je,Bt=Se;function Kt({...e}){return i.jsx(Ft,{"data-slot":"accordion",...e})}function Gt({className:e,...t}){return i.jsx(Ut,{"data-slot":"accordion-item",className:A("border-b last:border-b-0",e),...t})}function Qt({className:e,children:t,...n}){return i.jsx(Wt,{className:"flex",children:i.jsxs(qt,{"data-slot":"accordion-trigger",className:A("focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",e),...n,children:[t,i.jsx(Re,{className:"text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200"})]})})}function Ht({className:e,children:t,...n}){return i.jsx(Bt,{"data-slot":"accordion-content",className:"data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm",...n,children:i.jsx("div",{className:A("pt-0 pb-4",e),children:t})})}const Zt={hidden:{opacity:0},visible:{opacity:1,transition:{staggerChildren:.08}}},k={hidden:{opacity:0,y:20},visible:{opacity:1,y:0,transition:{duration:.4}}};function oe(e){return i.jsx("ul",{className:"ml-6 mt-2 list-decimal space-y-2 text-sm",children:e.map((t,n)=>i.jsxs("li",{children:[i.jsxs("strong",{className:"text-violet-700 dark:text-violet-300",children:["Q",n+1,":"]})," ",i.jsx("span",{className:"text-gray-700 dark:text-gray-300",children:t.title}),i.jsx("ul",{className:"ml-4 list-disc mt-1",children:t.options.map(s=>i.jsxs("li",{className:"text-gray-600 dark:text-gray-400",children:[s.label," ",i.jsxs("span",{className:"text-violet-600 dark:text-violet-400 font-medium",children:["(",s.score,")"]})]},s.id))})]},t.id))})}function vn(){const{evaluation:e}=Ie().props,t=()=>{L.visit(route("evaluations.edit",{evaluation:e.id}))},n=()=>{confirm("ยืนยันเผยแพร่แบบประเมินนี้หรือไม่?")&&L.patch(route("evaluations.publish",{evaluation:e.id}),{},{onSuccess:()=>{J.success("เผยแพร่แบบประเมินเรียบร้อยแล้ว"),L.visit(route("evaluations.index"))},onError:()=>{J.error("ไม่สามารถเผยแพร่แบบประเมินได้")}})},s=()=>{const r=`
            .print-only {
                display: none !important;
            }

            @page {
                size: A4;
                margin: 20mm 15mm 20mm 15mm;
                counter-increment: page;
            }

            @media print {
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                body * {
                    visibility: hidden;
                }

                .print-area,
                .print-area * {
                    visibility: visible !important;
                }

                .print-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: 210mm !important;
                    margin: 0 !important;
                    padding: 20mm 15mm !important;
                }

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

                .no-print {
                    display: none !important;
                    visibility: hidden !important;
                }

                .print-only {
                    display: block !important;
                    visibility: visible !important;
                }

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

                .print-toc {
                    display: none !important;
                }

                .print-continuous-content {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    overflow: visible;
                }

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

                .print-part-header,
                .print-aspect-title,
                .print-subaspect-title {
                    page-break-after: avoid !important;
                }

                .print-question {
                    page-break-inside: avoid !important;
                }

                .print-aspect:has(.print-subaspect) {
                    page-break-inside: avoid;
                }

                .print-continuous-content > * {
                    page-break-before: auto;
                    page-break-after: auto;
                }

                p, div, .print-question, .print-aspect, .print-subaspect {
                    orphans: 2;
                    widows: 2;
                }
            }
        `,c=document.getElementById("print-styles");c&&c.remove();const a=document.createElement("style");a.id="print-styles",a.type="text/css",a.innerHTML=r,document.head.appendChild(a),setTimeout(()=>{window.print()},100)},o=[{label:"Part",value:e.parts.length,icon:_e,color:"bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"},{label:"ด้าน",value:e.aspects_count,icon:Ee,color:"bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300"},{label:"หัวข้อย่อย",value:e.subaspects_count,icon:$e,color:"bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"},{label:"คำถาม",value:e.questions_count,icon:Me,color:"bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"}];return i.jsx(Pe,{title:"Preview แบบประเมิน",breadcrumb:i.jsx(ke,{items:[{label:"แดชบอร์ดผู้ดูแลระบบ",href:route("admindashboard")},{label:"รายการแบบประเมิน",href:route("evaluations.index")},{label:"Preview แบบประเมิน",active:!0}]}),children:i.jsx("div",{className:"gradient-primary-soft min-h-screen -my-6 px-4 sm:px-6 lg:px-8 py-6",children:i.jsxs(P.div,{className:"max-w-6xl mx-auto px-2 sm:px-6 py-10 space-y-6",variants:Zt,initial:"hidden",animate:"visible",children:[i.jsx(P.div,{variants:k,className:"glass-card rounded-2xl p-8 no-print",children:i.jsx("div",{className:"flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4",children:i.jsxs("div",{className:"flex items-center gap-4",children:[i.jsx("div",{className:"p-3 gradient-primary rounded-xl text-white shadow-lg shadow-violet-500/25",children:i.jsx(Oe,{className:"w-7 h-7"})}),i.jsxs("div",{children:[i.jsx("h1",{className:"text-2xl lg:text-3xl font-bold text-gradient-primary",children:"Preview แบบประเมิน"}),i.jsx("p",{className:"text-gray-500 dark:text-gray-400 mt-1",children:e.title})]})]})})}),i.jsx(P.div,{variants:k,className:"grid grid-cols-2 md:grid-cols-4 gap-4 no-print",children:o.map(r=>i.jsx("div",{className:"glass-card rounded-2xl p-5",children:i.jsxs("div",{className:"flex items-center gap-3",children:[i.jsx("div",{className:A("p-2 rounded-xl",r.color),children:i.jsx(r.icon,{className:"w-5 h-5"})}),i.jsxs("div",{children:[i.jsx("div",{className:"text-2xl font-bold text-gray-900 dark:text-white",children:r.value}),i.jsx("div",{className:"text-xs text-gray-500 dark:text-gray-400",children:r.label})]})]})},r.label))}),i.jsxs("div",{className:"print-area",children:[i.jsxs("div",{className:"print-document-header",children:[i.jsx("div",{className:"print-main-title",children:"รายงานแบบประเมิน 360 องศา"}),i.jsx("div",{className:"print-subtitle",children:e.title})]}),i.jsxs("div",{className:"print-document-info",children:[i.jsxs("div",{className:"print-summary",children:[i.jsx("strong",{children:"สรุปเอกสาร:"})," ",e.parts.length," ส่วน | ",e.aspects_count," ด้าน | ",e.subaspects_count," หัวข้อย่อย | ",e.questions_count," คำถาม | ",e.options_count," ตัวเลือก"]}),i.jsxs("div",{className:"print-date",children:["วันที่พิมพ์: ",new Date().toLocaleDateString("th-TH",{year:"numeric",month:"long",day:"numeric"})]})]}),i.jsxs("div",{className:"print-toc",children:[i.jsx("div",{className:"print-toc-title",children:"สารบัญ"}),e.parts.map((r,c)=>i.jsxs("div",{className:"print-toc-item",children:[i.jsxs("span",{children:["ส่วนที่ ",c+1,": ",r.title]}),i.jsxs("span",{children:[r.aspects.length," ด้าน"]})]},r.id))]}),e.parts.map((r,c)=>i.jsx(P.div,{variants:k,className:"print-card",children:i.jsxs("div",{className:"glass-card rounded-2xl overflow-hidden no-print",children:[i.jsx("div",{className:"gradient-primary p-5",children:i.jsxs("h2",{className:"text-lg font-semibold text-white flex items-center gap-2",children:[i.jsx(Te,{className:"w-5 h-5"}),"Part ",c+1,": ",r.title]})}),i.jsx("div",{className:"p-6",children:i.jsx(Kt,{type:"multiple",className:"w-full",children:r.aspects.map(a=>{var d;return i.jsxs(Gt,{value:`aspect-${a.id}`,children:[i.jsx(Qt,{className:"text-gray-800 dark:text-gray-200 hover:text-violet-600 dark:hover:text-violet-400",children:String(a.title??"").trim()!==""?a.title:i.jsx("span",{className:"text-muted-foreground italic",children:"*ไม่มีชื่อด้าน*"})}),i.jsx(Ht,{children:a.has_subaspects&&((d=a.subaspects)!=null&&d.length)?i.jsx("div",{className:"space-y-4 mt-2",children:a.subaspects.map(u=>i.jsxs("div",{children:[i.jsx("h4",{className:"text-base font-medium text-violet-700 dark:text-violet-300",children:String(u.title??"").trim()!==""?u.title:i.jsx("span",{className:"text-muted-foreground italic",children:"*ไม่มีชื่อหัวข้อย่อย*"})}),oe(u.questions)]},u.id))}):oe(a.questions??[])})]},a.id)})})})]})},r.id)),i.jsx("div",{className:"print-only print-content",children:(()=>{let r=0;return i.jsx("div",{className:"print-continuous-content",children:e.parts.map((c,a)=>i.jsxs("div",{className:"print-part",children:[i.jsxs("div",{className:"print-part-header",children:["ส่วนที่ ",a+1,": ",c.title]}),i.jsx("div",{className:"print-part-content",children:c.aspects.map(d=>{var u;return i.jsxs("div",{className:"print-aspect",children:[i.jsx("div",{className:"print-aspect-title",children:String(d.title??"").trim()!==""?d.title:"ไม่มีชื่อด้าน"}),d.has_subaspects&&((u=d.subaspects)!=null&&u.length)?i.jsx(i.Fragment,{children:d.subaspects.map(m=>i.jsxs("div",{className:"print-subaspect",children:[i.jsx("div",{className:"print-subaspect-title",children:String(m.title??"").trim()!==""?m.title:"ไม่มีชื่อหัวข้อย่อย"}),m.questions.map(p=>(r++,i.jsxs("div",{className:"print-question",children:[i.jsxs("div",{className:"print-question-line",children:[i.jsxs("span",{className:"print-question-number",children:[r,"."]}),i.jsx("span",{className:"print-question-title",children:p.title})]}),i.jsx("div",{className:"print-options",children:p.options.map((f,x)=>i.jsxs("span",{className:"print-option",children:[i.jsx("span",{className:"print-option-text",children:f.label}),i.jsx("span",{className:"print-option-score",children:f.score}),x<p.options.length-1?" | ":""]},f.id))})]},p.id)))]},m.id))}):i.jsx(i.Fragment,{children:(d.questions??[]).map(m=>(r++,i.jsxs("div",{className:"print-question",children:[i.jsxs("div",{className:"print-question-line",children:[i.jsxs("span",{className:"print-question-number",children:[r,"."]}),i.jsx("span",{className:"print-question-title",children:m.title})]}),i.jsx("div",{className:"print-options",children:m.options.map((p,f)=>i.jsxs("span",{className:"print-option",children:[i.jsx("span",{className:"print-option-text",children:p.label}),i.jsx("span",{className:"print-option-score",children:p.score}),f<m.options.length-1?" | ":""]},p.id))})]},m.id)))})]},d.id)})})]},c.id))})})()}),i.jsx("div",{className:"print-footer",children:i.jsxs("div",{children:["รายงานแบบประเมิน 360 องศา | สร้างโดยระบบประเมินการปฏิบัติงาน | หน้า ",i.jsx("span",{className:"print-page-number"})]})})]}),i.jsxs(P.div,{variants:k,className:"flex flex-col sm:flex-row justify-end gap-3 no-print",children:[i.jsxs("button",{onClick:s,className:A("inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200","bg-violet-100 hover:bg-violet-200 text-violet-700 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 dark:text-violet-300","border border-violet-200 dark:border-violet-700"),children:[i.jsx(De,{className:"w-4 h-4"}),"พิมพ์รายงานแบบประเมิน"]}),i.jsxs("button",{onClick:t,className:A("inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200","bg-white/80 hover:bg-gray-50 text-gray-700 border border-gray-200","dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-700"),children:[i.jsx(Le,{className:"w-4 h-4"}),"แก้ไขแบบประเมิน"]}),i.jsxs("button",{onClick:n,className:A("inline-flex items-center gap-2 px-6 py-2.5 gradient-primary text-white rounded-xl font-medium","hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200"),children:[i.jsx(Ve,{className:"w-4 h-4"}),"เผยแพร่"]})]})]})})})}export{vn as default};
