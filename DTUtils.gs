var DTUtils = (function() {
  
  var utils = {};
  
  utils.self = this;
  
  utils.init = function() {
    
     return
     
  }
  
  utils.about = function() {
    var ui = DocumentApp.getUi();
    var app = HtmlService.createHtmlOutputFromFile('about.html').setHeight(400).setWidth(750);
    
    ui.showModalDialog(app, 'DocuTube')
  }

  utils.shorten = function(string) {
    
    return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, string));
    
  }
  
  /*********************** GET ALL LINKS ************************/
  // Loop through all elements in the Doc and return all links
  // This is a modified script from StackOverflow http://stackoverflow.com/a/18731628/2278429
  // Recursive search through elements of a document
  /**************************************************************/
  utils.buildUrl = function(textObj) {
    var curUrl, url;
    var inUrl = false;
    var text = textObj.getText();
    
    // Check individual characters in the string
      for (var ch=0; ch < text.length; ch++) {
        url = textObj.getLinkUrl(ch);
        if (url != null) {
          return url;
        }
        else {
          if (inUrl) {
            // Not any more, we're not.
            inUrl = false;
            curUrl = {};
        }
      }
    }
  } 
  
  utils.getBodyVideos = function(element) {
    var curUrl, url;
    var links = [];
    
    element = element || DocumentApp.getActiveDocument().getBody();
  
    // Extract a link from a TEXT element
    if (element.getType() === DocumentApp.ElementType.TEXT) {
      Logger.log('Found text!');
      var textObj = element.editAsText();
      
      if(this.buildUrl(textObj)) {        
        Logger.log('Adding an URL from text');
        links.push(this.buildUrl(textObj));
      }
      
    }
    
    // Handle an INLINE_IMAGE with a link attached.
    else if(element.getType() === DocumentApp.ElementType.INLINE_IMAGE) {
      Logger.log('found an image!');
      url = element.getLinkUrl();
      if(url != null) {
        url = String(url);
        Logger.log('Adding an URL from an image');
        links.push(url);
      }
    }
    
    else if(element.getType() === DocumentApp.ElementType.INLINE_DRAWING) {
      Logger.log('Found a drawing!');
      url = element.getLinkUrl();
      if(url != null) {
        url = String(url);
        Logger.log('Adding an URL from a drawing');
        links.push(url);
      }
    }
    
    else if(element.getType() === DocumentApp.ElementType.FOOTNOTE) {
      Logger.log('Found a footnote!');
      var footnote = element.getFootnoteContents().editAsText();
      
      if(this.buildUrl(footnote)) {   
        Logger.log('Adding an URL from a footnote')
        links.push(this.buildUrl(footnote));
      }
      
    }
    
    // None of these elements can have a link attached. Return an empty object.
    else if(element.getType() === DocumentApp.ElementType.HORIZONTAL_RULE) {
      curUrl = {};
    }
    else if(element.getType() === DocumentApp.ElementType.EQUATION) {
      curUrl = {};
    }
    else if(element.getType() === DocumentApp.ElementType.PAGE_BREAK) {
      curUrl = {};
    }
    else {
      var numChildren = element.getNumChildren();
      for (var i=0; i<numChildren; i++) {
        links = links.concat(this.getBodyVideos(element.getChild(i)));
      }
    }
    
    // Return an array of link objects
    return links;
  }
  
  utils.getCommentVideos = function() {

    // Get the comments
    var comments = Drive.Comments.list(DocumentApp.getActiveDocument().getId());
    var commentFrames = [];
    
    
    for(var i=0; i<comments.items.length; i++) {
      var comment = comments.items[i].content;
      
      // Do some regex checking
      // https://stackoverflow.com/a/31711517/2278429
      var re = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/;

      if(comment.match(re)) {
        commentFrames.push(comment.match(re)[0]);
      }
      
    }
    
    
    return commentFrames;
  }
  
  /********************* DISPLAY LINKS *************************/
  // Pull all the links in the Document.
  // For testing purposes only. Not used in client view.
  /*************************************************************/
  utils.displayLinks = function() {
    var links = this.getAllLinks;
    
    for(var i=0;i<links.length;i++) {
      Logger.log(links[i].url);
    }
  }
  
  return utils;

})();
