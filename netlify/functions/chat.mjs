import { getStore } from "@netlify/blobs";
import OpenAI from "openai";
import { randomUUID } from "node:crypto";

const sessions=getStore("scw-chat-sessions");
const leads=getStore("scw-quote-leads");
const json=(body,status=200,cookie)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...(cookie?{"Set-Cookie":cookie}:{})}});
const greeting="Hello, welcome to Solace Cyber Workstations. We can help with authorized cybersecurity, ethical hacking, digital forensics, incident response, threat modeling, remediation, and lawful digital-asset tracing. What can we help you with today?";
const fields=["name","email","phone","company"];
const labels={name:"your name",email:"your email address",phone:"your phone number",company:"your company or organization"};
const declines=s=>/^(skip|prefer not|rather not|decline|no thanks|not comfortable|pass|none|no|i don.t want to share)[.! ]*$/i.test(s.trim());
const safe=s=>String(s??"").trim().slice(0,3000);
const nextField=d=>fields.find(f=>!d.details[f]&&!d.declined.includes(f));
const askField=f=>({name:"What name should we use for this request?",email:"What email address should our team use to follow up?",phone:"What phone number should our team use to follow up?",company:"What company or organization should we associate with this request?"})[f];
const system=`You are the friendly professional support agent for Zenith Hackers Intelligence, representing SOLACE CYBERWORKSTATIONS. Speak as the business using “we”, “us”, and “our”. Never claim to be human. Help with authorized cybersecurity, ethical hacking, forensics, incident response, threat modeling, remediation, verification, and lawful asset/crypto tracing or quote requests.

Relevant services: Vulnerability Assessment & Penetration Testing; Web Application Security; Network & Endpoint Testing; Social Engineering & Configuration Reviews; Forensics & Incident Response; Threat Modeling & Consulting. Only assist with systems and assets the client owns or is explicitly authorized to assess. Never help break into third-party accounts, steal credentials, evade detection, or conduct unlawful tracing. Never ask for passwords, seed phrases, private keys, one-time codes, or identity documents.

Explain scope, authorization, evidence-based methods, realistic expectations, and limitations. Never guarantee crypto recovery, tracing, or any specific outcome. If unsure, be honest and offer a team member follow-up. Do not invent business contact details. Keep replies concise, professional, friendly, and ask no more than one question per message. When a quote is requested, use the website's quote/contact collection flow. Never claim a quote has been sent or a team has been notified unless that has actually happened.`;
export default async function handler(request){
 if(request.method==="OPTIONS")return new Response(null,{status:204});
 if(request.method!=="POST")return json({error:"Method not allowed"},405);
 const origin=request.headers.get("origin"),url=new URL(request.url);
 if(origin&&origin!==url.origin)return json({error:"Please use chat on our website."},403);
 try{
  const raw=await request.text();if(raw.length>20000)return json({error:"Please keep the conversation shorter."},413);
  const body=JSON.parse(raw),messages=Array.isArray(body.messages)?body.messages.slice(-16).map(m=>({role:m?.role==="assistant"?"assistant":"user",content:safe(m?.content)})).filter(m=>m.content):[];
  const latest=messages.filter(m=>m.role==="user").at(-1)?.content||"";
  if(!latest)return json({error:"Please enter a message."},400);
  let id=request.headers.get("cookie")?.match(/(?:^|;\s*)scw_chat=([0-9a-f-]{36})(?:;|$)/i)?.[1];
  if(!id||!/^[0-9a-f-]{36}$/i.test(id))id=randomUUID();
  let session=await sessions.get("session:"+id,{type:"json"}).catch(()=>null);
  if(!session)session={draft:{intent:null,awaiting:null,details:{},declined:[],submitted:false},messages:[{role:"assistant",content:greeting}],createdAt:new Date().toISOString()};
  const draft=session.draft;
  let reply="";
  const quoteIntent=/\b(quote|quotation|estimate|pricing proposal|price proposal|cost estimate)\b/i.test(latest);
  const followupIntent=/\b(contact me|follow.?up|speak to (a )?(human|person|team member)|talk to (a )?(human|person|team member)|team member|call me|email me)\b/i.test(latest);
  if(draft.awaiting==="consent"){
    if(/^(yes|yes please|save request|submit|send|confirm|i agree)[.! ]*$/i.test(latest)){
      draft.submitted=true;draft.awaiting=null;session.messages=[];
      const lead={id,intent:draft.intent||"quote",details:draft.details,declinedFields:draft.declined,createdAt:new Date().toISOString(),status:"new",consented:true};
      await leads.setJSON("lead:"+id,lead);
      draft.details={};draft.declined=[];
      let notified=false;
      const notificationEmail=process.env.LEADS_NOTIFICATION_EMAIL||"Solace.cyber.workstations@mail.com";
      if(process.env.RESEND_API_KEY&&notificationEmail&&process.env.LEADS_FROM_EMAIL){
        try{
          const mail=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.LEADS_FROM_EMAIL,to:[notificationEmail],subject:lead.intent==="quote"?"New Solace Cyber Workstations quote request":"New Solace Cyber Workstations support lead",text:"A visitor consented to a "+lead.intent+" follow-up.\n\nName: "+(lead.details.name||"Skipped")+"\nEmail: "+(lead.details.email||"Skipped")+"\nPhone: "+(lead.details.phone||"Skipped")+"\nCompany: "+(lead.details.company||"Skipped")+"\n\nReview scope and authorization before offering work. Do not promise recovery outcomes."})});
          notified=mail.ok;
        }catch(error){console.error("Lead notification failed",error)}
      }
      reply=notified
        ?(lead.intent==="quote"?"Thank you. We’ve saved your request and notified our team to review it and prepare a quote. A team member will follow up using the contact details you provided. Scope, authorization, fees, and limitations must be agreed before any work begins.":"Thank you. We’ve saved your request and notified our team to follow up using the contact details you provided. We cannot guarantee a response time or a particular outcome.")
        :(lead.intent==="quote"?"Thank you. We’ve saved your quote request, but automatic team notifications are not configured yet. Please also contact our team directly so the request can be reviewed. Scope, authorization, fees, and limitations must be agreed before work begins.":"Thank you. We’ve saved your request, but automatic team notifications are not configured yet. Please contact our team directly for follow-up. We cannot guarantee a response time or a particular outcome.");
    }else if(declines(latest)){
      draft.awaiting=null;draft.intent=null;draft.details={};draft.declined=[];session.messages=[];
      reply="Understood. We won't submit your contact details as a quote request. You can continue asking general questions here or contact our team directly when you're ready.";
    }else{
      reply="Please confirm whether we may save these details for our team to review your quote request. Would you like us to save and submit the request?";
    }
  }else if(draft.awaiting){
    const field=draft.awaiting;
    if(declines(latest)){draft.declined.push(field);draft.awaiting=nextField(draft);}
    else{
      const value=safe(latest).replace(/[\u0000-\u001f]/g,"").slice(0,254);
      const valid=field==="email"?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value):field==="phone"?value.replace(/\D/g,"").length>=7:value.length>=1;
      if(!valid){reply=field==="email"?"That email address doesn't look complete. Please enter a valid email address, or type “skip” to continue.":field==="phone"?"Please enter a phone number with at least seven digits, or type “skip” to continue.":"Please enter a short answer, or type “skip” to continue.";}
      else{draft.details[field]=value;draft.awaiting=nextField(draft);}
    }
    if(!reply){
      if(draft.awaiting)reply="Thanks. "+askField(draft.awaiting);
      else{draft.awaiting="consent";reply="May we save these details so our team can review your quote request and follow up?";}
    }
  }else if(!draft.submitted&&(quoteIntent||followupIntent)){
    draft.intent=quoteIntent?"quote":"followup";draft.awaiting="name";
    reply=(draft.intent==="quote"?"We can help you request a quote for authorized work.":"We can arrange a team follow-up about authorized support.")+" We’ll ask for contact details one at a time, and you can skip any field. "+askField("name");
  }else{
    const key=process.env.OPENAI_API_KEY;
    if(!key)return json({error:"Live AI support is not configured yet. Please use the assessment contact form while setup is completed."},503);
    const client=new OpenAI({apiKey:key,timeout:25000,maxRetries:1});
    const completion=await client.chat.completions.create({model:process.env.OPENAI_MODEL||"gpt-4o-mini",messages:[{role:"system",content:system},...messages],temperature:0.3,max_tokens:550});
    reply=completion.choices?.[0]?.message?.content?.trim()||"We can have a team member follow up. Please describe the general service you need, without sharing passwords, seed phrases, or private keys.";
    if(!draft.submitted&&/\b(quote|quotation|estimate|pricing proposal|price proposal|cost estimate)\b/i.test(reply)){
      draft.intent="quote";draft.awaiting="name";reply="We can help you request a quote for authorized work. We’ll ask for contact details one at a time, and you can skip any field. "+askField("name");
    }
  }
  session.draft=draft;
  session.messages=[...(session.messages||[]),{role:"user",content:latest},{role:"assistant",content:reply}].slice(-40);
  session.updatedAt=new Date().toISOString();
  await sessions.setJSON("session:"+id,session);
  const cookie="scw_chat="+id+"; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400"+(url.protocol==="https:"?"; Secure":"");
  return json({reply},200,cookie);
 }catch(err){console.error("Support chat error",err);return json({error:"Our support assistant is temporarily unavailable. Please try again or use the contact form."},502)}
}
