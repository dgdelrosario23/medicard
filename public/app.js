const $ = id => document.getElementById(id);
const limits = [60000,80000,100000,150000,300000,400000];
const currency = n => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:2}).format(n);
// Columns: annual principal, annual dependent, semi-annual principal, semi-annual dependent.
const supplied = {
  1:[[14554,17465,7714,9256],[18562,22274,9838,11805],[25556,30668,13545,16254],[32163,38595,17046,20455],[46266,55519,24521,29425],[53206,63847,28199,33839]],
  0:[[13231,15877,7012,8415],[16874,20249,8943,10732],[23233,27880,12313,14776],[29239,35086,15497,18596],[42060,50472,22292,26750],[48369,58043,25636,30763]]
};
const supplied50 = {
  1:[[14099,16918,7472,8967],[17877,21453,9475,11370],[24311,29173,12885,15462],[29920,35904,15858,19029],[41811,50174,22160,26592],[50318,60381,26669,32002]],
  0:[[12817,15380,6793,8151],[16252,19503,8614,10337],[22101,26521,11714,14056],[27200,32640,14416,17299],[38010,45612,20145,24174],[45743,54892,24244,29093]]
};
const rooms=['Ward (Open)','Semi-Private (Open)','Small Private (Open)','Large Private (Open)','Small Suite up to Plan 5000','Large Suite up to Plan 8000'];
let saved={};try{saved=JSON.parse(localStorage.getItem('medicard-rates-v2'))||{};}catch{}
const rates={};
for(const access of [0,1]) limits.forEach((limit,i)=>{rates[`${limit}-${access}-1`]=[...supplied[access][i]];rates[`${limit}-${access}-50`]=[...supplied50[access][i]];});
if(saved.rates && typeof saved.rates==='object') for(const [key,row] of Object.entries(saved.rates)) {
  if(/^\d+-[01]-(1|50)$/.test(key) && Array.isArray(row) && row.length===4) rates[key]=row.map(v=>typeof v==='number' && Number.isFinite(v) && v>=0 ? v : '');
}
$('tax').value='included';
function renderRates(){
  $('rate-rows').replaceChildren();
  limits.forEach(limit=>{
    const key=`${limit}-${$('rate-access').value}-${$('rate-pec').value}`;
    const tr=document.createElement('tr'),label=document.createElement('td');label.textContent=currency(limit);tr.append(label);
    ['Annual principal','Annual dependent','Semi-annual principal','Semi-annual dependent'].forEach((title,column)=>{
      const td=document.createElement('td'),input=document.createElement('input');input.type='number';input.min='0';input.max='100000000';input.step='0.01';input.placeholder='Not set';input.value=rates[key]?.[column]??'';
      input.setAttribute('aria-label',`${currency(limit)} MBL, ${title}`);
      input.addEventListener('input',()=>{rates[key]??=['','','',''];rates[key][column]=input.validity.valid && input.value!==''?Number(input.value):'';persist();});td.append(input);tr.append(td);
    });$('rate-rows').append(tr);
  });
}
function persist(){try{localStorage.setItem('medicard-rates-v2',JSON.stringify({rates}));}catch{alert('Rates could not be saved in this browser. Keep this page open or enable browser storage.');}update();}
function state(mbl=Number($('mbl').value),counts=null){
  const access=document.querySelector('[name=access]:checked').value,pec=document.querySelector('[name=pec]:checked').value;
  const principals=counts?counts.principals:Number($('principals').value),dependents=counts?counts.dependents:Number($('dependents').value),semi=$('period').value==='semi';
  const row=rates[`${mbl}-${access}-${pec}`]||[];
  const zeroRated=$('tax').value==='zero';
  const adjusted=value=>typeof value==='number'&&Number.isFinite(value)?(zeroRated?Math.round((value/1.12+Number.EPSILON)*100)/100:value):value;
  const principalRate=adjusted(row[semi?2:0]),dependentRate=adjusted(row[semi?3:1]);
  const taxLabel=zeroRated?'Zero-rated (0% VAT)':'VAT included (12%)';
  const valid=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
  const validRate=valid(principalRate)&&(dependents===0||valid(dependentRate));
  const validMembers=Number.isInteger(principals)&&principals>0&&principals<=100000&&Number.isInteger(dependents)&&dependents>=0&&dependents<=100000;
  const total=validRate&&validMembers?principalRate*principals+(dependents?dependentRate*dependents:0):null;
  const index=limits.indexOf(mbl);const room=rooms[index]+(access==='1'?(index===0?' w/o AHMC & CSMC':index===1?' w/o AHMC; w/ CSMC':' w/ AHMC & CSMC'):'');
  const hospital=access==='1'?'Nationwide with top-5 hospitals (MMC, SLMC Q.C. & Global City, TMC, AHMC, and CSMC)':'Nationwide without top-5 hospitals.';
  return {taxLabel,zeroRated,mbl,access,pec,principals,dependents,semi,principalRate,dependentRate,validRate,validMembers,total,room,hospital,ready:validRate&&validMembers};
}
function employeeGroups(){
  return [...document.querySelectorAll('.employee-group')].map((el,index)=>({name:el.querySelector('.group-name').value.trim()||`Employee group ${index+1}`, ...state(Number(el.querySelector('select').value),{principals:el.querySelector('input[type=number]').valueAsNumber,dependents:el.querySelectorAll('input[type=number]')[1].valueAsNumber})}));
}
function quoteState(){
  const groups=employeeGroups(),first=groups[0];
  return {...first,groups,principals:groups.reduce((n,g)=>n+g.principals,0),dependents:groups.reduce((n,g)=>n+g.dependents,0),validMembers:groups.every(g=>g.validMembers),validRate:groups.every(g=>g.validRate),ready:groups.every(g=>g.ready),total:groups.every(g=>g.ready)?groups.reduce((n,g)=>n+g.total,0):null};
}
$('add-group').onclick=()=>{
  const group=document.querySelector('.employee-group').cloneNode(true);
  group.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  group.querySelector('.group-name').value='';
  const counts=group.querySelectorAll('input[type=number]');counts[0].value='1';counts[1].value='0';
  const remove=document.createElement('button');remove.type='button';remove.className='remove-group';remove.textContent='Remove group';remove.onclick=()=>{group.remove();update();};group.append(remove);
  $('employee-groups').append(group);update();group.querySelector('.group-name').focus();
};
function update(){const s=quoteState();
  $('summary-company').textContent=$('company').value.trim()||'Your team, covered.';
  $('sum-mbl').textContent=s.groups.length===1?`${currency(s.mbl)} / illness / year`:s.groups.map(g=>`${g.name}: ${currency(g.mbl)}`).join(' · ');
  $('sum-access').textContent=s.access==='1'?'Nationwide with top-5 hospitals.':'Nationwide without top-5 hospitals.';$('sum-room').textContent=s.groups.length===1?s.room:'By employee group (see proposal)';
  $('sum-pec').textContent=s.pec==='1'?'100% of MBL':'50% of MBL';
  $('sum-members').textContent=s.validMembers?`${s.principals} principal · ${s.dependents} dependent`:'—';
  $('total-label').textContent=s.semi?'Group premium per semi-annual installment':'Annual group premium';
  $('total').textContent=s.ready?currency(s.total):'—';
  $('price-detail').textContent=s.ready?s.groups.map(g=>`${g.name}: ${currency(g.total)}`).join(' · ')+(s.semi?` · 2 installments = ${currency(s.total*2)} / year`:''):'Complete each employee group to calculate pricing';
  $('rate-status').textContent=!s.validMembers?'Enter whole member counts: at least 1 principal and 0 or more dependents.':!s.validRate?'Rates for this selection have not been supplied. Add them in Manage rates.':s.taxLabel;
  $('generate').disabled=!s.ready;
}
$('proposal-form').addEventListener('input',update);$('proposal-form').addEventListener('change',update);
for(const id of ['rate-access','rate-pec'])$(id).addEventListener('change',renderRates);
$('rates-toggle').onclick=()=>{$('rates-panel').hidden=!$('rates-panel').hidden;};$('close-rates').onclick=()=>{$('rates-panel').hidden=true;};
function add(tag,text,parent=$('proposal-output')){const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;}
$('generate').onclick=()=>{
  if(!$('proposal-form').reportValidity())return;const s=quoteState();if(!s.ready)return;
  $('pdf-links').hidden=true;
  $('proposal-output').replaceChildren();
  const logo=document.createElement('img');logo.src=$('brand-logo').src;logo.alt='MediCard — An AIA Company';logo.className='proposal-logo';$('proposal-output').append(logo);
  add('h1','SME Choice proposal');
  add('p',`Prepared for ${$('company').value.trim()}\n${[$('contact').value,$('email').value].filter(Boolean).join(' · ')}\nDate: ${new Date().toLocaleDateString('en-PH',{timeZone:'Asia/Manila',year:'numeric',month:'long',day:'numeric'})}`);
  add('h2','Your selected coverage');
  add('p',`Hospital access option: ${s.hospital}\nPre-existing condition coverage: ${$('sum-pec').textContent}\nMembers: ${s.principals} principal; ${s.dependents} dependent`);
  s.groups.forEach(g=>add('p',`${g.name}\nMaximum benefit limit: ${currency(g.mbl)} per illness per member per year\nRoom & board: ${g.room}\nHospital access: ${g.hospital}\nMembers: ${g.principals} principal; ${g.dependents} dependent`));
  add('h3','Hospital reference');const hospitals=add('ul','');hospitals.className='hospital-reference';document.querySelectorAll('#hospital-names li').forEach(li=>add('li',li.textContent,hospitals));
  add('h2','Included benefits');const ul=add('ul','');ul.className='included-benefits';document.querySelectorAll('.benefits li').forEach(li=>add('li',li.textContent,ul));
  add('h2','Pricing');add('p',`Payment mode: ${s.semi?'Semi-annual (2 installments per year)':'Annual'}`);
  s.groups.forEach(g=>add('p',`${g.name} — ${currency(g.mbl)} MBL\nPrincipal members: ${g.principals} × ${currency(g.principalRate)} = ${currency(g.principals*g.principalRate)}${g.dependents?`\nDependent members: ${g.dependents} × ${currency(g.dependentRate)} = ${currency(g.dependents*g.dependentRate)}`:''}\nGroup subtotal: ${currency(g.total)}`));
  add('p',`${s.semi?'Group premium per installment':'Annual group premium'}: ${currency(s.total)}`).className='quote-total';
  if(s.semi)add('p',`Total for 2 semi-annual installments: ${currency(s.total*2)} per year. Each installment uses the supplied semi-annual rate; it is not half the annual rate.`);
  add('p',`Tax treatment: ${s.taxLabel}.`);
  add('p','Semi-annual and quarterly premium payment options are also available based on the number of enrollees.');
  if(s.zeroRated)add('p','Zero-rated per-member rates are calculated by dividing the VAT-inclusive rate by 1.12 and rounding to 2 decimal places before multiplying by member counts.');
  if($('notes').value.trim()){add('h2','Additional notes');add('p',$('notes').value.trim());}
  const comparison=add('section','');comparison.className='mbl-comparison';
  add('h2','Compare MBL options',comparison);
  add('p',`Same hospital access option (${s.access==='1'?'with top hospitals':'without top hospitals'}), PEC coverage (${$('sum-pec').textContent}), member counts (${s.principals} principal; ${s.dependents} dependent), payment mode (${s.semi?'semi-annual':'annual'}), and tax treatment (${s.taxLabel}).`,comparison);
  if(s.groups.length>1)add('p','For comparison, each row below applies one MBL to all members across the employee groups. Your selected proposal above retains the different MBLs and subtotals for each group.',comparison);
  const wrap=add('div','',comparison);wrap.className='table-scroll';
  const table=add('table','',wrap);table.className='comparison-table';
  add('caption','MBL and pricing comparison',table);
  const head=add('thead','',table),header=add('tr','',head);
  const headings=['MBL / member / illness / year','Room & board','Principal / member'];
  if(s.dependents>0)headings.push('Dependent / member');
  headings.push(s.semi?'Group / installment':'Annual group total');
  if(s.semi)headings.push('Group / year (2 installments)');
  headings.forEach(text=>add('th',text,header).scope='col');
  const body=add('tbody','',table);
  limits.forEach(limit=>{
    const option=state(limit,{principals:s.principals,dependents:s.dependents}),row=add('tr','',body);
    if(s.groups.length===1&&limit===s.mbl)row.className='selected-option';
    const label=add('th',`${currency(limit)}${s.groups.length===1&&limit===s.mbl?' (selected)':''}`,row);label.scope='row';
    add('td',option.room,row);
    const display=rate=>typeof rate==='number'&&Number.isFinite(rate)?currency(rate):'Not available';
    add('td',display(option.principalRate),row);
    if(s.dependents>0)add('td',display(option.dependentRate),row);
    add('td',option.ready?currency(option.total):'Not available',row);
    if(s.semi)add('td',option.ready?currency(option.total*2):'Not available',row);
  });
  add('p',"Room and board/MBL can be customized depending on employee's rank. All other optional benefits such as the area coverage, pre-existing condition limit, and hospital access must be applied uniformly.",comparison).className='customization-note';
  add('p',"Customized pricing is also available to match your budget. Please contact us to discuss options tailored to your company's needs.",comparison).className='budget-note';
  const prepared=add('section','');prepared.className='prepared-by';
  add('h3','Prepared by',prepared);
  add('p','Darwin Del Rosario\nLicensed MediCard Account Officer\nAA0000000187',prepared);
  add('h3','Get in touch:',prepared);
  add('p','Mobile: 0921 682 1415\nEmail: dgdelrosario23@gmail.com',prepared);
  $('preview').showModal();
};
$('close-preview').onclick=()=>$('preview').close();$('print').onclick=()=>window.print();renderRates();update();

