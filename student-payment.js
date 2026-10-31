(() => {
'use strict';
const $=id=>document.getElementById(id);
const UPI='9664029638-10@ybl';
const client=window.supabase?.createClient(window.STS_SUPABASE_URL,window.STS_SUPABASE_PUBLISHABLE_KEY);
let user=null;
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
async function loadPayments(){
 if(!user)return;
 const {data,error}=await client.from('course_payments').select('course_slug,amount_inr,upi_transaction_id,status,created_at,reviewed_at').eq('student_id',user.id).order('created_at',{ascending:false}).limit(30);
 if(error){$('paymentHistory').textContent='Payment status unavailable. Ask administrator to run supabase/payment-approval-gate.sql.';return;}
 $('paymentHistory').innerHTML=data.length?'<div class="tablewrap"><table><thead><tr><th>Course</th><th>Amount</th><th>UTR</th><th>Status</th><th>Date</th></tr></thead><tbody>'+data.map(p=>'<tr><td>'+({gst:'GST', 'income-tax':'Income Tax',combo:'Combo'}[p.course_slug]||p.course_slug)+'</td><td>₹'+p.amount_inr+'</td><td>'+String(p.upi_transaction_id).replace(/[&<>"]/g,'')+'</td><td><strong>'+p.status.toUpperCase()+'</strong></td><td>'+new Date(p.created_at).toLocaleDateString()+'</td></tr>').join('')+'</tbody></table></div>':'No payment submissions yet.';
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
 try{await drawQR();const {data}=await client.auth.getSession();user=data.session?.user||null;await loadPayments();}catch(e){$('paymentMessage').textContent='Could not load payment tools. '+(e.message||'');}
}
start();
})();