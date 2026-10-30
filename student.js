(() => {
'use strict';
const $=id=>document.getElementById(id);
const url=window.STS_SUPABASE_URL,key=window.STS_SUPABASE_PUBLISHABLE_KEY;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!window.supabase||!url||!key){$('auth-status').textContent='Portal service is unavailable. Please try again later.';return;}
const db=window.supabase.createClient(url,key);
let currentUser=null,profile=null,attempts=[],certificates=[];
let portalIdleTimer=null;
function resetPortalIdle(){clearTimeout(portalIdleTimer);portalIdleTimer=setTimeout(async()=>{await db.auth.signOut();location.replace('student.html?message='+encodeURIComponent('Automatically signed out after 5 minutes of inactivity.'));},5*60*1000);}
['pointerdown','keydown','mousemove','touchstart','scroll'].forEach(ev=>document.addEventListener(ev,resetPortalIdle,{passive:true}));
function status(msg){$('auth-status').textContent=msg||'';}
function showAuth(mode='login'){ $('authView').classList.remove('hide');$('dashboardView').classList.add('hide');$('loginFields').classList.toggle('hide',mode!=='login');$('registerFields').classList.toggle('hide',mode!=='register');$('resetFields').classList.toggle('hide',mode!=='reset');$('authTitle').textContent=mode==='register'?'Create Student Account':mode==='reset'?'Reset Password':'Student Login';$('authSubtitle').textContent=mode==='register'?'Create your secure account to access courses and exams.':mode==='reset'?'We will email you a secure password reset link.':'Enter your registered email and password.';status('');}
function view(name){['overview','profile','exams','certificates'].forEach(v=>$('view-'+v).classList.toggle('hide',v!==name));document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
function setExamLinks(){const g=$('gstCount').value,t=$('itCount').value;$('gstExam').href='exam.html?course=gst&count='+g;$('itExam').href='exam.html?course=income-tax&count='+t;}
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
$('showRegister').addEventListener('click',()=>showAuth('register'));$('showLogin').addEventListener('click',()=>showAuth('login'));$('forgotPassword').addEventListener('click',e=>{e.preventDefault();showAuth('reset');});$('resetBack').addEventListener('click',()=>showAuth('login'));
$('resetBtn').addEventListener('click',async()=>{const email=$('reset-email').value.trim();if(!email){status('Enter your registered email address.');return;}const b=$('resetBtn');b.disabled=true;status('Sending recovery email…');try{const r=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname+'?reset=1'});if(r.error)throw r.error;status('If this email is registered, a password reset link will be sent. Check your inbox and spam folder.');}catch(e){status(e.message||'Unable to send reset email.');}finally{b.disabled=false;}});
$('forgotUsername').addEventListener('click',e=>{e.preventDefault();status('Your username is your registered email address. If you cannot remember it, contact support using the account recovery link below. For privacy, the portal cannot display account emails here.');});

