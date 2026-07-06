/* Componentes reutilizables que consumen el núcleo app */
const componentes = {
    tabla({ columnas = [], filas = [] }) {
        const encabezado = columnas.map((columna) => `<th>${columna.titulo}</th>`).join('');
        const cuerpo = filas.map((fila) => `
            <tr>
                ${columnas.map((columna) => `<td>${fila[columna.campo] ?? ''}</td>`).join('')}
            </tr>
        `).join('');

        return `
            <table>
                <thead><tr>${encabezado}</tr></thead>
                <tbody>${cuerpo || `<tr><td colspan="${columnas.length}">Sin registros todavía</td></tr>`}</tbody>
            </table>
        `;
    },

    campo({ label, name, value = '', type = 'text', min = '' }) {
        return `
            <label for="${name}">${label}</label>
            <input id="${name}" name="${name}" type="${type}" value="${value}" ${min !== '' ? `min="${min}"` : ''}>
        `;
    },

    select({ label, name, value = '', opciones = [] }) {
        return `
            <label for="${name}">${label}</label>
            <select id="${name}" name="${name}">
                ${opciones.map((opcion) => `<option value="${opcion}" ${opcion === value ? 'selected' : ''}>${opcion}</option>`).join('')}
            </select>
        `;
    },

    tarjeta(titulo, contenido) {
        return `
            <section class="card">
                <h3>${titulo}</h3>
                <div>${contenido}</div>
            </section>
        `;
    }
};

window.componentes = componentes;
