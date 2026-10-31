(() => {
'use strict';
const $=id=>document.getElementById(id);
const url=window.STS_SUPABASE_URL,key=window.STS_SUPABASE_PUBLISHABLE_KEY;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!window.supabase||!url||!key){$('auth-status').textContent='Portal service is unavailable. Please try again later.';return;}
const db=window.supabase.createClient(url,key);
let currentUser=null,profile=null,attempts=[],certificates=[];
let portalIdleDeadline=0,portalWarningDeadline=0,portalTickTimer=null,portalWarningOpen=false;
function formatSessionTime(seconds){const s=Math.max(0,Math.ceil(seconds));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function hideSessionWarning(){portalWarningOpen=false;$('sessionWarning')?.classList.remove('show');portalWarningDeadline=0;}
function finishPortalLogout(){hideSessionWarning();clearInterval(portalTickTimer);portalTickTimer=null;portalIdleDeadline=0;db.auth.signOut().finally(()=>{currentUser=null;location.replace('student.html?message='+encodeURIComponent('You have been logged out.'));});}
function showSessionWarning(){if(!currentUser||portalWarningOpen)return;portalWarningOpen=true;portalWarningDeadline=Date.now()+60000;$('sessionWarning').classList.add('show');updateSessionTimer();}
function updateSessionTimer(){if(!currentUser)return;if(portalWarningOpen){const left=Math.max(0,(portalWarningDeadline-Date.now())/1000);$('sessionCountdown').textContent='You will be automatically logged out in '+Math.ceil(left)+' seconds.';$('sessionTimer').textContent='Logout in '+formatSessionTime(left);if(left<=0)finishPortalLogout();return;}const left=Math.max(0,(portalIdleDeadline-Date.now())/1000);$('sessionTimer').textContent='Auto logout in '+formatSessionTime(left);if(left<=0)showSessionWarning();}
function resetPortalIdle(){if(!currentUser||portalWarningOpen)return;portalIdleDeadline=Date.now()+10*60*1000;$('sessionTimer').textContent='Auto logout in 10:00';if(!portalTickTimer)portalTickTimer=setInterval(updateSessionTimer,1000);}
['pointerdown','keydown','mousemove','touchstart','scroll'].forEach(ev=>document.addEventListener(ev,()=>{if(currentUser&&!portalWarningOpen)resetPortalIdle();},{passive:true}));
function status(msg){$('auth-status').textContent=msg||'';}
function showAuth(mode='login'){ $('authView').classList.remove('hide');$('dashboardView').classList.add('hide');$('loginFields').classList.toggle('hide',mode!=='login');$('registerFields').classList.toggle('hide',mode!=='register');$('resetFields').classList.toggle('hide',mode!=='reset');$('authTitle').textContent=mode==='register'?'Create Student Account':mode==='reset'?'Reset Password':'Student Login';$('authSubtitle').textContent=mode==='register'?'Create your secure account to access courses and exams.':mode==='reset'?'We will email you a secure password reset link.':'Enter your registered email and password.';status('');}
function view(name){['overview','profile','exams','certificates'].forEach(v=>$('view-'+v).classList.toggle('hide',v!==name));document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
function setExamLinks(){const g=$('gstCount').value,t=$('itCount').value,a=$('accountingCount')?.value||'50';$('gstExam').href='exam.html?course=gst&count='+g;$('itExam').href='exam.html?course=income-tax&count='+t;if($('accountingExam'))$('accountingExam').href='exam.html?course=complete-accounting&count='+a;}
async function loadDashboard(user){
 currentUser=user;$('authView').classList.add('hide');$('dashboardView').classList.remove('hide');$('studentEmail').textContent=user.email||'';view('overview');
 let p=await db.from('profiles').select('id,full_name,phone,father_name,mother_name,address,role,created_at').eq('id',user.id).maybeSingle();
 profile=p.data||{id:user.id,full_name:user.user_metadata?.full_name||'',phone:user.user_metadata?.phone||'',father_name:'',mother_name:'',address:'',role:'student'};
 $('welcomeName').textContent='Welcome, '+(profile.full_name||'Student');$('profileName').value=profile.full_name||'';$('profilePhone').value=profile.phone||'';$('profileFather').value=profile.father_name||'';$('profileMother').value=profile.mother_name||'';$('profileAddress').value=profile.address||'';$('profileEmail').value=user.email||'';
 const a=await db.from('exam_attempts').select('id,course_id,question_count,score,percentage,passed,submitted_at,courses(title,slug)').eq('student_id',user.id).order('submitted_at',{ascending:false}).limit(100);
 attempts=a.data||[];const c=await db.from('certificates').select('id,certificate_number,issued_at,revoked_at,attempt_id,exam_attempts(question_count,score,percentage,passed,courses(title,slug))').eq('student_id',user.id).order('issued_at',{ascending:false});
 certificates=c.data||[];
 $('attemptCount').textContent=a.error?'—':String(attempts.length);$('certCount').textContent=c.error?'—':String(certificates.filter(x=>!x.revoked_at).length);
 $('averageScore').textContent=attempts.length?Math.round(attempts.reduce((n,x)=>n+Number(x.percentage||0),0)/attempts.length)+'%':'—';
 $('attemptsTable').innerHTML=a.error?'<p>Results could not be loaded. Please check database policies.</p>':attempts.length?'<table><thead><tr><th>Course</th><th>Questions</th><th>Score</th><th>Result</th><th>Date</th></tr></thead><tbody>'+attempts.map(x=>'<tr><td>'+esc(x.courses?.title||x.courses?.slug||'Course')+'</td><td>'+esc(x.question_count)+'</td><td>'+esc(x.percentage)+'%</td><td><span class="pill" style="'+(x.passed?'':'background:#fff0ee;color:#a33')+'">'+(x.passed?'PASS':'NOT PASSED')+'</span></td><td>'+esc(new Date(x.submitted_at).toLocaleDateString())+'</td></tr>').join('')+'</tbody></table>':'<p>No exam attempts found yet. Choose a course on Overview to begin.</p>';
 $('certificatesList').innerHTML=c.error?'<p>Certificates could not be loaded. Please check database policies.</p>':certificates.filter(x=>!x.revoked_at).length?certificates.filter(x=>!x.revoked_at).map((x,i)=>'<article class="tile" style="margin:12px 0"><div class="row"><div><h3>'+esc(x.exam_attempts?.courses?.title||'Course Certificate')+'</h3><p class="muted">Certificate No: '+esc(x.certificate_number)+'</p><small>Issued '+esc(new Date(x.issued_at).toLocaleDateString())+' · Score '+esc(x.exam_attempts?.percentage??'—')+'%</small></div><div class="actions"><a class="btn" href="verify-certificate.html?number='+encodeURIComponent(x.certificate_number)+'" target="_blank" rel="noopener">View / Verify</a><button class="btn" type="button" data-pdf="certificate" data-cert-index="'+i+'">Download Certificate PDF</button><button class="btn secondary" type="button" data-pdf="marksheet" data-cert-index="'+i+'">Download Marksheet PDF</button></div></div></article>').join(''):'<p>No certificates have been issued to your account yet.</p>';
 $('certificatesList').querySelectorAll('[data-pdf]').forEach(b=>b.addEventListener('click',()=>downloadDocument(certificates.filter(x=>!x.revoked_at)[Number(b.dataset.certIndex)],b.dataset.pdf)))
 if(a.error||c.error) console.warn('Student records could not be fully loaded',a.error||c.error);
}
$('loginBtn').addEventListener('click',async()=>{const email=$('auth-email').value.trim(),password=$('auth-password').value;if(!email||!password){status('Enter your registered email and password.');return;}const b=$('loginBtn');b.disabled=true;status('Signing in…');try{const r=await db.auth.signInWithPassword({email,password});if(r.error)throw r.error;await loadDashboard(r.data.user);}catch(e){status(e.message||'Login failed. Check your details and try again.');}finally{b.disabled=false;}});
$('registerBtn').addEventListener('click',async()=>{const name=$('auth-name').value.trim(),father=$('auth-father').value.trim(),mother=$('auth-mother').value.trim(),address=$('auth-address').value.trim(),phone=$('auth-phone').value.trim(),email=$('reg-email').value.trim(),password=$('reg-password').value;if(!name||!father||!mother||!address||!phone||!email||password.length<8){status('Complete all personal details and use a password of at least 8 characters.');return;}const b=$('registerBtn');b.disabled=true;status('Creating account…');try{const r=await db.auth.signUp({email,password,options:{data:{full_name:name,phone,father_name:father,mother_name:mother,address}}});if(r.error)throw r.error;if(r.data.session){await loadDashboard(r.data.user);}else{showAuth('login');$('auth-email').value=email;status('Registration received. Check your email to confirm the account, then log in.');}}catch(e){status(e.message||'Registration failed.');}finally{b.disabled=false;}});
$('showRegister').addEventListener('click',()=>showAuth('register'));$('showLogin').addEventListener('click',()=>showAuth('login'));$('forgotPassword').addEventListener('click',e=>{e.preventDefault();showAuth('reset');});$('resetBack').addEventListener('click',()=>{passwordRecoveryActive=false;$('resetRequestFields').classList.remove('hide');$('newPasswordFields').classList.add('hide');showAuth('login');});
let passwordRecoveryActive=false;
$('resetBtn').addEventListener('click',async()=>{const email=$('reset-email').value.trim();if(!email){status('Enter your registered email address.');return;}const b=$('resetBtn');b.disabled=true;status('Sending recovery email…');try{const r=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname+'?reset=1'});if(r.error)throw r.error;status('Password reset link sent if this email is registered. Open the latest email on this same browser/device, then set a new password here. Also check Spam/Junk.');}catch(e){status(e.message||'Unable to send reset email.');}finally{b.disabled=false;}});
$('saveNewPassword').addEventListener('click',async()=>{const password=$('new-password').value,confirm=$('confirm-password').value;if(password.length<8){status('New password must be at least 8 characters.');return;}if(password!==confirm){status('New password and confirmation do not match.');return;}const b=$('saveNewPassword');b.disabled=true;status('Updating password…');try{const r=await db.auth.updateUser({password});if(r.error)throw r.error;passwordRecoveryActive=false;$('new-password').value='';$('confirm-password').value='';showAuth('login');status('Password updated successfully. Please sign in using your new password.');await db.auth.signOut();}catch(e){status(e.message||'Password could not be updated. Open the latest recovery email link again and retry.');}finally{b.disabled=false;}});
function showPasswordUpdate(){showAuth('reset');$('resetRequestFields').classList.add('hide');$('newPasswordFields').classList.remove('hide');status('Recovery link verified. Enter and confirm your new password below.');}
$('forgotUsername').addEventListener('click',e=>{e.preventDefault();status('Your username is your registered email address. If you cannot remember it, contact support using the account recovery link below. For privacy, the portal cannot display account emails here.');});

async function makeQRDataURL(text){
 // First try a local QR library if one is available.
 if(window.QRCode&&typeof window.QRCode.toDataURL==='function'){
   return await window.QRCode.toDataURL(text,{width:360,margin:2,errorCorrectionLevel:'H',color:{dark:'#000000',light:'#ffffff'}});
 }
 if(typeof window.QRCode==='function'){
   const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;width:180px;height:180px;background:#fff';
   document.body.appendChild(host);
   try{
     new window.QRCode(host,{text,width:180,height:180,colorDark:'#000000',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel?.H||2});
     for(let i=0;i<30;i++){
       const canvas=host.querySelector('canvas');if(canvas)return canvas.toDataURL('image/png');
       const img=host.querySelector('img');if(img?.complete&&img.naturalWidth)return await imageToPng(img);
       await new Promise(r=>setTimeout(r,100));
     }
   }finally{host.remove();}
 }
 // Independent hosted QR generation fallback; embed the resulting pixels in the PDF.
 const endpoint='https://quickchart.io/qr?size=360&margin=2&ecLevel=H&format=png&text='+encodeURIComponent(text);
 const img=new Image();img.crossOrigin='anonymous';
 await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('QR service could not be reached. Check internet access and retry.'));img.src=endpoint;});
 return await imageToPng(img);
}
async function imageToPng(img){
 const canvas=document.createElement('canvas');canvas.width=img.naturalWidth||360;canvas.height=img.naturalHeight||360;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0);
 try{return canvas.toDataURL('image/png');}catch(e){throw new Error('Browser blocked QR image access. Please try Chrome with internet enabled.');}
}
async function downloadDocument(cert,kind){
 const a=cert.exam_attempts||{},course=a.courses?.title||'Training Course',pct=Number(a.percentage||0),passed=!!a.passed;
 if(cert.revoked_at){alert('This certificate is revoked and cannot be downloaded as valid.');return;}
 if(!window.jspdf?.jsPDF){alert('PDF library did not load. Please refresh and try again.');return;}
 const isCert=kind==='certificate';
 const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:isCert?'landscape':'portrait',unit:'mm',format:'a4'}),w=isCert?297:210,h=isCert?210:297;
 const qrUrl=location.origin+'/verify-certificate.html?number='+encodeURIComponent(cert.certificate_number);
 let logoData=null;
 try{
   const response=await fetch(new URL('assets/smart-tax-solution-logo.svg',document.baseURI).href,{cache:'no-cache'});
   if(!response.ok)throw new Error('Logo request failed');
   const svg=await response.text(),blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),blobUrl=URL.createObjectURL(blob);
   try{
     const img=new Image();
     await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=blobUrl;});
     const ratio=img.naturalWidth/img.naturalHeight||5.25,canvas=document.createElement('canvas');
     canvas.width=1200;canvas.height=Math.round(1200/ratio);
     const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
     logoData=canvas.toDataURL('image/png');
   }finally{URL.revokeObjectURL(blobUrl);}
 }catch(err){console.warn('PDF logo could not be loaded',err);}
 let stampData=null;
 try{
   // Load the exact original stamp image supplied by the user.
   const img=new Image();
   img.src=new URL('assets/stamp-exact.png',document.baseURI).href+'?v=20261031';
   await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Original stamp image is missing from assets/stamp-exact.png'));});
   const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
   const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
   stampData=canvas.toDataURL('image/png');
 }catch(err){
   console.warn('Original stamp PNG is not yet published; using the existing site stamp temporarily.',err);
   try{
     const response=await fetch(new URL('assets/smart-tax-stamp.svg',document.baseURI).href,{cache:'no-cache'});
     if(!response.ok)throw new Error('Fallback stamp request failed');
     const svg=await response.text(),blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),blobUrl=URL.createObjectURL(blob);
     try{
       const fallbackImg=new Image();
       await new Promise((resolve,reject)=>{fallbackImg.onload=resolve;fallbackImg.onerror=reject;fallbackImg.src=blobUrl;});
       const canvas=document.createElement('canvas');canvas.width=600;canvas.height=600;
       const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,600,600);ctx.drawImage(fallbackImg,0,0,600,600);
       stampData=canvas.toDataURL('image/png');
     }finally{URL.revokeObjectURL(blobUrl);}
   }catch(fallbackErr){console.warn('Fallback stamp could not be loaded',fallbackErr);}
 }
 const navy=[20,43,74],gold=[190,145,54],muted=[95,108,124];
 doc.setFillColor(255,255,255);doc.rect(0,0,w,h,'F');
 doc.setDrawColor(...navy);doc.setLineWidth(1.1);doc.rect(7,7,w-14,h-14);
 doc.setDrawColor(...gold);doc.setLineWidth(.35);doc.rect(10,10,w-20,h-20);
 if(logoData){doc.addImage(logoData,'PNG',w/2-25,14,50,9.5,'STSLOGO','FAST');}
 doc.setTextColor(...navy);doc.setFont('helvetica','bold');
 if(isCert){
   // Premium landscape certificate layout inspired by the user's reference artwork.
   const blue=[13,43,105],royal=[28,48,205],gold=[218,157,35],ink=[14,35,78],pale=[232,244,255];
   doc.setFillColor(255,255,255);doc.rect(0,0,w,h,'F');
   // Double gold/navy frame and corner ribbons.
   doc.setDrawColor(...gold);doc.setLineWidth(1.1);doc.rect(2.5,2.5,w-5,h-5);
   doc.setDrawColor(...blue);doc.setLineWidth(.45);doc.rect(4.5,4.5,w-9,h-9);
   doc.setFillColor(...blue);doc.triangle(258,5,292,5,292,40,'F');doc.setFillColor(...gold);doc.triangle(265,5,292,5,292,31,'F');
   doc.setFillColor(...blue);doc.triangle(5,169,5,205,39,205,'F');doc.setFillColor(...gold);doc.triangle(5,180,5,205,28,205,'F');
   // Brand header.
   if(logoData)doc.addImage(logoData,'PNG',12,10,83,18,'STSLOGO','FAST');
   doc.setDrawColor(...ink);doc.setLineWidth(.5);doc.line(144,9,144,34);
   doc.setFillColor(255,250,237);doc.setDrawColor(...gold);doc.roundedRect(151,9,57,25,2,2,'FD');
   doc.setFont('helvetica','bold');doc.setFontSize(10.5);doc.setTextColor(...blue);doc.text('UDYAM',179.5,16.5,{align:'center'});
   doc.setFontSize(7.2);doc.setTextColor(...ink);doc.text('Registered Enterprise',179.5,21.5,{align:'center'});
   doc.setFillColor(...blue);doc.roundedRect(153,24,53,7,2,2,'F');
   doc.setFontSize(7.3);doc.setTextColor(255,255,255);doc.text('UDYAM-RJ-15-0042566',179.5,28.8,{align:'center'});
   // ISO details in a fixed top-right panel, clear of the certificate title ribbon.
   doc.setFillColor(255,252,242);doc.setDrawColor(...gold);doc.setLineWidth(.45);
   doc.roundedRect(214,8,73,27,1.8,1.8,'FD');
   doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...blue);
   doc.text('ISO 9001:2015 CERTIFIED',250.5,15,{align:'center',maxWidth:68});
   doc.setDrawColor(...gold);doc.setLineWidth(.25);doc.line(220,18,281,18);
   doc.setFontSize(7.1);doc.setTextColor(...ink);
   doc.text('Certification No.: GCS/QMS/11666',250.5,23,{align:'center',maxWidth:68});
   doc.setFont('helvetica','normal');doc.setFontSize(6.1);doc.setTextColor(...muted);
   doc.text('Certified by Global Certification Services',250.5,29,{align:'center',maxWidth:68});
   // Ribbon title.
   doc.setFillColor(...blue);doc.rect(27,42,243,17,'F');
   doc.setFillColor(...gold);doc.rect(27,42,243,1.1,'F');doc.rect(27,58,243,1.1,'F');
   doc.setFont('times','bold');doc.setFontSize(23);doc.setTextColor(255,255,255);
   doc.text('CERTIFICATE OF COMPLETION',148.5,54,{align:'center'});
   // Recipient and course statement.
   doc.setFont('times','italic');doc.setFontSize(15);doc.setTextColor(...ink);
   doc.text('This is to certify that',148.5,70,{align:'center'});
   const studentName=profile?.full_name||'Student Name';
   doc.setFont('helvetica','bold');doc.setFontSize(28);doc.setTextColor(...blue);
   doc.text(doc.splitTextToSize(studentName,230),148.5,86,{align:'center',maxWidth:230});
   doc.setDrawColor(...gold);doc.setLineWidth(.6);doc.line(44,89,253,89);
   doc.setFont('times','italic');doc.setFontSize(13);doc.setTextColor(...ink);
   doc.text('has successfully completed the',148.5,101,{align:'center'});
   doc.setFont('times','bold');doc.setFontSize(25);doc.setTextColor(...blue);
   doc.text(doc.splitTextToSize(course,230),148.5,110,{align:'center',maxWidth:230});
   doc.setFont('times','italic');doc.setFontSize(10.5);doc.setTextColor(...ink);
   doc.text('conducted by Smart Tax Solution and has scored '+pct.toFixed(2)+'% marks in the final examination.',148.5,121,{align:'center',maxWidth:270});
   const courseDescription=/gst/i.test(course)?'Course completed: Goods and Services Tax (GST) — registration, GST returns, input tax credit (ITC), tax invoices and GST compliance.':'Course completed: Income Tax — basic tax concepts, tax computation, deductions and income tax return filing.';
   doc.setFont('times','italic');doc.setFontSize(9.5);doc.setTextColor(...ink);
   doc.text(doc.splitTextToSize(courseDescription,270),148.5,129,{align:'center',maxWidth:270});
   // Bottom information band: certificate details, QR and the supplied business stamp in place of a personal signatory.
   doc.setFillColor(...pale);doc.setDrawColor(30,130,220);doc.setLineWidth(.35);doc.roundedRect(11,139,104,35,3,3,'FD');
   const rows=[['Certificate No.',cert.certificate_number],['Course',course],['Date of Issue',new Date(cert.issued_at).toLocaleDateString()]];
   let ry=147;
   rows.forEach(([label,value])=>{
     doc.setFont('times','bold');doc.setFontSize(9.2);doc.setTextColor(...ink);doc.text(label,70,ry);
     doc.setFont('times','normal');doc.text(':',104,ry);
     doc.setFont('times','bold');doc.setFontSize(8.6);doc.text(doc.splitTextToSize(String(value),57),109,ry,{maxWidth:57});
     ry+=9;
   });
   try{
     const qr=await makeQRDataURL(qrUrl);
     if(!qr||!qr.startsWith('data:image/png;base64,'))throw new Error('QR image generation failed');
     doc.addImage(qr,'PNG',145,139,33,33,'CERTQR','FAST');
     doc.setFont('times','bold');doc.setFontSize(8.5);doc.setTextColor(...ink);doc.text('Scan to Verify',161.5,176,{align:'center'});
   }catch(e){console.error('Certificate QR generation failed:',e);alert('QR Code generate nahi hua: '+(e.message||e));}
   // Business stamp replaces the personal name/designation signature block.
   if(stampData)doc.addImage(stampData,'PNG',224,133,48,48,'STSSTAMP','FAST');
   doc.setFont('times','bold');doc.setFontSize(9);doc.setTextColor(...ink);doc.text('Authorized Signatory',248,184,{align:'center'});
   doc.setDrawColor(...gold);doc.setLineWidth(.6);doc.line(33,184,264,184);
   doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...blue);
   doc.text('Expert Guidance',50,191,{align:'center'});doc.text('Online Learning',116,191,{align:'center'});
   doc.text('Digital Certificate',184,191,{align:'center'});doc.text('Verified & Trusted',247,191,{align:'center'});
   doc.setDrawColor(...gold);doc.line(83,186,83,196);doc.line(150,186,150,196);doc.line(218,186,218,196);
   doc.setFillColor(...blue);doc.rect(5,198,287,7,'F');
   doc.setFont('times','italic');doc.setFontSize(14);doc.setTextColor(255,255,255);
   doc.text('Together Towards Financial Literacy',148.5,203,{align:'center'});

 }else{
   doc.setFontSize(19);doc.text('STATEMENT OF MARKS',w/2,38,{align:'center'});
   doc.setFontSize(11);doc.setFont('helvetica','normal');doc.text('Student Assessment Record',w/2,45,{align:'center'});
   doc.setDrawColor(...gold);doc.line(20,50,w-20,50);
   doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('STUDENT DETAILS',20,60);
   doc.setFont('helvetica','normal');doc.setFontSize(9.5);
   const details=[
    ['Full Name',profile?.full_name||'—'],["Father's Name",profile?.father_name||'—'],["Mother's Name",profile?.mother_name||'—'],
    ['Mobile',profile?.phone||'—'],['Email',currentUser?.email||'—'],['Address',profile?.address||'—'],
    ['Course',course],['Certificate No.',cert.certificate_number],['Issue Date',new Date(cert.issued_at).toLocaleDateString()]
   ];
   let y=68;
   details.forEach(([label,value])=>{
     const lines=doc.splitTextToSize(String(value),115);
     doc.setFont('helvetica','bold');doc.text(label,20,y);
     doc.setFont('helvetica','normal');doc.text(lines,66,y);
     y+=Math.max(7,lines.length*5+1);
   });
   y+=5;doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('ASSESSMENT RESULT',20,y);y+=7;
   const rows=[['Assessment','Maximum Marks','Marks Obtained','Result'],[course,String(a.question_count||'—'),String(a.score??'—'),passed?'PASS':'NOT PASSED']];
   const widths=[75,35,38,32],x0=20,rowH=12;
   let x=x0;
   widths.forEach((cw,i)=>{doc.setFillColor(237,243,249);doc.rect(x,y,cw,rowH,'FD');doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.text(rows[0][i],x+cw/2,y+7.5,{align:'center',maxWidth:cw-2});x+=cw;});
   y+=rowH;x=x0;
   widths.forEach((cw,i)=>{doc.setFillColor(255,255,255);doc.rect(x,y,cw,rowH,'S');doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.text(rows[1][i],x+cw/2,y+7.5,{align:'center',maxWidth:cw-2});x+=cw;});
   y+=rowH+7;doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('Percentage: '+pct.toFixed(2)+'%',20,y);
   if(stampData){doc.addImage(stampData,'PNG',20,222,42,42,'STSMARKSTAMP','FAST');doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...navy);doc.text('Authorized Signatory',41,267,{align:'center'});}
   doc.text('Overall Result: '+(passed?'PASS':'NOT PASSED'),105,y);
   try{
     const qr=await makeQRDataURL(qrUrl);
     if(!qr||!qr.startsWith('data:image/png;base64,'))throw new Error('QR image generation failed');
     doc.addImage(qr,'PNG',w-45,h-53,30,30,'MARKQR','FAST');doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('SCAN TO VERIFY',w-30,h-20,{align:'center'});
   }catch(e){console.error('Marksheet QR generation failed:',e);alert('QR Code generate nahi hua: '+(e.message||e));}
   doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...muted);doc.text('Private training record · Verify certificate status using the QR code',w/2,h-15,{align:'center'});
   doc.setTextColor(...navy);
 }
 doc.save((isCert?'Certificate_':'Marksheet_')+cert.certificate_number+'.pdf');
}

