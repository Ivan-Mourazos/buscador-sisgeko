const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// Agregar request.input de resumen_edicion si falta en insights
const tituloPattern = /request\.input\('titulo', sql\.NVarChar, data\.titulo \|\| null\);/g;
let match;
let offset = 0;
while ((match = tituloPattern.exec(content)) !== null) {
    const endOfLine = match.index + match[0].length;
    const nextText = content.substring(endOfLine, endOfLine + 100);
    if (!nextText.includes('resumen_edicion')) {
        const indent = match[0].match(/^\s*/)[0]; // No funciona bien con el regex global
        // Buscamos la indentación de la línea actual
        const lineStart = content.lastIndexOf('\n', match.index) + 1;
        const indentStr = content.substring(lineStart, match.index);
        
        const insertion = `\n${indentStr}request.input('resumen_edicion', sql.NVarChar, data.resumen_edicion || null);`;
        content = content.slice(0, endOfLine) + insertion + content.slice(endOfLine);
        tituloPattern.lastIndex += insertion.length;
    }
}

fs.writeFileSync(filePath, content);
console.log('Server.js actualizado con resumen_edicion en insights');
