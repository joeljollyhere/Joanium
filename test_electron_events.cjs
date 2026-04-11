const { app, WebContentsView } = require('electron');

app.whenReady().then(() => {
  const v = new WebContentsView();
  v.webContents.on('console-message', (...args) => console.log('EVENT: console-message', args));
  v.webContents.on('did-start-navigation', (...args) => console.log('EVENT: did-start-navigation', args));
  v.webContents.on('did-fail-load', (...args) => console.log('EVENT: did-fail-load', args));
  v.webContents.on('page-title-updated', (...args) => console.log('EVENT: page-title-updated', args));
  
  v.webContents.loadURL('data:text/html,<script>console.log("test_console_log"); document.title="Hello_Title"; setTimeout(()=>window.location="http://0.0.0.0:1234", 100);</script>');
  
  setTimeout(() => app.quit(), 2000);
});
