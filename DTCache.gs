var DTCache = (function() {
  
  var cache = {};
  
  cache.self = this;
  
  cache.init = function() {
    
    return 
    
  }

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