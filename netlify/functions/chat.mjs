import { getStore } from "@netlify/blobs";
import OpenAI from "openai";
import { randomUUID } from "node:crypto";

const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const json=(statusCode,body)=>({statusCode,headers,body:JSON.stringify(body)});
const SYSTEM=`You are the friendly, professional support agent for Zenith Hackers Intelligence, representing SOLACE CYBERWORKSTATIONS. Speak as the business using “we”, “us”, and “our”; do not claim to be a human. Help with authorized cybersecurity and ethical hacking, digital forensics, incident response, threat modeling, remediation, verification, lawful asset/crypto tracing, and quote requests.

Relevant services: Vulnerability Assessment & Penetration Testing; Web Application Security; Network & Endpoint Testing; Social Engineering & Configuration Reviews; Forensics & Incident Response; Threat Modeling & Consulting; and digital-asset access assessment. Only assist with systems/assets the client owns or is explicitly authorized to assess. Never help break into third-party accounts, evade detection, steal credentials, or conduct unlawful tracing. Do not ask users to reveal passwords, seed phrases, private keys, authentication codes, or sensitive identity documents.

Be clear about scope, legal authorization, evidence-based methods, realistic expectations, and limitations. Never guarantee crypto recovery, tracing, or a particular outcome. Be especially careful not to imply recovered funds are assured. If you cannot answer reliably, say so and offer a team member follow-up. Business contact details may be available elsewhere in the site; do not invent details.

Ask at most ONE question per message. For a quote request, explain that a team member can prepare and send a quote after collecting the required contact details. Collect these fields one at a time, in this order: Name (required), Email (required), Phone (required), Company (required). Ask for the next missing field only after the prior one is answered. If a user declines a field, acknowledge that and continue without stalling; do not repeatedly pressure them. Keep the conversation focused, respectful, and concise. Do not claim a quote has been sent or a team has been notified unless that has actually happened.`;
function safe(v,max=3000){return String(v??"").trim().slice(0,max)}
export default async (req)=>{
 if(req.method==="OPTIONS")return {statusCode:204,headers};
 if(req.method!=="POST")return json(405,{error:"Method not allowed"});
 try{
  const body=JSON.parse(req.body||"{}");
  const messages=Array.isArray(body.messages)?body.messages.slice(-16).map(m=>({role:m?.role==="assistant"?"assistant":"user",content:safe(m?.content)})).filter(m=>m.content):[];
  if(!messages.length)return json(400,{error:"Send a message to start the conversation."});
  const key=process.env.OPENAI_API_KEY;
  if(!key)return json(503,{error:"Live support is not configured yet. Please use the assessment contact form while our team completes setup."});
  const client=new OpenAI({apiKey:key});
  const result=await client.chat.completions.create({model:process.env.OPENAI_MODEL||"gpt-4o-mini",messages:[{role:"system",content:SYSTEM},...messages],temperature:0.3,max_tokens:550});
  const reply=result.choices?.[0]?.message?.content?.trim();
  if(!reply)throw new Error("Empty model response");
  // Store only explicitly offered quote/contact details when they are present in the latest user turn.
  // Do not persist general chat transcripts or credentials.
  const latest=messages.filter(m=>m.role==="user").at(-1)?.content||"";
  if(/\b(quote|quotation|estimate|proposal)\b/i.test(messages.map(m=>m.content).join(" ")) && /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(latest)){
    const email=latest.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
    const store=getStore("scw-leads");
    await store.setJSON("lead:"+randomUUID(),{email:email.slice(0,254),latestMessage:latest.slice(0,1000),createdAt:new Date().toISOString(),source:"support-chat"});
  }
  return json(200,{reply});
 }catch(err){console.error("Support chat error",err);return json(502,{error:"Our support assistant is temporarily unavailable. Please try again or use the contact form."})}
};
