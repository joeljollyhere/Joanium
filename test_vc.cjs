const { app, WebContentsView } = require('electron');
app.whenReady().then(() => {
  const v = new WebContentsView();
  console.log('setVisible:', typeof v.setVisible === 'function');
  app.quit();
});
