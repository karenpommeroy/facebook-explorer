"use strict";
var enums = {
    types: {
        EVENT: "event",
        PAGE: "page",
        PLACE: "place"
    },
	profiles: {
        BASIC: "basic",
        BRIEF: "brief",
        EXTENDED: "extended",
        FULL: "full"
    },
    sort: {
        DISTANCE: "distance",
        NAME: "name",
        TIME: "time"
    },
    order: {
        ASC: "asc",
        DESC: "desc"
    },
	methods: {
        MULTIPLE: "multiple",
        LEAST: "least",
		CHUNKED: "chunked"
    },
    fields: {
        event: {
            "basic": [
                "id", "name"
            ],
            "brief": [
                "category", "cover", "description", "id", "end_time", "name", "place{id,name,location{city,city_id,country,latitude,longitude,street,zip}}", "start_time"
            ],
            "extended": [
                "attending_count", "category", "cover", "description", "id", "interested_count", "end_time", "maybe_count", "name",
				"place{id,name,location{city,city_id,country,latitude,longitude,street,zip}}", "start_time", "type"
            ],
            "full": [
                "attending_count", "can_guests_invite", "can_viewer_post", "category", "cover", "declined_count", "description",
				"end_time", "id", "interested_count", "is_canceled", "is_draft", "is_page_owned", "is_viewer_admin", "maybe_count",
				"name", "noreply_count", "owner", "parent_group", "place{id,name,location{city,city_id,country,latitude,longitude,street,zip}}",
				"start_time", "ticket_uri", "timezone", "type", "updated_time"
            ]
        },
        page: {
            "basic": [
                "id", "name"
            ],
            "brief": [
                "category", "cover", "description", "id", "location", "name"
            ],
            "extended": [
                "category", "contact_address", "cover", "description", "fan_count", "featured_video",
				"founded", "id", "location", "name", "talking_about_count", "website"
            ],
            "full": [
                "about", "app_links", "best_page", "can_checkin", "category", "category_list", "contact_address", "cover",
				"description", "display_subtext", "emails", "fan_count", "featured_video", "founded", "general_info", "id",
				"impressum", "is_community_page", "is_verified", "link", "location", "name", "overall_star_rating", "parent_page",
				"phone", "rating_count", "start_info", "supports_instant_articles", "talking_about_count", "website", "were_here_count"
            ]
        },
        place: {
            "basic": [
                "id", "name"
            ],
            "brief": [
                "category", "description", "id", "location", "name", "picture"
            ],
            "extended": [
                "category", "description", "hours", "id", "location", "name", "phone", "picture", "website"
            ],
            "full": [
                "about", "category", "category_list", "cover", "checkins", "description", "hours", "id", "is_always_open", "is_permanently_closed",
				"is_verified", "link", "location", "name", "overall_star_rating", "parking", "payment_options", "phone", "photos", "picture",
				"price_range", "rating_count", "restaurant_services", "restaurant_specialties", "single_line_address", "website", "workflows"
            ]
        }
    }
};

var config = {
	days: 30,
	limit: 100,
	method: enums.methods.CHUNKED,
    profile: enums.profiles.BRIEF,
    since: "now",
    version: "v2.9"
};

var __token;
var __appId;
var __isReady;

