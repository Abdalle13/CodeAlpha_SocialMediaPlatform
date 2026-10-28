import { createApp } from './app.js';
import { config, validateEnv } from './config/env.js';

const app = createApp();

const envStatus = validateEnv();
if (!envStatus.valid) {
  console.warn(`[Veyra Server Warning] Missing production variables: ${envStatus.missing.join(', ')}`);
}

const server = app.listen(config.port, () => {
  console.log(`Veyra Server listening on port ${config.port} in ${config.env} mode`);
});

export default server;

