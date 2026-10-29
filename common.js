/* Funciones compartidas por todas las páginas (catálogo, ficha, carrito, cuenta, seguimiento). No necesitas editar este archivo. */
const $ = id => document.getElementById(id);
const clp = v => { const n = parseInt(String(v).replace(/\D/g,""),10); return n ? "$" + n.toLocaleString("es-CL") + " CLP" : ""; };
const num = v => parseInt(String(v||"").replace(/\D/g,""),10) || 0;
const slug = s => String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80);
const safeUrl = u => /^(https?:\/\/|[a-z0-9_\-\/\.]+$)/i.test(u||"") ? u : "";
const ORDEN = {"disponible":0,"últimas unidades":1,"agotado":2};

function el(tag, props, ...kids){
  const e = document.createElement(tag);
  for(const k in (props||{})){ if(k==="class") e.className=props[k]; else if(k==="text") e.textContent=props[k]; else if(k.startsWith("on")) e[k]=props[k]; else e.setAttribute(k,props[k]); }
  kids.flat().forEach(c=>{ if(c!=null) e.append(c.nodeType?c:document.createTextNode(c)); });
  return e;
}

/* ---------- CSV ---------- */
function parseCSV(t){
  const rows=[]; let r=[],c="",q=false;
  for(let i=0;i<t.length;i++){const ch=t[i];
    if(q){ if(ch=='"'&&t[i+1]=='"'){c+='"';i++} else if(ch=='"')q=false; else c+=ch }
    else if(ch=='"')q=true; else if(ch==","){r.push(c);c=""}
    else if(ch=="\n"){r.push(c);rows.push(r);r=[];c=""} else if(ch!="\r")c+=ch;
  }
  if(c||r.length){r.push(c);rows.push(r)}
  const h=rows.shift().map(x=>x.trim().toLowerCase());
  return rows.filter(x=>x.some(v=>v.trim())).map(x=>Object.fromEntries(h.map((k,i)=>[k,(x[i]||"").trim()])));
}

const EJEMPLO = [
  {categoria:"Mouses",nombre:"Scyrox V8 Super Light",descripcion:"36 g · PixArt 3950 · Compatible con 8K",precio:"",estado:"Disponible",foto:"",link_pago:""},
  {categoria:"Mouses",nombre:"ATK A9 Air Master Edition",descripcion:"48 g · PAW3950 Ultra · hasta 8K",precio:"",estado:"Últimas unidades",foto:"",link_pago:""},
  {categoria:"Mouses",nombre:"Attack Shark X11",descripcion:"Tri-modo con base magnética",precio:"",estado:"Disponible",foto:"",link_pago:""},
  {categoria:"Mouses",nombre:"ATK X1 Ultra Max 2.0",descripcion:"Inalámbrico · Dual 8K · Forma simétrica",precio:"",estado:"Disponible",foto:"",link_pago:""},
  {categoria:"Mouses",nombre:"ATK Ghost Ultimate 8K",descripcion:"PAW3950 Ultra · Dual 8K",precio:"113000",estado:"Disponible",foto:"",link_pago:""}
];

/* Columnas de la planilla: categoria, nombre, descripcion, precio, estado, foto, link_pago, fotos (opcional, varias separadas por |), caracteristicas (opcional) */
async function cargarProductos(){
  let rows;
  if(CONFIG.SHEET_CSV_URL){
    const r = await fetch(CONFIG.SHEET_CSV_URL); if(!r.ok) throw new Error("csv");
    rows = parseCSV(await r.text());
  } else rows = EJEMPLO;
  return rows.filter(p=>p.nombre).map(p=>{
    const fotos=[p.foto,...String(p.fotos||"").split("|")].map(s=>(s||"").trim()).filter(Boolean).map(safeUrl).filter(Boolean);
    return Object.assign({}, p, {
      id: slug(p.nombre), fotos: [...new Set(fotos)],
      caracteristicas: p.caracteristicas || p.descripcion || "",
      clave: String(p.clave||"").split(/\r?\n|\|/).map(x=>x.trim()).filter(Boolean),
      agotado: (p.estado||"").toLowerCase()==="agotado",
      link_pago: /^https:\/\//i.test(p.link_pago||"") ? p.link_pago : ""
    });
  }).sort((a,b)=>(ORDEN[(a.estado||"").toLowerCase()]??0)-(ORDEN[(b.estado||"").toLowerCase()]??0));
}

/* ---------- Carrito (se guarda solo en el navegador de la persona) ---------- */
function getCart(){ try{ const c=JSON.parse(localStorage.getItem("mr_cart")||"[]"); return Array.isArray(c)?c:[]; }catch(e){ return []; } }
function saveCart(c){ try{ localStorage.setItem("mr_cart",JSON.stringify(c)); }catch(e){} actualizarBadge(); }
function addToCart(p, qty){
  const c=getCart(), i=c.findIndex(x=>x.id===p.id);
  if(i>=0) c[i].qty=Math.min(10,c[i].qty+(qty||1));
  else c.push({id:p.id,nombre:p.nombre,precio:num(p.precio),qty:qty||1,foto:p.fotos&&p.fotos[0]||"",link_pago:p.link_pago||""});
  saveCart(c);
}
const cartCount = () => getCart().reduce((a,x)=>a+x.qty,0);
function actualizarBadge(){ document.querySelectorAll("[data-cart]").forEach(e=>{ const n=cartCount(); e.textContent=n?"Carrito ("+n+")":"Carrito"; }); }

