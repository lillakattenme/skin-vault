import { createClient } from '@supabase/supabase-js';
import {configured,supabaseUrl,supabaseKey} from './config';
export const supabase=configured?createClient(supabaseUrl,supabaseKey):null;
export function database(){if(!supabase)throw new Error('Облачное хранилище пока не подключено');return supabase;}
