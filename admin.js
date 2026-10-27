(function(){
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const client=window.supabase?.createClient(window.STS_SUPABASE_URL,window.STS_SUPABASE_PUBLISHABLE_KEY);
let courses=[];
const say=(id,msg,kind='')=>{const el=$(id);el.textContent=msg;el.className='notice '+kind;};
function showLogin(){ $('loginPanel').classList.remove('hidden');$('dashboard').classList.add('hidden');}
function showDashboard(user){$('loginPanel').classList.add('hidden');$('dashboard').classList.remove('hidden');$('adminIdentity').textContent=user.email||'Authorized administrator';}
async function requireAdmin(user){
 const {data,error}=await client.from('profiles').select('role,full_name').eq('id',user.id).maybeSingle();
 if(error)throw new Error('Could not verify admin role. Run the supplied admin database setup SQL first.');
 if(!data||data.role!=='admin')throw new Error('This account is not an admin. Sign in with the authorized admin account and set its role to admin using the secure SQL setup.');
 return data;
}
async function loadAll(){
 say('dashboardStatus','Loading dashboard…');
 try{
 const [p,c,q,a,cert]=await Promise.all([
 client.from('profiles').select('id,full_name,role,created_at'),
 client.from('courses').select('*').order('created_at',{ascending:true}),
 client.from('questions').select('id,course_id,question_text,is_active,created_at').order('created_at',{ascending:false}).limit(250),
 client.from('exam_attempts').select('id,student_id,course_id,question_count,score,percentage,passed,submitted_at').order('submitted_at',{ascending:false}).limit(250),
 client.from('certificates').select('id,student_id,certificate_number,issued_at,revoked_at').order('issued_at',{ascending:false}).limit(250)
 ]);
 for(const x of [p,c,q,a,cert])if(x.error)throw x.error;
 courses=c.data||[];const profiles=p.data||[],qs=q.data||[],attempts=a.data||[],certs=cert.data||[];
 $('statStudents').textContent=profiles.filter(x=>x.role!=='admin').length;
 $('statCourses').textContent=courses.length;$('statAttempts').textContent=attempts.length;$('statCertificates').textContent=certs.filter(x=>!x.revoked_at).length;
 $('coursesBody').innerHTML=courses.map(x=>'<tr><td><strong>'+esc(x.title)+'</strong><br>'+esc(x.slug)+'</td><td>'+esc(x.description)+'</td><td>'+(x.is_published?'Published':'Draft')+'</td><td><button class="button" data-edit-course="'+x.id+'">Edit</button></td></tr>').join('')||'<tr><td colspan="4">No courses yet.</td></tr>';
 $('questionCourse').innerHTML=courses.map(x=>'<option value="'+x.id+'">'+esc(x.title)+'</option>').join('');
 $('questionsBody').innerHTML=qs.map(x=>'<tr><td>'+esc(x.question_text)+'</td><td>'+esc(courses.find(c=>c.id===x.course_id)?.title||'Unknown')+'</td><td>'+(x.is_active?'Yes':'No')+'</td><td><button class="button" data-toggle-question="'+x.id+'" data-active="'+x.is_active+'">'+(x.is_active?'Deactivate':'Activate')+'</button></td></tr>').join('')||'<tr><td colspan="4">No questions yet.</td></tr>';
 $('attemptsBody').innerHTML=attempts.map(x=>'<tr><td>'+esc(new Date(x.submitted_at).toLocaleString())+'</td><td>'+esc(profiles.find(p=>p.id===x.student_id)?.full_name||x.student_id.slice(0,8))+'</td><td>'+esc(courses.find(c=>c.id===x.course_id)?.title||'Unknown')+'</td><td>'+x.question_count+'</td><td>'+x.score+'/'+x.question_count+'</td><td>'+x.percentage+'%</td><td><strong>'+ (x.passed?'PASS':'NOT PASSED')+'</strong></td></tr>').join('')||'<tr><td colspan="7">No exam attempts yet.</td></tr>';
 $('certificatesBody').innerHTML=certs.map(x=>'<tr><td>'+esc(x.certificate_number)+'</td><td>'+esc(profiles.find(p=>p.id===x.student_id)?.full_name||x.student_id.slice(0,8))+'</td><td>'+esc(new Date(x.issued_at).toLocaleString())+'</td><td>'+(x.revoked_at?'Revoked':'Valid')+'</td><td>'+(x.revoked_at?'—':'<button class="button" data-revoke-certificate="'+x.id+'">Revoke</button>')+'</td></tr>').join('')||'<tr><td colspan="5">No certificates yet.</td></tr>';
 say('dashboardStatus','Dashboard loaded. Counts reflect records visible to the admin account.','success');
 }catch(e){say('dashboardStatus',e.message||'Could not load dashboard. Check database setup and RLS.','danger');}
}
if(!client){say('loginStatus','Supabase client is not available. Check internet connection.', 'danger');return;}
$('loginForm').addEventListener('submit',async ev=>{ev.preventDefault();const btn=ev.submitter;btn.disabled=true;say('loginStatus','Signing in…');try{
 const {data,error}=await client.auth.signInWithPassword({email:$('adminEmail').value.trim(),password:$('adminPassword').value});if(error)throw error;
 try{await requireAdmin(data.user);}catch(e){await client.auth.signOut();throw e;}
 showDashboard(data.user);$('adminPassword').value='';await loadAll();
 }catch(e){say('loginStatus',e.message||'Admin sign-in failed.','danger');}finally{btn.disabled=false;}});
$('signOut').addEventListener('click',async()=>{await client.auth.signOut();showLogin();say('loginStatus','Signed out.');});
$('refreshCourses').addEventListener('click',loadAll);$('reloadStats').addEventListener('click',loadAll);
$('courseForm').addEventListener('submit',async ev=>{ev.preventDefault();try{const slug=$('courseSlug').value,payload={slug,title:$('courseTitle').value.trim(),description:$('courseDescription').value.trim(),is_published:$('coursePublished').value==='true'};
 const {error}=await client.from('courses').upsert(payload,{onConflict:'slug'});if(error)throw error;say('dashboardStatus','Course saved.','success');$('courseForm').reset();await loadAll();}catch(e){say('dashboardStatus','Course save failed: '+e.message,'danger');}});
$('coursesBody').addEventListener('click',ev=>{const b=ev.target.closest('[data-edit-course]');if(!b)return;const c=courses.find(x=>x.id===b.dataset.editCourse);if(!c)return;$('courseSlug').value=c.slug;$('courseTitle').value=c.title;$('courseDescription').value=c.description;$('coursePublished').value=String(c.is_published);window.scrollTo({top:$('courseForm').getBoundingClientRect().top+window.scrollY-100,behavior:'smooth'});});
$('questionForm').addEventListener('submit',async ev=>{ev.preventDefault();try{const options=[0,1,2,3].map(i=>$('option'+i).value.trim());if(options.some(x=>!x))throw new Error('All four options are required.');
 const courseId=$('questionCourse').value;if(!courseId)throw new Error('Create a course first.');
 const {data:q,error}=await client.from('questions').insert({course_id:courseId,question_text:$('questionText').value.trim(),options,explanation:$('questionExplanation').value.trim(),is_active:$('questionActive').value==='true'}).select('id').single();if(error)throw error;
 const {error:keyError}=await client.from('question_answer_keys').insert({question_id:q.id,correct_option:Number($('correctOption').value)});if(keyError){await client.from('questions').delete().eq('id',q.id);throw keyError;}
 $('questionForm').reset();say('dashboardStatus','Question and answer key saved securely.','success');await loadAll();
 }catch(e){say('dashboardStatus','Question save failed: '+e.message,'danger');}});
$('questionsBody').addEventListener('click',async ev=>{const b=ev.target.closest('[data-toggle-question]');if(!b)return;try{const {error}=await client.from('questions').update({is_active:b.dataset.active!=='true'}).eq('id',b.dataset.toggleQuestion);if(error)throw error;await loadAll();}catch(e){say('dashboardStatus','Could not update question: '+e.message,'danger');}});
$('certificatesBody').addEventListener('click',async ev=>{const b=ev.target.closest('[data-revoke-certificate]');if(!b||!confirm('Revoke this certificate? Verification will show it as revoked.'))return;try{const {error}=await client.from('certificates').update({revoked_at:new Date().toISOString()}).eq('id',b.dataset.revokeCertificate);if(error)throw error;await loadAll();}catch(e){say('dashboardStatus','Certificate revocation failed: '+e.message,'danger');}});
client.auth.getSession().then(async({data})=>{if(!data.session)return;try{await requireAdmin(data.session.user);showDashboard(data.session.user);await loadAll();}catch(e){await client.auth.signOut();showLogin();say('loginStatus',e.message,'danger');}});
})();