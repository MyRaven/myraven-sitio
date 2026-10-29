/* ============ CONFIGURACIÓN: edita solo este bloque ============ */
const CONFIG = {
  // Link CSV de tu Google Sheet (Archivo > Compartir > Publicar en la web > CSV). Si queda vacío se usan los productos de ejemplo.
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKNXcGvAhRjQFlO34EvyLUXUIq0oHltROcH4XhsVwzaz6E-t9KoHbSs3Ej-SGxtFjX7nfQVogf6SEn/pub?gid=1082706229&single=true&output=csv",
  INSTAGRAM: "https://www.instagram.com/_myraven/",
  INSTAGRAM_DM: "https://ig.me/m/_myraven",   // abre el chat directo de Instagram
  ORDERS_URL: "https://script.google.com/macros/s/AKfycbw194ZyzfPiYCDf9-KGk1kQCTwA79py2S5Sf6L_aU8sMHQ7xXVUmvCgSgj9bl0jMA6afg/exec",                       // URL de tu Apps Script (pedidos, cuentas, seguimiento y reseñas)
  TRANSFERENCIA: "Titular: [NOMBRE]\nRUT: [RUT]\nBanco: [BANCO]\nTipo de cuenta: [TIPO]\nN° de cuenta: [NÚMERO]\nCorreo: [CORREO]",

  // Mercado Pago con monto fijo: el sistema crea el link con el total exacto del pedido (la persona no puede cambiarlo).
  // Déjalo en false hasta que guardes MP_TOKEN en el Apps Script (ver instrucciones en apps-script-pedidos.txt); luego pon true.
  MERCADOPAGO: true,

  // Retiro en el local
  LOCAL: "Merced 739, Local 21, Galería Andes (entre San Antonio y Mac Iver), Santiago Centro",

  // Entrega a domicilio: valor según la distancia desde el local (mínimo $5.000, máximo $7.500).
  // Si cambias algo aquí, cámbialo también en TARIFAS del Apps Script (el servidor vuelve a calcular el valor).
  TARIFAS: [
    {precio: 5000, comunas: ["Santiago","Independencia","Recoleta","Estación Central","Quinta Normal","Providencia","Ñuñoa","San Miguel","Conchalí","Pedro Aguirre Cerda"]},
    {precio: 6000, comunas: ["Renca","Huechuraba","Lo Prado","Cerro Navia","Macul","San Joaquín","La Cisterna","Lo Espejo","San Ramón","La Granja","Cerrillos","Vitacura","Las Condes","La Reina","Peñalolén","El Bosque"]},
    {precio: 7500, comunas: ["Maipú","Pudahuel","Quilicura","La Florida","Puente Alto","La Pintana","San Bernardo","Lo Barnechea","Padre Hurtado","Colina","Lampa"]}
  ],
  OTRA_COMUNA: 7500   // para cualquier otra comuna (te confirmamos el valor por WhatsApp)
};
/* ================================================================ */
