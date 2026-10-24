const questionSets={
gst:[
{q:"Which return is commonly used to report outward supplies?",o:["GSTR-1","GSTR-2B","GSTR-9C","ITR-1"],a:0},
{q:"Which statement is generally used by taxpayers to report summary GST liability and pay tax?",o:["GSTR-3B","GSTR-2A only","Form 16","AIS"],a:0},
{q:"What does ITC stand for in GST?",o:["Input Tax Credit","Income Tax Calculation","Invoice Tracking Code","Internal Trade Certificate"],a:0},
{q:"GSTR-2B is primarily a:",o:["Static ITC statement","Payment challan","Income-tax return","Registration certificate"],a:0},
{q:"A GST tax invoice generally records:",o:["Supply details and applicable tax","Only employee attendance","Only bank balance","Personal investment goals"],a:0},
{q:"Which identifier is used to identify a GST-registered taxpayer?",o:["GSTIN","PAN card serial only","Passport number","UAN"],a:0},
{q:"A credit note may be issued, subject to applicable rules, when:",o:["Taxable value or tax charged needs reduction","A new employee joins","A bank account opens","An income-tax refund arrives"],a:0},
{q:"Input tax credit should be claimed only when:",o:["Applicable legal conditions are satisfied","Any invoice is handwritten","The supplier is unknown","No records are kept"],a:0},
{q:"GSTR-3B is generally a:",o:["Summary return","Vehicle registration form","TDS certificate","Company incorporation form"],a:0},
{q:"Good GST reconciliation compares books with:",o:["Relevant portal statements and records","Social media posts","Weather reports","Personal messages"],a:0}
],
tax:[
{q:"In India, PAN is commonly used for:",o:["Taxpayer identification","Vehicle insurance only","Passport travel permission","GST rate notification only"],a:0},
{q:"TDS stands for:",o:["Tax Deducted at Source","Total Deposit Statement","Tax Due Summary","Trade Data Service"],a:0},
{q:"A financial year in India generally runs from:",o:["1 April to 31 March","1 January to 31 December","1 July to 30 June","1 October to 30 September"],a:0},
{q:"Form 16 is generally associated with:",o:["Salary TDS certificate","GST registration","Import licence","Vehicle fitness"],a:0},
{q:"AIS in income-tax reporting stands for:",o:["Annual Information Statement","Annual Invoice Summary","Account Interest Sheet","Assessment Issue Slip"],a:0},
{q:"Which identifier is generally used to log in to the income-tax e-filing portal for an individual?",o:["PAN as user ID, subject to portal rules","Vehicle number","GST invoice number","Driving licence issue date"],a:0},
{q:"TDS deducted from salary is generally deposited by:",o:["The employer/deductor","The employee's customer","The vehicle dealer","The bank branch manager personally"],a:0},
{q:"An income-tax return reports relevant income and tax details for:",o:["A taxpayer and applicable assessment year","Only a vehicle","Only GST purchases","Only bank branch stock"],a:0},
{q:"A tax deduction or exemption should be claimed:",o:["Only when eligible under applicable law","Whenever a person wants","Without supporting details in all cases","Only on verbal advice"],a:0},
{q:"Before selecting a TDS section, it is important to check:",o:["Nature of payment and applicable law","Colour of invoice","Office location only","Customer's vehicle model"],a:0}
]};
let activeQuestions=[],answers={};
const quiz=document.getElementById('quiz');
document.getElementById('startQuiz').addEventListener('click',startQuiz);
function startQuiz(){
 const subject=document.getElementById('subject').value;
 activeQuestions=questionSets[subject].map(item=>{
  const choices=item.o.map((text,index)=>({text,correct:index===item.a}));
  for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
  return {q:item.q,o:choices.map(choice=>choice.text),a:choices.findIndex(choice=>choice.correct)};
 });
 for(let i=activeQuestions.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[activeQuestions[i],activeQuestions[j]]=[activeQuestions[j],activeQuestions[i]];}
 answers={};
 renderQuestions(subject);
}
function renderQuestions(subject){
 quiz.innerHTML='<div><strong>Sample practice — '+(subject==='gst'?'GST Basics':'Income Tax Basics')+'</strong><p>Select one answer for each question.</p></div>';
 activeQuestions.forEach((item,i)=>{
  const block=document.createElement('div');block.innerHTML='<div class="quiz-question">'+(i+1)+'. '+item.q+'</div>';
  item.o.forEach((option,j)=>{const label=document.createElement('label');label.className='quiz-option';label.innerHTML='<input type="radio" name="q'+i+'" value="'+j+'"> '+option;block.appendChild(label)});
  quiz.appendChild(block);
 });
 const submit=document.createElement('button');submit.type='button';submit.className='button primary';submit.textContent='Submit Practice';submit.addEventListener('click',()=>{
  const missing=activeQuestions.findIndex((q,i)=>!quiz.querySelector('input[name="q'+i+'"]:checked));
  if(missing!==-1){const first=quiz.querySelector('input[name="q'+missing+'"]');first.closest('.quiz-option').scrollIntoView({behavior:'smooth',block:'center'});first.focus();alert('Please answer every question before submitting.');return;}
  let score=0;activeQuestions.forEach((q,i)=>{const chosen=quiz.querySelector('input[name="q'+i+'"]:checked');if(chosen&&Number(chosen.value)===q.a)score++});
  const percent=Math.round(score/activeQuestions.length*100);const result=document.createElement('div');result.className='quiz-result';result.setAttribute('role','status');result.setAttribute('aria-live','polite');result.textContent='Your sample score: '+score+'/'+activeQuestions.length+' ('+percent+'%). '+(percent>=60?'You reached the 60% practice target.':'Keep practising and try again.');
  quiz.appendChild(result);submit.disabled=true;submit.textContent='Submitted';
 });
 quiz.appendChild(submit);
}