var DT = (function(dt) {

  var dt = {}

  dt.self = this;  
  
  // Initialize the object
  dt.init = function() {
    
    return true
    
  }
  
  // Search youtube for video
  // Args expects an array of terms 
  dt.search = function(term, args) {
    
    if(!term) { 
      return new Error('Please enter a search term');
    }
    
    var results = [];
    var container = {};
    var data, key, pageToken;
    
    pageToken = args.pageToken || "";
    key = args.key || Number(0);
    
    var cacheKey = (term+key) + '-' + args.types.join('-');
    
    container.prevKey = (key-1);
    
    data = DTCache.get(cacheKey) || false;
    
    if(!data) {
      
      var searchArgs = args.types.join(',');
          
      // Always search strict...don't turn off.
      var opts = {
        'maxResults': 45,
        'q': term,
        'safeSearch': 'strict',
        'type': searchArgs,
        'pageToken': pageToken,
        'order': 'rating',
      }
    
      data = YouTube.Search.list('snippet', opts);
      
      DTCache.store(cacheKey, JSON.stringify(data), 3600);
      
      container.nextKey = (Number(key) + 1);
      
    } else {
      
      container.nextKey = (Number(key) + 1);
      
    }
    
    data.items.forEach(function(item) {
      
      var package = dt.makeThumbnail(item, cacheKey);
      
      results.push(package);
      
    });
    
    container.success = true,
    container.data = results;
    container.nextPage = data.nextPageToken;
    container.prevPage = data.prevPageToken;
    
    return JSON.stringify(container);
  };
  
  dt.preview = function(cacheKey, resourceId, resourceType) {
    
    var cache,item, preview
    
    var args = {
      "id": resourceId,
    }
    
    // The snippet costs 2-4 units and is already cached. Find it in the
    // cache instead of querying the API again.
    item = DTUtils.getCachedResource(cacheKey, resourceId, resourceType);
    
    preview = DTUtils.getResourcePreview(args, item, resourceType);
    
    // Build the result first
    var result = {
      "success": true,
      "preview": preview,
      "resourceId": resourceId,
      "title": item.snippet.title,
      "resourceType": resourceType,
      "cacheKey": cacheKey,
    }
    
    return JSON.stringify(result);
    
  }
  
  // TODO: get video data from Cache
  dt.embed = function(cacheKey, prefs, resourceId, resourceType) {
    
    // Parse the prefs and cacheKeys
    prefs = prefs || {};
    cacheKey = cacheKey || null;
    
    var doc = DocumentApp.getActiveDocument();
    var cursor = doc.getCursor();
    
    var insert, insertVal, item, newPosition, url, video;
    
    var args = {
      "id": resourceId,
    }
    
    item = DTUtils.getCachedResource(cacheKey, resourceId, resourceType)
    url = DTUtils.buildEmbedUrl(resourceType, resourceId)

    // Return the correct resource based on user input
    if(prefs.type === "copy") {
      return {success: true, type: "copy", url: url};
    } else if(prefs.type === "thumbnail") {
      insertVal = item.snippet.thumbnails.medium.url;
      var blob = UrlFetchApp.fetch(item.snippet.thumbnails.medium.url).getBlob();
      cursor.insertInlineImage(blob).setLinkUrl(url);
      Logger.log(blob)
      insert = cursor.getElement();
    } else if(prefs.type === "string") {
      if(prefs.string === "") {
        insertVal = item.snippet.title;
      } else {
        insertVal = prefs.string
      }
      Logger.log(cursor)
      Logger.log(insertVal)
      insert = cursor.insertText(insertVal).setLinkUrl(cursor.getOffset()+1, insertVal.length-1, url);
    } else {
      insertVal = video.items[0].snippet.title;
    }
    
    if(prefs.type === "string") {
      newPosition = doc.newPosition(insert, insertVal.length);
      doc.setCursor(newPosition);
    } else {
      newPosition = doc.newPosition(insert, 1);
    }
    
    doc.setCursor(newPosition);
    
    return {success: true, url: url};
    
  }
   
  dt.makeThumbnail = function(video, cacheKey) {
    
    var icon, thumbUrl, videoId;
    var resourceType = video.id.kind.split("#")[1];
    
    if(video.snippet.thumbnails.medium) {
      thumbUrl = video.snippet.thumbnails.medium.url;
    } else {
      thumbUrl = video.snippet.thumbnails.medium.url;
    }
    
    if(resourceType == "video") {
      icon = "https://image.flaticon.com/icons/svg/174/174883.svg";
      videoId = video.id.videoId;
    } else if(resourceType === "playlist") {
      icon = "https://image.flaticon.com/icons/svg/2001/2001398.svg";
      videoId = video.id.playlistId;
    } else if(resourceType === "channel") {
      icon = "https://image.flaticon.com/icons/svg/1170/1170586.svg";
      videoId = video.id.channelId;
    }
    
    Logger.log(video.snippet.thumbnails.medium.url)
    
    // Get the video information and break it down into an object
    var html = " \
        <div title='" + video.snippet.title + "' class='video-container' style='background-image:url(\"" + thumbUrl + "\");' data-cachekey='" + cacheKey + "' data-resource='" + resourceType +"' data-videoid='" + videoId +"'> \
         <img class='type-icon' src='" + icon + "' /> \
         <div class='action-container'> \
           <span class='embed' data-method='embed' onclick='previewEmbed(this.parentNode.parentNode.dataset.cachekey, this.parentNode.parentNode.dataset.videoid, this.parentNode.parentNode.dataset.resource)'>Preview & Insert</span> \
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
    
    Logger.log(links)
    
    // If there are no links, give a helpful tip.
    if(links.length === 0) {
      frames.push("<p>No videos found.</p>");
    }
    
    // TODO: Check the returned link with regex
    for(var i=0; i<links.length; i++) {
      var video = {};
      Logger.log(links[i]);
      
      var re = /(youtube|youtu.be)/
      
      // Filter out any URLs that are not from YouTube
      if(links[i].match(re)) {
      
        var type = DTUtils.getResourceTypeFromUrl(links[i]);
        Logger.log(type)
        
        
        // Only return videos and playlists
        if(type) {
          // https://stackoverflow.com/a/31711517/2278429
          var re = /^(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?.*?(?:v|list)=(.*?)(?:&|$)|^(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?(?:(?!=).)*\/(.*)$/;
          if(!links[i].match(re)[1]) {
            // youtu.be/ videos are not returning capture group 1.
            // Hotfix by returning group 2 for the time being
            video.id = links[i].match(re)[2];
          } else {
            video.id = links[i].match(re)[1];
          }
          video.type = type;
          frames.push(video);
        }
      }
    }
    
    Logger.log(frames)
    
    return frames;
    
  }
  
  return dt;
                       
})()