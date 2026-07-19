let taskList=[];
let task;

function getTask(){
    task=document.getElementById("input_bar").value;
    taskList.unshift(task);
    renderTaskList();
};
function renderTaskList(){
    let displayTask="";
    let num=1;
    for (let i of taskList){
        displayTask+=`<div class="eachtask" id="task${num}">
        <span>${num}</span><p>${i}</p>
        <div class="control_btns">
            <button onclick="editTask(${num})">Edit</button>
            <button onclick="deleteTask(${num})">Delete</button>
        </div>
    </div>`
    num++;
    };
    document.body.querySelector(".displayTasks").innerHTML=displayTask;
};
let deleteTask =(num) =>{
    taskList.splice(num-1,1);
    renderTaskList()
};
