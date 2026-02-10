import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Edit, Calendar, Clock, DollarSign } from 'lucide-react';
import GrupoForm from '../../components/Grupos/GrupoForm';

const DIAS_SEMANANA = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export default function GruposPage() {
    const [grupos, setGrupos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGrupo, setEditingGrupo] = useState(null);

    useEffect(() => {
        fetchGrupos();
    }, []);

    async function fetchGrupos() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('grupos')
                .select('*')
                .eq('activo', true)
                .order('hora_inicio', { ascending: true });

            if (error) throw error;
            setGrupos(data || []);
        } catch (error) {
            console.error('Error fetching grupos:', error);
            alert('Error cargando grupos');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('¿Estás seguro de eliminar este grupo?')) return;

        try {
            const { error } = await supabase
                .from('grupos')
                .update({ activo: false })
                .eq('id', id);

            if (error) throw error;

            setGrupos(grupos.filter(g => g.id !== id));
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Error al eliminar');
        }
    }

    function handleOpenForm(grupo = null) {
        setEditingGrupo(grupo);
        setIsFormOpen(true);
    }

    function handleCloseForm() {
        setIsFormOpen(false);
        setEditingGrupo(null);
    }

    function handleSave() {
        fetchGrupos();
        handleCloseForm();
    }

    function formatDias(diasArray) {
        if (!diasArray || diasArray.length === 0) return 'Sin días definidos';
        return diasArray
            .sort((a, b) => a - b)
            .map(d => DIAS_SEMANANA[d])
            .join(', ');
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Grupos</h1>
                <button
                    onClick={() => handleOpenForm()}
                    className="bg-casr-green text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Grupo
                </button>
            </div>

            {/* Grid of Groups */}
            {loading ? (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-casr-green mx-auto"></div>
                    <p className="mt-2 text-gray-500">Cargando grupos...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grupos.length > 0 ? (
                        grupos.map((grupo) => (
                            <div
                                key={grupo.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative"
                            >
                                <div className="h-2 w-full absolute top-0" style={{ backgroundColor: grupo.color }}></div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-gray-900 truncate pr-2">{grupo.nombre}</h3>
                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => handleOpenForm(grupo)} className="text-gray-400 hover:text-blue-600">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(grupo.id)} className="text-gray-400 hover:text-red-600">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-sm text-gray-600">
                                        <div className="flex items-start gap-3">
                                            <Calendar className="w-5 h-5 text-casr-green mt-0.5" />
                                            <span className="font-medium flex-1">{formatDias(grupo.dias_semana)}</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-casr-green" />
                                            <span>{grupo.hora_inicio.slice(0, 5)} - {grupo.hora_fin.slice(0, 5)} hs</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <DollarSign className="w-5 h-5 text-casr-green" />
                                            <span className="font-semibold text-gray-900">
                                                {grupo.valor_cuota ? `$${grupo.valor_cuota}` : 'Sin costo'}
                                            </span>
                                        </div>

                                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                                            <span>
                                                {grupo.capacidad_maxima
                                                    ? `Capacidad: ${grupo.capacidad_maxima}`
                                                    : 'Capacidad ilimitada'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                            <p>No tienes grupos creados.</p>
                            <button
                                onClick={() => handleOpenForm()}
                                className="mt-2 text-casr-green hover:underline font-medium"
                            >
                                Crear el primer grupo
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Form Modal */}
            {isFormOpen && (
                <GrupoForm
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    onSave={handleSave}
                    grupoToEdit={editingGrupo}
                />
            )}
        </div>
    );
}
