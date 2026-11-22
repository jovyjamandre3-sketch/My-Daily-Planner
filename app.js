import { db, userReady } from "./firebase.js";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const page = document.body.dataset.page;
const collectionRef = collection(db, "SchoolWork");
let currentUser = null;
let records = [];
let stopListening = null;

const $ = id => document.getElementById(id);
const safe = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const prettyDate = value => {
  if (!value) return "No date";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});
};
const prettyTime = value => {
  if (!value) return "No time";
  const [h,m] = value.split(":").map(Number);
  const d = new Date(); d.setHours(h,m,0,0);
  return d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
};
function showMessage(id, text, isError=false) {
  const el = $(id); if (!el) return;
  el.textContent = text; el.style.color = isError ? "#B33B5D" : "#3B7D65";
}
function subscribeToRecords() {
  const q = query(collectionRef, where("uid","==",currentUser.uid));
  stopListening = onSnapshot(q, snapshot => {
    records = snapshot.docs.map(item => ({id:item.id,...item.data()}));
    if (page === "dashboard") renderDashboard();
    if (page === "list") renderList();
  }, error => {
    console.error(error);
    if (page === "dashboard") showMessage("dashboardMessage","Unable to load schoolwork. Check your Firebase setup.",true);
    if (page === "list") $("schoolWorkList").innerHTML = '<div class="empty-state">Could not load records. Check Firebase configuration and Firestore rules.</div>';
  });
}
function renderDashboard() {
  const total = records.length;
  const completed = records.filter(r=>r.status==="Completed").length;
  const pending = records.filter(r=>r.status==="Pending").length;
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = records.filter(r=>r.status!=="Completed" && r.dueDate && new Date(`${r.dueDate}T00:00:00`)>=today).length;
  $("totalCount").textContent=total; $("pendingCount").textContent=pending;
  $("completedCount").textContent=completed; $("upcomingCount").textContent=upcoming;
}
function renderList() {
  const filter = $("statusFilter").value;
  const filtered = records.filter(r=>filter==="All" || r.status===filter).sort((a,b)=>(a.dueDate||"9999").localeCompare(b.dueDate||"9999"));
  $("listCount").textContent=`${filtered.length} task${filtered.length===1?"":"s"}`;
  if (!filtered.length) {
    $("schoolWorkList").innerHTML = `<div class="empty-state"><h2>${records.length?"No tasks in this filter yet":"Nothing here yet 🌷"}</h2><p>${records.length?"Try another status filter.":"Add your first schoolwork to start planning."}</p><a class="btn btn-primary" href="add-work.html">＋ Add School Work</a></div>`;
    return;
  }
  $("schoolWorkList").innerHTML=filtered.map(r=>`
    <article class="work-card">
      <div class="work-meta"><span class="pill ${r.priority==="High"?"priority-high":r.priority==="Medium"?"priority-medium":""}">${safe(r.priority||"Medium")} priority</span><span class="pill ${r.status==="Completed"?"status-completed":""}">${safe(r.status||"Pending")}</span></div>
      <h2>${safe(r.title)}</h2><p><strong>Subject:</strong> ${safe(r.subject)}</p>
      <p><strong>Description:</strong> ${safe(r.description||"No description added.")}</p>
      <p><strong>Type:</strong> ${safe(r.workType||"—")}</p>
      <p><strong>Due:</strong> ${safe(prettyDate(r.dueDate))} · ${safe(prettyTime(r.dueTime))}</p>
      <div class="card-actions">
        <a class="btn btn-secondary" href="add-work.html?id=${encodeURIComponent(r.id)}">Edit</a>
        <button class="btn btn-danger" data-delete="${safe(r.id)}">Delete</button>
        ${r.status!=="Completed"?`<button class="btn btn-primary" data-complete="${safe(r.id)}">Mark as Completed</button>`:""}
      </div>
    </article>`).join("");
  $("schoolWorkList").querySelectorAll("[data-delete]").forEach(btn=>btn.addEventListener("click",()=>askDelete(btn.dataset.delete)));
  $("schoolWorkList").querySelectorAll("[data-complete]").forEach(btn=>btn.addEventListener("click",()=>completeTask(btn.dataset.complete)));
}
async function completeTask(id) {
  try { await updateDoc(doc(db,"SchoolWork",id),{status:"Completed"}); }
  catch(error){alert("Could not update task. Please check your Firebase setup.");console.error(error);}
}
let pendingDeleteId=null;
function askDelete(id){pendingDeleteId=id;$("deleteDialog").showModal();}
$("keepWork")?.addEventListener("click",()=>{$("deleteDialog").close();pendingDeleteId=null;});
$("confirmDelete")?.addEventListener("click",async()=>{
  if(!pendingDeleteId)return;
  try{await deleteDoc(doc(db,"SchoolWork",pendingDeleteId));$("deleteDialog").close();pendingDeleteId=null;}
  catch(error){alert("Could not delete this record.");console.error(error);}
});
$("statusFilter")?.addEventListener("change",renderList);

async function setupForm() {
  const params=new URLSearchParams(location.search); const editId=params.get("id");
  const form=$("schoolWorkForm");
  if(editId){
    $("formHeading").textContent="Edit School Work ✎";$("saveButton").textContent="Save Changes";
    try{
      const snap=await getDoc(doc(db,"SchoolWork",editId));
      if(!snap.exists()||snap.data().uid!==currentUser.uid){showMessage("formMessage","This schoolwork could not be found.",true);$("saveButton").disabled=true;return;}
      const data=snap.data();
      ["title","subject","description","workType","priority","dueDate","dueTime","status"].forEach(key=>{if($(key))$(key).value=data[key]||"";});
    }catch(error){showMessage("formMessage","Unable to load this schoolwork.",true);console.error(error);}
  }
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const values={
      title:$("title").value.trim(),subject:$("subject").value.trim(),description:$("description").value.trim(),
      workType:$("workType").value,priority:$("priority").value,dueDate:$("dueDate").value,
      dueTime:$("dueTime").value,status:$("status").value
    };
    if(!values.title||!values.subject||!values.workType||!values.dueDate){showMessage("formMessage","Please complete all required fields.",true);return;}
    const button=$("saveButton");button.disabled=true;button.textContent="Saving…";
    try{
      if(editId) await updateDoc(doc(db,"SchoolWork",editId),values);
      else await addDoc(collectionRef,{...values,uid:currentUser.uid,createdAt:serverTimestamp()});
      showMessage("formMessage","School work saved successfully!");
      location.href="school-work.html";
    }catch(error){
      console.error(error);showMessage("formMessage","Save failed. Check Firebase configuration and Firestore rules.",true);
      button.disabled=false;button.textContent=editId?"Save Changes":"Save School Work";
    }
  });
}
try{
  currentUser=await userReady;
  subscribeToRecords();
  if(page==="form")await setupForm();
}catch(error){
  console.error(error);
  const message="Firebase is not connected yet. Add your Firebase web app config in firebase.js and enable Anonymous Authentication.";
  if(page==="form")showMessage("formMessage",message,true);
  if(page==="dashboard")showMessage("dashboardMessage",message,true);
  if(page==="list")$("schoolWorkList").innerHTML=`<div class="empty-state">${safe(message)}</div>`;
}
