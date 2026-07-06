/* Router simple de vistas */
const router = {
    vistas: {
        dashboard: {
            titulo: 'Panel de Ferias',
            subtitulo: 'Base única por feria, guardado automático y módulos conectados',
            render: () => {
                const proxima = app.proximaFeria();
                return `
                    <section class="panel-ferias"><h2>PANEL DE FERIAS</h2><div class="selector-ferias"><button data-feria="EUCA">EUCA</button><button class="plate" data-feria="PLATE">PLATE</button></div></section>
                    <section class="proxima-feria"><span>Próxima feria</span><h3>${formatearFecha(proxima?.fecha)}</h3><p>${proxima?.horario || '--'}</p><p><strong>Lugar:</strong><br>${proxima?.lugar || '--'}</p><div class="estado-feria"><span>Clima</span><strong>Estado: ${proxima?.estado || '--'}</strong></div></section>
                    <section class="atajos">${atajo('calendario', '📅', 'Calendario')}${atajo('emprendedores', '👥', 'Emprendedores')}${atajo('inscripciones', '📋', 'Inscripciones')}${atajo('puestos', '🗺', 'Plano')}${atajo('contabilidad', '💲', 'Contabilidad')}${atajo('estadisticas', '📈', 'Estadísticas')}${atajo('configuracion', '⚙', 'Configuración')}</section>
                `;
            },
            afterRender: () => conectarAtajos()
        },
        ferias: {
            titulo: 'Ferias',
            subtitulo: 'Alta, edición, detalle y duplicado de ferias',
            render: () => vistaCalendario(true),
            afterRender: () => conectarFerias()
        },
        calendario: {
            titulo: 'Calendario',
            subtitulo: 'Vista mensual, colores por feria y detalles',
            render: () => vistaCalendario(false),
            afterRender: () => conectarFerias()
        },
        emprendedores: {
            titulo: 'Emprendedores',
            subtitulo: 'Ficha completa, búsqueda e historial unificado',
            render: () => `
                <div class="acciones-linea"><input id="buscadorEmprendedores" placeholder="Buscar emprendedores"><button id="btnNuevoEmprendedor">+ Agregar emprendedor</button><button id="btnExportarExcel" class="secundario">Exportar Excel</button></div>
                <div id="listaEmprendedores" class="fichas">${app.db.emprendedores.map(fichaEmprendedor).join('')}</div>
            `,
            afterRender: () => conectarEmprendedores()
        },
        inscripciones: {
            titulo: 'Inscripciones',
            subtitulo: 'Una sola base con campo Feria para EUCA y PLATE',
            render: () => `
                <form id="formInscripcion" class="form-grid autosave-card">
                    ${componentes.select({ label: 'Feria', name: 'feria', opciones: nombresFerias() })}
                    ${componentes.campo({ label: 'Fecha', name: 'fecha', type: 'date', value: app.proximaFeria()?.fecha || '' })}
                    ${componentes.select({ label: 'Emprendedor', name: 'emprendedorId', opciones: app.db.emprendedores.map((e) => e.id) })}
                    ${componentes.campo({ label: 'Puesto', name: 'puesto', type: 'number', min: 1 })}
                    ${componentes.select({ label: 'Estado de pago', name: 'estadoPago', opciones: ['Pendiente', 'Confirmado'] })}
                    <button type="submit">Agregar emprendedor</button>
                </form>
                ${componentes.tabla({ columnas: [{ titulo: 'Emprendedor', campo: 'emprendedor' }, { titulo: 'Feria', campo: 'feria' }, { titulo: 'Fecha', campo: 'fecha' }, { titulo: 'Puesto', campo: 'puesto' }, { titulo: 'Pago', campo: 'estadoPago' }], filas: inscripcionesConNombre() })}
            `,
            afterRender: () => conectarInscripciones()
        },
        puestos: {
            titulo: 'Plano de puestos',
            subtitulo: 'Mapa por módulos con optimización automática y movimiento manual',
            render: () => `
                <div class="leyenda"><span>🟩 Libre</span><span>🟨 Reservado</span><span>🟦 Confirmado</span><span>🟥 Pago pendiente</span></div>
                <div class="acciones-linea"><button id="btnOptimizar">🤖 Optimizar</button><button class="secundario" onclick="window.print()">Mapa imprimible</button></div>
                ${planoModulos()}
            `,
            afterRender: () => {
                document.getElementById('btnOptimizar')?.addEventListener('click', () => { app.optimizarPuestos(); router.ir('puestos'); });
                document.querySelectorAll('[data-puesto]').forEach((btn) => btn.addEventListener('click', () => abrirPuesto(btn.dataset.puesto)));
            }
        },
        contabilidad: {
            titulo: 'Contabilidad',
            subtitulo: 'Ingresos, gastos, caja, medios de pago y ganancia',
            render: () => {
                const ingresos = sumarMovimientos('Ingreso');
                const gastos = sumarMovimientos('Gasto') + sumarMovimientos('Egreso');
                return `<div class="resumen-contable">${metric('Ingresos', app.formatearMoneda(ingresos))}${metric('Gastos', app.formatearMoneda(gastos))}${metric('Caja', app.formatearMoneda(app.totalCaja()))}${metric('Mercado Pago', app.formatearMoneda(sumarMedio('Mercado Pago')))}${metric('Efectivo', app.formatearMoneda(sumarMedio('Efectivo')))}${metric('Ganancia', app.formatearMoneda(ingresos - gastos))}</div>${componentes.tabla({ columnas: [{ titulo: 'Fecha', campo: 'fecha' }, { titulo: 'Concepto', campo: 'concepto' }, { titulo: 'Tipo', campo: 'tipo' }, { titulo: 'Monto', campo: 'montoFormateado' }], filas: app.db.movimientos.map((m) => ({ ...m, montoFormateado: app.formatearMoneda(m.monto ?? m.importe) })) })}`;
            }
        },
        agenda: { titulo: 'Agenda', subtitulo: 'Tareas con guardado automático', render: () => `<div class="lista-check">${app.db.agenda.map(itemCheckAgenda).join('')}</div>`, afterRender: () => conectarChecks('agenda', 'realizada') },
        publicaciones: { titulo: 'Publicaciones', subtitulo: 'Recordatorios de contenido', render: () => `<div class="lista-check">${app.db.publicaciones.map(itemCheckPublicacion).join('')}</div>`, afterRender: () => conectarChecks('publicaciones', 'hecha') },
        estadisticas: {
            titulo: 'Estadísticas',
            subtitulo: 'Indicadores, rankings y gráfico simple',
            render: () => `
                <div class="graficos-placeholder">${metric('Cantidad de emprendedores', app.db.emprendedores.length)}${metric('Rubros', new Set(app.db.emprendedores.map((e) => e.rubro)).size)}${metric('Ingresos', app.formatearMoneda(sumarMovimientos('Ingreso')))}${metric('Puestos ocupados', app.db.puestos.length)}</div>
                <div class="barras">${barrasRubros()}</div>
                <section class="grid-dos"><div class="card"><h3>Ranking de asistencia</h3>${ranking('asistencia')}</div><div class="card"><h3>Ranking de puntualidad</h3>${ranking('puntualidad')}</div></section>
            `
        },
        configuracion: {
            titulo: 'Configuración',
            subtitulo: 'Cambios con guardado automático, respaldo e importación',
            render: () => `
                <form id="formConfig" class="form-grid autosave-card">
                    ${componentes.campo({ label: 'Cantidad de módulos', name: 'cantidadModulos', value: app.config.cantidadModulos, type: 'number', min: 1 })}
                    ${componentes.campo({ label: 'Puestos por módulo', name: 'puestosPorModulo', value: app.config.puestosPorModulo, type: 'number', min: 1 })}
                    ${componentes.campo({ label: 'Color EUCA', name: 'colorEUCA', value: app.config.colorEUCA || '#2ecc71' })}
                    ${componentes.campo({ label: 'Color PLATE', name: 'colorPLATE', value: app.config.colorPLATE || '#9b59b6' })}
                    ${componentes.campo({ label: 'Valor del puesto', name: 'valorPuesto', value: app.config.valorPuesto || 0, type: 'number', min: 0 })}
                    ${componentes.campo({ label: 'Nombre ferias', name: 'nombreFerias', value: nombresFerias().join(', ') })}
                </form>
                <div class="acciones-linea"><button id="btnBackup">Exportar respaldo JSON</button><label class="boton-archivo">Importar respaldo<input id="inputBackup" type="file" accept="application/json"></label><button id="btnExcel" class="secundario">Exportar Excel</button><button id="btnPDF" class="secundario">Exportar PDF</button></div>
                <section class="card"><h3>Diseño</h3><p>Tema oscuro: negro, gris oscuro, texto blanco. EUCA verde y PLATE violeta. Responsive para celular.</p></section>
            `,
            afterRender: () => conectarConfiguracion()
        }
    },
    iniciar() {
        document.querySelectorAll('[data-view]').forEach((link) => link.addEventListener('click', (evento) => { evento.preventDefault(); this.ir(link.dataset.view); }));
        this.ir('dashboard');
    },
    ir(nombreVista) {
        const vista = this.vistas[nombreVista] || this.vistas.dashboard;
        document.querySelectorAll('.menu').forEach((link) => link.classList.toggle('activo', link.dataset.view === nombreVista));
        document.getElementById('tituloPagina').textContent = vista.titulo;
        document.getElementById('subtituloPagina').textContent = vista.subtitulo;
        document.getElementById('app').innerHTML = vista.render();
        vista.afterRender?.();
        app.actualizarResumen();
    }
};

