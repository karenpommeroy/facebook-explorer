# facebook-explorer
Promise based library for performing various searches on Facebook (using [Facebook Graph API](https://developers.facebook.com/docs/graph-api)).
It utilizes various optimisation techniques to limit number of requests and amount of transfered data to minimum.

## Table of contents

- [Quick start](#quick-start)
- [Usage](#usage)
- [Options](#options)
- [Methods](#methods)
- [Searching](#searching)
- [Known limitations](#known-limitations)
- [Copyright and license](#copyright-and-license)

## Quick start
Several quick start options are available:
##### Download the latest build

###### Development, unminified code
 * [facebook.explorer.js](https://raw.githubusercontent.com/karenpommeroy/facebook-explorer/master/build/facebook.explorer.js)

###### Production, minified code
 * [facebook.explorer.min.js](https://raw.githubusercontent.com/karenpommeroy/facebook-explorer/master/build/facebook.explorer.min.js)

##### Install from Bower
```bash
bower install facebook-explorer --save
```

##### Install from Npm
```bash
npm install facebook-explorer --save
```

##### Using Git repository

To clone the repository, use

`git clone https://github.com/karenpommeroy/facebook-explorer.git`

##### Build sources
```bash
grunt build
```

Done!

## Usage

`facebook-explorer` comes as an UMD module which means you can use it as an AMD or CommonJS module as well as a standalone library.

##### Include as a module (require.js):

```javascript
var FBExplorer = require("facebook-explorer"); // or whatever module name you assigned
```

##### Including files (standalone):

```xml
<script src="/path/to/facebook.explorer.js"></script>
<script>
	FBExplorer.doSomething();
</script>
```

#### Initialization
Before performing any operations you will need to provide your Application ID in order to get access to Facebook Graph API.
Step by step instruction how to obtain one for your app can be found on [Facebook for Developers](https://developers.facebook.com/docs/apps/register)

Once obtained id has to be set by invoking **init** method with **appId** (string) parameter:
```javascript
FBExplorer.init({ appId: "YOUR_APP_ID" });
```
You can change it later by calling:
```javascript
FBExplorer.setAppId("YOUR_APP_ID");
```

## Options
`facebook-explorer` can be configured by invoking **init()** method with options object as it's parameter.

Here is the explanation of possible options:

Option          | Type    | Description                                          | Default | Options
--------------- | ------- | ---------------------------------------------------- | --------| --------------------------
appId           | string  | Facebook Application ID                              |         |
version         | string  | Facebook Graph API version to use                    | "v2.9"  |
profile         | string  | Name of the default search profile (explained below) | "brief" | "basic", "brief", "extended", "full"
lowerTimeLimit  | string  | Default lower limit for time based searches (in days)| "now"   |
timeRangeInDays | int     | Default upper limit for time based searches (in days)| 30      |

#### Search profiles

Normally when using Facebook Graph API we often have to specify fields that will be returned in reponse.
To make this easier `facebook-explorer` comes with few search profiles that have predefined field sets associated with them.
Just a handy shorthand in place of listing all fields manually.

There are four profiles: **"basic"**, **"brief"**, **"extended"** and **"full"**.

Profile "basic" is the most compact while "full" contains all possible fields (others fall somewhere in between)
Here is the list of fields included in each profile listed by type of searched item:

**"basic":**
* For each search type: *id, name*

**"brief":**
* places: *category, description, id, location, name, picture*
* pages: *category, description, id, name, picture*
* events: *category, cover, description, id, end_time, name, place, start_time*

**"extended":**
* places: *category, description, hours, id, location, name, phone, picture, website*
* pages: *category, cover, description, id, end_time, name, place, start_time*
* events: *attending_count, category, cover, description, id, interested_count, end_time, maybe_count, name, place, start_time, type*

**"full":**
* events: all possible fields as specified by [Event fields description in FB Graph API](https://developers.facebook.com/docs/graph-api/reference/event/)
* places: all possible fields as specified by [Place fields in FB Graph API](https://developers.facebook.com/docs/places/fields)
* pages: all possible fields as specified by [Page fields in FB Graph API](https://developers.facebook.com/docs/graph-api/reference/page/)

```javascript
FBExplorer.findPlaces({
	keywords: "Agrestic Shopping Mall",
    profile: "full"
});
```

Of course you can also specify fields manually without using profiles.
To do this just include **fields** attribute (string) in your search options (nested queries are also allowed).
If specified together with profile this attribute will take precedence and profile will be ignored.

```javascript
FBExplorer.findPlaces({
	keywords: "Majestic Town Hall",
    fields: "id,name,photos.limit(1),location{latitude,longitude}"
});
```

## Methods

##### void init(object config)
Initialises `facebook-explorer` should be called before any other methods.
```javascript
FBExplorer.init({
	appId: "6661097367666",
    version: "v2.9",
    profile: "brief"
    since: "now",
    timeRangeInDays: 30
});
```

##### string getAppId()
Returns currently set application id.
```javascript
var appId = FBExplorer.getAppId();
```

##### void setAppId(string appId)
Sets new application id.
```javascript
FBExplorer.setAppId("6661097367666");
```

##### Promise findEvents(object searchOptions, function partialResultCallback)
Performs search for events and returns promise for the result.
First parameter is required and represents object containg search attributes.
Second optional parameter is a function that will be invoked whenever new results are available.

```javascript
var searchOptions = {
    center: {
    	latitude: 51.12456,
        longitude: -52.45444
    },
    distance: 100,
    keywords: "My Event Name",
    profile: "brief",
    until: "2017-12-02",
    sort: "time",
    order: "asc"
};

function partialResultsCallback(result, hasMore) {
	console.log(result);
};

FBExplorer.findEvents(searchOptions, partialResultsCallback)
.then(function(result) {
	// do something with the result
};
```

##### Promise findPages(object searchOptions, function partialResultCallback)
Performs search for pages and returns promise for the result.
First parameter is required and represents object containg search attributes.
Second optional parameter is a function that will be invoked whenever new results are available.
```javascript
var searchOptions = {
    fields: "id,name",
    keywords: "My Page",
    sort: "name",
    order: "desc"
};

function partialResultsCallback(result, hasMore) {
	console.log(result);
};

FBExplorer.findPages(searchOptions, partialResultsCallback)
.then(function(result) {
	// do something with the result
};
```

##### Promise findPlaces(object searchOptions, function partialResultsCallback)
Performs search for places and returns promise for the result.
First parameter is required and represents object containg search attributes.
Second optional parameter is a function that will be invoked whenever new results are available.
```javascript
var searchOptions = {
    center: {
    	latitude: 51.12456,
        longitude: -52.45444
    },
    distance: 500,
    keywords: "My Place",
    profile: "full",
    since: "2017-01-01",
    sort: "distance",
    order: "asc"
};

function partialResultsCallback(result, hasMore) {
	console.log(result);
};

FBExplorer.findPlaces(searchOptions, partialResultsCallback)
.then(function(result) {
	// do something with the result
};
```

## Searching

#### Search Options
Possible search options vary a little depending on what are you actually searching for.

Option    | Type    | Description                                           | Details
--------- | ------- | ----------------------------------------------------- | ---------------------------------------
fields    | string  | Comma separated field namse to be included in results | Possible items **differ with search**
keywords  | string  | Keyword to search for (searches name, description)    | **Required** when searching for pages
profile   | string  | Name of predefined fields profile to use              | check [SearchProfiles](Search Profiles)
sort      | string  | Determines how should the results be sorted           | check [Sorting](Sorting)
order     | string  | Sorting order                                         | "asc" or "desc"

Below options are available only when searching for items that have location attributes (places, events).

Option    | Type    | Description                                                     | Details
--------- | ------- | --------------------------------------------------------------- | ------------------------------
center    | object  | Center point containing latitude (float) and longitude (float)  | Coordinates in EPSG:4326
distance  | int     | Search radius, distance from center (in metres)                 | Shouldn't exceed 50000

Below options are available only when searching only for events.

Option    | Type    | Description                                           | Details
--------- | ------- | ----------------------------------------------------- | --------------------------------
since     | string  | Lower time boundary, Unix timestamp or strtotime data value as accepted by [FB Graph API](https://developers.facebook.com/docs/graph-api/using-graph-api#time).        	| Default is "now"
until     | string  | Upper time boundary, Unix timestamp or strtotime data value as accepted by [FB Graph API](https://developers.facebook.com/docs/graph-api/using-graph-api#time).        	|

#### Sorting

Results can be returned in a specific order and this is determined by providing **sort** (string) and **order** (string) attributes along with search options.

You can sort results using sorts:

- **"name"** - results are sorted alphabetically by name
- **"distance"** - results are ordered depending on their distance from center point, applies only to items with location attributes (places, events)
- **"time"** - results are sorted by their start time, applies only to events

Order can be one of two possibilities: **"asc"** or **"desc"**.


#### Partial results
In some cases when searches are complicated (i.e. cover very large area or time range) there are multiple request sent to get the complete data and sometimes waiting for all of the results to be ready may take some time.

Nobody likes to wait so `facebook-explorer` provides a way to overcome this problem to some degree.
Each **find** method has an optional second parameter that is a function with following definition:

```javascript
function partialResultsCallback(Array result, bool hasMore) {
	// do something with partial results
};
```
This is called a partial result callback and will be called each time a new portion of data is available without having to wait for the complete item.
First parameter contains new portion of data that was returned in the current search and second informs you if there will be more data available.
This way it is for example possible to display some data imemdiately once it appears and load remaining in the background.


## Known limitations

* The Graph API has some "instabilities" with search results. It's possible that the amount of results returned can vary between calls within seconds
* [Rate limiting](https://developers.facebook.com/docs/graph-api/advanced/rate-limiting) will apply, but it may happen only in rare cases and you should experience no call blocks within a reasonable amount of service requests. Be aware that the way this library works, allows for performing searched with potentially hundreds of (counted) Graph API calls per request to `/events`.


## Copyright and license

Licensed under [MIT license](LICENSE).

[^ back to top](#table-of-contents)
