import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";

const store = getStore("scw-community");
const json = (body, status=200, extra={}) => Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...extra}});
const clean = (v,max=2500) => String(v??"").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,"").trim().slice(0,max);
async function readEntries(){try{const v=await store.get("entries.json",{type:"json"});return Array.isArray(v)?v:[]}catch{return []}}
async function saveEntries(items){await store.setJSON("entries.json",items)}
function publicEntry(x){const {id,type,name,title,text,article,rating,createdAt,imageId}=x;return{id,type,name,title,text,article,rating,createdAt,imageData:imageId?('/.netlify/functions/community?action=image&id='+encodeURIComponent(imageId)):null}}
export default async function handler(request){
 if(request.method==="OPTIONS")return new Response(null,{status:204});
 const url=new URL(request.url);
 try{
  if(request.method==="GET"&&url.searchParams.get("action")==="image"){
   const id=clean(url.searchParams.get("id"),80);
   if(!/^[a-f0-9-]{20,80}$/i.test(id))return new Response("Invalid image id",{status:400});
   const blob=await store.get("image:"+id,{type:"arrayBuffer"});
   if(!blob)return new Response("Image not found",{status:404});
   const meta=await store.getMetadata("image:"+id),type=meta?.metadata?.contentType;
   if(!["image/jpeg","image/png","image/webp"].includes(type))return new Response("Image not found",{status:404});
   return new Response(blob,{headers:{"Content-Type":type,"Cache-Control":"public, max-age=86400","X-Content-Type-Options":"nosniff"}});
  }
  if(request.method==="GET"){
   const all=await readEntries();
   return json({comments:all.filter(x=>x.type==="comment").map(publicEntry),posts:all.filter(x=>x.type==="post").map(publicEntry),reviews:all.filter(x=>x.type==="review").map(publicEntry)});
  }
  if(request.method!=="POST")return json({error:"Method not allowed"},405);
  const body=await request.json();
  const action=clean(body.action,20),name=clean(body.name,80),text=clean(body.text,action==="post"?5000:2500);
  if(name.length<1||text.length<2)return json({error:"Please provide your name and a message."},400);
  if(/\b(seed phrase|recovery phrase|private key|password)\s*[:=]/i.test(text))return json({error:"Please remove passwords, seed phrases, and private keys before posting."},400);
  const all=await readEntries();
  if(all.length>=10000)return json({error:"The community has reached its submission limit. Please try again later."},429);
  const item={id:randomUUID(),type:action,name,text,createdAt:new Date().toISOString()};
  if(action==="comment"){
   item.article=clean(body.article,220);
   if(!item.article)return json({error:"Article title is required."},400);
  }else if(action==="post"){
   item.title=clean(body.title,140);
   if(item.title.length<3)return json({error:"Please add a post title."},400);
   if(body.imageData){
    const match=String(body.imageData).match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if(!match)return json({error:"Image must be JPEG, PNG, or WebP."},400);
    const bytes=Buffer.from(match[2],"base64");
    if(!bytes.length||bytes.length>2*1024*1024)return json({error:"Image must be between 1 byte and 2 MB."},413);
    const id=randomUUID();
    await store.set("image:"+id,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),{metadata:{contentType:match[1]}});
    item.imageId=id;
   }
  }else if(action==="review"){
   item.rating=Number(body.rating);
   if(!Number.isInteger(item.rating)||item.rating<1||item.rating>5)return json({error:"Choose a rating from 1 to 5."},400);
  }else return json({error:"Unknown submission type."},400);
  all.push(item);
  await saveEntries(all);
  return json({ok:true,item:publicEntry(item)},201);
 }catch(err){console.error("Community function error",err);return json({error:"Community service is temporarily unavailable. Confirm that the site is deployed on Netlify with Blobs enabled."},500)}
}
