import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { differenceInYears } from 'date-fns';
import { Search, Plus, Trash2, Edit, User } from 'lucide-react';
import AlumnoForm from '../../components/Alumnos/AlumnoForm';

export default function AlumnosPage() {
    const [alumnos, setAlumnos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAlumno, setEditingAlumno] = useState(null);

    useEffect(() => {
        fetchAlumnos();
    }, []);

    async function fetchAlumnos() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('alumnos')
                .select(`
          *,
          alumnos_grupos (
            grupo:grupos (
              id, nombre, color
            )
          )
        `)
                .eq('activo', true)
                .order('apellido', { ascending: true });

            if (error) throw error;
            setAlumnos(data || []);
        } catch (error) {
            console.error('Error fetching alumnos:', error);
            alert('Error cargando alumnos');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('¿Estás seguro de eliminar este alumno?')) return;

        try {
            const { error } = await supabase
                .from('alumnos')
                .update({ activo: false })
                .eq('id', id);

            if (error) throw error;

            setAlumnos(alumnos.filter(a => a.id !== id));
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Error al eliminar');
        }
    }

    function handleOpenForm(alumno = null) {
        setEditingAlumno(alumno);
        setIsFormOpen(true);
    }

    function handleCloseForm() {
        setIsFormOpen(false);
        setEditingAlumno(null);
    }

    function handleSave() {
        fetchAlumnos();
        handleCloseForm();
    }

    const filteredAlumnos = alumnos.filter(alumno =>
        `${alumno.nombre} ${alumno.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Alumnos</h1>
                <button
                    onClick={() => handleOpenForm()}
                    className="bg-casr-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Alumno
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre o apellido..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-casr-red focus:border-casr-red sm:text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List / Table */}
            {loading ? (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-casr-red mx-auto"></div>
                    <p className="mt-2 text-gray-500">Cargando alumnos...</p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden rounded-md border border-gray-200">
                    <ul className="divide-y divide-gray-200">
                        {filteredAlumnos.length > 0 ? (
                            filteredAlumnos.map((alumno) => (
                                <li key={alumno.id} className="hover:bg-gray-50 transition-colors">
                                    <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Avatar Placeholder */}
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                {alumno.foto_url ? (
                                                    <img src={alumno.foto_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                                ) : (
                                                    <User className="h-6 w-6" />
                                                )}
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-casr-red truncate">
                                                    {alumno.apellido}, {alumno.nombre}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Edad: {alumno.fecha_nacimiento ? `${differenceInYears(new Date(), new Date(alumno.fecha_nacimiento))} años` : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenForm(alumno)}
                                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(alumno.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-8 text-center text-gray-500">
                                No se encontraron alumnos.
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {/* Form Modal */}
            {isFormOpen && (
                <AlumnoForm
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    onSave={handleSave}
                    alumnoToEdit={editingAlumno}
                />
            )}
        </div>
    );
}
