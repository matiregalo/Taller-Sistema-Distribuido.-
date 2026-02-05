import type { FC } from 'react';
import IncidentReportPage from './pages/IncidentReport/IncidentReportPage';

/**
 * Aplicación principal con routing simplificado (o directo) 
 * según mejores prácticas de modularización.
 */
const App: FC = () => {
  return (
    <div className="app">
      {/* 
        En un proyecto real escalable aquí usaríamos react-router-dom,
        pero por ahora renderizamos la página de incidentes directamente.
      */}
      <IncidentReportPage />
    </div>
  );
}

export default App;
