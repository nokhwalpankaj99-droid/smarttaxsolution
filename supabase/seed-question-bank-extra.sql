-- Smart Tax Solution: add 30 more GST and 30 more Income Tax practice questions.
-- Run in Supabase SQL Editor AFTER schema.sql, admin-setup.sql, and seed-question-bank.sql.
-- Safe to re-run: questions are matched by course + exact question text; answer keys are inserted only if absent.
-- These are foundational practice questions, not legal/tax advice. Verify law-sensitive content before public launch.

begin;

insert into public.courses(slug,title,description,is_published)
values
 ('gst','GST Course','GST fundamentals, registration, returns, input tax credit and compliance practice.',true),
 ('income-tax','Income Tax Course','Indian income tax fundamentals, ITR, deductions, TDS and compliance practice.',true)
on conflict (slug) do update set is_published=true;

create temporary table sts_extra_questions(
 course_slug text, question_text text, options jsonb, correct_option integer, explanation text
) on commit drop;

insert into sts_extra_questions values
-- GST: 30 additional questions
('gst','Which form is commonly used by a regular taxpayer to report monthly or quarterly summary GST liability?', '["GSTR-3B","GSTR-10 only","ITR-2","Form 16"]',0,'GSTR-3B is the summary return used to report liability and discharge tax, subject to applicable rules.'),
('gst','What does HSN stand for in GST invoicing?', '["Harmonized System of Nomenclature","High Supply Number","Home State Number","Highway Service Note"]',0,'HSN is used to classify goods.'),
('gst','What does SAC generally classify under GST?', '["Services","Salaried employees","Bank accounts","Vehicles only"]',0,'SAC means Services Accounting Code.'),
('gst','What is the main purpose of a credit note under GST?', '["Reduce taxable value or tax in applicable circumstances","Create a new GSTIN","Replace the PAN permanently","Register a trademark"]',0,'A credit note may be issued in specified cases such as excess value or tax charged, subject to law.'),
('gst','Which tax is generally applicable to an inter-state supply of goods?', '["IGST","SGST alone","CGST alone","Municipal tax"]',0,'Inter-state taxable supplies generally attract IGST, subject to place-of-supply rules.'),
('gst','Can a registered person claim ITC on every motor vehicle purchase?', '["No, restrictions and exceptions apply","Yes, without any conditions","Only if purchased in cash","Only if purchased on Sunday"]',0,'Motor vehicle ITC is restricted in many cases, with specified exceptions under GST law.'),
('gst','What is the usual role of a GST tax period return?', '["Report relevant supplies, tax liability and/or credits","Renew a driving licence","File a passport application","Record employee leave only"]',0,'GST returns report information required by the relevant return form.'),
('gst','What is the purpose of GST registration cancellation application where applicable?', '["Request cancellation of a GST registration","Claim an automatic income-tax refund","Create a bank IFSC","Generate a vehicle VIN"]',0,'Cancellation is requested through the prescribed GST process when applicable.'),
('gst','What is the general meaning of exempt supply under GST?', '["A supply treated as exempt under the applicable GST law","Every supply with a tax invoice","Every export irrespective of rules","Every purchase made by a company"]',0,'Exempt supply is defined under GST law and has specific consequences, including for ITC.'),
('gst','What is a composite supply generally taxed by reference to?', '["The principal supply, subject to GST law","The lowest-valued item in every case","The customer’s bank","The invoice colour"]',0,'A composite supply is treated according to the principal supply under the statutory rules.'),
('gst','What is a mixed supply generally taxed at?', '["The highest applicable rate among its constituent supplies, subject to law","Always zero percent","Always the lowest rate","The income-tax slab rate"]',0,'A mixed supply is generally taxed at the highest rate applicable to its constituent supplies.'),
('gst','What is the general purpose of an e-invoice system where applicable?', '["Report specified invoice details to the Invoice Registration Portal and obtain an IRN","File an individual ITR","Register a vehicle","Pay employee PF only"]',0,'E-invoicing involves reporting specified invoice data and obtaining an Invoice Reference Number where mandated.'),
('gst','What does IRN mean in GST e-invoicing?', '["Invoice Reference Number","Income Return Note","Interstate Registration Name","Input Reconciliation Number"]',0,'IRN means Invoice Reference Number.'),
('gst','Which document is commonly used to record movement of goods when e-way bill rules apply?', '["E-way bill","Form 16A","AIS","Salary slip"]',0,'An e-way bill is required for movement of goods in prescribed situations.'),
('gst','Is GST registration threshold identical for every state and every type of supply?', '["No, thresholds and conditions can differ","Yes, with no exceptions","It depends only on bank account","It is always zero"]',0,'Thresholds and compulsory-registration rules depend on the applicable law and circumstances.'),
('gst','What should a taxpayer check before claiming ITC shown in an auto-drafted statement?', '["Eligibility, receipt of supply, tax invoice and other statutory conditions","Only the supplier logo","Only the invoice font","Nothing at all"]',0,'An auto-drafted statement alone does not remove the need to meet ITC conditions.'),
('gst','What is the usual GST treatment of a supply between distinct persons in specified circumstances?', '["It may be treated as a supply even without consideration","It is always outside GST","It is always exempt","It is automatically a salary payment"]',0,'Certain transactions between distinct persons are treated as supplies under Schedule I, subject to law.'),
('gst','What does LUT commonly allow an eligible exporter to do under GST?', '["Export without payment of IGST subject to conditions","Avoid all GST returns permanently","Claim every purchase as ITC automatically","Cancel PAN"]',0,'An eligible exporter may furnish LUT to export without payment of IGST, subject to conditions.'),
('gst','What is the purpose of a GST refund application?', '["Request refund of eligible tax or balance under the applicable rules","Create a new GSTIN","File a passport application","Change a vehicle registration"]',0,'Refunds are available only in eligible cases and follow prescribed procedures.'),
('gst','What is the general purpose of a GST audit or departmental verification?', '["Check compliance with applicable GST requirements","Guarantee a refund","Replace the annual accounts","Issue a driving licence"]',0,'Verification may examine records, returns and compliance under the law.'),
('gst','Can a taxpayer use ITC to pay every kind of GST liability without restriction?', '["No, utilisation rules and restrictions apply","Yes, for every liability","Only for income tax","Only for penalties in all cases"]',0,'ITC utilisation is governed by statutory order and restrictions; some liabilities require cash payment.'),
('gst','What does GSTN commonly refer to?', '["Goods and Services Tax Network","General Sales Tax Notice","Government Salary Tax Number","Goods Supply Transport Note"]',0,'GSTN is the Goods and Services Tax Network, which supports the GST IT system.'),
('gst','What is the purpose of a bill of supply in applicable cases?', '["Document supplies by specified persons such as those not charging tax on the invoice","Replace every tax invoice in all cases","Serve as an income-tax refund order","Register a company"]',0,'A bill of supply is issued in prescribed cases, such as exempt supplies or composition taxpayers.'),
('gst','Does a composition taxpayer generally collect GST separately from customers on a tax invoice?', '["No, subject to the composition scheme rules","Yes, always at any rate","Only IGST","Only TDS"]',0,'Composition taxpayers generally cannot collect tax separately and issue a bill of supply, subject to law.'),
('gst','What should a business do when GST portal data and its books do not reconcile?', '["Investigate the differences and correct records/returns through permitted procedures","Ignore all differences","Delete its registration","Create a duplicate PAN"]',0,'Reconciliation helps identify missing invoices, errors and compliance issues.'),
('gst','Which records can help support an ITC claim?', '["Tax invoice and evidence required by law, including receipt and other conditions","Only a verbal statement","Only a bank passbook cover","Only a quotation"]',0,'Supporting records and statutory conditions should be retained for ITC claims.'),
('gst','What is the main purpose of a GST registration certificate?', '["Evidence of GST registration and related particulars","Proof of income-tax refund","Vehicle insurance policy","Employee appointment letter"]',0,'The certificate displays registration details such as GSTIN and legal name.'),
('gst','Are GST rates and procedures subject to amendments and notifications?', '["Yes, check current official updates","No, they never change","Only banks can change them","Only taxpayers can set them"]',0,'GST law, rates and procedures can change; current official notifications should be checked.'),
('gst','Which official source should be checked for current GST portal services and notices?', '["The official GST portal and applicable government notifications","An unverified social-media post only","A random message forward","A vehicle dealer website"]',0,'Use official GST portal resources and relevant legal notifications.'),
('gst','What is the first practical step after finding an error in a GST return?', '["Identify the error and check the legally permitted correction route and due dates","Submit the same return repeatedly","Delete all invoices","Stop keeping accounts"]',0,'Correction depends on the return type, tax period, applicable law and deadlines.'),

