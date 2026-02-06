import type { FC } from 'react';
import Layout from '../../components/layout/Layout';
import IncidentForm from '../../components/incidents/IncidentForm';

interface IncidentReportPageProps {
    onOpenStressTest?: () => void;
}

const IncidentReportPage: FC<IncidentReportPageProps> = ({ onOpenStressTest }) => {
    return (
        <Layout>
            <div className="bg-gradient-to-b from-indigo-50/50 to-white py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {onOpenStressTest && (
                        <div className="flex justify-end mb-2">
                            <button
                                type="button"
                                onClick={onOpenStressTest}
                                className="text-sm text-amber-600 hover:text-amber-800 font-medium"
                            >
                                ⚡ Pruebas de estrés
                            </button>
                        </div>
                    )}
                    <div className="flex flex-col lg:flex-row gap-12 items-center">
                        {/* Left side: Content */}
                        <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold tracking-wide uppercase">
                                Centro de Ayuda
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                                Estamos aquí para <span className="text-indigo-600">ayudarte</span> con tus problemas.
                            </h1>
                            <p className="text-xl text-gray-500 max-w-2xl">
                                Nuestro equipo técnico está listo para resolver cualquier inconveniente con tu servicio de manera rápida y eficiente.
                            </p>

                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <div className="flex flex-col gap-2">
                                    <span className="text-3xl font-bold text-gray-900 tracking-tight">24/7</span>
                                    <span className="text-gray-500 font-medium">Soporte Continuo</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-3xl font-bold text-gray-900 tracking-tight">&lt; 2h</span>
                                    <span className="text-gray-500 font-medium">Tiempo de Respuesta</span>
                                </div>
                            </div>
                        </div>

                        {/* Right side: Form */}
                        <div className="lg:w-1/2 w-full max-w-xl">
                            <IncidentForm />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default IncidentReportPage;
