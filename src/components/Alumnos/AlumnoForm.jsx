import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

export default function AlumnoForm({ isOpen, onClose, onSave, alumnoToEdit }) {
    const [loading, setLoading] = useState(false);
    const [grupos, setGrupos] = useState([]);
    const [selectedGrupos, setSelectedGrupos] = useState([]);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: alumnoToEdit?.nombre || '',
        apellido: alumnoToEdit?.apellido || '',
        fecha_nacimiento: alumnoToEdit?.fecha_nacimiento || '',
        fecha_inicio: alumnoToEdit?.fecha_inicio || new Date().toISOString().split('T')[0],
        nombre_tutor: alumnoToEdit?.nombre_tutor || '',
        telefono_tutor: alumnoToEdit?.telefono_tutor || '',
        email_tutor: alumnoToEdit?.email_tutor || '',
        telefono_emergencia: alumnoToEdit?.telefono_emergencia || '',
        paga_seguro: alumnoToEdit?.paga_seguro || false,
        observaciones: alumnoToEdit?.observaciones || '',
        comprobante_url: alumnoToEdit?.comprobante_url || ''
    });

    useEffect(() => {
        if (!isOpen) return;

        // Fetch available groups
        async function fetchGrupos() {
            const { data } = await supabase.from('grupos').select('*').eq('activo', true);
            setGrupos(data || []);
        }
        fetchGrupos();

        // Pre-select groups if editing
        if (alumnoToEdit?.alumnos_grupos) {
            const gids = alumnoToEdit.alumnos_grupos.map(ag => ag.grupo?.id).filter(Boolean);
            setSelectedGrupos(gids);
        } else {
            setSelectedGrupos([]);
        }
    }, [isOpen, alumnoToEdit]);

    if (!isOpen) return null;

    async function handleFileUpload(event) {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('comprobantes')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL
            const { data } = supabase.storage.from('comprobantes').getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, comprobante_url: data.publicUrl }));

        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen');
        } finally {
            setUploading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            let alumnoId;
            const payload = { ...formData };

            if (alumnoToEdit) {
                // Edit Alumno
                const { error } = await supabase
                    .from('alumnos')
                    .update(payload)
                    .eq('id', alumnoToEdit.id);
                if (error) throw error;
                alumnoId = alumnoToEdit.id;
            } else {
                // Create Alumno
                const { data, error } = await supabase
                    .from('alumnos')
                    .insert([payload])
                    .select()
                    .single();
                if (error) throw error;
                alumnoId = data.id;
            }

            // Handle Groups Relationship
            if (alumnoToEdit) {
                await supabase.from('alumnos_grupos').delete().eq('alumno_id', alumnoId);
            }

            if (selectedGrupos.length > 0) {
                const relations = selectedGrupos.map(grupoId => ({
                    alumno_id: alumnoId,
                    grupo_id: grupoId
                }));
                const { error: relError } = await supabase.from('alumnos_grupos').insert(relations);
                if (relError) throw relError;
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error al guardar el alumno: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }

    function toggleGrupo(grupoId) {
        setSelectedGrupos(prev =>
            prev.includes(grupoId)
                ? prev.filter(id => id !== grupoId)
                : [...prev, grupoId]
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">
                        {alumnoToEdit ? 'Editar Alumno' : 'Nuevo Alumno'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Datos Personales</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                                <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-red focus:ring-casr-red sm:text-sm p-2 border" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Apellido *</label>
                                <input required type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-red focus:ring-casr-red sm:text-sm p-2 border" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nacimiento</label>
                                    <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-red focus:ring-casr-red sm:text-sm p-2 border" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Inicio Clases</label>
                                    <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-red focus:ring-casr-red sm:text-sm p-2 border" />
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Contacto / Tutor</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre Tutor *</label>
                                <input required type="text" name="nombre_tutor" value={formData.nombre_tutor} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-red focus:ring-casr-red sm:text-sm p-2 border" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Teléfono Tutor</label>
                                <input type="tel" name="telefono_tutor" value={formData.telefono_tutor} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-red focus:ring-casr-red sm:text-sm p-2 border" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Teléfono Emergencia</label>
                                <input type="tel" name="telefono_emergencia" value={formData.telefono_emergencia} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-red focus:ring-casr-red sm:text-sm p-2 border" />
                            </div>
                        </div>
                    </div>

                    {/* Group Selection */}
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Asignar a Grupos</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {grupos.map((grupo) => (
                                <label key={grupo.id} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedGrupos.includes(grupo.id)}
                                        onChange={() => toggleGrupo(grupo.id)}
                                        className="h-4 w-4 text-casr-red focus:ring-casr-red border-gray-300 rounded"
                                    />
                                    <div className="flex-1">
                                        <span className="block text-sm font-medium text-gray-900">{grupo.nombre}</span>
                                        <span className="block text-xs text-gray-500 flex items-center gap-1">
                                            <span>{grupo.hora_inicio.slice(0, 5)}hs</span>
                                        </span>
                                    </div>
                                </label>
                            ))}
                            {grupos.length === 0 && <p className="text-gray-500 text-sm">No hay grupos disponibles. Crea uno primero.</p>}
                        </div>
                    </div>

                    {/* Insurance & Additional Info */}
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Seguro y Adicionales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Paga Seguro Checkbox */}
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="paga_seguro"
                                            name="paga_seguro"
                                            type="checkbox"
                                            checked={formData.paga_seguro}
                                            onChange={handleChange}
                                            className="focus:ring-casr-green h-4 w-4 text-casr-green border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="paga_seguro" className="font-medium text-gray-700">Paga Seguro</label>
                                        <p className="text-gray-500">Marcar si el alumno tiene el seguro al día.</p>
                                    </div>
                                </div>

                                {/* Comprobante Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante de Seguro</label>
                                    {formData.comprobante_url ? (
                                        <div className="relative inline-block mt-2 group">
                                            <a href={formData.comprobante_url} target="_blank" rel="noopener noreferrer">
                                                <img src={formData.comprobante_url} alt="Comprobante" className="h-24 w-auto rounded border border-gray-200 object-cover" />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, comprobante_url: '' }))}
                                                className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors">
                                            <div className="space-y-1 text-center">
                                                {uploading ? (
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-casr-red mx-auto"></div>
                                                ) : (
                                                    <>
                                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                        <div className="flex text-sm text-gray-600">
                                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-casr-red hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-casr-red">
                                                                <span>Subir archivo</span>
                                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileUpload} accept="image/*" />
                                                            </label>
                                                        </div>
                                                        <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                                <textarea name="observaciones" rows={3} value={formData.observaciones} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-red focus:ring-casr-red sm:text-sm p-2 border" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-casr-red"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-casr-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-casr-red disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Guardar Alumno'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
