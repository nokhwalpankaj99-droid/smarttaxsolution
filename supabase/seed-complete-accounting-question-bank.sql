-- FIXED: Complete Accounting question bank
-- Run this entire file in Supabase SQL Editor.
-- Inserts the course first, then questions, then answer keys, and publishes only after validation.
begin;

insert into public.courses(slug,title,description,is_published)
values (
 'complete-accounting',
 'Complete Accounting Course',
 'Tally Prime, BUSY Accounting Software, GST accounting, purchase and sales entries, inventory management, banking, bank reconciliation, accounting reports and other accounting software.',
 false
)
on conflict (slug) do update
set title=excluded.title, description=excluded.description;

create temporary table if not exists sts_accounting_seed (
 question_text text primary key,
 option_a text not null,
 option_b text not null,
 option_c text not null,
 option_d text not null,
 correct_option integer not null check(correct_option between 0 and 3),
 explanation text not null
) on commit drop;

truncate table sts_accounting_seed;

insert into sts_accounting_seed(question_text,option_a,option_b,option_c,option_d,correct_option,explanation)
values
('Accounting equation is:','Assets = Liabilities + Capital','Assets = Capital - Liabilities','Capital = Assets + Liabilities','Assets = Income + Expenses',0,'Correct answer: Assets = Liabilities + Capital. Review the relevant accounting principle and supporting records.'),
('The main purpose of accounting is to:','Record and communicate financial information','Only calculate GST','Only prepare invoices','Only count cash',0,'Correct answer: Record and communicate financial information. Review the relevant accounting principle and supporting records.'),
('Debit the receiver and credit the giver applies to:','Personal accounts','Real accounts','Nominal accounts','Suspense accounts',0,'Correct answer: Personal accounts. Review the relevant accounting principle and supporting records.'),
('Debit what comes in and credit what goes out applies to:','Real accounts','Personal accounts','Nominal accounts','Capital accounts',0,'Correct answer: Real accounts. Review the relevant accounting principle and supporting records.'),
('Debit expenses and losses; credit incomes and gains applies to:','Nominal accounts','Real accounts','Personal accounts','Bank accounts',0,'Correct answer: Nominal accounts. Review the relevant accounting principle and supporting records.'),
('Cash purchase of goods is recorded as:','Purchases Dr. To Cash','Cash Dr. To Purchases','Sales Dr. To Cash','Cash Dr. To Sales',0,'Correct answer: Purchases Dr. To Cash. Review the relevant accounting principle and supporting records.'),
('Credit sale to a customer is recorded as:','Customer Dr. To Sales','Sales Dr. To Customer','Cash Dr. To Sales','Purchases Dr. To Customer',0,'Correct answer: Customer Dr. To Sales. Review the relevant accounting principle and supporting records.'),
('A ledger is used to:','Classify transactions account-wise','Record only cash','Prepare only GST returns','Store stock physically',0,'Correct answer: Classify transactions account-wise. Review the relevant accounting principle and supporting records.'),
('A trial balance mainly checks:','Arithmetical accuracy of ledger balances','Profitability only','Cash only','GST liability only',0,'Correct answer: Arithmetical accuracy of ledger balances. Review the relevant accounting principle and supporting records.'),
('Which error may not be disclosed by a trial balance?','Complete omission of a transaction','Unequal posting','Wrong totaling','One-sided posting',0,'Correct answer: Complete omission of a transaction. Review the relevant accounting principle and supporting records.'),
('Outstanding salary is:','Expense and liability','Asset and income','Capital receipt','Cash equivalent',0,'Correct answer: Expense and liability. Review the relevant accounting principle and supporting records.'),
('Prepaid insurance is shown as:','Current asset','Current liability','Revenue','Capital',0,'Correct answer: Current asset. Review the relevant accounting principle and supporting records.'),
('Depreciation is charged to:','Allocate asset cost over useful life','Increase market value','Create cash','Record stock',0,'Correct answer: Allocate asset cost over useful life. Review the relevant accounting principle and supporting records.'),
('Straight Line Method generally charges:','Equal depreciation each year','Increasing depreciation each year','No depreciation','Depreciation only on sale',0,'Correct answer: Equal depreciation each year. Review the relevant accounting principle and supporting records.'),
('Bank reconciliation compares:','Cash book bank balance and bank statement','Sales and purchase registers','Trial balance and stock','Payroll and GST',0,'Correct answer: Cash book bank balance and bank statement. Review the relevant accounting principle and supporting records.'),
('Cheque issued but not presented generally makes:','Cash book balance lower than bank statement','Cash book balance higher than bank statement','Both balances zero','No difference',0,'Correct answer: Cash book balance lower than bank statement. Review the relevant accounting principle and supporting records.'),
('Closing stock is generally valued at:','Cost or net realizable value, whichever is lower','Selling price always','Market price plus profit','Zero',0,'Correct answer: Cost or net realizable value, whichever is lower. Review the relevant accounting principle and supporting records.'),
('Gross profit equals:','Net sales less cost of goods sold','Assets less liabilities','Cash receipts less payments','Sales plus capital',0,'Correct answer: Net sales less cost of goods sold. Review the relevant accounting principle and supporting records.'),
('A balance sheet shows:','Assets, liabilities and equity on a date','Income and expenses for a period','Only cash receipts','Only GST',0,'Correct answer: Assets, liabilities and equity on a date. Review the relevant accounting principle and supporting records.'),
('A trade receivable is:','Amount due from customer','Amount payable to supplier','Owner capital','Bank loan',0,'Correct answer: Amount due from customer. Review the relevant accounting principle and supporting records.'),
('A trade payable is:','Amount owed to supplier','Amount due from customer','Cash in hand','Fixed asset',0,'Correct answer: Amount owed to supplier. Review the relevant accounting principle and supporting records.'),
('TallyPrime is used for:','Accounting and inventory management','Only photo editing','Only email','Only video calls',0,'Correct answer: Accounting and inventory management. Review the relevant accounting principle and supporting records.'),
('A sales voucher records:','Sale of goods or services','Purchase only','Cash withdrawal only','Depreciation only',0,'Correct answer: Sale of goods or services. Review the relevant accounting principle and supporting records.'),
('A purchase voucher records:','Purchase of goods or services','Sales return only','Capital withdrawal','Bank reconciliation',0,'Correct answer: Purchase of goods or services. Review the relevant accounting principle and supporting records.'),
('A payment voucher records:','Money paid by business','Money received only','Credit sales only','Stock valuation',0,'Correct answer: Money paid by business. Review the relevant accounting principle and supporting records.'),
('A receipt voucher records:','Money received by business','Money paid to supplier','Depreciation','Stock transfer only',0,'Correct answer: Money received by business. Review the relevant accounting principle and supporting records.'),
('A contra voucher commonly records:','Cash deposited into or withdrawn from bank','Credit sale','Purchase return','Salary outstanding',0,'Correct answer: Cash deposited into or withdrawn from bank. Review the relevant accounting principle and supporting records.'),
('A stock item represents:','An individual inventory product','A bank branch','A customer ledger','A tax return',0,'Correct answer: An individual inventory product. Review the relevant accounting principle and supporting records.'),
('A godown means:','Storage location or warehouse','Customer account','Bank statement','Tax category',0,'Correct answer: Storage location or warehouse. Review the relevant accounting principle and supporting records.'),
('A cost centre helps to:','Track income or expenses by department/activity','Store stock physically','Create invoice number','Record fixed assets only',0,'Correct answer: Track income or expenses by department/activity. Review the relevant accounting principle and supporting records.'),
('GST stands for:','Goods and Services Tax','General Sales Tariff','Goods Supply Transfer','Government Service Tax',0,'Correct answer: Goods and Services Tax. Review the relevant accounting principle and supporting records.'),
('CGST and SGST generally apply to:','Intra-State supplies','Inter-State supplies only','Exports only','Imports only',0,'Correct answer: Intra-State supplies. Review the relevant accounting principle and supporting records.'),
('IGST generally applies to:','Inter-State supplies','Intra-State supplies only','Salary payments','Cash withdrawals',0,'Correct answer: Inter-State supplies. Review the relevant accounting principle and supporting records.'),
('Input Tax Credit means:','Credit of eligible GST paid on business inputs','Income tax refund','Supplier discount','Cash discount',0,'Correct answer: Credit of eligible GST paid on business inputs. Review the relevant accounting principle and supporting records.'),
('GSTR-1 reports:','Details of outward supplies','Income tax deductions','Annual audit','Payroll',0,'Correct answer: Details of outward supplies. Review the relevant accounting principle and supporting records.'),
('GSTR-3B is a:','Summary return for tax liability and payment','Purchase order','Bank statement','TDS certificate',0,'Correct answer: Summary return for tax liability and payment. Review the relevant accounting principle and supporting records.'),
('GSTR-2B is:','Auto-drafted ITC statement','Sales invoice series','Cash book','Audit report',0,'Correct answer: Auto-drafted ITC statement. Review the relevant accounting principle and supporting records.'),
('Reverse Charge Mechanism means:','Recipient pays GST in specified cases','Supplier never issues invoice','GST is never payable','Only cash sales are taxable',0,'Correct answer: Recipient pays GST in specified cases. Review the relevant accounting principle and supporting records.'),
('HSN classifies:','Goods','Services','Employees','Bank branches',0,'Correct answer: Goods. Review the relevant accounting principle and supporting records.'),
('SAC classifies:','Services','Goods','Fixed assets','Cash vouchers',0,'Correct answer: Services. Review the relevant accounting principle and supporting records.'),
('An e-way bill relates to:','Movement of goods','Salary payment','Bank interest','Income tax refund',0,'Correct answer: Movement of goods. Review the relevant accounting principle and supporting records.'),
('TDS means:','Tax Deducted at Source','Tax Deposit Statement','Total Debit Summary','Tax Due Schedule',0,'Correct answer: Tax Deducted at Source. Review the relevant accounting principle and supporting records.'),
('A purchase register helps review:','Supplier invoices and input tax details','Only cash sales','Employee appraisals','Fixed deposit interest only',0,'Correct answer: Supplier invoices and input tax details. Review the relevant accounting principle and supporting records.'),
('A sales register helps review:','Sales invoices and output tax','Supplier payments only','Bank passwords','Depreciation only',0,'Correct answer: Sales invoices and output tax. Review the relevant accounting principle and supporting records.'),
('A day book displays:','Transactions in date order','Only year-end balances','Only fixed assets','Only tax rates',0,'Correct answer: Transactions in date order. Review the relevant accounting principle and supporting records.'),
('Working capital is:','Current assets minus current liabilities','Total assets plus liabilities','Sales minus purchases','Capital minus drawings',0,'Correct answer: Current assets minus current liabilities. Review the relevant accounting principle and supporting records.'),
('Current ratio is:','Current assets divided by current liabilities','Current liabilities divided by sales','Net profit divided by capital','Cash divided by fixed assets',0,'Correct answer: Current assets divided by current liabilities. Review the relevant accounting principle and supporting records.'),
('Receivables ageing analyses:','How long customer invoices remain unpaid','Stock depreciation','Payroll reconciliation','E-way bills',0,'Correct answer: How long customer invoices remain unpaid. Review the relevant accounting principle and supporting records.'),
('Payables ageing analyses:','Outstanding supplier bills by age','Customer discounts','Sales quotations','Employee attendance',0,'Correct answer: Outstanding supplier bills by age. Review the relevant accounting principle and supporting records.'),
('An audit trail helps to:','Trace who entered or changed a transaction and when','Guarantee tax compliance','Replace source documents','Prevent every error',0,'Correct answer: Trace who entered or changed a transaction and when. Review the relevant accounting principle and supporting records.'),
('Before filing GST returns, reconcile:','Books, registers, portal data and tax ledgers','Only cash balance','Only fixed assets','Only attendance',0,'Correct answer: Books, registers, portal data and tax ledgers. Review the relevant accounting principle and supporting records.');

