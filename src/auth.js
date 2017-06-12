!function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    }
    else if (typeof exports === "object") {
        module.exports = factory();
    }
    else {
        root.Auth = factory();
    }
}(this, function () {
    "use strict";
    
    var __token;
    var __appId;
    
    var Auth = {
        
        getToken: function() {
            return __token;
        },
        
        setToken: function(token) {
            __token = token;
        },
        
        getAppId: function() {
            return __appId;
        },
        
        setAppId: function(appId) {
            __appId = appId;
        }
    };
    
    return Auth;
});