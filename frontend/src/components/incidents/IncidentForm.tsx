import { useState } from 'react';
import { IncidentType, IncidentTypeLabels } from '../../types/incident';
import type { CreateIncidentRequest } from '../../types/incident';

const IncidentForm: React.FC = () => {
    const [formData, setFormData] = useState<CreateIncidentRequest>({
        email: '',
        lineNumber: '',
        incidentType: IncidentType.OTHER,
        description: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('Incident submitted:', formData);
        setIsSubmitting(false);
        setSubmitted(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as IncidentType }));
    };

    if (submitted) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-xl shadow-indigo-100 border border-indigo-50 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reporte Enviado!</h2>
                <p className="text-gray-500 mb-6">Hemos recibido tu reporte de incidente. Un técnico revisará tu caso pronto.</p>
                <button
                    onClick={() => setSubmitted(false)}
                    className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
                >
                    Enviar otro reporte
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-indigo-100 border border-indigo-50">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Reportar Incidente</h2>
                <p className="text-gray-500">Completa el formulario para que podamos ayudarte.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Correo Electrónico
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="tu@email.com"
                    />
                </div>

                <div>
                    <label htmlFor="lineNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Línea
                    </label>
                    <input
                        type="text"
                        id="lineNumber"
                        name="lineNumber"
                        required
                        value={formData.lineNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="0123456789"
                    />
                </div>

                <div>
                    <label htmlFor="incidentType" className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Incidente
                    </label>
                    <select
                        id="incidentType"
                        name="incidentType"
                        required
                        value={formData.incidentType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')]"
                    >
                        {Object.entries(IncidentTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción <span className="text-gray-400 font-normal">(Opcional)</span>
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                        placeholder="Cuéntanos un poco más sobre lo que sucede..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enviando...
                        </>
                    ) : (
                        'Enviar Reporte'
                    )}
                </button>
            </form>
        </div>
    );
};

export default IncidentForm;
