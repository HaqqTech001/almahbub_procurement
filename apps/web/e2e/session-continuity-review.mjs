// Browser acceptance using intercepted API fixtures only. No production writes.
import { chromium } from 'playwright';
import { preview } from 'vite';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { DEFAULT_WEDDING_CAMPAIGN } from '../../../packages/constants/dist/index.js';
const server = await preview({root:resolve('apps/web'),preview:{host:'127.0.0.1',port:4197,strictPort:true,open:false}});
const base='http://127.0.0.1:4197';
const browser=await chromium.launch({headless:true});
const results=[];
const user={id:'review-buyer',email:'review@example.test',firstName:'Review',lastName:'Buyer',displayName:'Review Buyer',locale:'en',timeZone:null};
try {
 const context=await browser.newContext(); const page=await context.newPage();
 await page.addLocatorHandler(page.getByRole('button',{name:'Skip for Now',exact:true}),async()=>{await page.getByRole('button',{name:'Skip for Now',exact:true}).click();});
 await page.addLocatorHandler(page.getByRole('button',{name:'Skip',exact:true}),async()=>{await page.getByRole('button',{name:'Skip',exact:true}).click();});
 await page.addLocatorHandler(page.getByRole('button',{name:'Essential only',exact:true}),async()=>{await page.getByRole('button',{name:'Essential only',exact:true}).click();});
 let token=0,expired=false,expireAccess=false,uploads=0,attempts=0,refreshes=0,enabled=false;
 const messages=[],requests=[],errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  if(!path.includes('/api/')) return url.origin===base?route.continue():route.fulfill({status:404,body:''});
  requests.push(path);
  const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify({success:status<400,data,...(status>=400?{error:{code:'UNAUTHENTICATED',message:'Authentication is required.'}}:{})})});
  if(path.endsWith('/auth/login')){expired=false;token++;return reply({accessToken:`review-${token}`,expiresIn:3600,user,organizationId:'org',csrfToken:'fixture-csrf'});}
  if(path.endsWith('/auth/refresh')){refreshes++;if(expired)return reply(null,401);token++;return reply({accessToken:`review-${token}`,expiresIn:3600,user,organizationId:'org',csrfToken:'fixture-csrf'});}
  if(path.endsWith('/auth/me'))return reply({user,organizationId:'org',permissions:['request:read','request:create']});
  if(path.endsWith('/auth/google/status'))return reply({enabled:false});
  if(path.endsWith('/wedding/campaign'))return reply({...DEFAULT_WEDDING_CAMPAIGN,modalEnabled:enabled,modalStartsAt:'2020-01-01T00:00:00Z',modalEndsAt:'2099-01-01T00:00:00Z'});
  if(path.endsWith('/support/thread')){if(expired)return reply(null,401);return reply({id:'thread-review',subject:'Support',status:'open',requesterId:user.id,messages,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});}
  if(path.endsWith('/documents')&&req.method()==='POST'){
   attempts++;assert.equal(req.headers().authorization,`Bearer review-${token}`);assert.match(req.headers()['content-type'],/multipart\/form-data; boundary=/);
   if(expireAccess){expireAccess=false;return reply(null,401);}if(expired)return reply(null,401);
   uploads++;return reply([{id:`doc-${uploads}`,name:'review attachment',href:`/api/v1/documents/doc-${uploads}`,kind:uploads===1?'image':'file'}],201);
  }
  if(/\/documents\/doc-/.test(path)){assert.equal(req.headers().authorization,`Bearer review-${token}`);return route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGAAAAABJRU5ErkJggg==','base64')});}
  if(path.endsWith('/support/messages')){
   if(expired)return reply(null,401);assert.equal(req.headers().authorization,`Bearer review-${token}`);
   const row={id:`msg-${messages.length+1}`,threadId:'thread-review',authorId:user.id,body:req.postDataJSON().body,fromOps:false,readAt:null,createdAt:new Date().toISOString()};messages.push(row);return reply(row,201);
  }
  return reply([]);
 });
 const activity='/app/chat?review=continuity#draft';
 const login=async()=>{await page.getByLabel('Email',{exact:true}).fill(user.email);await page.getByLabel('Password',{exact:true}).fill('fixture-only-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL(base+activity);await page.getByPlaceholder(/Write a message/).waitFor();};
 await page.goto(base+activity);await login();results.push('Sign in returns to exact internal path/query/hash');
 await page.reload();await page.getByPlaceholder(/Write a message/).waitFor();assert.ok(refreshes>0);results.push('Reload restores session through refresh');
 const upload=async(name,mimeType,buffer,text)=>{await page.locator('input[type=file]').setInputFiles({name,mimeType,buffer});await page.getByPlaceholder(/Write a message/).fill(text);await page.getByRole('button',{name:'Send',exact:true}).click();await page.waitForFunction(()=>document.querySelector('textarea')?.value==='');};
 expireAccess=true;const before=refreshes;
 await upload('review.png','image/png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGAAAAABJRU5ErkJggg==','base64'),'Image with silent refresh');
 assert.equal(uploads,1);assert.equal(attempts,2);assert.equal(messages.length,1);assert.equal(refreshes,before+1);assert.equal(page.url(),base+activity);results.push('Expired access token: one refresh, one accepted upload, one message, no redirect');
 await upload('review.txt','text/plain',Buffer.from('Browser test fixture'),'Document upload');assert.equal(uploads,2);assert.equal(messages.length,2);results.push('Image and document uploads carry current bearer and browser multipart boundary');
 await page.locator('input[type=file]').setInputFiles({name:'unsupported.m4a',mimeType:'audio/mp4',buffer:Buffer.from('fixture')});await page.getByText(/This file type isn't supported/).waitFor();assert.equal(uploads,2);assert.doesNotMatch(await page.locator('body').innerText(),/MISSING_BEARER_TOKEN|audio\/mp4|UNAUTHENTICATED/);results.push('Unsupported file rejected locally with friendly message');
 await page.getByPlaceholder(/Write a message/).fill('Preserved after reauthentication');expired=true;await page.getByRole('button',{name:'Send',exact:true}).click();await page.waitForURL(/\/login\?/);assert.equal(new URL(page.url()).searchParams.get('returnTo'),activity);await page.getByText('Your session has expired. Sign in again to continue.').waitFor();await login();assert.equal(await page.getByPlaceholder(/Write a message/).inputValue(),'Preserved after reauthentication');assert.equal(messages.length,2);results.push('True expiry redirects, preserves draft and exact route, never replays message after login');
 await page.goto(base+'/');await page.waitForTimeout(11000);assert.equal(await page.getByRole('button',{name:/Open Rowdotul/}).count(),0);assert.equal(await page.locator('.hamd-wedding-modal').count(),0);assert.ok(!requests.some(path=>/wedding\/(live|gallery|waiting-audio)/.test(path)));results.push('Disabled wedding has no trigger/modal or modal-only media requests');
 enabled=true;await page.getByRole('button',{name:/Open Rowdotul/}).waitFor({timeout:15000});await page.getByRole('button',{name:/Open Rowdotul/}).click();await page.locator('.hamd-wedding-modal').waitFor();enabled=false;await page.locator('.hamd-wedding-modal').waitFor({state:'hidden',timeout:15000});assert.equal(await page.getByRole('button',{name:/Open Rowdotul/}).count(),0);results.push('Persisted enable restores trigger/modal; disable removes both on next poll');
 for(const width of [390,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:1000});await page.evaluate(theme=>localStorage.setItem('hamd.web.theme',theme),theme);await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.locator('.commerce-hero--global').waitFor();await page.waitForTimeout(400);
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,animation:getComputedStyle(document.querySelector('.commerce-hero--global'),'::after').animationName,loaded:document.querySelector('.commerce-hero__scene img').naturalWidth}));assert.ok(dimensions.scroll<=dimensions.width);assert.equal(dimensions.animation,'none');assert.ok(dimensions.loaded>0);assert.ok(!(await page.locator('body').innerText()).includes('\u2014'));await page.screenshot({path:`docs/session-hero-${width}-${theme}.png`});results.push(`Hero ${width}px ${theme}: image loaded, no horizontal overflow, reduced motion disabled, no visible em dash`);
 }
 assert.deepEqual(errors,[]);writeFileSync('docs/session-browser-results.json',JSON.stringify({mode:'intercepted API fixtures, no production writes',passed:results,uploads,uploadAttempts:attempts,messages:messages.length,refreshes,pageErrors:errors},null,2));console.log(JSON.stringify(results,null,2));await context.close();
} finally {await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
