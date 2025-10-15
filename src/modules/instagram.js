(function(hello) { 

 

hello.init({ 

 

instagram: { 

 

name: 'Instagram', 

 

oauth: { 

// Instagram Basic Display API 

// See: https://developers.facebook.com/docs/instagram-basic-display-api 

version: 2, 

auth: 'https://www.instagram.com/oauth/authorize/', 

grant: 'https://api.instagram.com/oauth/access_token' 

}, 

 

// Refresh the access_token once expired 

refresh: true, 

 

scope: { 

// Basic Display API scopes 

basic: 'user_profile', 

photos: 'user_media', 

// Deprecated/unsupported scopes 

friends: '', 

publish: '', 

email: '', 

share: '', 

publish_files: '', 

files: '', 

videos: '', 

offline_access: '' 

}, 

 

scope_delim: ',', 

 

// Instagram Basic Display API base URL 

base: 'https://graph.instagram.com/', 

 

get: { 

// Get user profile 

me: 'me?fields=id,username,account_type,media_count', 

 

// Get user's media 

'me/photos': 'me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&limit=@{limit|25}', 

 

// Note: Basic Display API doesn't support friends/followers endpoints 

// These are kept for backwards compatibility but will not work 

'me/friends': function() { 

return false; 

}, 

'me/following': function() { 

return false; 

}, 

'me/followers': function() { 

return false; 

} 

}, 

 

// Basic Display API is read-only, no POST/DELETE operations 

// Removed post and del objects 

 

wrap: { 

me: function(o) { 

 

formatError(o); 

 

if (o && !o.error) { 

// Basic Display API returns data directly, not wrapped in 'data' 

o.id = o.id; 

o.name = o.username; 

// Basic Display API doesn't provide profile_picture in /me endpoint 

// Would need separate call to get profile picture 

o.thumbnail = null; 

} 

 

return o; 

}, 

 

'me/photos': function(o) { 

 

formatError(o); 

paging(o); 

 

if ('data' in o) { 

o.data = o.data.filter(function(d) { 

// Filter for images and videos (carousel albums contain both) 

return d.media_type === 'IMAGE' || d.media_type === 'VIDEO' || d.media_type === 'CAROUSEL_ALBUM'; 

}); 

 

o.data.forEach(function(d) { 

// Map new API fields to old structure for compatibility 

d.name = d.caption || null; 

d.thumbnail = d.thumbnail_url || d.media_url; 

d.picture = d.media_url; 

d.source = d.media_url; 

d.type = d.media_type.toLowerCase(); 

d.created_time = d.timestamp; 

}); 

} 

 

return o; 

}, 

 

'default': function(o) { 

o = formatError(o); 

paging(o); 

return o; 

} 

}, 

 

// Instagram Basic Display API supports CORS 

xhr: false, 

 

// No form 

form: false 

} 

}); 

 

function formatError(o) { 

if (typeof o === 'string') { 

return { 

error: { 

code: 'invalid_request', 

message: o 

} 

}; 

} 

 

// Basic Display API error format 

if (o && o.error) { 

if (typeof o.error === 'object') { 

// Error is already in correct format 

return o; 

} else { 

// Convert error to standard format 

o.error = { 

code: o.error_type || 'request_failed', 

message: o.error_message || o.error 

}; 

} 

} 

 

return o; 

} 

 

// Basic Display API uses cursor-based pagination 

function paging(res) { 

if (res && res.paging) { 

// API already provides paging object with next/previous URLs 

if (res.paging.next) { 

// Extract just the path and query from the full URL 

var next = res.paging.next; 

// Keep the full URL as-is since it's an absolute URL from Graph API 

res.paging = { 

next: next 

}; 

} 

} 

} 

 

})(hello); 