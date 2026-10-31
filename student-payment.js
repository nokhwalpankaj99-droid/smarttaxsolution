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
async function printReceipt(payment){
 if(payment.status!=='approved')return;
 if(!window.jspdf?.jsPDF){$('paymentMessage').textContent='PDF library did not load. Refresh the portal and try again.';return;}
 const receiptNo='STS-PAY-'+String(payment.id).replace(/-/g,'').slice(-10).toUpperCase();
 const course=({gst:'GST Course','income-tax':'Income Tax Course',combo:'GST + Income Tax Combo'})[payment.course_slug]||payment.course_slug;
 const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'}),w=210;
 let logo=null;
 try{
  const res=await fetch('assets/smart-tax-solution-logo.svg',{cache:'no-cache'});if(!res.ok)throw new Error('Logo unavailable');
  const svg=await res.text(),blob=new Blob([svg],{type:'image/svg+xml'}),obj=URL.createObjectURL(blob);
  try{const img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=obj;});const cv=document.createElement('canvas');cv.width=1240;cv.height=236;cv.getContext('2d').drawImage(img,0,0,1240,236);logo=cv.toDataURL('image/png');}finally{URL.revokeObjectURL(obj);}
 }catch(e){console.warn('Receipt logo could not load',e);}
 doc.setDrawColor(20,43,74);doc.setLineWidth(.8);doc.roundedRect(12,12,186,273,3,3);
 if(logo)doc.addImage(logo,'PNG',53,23,104,20,'STSRECEIPTLOGO','FAST');
 else{doc.setFont('helvetica','bold');doc.setFontSize(22);doc.setTextColor(20,43,74);doc.text('SMART TAX SOLUTION',105,37,{align:'center'});}
 doc.setDrawColor(190,145,54);doc.line(25,51,185,51);
 doc.setFont('helvetica','bold');doc.setFontSize(16);doc.setTextColor(20,43,74);doc.text('PAYMENT RECEIPT',105,65,{align:'center'});
 doc.setFillColor(230,245,235);doc.roundedRect(72,72,66,10,5,5,'F');doc.setFontSize(9);doc.setTextColor(23,107,58);doc.text('PAYMENT VERIFIED',105,78.5,{align:'center'});
 const rows=[['Receipt Number',receiptNo],['Student Name',studentName],['Course',course],['Amount Received','INR '+payment.amount_inr],['UPI Transaction / UTR ID',payment.upi_transaction_id],['Payment Submitted',new Date(payment.created_at).toLocaleString('en-IN')],['Payment Verified On',new Date(payment.reviewed_at||Date.now()).toLocaleString('en-IN')]];
 let y=101;
 for(const [label,value] of rows){doc.setDrawColor(226,233,240);doc.line(25,y+7,185,y+7);doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(104,120,139);doc.text(label,28,y);doc.setFont('helvetica','bold');doc.setTextColor(28,45,66);doc.text(doc.splitTextToSize(String(value),90),182,y,{align:'right',maxWidth:90});y+=19;}
 doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(20,43,74);doc.text('Thank you for your payment.',105,244,{align:'center'});
 doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(80,91,104);doc.text('This is a computer generated receipt and hence no signature is required.',105,258,{align:'center',maxWidth:160});
 doc.setFontSize(8);doc.text('Smart Tax Solution | smarttaxsolutionsgnr@gmail.com | WhatsApp: 9664029638',105,268,{align:'center'});
 doc.save('Payment_Receipt_'+receiptNo+'.pdf');
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