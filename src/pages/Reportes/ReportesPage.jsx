import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, CreditCard, Check, X, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReportesPage() {
    const [grupos, setGrupos] = useState([]);
    const [selectedGrupo, setSelectedGrupo] = useState('');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        async function fetchGrupos() {
            // Need valor_cuota to register payments
            const { data } = await supabase.from('grupos').select('*').eq('activo', true).order('nombre');
            setGrupos(data || []);
        }
        fetchGrupos();
    }, []);

    useEffect(() => {
        if (!selectedGrupo) {
            setReportData([]);
            return;
        }
        fetchReport();
    }, [selectedGrupo, currentMonth]);

    async function fetchReport() {
        setLoading(true);
        try {
            // 1. Get all students in group
            const { data: alumnos, error: alumnosError } = await supabase
                .from('alumnos')
                .select(`id, nombre, apellido, alumnos_grupos!inner(grupo_id)`)
                .eq('activo', true)
                .eq('alumnos_grupos.grupo_id', selectedGrupo)
                .order('apellido');

            if (alumnosError) throw alumnosError;

            // 2. Get attendance for THIS month
            const start = startOfMonth(currentMonth).toISOString();
            const end = endOfMonth(currentMonth).toISOString();

            const { data: asistencias, error: asistenciasError } = await supabase
                .from('asistencias')
                .select('alumno_id, presente, fecha')
                .eq('grupo_id', selectedGrupo)
                .gte('fecha', start)
                .lte('fecha', end);

            if (asistenciasError) throw asistenciasError;

            // 3. Get Payments for THIS month
            const mesStr = format(currentMonth, 'yyyy-MM-01');

            const { data: pagos, error: pagosError } = await supabase
                .from('pagos')
                .select('alumno_id, pagado, monto')
                .eq('mes', mesStr);

            if (pagosError) throw pagosError;

            // 4. Process Data
            const stats = alumnos.map(alumno => {
                const records = asistencias.filter(a => a.alumno_id === alumno.id);
                const totalClases = records.length;
                const presentes = records.filter(a => a.presente).length;
                const ausentes = totalClases - presentes;
                const porcentaje = totalClases > 0 ? Math.round((presentes / totalClases) * 100) : 0;

                const pago = pagos?.find(p => p.alumno_id === alumno.id);
                const estaPagado = pago?.pagado || false;

                return {
                    ...alumno,
                    totalClases,
                    presentes,
                    ausentes,
                    porcentaje,
                    estaPagado
                };
            });

            setReportData(stats);

        } catch (err) {
            console.error(err);
            alert('Error al generar reporte');
        } finally {
            setLoading(false);
        }
    }

    async function togglePago(alumnoId, currentState) {
        // Optimistic update
        setReportData(prev => prev.map(a =>
            a.id === alumnoId ? { ...a, estaPagado: !currentState } : a
        ));

        try {
            const mesStr = format(currentMonth, 'yyyy-MM-01');

            if (!currentState) {
                // Mark as PAID
                // Get Group Fee
                const grupo = grupos.find(g => g.id === Number(selectedGrupo)) || {};
                const montoCuota = grupo.valor_cuota || 0;

                const { error } = await supabase
                    .from('pagos')
                    .upsert({
                        alumno_id: alumnoId,
                        mes: mesStr,
                        pagado: true,
                        fecha_pago: new Date().toISOString(),
                        monto: montoCuota
                    }, { onConflict: 'alumno_id, mes' });
                if (error) throw error;

            } else {
                // Mark as UNPAID
                const { error } = await supabase
                    .from('pagos')
                    .update({ pagado: false, fecha_pago: null, monto: 0 })
                    .eq('alumno_id', alumnoId)
                    .eq('mes', mesStr);
                if (error) throw error;
            }

        } catch (error) {
            console.error(error);
            alert('Error al actualizar pago');
            fetchReport(); // Revert on error
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-8 h-8 text-casr-green" />
                    Reportes y Pagos
                </h1>

                {/* Month Selector */}
                <input
                    type="month"
                    value={format(currentMonth, 'yyyy-MM')}
                    onChange={(e) => {
                        const [y, m] = e.target.value.split('-');
                        setCurrentMonth(new Date(y, m - 1, 1));
                    }}
                    className="border p-2 rounded-md shadow-sm text-gray-700 bg-white"
                />
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Grupo</label>
                <select
                    value={selectedGrupo}
                    onChange={(e) => setSelectedGrupo(e.target.value)}
                    className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-casr-green focus:ring-casr-green py-2 px-3 border"
                >
                    <option value="">-- Selecciona un grupo --</option>
                    {grupos.map(g => (
                        <option key={g.id} value={g.id}>{g.nombre}</option>
                    ))}
                </select>
                {selectedGrupo && (
                    <p className="mt-2 text-sm text-gray-500">
                        Cuota del grupo: <span className="font-semibold text-gray-900">
                            ${grupos.find(g => g.id === Number(selectedGrupo))?.valor_cuota || 0}
                        </span>
                    </p>
                )}
            </div>

            {/* Table */}
            {selectedGrupo && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Generando reporte...</div>
                    ) : reportData.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No hay alumnos en este grupo.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Asistencia Mes</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado de Pago</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">% Asistencia</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{row.apellido}, {row.nombre}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                <span className="font-bold text-gray-900">{row.presentes}</span> / {row.totalClases}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <button
                                                    onClick={() => togglePago(row.id, row.estaPagado)}
                                                    className={`
                                                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all
                                                    ${row.estaPagado
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                                                            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}
                                                `}
                                                >
                                                    {row.estaPagado ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5" />
                                                            PAGADO
                                                        </>
                                                    ) : (
                                                        <>
                                                            <X className="w-3.5 h-3.5" />
                                                            NO PAGO
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.porcentaje >= 75 ? 'bg-green-50 text-green-700' :
                                                    row.porcentaje >= 50 ? 'bg-yellow-50 text-yellow-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {row.porcentaje}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