-- Income Tax: 30 additional questions
('income-tax','What is the usual Indian financial year period?', '["1 April to 31 March","1 January to 31 December","1 July to 30 June","1 October to 30 September"]',0,'The financial year generally runs from 1 April through 31 March.'),
('income-tax','What does Assessment Year generally mean in the Indian income-tax framework?', '["The year following the financial year in which income is assessed","The same as a calendar year in every case","The employee joining year only","The GST return period"]',0,'Assessment Year generally follows the relevant Financial Year under the traditional terminology of the Income-tax Act, 1961. Check current law and transition rules for the relevant tax year.'),
('income-tax','Which authority administers direct income tax in India?', '["Income Tax Department under the Central Government","GST Council alone","Election Commission","Local municipal office only"]',0,'The Income Tax Department administers income-tax law in India.'),
('income-tax','What is the main purpose of Form 16?', '["Employer-issued certificate with salary and TDS details for an employee","GST return for outward supplies","E-way bill","Company incorporation certificate"]',0,'Form 16 provides salary and tax-deduction information from an employer.'),
('income-tax','What is Form 16A generally associated with?', '["TDS certificate for specified non-salary payments","GST registration","Annual GST return","Vehicle registration"]',0,'Form 16A is generally a TDS certificate for non-salary payments.'),
('income-tax','What is Form 26AS commonly used to review?', '["Tax credits and specified tax-related information","GST stock movement only","Vehicle insurance","Passport status"]',0,'Form 26AS contains tax credit and other specified tax-related information.'),
('income-tax','What does AIS stand for on the income-tax portal?', '["Annual Information Statement","Annual Insurance Schedule","Account Interest Slip","Assessment Identification Sheet"]',0,'AIS means Annual Information Statement.'),
('income-tax','What should a taxpayer do if AIS contains a transaction they believe is incorrect?', '["Review records and submit feedback through the portal where appropriate","Ignore all AIS information permanently","Delete PAN","File a GST return instead"]',0,'Taxpayers can review AIS information and submit feedback where the portal provides that facility.'),
('income-tax','What is advance tax?', '["Tax paid during the year in instalments when statutory conditions apply","A tax refund bonus","GST on imports","A bank loan"]',0,'Advance tax is payable in prescribed instalments when the legal conditions are met.'),
('income-tax','What is self-assessment tax?', '["Tax paid by the taxpayer after computing total tax and credits before filing, where payable","Tax deducted only by an employer","A GST late fee","A bank service charge"]',0,'Self-assessment tax is paid after calculating tax liability and available credits, where a balance is due.'),
('income-tax','What is TDS?', '["Tax Deducted at Source","Total Deposit Summary","Tax Deferred System","Trade Duty Statement"]',0,'TDS means Tax Deducted at Source.'),
('income-tax','What is TAN generally used for?', '["Tax deduction or collection compliance where TAN is required","Vehicle registration","GST e-way bill generation","Opening every savings account"]',0,'TAN is generally required for persons responsible for deducting or collecting tax in prescribed cases.'),
('income-tax','What is the purpose of ITR e-verification?', '["Complete the return verification process through an accepted method","Guarantee a refund","Create a GSTIN","Replace a PAN card"]',0,'A filed return must be verified as prescribed for processing.'),
('income-tax','Does filing an income-tax return automatically mean a refund is approved?', '["No, processing and eligibility checks apply","Yes, always","Only if filed on paper","Only if GST is paid"]',0,'A refund depends on processing, credits and final tax liability.'),
('income-tax','What is a tax deduction generally?', '["An amount allowed to be reduced from income or tax as specified by law","A bank penalty in every case","A GSTIN number","A vehicle registration fee"]',0,'The exact effect of a deduction depends on the relevant provision and tax computation.'),
('income-tax','What should be checked before claiming a deduction under a particular section?', '["Current law, eligibility, applicable tax regime and supporting evidence","Only the taxpayer surname","Only bank branch name","Nothing"]',0,'Deduction eligibility and availability can depend on the applicable regime and statutory conditions.'),
('income-tax','What is the purpose of a notice under income-tax law?', '["Communicate a request, processing result or statutory proceeding","Guarantee a penalty in every case","Register a GSTIN","Approve a vehicle loan"]',0,'Notices vary; read the section, facts, deadline and response instructions carefully.'),
('income-tax','What should a taxpayer do after receiving an official tax notice?', '["Verify authenticity, read the deadline and respond through the prescribed channel","Ignore it automatically","Send a password by email","Delete all records"]',0,'Use the official portal and seek professional advice when needed; never share passwords.'),
('income-tax','What is the general purpose of a revised return where permitted?', '["Correct an eligible error or omission in an earlier return within the legal time limit","Cancel PAN permanently","File GST returns","Guarantee a refund"]',0,'A revised return is available only where law permits and within the applicable time limit.'),
('income-tax','What is the general purpose of a belated return where permitted?', '["File a return after the original due date within the statutory time limit","Replace a GST registration","Claim every deduction automatically","Avoid all interest and fees"]',0,'A belated return is subject to statutory deadlines and consequences.'),
('income-tax','Can a taxpayer always choose any ITR form regardless of income sources?', '["No, the eligible form depends on income and circumstances","Yes, any form is valid for everyone","Only ITR-1 is allowed to all taxpayers","Only companies can file ITR"]',0,'ITR form eligibility depends on income sources, status and other prescribed conditions.'),
('income-tax','What is capital gain generally associated with?', '["Profit or gain from transfer of a capital asset, subject to law","Salary paid every month only","GST collected on sales only","A bank account number"]',0,'Capital gains rules apply to qualifying transfers of capital assets, subject to statutory provisions.'),
('income-tax','What is the usual role of a tax audit under income-tax law?', '["Examine specified accounts and report in cases covered by law","Guarantee a tax refund","Replace all bookkeeping","Register a trademark"]',0,'Tax audit requirements apply to specified persons and conditions under current law.'),
('income-tax','What is the purpose of Form 10E in applicable cases?', '["Furnish particulars for relief under section 89 where applicable","Register for GST","Apply for TAN only","Create an e-way bill"]',0,'Form 10E is used for relief under section 89 in applicable cases; confirm current rules.'),
('income-tax','What is the purpose of a tax challan?', '["Record payment of tax to the government","Record a vehicle service","Issue a GSTIN","Replace an invoice"]',0,'A challan records tax payment details and should be retained for reconciliation.'),
('income-tax','What should be checked when reconciling TDS credits with books?', '["TDS certificates, Form 26AS/AIS and relevant payment records","Only the logo on invoices","Only the bank branch address","Nothing"]',0,'Reconciliation helps identify missing or mismatched tax credits.'),
('income-tax','Is the new or old tax regime choice and its consequences identical for every taxpayer?', '["No, rules and eligibility depend on taxpayer type and current law","Yes, in every situation","It depends only on city","It is decided by the bank"]',0,'Regime choice and switching rules vary by taxpayer category and applicable law.'),
('income-tax','Which source is appropriate for current income-tax forms, services and official notices?', '["The official Income Tax e-Filing portal and government notifications","Unverified social media only","A random forwarded message","A vehicle dealer portal"]',0,'Use the official e-filing portal and applicable government notifications.'),
('income-tax','What should be done before filing a return with a refund claim?', '["Reconcile income, deductions, tax payments and credits against records","Assume every claim is automatically allowed","Delete bank statements","Use someone else’s PAN"]',0,'Reconcile records and verify eligibility before filing.'),
('income-tax','Why should tax questions involving rates and due dates be checked against current official sources?', '["Tax law, forms, rates and deadlines can change","They never change","Only banks decide tax rates","A social-media post is always authoritative"]',0,'Tax law changes; verify current provisions and official notifications for the relevant year.');

