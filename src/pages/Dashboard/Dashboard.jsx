import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, UserCheck, Calendar, Cake } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalAlumnos: 0,
        totalGrupos: 0,
        clasesHoy: 0
    });

    const [cumpleanos, setCumpleanos] = useState([]);

    useEffect(() => {
        async function fetchStats() {
            // 1. Total Alumnos
            const { count: alumnosCount } = await supabase
                .from('alumnos')
                .select('*', { count: 'exact', head: true })
                .eq('activo', true);

            // 2. Total Grupos
            const { count: gruposCount } = await supabase
                .from('grupos')
                .select('*', { count: 'exact', head: true })
                .eq('activo', true);

            // 3. Clases de Hoy (REALES: Grupos que tienen asistencia tomada hoy)
            const hoyStr = new Date().toISOString().split('T')[0];

            // Consultamos asistencias únicas por grupo en el día de hoy
            // (Supabase no tiene distinct count directo facil, hacemos un truco o fetch)
            // Mejor fetch head de grupos que tienen asistencia hoy via inner join manual o buscando IDs.
            // Forma simple: Traer todas las asistencias de hoy y contar unique grupo_id en JS (si son pocas)
            const { data: asistenciasHoy } = await supabase
                .from('asistencias')
                .select('grupo_id')
                .eq('fecha', hoyStr);

            const gruposConClase = new Set(asistenciasHoy?.map(a => a.grupo_id)).size;

            setStats({
                totalAlumnos: alumnosCount || 0,
                totalGrupos: gruposCount || 0,
                clasesHoy: gruposConClase || 0
            });

            // 4. Cumpleaños del Mes
            const mesActual = new Date().getMonth() + 1; // 1-12

            // Supabase no tiene filtro facil para "Month from Date", hay que usar RPC o traer activos y filtrar en JS.
            // Como son pocos alumnos (asumo < 1000), filtrar en JS es instantáneo.
            const { data: alumnosData } = await supabase
                .from('alumnos')
                .select('id, nombre, apellido, fecha_nacimiento')
                .eq('activo', true)
                .not('fecha_nacimiento', 'is', null);

            if (alumnosData) {
                const cumpleaneros = alumnosData.filter(a => {
                    const fechaNac = a.fecha_nacimiento ? new Date(a.fecha_nacimiento + 'T12:00:00') : null; // Fix timezone offset
                    return fechaNac && (fechaNac.getMonth() + 1) === mesActual;
                }).sort((a, b) => {
                    const diaA = new Date(a.fecha_nacimiento + 'T12:00:00').getDate();
                    const diaB = new Date(b.fecha_nacimiento + 'T12:00:00').getDate();
                    return diaA - diaB;
                });
                setCumpleanos(cumpleaneros);
            }
        }

        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Bienvenido al Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Alumnos */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Total Alumnos</h3>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalAlumnos}</p>
                    </div>
                </div>

                {/* Card 2: Grupos */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Grupos Activos</h3>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalGrupos}</p>
                    </div>
                </div>

                {/* Card 3: Clases Hoy */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-red-100 p-3 rounded-full text-red-600">
                        <UserCheck className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Clases Dadas Hoy</h3>
                        <p className="text-3xl font-bold text-gray-900">{stats.clasesHoy}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Accesos Rápidos */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link to="/asistencia" className="flex-1 bg-casr-red text-white text-center py-4 rounded-lg hover:bg-red-700 transition font-medium text-lg shadow-md">
                            Tomar Asistencia
                        </Link>
                        <Link to="/alumnos" className="flex-1 bg-gray-50 text-gray-700 text-center py-4 rounded-lg hover:bg-gray-100 transition border border-gray-200 font-medium">
                            Ver Alumnos
                        </Link>
                    </div>
                </div>

                {/* Cumpleaños Widget */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Cake className="w-5 h-5 text-pink-500" />
                        <h3 className="text-lg font-semibold text-gray-800">Cumpleaños ({new Date().toLocaleString('es-ES', { month: 'long' })})</h3>
                    </div>

                    {cumpleanos.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {cumpleanos.map(alumno => {
                                const dia = new Date(alumno.fecha_nacimiento + 'T12:00:00').getDate();
                                return (
                                    <div key={alumno.id} className="flex items-center justify-between p-2 bg-pink-50 rounded-lg">
                                        <span className="font-medium text-gray-700">{alumno.nombre} {alumno.apellido}</span>
                                        <span className="text-sm font-bold text-pink-600 bg-white px-2 py-1 rounded-md shadow-sm">
                                            Día {dia}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm italic py-4 text-center">No hay cumpleaños este mes.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