$('logoutBtn').addEventListener('click',finishPortalLogout);
$('sessionLogoutBtn').addEventListener('click',finishPortalLogout);
$('sessionContinueBtn').addEventListener('click',()=>{hideSessionWarning();resetPortalIdle();});
$('backWebsiteLink').addEventListener('click',e=>{if(currentUser){e.preventDefault();alert('Please click Sign Out / Logout before opening the main website.');}});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));
$('gstCount').addEventListener('change',setExamLinks);$('itCount').addEventListener('change',setExamLinks);$('accountingCount')?.addEventListener('change',setExamLinks);
$('saveProfile').addEventListener('click',async()=>{if(!currentUser)return;const full_name=$('profileName').value.trim(),phone=$('profilePhone').value.trim(),father_name=$('profileFather').value.trim(),mother_name=$('profileMother').value.trim(),address=$('profileAddress').value.trim();if(!full_name||!father_name||!mother_name||!address||!phone){$('profileStatus').textContent='Please complete all profile details.';return;}const b=$('saveProfile');b.disabled=true;$('profileStatus').textContent='Saving…';try{const r=await db.from('profiles').update({full_name,phone,father_name,mother_name,address}).eq('id',currentUser.id);if(r.error)throw r.error;profile={...profile,full_name,phone,father_name,mother_name,address};$('welcomeName').textContent='Welcome, '+full_name;$('profileStatus').textContent='Profile updated successfully.';}catch(e){$('profileStatus').textContent='Could not save profile: '+(e.message||'Please try again.');}finally{b.disabled=false;}});
$('changePassword').addEventListener('click',async()=>{if(!currentUser?.email)return;try{const r=await db.auth.resetPasswordForEmail(currentUser.email,{redirectTo:location.origin+location.pathname+'?reset=1'});if(r.error)throw r.error;$('profileStatus').textContent='If eligible, a password reset link has been emailed to your registered address.';}catch(e){$('profileStatus').textContent=e.message||'Unable to request password reset.';}});
db.auth.onAuthStateChange(async(event,session)=>{if(event==='PASSWORD_RECOVERY'){passwordRecoveryActive=true;showPasswordUpdate();return;}if(event==='SIGNED_IN'&&passwordRecoveryActive){showPasswordUpdate();return;}if(session?.user){if(!currentUser||currentUser.id!==session.user.id)await loadDashboard(session.user);resetPortalIdle();}else{clearInterval(portalTickTimer);portalTickTimer=null;portalIdleDeadline=0;hideSessionWarning();currentUser=null;showAuth('login');}});
(async()=>{setExamLinks();const {data}=await db.auth.getSession();if(data.session?.user){await loadDashboard(data.session.user);resetPortalIdle();}else showAuth('login');if(new URLSearchParams(location.search).get('reset')==='1'){showAuth('reset');status('Checking your password recovery link… If the link is valid, the new password form will appear.');}})();
})();