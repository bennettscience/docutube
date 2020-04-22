var DTCache = (function() {
  
  var cache = {};
  
  cache.self = this;
  
  cache.init = function() {
    const docCache = CacheService.getDocumentCache();
    return docCache;
    
  }
  
  // Store an etag with a search key
  cache.store = function(key, value, expiration) {
    
    const docCache = cache.init();
    
    docCache.put(key, value, expiration);
    
  }
  
  // Find a cached search by key
  // return - parsed JSON data
  cache.get = function(key) {
    
    const docCache = cache.init();
    
    if(docCache.get(key)) {
      
      return JSON.parse(docCache.get(key));
      
    } else {
      
      return false;
      
    }
    
  }
  
  return cache;

})();