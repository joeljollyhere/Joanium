const { app, BrowserWindow, WebContentsView } = require('electron');

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 800, height: 600 });
  win.loadURL('data:text/html,<body style="background:red"><h1>Main Window</h1></body>');

  const v = new WebContentsView();
  v.webContents.loadURL('data:text/html,<body style="background:blue"><h1>Child View</h1></body>');
  
  // Wait a bit to ensure main is loaded
  setTimeout(() => {
    win.contentView.addChildView(v);
    v.setBounds({ x: 100, y: 100, width: 400, height: 400 });
    console.log("Child view added");
  }, 1000);
});
