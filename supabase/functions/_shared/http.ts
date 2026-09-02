const defaultOrigins=["http://localhost:3000","https://sos.resolveulab.com.br","https://sos.resolveuapp.com.br"];
export const origins=[...new Set([...defaultOrigins,...(Deno.env.get("ALLOWED_ORIGINS")||"").split(",").map(value=>value.trim()).filter(Boolean)])];
export function headers(req:Request){const origin=req.headers.get("origin")||"";return{"cache-control":"no-store","x-content-type-options":"nosniff","x-robots-tag":"noindex, nofollow, noarchive","referrer-policy":"no-referrer","access-control-allow-origin":origins.includes(origin)?origin:origins[0],"access-control-allow-headers":"authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage","access-control-allow-methods":"POST, OPTIONS","vary":"origin","x-correlation-id":crypto.randomUUID()}}
export function response(req:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...headers(req),"content-type":"application/json"}})}
export function preflight(req:Request){return new Response(null,{status:204,headers:headers(req)})}
export function validMethod(req:Request){return req.method==="POST"}
