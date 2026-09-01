let jobs=JSON.parse(localStorage.getItem("jobs")||"[]")
let calendarDate=new Date()
let selectedDate=null

document.addEventListener("DOMContentLoaded",()=>{renderAll();setupIncomeCalculation();if("serviceWorker"in navigator)navigator.serviceWorker.register("service-worker.js").catch(()=>{})})

function saveData(){localStorage.setItem("jobs",JSON.stringify(jobs))}
function money(v){return"₩"+Number(v||0).toLocaleString("ko-KR")}
function daysBetween(a,b){if(!a||!b)return 0;return Math.floor((new Date(b)-new Date(a))/86400000)+1}
function todayString(){let d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function escapeHtml(v){return String(v||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function renderAll(){renderJobs();renderActiveJobs();renderSummary();renderCalendar();renderStatistics()}

function openAddJob(){document.getElementById("addModal").classList.remove("hidden");["jobName","jobStart","jobEnd","jobDaily","jobIncome","jobNote"].forEach(id=>document.getElementById(id).value="");document.getElementById("jobColor").value="#22a45a"}
function closeAddJob(){document.getElementById("addModal").classList.add("hidden")}

function setupIncomeCalculation(){["jobStart","jobEnd","jobDaily"].forEach(id=>document.getElementById(id).addEventListener("input",()=>{let d=daysBetween(jobStart.value,jobEnd.value),p=Number(jobDaily.value||0);if(d>0&&p>0)jobIncome.value=d*p}))}

function saveJob(){
let name=jobName.value.trim(),start=jobStart.value,end=jobEnd.value,daily=Number(jobDaily.value||0),income=Number(jobIncome.value||0)
if(!name)return alert("请输入工作名称")
if(!start||!end)return alert("请选择工作日期")
if(end<start)return alert("结束日期不能早于开始日期")
if(income<=0)return alert("请输入收入金额")
jobs.push({id:Date.now(),name,start,end,days:daysBetween(start,end),daily,income,color:jobColor.value,settled:false,note:jobNote.value.trim()})
saveData();closeAddJob();renderAll()
}

function jobHtml(j){
return`<div class="job-card"><div class="jobColor" style="background:${j.color}"></div><div class="jobHead"><div><div class="jobName">${escapeHtml(j.name)}</div><div class="jobDate">${j.start} 至 ${j.end}</div></div><span class="status ${j.settled?"paid":"pending"}">${j.settled?"已结算":"待结算"}</span></div><div class="jobInfo"><div><small>工期</small><strong>${j.days} 天</strong></div><div><small>日薪</small><strong>${money(j.daily)}</strong></div><div><small>收入</small><strong>${money(j.income)}</strong></div></div>${j.note?`<div class="jobNote">${escapeHtml(j.note)}</div>`:""}<div class="actions"><button onclick="toggleSettled(${j.id})">${j.settled?"待结算":"已结算"}</button><button onclick="copyJob(${j.id})">复制</button><button onclick="editJob(${j.id})">编辑</button><button class="delete" onclick="deleteJob(${j.id})">删除</button></div></div>`
}
function renderJobs(){let box=document.getElementById("jobList");if(!jobs.length){box.innerHTML=`<div class="empty"><strong>还没有工期记录</strong>点击 ＋ 添加第一份工作</div>`;return}box.innerHTML=[...jobs].sort((a,b)=>new Date(b.start)-new Date(a.start)).map(jobHtml).join("")}
function renderActiveJobs(){let box=document.getElementById("activeJobs"),t=todayString(),a=jobs.filter(j=>t>=j.start&&t<=j.end);box.innerHTML=a.length?a.map(jobHtml).join(""):`<div class="empty"><strong>今天没有正在进行的工期</strong>可以点击 ＋ 添加新的工作</div>`}
function renderSummary(){let n=new Date(),list=jobs.filter(j=>{let d=new Date(j.start);return d.getFullYear()==n.getFullYear()&&d.getMonth()==n.getMonth()}),days=list.reduce((s,j)=>s+j.days,0),income=list.reduce((s,j)=>s+j.income,0),paid=list.filter(j=>j.settled).reduce((s,j)=>s+j.income,0);monthDays.textContent=days+" 天";monthIncome.textContent=money(income);settledIncome.textContent=money(paid);pendingIncome.textContent=money(income-paid)}
function toggleSettled(id){let j=jobs.find(x=>x.id===id);if(j){j.settled=!j.settled;saveData();renderAll()}}
function deleteJob(id){if(confirm("确定删除这条工期吗")){jobs=jobs.filter(j=>j.id!==id);saveData();renderAll()}}
function copyJob(id){let j=jobs.find(x=>x.id===id);if(j){jobs.push({...j,id:Date.now(),name:j.name+" 副本",settled:false});saveData();renderAll()}}

function editJob(id){let j=jobs.find(x=>x.id===id);if(!j)return;editId.value=id;editName.value=j.name;editStart.value=j.start;editEnd.value=j.end;editDaily.value=j.daily;editIncome.value=j.income;editColor.value=j.color||"#22a45a";editNote.value=j.note||"";editModal.classList.remove("hidden")}
function closeEditJob(){editModal.classList.add("hidden")}
function updateJob(){let j=jobs.find(x=>x.id===Number(editId.value));if(!j)return;if(!editName.value.trim()||!editStart.value||!editEnd.value)return alert("请填写完整信息");if(editEnd.value<editStart.value)return alert("结束日期不能早于开始日期");Object.assign(j,{name:editName.value.trim(),start:editStart.value,end:editEnd.value,days:daysBetween(editStart.value,editEnd.value),daily:Number(editDaily.value||0),income:Number(editIncome.value||0),color:editColor.value,note:editNote.value.trim()});saveData();closeEditJob();renderAll()}

function changeMonth(n){calendarDate.setMonth(calendarDate.getMonth()+n);renderCalendar()}
function renderCalendar(){
let y=calendarDate.getFullYear(),m=calendarDate.getMonth(),first=new Date(y,m,1).getDay(),total=new Date(y,m+1,0).getDate();calendarTitle.textContent=`${y}年 ${m+1}月`;let html="",today=todayString();for(let i=0;i<first;i++)html+="<div></div>";for(let d=1;d<=total;d++){let date=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,works=jobs.filter(j=>date>=j.start&&date<=j.end);html+=`<div class="calendarDay ${date===today?"today":""}" onclick="selectDate('${date}')"><div class="dayNumber">${d}</div>${works.slice(0,3).map(j=>`<div class="calendarWork" style="background:${j.color}"></div>`).join("")}${works.length>3?`<div class="calendarMore">+${works.length-3}</div>`:""}</div>`}calendarGrid.innerHTML=html;if(selectedDate)renderSelectedDate()}
function selectDate(d){selectedDate=d;renderSelectedDate()}
function renderSelectedDate(){let box=document.getElementById("selectedDateJobs");if(!selectedDate){box.innerHTML="";return}let w=jobs.filter(j=>selectedDate>=j.start&&selectedDate<=j.end);box.innerHTML=`<div class="selectedDate"><h3>${selectedDate}</h3>${w.length?w.map(j=>`<div class="selectedJob" style="border-color:${j.color}"><strong>${escapeHtml(j.name)}</strong><div class="jobDate">${j.start} 至 ${j.end}</div><div class="jobDate">${j.days} 天　${money(j.income)}</div></div>`).join(""):`<div class="empty">当天没有工作</div>`}</div>`}

function renderStatistics(){
let td=jobs.reduce((s,j)=>s+j.days,0),ti=jobs.reduce((s,j)=>s+j.income,0),ts=jobs.filter(j=>j.settled).reduce((s,j)=>s+j.income,0);totalDays.textContent=td+" 天";totalIncome.textContent=money(ti);totalSettled.textContent=money(ts);totalPending.textContent=money(ti-ts);averageDaily.textContent=money(td?Math.round(ti/td):0)
let months={};jobs.forEach(j=>{let k=j.start.slice(0,7);months[k]??={days:0,income:0};months[k].days+=j.days;months[k].income+=j.income});let keys=Object.keys(months).sort().reverse();monthlyStats.innerHTML=keys.length?keys.map(k=>`<div class="monthCard"><div><strong>${k}</strong><small>${months[k].days} 天</small></div><strong>${money(months[k].income)}</strong></div>`).join(""):`<div class="empty">暂无统计数据</div>`
}

function showPage(p){["home","calendar","statistics","settings"].forEach(x=>document.getElementById(x+"Page").classList.toggle("hidden",x!==p));document.querySelectorAll(".side").forEach(x=>x.classList.remove("active"));let i={home:0,calendar:1,statistics:2,settings:3}[p];if(i!==undefined)document.querySelectorAll(".side")[i].classList.add("active");closeSidebar();if(p==="calendar")renderCalendar()}
function toggleSidebar(){sidebar.classList.toggle("open");overlay.classList.toggle("show")}
function closeSidebar(){sidebar.classList.remove("open");overlay.classList.remove("show")}
function clearAllJobs(){if(jobs.length&&confirm("确定清空全部数据吗")){jobs=[];saveData();renderAll()}}
function exportData(){let blob=new Blob([JSON.stringify(jobs,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="工期记录备份.json";a.click();URL.revokeObjectURL(a.href)}
function importData(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result);if(!Array.isArray(d))throw 0;jobs=d;saveData();renderAll();alert("数据导入成功")}catch{alert("数据文件格式错误")}};r.readAsText(f)}
