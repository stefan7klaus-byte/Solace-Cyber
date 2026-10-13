import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";

const store = getStore("scw-community");
const headers = { "content-type":"application/json; charset=utf-8", "cache-control":"no-store", "x-content-type-options":"nosniff" };
const json = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
const clean = (v, max=2500) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,"").trim().slice(0,max);
const validName = v => clean(v,80).length >= 1;
async function readEntries(){ try { const v=await store.get("entries.json",{type:"json"}); return Array.isArray(v)?v:[]; } catch { return []; } }
async function saveEntries(items){ await store.setJSON("entries.json",items); }
function publicEntry(x){ const {id,type,name,title,text,article,rating,createdAt,imageId}=x; return {id,type,name,title,text,article,rating,createdAt,imageData:imageId?('/.netlify/functions/community?action=image&id='+encodeURIComponent(imageId)):null}; }
export default async (req) => {
  const method=req.method||"GET";
  const url=new URL(req.url);
  if(method==="OPTIONS") return {statusCode:204,headers};
  try {
    if(method==="GET" && url.searchParams.get("action")==="image"){
      const id=clean(url.searchParams.get("id"),80);
      if(!/^[a-f0-9-]{20,80}$/i.test(id)) return {statusCode:400,headers,body:"Invalid image id"};
      const blob=await store.get("image:"+id,{type:"arrayBuffer"});
      if(!blob) return {statusCode:404,headers,body:"Image not found"};
      const meta=await store.getMetadata("image:"+id);
      const type=meta?.metadata?.contentType;
      if(!["image/jpeg","image/png","image/webp"].includes(type)) return {statusCode:404,headers,body:"Image not found"};
      return {statusCode:200,headers:{"content-type":type,"cache-control":"public, max-age=86400","x-content-type-options":"nosniff"},body:Buffer.from(blob).toString("base64"),isBase64Encoded:true};
    }
    if(method==="GET"){
      const all=await readEntries();
      return json(200,{comments:all.filter(x=>x.type==="comment").map(publicEntry),posts:all.filter(x=>x.type==="post").map(publicEntry),reviews:all.filter(x=>x.type==="review").map(publicEntry)});
    }
    if(method!=="POST") return json(405,{error:"Method not allowed"});
    const body=JSON.parse(req.body||"{}");
    const action=clean(body.action,20);
    const name=clean(body.name,80), text=clean(body.text,action==="post"?5000:2500);
    if(!validName(name)||text.length<2) return json(400,{error:"Please provide your name and a message."});
    if(/\b(seed phrase|recovery phrase|private key|password)\s*[:=]/i.test(text)) return json(400,{error:"Please remove passwords, seed phrases, and private keys before posting."});
    const all=await readEntries();
    if(all.length>=10000) return json(429,{error:"The community has reached its submission limit. Please try again later."});
    const item={id:randomUUID(),type:action,name,text,createdAt:new Date().toISOString()};
    if(action==="comment"){
      item.article=clean(body.article,220);
      if(!item.article) return json(400,{error:"Article title is required."});
    } else if(action==="post"){
      item.title=clean(body.title,140);
      if(item.title.length<3) return json(400,{error:"Please add a post title."});
      if(body.imageData){
        const match=String(body.imageData).match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
        if(!match) return json(400,{error:"Image must be JPEG, PNG, or WebP."});
        const bytes=Buffer.from(match[2],"base64");
        if(bytes.length>2*1024*1024) return json(413,{error:"Image must be 2 MB or smaller."});
        if(bytes.length<1) return json(400,{error:"Image file is empty."});
        const id=randomUUID();
        await store.set("image:"+id,bytes,{metadata:{contentType:match[1]}});
        item.imageId=id;
      }
    } else if(action==="review"){
      item.rating=Number(body.rating);
      if(!Number.isInteger(item.rating)||item.rating<1||item.rating>5) return json(400,{error:"Choose a rating from 1 to 5."});
    } else return json(400,{error:"Unknown submission type."});
    all.push(item);
    await saveEntries(all);
    return json(201,{ok:true,item:publicEntry(item)});
  } catch(err) {
    console.error("Community function error",err);
    return json(500,{error:"Community service is temporarily unavailable. Check that Netlify Blobs is enabled."});
  }
};
