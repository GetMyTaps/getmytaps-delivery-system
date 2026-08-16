function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(body))}
function env(n){return (process.env[n]||'').trim()}
function clean(rows){if(!Array.isArray(rows))return [];return rows.slice(0,5000).map(x=>({code:String(x?.code||'').trim().slice(0,120),desc:String(x?.desc||'').trim().slice(0,500),supplier:String(x?.supplier||'').trim().slice(0,160)})).filter(x=>x.code||x.desc||x.supplier)}
async function kv(method,key,value){const url=env('KV_REST_API_URL')||env('UPSTASH_REDIS_REST_URL');const token=env('KV_REST_API_TOKEN')||env('UPSTASH_REDIS_REST_TOKEN');if(!url||!token)throw new Error('DATABASE_NOT_CONFIGURED');const cmd=method==='GET'?['GET',key]:['SET',key,JSON.stringify(value)];const r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(cmd)});if(!r.ok)throw new Error('DATABASE_REQUEST_FAILED');const j=await r.json();return j.result}
export default async function handler(req,res){
 const allowed=env('APP_ORIGIN'),origin=req.headers.origin||'';if(allowed&&origin&&origin!==allowed)return send(res,403,{error:'Origin not allowed'});
 try{
  if(req.method==='GET'){const raw=await kv('GET','getmytaps:suppliers');let rows=[];if(raw){try{rows=JSON.parse(raw)}catch{}}return send(res,200,{suppliers:clean(rows)})}
  if(req.method==='PUT'){let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b)}catch{return send(res,400,{error:'Invalid request'})}}const rows=clean(b?.suppliers);await kv('SET','getmytaps:suppliers',rows);return send(res,200,{ok:true,count:rows.length})}
  return send(res,405,{error:'Method not allowed'});
 }catch(e){if(e.message==='DATABASE_NOT_CONFIGURED')return send(res,503,{error:'Central supplier database is not connected yet.'});console.error('SUPPLIER_DB_FAILED',e);return send(res,500,{error:'Supplier database request failed.'})}
}