var FacebookExplorer = {
    
    init: function(settings) {
        __appId = settings.appId;
        Object.assign(config, settings); 
        
        __isReady = new Promise(function(resolve, reject) {
            FB.Event.subscribe("auth.statusChange", function(response) {
                response && response.status == "connected" ? resolve(true) : reject(false);
            }.bind(this));
        });
        
        FB.init({
            appId : this.getAppId(),
            version: config.version
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
                    this.setToken(response.authResponse.accessToken);
                    resolve();
                }
				else {
					reject();
				}
            }.bind(this), true);
        }.bind(this));
    },
    
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
        this.init({ appId: appId });
    },
    
    findPlaces: function(options, partialResultCallback) {
        if (!options) return;
        
        return this.search(enums.types.PLACE, options, partialResultCallback)
        .bind(this)
        .then(function(result) {
            var result = this.sort(result, options.sort, options.order, options.center);
            return result;
        });
    },
    
    findPages: function(options, partialResultCallback) {
        if (!options) return;
        
        return this.search(enums.types.PAGE, options, partialResultCallback)
        .bind(this)
        .then(function(result) {
            var result = this.sort(result, options.sort, options.order, options.center);
            return result;
        });
    },
	
	findEvents: function(options, partialResultCallback) {
		if (!options) return;
		
		var findPromise;
		options.until = options.until || this.__getDefaultUntilTime();
        options.since = options.since || this.__getDefaultSinceTime();
		options.method = this.__isMethodValid(options.method) ? options.method : config.method;
		
		if (options.method === enums.methods.MULTIPLE) {
			findPromise = this.__findEventsUsingMultipleRequests(options, partialResultCallback);
		}
		else if (options.method === enums.methods.LEAST) {
			findPromise = this.__findEventsUsingLeastRequests(options, partialResultCallback);
		}
		else if (options.method === enums.methods.CHUNKED) {
			findPromise = this.__findEventsUsingChunkedRequests(options, partialResultCallback);
		}
		else {
			findPromise = Promise.resolve();
		}
		
		return findPromise
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
                            var newResults = _.differenceBy(response.data, searchResults, "id");
                            
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
        if (sort === enums.sort.DISTANCE) {
            items = this.__sortByDistance(items, order, center);
        }
        else if (sort === enums.sort.TIME){ 
            items = this.__sortByTime(items, order);
        }
        else if (sort === enums.sort.NAME) {
            items = this.__sortByField(items, sort, order);
        }
        
        return items;
    },
    
    getFieldsFromProfile: function(type, profile) {
        if (!this.__isTypeValid(type)) return;
        
        profile = this.__isProfileValid(profile) ? profile : config.profile;        
        
        return enums.fields[type][profile].join(",");
    },
	
	__findEventsUsingMultipleRequests: function(options, partialResultCallback) {
        var searchResults = [];
        return this.findPlaces({
            center: options.center,
            distance: options.distance,
			cityId: options.cityId,
            fields: "id,events.fields(id).since(" + options.since + ").until(" + options.until + ").limit(1)"
        })
        .bind(this)
        .then(function(result) {
            var promises = [];
            var placesWithEvents = _.reject(result, function(item) {
				return !item.events;
			});
			var l = placesWithEvents.length;
			
            while (l--) {                
                var searchPromise = this.__searchEventsByPlaceId({
                    placeId: placesWithEvents[l].id,
                    until: options.until,
                    since: options.since,
                    profile: options.profile,
                    fields: options.fields
                })
				.bind(this)
				.then(function(result) {
					var uniqueEvents = _.differenceBy(result, searchResults, "id");
					
					var filtered = options.cityId ? this.__filterEventsByCityId(uniqueEvents, options.cityId) : this.__filterEventsByDistance(uniqueEvents, options.center, options.distance);
					
					partialResultCallback && partialResultCallback.apply(null, [filtered, false]);
					searchResults = searchResults.concat(filtered);
					
					return filtered;
				});
                promises.push(searchPromise);
            }
            
            return Promise.all(promises);
        });
    },
	
	__findEventsUsingLeastRequests: function(options, partialResultCallback) {
        var searchResults = [];
		return this.findPlaces({
			center: options.center,
            distance: options.distance,
			cityId: options.cityId,
            fields: "id,events.fields(" + this.getFieldsFromProfile(enums.types.EVENT, options.profile) + ").since(" + options.since + ").until(" + options.until + ").limit(100)"
        })
        .bind(this)
        .then(function(result) {
			var events = _.map(result, function(item) {
				return item.events ? item.events.data : [];
			});
			var uniqueEvents = _.uniqBy(_.flatten(events), "id");
			
			return options.cityId ? this.__filterEventsByCityId(uniqueEvents, options.cityId) : this.__filterEventsByDistance(uniqueEvents, options.center, options.distance);
        });
    },
	
	__findEventsUsingChunkedRequests: function(options, partialResultCallback) {
        var searchResults = [];
		return this.findPlaces({
			center: options.center,
            distance: options.distance,
			cityId: options.cityId,
            fields: "id,events.fields(id,place{location{city_id,latitude,longitude}}).since(" + options.since + ").until(" + options.until + ").limit(100)"
        })
        .bind(this)
        .then(function(result) {
            var promises = [];
            var events = _.map(result, function(item) {
				return item.events ? item.events.data : [];
			});
			var uniqueEvents = _.uniqBy(_.flatten(events), "id");
			var filtered = options.cityId ? this.__filterEventsByCityId(uniqueEvents, options.cityId) : this.__filterEventsByDistance(uniqueEvents, options.center, options.distance);
			var chunked = _.chunk(filtered, 50);
			var l = chunked.length;
			
            while (l--) {               
                var searchPromise = this.__searchEventsByIds({
                    ids: _.map(chunked[l], function(item) { return item.id; }).join(),
                    profile: options.profile,
                    fields: options.fields
                }, partialResultCallback);
                promises.push(searchPromise);
            }
            
            return Promise.all(promises);
        });
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
                    var url = next ? next : "/" + options.placeId + "/events?" + this.__getSearchQuery(enums.types.EVENT, options);
                    FB.api(url, function(response) {
                        if (!response || response.error) {
                            reject(response.error);
                        }
                        else {
                            var newResults = _.differenceBy(response.data, searchResults, "id");
                            
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
	
	__searchEventsByIds: function(options, partialResultCallback) {
        if (!options || !options.ids) return;
        
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
                    var url = next ? next : "/?ids=" + options.ids + this.__getSearchQuery(enums.types.EVENT, options);
                    FB.api(url, function(response) {
                        if (!response || response.error) {
                            reject(response.error);
                        }
						var mapped = _.map(response, function(item) { return item; });
						var newResults = _.differenceBy(mapped, searchResults, "id");
						
						next = response.paging && response.paging.next;
						searchResults = searchResults.concat(newResults);
						if (typeof partialResultCallback === "function") {
							partialResultCallback.apply(null, [newResults, true]);
						}
						resolve(next);
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
	
	__getSearchQuery: function(type, options) {
        var queryString = "";
        queryString += "&q=" + (options.keywords || "");
        queryString += "&fields=" + (options.fields || this.getFieldsFromProfile(type, options.profile));
        queryString += "&limit=" + config.limit;
        
        if(type === enums.types.EVENT) {
            if (options.since) {
				queryString += "&since=" + options.since;
			}
            if (options.until) {
				queryString += "&until=" + options.until;
			}
		}
		if(type === enums.types.PLACE) {
			if (options.cityId) {
				queryString += "&address=*";
				queryString += "&city=" + options.cityId;
			}
		}
        if (options.center) {
            queryString += "&center=" + options.center.latitude + "," + options.center.longitude;
        }
        if (options.center) {
            queryString += "&distance=" + options.distance;
        }
        
		queryString += "&access_token=" + this.getToken();
		
        return queryString;
    },
    
    __sortByDistance: function(items, order, center) {
        return items.sort(function(a, b) {
            var pointA = a && (a.location || (a.place && a.place.location)),
                pointB = b && (b.location || (b.place && b.place.location));
            
            if (!pointA && !pointB) return 0;            
            if (!pointA) return -1;
            if (!pointB) return 1;
            
            var distanceA = this.__calculateDistanceInMetres(center, pointA),
                distanceB = this.__calculateDistanceInMetres(center, pointB);
                
            return order === enums.order.ASC ? distanceA - distanceB : distanceB - distanceA; 
        }.bind(this));
    },
    
    __calculateDistanceInMetres: function(a, b) {
        if (!this.__arePointsValid(a, b)) return;
        if (this.__arePointsTheSame(a, b)) return 0;
		
        var lat1 = a.latitude,
            lon1 =  a.longitude,
            lat2 = b.latitude,
            lon2 = b.longitude;
        
        var earthDiameterInKilometers = 12742;
        var rad = 0.017453292519943295;
        var res = 0.5 - Math.cos((lat2 - lat1) * rad)/2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * (1 - Math.cos((lon2 - lon1) * rad))/2;
        
        return earthDiameterInKilometers * Math.asin(Math.sqrt(res)) * 1000;
    },
	
	__arePointsTheSame: function(a, b) {
		return a.longitude.toString() === b.longitude.toString() && a.latitude.toString() === b.latitude.toString();
	},
	
	__arePointsValid: function(a, b) {
		return a && b && !_.isNil(a.latitude) && !_.isNil(a.longitude) && !_.isNil(b.latitude) && !_.isNil(b.longitude);
	},
    
    __sortByTime: function(items, order) {
        return items.sort(function(a, b) {
            var dateA = new Date(a.start_time),
                dateB = new Date(b.start_time);
                
            return order === enums.order.ASC ? dateA - dateB : dateB - dateA; 
        });
    },
    
    __sortByField: function(items, field, order) {
        return _.orderBy(items, [field], [order]);
    },
    
    __isProfileValid: function(profile) {
        return profile && _.includes(enums.profiles, profile);
    },
	
	__isMethodValid: function(method) {
        return method && _.includes(enums.methods, method);
    },
    
    __isTypeValid: function(type) {
        return type && _.includes(enums.types, type);
    },
	
	__filterEventsByDistance: function(events, center, distance) {
		return _.filter(events, function(item) {
			return item.place && item.place.location && this.__calculateDistanceInMetres(item.place.location, center) < distance;
		}.bind(this));
	},
	
	__filterEventsByCityId: function(events, id) {
		return _.filter(events, function(item) {
			return item.place && item.place.location && item.place.location.city_id == id;
		}.bind(this));
	},
    
    __getDefaultSinceTime: function() {
        return config.since;
    },
    
    __getDefaultUntilTime: function() {
        var date = new Date();
        date.setDate(date.getDate() + config.days);
        
        return date.getFullYear() + "-" + this.__pad(date.getMonth() + 1) + "-" + this.__pad(date.getDate());
    },
    
    __pad: function(value) {		
		return !!value ? (value < 10 ? "0" + value : "" + value) : "00";
    },
    
    __promiseWhile: Promise.method(function(finishPredicate, action, lastResult) {
        if (finishPredicate()) return lastResult;
        
        return action().then(this.__promiseWhile.bind(this, finishPredicate, action));
    })
};

return {
    init: FacebookExplorer.init.bind(FacebookExplorer),
    getAppId: FacebookExplorer.getAppId.bind(FacebookExplorer),
    setAppId: FacebookExplorer.setAppId.bind(FacebookExplorer),
    findEvents: FacebookExplorer.findEvents.bind(FacebookExplorer),
    findPages: FacebookExplorer.findPages.bind(FacebookExplorer),
    findPlaces: FacebookExplorer.findPlaces.bind(FacebookExplorer)
};