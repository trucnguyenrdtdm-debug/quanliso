const allowed = new Set([
 'loginPasswordV51','logout','getDashboard','getLayoutV57','saveLayoutV57','resetLayoutV57',
 'saveAppV5','deleteAppV5','toggleStatusV5','toggleFavoriteV5','listUsersV5','saveUserV5',
 'saveCategoryV5','listAuditV5','exportBackupV5','saveGlobalThemeV52','resetGlobalThemeV52',
 'saveAppOrderV54','uploadAppImageV552','getDesignV58','saveDesignV58','resetDesignV58'
]);
const reply=(code,data)=>new Response(JSON.stringify(data),{status:code,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default async (request)=>{
 if(request.method!=='POST')return reply(405,{ok:false,error:'Chỉ chấp nhận POST'});
const endpoint = process.env.GAS_WEBAPP_URL;
const secret = process.env.V6_BRIDGE_SECRET;
 if(!endpoint||!secret)return reply(503,{ok:false,error:'Chưa cấu hình kết nối Google Apps Script trên Netlify.'});
 try{
  if(Number(request.headers.get('content-length')||0)>3000000)return reply(413,{ok:false,error:'Yêu cầu quá lớn'});
  const body=await request.json();
  if(!allowed.has(body.name)||!Array.isArray(body.args))return reply(400,{ok:false,error:'Yêu cầu không hợp lệ'});
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);
  try{
   const upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({name:body.name,args:body.args,secret}),signal:controller.signal,redirect:'follow'});
   const raw=await upstream.text();let data;try{data=JSON.parse(raw)}catch{throw Error('Google Apps Script chưa trả JSON. Kiểm tra URL /exec và quyền triển khai.')}
   return reply(upstream.ok?200:502,data);
  }finally{clearTimeout(timeout)}
 }catch(e){return reply(502,{ok:false,error:'Không kết nối được máy chủ Apps Script: '+String(e.message||e)});}
};
