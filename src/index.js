const {
  BrowserWindow,
  app,
  ipcMain,
  desktopCapturer,
  systemPreferences,
  dialog,
} = require("electron");
const path = require("path");
const iohook = require("iohook");
const fs = require("fs");

const isMac = process.platform === "darwin";

let appsOpened = [];
let appsOpenedLength;
let win;
let state;

const createWindow = () => {
  win = new BrowserWindow({
    title: "upgrade profits",
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  //open dev tools if in dev env
  // if (isDev) {
  //win.webContents.openDevTools();
  //}
  win.removeMenu();

  win.webContents.loadFile(path.join(__dirname, "./renderer/login.html"));
};

ipcMain.on("authenticate", () => {
  win.loadFile(path.join(__dirname, "./renderer/index.html"));
});

//listen to start and stop
ipcMain.on("start", async () => {
  const screen = systemPreferences.getMediaAccessStatus("screen");
  if (!screen) {
    win.webContents.send("newAppOpen", {
      error: "screen usage approval is required",
    });
    return;
  }
  appsOpened = [];
  appsOpenedLength = 0;
  iohook.start();
  getOpenedApps();
  state = true;
});

ipcMain.on("stop", () => {
  iohook.stop();
  state = false;
});

//getting looking for newly opened window on every mouse click
const getOpenedApps = () => {
  desktopCapturer
    .getSources({
      types: ["window", "screen"],
      thumbnailSize: { height: 0, width: 0 },
    })
    .then((sources) => {
      if (sources.length != appsOpenedLength) {
        appsOpenedLength = sources.length;
        desktopCapturer
          .getSources({
            types: ["window", "screen"],
            thumbnailSize: { height: 0, width: 0 },
            fetchWindowIcons: true,
          })
          .then((sources) => {
            sources.forEach(async (source) => {
              let icon;
              if (source.appIcon) {
                icon = source.appIcon.toJPEG(30);
              }
              const found = appsOpened.find((app) => app.name === source.name);
              if (!found) {
                appsOpened.push({ name: source.name, icon });
                win.webContents.send("newAppOpen", { appsOpened });
              }
            });
          });
      }
    });
};

iohook.on("mouseclick", () => {
  getOpenedApps();
  win.webContents.send("mouseClicked");
});

iohook.on("mousemove", () => {
  win.webContents.send("mouseMoved");
});

iohook.on("keyup", () => {
  win.webContents.send("keyBoardPress");
});

app.whenReady().then(() => {
  createWindow();

  //Remove main window from memory on close
  win.on("closed", () => {
    win = null;
    appsOpened = [];
    appsOpenedLength = 0;
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  win.on("close", async (e) => {
    if (state) {
      e.preventDefault();
      await dialog.showMessageBox(win, {
        type: "info",
        title: "  Confirm  ",
        message: "You have to stop the process before close",
      });
    }
  });
});

let isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
}

app.on("second-instance", (e) => {
  // Someone tried to run a second instance, we should focus our window.
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});
