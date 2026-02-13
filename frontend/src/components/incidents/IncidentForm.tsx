import { useActionState } from 'react';
import type { FC } from 'react';
import { IncidentType, IncidentTypeLabels } from '../../types/incident';
import type { CreateIncidentRequest } from '../../types/incident';
import { useIncidentForm } from '../../hooks';
import { getFormString, isIncidentType } from '../../utils/typeGuards';
import SuccessModal from '../modal/SuccessModal';

/**
 * IncidentForm refactorizado para React 19.
 * Utiliza 'useIncidentForm' hook para separar lógica de estado y API del render.
 * Utiliza 'useActionState' para gestionar el estado de la mutación y la carga.
 */
const IncidentForm: FC = () => {
    const {
        selectedType,
        setSelectedType,
        error,
        isModalOpen,
        closeModal,
        submitIncident,
    } = useIncidentForm(IncidentType.OTHER);

    // Action wrapper for React 19 form actions
    const submitAction = async (_prevState: unknown, formData: FormData) => {
        const rawType = getFormString(formData, 'incidentType');

        const data: CreateIncidentRequest = {
            email: getFormString(formData, 'email'),
            lineNumber: getFormString(formData, 'lineNumber'),
            incidentType: isIncidentType(rawType) ? rawType : IncidentType.OTHER,
            description: getFormString(formData, 'description') || undefined,
        };

        return submitIncident(data);
    };

    const [, formAction, isPending] = useActionState(submitAction, null);

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-indigo-100 border border-indigo-50">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Reportar Incidente</h2>
                <p className="text-gray-500">Completa el formulario para que podamos ayudarte.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            <form action={formAction} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Correo Electrónico
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                        placeholder="tu@email.com"
                        disabled={isPending}
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                        placeholder="0123456789"
                        disabled={isPending}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onInput={(e) => {
                            const target = e.target as HTMLInputElement;
                            target.value = target.value.replace(/[^0-9]/g, '');
                        }}
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
                        value={selectedType}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (isIncidentType(val)) setSelectedType(val);
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] disabled:bg-gray-50 disabled:text-gray-400"
                        disabled={isPending}
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
                        Descripción {selectedType !== IncidentType.OTHER && <span className="text-gray-400 font-normal">(Opcional)</span>}
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        required={selectedType === IncidentType.OTHER}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none disabled:bg-gray-50 disabled:text-gray-400"
                        placeholder="Cuéntanos un poco más sobre lo que sucede..."
                        disabled={isPending}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {isPending ? (
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

            <SuccessModal isOpen={isModalOpen} onClose={closeModal} />
        </div>
    );
};

export default IncidentForm;
