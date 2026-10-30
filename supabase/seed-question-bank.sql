-- Smart Tax Solution starter question bank
-- Safe to re-run: existing question text for the same course is not duplicated.
-- Run AFTER schema.sql and admin-setup.sql in Supabase SQL Editor.
begin;

insert into public.courses(slug,title,description,is_published)
values
 ('gst','GST Course','GST fundamentals, registration, returns, input tax credit and compliance practice.',true),
 ('income-tax','Income Tax Course','Indian income tax fundamentals, ITR, deductions, TDS and compliance practice.',true)
on conflict (slug) do update set title=excluded.title, description=excluded.description, is_published=true;

create temporary table sts_seed_questions(
 course_slug text, question_text text, options jsonb, correct_option integer, explanation text
) on commit drop;

insert into sts_seed_questions values
('gst','What is the full form of GST?', '["Goods and Services Tax","General Sales Tariff","Government Service Tax","Goods Supply Tariff"]',0,'GST stands for Goods and Services Tax.'),
('gst','Which authority administers GST in India jointly with states?', '["GST Council","NITI Aayog only","Reserve Bank of India","Election Commission"]',0,'The GST Council recommends key GST policies and rates.'),
('gst','Which return is generally used to report outward supplies by regular taxpayers?', '["GSTR-1","GSTR-2B","GSTR-9C only","ITR-1"]',0,'GSTR-1 reports details of outward supplies.'),
('gst','Which return is generally used to declare summary GST liability and payment?', '["GSTR-3B","GSTR-1A only","GSTR-7 only","Form 16"]',0,'GSTR-3B is the summary return used to report liability and discharge tax.'),
('gst','What does ITC mean under GST?', '["Input Tax Credit","Income Tax Certificate","Interstate Tax Collection","Invoice Turnover Code"]',0,'ITC means Input Tax Credit, subject to statutory conditions.'),
('gst','Which tax is generally levied on an intra-state taxable supply?', '["CGST and SGST/UTGST","IGST only","Customs duty only","TDS only"]',0,'Intra-state supplies generally attract CGST plus SGST or UTGST.'),
('gst','Which tax generally applies to an inter-state taxable supply?', '["IGST","SGST only","CGST only","Property tax"]',0,'IGST generally applies to inter-state supplies.'),
('gst','What is the purpose of a GSTIN?', '["Identify a GST-registered person","Register a vehicle","File an income tax appeal only","Generate a bank IFSC"]',0,'GSTIN is the Goods and Services Tax Identification Number.'),
('gst','Can input tax credit be claimed without meeting statutory conditions?', '["No","Always","Only in cash","Only on Sundays"]',0,'ITC is available only when applicable legal conditions are met.'),
('gst','What is the usual purpose of a debit note under GST?', '["Increase taxable value or tax in an applicable case","Cancel a bank account","File an ITR","Register a trademark"]',0,'A debit note may be issued where taxable value or tax charged is increased.'),
('gst','Which portal is the official GST common portal?', '["gst.gov.in","incometax.gov.in","mca.gov.in only","rbi.org.in"]',0,'The GST common portal is gst.gov.in.'),
('gst','What does reverse charge mean?', '["Recipient pays tax where the law specifies","Supplier never issues an invoice","Tax is permanently waived","Only customs tax is paid"]',0,'Under reverse charge, the recipient is liable to pay tax in specified cases.'),
('gst','What is a tax invoice mainly used for?', '["Documenting a taxable supply and tax details","Replacing a PAN card","Proving vehicle ownership","Applying for a passport"]',0,'A tax invoice records supply and relevant tax particulars.'),
('gst','Which document commonly reflects supplier-uploaded invoice details for a recipient’s ITC reconciliation?', '["GSTR-2B","Form 26AS only","AIS only","Passport"]',0,'GSTR-2B is an auto-drafted ITC statement.'),
('gst','Is every purchase invoice automatically eligible for ITC?', '["No, eligibility conditions and restrictions apply","Yes, without exception","Only handwritten bills qualify","Only cash purchases qualify"]',0,'ITC depends on statutory conditions and blocked-credit rules.'),
('gst','What is the general purpose of an e-way bill?', '["Document movement of goods when required","File annual income tax return","Register a company name","Pay employee salary"]',0,'An e-way bill documents movement of goods in prescribed cases.'),
('gst','What is the purpose of GST registration?', '["Register a person liable or eligible under GST law","Issue driving licences","Open a demat account","Approve building plans"]',0,'GST registration records a person under the GST system.'),
('gst','What is a place of supply rule used to determine?', '["Whether supply is inter-state or intra-state and related tax treatment","Employee attendance","Bank interest rate","Vehicle insurance IDV"]',0,'Place-of-supply rules help determine the nature and tax treatment of a supply.'),
('gst','What is the usual treatment of eligible exports under GST?', '["Zero-rated supply, subject to law","Always exempt domestic supply","Always non-taxable salary","A vehicle registration fee"]',0,'Exports are treated as zero-rated supplies under GST, subject to conditions.'),
('gst','What should a taxpayer do if a return contains an error?', '["Correct it using the applicable legal return/correction process","Ignore every error","Delete the GSTIN","Create a second PAN"]',0,'Corrections should be made through the process permitted by GST law and portal.');

