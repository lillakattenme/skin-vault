// Pixels per animation frame at 60 Hz; the central viewport never scrolls.
export function edgeSpeed(y:number,height:number){
 const edge=Math.min(120,height/4);
 if(y<0||y>height||height<=0)return 0;
 if(y<edge)return -Math.ceil(18*(1-y/edge));
 if(y>height-edge)return Math.ceil(18*(1-(height-y)/edge));
 return 0;
}
export function startDragScroll(host:Window=window){
 let speed=0,frame=0,previous=0,stopped=false;
 const tick=(now:number)=>{if(stopped)return;const elapsed=previous?Math.min(now-previous,32):16.67;previous=now;if(speed)host.scrollBy({top:speed*elapsed/16.67,behavior:'instant' as ScrollBehavior});frame=host.requestAnimationFrame(tick);};
 const over=(e:DragEvent)=>{e.preventDefault();speed=edgeSpeed(e.clientY,host.innerHeight);};
 const leave=(e:DragEvent)=>{if(!e.relatedTarget)speed=0;};
 const stop=()=>{stopped=true;host.cancelAnimationFrame(frame);host.removeEventListener('dragover',over);host.removeEventListener('dragleave',leave);host.removeEventListener('drop',stop);host.removeEventListener('dragend',stop);host.removeEventListener('blur',stop);};
 host.addEventListener('dragover',over);host.addEventListener('dragleave',leave);host.addEventListener('drop',stop);host.addEventListener('dragend',stop);host.addEventListener('blur',stop);frame=host.requestAnimationFrame(tick);return stop;
}
