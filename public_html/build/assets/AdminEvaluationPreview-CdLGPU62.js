import{j as e,m as x,t as f}from"./ui-Clb-VuZG.js";import{M as _}from"./MainLayout-CZ1VjXpo.js";import{K as S,S as v}from"./inertia-Du3s-lXJ.js";import{B as C}from"./breadcrumb-DuhDDlMr.js";import{c as g}from"./utils-BFJEpFkg.js";import{L as P}from"./layers-mV3AuAAh.js";import{C as z}from"./chart-column-vX-MBY-A.js";import{F as T}from"./file-text-ClNQIReL.js";import{C as E}from"./circle-help-CFXxnYMo.js";import{E as L}from"./eye-C3-PG9fH.js";import{P as A}from"./printer-BkYLEwRX.js";import{A as F}from"./arrow-left-Du4paA9j.js";import{S as H}from"./send-DsATIUyF.js";import"./vendor-BkfY9j8H.js";import"./useDarkMode-o_jE3Yk4.js";import"./createLucideIcon-BzbnJQMW.js";import"./chevron-down-N8uSCGUh.js";import"./log-out-D8Dhth9A.js";import"./x-1MPlkpfU.js";const B={hidden:{opacity:0},visible:{opacity:1,transition:{staggerChildren:.08}}},u={hidden:{opacity:0,y:20},visible:{opacity:1,y:0,transition:{duration:.4}}},j=[{label:"ดีเยี่ยม",score:5},{label:"ดีมาก",score:4},{label:"ดี",score:3},{label:"ต้องปรับปรุง",score:2},{label:"ต้องปรับปรุงอย่างมาก",score:1}];function y({type:s}){const h={rating:{label:"Rating 1-5",color:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"},choice:{label:"ตัวเลือก",color:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"},multiple_choice:{label:"เลือกหลายข้อ",color:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"},open_text:{label:"ข้อความเปิด",color:"bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"}},b=h[s??"rating"]??h.rating;return e.jsx("span",{className:g("ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium",b.color),children:b.label})}function ie(){const{evaluation:s}=S().props,h=()=>{v.visit(route("evaluations.edit",{evaluation:s.id}))},b=()=>{confirm("ยืนยันเผยแพร่แบบประเมินนี้หรือไม่?")&&v.patch(route("evaluations.publish",{evaluation:s.id}),{},{onSuccess:()=>{f.success("เผยแพร่แบบประเมินเรียบร้อยแล้ว"),v.visit(route("evaluations.index"))},onError:()=>{f.error("ไม่สามารถเผยแพร่แบบประเมินได้")}})},N=()=>{const t=`
            @page {
                size: A4;
                margin: 15mm;
            }

            @media print {
                html, body {
                    font-family: 'Sarabun', sans-serif !important;
                    font-size: 13px !important;
                    line-height: 1.6 !important;
                    color: #000 !important;
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    overflow: visible !important;
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }

                /* Hide screen-only elements */
                .no-print {
                    display: none !important;
                }

                /* Show print-only elements */
                .print-only-element {
                    display: block !important;
                }

                /* Print area takes full page */
                .print-area {
                    position: static !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                /* Document Header */
                .print-document-header {
                    text-align: center;
                    border-bottom: 3px double #000;
                    padding-bottom: 12px;
                    margin-bottom: 20px;
                    page-break-after: avoid;
                }
                .print-main-title {
                    font-size: 22px;
                    font-weight: bold;
                    color: #000 !important;
                    margin-bottom: 6px;
                }
                .print-subtitle {
                    font-size: 18px;
                    color: #000 !important;
                }

                /* Document Info */
                .print-document-info {
                    border: 1px solid #000;
                    padding: 10px 15px;
                    margin-bottom: 20px;
                    font-size: 12px;
                    page-break-after: avoid;
                }
                .print-summary { color: #000 !important; font-weight: bold; }
                .print-date { color: #000 !important; text-align: right; font-size: 11px; margin-top: 5px; }

                /* TOC hidden */
                .print-toc { display: none !important; }

                /* Content flows naturally */
                .print-continuous-content {
                    width: 100%;
                    overflow: visible;
                }

                /* Part - allow page break inside (important for large parts!) */
                .print-part {
                    margin-bottom: 15px;
                    page-break-inside: auto;
                }
                .print-part-header {
                    color: #000 !important;
                    font-size: 16px;
                    font-weight: bold;
                    text-align: center;
                    margin: 15px 0 10px;
                    padding: 8px 0;
                    border-top: 2px solid #000;
                    border-bottom: 2px solid #000;
                    page-break-after: avoid;
                }

                /* Aspect */
                .print-aspect {
                    margin: 10px 0;
                    page-break-inside: auto;
                }
                .print-aspect-title {
                    font-size: 14px;
                    font-weight: bold;
                    color: #000 !important;
                    margin: 8px 0 5px;
                    text-decoration: underline;
                    page-break-after: avoid;
                }

                /* Sub-aspect */
                .print-subaspect {
                    margin: 8px 0 8px 10px;
                    page-break-inside: auto;
                }
                .print-subaspect-title {
                    font-size: 13px;
                    font-weight: bold;
                    font-style: italic;
                    color: #000 !important;
                    margin: 6px 0 4px;
                    padding-bottom: 2px;
                    border-bottom: 1px solid #666;
                    page-break-after: avoid;
                }

                /* Question - avoid break inside each question */
                .print-question {
                    margin: 5px 0 8px 5px;
                    page-break-inside: avoid;
                }
                .print-question-line {
                    margin-bottom: 3px;
                    line-height: 1.5;
                }
                .print-question-number {
                    font-weight: bold;
                    color: #000 !important;
                    margin-right: 8px;
                    display: inline-block;
                    min-width: 25px;
                }
                .print-question-title {
                    color: #000 !important;
                    display: inline;
                }

                /* Options inline */
                .print-options {
                    margin: 3px 0 6px 25px;
                    font-size: 11px;
                    color: #000 !important;
                }
                .print-option {
                    display: inline-block;
                    margin-right: 10px;
                    color: #000 !important;
                }
                .print-option-score {
                    font-weight: bold;
                }
                .print-option-score:before { content: " ("; font-weight: normal; }
                .print-option-score:after { content: ")"; font-weight: normal; }

                /* Footer */
                .print-footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 10px;
                    color: #666 !important;
                    border-top: 1px solid #ccc;
                    padding-top: 5px;
                }
            }
        `,a=document.getElementById("print-styles");a&&a.remove();const d=document.createElement("style");d.id="print-styles",d.type="text/css",d.innerHTML=t,document.head.appendChild(d),setTimeout(()=>{window.print()},100)},k=[{label:"Part",value:s.parts.length,icon:P,color:"bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"},{label:"ด้าน",value:s.aspects_count,icon:z,color:"bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300"},{label:"หัวข้อย่อย",value:s.subaspects_count,icon:T,color:"bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"},{label:"คำถาม",value:s.questions_count,icon:E,color:"bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"}];return e.jsxs(_,{title:"Preview แบบประเมิน",breadcrumb:e.jsx(C,{items:[{label:"แดชบอร์ดผู้ดูแลระบบ",href:route("admindashboard")},{label:"รายการแบบประเมิน",href:route("evaluations.index")},{label:"Preview แบบประเมิน",active:!0}]}),children:[e.jsx("style",{dangerouslySetInnerHTML:{__html:".print-only-element { display: none !important; } @media print { .print-only-element { display: block !important; } }"}}),e.jsx("div",{className:"gradient-primary-soft min-h-screen -my-6 px-4 sm:px-6 lg:px-8 py-6",children:e.jsxs(x.div,{className:"max-w-6xl mx-auto px-2 sm:px-6 py-10 space-y-6",variants:B,initial:"hidden",animate:"visible",children:[e.jsx(x.div,{variants:u,className:"glass-card rounded-2xl p-8 no-print",children:e.jsx("div",{className:"flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4",children:e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"p-3 gradient-primary rounded-xl text-white shadow-lg shadow-violet-500/25",children:e.jsx(L,{className:"w-7 h-7"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl lg:text-3xl font-bold text-gradient-primary",children:"Preview แบบประเมิน"}),e.jsx("p",{className:"text-gray-500 dark:text-gray-400 mt-1",children:s.title})]})]})})}),e.jsx(x.div,{variants:u,className:"grid grid-cols-2 md:grid-cols-4 gap-4 no-print",children:k.map(t=>e.jsx("div",{className:"glass-card rounded-2xl p-5",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:g("p-2 rounded-xl",t.color),children:e.jsx(t.icon,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-2xl font-bold text-gray-900 dark:text-white",children:t.value}),e.jsx("div",{className:"text-xs text-gray-500 dark:text-gray-400",children:t.label})]})]})},t.label))}),e.jsxs("div",{className:"print-area",children:[e.jsxs("div",{className:"print-document-header print-only-element",children:[e.jsx("div",{className:"print-main-title",children:"รายงานแบบประเมิน 360 องศา"}),e.jsx("div",{className:"print-subtitle",children:s.title})]}),e.jsxs("div",{className:"print-document-info print-only-element",children:[e.jsxs("div",{className:"print-summary",children:[e.jsx("strong",{children:"สรุปเอกสาร:"})," ",s.parts.length," ส่วน | ",s.aspects_count," ด้าน | ",s.subaspects_count," หัวข้อย่อย | ",s.questions_count," คำถาม | ",s.options_count," ตัวเลือก"]}),e.jsxs("div",{className:"print-date",children:["วันที่พิมพ์: ",new Date().toLocaleDateString("th-TH",{year:"numeric",month:"long",day:"numeric"})]})]}),e.jsxs("div",{className:"print-toc print-only-element",children:[e.jsx("div",{className:"print-toc-title",children:"สารบัญ"}),s.parts.map((t,a)=>e.jsxs("div",{className:"print-toc-item",children:[e.jsxs("span",{children:["ส่วนที่ ",a+1,": ",t.title]}),e.jsxs("span",{children:[t.aspects.length," ด้าน"]})]},t.id))]}),(()=>{let t=0;return s.parts.map((a,d)=>e.jsx(x.div,{variants:u,children:e.jsxs("div",{className:"glass-card rounded-2xl overflow-hidden no-print mb-6",children:[e.jsx("div",{className:"gradient-primary p-5",children:e.jsxs("h2",{className:"text-lg font-bold text-white flex items-center gap-3",children:[e.jsx("div",{className:"w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold",children:d+1}),e.jsxs("div",{children:[e.jsx("span",{children:a.title}),e.jsxs("p",{className:"text-sm text-white/70 font-normal mt-0.5",children:[a.aspects.length," ด้าน | ",a.aspects.reduce((r,c)=>{var n,l;return r+(((n=c.questions)==null?void 0:n.length)||0)+(((l=c.subaspects)==null?void 0:l.reduce((i,o)=>i+o.questions.length,0))||0)},0)," คำถาม"]})]})]})}),e.jsx("div",{className:"p-6 space-y-6",children:a.aspects.map((r,c)=>{var n,l;return e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-3 mb-4",children:[e.jsx("div",{className:"w-1.5 h-8 rounded-full bg-violet-500"}),e.jsx("div",{children:e.jsxs("h3",{className:"text-base font-bold text-gray-900 dark:text-white",children:["ด้านที่ ",c+1,": ",String(r.title??"").trim()!==""?r.title:e.jsx("span",{className:"text-muted-foreground italic",children:"ไม่มีชื่อด้าน"})]})})]}),r.has_subaspects&&((n=r.subaspects)!=null&&n.length||(l=r.sub_aspects)!=null&&l.length)?e.jsx("div",{className:"space-y-5 ml-4",children:(r.subaspects??r.sub_aspects??[]).map(i=>e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx("div",{className:"w-1 h-5 rounded-full bg-fuchsia-400"}),e.jsx("h4",{className:"text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-300",children:String(i.title??"").trim()!==""?i.title:e.jsx("span",{className:"italic opacity-60",children:"ไม่มีชื่อหัวข้อย่อย"})}),e.jsxs("span",{className:"text-xs text-gray-400",children:["(",(i.questions??[]).length," ข้อ)"]})]}),e.jsx("div",{className:"space-y-3 ml-3",children:(i.questions??[]).map(o=>{t++;const p=(o.options??[]).length>0?o.options:o.type==="rating"?j.map((m,w)=>({...m,id:-w})):[];return e.jsx("div",{className:"bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("span",{className:"w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold flex-shrink-0",children:t}),e.jsxs("div",{className:"flex-1",children:[e.jsxs("p",{className:"text-sm font-medium text-gray-800 dark:text-gray-200",children:[o.title,e.jsx(y,{type:o.type})]}),o.type==="open_text"?e.jsx("div",{className:"mt-2 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-400",children:"พื้นที่สำหรับพิมพ์ข้อความ..."}):e.jsx("div",{className:"flex flex-wrap gap-2 mt-2",children:p.map(m=>e.jsxs("span",{className:"inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800",children:[m.label," ",e.jsxs("span",{className:"font-bold",children:["(",m.score,")"]})]},m.id))})]})]})},o.id)})})]},i.id))}):e.jsx("div",{className:"space-y-3 ml-4",children:(r.questions??[]).map(i=>{t++;const o=(i.options??[]).length>0?i.options:i.type==="rating"?j.map((p,m)=>({...p,id:-m})):[];return e.jsx("div",{className:"bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("span",{className:"w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold flex-shrink-0",children:t}),e.jsxs("div",{className:"flex-1",children:[e.jsxs("p",{className:"text-sm font-medium text-gray-800 dark:text-gray-200",children:[i.title,e.jsx(y,{type:i.type})]}),i.type==="open_text"?e.jsx("div",{className:"mt-2 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-400",children:"พื้นที่สำหรับพิมพ์ข้อความ..."}):e.jsx("div",{className:"flex flex-wrap gap-2 mt-2",children:o.map(p=>e.jsxs("span",{className:"inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800",children:[p.label," ",e.jsxs("span",{className:"font-bold",children:["(",p.score,")"]})]},p.id))})]})]})},i.id)})}),c<a.aspects.length-1&&e.jsx("hr",{className:"my-6 border-gray-200 dark:border-gray-700"})]},r.id)})})]})},a.id))})(),e.jsx("div",{className:"print-only print-content print-only-element",children:(()=>{let t=0;return e.jsx("div",{className:"print-continuous-content",children:s.parts.map((a,d)=>e.jsxs("div",{className:"print-part",children:[e.jsxs("div",{className:"print-part-header",children:["ส่วนที่ ",d+1,": ",a.title]}),e.jsx("div",{className:"print-part-content",children:a.aspects.map(r=>{var c;return e.jsxs("div",{className:"print-aspect",children:[e.jsx("div",{className:"print-aspect-title",children:String(r.title??"").trim()!==""?r.title:"ไม่มีชื่อด้าน"}),r.has_subaspects&&((c=r.subaspects)!=null&&c.length)?e.jsx(e.Fragment,{children:r.subaspects.map(n=>e.jsxs("div",{className:"print-subaspect",children:[e.jsx("div",{className:"print-subaspect-title",children:String(n.title??"").trim()!==""?n.title:"ไม่มีชื่อหัวข้อย่อย"}),n.questions.map(l=>(t++,e.jsxs("div",{className:"print-question",children:[e.jsxs("div",{className:"print-question-line",children:[e.jsxs("span",{className:"print-question-number",children:[t,"."]}),e.jsx("span",{className:"print-question-title",children:l.title})]}),e.jsx("div",{className:"print-options",children:l.options.map((i,o)=>e.jsxs("span",{className:"print-option",children:[e.jsx("span",{className:"print-option-text",children:i.label}),e.jsx("span",{className:"print-option-score",children:i.score}),o<l.options.length-1?" | ":""]},i.id))})]},l.id)))]},n.id))}):e.jsx(e.Fragment,{children:(r.questions??[]).map(n=>(t++,e.jsxs("div",{className:"print-question",children:[e.jsxs("div",{className:"print-question-line",children:[e.jsxs("span",{className:"print-question-number",children:[t,"."]}),e.jsx("span",{className:"print-question-title",children:n.title})]}),e.jsx("div",{className:"print-options",children:n.options.map((l,i)=>e.jsxs("span",{className:"print-option",children:[e.jsx("span",{className:"print-option-text",children:l.label}),e.jsx("span",{className:"print-option-score",children:l.score}),i<n.options.length-1?" | ":""]},l.id))})]},n.id)))})]},r.id)})})]},a.id))})})()}),e.jsx("div",{className:"print-footer print-only-element",children:e.jsxs("div",{children:["รายงานแบบประเมิน 360 องศา | สร้างโดยระบบประเมินการปฏิบัติงาน | หน้า ",e.jsx("span",{className:"print-page-number"})]})})]}),e.jsxs(x.div,{variants:u,className:"flex flex-col sm:flex-row justify-end gap-3 no-print",children:[e.jsxs("button",{onClick:N,className:g("inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200","bg-violet-100 hover:bg-violet-200 text-violet-700 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 dark:text-violet-300","border border-violet-200 dark:border-violet-700"),children:[e.jsx(A,{className:"w-4 h-4"}),"พิมพ์รายงานแบบประเมิน"]}),e.jsxs("button",{onClick:h,className:g("inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200","bg-white/80 hover:bg-gray-50 text-gray-700 border border-gray-200","dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-700"),children:[e.jsx(F,{className:"w-4 h-4"}),"แก้ไขแบบประเมิน"]}),e.jsxs("button",{onClick:b,className:g("inline-flex items-center gap-2 px-6 py-2.5 gradient-primary text-white rounded-xl font-medium","hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200"),children:[e.jsx(H,{className:"w-4 h-4"}),"เผยแพร่"]})]})]})})]})}export{ie as default};
