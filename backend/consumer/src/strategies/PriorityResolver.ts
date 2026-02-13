import { IncidentType, Priority } from '../types';
import type { IPriorityStrategy } from './IPriorityStrategy';
import { CriticalServiceStrategy } from './CriticalServiceStrategy';
import { DegradedServiceStrategy } from './DegradedServiceStrategy';
import { MinorIssuesStrategy } from './MinorIssuesStrategy';
import { DefaultPriorityStrategy } from './DefaultPriorityStrategy';

export class PriorityResolver {
    private readonly strategies: Map<IncidentType, IPriorityStrategy>;
    private readonly fallback: IPriorityStrategy;

    constructor(
        strategies?: IPriorityStrategy[],
        fallback?: IPriorityStrategy
    ) {
        this.fallback = fallback ?? new DefaultPriorityStrategy();

        const allStrategies = strategies ?? [
            new CriticalServiceStrategy(),
            new DegradedServiceStrategy(),
            new MinorIssuesStrategy(),
        ];

        this.strategies = new Map();
        for (const strategy of allStrategies) {
            for (const type of strategy.supportedTypes) {
                this.strategies.set(type, strategy);
            }
        }
    }

    resolve(type: IncidentType): Priority {
        const strategy = this.strategies.get(type) ?? this.fallback;
        return strategy.calculate(type);
    }
}