function atajo(vista, icono, texto) { return `<button class="atajo" data-ir="${vista}"><span>${icono}</span>${texto}</button>`; }
function conectarAtajos() { document.querySelectorAll('[data-ir]').forEach((btn) => btn.addEventListener('click', () => router.ir(btn.dataset.ir))); }
function metric(titulo, valor) { return `<article class="metric"><span>${titulo}</span><strong>${valor}</strong></article>`; }
function formatearFecha(fecha) { return fecha ? new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : '--'; }
function nombresFerias() { return [...new Set(app.db.ferias.map((feria) => feria.nombre))]; }
function sumarMovimientos(tipo) { return app.db.movimientos.filter((m) => m.tipo === tipo).reduce((t, m) => t + Number(m.monto ?? m.importe), 0); }
function sumarMedio(medio) { return app.db.movimientos.filter((m) => m.medio === medio).reduce((t, m) => t + (['Gasto', 'Egreso'].includes(m.tipo) ? -1 : 1) * Number(m.monto ?? m.importe), 0); }
function itemCheckAgenda(item) { return `<label class="check-item"><input type="checkbox" data-id="${item.id}" ${item.realizada ? 'checked' : ''}> <span>${item.realizada ? '✔' : '☐'} ${item.hora} ${item.tarea}</span></label>`; }
function itemCheckPublicacion(item) { return `<label class="check-item"><input type="checkbox" data-id="${item.id}" ${item.hecha ? 'checked' : ''}> <span>${item.hecha ? '✔' : '☐'} ${item.titulo}</span></label>`; }
function conectarChecks(coleccion, campo) { document.querySelectorAll('[data-id]').forEach((input) => input.addEventListener('change', () => { const item = app.db[coleccion].find((registro) => registro.id === input.dataset.id); item[campo] = input.checked; app.guardar(); router.ir(coleccion); })); }
function claseEstado(estado) { return { Libre: 'libre', Reservado: 'reservado', Confirmado: 'confirmado', 'Pago pendiente': 'pago-pendiente' }[estado] || 'libre'; }
function emprendedorPorId(id) { return app.db.emprendedores.find((item) => item.id === id); }
function inscripcionesConNombre() { return app.db.inscripciones.map((inscripcion) => ({ ...inscripcion, emprendedor: emprendedorPorId(inscripcion.emprendedorId)?.emprendimiento || 'Sin nombre' })); }
function fichaEmprendedor(e) { const historial = app.historialEmprendedor(e.id); return `<article class="ficha"><h3>${e.emprendimiento}</h3><p><strong>${e.nombre}</strong> · ${e.rubro} / ${e.subrubro}</p><p>Instagram: ${e.instagram} · WhatsApp: ${e.whatsapp} · Email: ${e.email}</p><p>Electricidad: ${e.electricidad} · Stand: ${e.stand} · Pago: ${e.pago}</p><p>${e.observaciones}</p><small>Historial: ${historial.map((h) => `${h.feria} ${h.fecha} puesto ${h.puesto}`).join(' · ') || 'Sin participaciones'}</small></article>`; }
function conectarEmprendedores() {
    document.getElementById('buscadorEmprendedores')?.addEventListener('input', (evento) => { document.getElementById('listaEmprendedores').innerHTML = app.buscar('emprendedores', evento.target.value).map(fichaEmprendedor).join(''); });
    document.getElementById('btnNuevoEmprendedor')?.addEventListener('click', () => abrirEmprendedor());
    document.getElementById('btnExportarExcel')?.addEventListener('click', () => app.exportarExcel('emprendedores-inscripciones'));
}
function abrirEmprendedor() { app.modal(`<h3>Nuevo emprendedor</h3><form id="modalEmprendedor" class="form-grid">${['nombre', 'emprendimiento', 'subrubro', 'instagram', 'whatsapp', 'email', 'stand', 'observaciones'].map((name) => componentes.campo({ label: name, name })).join('')}${componentes.select({ label: 'Rubro', name: 'rubro', opciones: app.catalogos.rubros })}${componentes.select({ label: '¿Necesita electricidad?', name: 'electricidad', opciones: ['No', 'Sí'] })}<button type="submit">Guardar</button></form>`); document.getElementById('modalEmprendedor')?.addEventListener('submit', (evento) => { evento.preventDefault(); app.agregarRegistro('emprendedores', Object.fromEntries(new FormData(evento.target))); app.cerrarModal(); router.ir('emprendedores'); }); }
function conectarInscripciones() { document.getElementById('formInscripcion')?.addEventListener('submit', (evento) => { evento.preventDefault(); const data = Object.fromEntries(new FormData(evento.target)); data.puesto = Number(data.puesto); app.agregarRegistro('inscripciones', data); router.ir('inscripciones'); }); }
function planoModulos() { const porModulo = Number(app.config.puestosPorModulo); const total = app.puestosTotales(); let html = '<div class="modulos">'; for (let inicio = 1; inicio <= total; inicio += porModulo) { const modulo = String.fromCharCode(65 + Math.floor((inicio - 1) / porModulo)); html += `<section class="modulo"><h3>Módulo ${modulo}</h3><div class="modulo-puestos">`; for (let numero = inicio; numero < inicio + porModulo; numero++) { const puesto = app.db.puestos.find((p) => p.numero === numero) || { estado: 'Libre' }; html += `<button class="puesto ${claseEstado(puesto.estado)}" data-puesto="${numero}">${numero}</button>`; } html += '</div></section>'; } return `${html}</div>`; }
function abrirPuesto(numero) { const puesto = app.db.puestos.find((p) => p.numero === Number(numero)); const emp = puesto ? emprendedorPorId(puesto.emprendedorId) : null; app.modal(`<h3>Puesto ${numero}</h3><p>Estado: <strong>${puesto?.estado || 'Libre'}</strong></p><p>${emp ? `${emp.emprendimiento} · ${emp.rubro} · ${emp.whatsapp}` : 'Sin asignación'}</p><button onclick="app.cerrarModal()">Cerrar</button>`); }
function vistaCalendario(conFormulario) { return `${conFormulario ? formularioFeria() : ''}${calendarioMensual(2026, 6)}<br>${componentes.tabla({ columnas: [{ titulo: 'Feria', campo: 'nombre' }, { titulo: 'Fecha', campo: 'fecha' }, { titulo: 'Lugar', campo: 'lugar' }, { titulo: 'Horario', campo: 'horario' }, { titulo: 'Estado', campo: 'estado' }, { titulo: 'Acciones', campo: 'acciones' }], filas: app.db.ferias.map((feria) => ({ ...feria, acciones: `<button data-duplicar="${feria.id}">Duplicar</button>` })) })}`; }
function formularioFeria() { return `<form id="formFeria" class="form-grid autosave-card">${componentes.campo({ label: 'Nombre', name: 'nombre' })}${componentes.campo({ label: 'Fecha', name: 'fecha', type: 'date' })}${componentes.campo({ label: 'Lugar', name: 'lugar' })}${componentes.campo({ label: 'Horario', name: 'horario' })}${componentes.select({ label: 'Color', name: 'color', opciones: ['verde', 'violeta'] })}${componentes.campo({ label: 'Estado', name: 'estado' })}<button type="submit">Agregar feria</button></form>`; }
function conectarFerias() { document.getElementById('formFeria')?.addEventListener('submit', (evento) => { evento.preventDefault(); app.agregarRegistro('ferias', Object.fromEntries(new FormData(evento.target))); router.ir('ferias'); }); document.querySelectorAll('[data-duplicar]').forEach((btn) => btn.addEventListener('click', () => { app.duplicarFeria(btn.dataset.duplicar); router.ir('ferias'); })); }
function calendarioMensual(anio, mes) { const dias = new Date(anio, mes + 1, 0).getDate(); const vacios = (new Date(anio, mes, 1).getDay() + 6) % 7; const celdas = Array.from({ length: vacios }, () => '<div></div>'); for (let dia = 1; dia <= dias; dia++) { const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`; const feria = app.db.ferias.find((f) => f.fecha === fecha); celdas.push(`<button class="dia ${feria?.color || ''}" title="${feria ? `${feria.lugar} · ${feria.horario} · ${feria.estado}` : ''}">${dia}${feria ? `<small>${feria.nombre}</small>` : ''}</button>`); } return `<h3>Julio</h3><div class="calendario"><strong>L</strong><strong>M</strong><strong>M</strong><strong>J</strong><strong>V</strong><strong>S</strong><strong>D</strong>${celdas.join('')}</div>`; }
function barrasRubros() { const conteo = app.db.emprendedores.reduce((acc, e) => ({ ...acc, [e.rubro]: (acc[e.rubro] || 0) + 1 }), {}); return Object.entries(conteo).map(([rubro, total]) => `<div><span>${rubro}</span><strong style="width:${total * 30}%">${total}</strong></div>`).join(''); }
function ranking(campo) { return `<ol>${app.db.emprendedores.slice().sort((a, b) => Number(b[campo]) - Number(a[campo])).map((e) => `<li>${e.emprendimiento}: ${e[campo]}</li>`).join('')}</ol>`; }
function conectarConfiguracion() { document.querySelectorAll('#formConfig input').forEach((input) => input.addEventListener('input', () => { const data = new FormData(document.getElementById('formConfig')); ['cantidadModulos', 'puestosPorModulo', 'valorPuesto'].forEach((clave) => app.config[clave] = Number(data.get(clave))); ['colorEUCA', 'colorPLATE', 'nombreFerias'].forEach((clave) => app.config[clave] = data.get(clave)); app.guardar(); })); document.getElementById('btnBackup')?.addEventListener('click', () => app.exportarBackup()); document.getElementById('inputBackup')?.addEventListener('change', (evento) => app.importarBackup(evento.target.files[0])); document.getElementById('btnExcel')?.addEventListener('click', () => app.exportarExcel()); document.getElementById('btnPDF')?.addEventListener('click', () => app.exportarPDF()); }

window.router = router;
document.addEventListener('DOMContentLoaded', () => router.iniciar());
