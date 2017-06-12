!function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    }
    else if (typeof exports === "object") {
        module.exports = factory();
    }
    else {
        root.Dict = factory();
    }
}(this, function (_) {
   "use strict";
   
    var dict = {
        types: {
            EVENT: "event",
            PAGE: "page",
            PLACE: "place"
        },
        fields: {
            event: {
                "basic": [
                    "id", "name"
                ],
                "brief": [
                    "category", "cover", "description", "id", "end_time", "name", "place", "start_time"
                ],
                "extended": [
                    "attending_count", "category", "cover", "description", "id", "interested_count", "end_time", "maybe_count", "name", "place", "start_time", "type"
                ],
                "full": [
                    "attending_count", "can_guests_invite", "can_viewer_post", "category", "cover", "declined_count", "description", "end_time", "id", "interested_count", "is_cancelled", "is_draft", "is_page_owned", "is_viewer_admin", "maybe_count", "name", "noreply_count", "owner", "parent_group", "place", "start_time", "ticket_uri", "timezone", "type", "updated_time"
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
                    "category", "contact_address", "cover", "description", "fan_count", "featured_video", "founded", "id", "location", "name", "talking_about_count", "website"
                ],
                "full": [
                    "about", "app_links", "best_page", "can_checkin", "category", "category_list", "contact_address", "cover", "description", "display_subtext", "emails", "fan_count", "featured_video", "founded", "general_info", "id", "impressum", "is_community_page", "is_verified", "link", "location", "name", "overall_star_rating", "parent_page", "phone", "rating_count", "start_info", "supports_instant_articles", "talking_about_count", "website", "were_here_count"
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
                    "about", "category", "category_list", "cover", "checkins", "description", "hours", "id", "is_always_open", "is_permanently_closed", "is_verified", "link", "location", "name", "overall_star_rating", "parking", "payment_options", "phone", "photos", "picture", "price_range", "rating_count", "restaurant_services", "restaurant_specialties", "single_line_address", "website", "workflows"
                ]
            }
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
        }
    };
    
    return dict;
});