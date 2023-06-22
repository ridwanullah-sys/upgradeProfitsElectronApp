const Checkin = document.querySelector("#checkin");
const TimeNow = document.querySelector("#nav-left");
const checkInTime = document.querySelector("#check-in-time");
const timeWorked = document.querySelector("#time-worked");
const mousemove = document.querySelector("#mouseMove");
const mouseclick = document.querySelector("#mouseClick");
const keyboardpress = document.querySelector("#keyboardPress");
const listsOfApps = document.querySelector("#listsOfApps");
const tasks = document.querySelector("#tasks");
const chosentask = document.querySelector("#chosentask");
const user = document.querySelector("#user");
const historyButton = document.querySelector("#historyButton");
const mainBody = document.querySelector("#main-body");
const history = document.querySelector("#history");
const hisNav = document.querySelector("#hisNav");
const nameInit = document.querySelector("#nameInit");

let startTime;
let startDate;
let mouseClickCount = 0;
let mouseMoveCount = 0;
let keyboardClick = 0;
let ChosenTask;
let apps;

const username = JSON.parse(window.localStorage.getItem("user"));
nameInit.innerText = username.usernameValue[0];
const currentTime = () => {
  const currentDate = new Date();
  const timeNow =
    currentDate.getHours() +
    ":" +
    currentDate.getMinutes() +
    ":" +
    currentDate.getSeconds();
  TimeNow.innerText = timeNow;
  return timeNow;
};

const currentDate = () => {
  const currentDate = new Date();
  const dateNow =
    currentDate.getDate() +
    ":" +
    currentDate.getMonth() +
    ":" +
    currentDate.getFullYear();
  return dateNow;
};

const Time = window.setInterval(currentTime, 1000);

const toSeconds = (time) => {
  if (time) {
    const array = time.split(":");
    const toSeconds =
      Number(array[0]) * 3600 + Number(array[1]) * 60 + Number(array[2]);
    return toSeconds;
  } else {
    console.log("Time not defined");
  }
};

const workedTime = () => {
  if (startTime) {
    const currentSec = toSeconds(currentTime());
    const timeStart = toSeconds(startTime);
    const diff = currentSec - timeStart;
    const hour = Math.trunc(diff / 3600);
    const minute = Math.trunc((diff % 3600) / 60);
    const sec = (diff % 3600) % 60;
    timeWorked.innerText = `${hour}h ${minute}m ${sec}s`;
    return [`${hour}h ${minute}m ${sec}s`, diff];
  }
  return [`0h 0m 0s`, "0"];
};

const handleCheckIn = () => {
  if (!ChosenTask) {
    alert("Choose a task", "error");
    return;
  }
  const buttons = document.getElementsByClassName("taskButtons");
  if (!startTime) {
    ipcRenderer.send("start");
    startTime = currentTime();
    startDate = currentDate();
    checkInTime.innerText = startTime;
    Checkin.innerText = "STOP";
    Checkin.style.backgroundColor = "red";
    for (let index = 0; index < buttons.length; index++) {
      buttons[index].disabled = true;
    }
  } else {
    ipcRenderer.send("stop");
    startTime = null;
    checkInTime.innerText = "-- : -- : --";
    Checkin.innerText = "START";
    Checkin.style.backgroundColor = "#006600";
    timeWorked.innerHTML = "0h 0m 0s ";
    mousemove.innerText = `0 moves/sec`;
    mouseclick.innerText = `0 clicks/sec`;
    keyboardpress.innerText = `0 press/sec`;
    listsOfApps.innerHTML = null;
    apps = null;
    for (let index = 0; index < buttons.length; index++) {
      buttons[index].disabled = false;
    }
  }
};

const averageActivities = () => {
  if (startTime) {
    const currentSec = toSeconds(currentTime());
    const timeStart = toSeconds(startTime);
    const diff = currentSec - timeStart;
    const averageMouseMove = mouseMoveCount / diff;
    const averageMouseClick = mouseClickCount / diff;
    const averageKeyboardPress = keyboardClick / diff;
    if (averageMouseClick != Infinity && averageMouseClick != NaN) {
      mouseclick.innerText = `${averageMouseClick.toFixed(4)} clicks/sec`;
    }

    if (averageMouseMove != Infinity && averageMouseMove != NaN) {
      mousemove.innerText = `${averageMouseMove.toFixed(4)} moves/sec`;
    }

    if (keyboardpress != Infinity && keyboardpress != NaN) {
      keyboardpress.innerText = `${averageKeyboardPress.toFixed(4)} press/sec`;
    }

    return [averageMouseMove, averageMouseClick, averageKeyboardPress];
  }
};

const UpdateTimeSpent = window.setInterval(() => {
  workedTime();
  averageActivities();
}, 1000);

