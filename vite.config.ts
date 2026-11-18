import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({mode})=>({base:'./',plugins:[react()],build:{rolldownOptions:{output:{codeSplitting:loadEnv(mode,'.','VITE_').VITE_DEMO!=='true'}}}}));
