// Apps Script para el Google Sheet "Backup Recibos Rappi".
// Cómo instalarlo:
//   1. Abre el Sheet → menú Extensiones → Apps Script.
//   2. Borra lo que haya y pega ESTE código.
//   3. Cambia TOKEN por un texto secreto tuyo (el mismo que pondrás en Supabase).
//   4. Implementar → Nueva implementación → tipo "Aplicación web":
//        - Ejecutar como: Yo
//        - Quién tiene acceso: Cualquier persona
//      Implementar → autoriza con tu cuenta → copia la URL (termina en /exec).
//   5. En Supabase (Edge Functions → Secrets) agrega:
//        RAPPI_SHEET_WEBHOOK = esa URL
//        RAPPI_SHEET_TOKEN   = el mismo TOKEN de abajo

const TOKEN = 'CAMBIA-ESTE-TOKEN';

const HEADERS = ['FECHA HORA', 'ID ORDEN', 'REF', 'CLIENTE', 'CEDULA', 'ITEMS', 'SUBTOTAL', 'DESCUENTO', 'TOTAL', 'TIPO'];

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.token !== TOKEN) return ContentService.createTextOutput('forbidden');

    const ss = SpreadsheetApp.openById('10GcC_7PMSiJnmfPEXfLw6-TbExZW7r7I1tlof_0eXKY');
    // Pestaña por sede (ej. "Medellin"); si no llega tab, usa Sheet1.
    const tab = (b.tab || 'Sheet1').toString();
    let sh = ss.getSheetByName(tab);
    if (!sh) sh = ss.insertSheet(tab);
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS); // encabezados en pestaña nueva

    const fecha = Utilities.formatDate(new Date(), 'America/Bogota', 'dd/MM/yy HH:mm:ss');
    const ref = String(b.order_id || '').slice(-4);
    const items = (b.items || []).map(function (it) {
      return it.qty + 'x ' + it.name + ' $' + Number(it.price).toLocaleString('es-CO');
    }).join('; ');

    sh.appendRow([fecha, b.order_id || '', ref, b.customer_name || '', b.customer_cedula || '',
      items, b.subtotal || '', b.discount || '', b.total || '', b.tipo || '']);

    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('err: ' + err);
  }
}
