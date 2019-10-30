var DT = (function(dt) {

  var dt = {}

  dt.self = this;  
  
  // Initialize the object
  dt.init = function() {
    
    return true
    
  }
  
  // Search youtube for video
  dt.search = function(term, args) {
    
    var results = [];
    var container = {};
    var data, key, pageToken;
    
    pageToken = args.pageToken || "";
    key = args.key || Number(0);
    
    var cacheKey = (term+key);
    
    container.prevKey = (key-1);
    
    Logger.log('Checking cache for ' + cacheKey);
    
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
      }
    
      Logger.log("get the data from Youtube")
      data = YouTube.Search.list('snippet', opts);
      
      // Store the results in the cache for 60 minutes
      Logger.log('Cacheing ' + cacheKey);
      
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
  
  dt.preview = function(id, resource) {
    
    var query;
    
    var args = {
      "id": id,
    }
    
    // TODO: Return a preview baed on ther type of resource
    
    query = YouTube.Videos.list("player,snippet", args);
    
    // Store this in the cache by video ID
    DTCache.store(query.items[0].id, query, 3600);
    
    var result = {
      "success": true,
      "player": query.items[0].player,
      "videoId": id,
      "title": query.items[0].snippet.title,
    }
    
    return JSON.stringify(result);
    
  }
  
  // TODO: get video data from Cache
  dt.embed = function(id, prefs) {
    
    var insert, insertVal, newPosition, video;
    var args = {
      "id": id,
    }
    
    // Get the requested video from the Cache
    var cache = DTCache.get(id)
    
    if(cache) {
      Logger.log('Cached video found, using that data');
      video = cache;
    } else {
      video = YouTube.Videos.list("snippet", args);
    }
    
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
   
  dt.makeThumbnail = function(video, cacheKey) {
    
    var icon, videoId;
    var resourceType = video.id.kind.split("#")[1];
    
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
    
    // Get the video information and break it down into an object
    var html = " \
        <div title='" + video.snippet.title + "' class='video-container' style='background-image:url(\"" + video.snippet.thumbnails.medium.url + "\");' data-type='" + resourceType +"' data-videoid='" + videoId +"'> \
         <img class='type-icon' src='" + icon + "' /> \
         <div class='action-container'> \
           <span class='embed' data-method='embed' onclick='previewEmbed(this.parentNode.parentNode.dataset.videoid, this.parentNode.parentNode.dataset.resource, )'>Preview & Insert</span> \
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
