/**
 * @OnlyCurrentDoc
 */

function onInstall(e) {
  onOpen(e);
  Logger.log(e.authMode);
}

/******************* UI **************************/
// Add the menu to the document.
/******************************************************/

function onOpen(e) {
  var ui = DocumentApp.getUi();
  
  ui.createAddonMenu().addItem('Search', 'showPopup').addItem("Watch", "showSidebar").addSeparator().addItem('About DocuTube', 'showAbout')
    .addToUi();
}

// Abstract server-side methods
function DTApi(namespace, method) {
  return this[namespace][method]
  .apply(this,Array.prototype.slice.call(arguments,2));
}

function showAbout() {
  var app = HtmlService.createHtmlOutputFromFile("about").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).setTitle("About DocuTube").setWidth(600).setHeight(300);
  DocumentApp.getUi().showModalDialog(app, "About DocuTube");
}

// Build the app from a template and display embedded videos
function showSidebar() {
  var app = HtmlService.createHtmlOutputFromFile("sidebar").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).setTitle("DocuTube Watch");
  DocumentApp.getUi().showSidebar(app);
}

function showPopup() {
  var app = HtmlService.createHtmlOutputFromFile("popup").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).setTitle("DocuTube Search").setWidth(1000).setHeight(500);
  DocumentApp.getUi().showModalDialog(app, "DocuTube");
}