import { Container } from '@/kernel/di/Container';
import { HealthController } from '@/presentation/controllers/HealthController';

export const container = new Container();

container.bind(HealthController, HealthController, { scope: 'transient' });

container.validate();
