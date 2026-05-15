import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
    ok: true;
}

@Controller('health')
export class HealthController {
    @Get()
    public getHealth(): HealthResponse {
        return { ok: true };
    }
}
