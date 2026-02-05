import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                            InciDocs
                        </span>
                    </div>

                    <nav className="hidden md:flex space-x-8">
                        <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Dashboard</a>
                        <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Incidentes</a>
                        <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Soporte</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                            Iniciar Sesión
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-md shadow-indigo-200 transition-all active:scale-95">
                            Reportar
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
