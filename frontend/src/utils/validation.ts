import { z } from 'zod';
import { IncidentType } from '../types/incident';

export const incidentSchema = z.object({
    email: z.string()
        .email('Debe ser un correo electrónico válido')
        .min(1, 'El correo electrónico es obligatorio'),

    lineNumber: z.string()
        .min(8, 'El número de línea debe tener al menos 8 dígitos')
        .regex(/^\d+$/, 'Solo se permiten números'),

    incidentType: z.nativeEnum(IncidentType),

    description: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.incidentType === IncidentType.OTHER) {
        if (!data.description || data.description.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'La descripción es obligatoria para este tipo de incidente',
                path: ['description'],
            });
        }
    }
});

export type IncidentFormData = z.infer<typeof incidentSchema>;