insert into public.questions(course_id,question_text,options,explanation,is_active)
select c.id,s.question_text,
       jsonb_build_array(s.option_a,s.option_b,s.option_c,s.option_d),
       s.explanation,true
from sts_accounting_seed s
cross join public.courses c
where c.slug='complete-accounting'
and not exists (
 select 1 from public.questions q
 where q.course_id=c.id and q.question_text=s.question_text
);

insert into public.question_answer_keys(question_id,correct_option)
select q.id,s.correct_option
from sts_accounting_seed s
join public.courses c on c.slug='complete-accounting'
join public.questions q on q.course_id=c.id and q.question_text=s.question_text
on conflict(question_id) do update
set correct_option=excluded.correct_option;

do $$
declare v_course_id uuid; v_total integer;
begin
 select id into v_course_id from public.courses where slug='complete-accounting';
 if v_course_id is null then
   raise exception 'Complete Accounting course was not created.';
 end if;

 select count(*) into v_total
 from public.questions q
 join public.question_answer_keys k on k.question_id=q.id
 where q.course_id=v_course_id and q.is_active=true;

 if v_total < 50 then
   raise exception 'Only % active questions have answer keys; at least 50 are required.',v_total;
 end if;

 update public.courses set is_published=true where id=v_course_id;
 raise notice 'Complete Accounting published with % active questions and answer keys.',v_total;
end $$;

notify pgrst,'reload schema';
commit;
