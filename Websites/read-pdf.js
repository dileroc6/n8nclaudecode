// Lee un PDF y muestra su texto
// Uso: node read-pdf.js <ruta-al-pdf>
const pdfParse = require("d:/Ferney Rojas/Proyectos/ToqueFlow/Websites/pdf-helper/node_modules/pdf-parse");
const fs = require("fs");

const pdfPath = process.argv[2];
if (!pdfPath) { console.error("Uso: node read-pdf.js <ruta-al-pdf>"); process.exit(1); }

pdfParse(fs.readFileSync(pdfPath)).then(data => {
  console.log(`=== Páginas: ${data.numpages} ===\n`);
  console.log(data.text);
}).catch(e => console.error("Error:", e.message));
