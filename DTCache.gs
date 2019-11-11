var DTCache = (function() {
  
  var cache = {};
  
  cache.self = this;
  
  cache.init = function() {
    
    return true;
    
  }

  const docCache = CacheService.getDocumentCache();
  
  // Store an etag with a search key
  cache.store = function(key, value, expiration) {
    
    docCache.put(key, value, expiration);
    
  }
  
  // Find a cached search by key
  cache.get = function(key) {
    
    if(docCache.get(key)) {
      
      return JSON.parse(docCache.get(key));
      
    } else {
      
      return false;
      
    }
    
  }
  
  return cache;

})();