-- Insert questions that are not already present for the course.
with inserted as (
 insert into public.questions(course_id,question_text,options,explanation,is_active)
 select c.id,s.question_text,s.options,s.explanation,true
 from sts_extra_questions s
 join public.courses c on c.slug=s.course_slug
 where not exists (
   select 1 from public.questions q
   where q.course_id=c.id and q.question_text=s.question_text
 )
 returning id,course_id,question_text
)
insert into public.question_answer_keys(question_id,correct_option)
select i.id,s.correct_option
from inserted i
join sts_extra_questions s on s.question_text=i.question_text
on conflict (question_id) do nothing;

-- Ensure answer keys exist for these exact seed questions if a prior run inserted the questions.
insert into public.question_answer_keys(question_id,correct_option)
select q.id,s.correct_option
from sts_extra_questions s
join public.courses c on c.slug=s.course_slug
join public.questions q on q.course_id=c.id and q.question_text=s.question_text
on conflict (question_id) do nothing;

commit;

-- Expected: at least 50 active questions per course after the original 20-question seed
-- and this 30-question extension have both been run.
select c.slug, count(q.id) filter (where q.is_active) as active_questions
from public.courses c
left join public.questions q on q.course_id=c.id
where c.slug in ('gst','income-tax')
group by c.slug
order by c.slug;