/* ---------- Sesión ---------- */
function getSes(){ try{ return JSON.parse(localStorage.getItem("mr_ses")||"null"); }catch(e){ return null; } }
function setSes(s){ try{ localStorage.setItem("mr_ses",JSON.stringify(s)); }catch(e){} }
function clearSes(){ try{ localStorage.removeItem("mr_ses"); }catch(e){} }

/* ---------- Conexión con el Apps Script (pedidos, cuentas, seguimiento, reseñas) ---------- */
async function api(accion, datos){
  if(!CONFIG.ORDERS_URL) return {ok:false,error:"sin_backend"};
  try{
    const r = await fetch(CONFIG.ORDERS_URL,{method:"POST",body:JSON.stringify(Object.assign({accion},datos||{}))});
    return await r.json();
  }catch(e){ return {ok:false,error:"red"}; }
}
const ERRORES = {
  sin_backend:"Esta función estará disponible cuando se conecte el sistema de pedidos.",
  red:"No pudimos conectar. Revisa tu internet e intenta de nuevo.",
  datos:"Revisa los datos ingresados.", existe:"No se pudo crear la cuenta. Si ya tienes una, inicia sesión.",
  credenciales:"Correo o contraseña incorrectos.", bloqueado:"Demasiados intentos. Espera unos minutos e intenta de nuevo.",
  sesion:"Tu sesión expiró. Vuelve a iniciar sesión.", no_encontrado:"No encontramos un pedido con esos datos.",
  limite:"Has enviado muchas solicitudes. Intenta más tarde.", clave_corta:"La contraseña debe tener al menos 8 caracteres."
};
const msgError = j => ERRORES[(j&&j.error)||"red"] || "Ocurrió un error. Intenta de nuevo.";


/* ---------- RUT y costo de envío ---------- */
function limpiarRut(r){ return String(r||"").replace(/[^0-9kK]/g,"").toUpperCase(); }
function rutOk(r){
  const c=limpiarRut(r); if(c.length<7||c.length>9) return false;
  const cuerpo=c.slice(0,-1), dv=c.slice(-1); if(!/^\d+$/.test(cuerpo)) return false;
  let suma=0,m=2; for(let i=cuerpo.length-1;i>=0;i--){ suma+=(+cuerpo[i])*m; m=m===7?2:m+1; }
  const res=11-(suma%11), esp=res===11?"0":res===10?"K":String(res);
  return dv===esp;
}
function formatRut(r){ const c=limpiarRut(r); if(c.length<2) return c; return c.slice(0,-1).replace(/\B(?=(\d{3})+(?!\d))/g,".")+"-"+c.slice(-1); }
const COMUNAS = () => CONFIG.TARIFAS.flatMap(t=>t.comunas.map(c=>({comuna:c,precio:t.precio}))).sort((a,b)=>a.comuna.localeCompare(b.comuna,"es"));
function costoEnvio(comuna){
  if(comuna==="__otra") return CONFIG.OTRA_COMUNA;
  const x=COMUNAS().find(c=>c.comuna===comuna); return x?x.precio:null;
}

/* ---------- Cabecera y pie compartidos (páginas nuevas) ---------- */
function montarCabecera(){
  const s=getSes();
  const h=$("hdr"); if(!h) return;
  h.append(el("div",{class:"wrap"},
    el("a",{class:"brand",href:"index.html"},el("img",{src:"logo.jpg",alt:"Logo MyRaven, un cuervo en vuelo"}),"My Raven"),
    el("nav",{},
      el("a",{href:"index.html#catalogo"},"Catálogo"),
      el("a",{href:"seguimiento.html"},"Seguimiento"),
      el("a",{href:"cuenta.html"},s?("Hola, "+(s.nombre||"").split(" ")[0]):"Mi cuenta"),
      el("a",{href:"carrito.html","data-cart":""},"Carrito"))));
  actualizarBadge();
}
function montarPie(){
  const f=$("ftr"); if(!f) return;
  f.append(el("div",{class:"wrap pie"},
    el("span",{class:"brand-t"},"My Raven"),
    el("a",{href:"envios.html"},"Envíos"),
    el("a",{href:"privacidad.html"},"Política de privacidad"),
    el("a",{href:CONFIG.INSTAGRAM_DM,target:"_blank",rel:"noopener"},"Escríbenos por DM")),
    el("small",{},"© 2026 MyRaven. Todos los derechos reservados."));
}

/* ---------- Aviso breve ---------- */
function toast(msg, linkText, href){
  let t=$("toast"); if(!t){ t=el("div",{id:"toast",role:"status","aria-live":"polite"}); document.body.append(t); }
  t.replaceChildren(msg+" ", linkText?el("a",{href},linkText):"");
  t.classList.add("on"); clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove("on"),5000);
}
