import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, UserCheck, Check, X, Save, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AsistenciaPage() {
    const [grupos, setGrupos] = useState([]);
    const [selectedGrupo, setSelectedGrupo] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [alumnos, setAlumnos] = useState([]);
    const [asistencia, setAsistencia] = useState({}); // { alumnoId: true/false }
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // 1. Fetch Grupos on mount
    useEffect(() => {
        async function fetchGrupos() {
            const { data } = await supabase.from('grupos').select('*').eq('activo', true).order('dia_semana', { ascending: true });
            setGrupos(data || []);
        }
        fetchGrupos();
    }, []);

    // 2. Fetch Alumnos & Asistencias when Grupo or Date changes
    useEffect(() => {
        if (!selectedGrupo) {
            setAlumnos([]);
            return;
        }

        async function fetchData() {
            setLoading(true);
            setMessage(null);
            try {
                // A. Get Students in this Group
                const { data: alumnosData, error: alumnosError } = await supabase
                    .from('alumnos')
                    .select(`
            *,
            alumnos_grupos!inner(grupo_id)
          `)
                    .eq('activo', true)
                    .eq('alumnos_grupos.grupo_id', selectedGrupo)
                    .order('apellido');

                if (alumnosError) throw alumnosError;

                // B. Get Existing Attendance for this Date/Group
                const { data: asistenciaData, error: asistenciaError } = await supabase
                    .from('asistencias')
                    .select('*')
                    .eq('grupo_id', selectedGrupo)
                    .eq('fecha', selectedDate);

                if (asistenciaError) throw asistenciaError;

                setAlumnos(alumnosData || []);

                // Map existing attendance to state dictionary
                const asistenciaMap = {};
                // Initialize all as false (Absent) by default if no record exists
                // OR if record exists, use that value.
                // Better UX: If no record, maybe consider them Present? Or Absent?
                // Let's default to FALSE (Absent) and user taps to mark Present.

                // If we have records, use them
                if (asistenciaData && asistenciaData.length > 0) {
                    asistenciaData.forEach(record => {
                        asistenciaMap[record.alumno_id] = record.presente;
                    });
                } else {
                    // New register: Default to PRESENT (usually faster to mark absents) or ABSENT?
                    // Let's default to FALSE so they have to tap.
                    // Actually, for "Taking roll", usually everyone is Present except a few.
                    // Let's default to TRUE (Present) for new records? NO, safe default is False to force check.
                    // Let's stick to: undefined = not marked yet. false = absent. true = present.
                    // For simplicity in this version, let's assume default ABSENT (false).
                }

                // If editing, merge.
                if (asistenciaData.length > 0) {
                    setAsistencia(asistenciaMap);
                } else {
                    // Reset state for new day
                    setAsistencia({});
                }

            } catch (error) {
                console.error('Error:', error);
                setMessage({ type: 'error', text: 'Error cargando datos.' });
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [selectedGrupo, selectedDate]);

    const toggleAsistencia = (alumnoId) => {
        setAsistencia(prev => ({
            ...prev,
            [alumnoId]: !prev[alumnoId]
        }));
    };

    const handleSave = async () => {
        if (!selectedGrupo || alumnos.length === 0) return;

        setSaving(true);
        try {
            // Prepare upsert data
            const upsertData = alumnos.map(alumno => ({
                alumno_id: alumno.id,
                grupo_id: selectedGrupo,
                fecha: selectedDate,
                presente: asistencia[alumno.id] || false, // Default false if undefined
                // observaciones: ... (could add later)
            }));

            const { error } = await supabase
                .from('asistencias')
                .upsert(upsertData, { onConflict: 'alumno_id, grupo_id, fecha' });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Asistencia guardada correctamente.' });

            // Clear message after 3s
            setTimeout(() => setMessage(null), 3000);

        } catch (error) {
            console.error('Error saving:', error);
            setMessage({ type: 'error', text: 'Error al guardar.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-8 h-8 text-casr-red" />
                    Tomar Asistencia
                </h1>

                {/* Date Picker */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="outline-none text-gray-700 font-medium"
                    />
                </div>
            </div>

            {/* Helper / Status Message */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    <AlertCircle className="w-5 h-5" />
                    {message.text}
                </div>
            )}

            {/* Group Selector */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Grupo</label>
                <select
                    value={selectedGrupo}
                    onChange={(e) => setSelectedGrupo(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-red focus:ring-casr-red py-3 px-4 border text-lg"
                >
                    <option value="">-- Selecciona un grupo --</option>
                    {grupos.map(g => (
                        <option key={g.id} value={g.id}>
                            {g.nombre} ({g.hora_inicio.slice(0, 5)}hs)
                        </option>
                    ))}
                </select>
            </div>

            {/* Students List */}
            {selectedGrupo && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Listado de Alumnos ({alumnos.length})</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Estado</span>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Cargando alumnos...</div>
                    ) : alumnos.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            No hay alumnos asignados a este grupo.
                            <br />
                            <a href="/alumnos" className="text-casr-red hover:underline">Ir a asignar alumnos</a>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {alumnos.map(alumno => {
                                const isPresent = asistencia[alumno.id] || false;
                                return (
                                    <div key={alumno.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-10 rounded-full ${isPresent ? 'bg-casr-green' : 'bg-gray-200'}`}></div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-lg">{alumno.apellido}, {alumno.nombre}</p>
                                                <p className="text-sm text-gray-500">Presente: {isPresent ? 'SÍ' : 'NO'}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => toggleAsistencia(alumno.id)}
                                            className={`
                                        flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all transform active:scale-95
                                        ${isPresent
                                                    ? 'bg-casr-green text-white shadow-md hover:bg-green-700'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                }
                                    `}
                                        >
                                            {isPresent ? (
                                                <>
                                                    <Check className="w-5 h-5" />
                                                    Presente
                                                </>
                                            ) : (
                                                <>
                                                    <X className="w-5 h-5" />
                                                    Ausente
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer Actions */}
                    {alumnos.length > 0 && (
                        <div className="p-6 bg-gray-50 border-t flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-casr-red text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    'Guardando...'
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Guardar Asistencia
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
