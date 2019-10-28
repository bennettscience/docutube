// TODO: abstract into a generic GET function
var DT = (function() {
  
  const Map = cEs6Shim.Map;
  const Set = cEs6Shim.Set;
  
  var dt = {}

  dt.self = this;  
  
  // Search youtube for video
  dt.search = function(term, args) {
    
    var results = [];
    var container = {};
    var data, key, pageToken;
    
    pageToken = args.pageToken || "";
    key = args.key || Number(0);
    
    container.prevKey = (key-1);
    
    Logger.log('Checking cache for ' + (term+key));
    
    data = DTCache.get((term+key)) || false;
    
    if(!data) {
      
      var searchArgs = args.types.join(',');
          
      // Always search strict...don't turn off.
      var opts = {
        'maxResults': 45,
        'q': term,
        'safeSearch': 'strict',
        'type': searchArgs,
        'pageToken': pageToken,
      }
    
      Logger.log("get the data from Youtube")
      data = YouTube.Search.list('snippet', opts);
      
      // Store the results in the cache for 25 minutes
      Logger.log('Cacheing ' + (term+key) + ', ' + JSON.stringify(data));
      
      DTCache.store((term + key), JSON.stringify(data), 1500);
      
      container.nextKey = (Number(key) + 1);
      
    } else {
      
      container.nextKey = (Number(key) + 1);
      
    }
    
    data.items.forEach(function(item) {
      
      var package = dt.makeThumbnail(item);
      
      results.push(package);
      
    });
    
    container.success = true,
    container.data = results;
    container.nextPage = data.nextPageToken;
    container.prevPage = data.prevPageToken;
    
    return JSON.stringify(container);
  };
  
  dt.preview = function(id) {
    Logger.log('Received ' + id);
    
    var args = {
      "id": id,
    }
    
    var player = YouTube.Videos.list("player,snippet", args);
    
    var result = {
      "success": true,
      "data": player.items[0].player,
      "vidId": id,
      "title": player.items[0].snippet.title,
    }
    
    return JSON.stringify(result);
    
  }
  
  // TODO: get video data from Cache
  dt.embed = function(id, prefs) {
    Logger.log(id);
    
    var insertVal, newPosition, insert;
    var args = {
      "id": id,
    }
    
    var video = YouTube.Videos.list("snippet", args);
    var url = "https://youtu.be/" + video.items[0].id;
    
    var doc = DocumentApp.getActiveDocument();
    var cursor = doc.getCursor();
    
    if(prefs.type === "copy") {
      return url;
    }
    else if(prefs.type === "thumbnail") {
      insertVal = video.items[0].snippet.thumbnails.medium.url;
      var blob = UrlFetchApp.fetch(video.items[0].snippet.thumbnails.medium.url).getBlob();
      cursor.insertInlineImage(blob).setLinkUrl(url)
    } else if(prefs.type === "string") {
      if(prefs.string === "") {
        insertVal = video.items[0].snippet.title;
      } else {
        insertVal = prefs.string
      }
      insert = cursor.insertText(insertVal).setLinkUrl(cursor.getOffset(), insertVal.length-1, url);
    } else {
      insertVal = video.items[0].snippet.title;
    }
    
    if(prefs.type === "string") {
      newPosition = doc.newPosition(insert, insertVal.length);
    } else {
      newPosition = doc.newPosition(insert, 1);
    }
    
    doc.setCursor(newPosition);
    
  }
   
  dt.makeThumbnail = function(video) {
    
    var icon, resource;
    var type = video.id.kind.split("#")[1];
    
    if(type == "video") {
      icon = "https://image.flaticon.com/icons/svg/174/174883.svg";
      resource = video.id.videoId;
    } else if(type === "playlist") {
      icon = "https://image.flaticon.com/icons/svg/2001/2001398.svg";
      resource = video.id.playlistId;
    } else if(type === "channel") {
      icon = "https://image.flaticon.com/icons/svg/1170/1170586.svg";
      resource = video.id.channelId;
    }
    
    // Get the video information and break it down into an object
    var html = " \
        <div title='" + video.snippet.title + "' class='video-container' style='background-image:url(\"" + video.snippet.thumbnails.medium.url + "\");' data-type='" + video.id.kind +"' data-resource='" + resource +"'> \
         <img class='type-icon' src='" + icon + "' /> \
         <div class='action-container'> \
           <span class='embed' data-method='embed' onclick='previewEmbed(this.parentNode.parentNode.dataset.vidid)'>Preview & Insert</span> \
         </div> \
       </div>"
    
    return html;
  }
  
  /************************ SHOW VIDEOS ************************/
  // Shows a custom HTML modal dialog in the Google Docs editor.
  // Only shows YouTube URLs
  /*************************************************************/
  dt.getVideos = function() {
    var height = 480;
    var link, linkId;
    // Get links from the document
    var docLinks = DTUtils.getBodyVideos();
    var commentLinks = DTUtils.getCommentVideos();
    
    // Initialize an array to hold the YouTube frames
    var frames = [];
    var links = [];
    
    links = docLinks.concat(commentLinks);
    
    // If there are no links, give a helpful tip.
    if(links.length === 0) {
      frames.push("<p>No videos found.</p>");
    }
    
    // TODO: Check the returned link with regex
    for(var i=0; i<links.length; i++) {
      Logger.log(links[i]);
      // https://stackoverflow.com/a/31711517/2278429
      var re = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/;
      frames.push(links[i].match(re)[1]);
    }
    
    return frames;
    
  }
  
  return dt;
                       
})()

var DTCache = (function() {
  
  var cache = {};
  
  cache.self = this;
  
  const docCache = CacheService.getDocumentCache();
  
  // Store an etag with a search key
  cache.store = function(key, value, expiration) {
    
    docCache.put(key, value, expiration);
    
  }
  
  // Find a cached search by key
  cache.get = function(key) {
    
    if(docCache.get(key)) {
      
      Logger.log("returning cached results");
      return JSON.parse(docCache.get(key));
      
    } else {
      
      Logger.log("no cache, return false");
      return false;
      
    }
    
  }
  
  return cache;

})();

var DTUtils = (function() {
  
  var utils = {};
  
  utils.self = this;
  
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

