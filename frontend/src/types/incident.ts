export const IncidentType = {
    NO_SERVICE: 'NO_SERVICE',
    INTERMITTENT_SERVICE: 'INTERMITTENT_SERVICE',
    SLOW_CONNECTION: 'SLOW_CONNECTION',
    ROUTER_ISSUE: 'ROUTER_ISSUE',
    BILLING_QUESTION: 'BILLING_QUESTION',
    OTHER: 'OTHER',
} as const;

export type IncidentType = typeof IncidentType[keyof typeof IncidentType];

export const IncidentTypeLabels: Record<IncidentType, string> = {
    [IncidentType.NO_SERVICE]: 'Sin servicio',
    [IncidentType.INTERMITTENT_SERVICE]: 'Servicio intermitente',
    [IncidentType.SLOW_CONNECTION]: 'Conexión lenta',
    [IncidentType.ROUTER_ISSUE]: 'Problema con el router',
    [IncidentType.BILLING_QUESTION]: 'Consulta de facturación',
    [IncidentType.OTHER]: 'Otro',
};

export interface CreateIncidentRequest {
    email: string;
    lineNumber: string;
    incidentType: IncidentType;
    description?: string;
}
