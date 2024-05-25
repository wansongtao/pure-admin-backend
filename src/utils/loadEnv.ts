import * as dotenv from 'dotenv';

export default function loadEnv(env: string) {
  switch (env) {
    case 'production':
      dotenv.config({ path: '.env.production' });
      break;
    case 'test':
      dotenv.config({ path: '.env.test' });
      break;
    default:
      dotenv.config({ path: '.env.development' });
  }
}
