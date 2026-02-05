import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-50 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-gray-900">InciDocs</span>
                        </div>
                        <p className="text-gray-500 max-w-xs">
                            Plataforma robusta para la gestión y seguimiento de incidentes técnicos en tiempo real.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Producto</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Características</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Precios</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Guías</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Legal</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Privacidad</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Términos</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Cookies</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200">
                    <p className="text-center text-gray-400 text-sm">
                        © {new Date().getFullYear()} InciDocs Inc. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
