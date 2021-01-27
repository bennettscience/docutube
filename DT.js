 var DT = (function(dt) {

  var dt = {}

  dt.self = this;  
  
  // Initialize the object
  dt.init = function() {
    
    return true
    
  }

  dt.getVideos = function() {
    var height = 480; // Why is this here?

    // Get links from the document
    var docLinks = DTUtils.getBodyVideos();
    var commentLinks = DTUtils.getCommentVideos();
    
    // Initialize an array to hold the raw youtube links
    var links = [];
    links = docLinks.concat(commentLinks); // There's probably a better way to do this...

    // Init an array to hold the formatted values for each video
    var frames = [];
    
    // If there are no links, give a helpful tip.
    if(links.length === 0) {
      frames.push("<p>No videos found.</p>");
    } else {
      for(var i=0; i<links.length; i++) {
        var video = {};
        
        // Quick and dirty check for youtube videos
        const valid = /(youtube|youtu.be)/
        
        // Filter out any URLs that are not from YouTube
        if(links[i].match(valid)) {
        
          video.type = DTUtils.getTypeFromUrl(links[i]);
          
          // Only return videos and playlists
          // This regex splits the URL into keywords for proper filtering.
          // Channels are IGNORED at this step because there's no good way to embed those.
          if(video.type !== undefined) {
            // https://stackoverflow.com/a/31711517/2278429
            const re = /^(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?.*?(?:v|list)=(.*?)(?:&|$)|^(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?(?:(?!=).)*\/(.*)$/;
            if(!links[i].match(re)[1]) {
              // youtu.be/ videos are not returning capture group 1.
              // Hotfix by returning group 2 for the time being
              video.id = links[i].match(re)[2];
            } else {
              video.id = links[i].match(re)[1];
            }
            frames.push(video);
          }
        }
      }
    }
    
    return frames;
    
  }
  
  return dt;
                       
})()