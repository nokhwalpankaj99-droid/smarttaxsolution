(() => {
'use strict';
const $=id=>document.getElementById(id);
const url='https://jbjergbqjokxxcvntimk.supabase.co';
const key='sb_publishable_wOwWiLuundz06ABsksvrbQ_2oXiV_5k';
if(!window.supabase){$('loading').innerHTML='<h1>Service unavailable</h1><p>Please reload later.</p>';return;}
const db=window.supabase.createClient(url,key);
let user=null,course=null,questions=[],answers=new Map(),index=0,seconds=1200,examFinished=false,timerId=null,idleId=null;
const courseSlug=new URLSearchParams(location.search).get('course')==='income-tax'?'income-tax':'gst';
const requestedCount=new URLSearchParams(location.search).get('count')==='100'?100:50;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function signOut(message){clearInterval(timerId);clearTimeout(idleId);db.auth.signOut().finally(()=>{location.replace('student.html'+(message?'?message='+encodeURIComponent(message):''));});}
$('signOutBtn').addEventListener('click',()=>signOut('You have signed out.'));
function resetIdle(){if(examFinished)return;clearTimeout(idleId);idleId=setTimeout(()=>signOut('Signed out after 5 minutes of inactivity.'),5*60*1000);}
['pointerdown','keydown','mousemove','touchstart','scroll'].forEach(ev=>document.addEventListener(ev,resetIdle,{passive:true}));
function showTime(){const m=Math.floor(seconds/60),s=seconds%60;$('timer').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');$('timer').classList.toggle('warning',seconds<=60);}
async function init(){
 try{
  const {data:{session},error}=await db.auth.getSession();if(error)throw error;
  if(!session){location.replace('student.html?message='+encodeURIComponent('Please sign in to open the exam.'));return;}
  user=session.user;$('candidateEmail').textContent=user.email||'Student account';
  const {data:c,error:ce}=await db.from('courses').select('id,title,slug').eq('slug',courseSlug).eq('is_published',true).maybeSingle();if(ce)throw ce;if(!c)throw Error('This course is not published yet.');
  course=c;
  const {data:paid,error:pe}=await db.from('course_payments').select('id').eq('student_id',user.id).eq('status','approved').in('course_slug',[courseSlug,'combo']).limit(1);
  if(pe)throw new Error('Payment approval system is not configured yet. Ask the administrator to run supabase/payment-approval-gate.sql before exams are enabled.');
  if(!paid||!paid.length){$('loading').innerHTML='<h1>Payment approval required</h1><p>Your course payment has not yet been approved. Return to the Student Portal, scan the PhonePe QR, submit your UTR and wait for administrator confirmation. Certificate and marksheet generation is locked until payment approval.</p><a class="button primary" href="student.html">Go to Student Portal</a>';return;}
  const {data:qs,error:qe}=await db.from('questions').select('id,question_text,options').eq('course_id',course.id).eq('is_active',true);
  if(qe)throw qe;
  if(qe){$('loading').innerHTML='<h1>Question bank could not be loaded</h1><p>The portal could not read the course question bank. Please ask the administrator to check Supabase table permissions and database setup.</p><p class="muted">Technical detail: '+esc(qe.message||'Database query failed')+'</p><a class="button primary" href="student.html">Return to student portal</a>';return;}if(!qs||qs.length<requestedCount){const n=qs?.length||0;const setup=n===0?'The database has no active questions for this course yet. The administrator must run the SQL setup files in the Supabase SQL Editor, in this order: schema.sql, admin-setup.sql, then seed-question-bank.sql.': 'The course question bank is only partly populated.';$('loading').innerHTML='<h1>Exam not available yet</h1><p>'+setup+'</p><p>This course currently has '+n+' active questions. A '+requestedCount+'-question exam needs at least '+requestedCount+' active questions. Please do not repeatedly retry until the question bank has been populated.</p><a class="button primary" href="student.html">Return to student portal</a>';return;}
  questions=qs.sort(()=>Math.random()-.5).slice(0,requestedCount);
  $('courseTitle').textContent=course.title+' — Certification Assessment';
  $('questionCounter').textContent='Question 1 of '+questions.length;
  $('loading').classList.add('hidden');$('examShell').classList.remove('hidden');
  $('questionGrid').innerHTML=questions.map((q,i)=>'<button type="button" class="qjump" data-jump="'+i+'" aria-label="Go to question '+(i+1)+'">'+(i+1)+'</button>').join('');
  $('questionGrid').addEventListener('click',e=>{const b=e.target.closest('[data-jump]');if(b){saveCurrent();index=Number(b.dataset.jump);render();}});
  $('prevBtn').addEventListener('click',()=>{saveCurrent();if(index>0)index--;render();});
  $('nextBtn').addEventListener('click',()=>{saveCurrent();if(index<questions.length-1)index++;render();});
  $('submitBtn').addEventListener('click',()=>submitExam(false));
  render();showTime();resetIdle();timerId=setInterval(()=>{seconds--;showTime();if(seconds<=0)submitExam(true);},1000);
 }catch(e){$('loading').innerHTML='<h1>Could not open exam</h1><p>'+esc(e.message||'Please try again.')+'</p><a class="button primary" href="student.html">Return to student portal</a>';}
}
function saveCurrent(){const picked=document.querySelector('input[name="answer"]:checked');if(picked)answers.set(questions[index].id,Number(picked.value));}
function render(){
 const q=questions[index];$('questionCounter').textContent='Question '+(index+1)+' of '+questions.length;
 $('questionArea').innerHTML='<div class="question">'+(index+1)+'. '+esc(q.question_text)+'</div>'+q.options.map((o,j)=>'<label class="option"><input type="radio" name="answer" value="'+j+'" '+(answers.get(q.id)===j?'checked':'')+'><span><strong>'+String.fromCharCode(65+j)+'.</strong> '+esc(o)+'</span></label>').join('');
 $('prevBtn').disabled=index===0;$('nextBtn').textContent=index===questions.length-1?'Last question':'Save & Next →';
 document.querySelectorAll('.qjump').forEach((b,i)=>{b.classList.toggle('answered',answers.has(questions[i].id));b.classList.toggle('current',i===index);});
 updateProgress();
}
function updateProgress(){const n=answers.size;$('answerCount').textContent='Answered '+n+' of '+questions.length;$('progressFill').style.width=(n/questions.length*100)+'%';}
async function submitExam(timeUp){
 if(examFinished)return;saveCurrent();examFinished=true;clearInterval(timerId);clearTimeout(idleId);$('submitBtn').disabled=true;$('nextBtn').disabled=true;$('prevBtn').disabled=true;
 $('questionArea').innerHTML='<p>Submitting answers securely…</p>';
 const payload=questions.map(q=>({question_id:q.id,selected_option:answers.has(q.id)?answers.get(q.id):-1}));
 try{
  const {data,error}=await db.rpc('submit_sts_exam',{p_course_slug:course.slug,p_question_count:questions.length,p_answers:payload});
  if(error)throw error;
  $('examShell').classList.add('hidden');$('resultPanel').classList.remove('hidden');
  const pct=Number(data.percentage||0);
  $('resultPanel').innerHTML='<span class="badge">ASSESSMENT RESULT</span><h1>'+(data.passed?'Congratulations — you passed':'Assessment completed')+'</h1><p class="status">'+(timeUp?'The time limit was reached and your answers were submitted automatically.':'Your answers were submitted successfully.')+'</p><div class="result-score">'+esc(pct.toFixed(2))+'%</div><p><strong>Score:</strong> '+esc(data.score)+' / '+esc(data.total)+'<br><strong>Status:</strong> '+(data.passed?'PASS':'NOT PASSED')+'<br><strong>Pass mark:</strong> 60%</p>'+(data.certificate_number?'<p><strong>Certificate number:</strong><br>'+esc(data.certificate_number)+'</p><p class="status">This is a private Smart Tax Solution training certificate, not a TCS or government-accredited credential.</p>':'<p class="status">Review the course lessons and try again when ready.</p>')+'<button id="resultSignOut" class="btn-primary" type="button">Sign out securely</button> <a class="button" href="student.html">Student portal</a>';
  $('resultSignOut').addEventListener('click',()=>signOut('Exam completed. You have signed out.'));
 }catch(e){examFinished=false;$('submitBtn').disabled=false;$('nextBtn').disabled=false;$('prevBtn').disabled=false;$('questionArea').innerHTML='<p role="alert">Submission could not be confirmed: '+esc(e.message||'Unknown error')+'. Keep this page open and contact the administrator; do not assume your result was saved.</p><button class="btn-primary" id="retrySubmit" type="button">Retry submission</button>'; $('retrySubmit').addEventListener('click',()=>{examFinished=false;submitExam(timeUp);});}
}
init();
})();