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
  
  utils.buildEmbedUrl = function(resourceType, id) {
    
    var url;
   
    if(resourceType === "channel") {
      url = 'https://youtube.com/channel/' + id;
    } else if(resourceType === "playlist") {
      url = 'https://youtube.com/playlist?list=' + id;
    } else if(resourceType === "video") {
      url = 'https://youtu.be/' + id;
    }
    
    return url;
  }
  
  // Find and return a cached item
  utils.getCachedResource = function(cacheKey, resourceId, resourceType) {
    
    cacheKey = cacheKey || null;
    resourceId = resourceId || null;
    resourceType = resourceType || null;
    
    var cache;
    
    cache = DTCache.get(cacheKey);
    
    var resource = cache.items.find(function(el) {
      if(resourceType === "channel") {
        return el.id.channelId === resourceId;
      } else if(resourceType === "playlist") {
        return el.id.playlistId === resourceId;
      } else if(resourceType === "video") {
        return el.id.videoId === resourceId;
      }
    });
    
    return resource;
    
  }
  
  utils.getResourcePreview = function(args, resource, resourceType) {
    
    var preview;
    
    if(resourceType === "video" || resourceType === undefined) {
      preview = YouTube.Videos.list("player", args);
      DTCache.store(preview.items[0].id, preview, 3600);
    } else if(resourceType === "playlist") {
      preview = YouTube.Playlists.list("player", args);
      // Playlists come back linked via http. Convert to https before returning.
      preview.items[0].player.embedHtml = utils.secureHttp(preview.items[0].player.embedHtml);
      DTCache.store(preview.items[0].id, resource, 3600);
    } else if(resourceType === "channel") {
      // These can be pulled from the cache
      preview = resource.snippet.thumbnails;
      DTCache.store(resource.snippet.channelId, resource, 3600);
    }
   
    return preview;
  }
  
  utils.secureHttp = function(httpUrl) {
    
    var re = /http/gm;
    
    var httpsUrl = httpUrl.replace(re, 'https');
    
    return httpsUrl;
    
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

      var textObj = element.editAsText();
      
      if(this.buildUrl(textObj)) {        

        links.push(this.buildUrl(textObj));
        
      }
      
    }
    
    // Handle an INLINE_IMAGE with a link attached.
    else if(element.getType() === DocumentApp.ElementType.INLINE_IMAGE) {

      url = element.getLinkUrl();
      
      if(url != null) {
        url = String(url);
        links.push(url);
      }
      
    }
    
    else if(element.getType() === DocumentApp.ElementType.INLINE_DRAWING) {

      url = element.getLinkUrl();
      
      if(url != null) {
        url = String(url);
        links.push(url);
      }
      
    }
    
    else if(element.getType() === DocumentApp.ElementType.FOOTNOTE) {

      var footnote = element.getFootnoteContents().editAsText();
      
      if(this.buildUrl(footnote)) {   
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
