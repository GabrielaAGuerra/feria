/* Núcleo ERP para Gestión de Ferias */
const app = {
    storageKey: 'gestionFeriasERP',

    configDefault: {
        tema: 'oscuro',
        feriaActual: 'EUCA',
        puestosPorModulo: 5,
        cantidadModulos: 12,
        moneda: 'ARS'
    },

    catalogosDefault: {
        rubros: ['Gráfica', 'Crochet', 'Bijou', 'Velas', 'Plantas'],
        estadosInscripcion: ['Pendiente', 'Confirmada', 'Cancelada'],
        tiposMovimiento: ['Ingreso', 'Egreso']
    },

    dbDefault: {
        emprendedores: [
            { id: 'EMP-1', nombre: 'LlenaloDstickers', emprendimiento: 'LlenaloDstickers', rubro: 'Gráfica', subrubro: 'Stickers', instagram: '@llenalodstickers', whatsapp: '11 5555-0101', email: 'hola@llenalodstickers.com', electricidad: 'No', stand: '2x2', observaciones: 'Prefiere esquina', asistencia: 2, puntualidad: 95, pago: 'Confirmado' },
            { id: 'EMP-2', nombre: 'Verde Vivo', emprendimiento: 'Verde Vivo', rubro: 'Plantas', subrubro: 'Suculentas', instagram: '@verdevivo', whatsapp: '11 5555-0202', email: 'ventas@verdevivo.com', electricidad: 'Sí', stand: '3x2', observaciones: 'Necesita sombra', asistencia: 1, puntualidad: 88, pago: 'Pendiente' }
        ],
        ferias: [
            { id: 'FER-EUCA-JUL', nombre: 'EUCA', fecha: '2026-07-10', horario: '13:30 a 18:30', lugar: 'Bosques de Eucalipto', color: 'verde', estado: 'Convocatoria abierta', puestos: 60, notas: 'Revisar clima el día anterior' },
            { id: 'FER-PLATE-JUL', nombre: 'PLATE', fecha: '2026-07-24', horario: '14:00 a 19:00', lugar: 'Plaza Plate', color: 'violeta', estado: 'En planificación', puestos: 45, notas: 'Confirmar sonido' }
        ],
        inscripciones: [
            { id: 'INS-1', emprendedorId: 'EMP-1', feria: 'EUCA', fecha: '2026-07-10', puesto: 7, estadoPago: 'Confirmado', asistencia: 'Presente' },
            { id: 'INS-2', emprendedorId: 'EMP-1', feria: 'PLATE', fecha: '2026-07-24', puesto: 12, estadoPago: 'Pendiente', asistencia: 'Pendiente' },
            { id: 'INS-3', emprendedorId: 'EMP-2', feria: 'EUCA', fecha: '2026-07-10', puesto: 8, estadoPago: 'Pendiente', asistencia: 'Pendiente' }
        ],
        movimientos: [
            { id: 'MOV-1', fecha: '2026-07-01', concepto: 'Reserva puesto EUCA', feria: 'EUCA', tipo: 'Ingreso', medio: 'Mercado Pago', monto: 15000 },
            { id: 'MOV-2', fecha: '2026-07-02', concepto: 'Bolsas', feria: 'EUCA', tipo: 'Gasto', medio: 'Efectivo', monto: 3500 }
        ],
        puestos: [
            { numero: 7, modulo: 'B', estado: 'Confirmado', emprendedorId: 'EMP-1' },
            { numero: 8, modulo: 'B', estado: 'Pago pendiente', emprendedorId: 'EMP-2' },
            { numero: 12, modulo: 'C', estado: 'Reservado', emprendedorId: 'EMP-1' }
        ],
        agenda: [
            { id: 'AGE-1', hora: '09:00', tarea: 'Comprar bolsas', realizada: false },
            { id: 'AGE-2', hora: '11:00', tarea: 'Preparar stickers', realizada: false },
            { id: 'AGE-3', hora: '12:30', tarea: 'Cargar auto', realizada: false },
            { id: 'AGE-4', hora: '13:30', tarea: 'Llegar', realizada: false },
            { id: 'AGE-5', hora: '14:00', tarea: 'Armar stand', realizada: false },
            { id: 'AGE-6', hora: '17:30', tarea: 'Sorteo', realizada: false },
            { id: 'AGE-7', hora: '18:30', tarea: 'Desarmar', realizada: false }
        ],
        publicaciones: [
            { id: 'PUB-1', titulo: 'Convocatoria', hecha: false },
            { id: 'PUB-2', titulo: 'Recordatorio', hecha: false },
            { id: 'PUB-3', titulo: 'Mapa', hecha: false },
            { id: 'PUB-4', titulo: 'Clima', hecha: false },
            { id: 'PUB-5', titulo: 'Historias', hecha: false },
            { id: 'PUB-6', titulo: 'Reel', hecha: false },
            { id: 'PUB-7', titulo: 'Post del día', hecha: false }
        ],
        configuracion: {},
        catalogos: {}
    },

    db: {},
    config: {},
    catalogos: {},

    iniciar() {
        this.cargar();
        this.conectarEventosGlobales();
        this.actualizarFeriaActiva();
        this.actualizarResumen();
    },

    cargar() {
        const guardado = localStorage.getItem(this.storageKey);
        const datos = guardado ? JSON.parse(guardado) : {};

        this.config = { ...this.configDefault, ...(datos.config || datos.db?.configuracion || {}) };
        this.catalogos = this.combinarCatalogos(datos.catalogos || datos.db?.catalogos || {});
        this.db = {
            ...this.clonar(this.dbDefault),
            ...(datos.db || {}),
            configuracion: this.config,
            catalogos: this.catalogos
        };

        return this.db;
    },

    guardar() {
        this.db.configuracion = this.config;
        this.db.catalogos = this.catalogos;

        localStorage.setItem(this.storageKey, JSON.stringify({
            db: this.db,
            config: this.config,
            catalogos: this.catalogos,
            actualizado: new Date().toISOString()
        }));

        this.actualizarResumen();
        return true;
    },

    nuevoID(prefijo = 'ID') {
        return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    },

    buscar(coleccion, criterio = '') {
        const registros = this.db[coleccion] || [];
        const texto = String(criterio).toLowerCase().trim();

        if (!texto) return registros;

        return registros.filter((registro) =>
            Object.values(registro).some((valor) =>
                String(valor).toLowerCase().includes(texto)
            )
        );
    },

    notificar(mensaje, tipo = 'exito') {
        this.toast(mensaje, tipo);
    },

    toast(mensaje, tipo = 'exito') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = mensaje;
        toast.className = tipo;
        toast.style.display = 'block';

        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.style.display = 'none';
        }, 2600);
    },

    modal(contenidoHTML) {
        const modal = document.getElementById('modal');
        const modalContenido = document.getElementById('modalContenido');
        if (!modal || !modalContenido) return;

        modalContenido.innerHTML = contenidoHTML;
        modal.style.display = 'flex';
    },

    cerrarModal() {
        const modal = document.getElementById('modal');
        if (modal) modal.style.display = 'none';
    },

    backup() {
        const datos = JSON.stringify({ db: this.db, config: this.config, catalogos: this.catalogos }, null, 2);
        const archivo = new Blob([datos], { type: 'application/json' });
        const url = URL.createObjectURL(archivo);
        const link = document.createElement('a');

        link.href = url;
        link.download = `backup-feria-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.toast('Backup exportado correctamente');
    },

    exportarBackup() {
        this.backup();
    },

    restaurar(datos) {
        const restaurado = typeof datos === 'string' ? JSON.parse(datos) : datos;
        this.db = { ...this.clonar(this.dbDefault), ...(restaurado.db || restaurado) };
        this.config = { ...this.configDefault, ...(restaurado.config || this.db.configuracion || {}) };
        this.catalogos = this.combinarCatalogos(restaurado.catalogos || this.db.catalogos || {});
        this.guardar();
        this.toast('Backup restaurado correctamente');
    },

    actualizarConfig(clave, valor) {
        this.config[clave] = valor;
        this.db.configuracion = this.config;
        this.guardar();
    },

    agregarCatalogo(nombreCatalogo, valor) {
        const valorLimpio = String(valor).trim();
        if (!valorLimpio) return false;

        this.catalogos[nombreCatalogo] ||= [];
        if (!this.catalogos[nombreCatalogo].includes(valorLimpio)) {
            this.catalogos[nombreCatalogo].push(valorLimpio);
            this.guardar();
            return true;
        }

        return false;
    },

    puestosTotales() {
        return Number(this.config.puestosPorModulo) * Number(this.config.cantidadModulos);
    },

    actualizarResumen() {
        this.escribirTexto('statEmprendedores', this.db.emprendedores?.length || 0);
        this.escribirTexto('statPuestos', `${this.db.puestos?.length || 0} / ${this.puestosTotales()}`);
        this.escribirTexto('statCaja', this.formatearMoneda(this.totalCaja()));
        this.escribirTexto('statProxima', this.proximaFeria()?.nombre || '--');
    },

    totalCaja() {
        return (this.db.movimientos || []).reduce((total, mov) => {
            const importe = Number(mov.importe ?? mov.monto) || 0;
            return ['Egreso', 'Gasto'].includes(mov.tipo) ? total - importe : total + importe;
        }, 0);
    },

    proximaFeria() {
        const hoy = new Date().toISOString().slice(0, 10);
        return (this.db.ferias || [])
            .filter((feria) => feria.fecha >= hoy)
            .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
    },

    formatearMoneda(valor) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: this.config.moneda || 'ARS',
            maximumFractionDigits: 0
        }).format(valor || 0);
    },

    actualizarFeriaActiva() {
        const selector = document.getElementById('feriaSeleccionada');
        if (!selector) return;

        selector.value = this.config.feriaActual;
        selector.addEventListener('change', (evento) => {
            this.actualizarConfig('feriaActual', evento.target.value);
            this.toast(`Feria activa: ${evento.target.value}`);
        });
    },

    conectarEventosGlobales() {
        document.getElementById('modal')?.addEventListener('click', (evento) => {
            if (evento.target.id === 'modal') this.cerrarModal();
        });
    },

    escribirTexto(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = valor;
    },

    combinarCatalogos(catalogos) {
        return Object.keys(this.catalogosDefault).reduce((final, clave) => {
            final[clave] = [...new Set([...(this.catalogosDefault[clave] || []), ...(catalogos[clave] || [])])];
            return final;
        }, { ...catalogos });
    },


    agregarRegistro(coleccion, registro) {
        this.db[coleccion] ||= [];
        this.db[coleccion].push({ id: this.nuevoID(coleccion.slice(0, 3).toUpperCase()), ...registro });
        this.guardar();
    },

    actualizarRegistro(coleccion, id, cambios) {
        const registro = (this.db[coleccion] || []).find((item) => item.id === id);
        if (!registro) return false;
        Object.assign(registro, cambios);
        this.guardar();
        return true;
    },


    eliminarRegistro(coleccion, id) {
        this.db[coleccion] = (this.db[coleccion] || []).filter((item) => item.id !== id);
        this.guardar();
        this.toast('Registro eliminado');
    },

    duplicarFeria(id) {
        const feria = this.db.ferias.find((item) => item.id === id);
        if (!feria) return;
        this.db.ferias.push({ ...feria, id: this.nuevoID('FER'), fecha: feria.fecha, estado: 'Duplicada', notas: `Copia de ${feria.nombre}` });
        this.guardar();
        this.toast('Feria duplicada');
    },

    optimizarPuestos() {
        const total = this.puestosTotales();
        this.db.puestos = this.db.inscripciones.slice(0, total).map((inscripcion, indice) => ({
            numero: indice + 1,
            modulo: String.fromCharCode(65 + Math.floor(indice / Number(this.config.puestosPorModulo))),
            estado: inscripcion.estadoPago === 'Confirmado' ? 'Confirmado' : 'Pago pendiente',
            emprendedorId: inscripcion.emprendedorId
        }));
        this.guardar();
        this.toast('Plano optimizado automáticamente');
    },

    historialEmprendedor(emprendedorId) {
        return this.db.inscripciones.filter((inscripcion) => inscripcion.emprendedorId === emprendedorId);
    },

    exportarExcel(nombre = 'feria-datos') {
        const filas = [['Emprendedor', 'Feria', 'Fecha', 'Puesto', 'Pago']].concat(this.db.inscripciones.map((inscripcion) => {
            const emprendedor = this.db.emprendedores.find((item) => item.id === inscripcion.emprendedorId);
            return [emprendedor?.emprendimiento || '', inscripcion.feria, inscripcion.fecha, inscripcion.puesto, inscripcion.estadoPago];
        }));
        this.descargarArchivo(`${nombre}.csv`, filas.map((fila) => fila.join(';')).join('\n'), 'text/csv');
    },

    exportarPDF() {
        window.print();
    },

    importarBackup(archivo) {
        const reader = new FileReader();
        reader.onload = () => this.restaurar(reader.result);
        reader.readAsText(archivo);
    },

    descargarArchivo(nombre, contenido, tipo) {
        const archivo = new Blob([contenido], { type: tipo });
        const url = URL.createObjectURL(archivo);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombre;
        link.click();
        URL.revokeObjectURL(url);
    },

    clonar(valor) {
        return JSON.parse(JSON.stringify(valor));
    }
};

window.app = app;
document.addEventListener('DOMContentLoaded', () => app.iniciar());
