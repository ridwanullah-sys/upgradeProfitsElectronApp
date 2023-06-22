const { contextBridge, ipcRenderer } = require("electron");
const Toastify = require("toastify-js");
const fs = require("fs");
const bcrypt = require("bcryptjs");

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) =>
    ipcRenderer.on(channel, (...args) => {
      func(...args);
    }),
});

contextBridge.exposeInMainWorld("Toastify", {
  toast: (Options) => Toastify(Options).showToast(),
});

contextBridge.exposeInMainWorld("fs", {
  writeFileSync: (path, data) => fs.writeFileSync(path, data),
});

contextBridge.exposeInMainWorld("bcrypt", {
  genSalt: (num) => bcrypt.genSalt(10),
  hash: (password, salt) => bcrypt.hash(password, salt),
  compare: (password, encryptedPassword) =>
    bcrypt.compare(password, encryptedPassword),
});
