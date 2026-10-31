(() => {
'use strict';
const $=id=>document.getElementById(id);
const UPI='9664029638-10@ybl';
const client=window.supabase?.createClient(window.STS_SUPABASE_URL,window.STS_SUPABASE_PUBLISHABLE_KEY);
let user=null,studentName='Student';
const prices={gst:999,'income-tax':999,combo:1499};
function amount(){return prices[$('paymentCourse').value]||999;}
async function drawQR(){
 const course=$('paymentCourse').value,amt=amount();
 $('paymentAmount').textContent='₹'+amt;
 const note=course==='combo'?'GST and Income Tax Combo Fee':course==='gst'?'GST Course Fee':'Income Tax Course Fee';
 const uri='upi://pay?pa='+encodeURIComponent(UPI)+'&pn='+encodeURIComponent('Smart Tax Solution')+'&am='+amt+'&cu=INR&tn='+encodeURIComponent(note);
 const img=$('paymentQrImage'),status=$('paymentQrStatus');
 if(!img){console.error('Payment QR image element is missing');return;}
 status.textContent='Loading UPI QR…';
 img.style.display='block';
 img.alt='UPI payment QR for ₹'+amt+' to Smart Tax Solution';
 const imageUrl='https://quickchart.io/qr?size=440&margin=2&ecLevel=H&format=png&text='+encodeURIComponent(uri);
 await new Promise((resolve,reject)=>{
   img.onload=()=>{status.textContent='Scan with PhonePe, Google Pay or any UPI app.';resolve();};
   img.onerror=()=>{status.textContent='QR image could not load. Check your internet connection and refresh this page.';reject(new Error('UPI QR image service unavailable'));};
   img.src=imageUrl;
 });
}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function printReceipt(payment){
 if(payment.status!=='approved'){return;}
 const receiptNo='STS-PAY-'+String(payment.id).replace(/-/g,'').slice(-10).toUpperCase();
 const course=({gst:'GST Course','income-tax':'Income Tax Course',combo:'GST + Income Tax Combo'})[payment.course_slug]||payment.course_slug;
 const issued=payment.reviewed_at?new Date(payment.reviewed_at):new Date();
 const paidOn=new Date(payment.created_at);
 const w=window.open('','_blank','width=800,height=700');
 if(!w){$('paymentMessage').textContent='Please allow pop-ups to open your verified payment receipt.';return;}
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Payment Receipt ${receiptNo}</title><style>body{font:15px Arial,sans-serif;color:#1c2d42;padding:35px}.receipt{max-width:680px;margin:auto;border:2px solid #142b4a;padding:30px}.head{text-align:center;border-bottom:2px solid #e9b44c;padding-bottom:16px}.head h1{color:#142b4a;margin:0 0 6px}.verified{display:inline-block;background:#e6f5eb;color:#176b3a;padding:7px 13px;border-radius:20px;font-weight:bold;margin:18px 0}.row{display:flex;justify-content:space-between;border-bottom:1px solid #e2e9f0;padding:12px 0;gap:20px}.row strong{text-align:right}.amount{font-size:24px;color:#142b4a}.foot{margin-top:25px;font-size:12px;color:#68788b;text-align:center}@media print{body{padding:0}.receipt{border:1px solid #142b4a}}</style></head><body><main class="receipt"><header class="head"><h1>SMART TAX SOLUTION</h1><div>Official Course Fee Payment Receipt</div></header><center><div class="verified">✓ PAYMENT VERIFIED</div></center><div class="row"><span>Receipt Number</span><strong>${esc(receiptNo)}</strong></div><div class="row"><span>Student Name</span><strong>${esc(studentName)}</strong></div><div class="row"><span>Course</span><strong>${esc(course)}</strong></div><div class="row"><span>Amount Received</span><strong class="amount">₹${esc(payment.amount_inr)}</strong></div><div class="row"><span>UPI Transaction / UTR ID</span><strong>${esc(payment.upi_transaction_id)}</strong></div><div class="row"><span>Payment Submitted</span><strong>${esc(paidOn.toLocaleString())}</strong></div><div class="row"><span>Payment Verified On</span><strong>${esc(issued.toLocaleString())}</strong></div><div class="foot">This receipt confirms that the above course fee payment has been verified by Smart Tax Solution.<br>For assistance: smarttaxsolutionsgnr@gmail.com | WhatsApp: 9664029638</div><center><p><button onclick="window.print()">Print / Save as PDF</button></p></center></main></body></html>`);
 w.document.close();
}
async function loadPayments(){
 if(!user)return;
 const {data,error}=await client.from('course_payments').select('id,course_slug,amount_inr,upi_transaction_id,status,created_at,reviewed_at').eq('student_id',user.id).order('created_at',{ascending:false}).limit(30);
 if(error){$('paymentHistory').textContent='Payment status unavailable. Ask administrator to run supabase/payment-approval-gate.sql.';return;}
 $('paymentHistory').innerHTML=data.length?'<div class="tablewrap"><table><thead><tr><th>Course</th><th>Amount</th><th>UTR</th><th>Status</th><th>Date</th><th>Receipt</th></tr></thead><tbody>'+data.map((p,i)=>'<tr><td>'+esc(({gst:'GST','income-tax':'Income Tax',combo:'Combo'})[p.course_slug]||p.course_slug)+'</td><td>₹'+esc(p.amount_inr)+'</td><td>'+esc(p.upi_transaction_id)+'</td><td><strong>'+esc(p.status.toUpperCase())+'</strong></td><td>'+esc(new Date(p.created_at).toLocaleDateString())+'</td><td>'+(p.status==='approved'?'<button type="button" class="btn secondary" data-payment-receipt="'+i+'">View / Print Receipt</button>':p.status==='pending'?'Available after verification':'Not available')+'</td></tr>').join('')+'</tbody></table></div>':'No payment submissions yet.';
 $('paymentHistory').onclick=ev=>{const b=ev.target.closest('[data-payment-receipt]');if(!b)return;const payment=data[Number(b.dataset.paymentReceipt)];if(payment)printReceipt(payment);};
}
async function start(){
 if(!client||!$('paymentCourse'))return;
 $('paymentCourse').addEventListener('change',drawQR);
 $('submitPayment').addEventListener('click',async()=>{
  const utr=$('paymentUtr').value.trim(),course_slug=$('paymentCourse').value,amount_inr=amount();
  if(utr.length<8){$('paymentMessage').textContent='Please enter a valid UTR / transaction reference.';return;}
  const b=$('submitPayment');b.disabled=true;$('paymentMessage').textContent='Submitting payment details…';
  try{
   const {data:{session},error:se}=await client.auth.getSession();if(se)throw se;if(!session?.user)throw new Error('Please sign in again.');
   const {error}=await client.from('course_payments').insert({student_id:session.user.id,course_slug,amount_inr,upi_transaction_id:utr});
   if(error)throw error;
   $('paymentUtr').value='';$('paymentMessage').textContent='Payment details submitted. Status is PENDING until an administrator confirms the credit in the bank/UPI account.';
   await loadPayments();
  }catch(e){$('paymentMessage').textContent=e.message||'Could not submit payment details. Ensure the database migration has been run.';}
  finally{b.disabled=false;}
 });
 try{
  await drawQR();
  const {data}=await client.auth.getSession();user=data.session?.user||null;
  if(user){
   const prof=await client.from('profiles').select('full_name').eq('id',user.id).maybeSingle();
   studentName=prof.data?.full_name||user.user_metadata?.full_name||'Student';
  }
  await loadPayments();
 }catch(e){$('paymentMessage').textContent='Could not load payment tools. '+(e.message||'');}
}
start();
})();