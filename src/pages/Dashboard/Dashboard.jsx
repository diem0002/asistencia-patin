import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, UserCheck, Calendar } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalAlumnos: 0,
        totalGrupos: 0,
        clasesHoy: 0
    });

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

            // 3. Clases de Hoy (Dia de la semana: 0=Domingo, 1=Lunes...)
            const hoy = new Date().getDay();
            const { count: clasesHoyCount } = await supabase
                .from('grupos')
                .select('*', { count: 'exact', head: true })
                .eq('activo', true)
                .eq('dia_semana', hoy);

            setStats({
                totalAlumnos: alumnosCount || 0,
                totalGrupos: gruposCount || 0,
                clasesHoy: clasesHoyCount || 0
            });
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
                        <h3 className="text-sm font-medium text-gray-500">Clases Hoy</h3>
                        <p className="text-3xl font-bold text-gray-900">{stats.clasesHoy}</p>
                    </div>
                </div>
            </div>

            {/* Accesos Rápidos (Quick Actions) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
                    <div className="flex gap-4">
                        <Link to="/asistencia" className="flex-1 bg-casr-red text-white text-center py-3 rounded-lg hover:bg-red-700 transition">
                            Tomar Asistencia
                        </Link>
                        <Link to="/alumnos" className="flex-1 bg-gray-100 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-200 transition">
                            Ver Alumnos
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
