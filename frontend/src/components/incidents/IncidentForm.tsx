import { type FC } from 'react';
import { IncidentType, IncidentTypeLabels } from '../../types/incident';
import { useIncidentForm } from '../../hooks';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';

interface IncidentFormProps {
  onSuccess: () => void;
}

const IncidentForm: FC<IncidentFormProps> = ({ onSuccess }) => {
  const {
      selectedType,
      setSelectedType,
      errors,
      submitIncident,
  } = useIncidentForm(IncidentType.OTHER);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const result = await submitIncident(formData);
      
      if (result.success) {
          onSuccess();
          // Reset form
          (e.target as HTMLFormElement).reset();
          setSelectedType(IncidentType.OTHER);
      }
  };

  return (
      <div className="bg-white p-8 rounded-2xl shadow-xl shadow-indigo-100 border border-indigo-50">
          <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Reportar Incidente</h2>
              <p className="text-gray-500">Completa el formulario para que podamos ayudarte.</p>
          </div>

          {errors.form && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.form}
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Correo Electrónico"
                  placeholder="tu@email.com"
                  error={errors.email}
              />

              <Input
                  id="lineNumber"
                  name="lineNumber"
                  type="text"
                  label="Número de Línea"
                  placeholder="0123456789"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  error={errors.lineNumber}
                  onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      target.value = target.value.replace(/[^0-9]/g, '');
                  }}
              />

              <Select
                  id="incidentType"
                  name="incidentType"
                  label="Tipo de Incidente"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as IncidentType)}
                  error={errors.incidentType}
                  options={Object.entries(IncidentTypeLabels).map(([value, label]) => ({
                      value,
                      label,
                  }))}
              />

              <TextArea
                  id="description"
                  name="description"
                  label="Descripción"
                  optional={selectedType !== IncidentType.OTHER}
                  placeholder="Cuéntanos un poco más sobre lo que sucede..."
                  rows={4}
                  error={errors.description}
              />

              <Button type="submit" fullWidth isLoading={false}>
                  Enviar Reporte
              </Button>
          </form>
      </div>
  );
};

export default IncidentForm;