let proposalPDFURL=null;
function downloadProposalPDF(){
  const {jsPDF}=window.jspdf;
  const pdf=new jsPDF({unit:'mm',format:'a4'});
  const margin=16,width=178,bottom=280;
  pdf.addImage($('pdf-logo').src,'PNG',16,14,65,65*420/1517);
  let y=43;
  // Built-in PDF fonts use PHP instead of the unsupported peso glyph.
  const plain=text=>text.replace(/₱/g,'PHP ').replace(/[–—]/g,'-').replace(/’/g,"'").replace(/·/g,' | ').replace(/×/g,'x');
  function textBlock(text,size=10,bold=false,gap=4){
    pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);
    pdf.setTextColor(...(bold?[100,0,153]:[23,20,92]));
    const lines=pdf.splitTextToSize(plain(text),width);
    const lineHeight=size*0.46;
    for(const line of lines){if(y+lineHeight>bottom){pdf.addPage();y=18;}pdf.text(line,margin,y);y+=lineHeight;}
    y+=gap;
  }
  function render(element){
    const tag=element.tagName;
    if(tag==='TABLE'){
      const head=[...element.querySelectorAll('thead tr')].map(row=>[...row.cells].map(cell=>plain(cell.textContent)));
      const body=[...element.querySelectorAll('tbody tr')].map(row=>[...row.cells].map(cell=>plain(cell.textContent)));
      pdf.autoTable({head,body,startY:y,margin:{left:margin,right:margin,top:18,bottom:18},styles:{fontSize:8,cellPadding:2,overflow:'linebreak',textColor:[23,20,92]},headStyles:{fillColor:[100,0,153]},rowPageBreak:'avoid'});
      y=pdf.lastAutoTable.finalY+7;return;
    }
    if(tag==='H1'||tag==='H2'||tag==='H3'){
      if(['Your selected coverage','Hospital reference','Included benefits','Pricing','Compare MBL options','Prepared by'].includes(element.textContent))y+=12;
      if(y>250){pdf.addPage();y=18;}
      textBlock(element.textContent,tag==='H1'?22:tag==='H2'?14:11,true);return;
    }
    if(tag==='P'){textBlock(element.textContent,element.classList.contains('quote-total')?14:10,element.classList.contains('quote-total')||element.classList.contains('budget-note'));return;}
    if(tag==='UL'){[...element.children].forEach(li=>textBlock('- '+li.textContent,10,false,0));y+=4;return;}
    [...element.children].forEach(render);
  }
  render($('proposal-output'));
  const name=$('company').value.trim().replace(/[^a-zA-Z0-9 -]/g,'').slice(0,70)||'Company';
  if(proposalPDFURL)URL.revokeObjectURL(proposalPDFURL);
  proposalPDFURL=URL.createObjectURL(pdf.output('blob'));
  $('pdf-save').href=proposalPDFURL;
  $('pdf-save').download=`MediCard-${name}-Proposal.pdf`;
  $('pdf-open').href=proposalPDFURL;
  $('pdf-links').hidden=false;
  $('export-status').textContent='PDF prepared. A download was requested, but this preview may block it. If no file appears, use the links below or open the portal in a full browser.';
  $('pdf-save').click();
}
$('download-pdf').onclick=()=>{try{downloadProposalPDF();}catch(error){$('export-status').textContent='PDF download failed. Open the portal in a full browser and try again.';console.error(error);}};
$('print').onclick=()=>{ $('export-status').textContent='If no print dialog opens, use Download PDF. Embedded previews may block printing.';try{window.print();}catch{ $('export-status').textContent='Printing is blocked here. Use Download PDF.';}};
