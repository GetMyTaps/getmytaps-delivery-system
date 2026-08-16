const MAX_FILES = 6;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg','image/png','image/webp','application/pdf']);

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

function envValue(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function cleanDataUrl(value) {
  if (typeof value !== 'string') return null;
  const m = value.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!m || !ALLOWED.has(m[1])) return null;
  const approxBytes = Math.floor(m[2].length * 3 / 4);
  if (approxBytes > MAX_FILE_BYTES) return null;
  return { mime: m[1], dataUrl: value };
}

function schema() {
  return {
    type:'object', additionalProperties:false,
    properties:{
      customer:{type:'string'}, date:{type:'string'}, reference:{type:'string'},
      contact:{type:'string'}, address:{type:'string'}, town:{type:'string'}, postcode:{type:'string'},
      items:{type:'array',items:{type:'object',additionalProperties:false,properties:{
        code:{type:'string'}, description:{type:'string'}, quantity:{type:'number'},
        status:{type:'string',enum:['STOCK','ORDER']}, confidence:{type:'number'}
      },required:['code','description','quantity','status','confidence']}},
      warnings:{type:'array',items:{type:'string'}}
    },
    required:['customer','date','reference','contact','address','town','postcode','items','warnings']
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res,405,{error:'Method not allowed'});

  const apiKey = envValue('OPENAI_API_KEY');
  const model = envValue('OPENAI_MODEL') || 'gpt-5-mini';
  const allowedOrigin = envValue('APP_ORIGIN');
  const origin = req.headers.origin || '';

  // Never expose the key. This message safely identifies a deployment/configuration problem.
  if (!apiKey) {
    console.error('CONFIG_MISSING_OPENAI_API_KEY', {environment:process.env.VERCEL_ENV || 'unknown', deployment:process.env.VERCEL_URL || 'unknown'});
    return send(res,503,{error:'Vercel has not injected OPENAI_API_KEY into this deployment. In Vercel Project Settings > Environment Variables, save OPENAI_API_KEY for Production, then redeploy the latest main-branch deployment.'});
  }

  if (allowedOrigin && origin && origin !== allowedOrigin) {
    console.error('CONFIG_ORIGIN_MISMATCH', {received:origin, configured:allowedOrigin});
    return send(res,403,{error:'APP_ORIGIN does not match this website. Set APP_ORIGIN to '+origin+' and redeploy.'});
  }

  let body=req.body;
  if(typeof body==='string'){try{body=JSON.parse(body)}catch{return send(res,400,{error:'Invalid request'})}}
  const rawFiles=Array.isArray(body?.files)?body.files:[];
  if(!rawFiles.length||rawFiles.length>MAX_FILES)return send(res,400,{error:`Upload 1-${MAX_FILES} pages at a time.`});
  const files=rawFiles.map(cleanDataUrl);
  if(files.some(x=>!x))return send(res,400,{error:'Unsupported file or file too large. Use JPG, PNG, WEBP or PDF up to 8 MB per page.'});

  const content=[{type:'input_text',text:'Read this GetMyTaps delivery note carefully. Extract customer details and every product line. A product is STOCK only when the document clearly marks or ticks it as in stock/ready; otherwise use ORDER. Preserve product codes exactly where readable. Do not combine duplicate lines. Use YYYY-MM-DD for an unambiguous date; otherwise return the visible date text. If a field is unreadable use an empty string and add a warning. Confidence is 0 to 1 for each line. Do not infer suppliers; suppliers are matched separately from the supplier database.'}];
  for(const f of files){
    if(f.mime==='application/pdf')content.push({type:'input_file',filename:'delivery-note.pdf',file_data:f.dataUrl});
    else content.push({type:'input_image',image_url:f.dataUrl,detail:'high'});
  }

  try {
    const r=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({model,store:false,input:[{role:'user',content}],text:{format:{type:'json_schema',name:'delivery_note',strict:true,schema:schema()}}})
    });
    if(!r.ok){
      let safe='OpenAI rejected the request.';
      if(r.status===401)safe='OpenAI rejected the API key. Create a new project API key, save it as OPENAI_API_KEY in Vercel Production, and redeploy.';
      else if(r.status===429)safe='OpenAI API usage is currently unavailable due to billing, quota, or rate limits. Check the OpenAI API project billing/usage settings.';
      else if(r.status===400)safe='OpenAI could not process this document request. Try one clear JPG/PNG page first.';
      console.error('OPENAI_REQUEST_FAILED',{status:r.status,model});
      return send(res,502,{error:safe});
    }
    const result=await r.json();
    const text=result.output_text||result.output?.flatMap(o=>o.content||[]).find(c=>c.type==='output_text')?.text;
    if(!text)return send(res,502,{error:'OpenAI returned no structured delivery-note data.'});
    return send(res,200,JSON.parse(text));
  } catch(err) {
    console.error('ANALYSIS_FAILED',{message:err?.message||'unknown'});
    return send(res,500,{error:'Delivery-note analysis failed before a result was returned.'});
  }
}