insert into sts_seed_questions values
('income-tax','What does PAN stand for?', '["Permanent Account Number","Personal Assessment Note","Primary Account Name","Public Allotment Number"]',0,'PAN is the Permanent Account Number issued by the Income Tax Department.'),
('income-tax','Which portal is used for Indian income tax e-filing?', '["incometax.gov.in","gst.gov.in","mca.gov.in only","passportindia.gov.in"]',0,'The official income tax e-filing portal is incometax.gov.in.'),
('income-tax','What is an ITR?', '["Income Tax Return","Input Tax Register","Income Transfer Receipt","Investment Tax Record"]',0,'ITR means Income Tax Return.'),
('income-tax','Which document commonly reports salary and TDS details provided by an employer?', '["Form 16","GSTR-1","E-way bill","GST registration certificate"]',0,'Form 16 is commonly issued by an employer for salary and TDS information.'),
('income-tax','What does TDS mean?', '["Tax Deducted at Source","Total Deposit Statement","Tax Deferred Scheme","Trade Duty Summary"]',0,'TDS means Tax Deducted at Source.'),
('income-tax','Which identification number is commonly used for income tax matters in India?', '["PAN","GSTIN only","IFSC","VIN"]',0,'PAN is widely used for income tax identification.'),
('income-tax','What is advance tax?', '["Tax paid during the year in prescribed instalments when applicable","A tax refund bonus","GST on imports","A bank loan"]',0,'Advance tax is paid during the financial year when statutory conditions apply.'),
('income-tax','What does AIS stand for on the income tax portal?', '["Annual Information Statement","Annual Insurance Schedule","Account Identification Slip","Assessment Interest Summary"]',0,'AIS means Annual Information Statement.'),
('income-tax','What is Form 26AS commonly used to review?', '["Tax credit and tax-related information","GST stock movement","Vehicle registration","Company incorporation only"]',0,'Form 26AS contains tax credit and other specified tax information.'),
('income-tax','Does selecting an ITR form depend on the taxpayer’s income sources and circumstances?', '["Yes","No, everyone must use the same form","Only on bank name","Only on city"]',0,'The appropriate ITR form depends on eligibility and the taxpayer’s circumstances.'),
('income-tax','What is a financial year in India generally?', '["1 April to 31 March","1 January to 31 December","1 July to 30 June","1 October to 30 September"]',0,'The Indian financial year generally runs from 1 April through 31 March.'),
('income-tax','What is a tax refund?', '["Excess tax paid or credited that is refundable under the law","A new PAN","A GST invoice","A fixed deposit"]',0,'A refund may arise when tax paid/credited exceeds final tax liability, subject to processing.'),
('income-tax','What is the purpose of Form 10E in applicable salary-arrears cases?', '["Claim relief under section 89","Register for GST","Apply for TAN only","Create an e-way bill"]',0,'Form 10E is used to furnish particulars for relief under section 89 where applicable.'),
('income-tax','What does ITR verification do?', '["Confirms the return filing through an accepted verification method","Automatically guarantees a refund","Creates a GSTIN","Replaces PAN"]',0,'Verification completes the return filing process as required by the portal.'),
('income-tax','Is a tax deduction under a section available automatically without checking eligibility?', '["No, applicable conditions must be met","Yes, for every person","Only if paid in cash","Only for companies"]',0,'Deductions depend on the law and the taxpayer meeting prescribed conditions.'),
('income-tax','What is TAN commonly required for?', '["Persons responsible for deducting or collecting tax where applicable","Every salaried employee in all cases","Vehicle registration","GST e-way bill generation"]',0,'TAN is generally required for persons responsible for TDS/TCS where prescribed.'),
('income-tax','Which form is commonly associated with TDS on certain payments to contractors under section 194C?', '["Form 26Q for quarterly TDS statements","GSTR-3B","Form 16A as a return","E-way bill"]',0,'Form 26Q is used for quarterly TDS statements for specified non-salary payments; applicability should be checked.'),
('income-tax','What is the usual purpose of a notice issued by the Income Tax Department?', '["Request information, communicate processing, or initiate a statutory proceeding","Guarantee a penalty in every case","Register a trademark","Issue a GSTIN"]',0,'Notices have different purposes; read the section, facts, deadline and response instructions.'),
('income-tax','Can a taxpayer check return and refund status on the official e-filing portal?', '["Yes, after signing in and following portal instructions","No, never","Only through GST portal","Only by visiting a bank"]',0,'The e-filing portal provides return and refund status services.'),
('income-tax','What should be checked before claiming a deduction or exemption?', '["Applicable tax regime, eligibility, evidence and current law","Only the taxpayer’s favourite bank","Only the invoice colour","Nothing"]',0,'Claims should be based on current law, eligibility and supporting records.');

-- Add the questions and protected answer keys. All answer indices are 0-based (A=0).
with inserted as (
 insert into public.questions(course_id,question_text,options,explanation,is_active)
 select c.id,s.question_text,s.options,s.explanation,true
 from sts_seed_questions s join public.courses c on c.slug=s.course_slug
 where not exists(select 1 from public.questions q where q.course_id=c.id and q.question_text=s.question_text)
 returning id,course_id,question_text
)
insert into public.question_answer_keys(question_id,correct_option)
select i.id, s.correct_option
from inserted i join sts_seed_questions s on s.question_text=i.question_text
on conflict (question_id) do nothing;

-- Fill answer keys for matching seed questions already present (safe for re-runs).
insert into public.question_answer_keys(question_id,correct_option)
select q.id,s.correct_option
from sts_seed_questions s join public.courses c on c.slug=s.course_slug
join public.questions q on q.course_id=c.id and q.question_text=s.question_text
on conflict (question_id) do nothing;

commit;

-- This starter bank contains 20 questions per course. Add more before launching a 50-question exam.
-- Do not claim the portal is launch-ready until there are at least 100 reviewed questions per course,
-- the live exam flow is tested, and certificate verification is checked end-to-end.