const handleNewAppOpened = (...args) => {
  if (args[1].error) {
    const error = document.createElement("div");
    error.innerHTML = args[1].error;
    error.style.backgroundColor = "red";
    error.style.padding = "2px";
    error.style.color = "white";
    listsOfApps.append(error);
    alert(args[1].error, "error");
    return;
  }
  apps = args[1].appsOpened;
  listsOfApps.innerHTML = null;
  const openedApps = args[1].appsOpened;
  const html = openedApps.map((app) => {
    const div = document.createElement("div");
    if (app.icon) {
      const data = app.icon;
      var image = btoa(String.fromCharCode.apply(null, data));
      const img = document.createElement("img");
      img.src = `data:image/png;base64,${image}`;
      img.style.height = "25px";
      img.style.width = "25px";
      const p = document.createElement("p");
      p.innerText = app.name;
      div.append(img);
      div.append(p);
      div.classList.add("imageList");
    }
    return div;
  });
  listsOfApps.append(...html);
};

const Tasks = [
  "Track Mouse moves",
  "Track Keyboard Presses",
  "Track Mouse Clicks",
  "Track Opened Apps",
  "Implement a nice UI",
  "Implement Start and Stop button",
  "Allow user to select task",
];

Tasks.map((task) => {
  const div = document.createElement("div");
  div.innerHTML = task;
  const button = document.createElement("button");
  button.append(div);
  button.classList.add("taskButtons");
  button.addEventListener("click", () => {
    ChosenTask = task;
    chosentask.innerText = ChosenTask;
    setActiveButton();
  });
  tasks.append(button);
});

const setActiveButton = () => {
  const buttons = document.getElementsByClassName("taskButtons");
  for (let index = 0; index < buttons.length; index++) {
    if (buttons[index].innerText === ChosenTask) {
      buttons[index].style.backgroundColor = "#196719";
      buttons[index].style.color = "#e6e6e6";
    } else {
      buttons[index].style.backgroundColor = "#eafaea";
      buttons[index].style.color = "#4d4d4d";
    }
  }
};

const saveWork = async () => {
  let historyFiles;
  const file = window.localStorage.getItem("history");
  if (file) {
    historyFiles = JSON.parse(file);
  } else {
    historyFiles = [];
  }
  if (workedTime()[1] > 0) {
    const work = {
      Taskname: ChosenTask,
      checkInTime: `${startDate} ${startTime}`,
      checkOutTime: `${currentDate()} ${currentTime()}`,
      workedTime: workedTime()[0],
      AMMR: averageActivities()[0],
      AMCR: averageActivities()[1],
      KCR: averageActivities()[2],
    };
    historyFiles.push(work);
    if (historyFiles.length > 20) {
      historyFiles.pop();
    }
    const string = JSON.stringify(historyFiles);
    window.localStorage.setItem("history", string);
  }
};

const alert = (message, type) => {
  const options = {
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: type === "success" ? "green" : "red",
      color: "white",
      textAlign: "center",
    },
  };
  Toastify.toast(options);
};

historyButton.addEventListener("click", () => {
  history.style.display = "flex";
  mainBody.style.display = "none";
});

user.addEventListener("click", () => {
  history.style.display = "none";
  mainBody.style.display = "block";
});

const updateHistory = async () => {
  const historyFiles = window.localStorage.getItem("history");
  if (historyFiles) {
    const histories = JSON.parse(historyFiles);
    const length = histories.length > 20 ? 20 : histories.length;
    for (let index = 0; index < length; index++) {
      const taskname = `<p>Taskname : ${histories[index].Taskname}</p>`;
      const Checkin = `<p>Checkin Time : ${histories[index].checkInTime}</p>`;
      const CheckOut = `<p>CheckOut Time : ${histories[index].checkOutTime}</p>`;
      const worked = `<p>Worked Time : ${histories[index].workedTime}</p>`;
      const AMMR = `<p>AMMR : ${histories[index].AMMR} moves/sec</p>`;
      const AMCR = `<p>AMCR : ${histories[index].AMCR} clicks/sec</p>`;
      const KTR = `<p>KTR : ${histories[index].KCR} press/sec</p>`;
      const historyString =
        taskname + Checkin + CheckOut + worked + AMMR + AMCR + KTR;
      const div = document.createElement("div");
      div.innerHTML = historyString;
      div.classList.add("histories");
      history.append(div);
    }
  }
};

updateHistory();

const Register = () => {};

ipcRenderer.on("mouseClicked", () => (mouseClickCount += 1));
ipcRenderer.on("mouseMoved", () => (mouseMoveCount += 1));
ipcRenderer.on("keyBoardPress", () => (keyboardClick += 1));
ipcRenderer.on("newAppOpen", handleNewAppOpened);

Checkin.addEventListener("click", () => {
  saveWork();
  handleCheckIn();
  updateHistory();
});
