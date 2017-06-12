!function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define('src/main',["src/auth", "src/dict", "bluebird", "lodash"], factory);
    }
    else if (typeof exports === "object") {
        module.exports = factory(require("src/auth"), require("src/dict"), require("bluebird"), require("lodash"));
    }
    else {
        root.FBExplorer = factory(root.Auth, root.Dict, root.Promise, root._);
    }
}(this, function (Auth, Dict, Promise, _) {
	"use strict";
    
    var defaults = {
        version: "v2.9",
        profile: Dict.profiles.BRIEF,
        lowerTimeLimit: "now",
        timeRangeInDays: 30 
	};
    
    var __isReady = new Promise(function(resolve, reject) {
        FB.Event.subscribe("auth.statusChange", function(response) {
            if (response.status == "connected") {
                resolve(true);
            }
            else {
                reject(false);
            }
        }.bind(this));
    });
    
    var FacebookExplorer = {
        init: function(config) {
            Auth.setAppId(config.appId);
            this.config = Object.assign({}, defaults, config); 
            
            FB.init({
                appId : Auth.getAppId(),
                version: this.config.version
            });
            
            return this.getLoginStatus();
        },
        
        ready: function() {
            return __isReady;
        },
        
        getLoginStatus: function() {
            return new Promise(function(resolve, reject){
                FB.getLoginStatus(function(response) {
                    if (response && response.authResponse && response.authResponse.accessToken) {
                        Auth.setToken(response.authResponse.accessToken);
                        resolve();
                    }
                    else {
                        reject();
                    }
                }.bind(this), true);
            }.bind(this));
        },
        
        findPlaces: function(options, partialResultCallback) {
            if (!options) return;
            
            return this.search(Dict.types.PLACE, options, partialResultCallback)
            .bind(this)
            .then(function(result) {
                var result = this.sort(result, options.sort, options.order, options.center);
                return result;
            });
        },
        
        findPages: function(options, partialResultCallback) {
            if (!options) return;
            
            return this.search(Dict.types.PAGE, options, partialResultCallback)
            .bind(this)
            .then(function(result) {
                var result = this.sort(result, options.sort, options.order, options.center);
                return result;
            });
        },
        
        findEvents: function(options, partialResultCallback) {
            if (!options) return;
            
            var untilDate = options.until || this.__getDefaultUntilTime();
            var sinceDate = options.since || this.__getDefaultSinceTime();
            
            return this.findPlaces({
                center: options.center,
                distance: options.distance,
                fields: "id,events.fields(id).since(" + sinceDate + ").until(" + untilDate + ").limit(1)"
            })
            .bind(this)
            .then(function(result) {
                var promises = [];
                var l = result.length;
                while (l--) {               
                    if (!result[l].events) continue;
                    
                    var searchPromise = this.__searchEventsByPlaceId({
                        placeId: result[l].id,
                        until: untilDate,
                        since: sinceDate,
                        profile: options.profile,
                        fields: options.fields
                    }, partialResultCallback);
                    promises.push(searchPromise);
                }
                
                return Promise.all(promises);
            })
            .bind(this)
            .then(function(result) {
                partialResultCallback && partialResultCallback.apply(null, [[], false]);
                
                return this.sort(_.flatten(result), options.sort, options.order, options.center);
            });
        },
        
        search: function(type, options, partialResultCallback) {
            if (!options) return;
            
            var searchResults = [];
            
            return this.ready()
            .bind(this)
            .then(function() {
                var next = "";
                var finishPredicate = function() {
                    return _.isUndefined(next);
                };
                var action = function() { 
                    return new Promise(function(resolve, reject) {
                        var url = next ? next : "/search?type=" + type + this.__getSearchQuery(type, options);
                        FB.api(url, function(response) {
                            if (!response || response.error) {
                                reject(response.error);
                            }
                            else {
                                var newResults = _.xorBy(searchResults, response.data, "id");
                                
                                next = response.paging && response.paging.next;
                                searchResults = searchResults.concat(newResults);
                                if (typeof partialResultCallback === "function") {
                                    partialResultCallback.apply(null, [newResults, _.isUndefined(next)]);
                                }
                                resolve(next);
                            }
                        }.bind(this))
                    }.bind(this))
                }.bind(this);
                
                return this.__promiseWhile(finishPredicate, action, next)
                .bind(this)
                .then(function(result) {
                    return searchResults;
                });
            });
        },
        
        sort: function(items, sort, order, center) {      
            if (sort === Dict.sort.DISTANCE) {
                items = this.__sortByDistance(items, order, center);
            }
            else if (sort === Dict.sort.TIME){ 
                items = this.__sortByTime(items, order);
            }
            else if (sort === Dict.sort.NAME) {
                items = this.__sortByField(items, sort, order);
            }
            
            return items;
        },
        
        getFieldsFromProfile: function(type, profile) {
            if (!this.__isTypeValid(type)) return;
            
            profile = this.__isProfileValid(profile) ? profile : defauls.profile;        
            
            return Dict.fields[type][profile].join(",");
        },
        
        __getSearchQuery: function(type, options) {
            var queryString = "";
            queryString += "&q=" + (options.keywords || "");
            queryString += "&fields=" + (options.fields || this.getFieldsFromProfile(type, options.profile));
            queryString += "&accessToken=" + Auth.getToken();
            
            if(type === Dict.types.EVENT) {
                queryString += "&since=" + options.since;
                queryString += "&until=" + options.until;
            }
            if (options.center) {
                queryString += "&center=" + options.center.latitude + "," + options.center.longitude;
            }
            if (options.center) {
                queryString += "&distance=" + options.distance;
            }
            
            return queryString;
        },
        
        __sortByDistance: function(items, order, center) {
            return items.sort(function(a, b) {
                var pointA = a && (a.location || a.place.location),
                    pointB = b && (b.location || b.place.location);
                
                if (!pointA && !pointB) return 0;            
                if (!pointA) return -1;
                if (!pointB) return 1;
                
                var distanceA = this.__calculateDistance(center, a.location || a.place.location),
                    distanceB = this.__calculateDistance(center, b.location || b.place.location);
                    
                return order === Dict.order.ASC ? distanceA - distanceB : distanceB - distanceA; 
            }.bind(this));
        },
        
        __calculateDistance: function(start, end) {
            if (!start || !end) return;
            
            var lat1 = start.latitude,
                lon1 =  start.longitude,
                lat2 = end.latitude,
                lon2 = end.longitude;
            
            var earthDiameterInKilometers = 12742;
            var rad = 0.017453292519943295;
            var res = 0.5 - Math.cos((lat2 - lat1) * rad)/2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * (1 - Math.cos((lon2 - lon1) * rad))/2;
            
            return earthDiameterInKilometers * Math.asin(Math.sqrt(res));
        },
        
        __sortByTime: function(items, order) {
            return items.sort(function(a, b) {
                var dateA = new Date(a.start_time),
                    dateB = new Date(b.start_time);
                    
                return order === Dict.order.ASC ? dateA - dateB : dateB - dateA; 
            });
        },
        
        __sortByField: function(items, field, order) {
            return _.orderBy(items, [field], [order]);
        },
        
        __isProfileValid: function(profile) {
            return _.includes(Dict.profiles, profile);
        },
        
        __isTypeValid: function(type) {
            return _.includes(Dict.types, type);
        },
        
        __searchEventsByPlaceId: function(options, partialResultCallback) {
            if (!options || !options.placeId) return;
            
            var searchResults = [];
            
            return this.ready()
            .bind(this)
            .then(function() {
                var next = "";
                var finishPredicate = function() {
                    return _.isUndefined(next);
                };
                var action = function() { 
                    return new Promise(function(resolve, reject) {
                        var url = next ? next : "/" + options.placeId + "/events?" + this.__getSearchQuery(Dict.types.EVENT, options);
                        FB.api(url, function(response) {
                            if (!response || response.error) {
                                reject(response.error);
                            }
                            else {
                                var newResults = _.xorBy(searchResults, response.data, "id");
                                
                                next = response.paging && response.paging.next;
                                searchResults = searchResults.concat(newResults);
                                if (typeof partialResultCallback === "function") {
                                    partialResultCallback.apply(null, [newResults, true]);
                                }
                                resolve(next);
                            }
                        }.bind(this))
                    }.bind(this))
                }.bind(this);
                
                return this.__promiseWhile(finishPredicate, action, next)
                .bind(this)
                .then(function(result) {
                    return searchResults;
                });
            });
        },
        
        __getDefaultSinceTime: function() {
            return defaults.lowerTimeLimit;
        },
        
        __getDefaultUntilTime: function() {
            var date = new Date();
            date.setDate(date.getDate() + defaults.timeRangeInDays);
            
            return date.getFullYear() + "-" + date.getDate() + "-" + date.getMonth(); 
        },
        
        __promiseWhile: Promise.method(function(finishPredicate, action, lastResult) {
            if (finishPredicate()) return lastResult;
            
            return action().then(this.__promiseWhile.bind(this, finishPredicate, action));
        })
    };
    
    return {
        init: FacebookExplorer.init.bind(FacebookExplorer),
        getAppId: Auth.getAppId,
        setAppId: Auth.setAppId,
        findEvents: FacebookExplorer.findEvents.bind(FacebookExplorer),
        findPages: FacebookExplorer.findPages.bind(FacebookExplorer),
        findPlaces: FacebookExplorer.findPlaces.bind(FacebookExplorer)
    };
});