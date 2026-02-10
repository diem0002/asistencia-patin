import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function FinanzasPage() {
    const [loadingChart, setLoadingChart] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [stats, setStats] = useState({ totalGrupos: 0, promedioCuota: 0 });

    useEffect(() => {
        fetchChartData();
        fetchGeneralStats();
    }, []);

    async function fetchGeneralStats() {
        const { data: grupos } = await supabase.from('grupos').select('id, valor_cuota').eq('activo', true);
        if (grupos) {
            const total = grupos.length;
            const sumCuotas = grupos.reduce((acc, g) => acc + (g.valor_cuota || 0), 0);
            const avg = total > 0 ? Math.round(sumCuotas / total) : 0;
            setStats({ totalGrupos: total, promedioCuota: avg });
        }
    }

    async function fetchChartData() {
        setLoadingChart(true);
        try {
            const months = [];
            const now = new Date();

            // Generate last 6 months
            for (let i = 5; i >= 0; i--) {
                const date = subMonths(now, i);
                months.push({
                    dateObj: date, // Keep date object for comparison
                    name: format(date, 'MMM', { locale: es }),
                    ingresos: 0,
                    alumnosPagos: 0
                });
            }

            const startDate = startOfMonth(months[0].dateObj).toISOString();
            const endDate = endOfMonth(months[5].dateObj).toISOString();

            // Fetch payments. We sum the literal 'monto' stored in each payment record.
            const { data: pagos } = await supabase
                .from('pagos')
                .select('monto, mes')
                .eq('pagado', true)
                .gte('mes', startDate.split('T')[0])
                .lte('mes', endDate.split('T')[0]);

            if (pagos) {
                pagos.forEach(pago => {
                    const pagoMes = pago.mes.slice(0, 7); // YYYY-MM

                    const monthIndex = months.findIndex(m => {
                        const mStr = m.dateObj.toISOString().slice(0, 7);
                        return mStr === pagoMes;
                    });

                    if (monthIndex !== -1) {
                        months[monthIndex].ingresos += Number(pago.monto);
                        months[monthIndex].alumnosPagos += 1;
                    }
                });
            }

            setChartData(months);
        } catch (error) {
            console.error('Error fetching chart:', error);
        } finally {
            setLoadingChart(false);
        }
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-casr-green" />
                Finanzas
            </h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full text-casr-green">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Grupos Activos</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalGrupos}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Valor Promedio Cuota</p>
                        <p className="text-2xl font-bold text-gray-900">${stats.promedioCuota}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Ingresos Semestrales</h2>

                <div className="h-[400px] w-full">
                    {loadingChart ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-casr-green"></div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis
                                    yAxisId="left"
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    dataKey="alumnosPagos"
                                    name="Alumnos"
                                />
                                <Tooltip
                                    formatter={(value, name) => [
                                        name === 'ingresos' ? `$${value}` : value,
                                        name === 'ingresos' ? 'Ingresos' : 'Pagos (Cant.)'
                                    ]}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="ingresos" name="Ingresos ($)" fill="#087f5b" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="right" dataKey="alumnosPagos" name="Alumnos al día" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
