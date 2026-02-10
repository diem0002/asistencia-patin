import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';

const DIAS_SEMANANA = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export default function GrupoForm({ isOpen, onClose, onSave, grupoToEdit }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: grupoToEdit?.nombre || '',
        dias_semana: grupoToEdit?.dias_semana || (grupoToEdit?.dia_semana ? [grupoToEdit.dia_semana] : []),
        hora_inicio: grupoToEdit?.hora_inicio || '18:00',
        hora_fin: grupoToEdit?.hora_fin || '19:00',
        capacidad_maxima: grupoToEdit?.capacidad_maxima || '',
        valor_cuota: grupoToEdit?.valor_cuota || 0,
        color: grupoToEdit?.color || '#3B82F6'
    });

    if (!isOpen) return null;

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        if (formData.dias_semana.length === 0) {
            alert('Debes seleccionar al menos un día');
            setLoading(false);
            return;
        }

        // Prepare payload. Set empty capacity to null.
        const payload = {
            ...formData,
            capacidad_maxima: formData.capacidad_maxima === '' ? null : formData.capacidad_maxima,
            // Ensure dia_semana is null to avoid constraint issues if column exists
            dia_semana: null
        };

        try {
            if (grupoToEdit) {
                // Edit
                const { error } = await supabase
                    .from('grupos')
                    .update(payload)
                    .eq('id', grupoToEdit.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('grupos')
                    .insert([payload]);
                if (error) throw error;
            }

            onSave(); // Refresh list
            onClose(); // Close modal
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error al guardar el grupo: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    function toggleDia(index) {
        setFormData(prev => {
            const dias = prev.dias_semana.includes(index)
                ? prev.dias_semana.filter(d => d !== index)
                : [...prev.dias_semana, index];
            return { ...prev, dias_semana: dias.sort() };
        });
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">
                        {grupoToEdit ? 'Editar Grupo' : 'Nuevo Grupo'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Grupo *</label>
                        <input
                            required
                            type="text"
                            name="nombre"
                            placeholder="Ej: Principiantes Lunes y Miércoles"
                            value={formData.nombre}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-green focus:ring-casr-green sm:text-sm p-2 border"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Días de Clase *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {DIAS_SEMANANA.map((dia, index) => (
                                <label key={index} className={`
                        flex items-center justify-center px-3 py-2 border rounded-md cursor-pointer text-sm font-medium transition-colors
                        ${formData.dias_semana.includes(index)
                                        ? 'bg-casr-green text-white border-casr-green'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                    `}>
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={formData.dias_semana.includes(index)}
                                        onChange={() => toggleDia(index)}
                                    />
                                    {dia.slice(0, 3)}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hora Inicio *</label>
                            <input
                                required
                                type="time"
                                name="hora_inicio"
                                value={formData.hora_inicio}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-green focus:ring-casr-green sm:text-sm p-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hora Fin *</label>
                            <input
                                required
                                type="time"
                                name="hora_fin"
                                value={formData.hora_fin}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-green focus:ring-casr-green sm:text-sm p-2 border"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Valor Cuota ($)</label>
                            <input
                                type="number"
                                name="valor_cuota"
                                min="0"
                                value={formData.valor_cuota}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-green focus:ring-casr-green sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Capacidad (Opcional)</label>
                            <input
                                type="number"
                                name="capacidad_maxima"
                                value={formData.capacidad_maxima}
                                onChange={handleChange}
                                placeholder="Ej: 20"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-casr-green focus:ring-casr-green sm:text-sm p-2 border"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Color Identificativo</label>
                        <input
                            type="color"
                            name="color"
                            value={formData.color}
                            onChange={handleChange}
                            className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-casr-green focus:ring-casr-green p-1 border cursor-pointer"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-casr-green"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-casr-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-casr-green disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Guardar Grupo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
