import {useState} from 'react';
import type {Skin} from '../lib/types';
export default function Art({skin}:{skin:Skin}){const [failed,setFailed]=useState(false);return failed?<span className="image-fallback">{skin.weapon}</span>:<img src={skin.image} alt={skin.name} loading="lazy" onError={()=>setFailed(true)}/>;}