async function downloadDocument(cert,kind){
 const a=cert.exam_attempts||{},course=a.courses?.title||'Training Course',pct=Number(a.percentage||0),passed=!!a.passed;
 if(cert.revoked_at){alert('This certificate is revoked and cannot be downloaded as valid.');return;}
 if(!window.jspdf?.jsPDF){alert('PDF library did not load. Please refresh and try again.');return;}
 const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'}),w=210;
 const qrUrl=location.origin+'/verify-certificate.html?number='+encodeURIComponent(cert.certificate_number);
 // Embed the site's existing SVG logo in both PDFs by converting it to PNG data.
 let logoData=null;
 try {
   const response=await fetch(new URL('assets/smart-tax-solution-logo.svg',document.baseURI).href,{cache:'no-cache'});
   if(!response.ok) throw new Error('Logo request failed');
   const svg=await response.text();
   const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
   const blobUrl=URL.createObjectURL(blob);
   try {
     const logoImg=new Image();
     await new Promise((resolve,reject)=>{logoImg.onload=resolve;logoImg.onerror=reject;logoImg.src=blobUrl;});
     const canvas=document.createElement('canvas');canvas.width=600;canvas.height=600;
     const ctx=canvas.getContext('2d');ctx.drawImage(logoImg,0,0,600,600);
     logoData=canvas.toDataURL('image/png');
   } finally { URL.revokeObjectURL(blobUrl); }
 } catch(err) { console.warn('PDF logo could not be loaded',err); }

 doc.setDrawColor(20,43,74);doc.setLineWidth(1.1);doc.rect(10,10,190,277);
 if(logoData){doc.addImage(logoData,'PNG',18,15,24,24,'STSLOGO','FAST');}\n doc.setFont('helvetica','bold');doc.setFontSize(kind==='certificate'?24:20);doc.text(kind==='certificate'?'CERTIFICATE OF COMPLETION':'STUDENT MARKSHEET',105,28,{align:'center'});
 doc.setFontSize(12);doc.setFont('helvetica','normal');doc.text('SMART TAX SOLUTION',105,38,{align:'center'});
 doc.setFontSize(11);doc.text('Certificate No: '+cert.certificate_number,20,52);
 doc.setFontSize(12);doc.text('Student Name: '+(profile?.full_name||''),20,68);
 doc.text("Father's Name: "+(profile?.father_name||''),20,80);
 doc.text("Mother's Name: "+(profile?.mother_name||''),20,92);
 const lines=doc.splitTextToSize('Address: '+(profile?.address||''),165);doc.text(lines,20,104);
 let y=104+lines.length*6+7;
 doc.text('Mobile: '+(profile?.phone||''),20,y);y+=9;doc.text('Email: '+(currentUser?.email||''),20,y);y+=12;
 doc.text('Course: '+course,20,y);y+=10;
 if(kind==='marksheet'){doc.text('Total Questions: '+(a.question_count||'N/A'),20,y);y+=9;doc.text('Marks Obtained: '+(a.score??'N/A')+' / '+(a.question_count||'N/A'),20,y);y+=9;doc.text('Percentage: '+pct.toFixed(2)+'%',20,y);y+=9;doc.text('Result: '+(passed?'PASS':'NOT PASSED'),20,y);y+=9;}
 doc.text('Issue Date: '+new Date(cert.issued_at).toLocaleDateString(),20,y);y+=13;
 if(kind==='certificate'){doc.setFontSize(14);doc.text('has successfully completed the '+course+' assessment.',105,y,{align:'center',maxWidth:165});y+=22;doc.setFontSize(11);doc.text('Private training certificate; not a government-accredited credential.',105,y,{align:'center',maxWidth:170});}
 try{const qr=await QRCode.toDataURL(qrUrl,{width:180,margin:1});doc.addImage(qr,'PNG',157,238,30,30);doc.setFontSize(8);doc.text('Scan to verify',172,272,{align:'center'});}catch(e){}
 doc.setFontSize(10);doc.text('Authorized Signature',25,260);doc.line(25,255,65,255);
 doc.save((kind==='certificate'?'Certificate_':'Marksheet_')+cert.certificate_number+'.pdf');
}
$('logoutBtn').addEventListener('click',async()=>{clearTimeout(portalIdleTimer);await db.auth.signOut();currentUser=null;showAuth('login');});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));
$('gstCount').addEventListener('change',setExamLinks);$('itCount').addEventListener('change',setExamLinks);
$('saveProfile').addEventListener('click',async()=>{if(!currentUser)return;const full_name=$('profileName').value.trim(),phone=$('profilePhone').value.trim(),father_name=$('profileFather').value.trim(),mother_name=$('profileMother').value.trim(),address=$('profileAddress').value.trim();if(!full_name||!father_name||!mother_name||!address||!phone){$('profileStatus').textContent='Please complete all profile details.';return;}const b=$('saveProfile');b.disabled=true;$('profileStatus').textContent='Saving…';try{const r=await db.from('profiles').update({full_name,phone,father_name,mother_name,address}).eq('id',currentUser.id);if(r.error)throw r.error;profile={...profile,full_name,phone,father_name,mother_name,address};$('welcomeName').textContent='Welcome, '+full_name;$('profileStatus').textContent='Profile updated successfully.';}catch(e){$('profileStatus').textContent='Could not save profile: '+(e.message||'Please try again.');}finally{b.disabled=false;}});
$('changePassword').addEventListener('click',async()=>{if(!currentUser?.email)return;try{const r=await db.auth.resetPasswordForEmail(currentUser.email,{redirectTo:location.origin+location.pathname+'?reset=1'});if(r.error)throw r.error;$('profileStatus').textContent='If eligible, a password reset link has been emailed to your registered address.';}catch(e){$('profileStatus').textContent=e.message||'Unable to request password reset.';}});
db.auth.onAuthStateChange(async(event,session)=>{if(event==='PASSWORD_RECOVERY'){showAuth('reset');status('Open the recovery link from your email to continue password recovery.');return;}if(session?.user){if(!currentUser||currentUser.id!==session.user.id)await loadDashboard(session.user);resetPortalIdle();}else{clearTimeout(portalIdleTimer);currentUser=null;showAuth('login');}});
(async()=>{setExamLinks();const {data}=await db.auth.getSession();if(data.session?.user){await loadDashboard(data.session.user);resetPortalIdle();}else showAuth('login');if(new URLSearchParams(location.search).get('reset')==='1'){showAuth('reset');status('Password recovery link detected. Follow the secure instructions from your email.');}})();
})();